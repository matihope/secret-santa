import { partyContext, publicMember, publicParty } from '#lib/server/guards.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => {
	const { party, me, access, canAdmin, siteAdmin } = partyContext(event);
	return {
		party: access
			? publicParty(party)
			: {
					...publicParty(party),
					description: '',
					location: '',
					partyAt: null,
					drawAt: null,
					drawnAt: null,
					drawError: null
				},
		code: me || canAdmin ? party.code : null,
		me: me ? publicMember(me) : null,
		access,
		canAdmin,
		siteAdmin
	};
};
