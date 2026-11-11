import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { isRateLimited, loginMember, recordFailure, verifySecret } from '#lib/server/auth.ts';
import { requireAccess, publicMember } from '#lib/server/guards.ts';
import { getMembers } from '#lib/server/party.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { party, me } = requireAccess(event);
	if (me) redirect(303, `/p/${party.id}/me`);
	return { members: getMembers(party.id).map(publicMember) };
};

export const actions: Actions = {
	default: async (event) => {
		const { party } = requireAccess(event);
		if (isRateLimited(event, 'login')) return fail(429, { error: 'rate_limited' });
		const data = await event.request.formData();
		const memberId = String(data.get('memberId') ?? '');
		const member = db
			.select()
			.from(schema.members)
			.where(and(eq(schema.members.id, memberId), eq(schema.members.partyId, party.id)))
			.get();
		if (!member) return fail(400, { error: 'pick_member' });
		if (member.passcodeHash) {
			const ok = await verifySecret(member.passcodeHash, String(data.get('passcode') ?? ''));
			if (!ok) {
				recordFailure(event, 'login');
				return fail(400, { error: 'wrong_passcode', memberId });
			}
		}
		loginMember(event.cookies, member);
		redirect(303, `/p/${party.id}`);
	}
};
