import { fail, redirect } from '@sveltejs/kit';
import { grantCodeAccess, isRateLimited, logoutMember, recordFailure } from '#lib/server/auth.ts';
import { getAssignment, getMembers, getParty, getRules } from '#lib/server/party.ts';
import { formString, partyContext, publicMember } from '#lib/server/guards.ts';
import { normalizeCode } from '#lib/server/ids.ts';
import { subscribedEndpoints } from '#lib/server/push.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { party, me, access } = partyContext(event);
	if (!access) return { rules: [], members: [], assignment: null };
	const receiver = me && party.drawnAt ? getAssignment(party.id, me.id) : null;
	return {
		rules: getRules(party.id),
		members: getMembers(party.id).map(publicMember),
		assignment: receiver ? { ...publicMember(receiver), wishlist: receiver.wishlist } : null,
		created: event.url.searchParams.has('created'),
		pushOn: me ? subscribedEndpoints(me.id).length > 0 : false
	};
};

export const actions: Actions = {
	code: async (event) => {
		if (isRateLimited(event, 'code')) return fail(429, { error: 'rate_limited' });
		const party = getParty(event.params.id);
		if (!party) return fail(404, { error: 'not_found' });
		const code = formString(await event.request.formData(), 'code', 64);
		if (normalizeCode(code) !== party.codeNorm) {
			recordFailure(event, 'code');
			return fail(400, { error: 'code_invalid' });
		}
		grantCodeAccess(event.cookies, party);
		redirect(303, `/p/${party.id}`);
	},
	logout: ({ cookies, params }) => {
		logoutMember(cookies, params.id);
		redirect(303, `/p/${params.id}`);
	}
};
