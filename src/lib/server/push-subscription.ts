// Validation of browser push subscriptions (pure; no database).

export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Extra `host:port` endpoints for local testing only (PUSH_TEST_HOSTS, comma separated). */
const testHosts = () =>
	(process.env.PUSH_TEST_HOSTS ?? '')
		.split(',')
		.map((h) => h.trim())
		.filter(Boolean);

/**
 * Push services we are willing to POST to. The endpoint comes from the browser, so without this
 * list a member could make the server send requests to arbitrary (internal) hosts.
 */
const PUSH_HOSTS = [
	'fcm.googleapis.com', // Chrome, Edge on Android, most Chromium browsers
	'push.apple.com', // Safari / iOS home-screen apps (web.push.apple.com)
	'push.services.mozilla.com', // Firefox
	'notify.windows.com' // Edge on Windows (*.notify.windows.com)
];

export function isAllowedEndpoint(endpoint: string): boolean {
	let url: URL;
	try {
		url = new URL(endpoint);
	} catch {
		return false;
	}
	if (url.protocol !== 'https:' || url.username || url.password) return false;
	if (testHosts().includes(url.host)) return true;
	if (url.port) return false;
	return PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

export function parseSubscription(body: unknown): SubscriptionInput | null {
	if (!body || typeof body !== 'object') return null;
	const { endpoint, keys } = body as Record<string, unknown>;
	if (typeof endpoint !== 'string' || endpoint.length > 1000 || !isAllowedEndpoint(endpoint))
		return null;
	if (!keys || typeof keys !== 'object') return null;
	const { p256dh, auth } = keys as Record<string, unknown>;
	const ok = (v: unknown, max: number) =>
		typeof v === 'string' && v.length > 0 && v.length <= max && /^[A-Za-z0-9_-]+=*$/.test(v);
	if (!ok(p256dh, 200) || !ok(auth, 100)) return null;
	return { endpoint, keys: { p256dh: p256dh as string, auth: auth as string } };
}
