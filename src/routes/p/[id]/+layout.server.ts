import { partyContext, publicMember, publicParty } from '#lib/server/guards.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => {
	const { party, me, access, insider, canAdmin, siteAdmin } = partyContext(event);
	return {
		// Outsiders and code-only guests get the name (plus, for guests, whether the draw is done
		// / the party archived, to pick the join or login button) — nothing else.
		party: insider
			? publicParty(party)
			: {
					...publicParty(party),
					description: '',
					location: '',
					partyAt: null,
					drawAt: null,
					drawnAt: access ? party.drawnAt : null,
					archivedAt: access ? party.archivedAt : null,
					drawError: null
				},
		code: me || canAdmin ? party.code : null,
		me: me ? publicMember(me) : null,
		access,
		insider,
		canAdmin,
		siteAdmin
	};
};
