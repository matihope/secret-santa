// What we notify about, and when. Delivery lives in push.ts.
// Notification texts are shown on lock screens: never name who drew whom.
import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm';
import { TIMEZONE } from '$app/env/public';
import { m } from '#lib/paraglide/messages.js';
import { locales, baseLocale, type Locale } from '#lib/paraglide/runtime.js';
import { formatDateTime } from '#lib/time.ts';
import { db, schema } from './db/index.ts';
import { notifyMembers } from './push.ts';

const HOUR = 3600_000;
/** Wishlist edits are batched: the giver hears about it once nothing changed for this long. */
export const WISHLIST_SETTLE_MS = 2 * 60_000;

export const asLocale = (l: string): Locale =>
	(locales as readonly string[]).includes(l) ? (l as Locale) : baseLocale;
const partyUrl = (id: string) => `/p/${id}`;

function participants(partyId: string) {
	return db
		.select({ id: schema.members.id, wishlist: schema.members.wishlist })
		.from(schema.members)
		.where(and(eq(schema.members.partyId, partyId), eq(schema.members.participates, true)))
		.all();
}

/** After a successful draw: everyone can unwrap their person. */
export function notifyDrawn(partyId: string) {
	const party = db.select().from(schema.parties).where(eq(schema.parties.id, partyId)).get();
	if (!party) return;
	const ids = participants(partyId).map((p) => p.id);
	void notifyMembers(ids, (l) => {
		const locale = asLocale(l);
		return {
			title: m.push_drawn_title({ name: party.name }, { locale }),
			body: m.push_drawn_body({}, { locale }),
			url: partyUrl(partyId),
			tag: `drawn-${partyId}`
		};
	});
}

/** Records that a member's wishlist changed (only matters once someone has drawn them). */
export function wishlistChanged(party: { drawnAt: Date | null }, before: string, after: string) {
	return party.drawnAt && before !== after ? new Date() : undefined;
}

/** Scheduler tick: reminders ~24 h before the draw / party, and settled wishlist changes. */
export async function sendDueNotifications(now = new Date()) {
	const live = db.select().from(schema.parties).where(isNull(schema.parties.archivedAt)).all();

	for (const party of live) {
		const inWindow = (at: Date | null) =>
			!!at && now.getTime() >= at.getTime() - 24 * HOUR && now.getTime() < at.getTime() - HOUR;

		if (
			!party.drawnAt &&
			party.drawAt &&
			inWindow(party.drawAt) &&
			party.drawReminderFor?.getTime() !== party.drawAt.getTime()
		) {
			db.update(schema.parties)
				.set({ drawReminderFor: party.drawAt })
				.where(eq(schema.parties.id, party.id))
				.run();
			const people = new Map(participants(party.id).map((p) => [p.id, p.wishlist]));
			await notifyMembers([...people.keys()], (l, memberId) => {
				const locale = asLocale(l);
				const when = formatDateTime(party.drawAt, locale, TIMEZONE);
				return {
					title: m.push_draw_soon_title({ name: party.name }, { locale }),
					body: people.get(memberId)?.trim()
						? m.push_draw_soon_body({ when }, { locale })
						: m.push_draw_soon_empty({ when }, { locale }),
					url: `${partyUrl(party.id)}/me`,
					tag: `draw-soon-${party.id}`
				};
			});
		}

		if (
			party.drawnAt &&
			party.partyAt &&
			inWindow(party.partyAt) &&
			party.partyReminderFor?.getTime() !== party.partyAt.getTime()
		) {
			db.update(schema.parties)
				.set({ partyReminderFor: party.partyAt })
				.where(eq(schema.parties.id, party.id))
				.run();
			await notifyMembers(
				participants(party.id).map((p) => p.id),
				(l) => {
					const locale = asLocale(l);
					return {
						title: m.push_party_soon_title({ name: party.name }, { locale }),
						body: m.push_party_soon_body(
							{ when: formatDateTime(party.partyAt, locale, TIMEZONE) },
							{ locale }
						),
						url: partyUrl(party.id),
						tag: `party-soon-${party.id}`
					};
				}
			);
		}
	}

	// wishlist changes that have settled → tell whoever drew that person
	const changed = db
		.select({
			memberId: schema.members.id,
			partyId: schema.members.partyId,
			giverId: schema.assignments.giverId,
			archivedAt: schema.parties.archivedAt
		})
		.from(schema.members)
		.innerJoin(schema.parties, eq(schema.parties.id, schema.members.partyId))
		.leftJoin(
			schema.assignments,
			and(
				eq(schema.assignments.partyId, schema.members.partyId),
				eq(schema.assignments.receiverId, schema.members.id)
			)
		)
		.where(
			and(
				isNotNull(schema.members.wishlistChangedAt),
				lte(schema.members.wishlistChangedAt, new Date(now.getTime() - WISHLIST_SETTLE_MS))
			)
		)
		.all();
	for (const c of changed) {
		db.update(schema.members)
			.set({ wishlistChangedAt: null })
			.where(eq(schema.members.id, c.memberId))
			.run();
		if (!c.giverId || c.archivedAt) continue;
		await notifyMembers([c.giverId], (l) => {
			const locale = asLocale(l);
			return {
				title: m.push_wishlist_title({}, { locale }),
				body: m.push_wishlist_body({}, { locale }),
				url: partyUrl(c.partyId),
				tag: `wishlist-${c.partyId}`
			};
		});
	}
}
