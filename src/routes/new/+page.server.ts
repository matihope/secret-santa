import { fail, redirect } from '@sveltejs/kit';
import { TIMEZONE } from '$app/env/public';
import { db, schema } from '#lib/server/db/index.ts';
import { grantCodeAccess, hashSecret, loginMember } from '#lib/server/auth.ts';
import { cleanCustomCode, generatePartyCode, newId, normalizeCode } from '#lib/server/ids.ts';
import { codeTaken, replaceRules } from '#lib/server/party.ts';
import { formString } from '#lib/server/guards.ts';
import { createMember, readNames, validateNames, validatePasscode } from '#lib/server/members.ts';
import { sanitizeRules, type RuleEntry } from '#lib/rules/catalog.ts';
import { fromInputValue } from '#lib/time.ts';
import { CURRENCIES } from '#lib/currencies.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const err = (step: number, error: string) => fail(400, { step, error });

		const name = formString(data, 'name', 120);
		if (!name) return err(0, 'party_name_required');
		const drawAt = fromInputValue(formString(data, 'drawAt', 16), TIMEZONE);
		if (!drawAt) return err(0, 'draw_required');
		if (drawAt <= new Date()) return err(0, 'draw_in_past');
		const partyAt = fromInputValue(formString(data, 'partyAt', 16), TIMEZONE);

		let code: string;
		if (data.get('codeMode') === 'custom') {
			const cleaned = cleanCustomCode(formString(data, 'code', 64));
			if (!cleaned) return err(0, 'code_format');
			if (codeTaken(cleaned)) return err(0, 'code_taken');
			code = cleaned;
		} else {
			do code = generatePartyCode();
			while (codeTaken(code));
		}

		const currencyRaw = formString(data, 'currency', 3).toUpperCase();
		const currency = CURRENCIES.includes(currencyRaw) ? currencyRaw : 'PLN';

		let rules: RuleEntry[];
		try {
			rules = sanitizeRules(JSON.parse(String(data.get('rules') ?? '[]')));
		} catch {
			rules = [];
		}

		const names = readNames(data);
		if (!names.nickname && !names.firstName) return err(3, 'name_required');
		const password = String(data.get('password') ?? '');
		const passErr = validatePasscode(password, String(data.get('password2') ?? ''), true);
		if (passErr)
			return err(3, passErr === 'passcode_required' ? 'admin_password_required' : passErr);

		const partyId = newId();
		db.insert(schema.parties)
			.values({
				id: partyId,
				code,
				codeNorm: normalizeCode(code),
				name,
				description: formString(data, 'description', 2000),
				location: formString(data, 'location', 300),
				isPublic: data.get('isPublic') === 'on',
				partyAt,
				drawAt,
				currency
			})
			.run();
		replaceRules(partyId, rules);

		const nameErr = validateNames(names, partyId);
		if (nameErr) return err(3, nameErr);
		const admin = createMember(partyId, {
			...names,
			passcodeHash: await hashSecret(password),
			isAdmin: true,
			participates: data.get('participates') === 'on'
		});

		grantCodeAccess(cookies, { id: partyId, codeNorm: normalizeCode(code) });
		loginMember(cookies, admin);
		redirect(303, `/p/${partyId}?created`);
	}
};
