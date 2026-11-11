import { afterEach, describe, expect, it } from 'vitest';
import { isAllowedEndpoint, parseSubscription } from './push-subscription.ts';

const keys = {
	p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
	auth: 'tBHItJI5svbpez7KI4CCXg'
};

describe('push subscriptions', () => {
	afterEach(() => {
		delete process.env.PUSH_TEST_HOSTS;
	});

	it('accepts real push services', () => {
		expect(isAllowedEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
		expect(isAllowedEndpoint('https://web.push.apple.com/QGx')).toBe(true);
		expect(isAllowedEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
		expect(isAllowedEndpoint('https://db5p.notify.windows.com/w/?token=x')).toBe(true);
	});

	it('rejects anything else (SSRF guard)', () => {
		for (const url of [
			'http://fcm.googleapis.com/fcm/send/abc',
			'https://fcm.googleapis.com:8443/x',
			'https://evilpush.apple.com.attacker.net/x',
			'https://notpush.apple.com/x',
			'https://user:pw@fcm.googleapis.com/x',
			'https://localhost/x',
			'https://10.0.0.1/x',
			'not a url'
		]) {
			expect(isAllowedEndpoint(url), url).toBe(false);
		}
	});

	it('allows extra hosts only when configured for tests', () => {
		expect(isAllowedEndpoint('https://localhost:9443/x')).toBe(false);
		process.env.PUSH_TEST_HOSTS = 'localhost:9443';
		expect(isAllowedEndpoint('https://localhost:9443/x')).toBe(true);
	});

	it('parses a browser subscription and rejects junk', () => {
		const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', expirationTime: null, keys };
		expect(parseSubscription(sub)).toEqual({ endpoint: sub.endpoint, keys });
		expect(parseSubscription({ ...sub, keys: { p256dh: 'x y', auth: 'a' } })).toBeNull();
		expect(parseSubscription({ endpoint: sub.endpoint })).toBeNull();
		expect(parseSubscription('nope')).toBeNull();
	});
});
