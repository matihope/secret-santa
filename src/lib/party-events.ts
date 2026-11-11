import { m } from '#lib/paraglide/messages.js';
import type { CalendarEvent } from './calendar.ts';

type PartyLike = {
	id: string;
	name: string;
	description: string;
	location: string;
	drawAt: Date | null;
	drawnAt: Date | null;
	partyAt: Date | null;
};

const MIN = 60_000;

/** Calendar events for a party: the draw (until it happened) and the party itself. */
export function partyEvents(
	party: PartyLike,
	origin: string
): { draw?: CalendarEvent; party?: CalendarEvent } {
	const url = `${origin}/p/${party.id}`;
	const out: { draw?: CalendarEvent; party?: CalendarEvent } = {};
	if (party.drawAt && !party.drawnAt) {
		out.draw = {
			uid: `draw-${party.id}@secret-santa`,
			title: m.cal_draw_title({ name: party.name }),
			start: party.drawAt,
			end: new Date(party.drawAt.getTime() + 15 * MIN),
			description: m.cal_draw_desc(),
			url,
			alarms: [0]
		};
	}
	if (party.partyAt) {
		out.party = {
			uid: `party-${party.id}@secret-santa`,
			title: m.cal_party_title({ name: party.name }),
			start: party.partyAt,
			end: new Date(party.partyAt.getTime() + 180 * MIN),
			description: [party.description, m.cal_party_desc()].filter(Boolean).join('\n\n'),
			location: party.location || undefined,
			url,
			alarms: [24 * 60, 120]
		};
	}
	return out;
}
