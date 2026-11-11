import { fail, redirect } from '@sveltejs/kit';
import { desc, sql } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import {
	checkSiteAdminPassword,
	isRateLimited,
	isSiteAdmin,
	loginSiteAdmin,
	logoutSiteAdmin,
	recordFailure,
	siteAdminEnabled
} from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	if (!isSiteAdmin(cookies)) return { loggedIn: false, enabled: siteAdminEnabled(), parties: [] };
	const counts = new Map(
		db
			.select({ partyId: schema.members.partyId, n: sql<number>`count(*)` })
			.from(schema.members)
			.groupBy(schema.members.partyId)
			.all()
			.map((r) => [r.partyId, r.n])
	);
	const parties = db
		.select()
		.from(schema.parties)
		.orderBy(desc(schema.parties.createdAt))
		.all()
		.map((p) => ({
			id: p.id,
			name: p.name,
			code: p.code,
			isPublic: p.isPublic,
			partyAt: p.partyAt,
			drawAt: p.drawAt,
			drawnAt: p.drawnAt,
			drawError: p.drawError,
			archived: !!p.archivedAt,
			createdAt: p.createdAt,
			members: counts.get(p.id) ?? 0
		}));
	return { loggedIn: true, enabled: true, parties };
};

export const actions: Actions = {
	login: async (event) => {
		if (isRateLimited(event, 'admin')) return fail(429, { error: 'rate_limited' });
		const password = String((await event.request.formData()).get('password') ?? '');
		if (!checkSiteAdminPassword(password)) {
			recordFailure(event, 'admin');
			return fail(400, { error: 'wrong_password' });
		}
		loginSiteAdmin(event.cookies);
		redirect(303, '/admin');
	},
	logout: ({ cookies }) => {
		logoutSiteAdmin(cookies);
		redirect(303, '/');
	}
};
