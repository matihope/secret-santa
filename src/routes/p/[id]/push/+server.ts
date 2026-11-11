import { error, json } from '@sveltejs/kit';
import { getLocale } from '#lib/paraglide/runtime.js';
import { m } from '#lib/paraglide/messages.js';
import { partyContext } from '#lib/server/guards.ts';
import { asLocale } from '#lib/server/notifications.ts';
import { isRateLimited, recordFailure } from '#lib/server/auth.ts';
import {
	deleteSubscription,
	notifyMembers,
	parseSubscription,
	saveSubscription
} from '#lib/server/push.ts';
import type { RequestHandler } from './$types';

// JSON bodies only: a cross-site form can't send application/json without a CORS preflight.
async function readJson(request: Request) {
	if (!request.headers.get('content-type')?.startsWith('application/json')) error(415);
	try {
		return await request.json();
	} catch {
		error(400, 'invalid');
	}
}

function member(event: Parameters<RequestHandler>[0]) {
	const { me, party } = partyContext(event);
	if (!me) error(401, 'forbidden');
	return { me, party };
}

/** Subscribe this device, or `?test` to send a test notification to this member's devices. */
export const POST: RequestHandler = async (event) => {
	const { me, party } = member(event);
	if (event.url.searchParams.has('test')) {
		if (isRateLimited(event, 'push-test')) error(429, 'rate_limited');
		recordFailure(event, 'push-test'); // counts tests, keeps them from being spammed
		const sent = await notifyMembers([me.id], (locale) => ({
			title: m.push_test_title({}, { locale: asLocale(locale) }),
			body: m.push_test_body({ name: party.name }, { locale: asLocale(locale) }),
			url: `/p/${party.id}/me`,
			tag: 'test'
		}));
		return json({ sent });
	}
	const sub = parseSubscription(await readJson(event.request));
	if (!sub) error(400, 'invalid');
	saveSubscription(me.id, sub, getLocale());
	return json({ ok: true });
};

export const DELETE: RequestHandler = async (event) => {
	const { me } = member(event);
	const body = await readJson(event.request);
	if (typeof body?.endpoint !== 'string') error(400, 'invalid');
	deleteSubscription(me.id, body.endpoint);
	return json({ ok: true });
};
