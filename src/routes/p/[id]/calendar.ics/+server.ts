import { error } from '@sveltejs/kit';
import { buildIcs } from '#lib/calendar.ts';
import { partyEvents } from '#lib/party-events.ts';
import { partyContext } from '#lib/server/guards.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = (event) => {
	const { party, insider } = partyContext(event);
	if (!insider) error(403, 'forbidden');
	const { draw, party: main } = partyEvents(party, event.url.origin);
	const events = [draw, main].filter((e) => !!e);
	if (!events.length) error(404, 'not_found');
	return new Response(buildIcs(events), {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="secret-santa-${party.id}.ics"`,
			'cache-control': 'private, no-store'
		}
	});
};
