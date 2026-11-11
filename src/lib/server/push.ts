// Web Push: VAPID keys, subscriptions and delivery.
import { generateVAPIDKeys, sendNotification, WebPushError } from 'web-push';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from './db/index.ts';
import { newId } from './ids.ts';
import type { SubscriptionInput } from './push-subscription.ts';

export { parseSubscription } from './push-subscription.ts';

export type PushPayload = { title: string; body: string; url: string; tag?: string };

const MAX_SUBSCRIPTIONS_PER_MEMBER = 10;

/* ---------- VAPID keys (generated once, stored in settings) ---------- */

let vapid: { publicKey: string; privateKey: string } | undefined;

function getSetting(key: string) {
	return db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()?.value;
}

function vapidKeys() {
	if (vapid) return vapid;
	let publicKey = getSetting('vapid_public');
	let privateKey = getSetting('vapid_private');
	if (!publicKey || !privateKey) {
		const keys = generateVAPIDKeys();
		db.transaction((tx) => {
			for (const [key, value] of [
				['vapid_public', keys.publicKey],
				['vapid_private', keys.privateKey]
			]) {
				tx.insert(schema.settings).values({ key, value }).onConflictDoNothing().run();
			}
		});
		publicKey = getSetting('vapid_public')!;
		privateKey = getSetting('vapid_private')!;
	}
	return (vapid = { publicKey, privateKey });
}

export const vapidPublicKey = () => vapidKeys().publicKey;

/** Push services (Apple especially) require a contact: an https URL or a mailto: address. */
function vapidSubject() {
	const origin = process.env.PUSH_SUBJECT || process.env.ORIGIN;
	return origin && /^(https:|mailto:)/.test(origin) ? origin : 'mailto:secret-santa@example.com';
}

/* ---------- subscriptions ---------- */

export function saveSubscription(memberId: string, sub: SubscriptionInput, locale: string) {
	db.transaction((tx) => {
		tx.delete(schema.pushSubscriptions)
			.where(
				and(
					eq(schema.pushSubscriptions.memberId, memberId),
					eq(schema.pushSubscriptions.endpoint, sub.endpoint)
				)
			)
			.run();
		tx.insert(schema.pushSubscriptions)
			.values({
				id: newId(),
				memberId,
				endpoint: sub.endpoint,
				p256dh: sub.keys.p256dh,
				auth: sub.keys.auth,
				locale
			})
			.run();
		// keep the newest few devices per member
		const rows = tx
			.select({ id: schema.pushSubscriptions.id, createdAt: schema.pushSubscriptions.createdAt })
			.from(schema.pushSubscriptions)
			.where(eq(schema.pushSubscriptions.memberId, memberId))
			.all()
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		const stale = rows.slice(MAX_SUBSCRIPTIONS_PER_MEMBER).map((r) => r.id);
		if (stale.length)
			tx.delete(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.id, stale)).run();
	});
}

export function deleteSubscription(memberId: string, endpoint: string) {
	db.delete(schema.pushSubscriptions)
		.where(
			and(
				eq(schema.pushSubscriptions.memberId, memberId),
				eq(schema.pushSubscriptions.endpoint, endpoint)
			)
		)
		.run();
}

export function subscribedEndpoints(memberId: string): string[] {
	return db
		.select({ endpoint: schema.pushSubscriptions.endpoint })
		.from(schema.pushSubscriptions)
		.where(eq(schema.pushSubscriptions.memberId, memberId))
		.all()
		.map((r) => r.endpoint);
}

/* ---------- delivery ---------- */

/**
 * Sends a notification to every device of the given members. `build` gets the locale the device
 * subscribed with (and the member id) so the text can be personal and translated.
 * Never throws; expired subscriptions are removed.
 */
export async function notifyMembers(
	memberIds: string[],
	build: (locale: string, memberId: string) => PushPayload | null,
	ttlSeconds = 24 * 3600
): Promise<number> {
	if (!memberIds.length) return 0;
	const subs = db
		.select()
		.from(schema.pushSubscriptions)
		.where(inArray(schema.pushSubscriptions.memberId, memberIds))
		.all();
	if (!subs.length) return 0;
	const keys = vapidKeys();
	let sent = 0;
	await Promise.all(
		subs.map(async (s) => {
			const payload = build(s.locale, s.memberId);
			if (!payload) return;
			try {
				await sendNotification(
					{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
					JSON.stringify(payload),
					{
						TTL: ttlSeconds,
						urgency: 'high',
						vapidDetails: { subject: vapidSubject(), ...keys },
						timeout: 10_000
					}
				);
				sent++;
			} catch (e) {
				const status = e instanceof WebPushError ? e.statusCode : 0;
				if (status === 404 || status === 410) {
					db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id)).run();
				} else {
					console.error(`[push] ${new URL(s.endpoint).hostname} failed (${status || e})`);
				}
			}
		})
	);
	return sent;
}
