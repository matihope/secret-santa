import { fail, redirect } from '@sveltejs/kit';
import { hashSecret, loginMember } from '#lib/server/auth.ts';
import { requireAccess } from '#lib/server/guards.ts';
import { createMember, readNames, validateNames, validatePasscode } from '#lib/server/members.ts';
import { touchDraw } from '#lib/server/party.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { party, me } = requireAccess(event);
	if (me) redirect(303, `/p/${party.id}/me`);
	return { closed: !!party.drawnAt || !!party.archivedAt };
};

export const actions: Actions = {
	default: async (event) => {
		const { party, me } = requireAccess(event);
		if (me) redirect(303, `/p/${party.id}/me`);
		if (party.drawnAt || party.archivedAt)
			return fail(400, { error: 'join_closed', firstName: '', lastName: '', nickname: '' });
		const data = await event.request.formData();
		const names = readNames(data);
		const nameErr = validateNames(names, party.id);
		if (nameErr) return fail(400, { error: nameErr, ...names });
		const passcode = String(data.get('passcode') ?? '');
		const passErr = validatePasscode(passcode, String(data.get('passcode2') ?? ''), false);
		if (passErr) return fail(400, { error: passErr, ...names });

		const member = createMember(party.id, {
			...names,
			passcodeHash: passcode ? await hashSecret(passcode) : null
		});
		touchDraw(party.id);
		loginMember(event.cookies, member);
		redirect(303, `/p/${party.id}/me?welcome`);
	}
};
