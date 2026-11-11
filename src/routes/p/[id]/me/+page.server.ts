import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { hashSecret, verifySecret } from '#lib/server/auth.ts';
import { formString, publicMember, requireMember } from '#lib/server/guards.ts';
import {
	activeExclusionsFor,
	clearAvatar,
	readNames,
	saveAvatar,
	validateNames,
	validatePasscode
} from '#lib/server/members.ts';
import { getExclusions, getMembers, touchDraw } from '#lib/server/party.ts';
import { newId } from '#lib/server/ids.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { party, me } = requireMember(event);
	const members = getMembers(party.id);
	const byId = new Map(members.map((x) => [x.id, publicMember(x)]));
	const exclusions = getExclusions(party.id)
		.filter((e) => e.status !== 'declined' && (e.requesterId === me.id || e.targetId === me.id))
		.map((e) => ({
			id: e.id,
			status: e.status,
			mine: e.requesterId === me.id,
			other: byId.get(e.requesterId === me.id ? e.targetId : e.requesterId)!
		}));
	const busyIds = new Set(
		activeExclusionsFor(
			party.id,
			members.map((x) => x.id)
		).flatMap((e) => [e.requesterId, e.targetId])
	);
	return {
		wishlist: me.wishlist,
		exclusions,
		candidates: members.filter((x) => x.id !== me.id && !busyIds.has(x.id)).map(publicMember),
		others: members.length - 1,
		locked: !!party.drawnAt || !!party.archivedAt,
		welcome: event.url.searchParams.has('welcome')
	};
};

const ok = (section: string) => ({ ok: section });

export const actions: Actions = {
	profile: async (event) => {
		const { party, me } = requireMember(event);
		if (party.archivedAt) return fail(400, { section: 'profile', error: 'archived' });
		const data = await event.request.formData();
		const names = readNames(data);
		const err = validateNames(names, party.id, me.id);
		if (err) return fail(400, { section: 'profile', error: err });
		db.update(schema.members)
			.set({ ...names, wishlist: formString(data, 'wishlist', 4000) })
			.where(eq(schema.members.id, me.id))
			.run();
		return ok('profile');
	},
	avatar: async (event) => {
		const { me } = requireMember(event);
		const err = await saveAvatar(me.id, (await event.request.formData()).get('avatar'));
		if (err) return fail(400, { section: 'avatar', error: err });
		return ok('avatar');
	},
	removeAvatar: (event) => {
		const { me } = requireMember(event);
		clearAvatar(me.id);
		return ok('avatar');
	},
	passcode: async (event) => {
		const { me } = requireMember(event);
		const data = await event.request.formData();
		if (
			me.passcodeHash &&
			!(await verifySecret(me.passcodeHash, String(data.get('current') ?? '')))
		)
			return fail(400, { section: 'passcode', error: 'wrong_passcode' });
		const remove = data.get('remove') === '1';
		if (remove) {
			if (me.isAdmin) return fail(400, { section: 'passcode', error: 'admin_password_required' });
			db.update(schema.members)
				.set({ passcodeHash: null })
				.where(eq(schema.members.id, me.id))
				.run();
			return ok('passcode');
		}
		const pass = String(data.get('passcode') ?? '');
		const err = validatePasscode(pass, String(data.get('passcode2') ?? ''), true);
		if (err) return fail(400, { section: 'passcode', error: err });
		db.update(schema.members)
			.set({ passcodeHash: await hashSecret(pass) })
			.where(eq(schema.members.id, me.id))
			.run();
		return ok('passcode');
	},
	participates: async (event) => {
		const { party, me } = requireMember(event);
		if (!me.isAdmin) return fail(403, { section: 'participates', error: 'forbidden' });
		if (party.drawnAt || party.archivedAt)
			return fail(400, { section: 'participates', error: 'locked' });
		const value = (await event.request.formData()).get('participates') === 'on';
		db.update(schema.members)
			.set({ participates: value })
			.where(eq(schema.members.id, me.id))
			.run();
		touchDraw(party.id);
		return ok('participates');
	},
	exclude: async (event) => {
		const { party, me } = requireMember(event);
		if (party.drawnAt || party.archivedAt)
			return fail(400, { section: 'exclusion', error: 'locked' });
		const targetId = String((await event.request.formData()).get('targetId') ?? '');
		const target = db
			.select()
			.from(schema.members)
			.where(and(eq(schema.members.id, targetId), eq(schema.members.partyId, party.id)))
			.get();
		if (!target || target.id === me.id)
			return fail(400, { section: 'exclusion', error: 'pick_member' });
		if (activeExclusionsFor(party.id, [me.id, target.id]).length)
			return fail(400, { section: 'exclusion', error: 'exclusion_exists' });
		db.insert(schema.exclusions)
			.values({ id: newId(), partyId: party.id, requesterId: me.id, targetId: target.id })
			.run();
		return ok('exclusion');
	},
	respond: async (event) => {
		const { party, me } = requireMember(event);
		if (party.drawnAt || party.archivedAt)
			return fail(400, { section: 'exclusion', error: 'locked' });
		const data = await event.request.formData();
		const accept = data.get('accept') === '1';
		db.update(schema.exclusions)
			.set({ status: accept ? 'accepted' : 'declined' })
			.where(
				and(
					eq(schema.exclusions.id, String(data.get('id') ?? '')),
					eq(schema.exclusions.targetId, me.id),
					eq(schema.exclusions.status, 'pending')
				)
			)
			.run();
		touchDraw(party.id);
		return ok('exclusion');
	},
	withdraw: async (event) => {
		const { party, me } = requireMember(event);
		if (party.drawnAt || party.archivedAt)
			return fail(400, { section: 'exclusion', error: 'locked' });
		const id = String((await event.request.formData()).get('id') ?? '');
		const ex = getExclusions(party.id).find((e) => e.id === id);
		if (ex && (ex.requesterId === me.id || ex.targetId === me.id)) {
			db.delete(schema.exclusions).where(eq(schema.exclusions.id, id)).run();
			touchDraw(party.id);
		}
		return ok('exclusion');
	}
};
