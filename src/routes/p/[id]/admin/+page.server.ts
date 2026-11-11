import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { TIMEZONE } from '$app/env/public';
import { db, schema } from '#lib/server/db/index.ts';
import { hashSecret } from '#lib/server/auth.ts';
import { formString, publicMember, requireAdmin } from '#lib/server/guards.ts';
import { cleanCustomCode, generatePartyCode, newId, normalizeCode } from '#lib/server/ids.ts';
import {
	codeTaken,
	deleteParty,
	getExclusions,
	getMembers,
	getRules,
	replaceRules,
	resetDraw,
	runDraw,
	touchDraw
} from '#lib/server/party.ts';
import {
	activeExclusionsFor,
	createMember,
	readNames,
	validateNames,
	validatePasscode
} from '#lib/server/members.ts';
import { sanitizeRules } from '#lib/rules/catalog.ts';
import { CURRENCIES } from '#lib/currencies.ts';
import { fromInputValue } from '#lib/time.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { party } = requireAdmin(event);
	const members = getMembers(party.id);
	const byId = new Map(members.map((x) => [x.id, publicMember(x)]));
	return {
		admin: { code: party.code, drawError: party.drawError },
		rules: getRules(party.id),
		members: members.map((x) => ({ ...publicMember(x), wishlist: x.wishlist })),
		exclusions: getExclusions(party.id)
			.filter((e) => e.status !== 'declined')
			.map((e) => ({
				id: e.id,
				status: e.status,
				a: byId.get(e.requesterId)!,
				b: byId.get(e.targetId)!
			}))
	};
};

const ok = (section: string) => ({ ok: section });
const bad = (section: string, error: string, status = 400) => fail(status, { section, error });

export const actions: Actions = {
	settings: async (event) => {
		const { party } = requireAdmin(event);
		const data = await event.request.formData();
		const name = formString(data, 'name', 120);
		if (!name) return bad('settings', 'party_name_required');
		const drawAt = fromInputValue(formString(data, 'drawAt', 16), TIMEZONE);
		if (
			!party.drawnAt &&
			drawAt &&
			drawAt <= new Date() &&
			drawAt.getTime() !== party.drawAt?.getTime()
		)
			return bad('settings', 'draw_in_past');
		const currencyRaw = formString(data, 'currency', 3).toUpperCase();
		db.update(schema.parties)
			.set({
				name,
				description: formString(data, 'description', 2000),
				location: formString(data, 'location', 300),
				partyAt: fromInputValue(formString(data, 'partyAt', 16), TIMEZONE),
				drawAt: party.drawnAt ? party.drawAt : drawAt,
				isPublic: data.get('isPublic') === 'on',
				currency: CURRENCIES.includes(currencyRaw) ? currencyRaw : party.currency
			})
			.where(eq(schema.parties.id, party.id))
			.run();
		return ok('settings');
	},
	code: async (event) => {
		const { party } = requireAdmin(event);
		const data = await event.request.formData();
		let code: string;
		if (data.get('regenerate') === '1') {
			do code = generatePartyCode();
			while (codeTaken(code));
		} else {
			const cleaned = cleanCustomCode(formString(data, 'code', 64));
			if (!cleaned) return bad('code', 'code_format');
			if (codeTaken(cleaned, party.id)) return bad('code', 'code_taken');
			code = cleaned;
		}
		db.update(schema.parties)
			.set({ code, codeNorm: normalizeCode(code) })
			.where(eq(schema.parties.id, party.id))
			.run();
		return ok('code');
	},
	rules: async (event) => {
		const { party } = requireAdmin(event);
		let rules;
		try {
			rules = sanitizeRules(
				JSON.parse(String((await event.request.formData()).get('rules') ?? '[]'))
			);
		} catch {
			return bad('rules', 'invalid');
		}
		replaceRules(party.id, rules);
		return ok('rules');
	},
	draw: (event) => {
		const { party } = requireAdmin(event);
		if (party.archivedAt) return bad('draw', 'archived');
		if (party.drawnAt) return bad('draw', 'already_drawn');
		const outcome = runDraw(party.id);
		if (outcome !== 'ok') return bad('draw', `draw_${outcome}`);
		if (!party.drawAt || party.drawAt > new Date())
			db.update(schema.parties)
				.set({ drawAt: new Date() })
				.where(eq(schema.parties.id, party.id))
				.run();
		return ok('draw');
	},
	resetDraw: (event) => {
		const { party } = requireAdmin(event);
		resetDraw(party.id);
		return ok('draw');
	},
	archive: (event) => {
		const { party } = requireAdmin(event);
		db.update(schema.parties)
			.set({ archivedAt: new Date() })
			.where(eq(schema.parties.id, party.id))
			.run();
		return ok('danger');
	},
	unarchive: (event) => {
		const { party } = requireAdmin(event);
		db.update(schema.parties)
			.set({ archivedAt: null })
			.where(eq(schema.parties.id, party.id))
			.run();
		touchDraw(party.id);
		return ok('danger');
	},
	addMember: async (event) => {
		const { party } = requireAdmin(event);
		if (party.drawnAt) return bad('members', 'locked');
		const data = await event.request.formData();
		const names = readNames(data);
		const err = validateNames(names, party.id);
		if (err) return bad('members', err);
		const pass = String(data.get('passcode') ?? '');
		const passErr = validatePasscode(pass, pass, false);
		if (passErr) return bad('members', passErr);
		createMember(party.id, { ...names, passcodeHash: pass ? await hashSecret(pass) : null });
		touchDraw(party.id);
		return ok('members');
	},
	addExclusion: async (event) => {
		const { party } = requireAdmin(event);
		if (party.drawnAt) return bad('exclusions', 'locked');
		const data = await event.request.formData();
		const a = String(data.get('a') ?? '');
		const b = String(data.get('b') ?? '');
		const ids = new Set(getMembers(party.id).map((x) => x.id));
		if (!ids.has(a) || !ids.has(b) || a === b) return bad('exclusions', 'pick_member');
		if (activeExclusionsFor(party.id, [a, b]).length) return bad('exclusions', 'exclusion_exists');
		db.insert(schema.exclusions)
			.values({ id: newId(), partyId: party.id, requesterId: a, targetId: b, status: 'accepted' })
			.run();
		touchDraw(party.id);
		return ok('exclusions');
	},
	removeExclusion: async (event) => {
		const { party } = requireAdmin(event);
		if (party.drawnAt) return bad('exclusions', 'locked');
		const id = String((await event.request.formData()).get('id') ?? '');
		db.delete(schema.exclusions)
			.where(and(eq(schema.exclusions.id, id), eq(schema.exclusions.partyId, party.id)))
			.run();
		touchDraw(party.id);
		return ok('exclusions');
	},
	deleteParty: async (event) => {
		const { party } = requireAdmin(event);
		const confirm = formString(await event.request.formData(), 'confirm', 200);
		if (confirm !== party.name) return bad('danger', 'confirm_name');
		deleteParty(party.id);
		redirect(303, '/');
	}
};
