import { fail, redirect } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { grantCodeAccess, isRateLimited, joinedPartyIds, recordFailure } from '#lib/server/auth.ts';
import { findPartyByCode, partiesByIds } from '#lib/server/party.ts';
import { formString } from '#lib/server/guards.ts';
import type { Actions, PageServerLoad } from './$types';

const summary = (p: typeof schema.parties.$inferSelect) => ({
	id: p.id,
	name: p.name,
	partyAt: p.partyAt,
	drawAt: p.drawAt,
	drawnAt: p.drawnAt,
	archived: !!p.archivedAt,
	location: p.location
});

export const load: PageServerLoad = ({ cookies, url }) => {
	const showArchived = url.searchParams.has('archived');
	const publicParties = db
		.select()
		.from(schema.parties)
		.where(
			showArchived
				? eq(schema.parties.isPublic, true)
				: and(eq(schema.parties.isPublic, true), isNull(schema.parties.archivedAt))
		)
		.orderBy(desc(schema.parties.createdAt))
		.all();
	const joined = partiesByIds(joinedPartyIds(cookies)).filter((p) => showArchived || !p.archivedAt);
	const joinedIds = new Set(joined.map((p) => p.id));
	return {
		showArchived,
		joined: joined.map(summary),
		publicParties: publicParties.filter((p) => !joinedIds.has(p.id)).map(summary)
	};
};

export const actions: Actions = {
	code: async (event) => {
		if (isRateLimited(event, 'code')) return fail(429, { error: 'rate_limited' as const });
		const data = await event.request.formData();
		const code = formString(data, 'code', 64);
		const party = findPartyByCode(code);
		if (!party) {
			recordFailure(event, 'code');
			return fail(400, { error: 'code_invalid' as const, code });
		}
		grantCodeAccess(event.cookies, party);
		redirect(303, `/p/${party.id}`);
	}
};
