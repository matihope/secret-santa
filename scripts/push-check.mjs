// Integration check of web push: a fake push service (decrypts payloads like a browser would)
// and the real app on a preview server. Run via `npm run test:push` (scripts/push-check.sh).
import { chromium } from '@playwright/test';
import { createServer } from 'node:https';
import { createECDH, createHmac, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:4180';
const got = []; // { who, payload, headers }
const devices = {}; // who -> { ecdh, auth }

const hmac = (k, d) => createHmac('sha256', k).update(d).digest();
function decrypt(who, body) {
	const { ecdh, auth } = devices[who];
	const salt = body.subarray(0, 16);
	const idlen = body[20];
	const asPublic = body.subarray(21, 21 + idlen);
	const ct = body.subarray(21 + idlen);
	const shared = ecdh.computeSecret(asPublic);
	const uaPublic = ecdh.getPublicKey();
	const prkKey = hmac(auth, shared);
	const ikm = hmac(
		prkKey,
		Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic, Buffer.from([1])])
	);
	const prk = hmac(salt, ikm);
	const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
	const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
	const d = createDecipheriv('aes-128-gcm', cek, nonce);
	d.setAuthTag(ct.subarray(ct.length - 16));
	const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
	let end = plain.length - 1;
	while (plain[end] === 0) end--; // strip padding, then the 0x02 delimiter
	return JSON.parse(plain.subarray(0, end).toString());
}

createServer(
	{ key: readFileSync('data-push/key.pem'), cert: readFileSync('data-push/cert.pem') },
	(req, res) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			const who = req.url.split('/').pop();
			try {
				const payload = decrypt(who, Buffer.concat(chunks));
				got.push({ who, payload, headers: req.headers });
				console.log(`  push → ${who}: ${payload.title} | ${payload.body} | ${payload.url}`);
			} catch (e) {
				console.log('  !! undecryptable push for', who, e.message);
			}
			res.writeHead(201).end();
		});
	}
).listen(9443);

const waitFor = async (pred, ms, label) => {
	const t0 = Date.now();
	while (!pred()) {
		if (Date.now() - t0 > ms) throw new Error('timeout: ' + label);
		await new Promise((r) => setTimeout(r, 500));
	}
	console.log('✓', label);
};

const wall = (d) => {
	const p = Object.fromEntries(
		new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Europe/Warsaw',
			hourCycle: 'h23',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
			.formatToParts(d)
			.map((x) => [x.type, x.value])
	);
	return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

async function subscribe(page, partyUrl, who) {
	const ecdh = createECDH('prime256v1');
	ecdh.generateKeys();
	const auth = randomBytes(16);
	devices[who] = { ecdh, auth };
	const body = {
		endpoint: `https://localhost:9443/sub/${who}`,
		keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: auth.toString('base64url') }
	};
	const status = await page.evaluate(
		async ([url, body]) =>
			(
				await fetch(url, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(body)
				})
			).status,
		[`${partyUrl}/push`, body]
	);
	if (status !== 200) throw new Error(`subscribe ${who}: ${status}`);
}

const browser = await chromium.launch();
const admin = await (await browser.newContext({ locale: 'en-US' })).newPage();
admin.on('dialog', (d) => d.accept());
await admin.goto(BASE + '/new');
await admin.getByLabel('Party name').fill('Push Party');
await admin.locator('#drawAt').fill(wall(new Date(Date.now() + 5 * 3600_000)));
await admin.locator('#partyAt').fill(wall(new Date(Date.now() + 30 * 24 * 3600_000)));
for (let i = 0; i < 3; i++) await admin.getByRole('button', { name: /Next/ }).click();
await admin.getByLabel('First name').fill('Adam');
await admin.getByLabel('Admin password').fill('secret123');
await admin.getByLabel('Repeat').fill('secret123');
await admin.getByRole('button', { name: /Create a party/ }).click();
await admin.getByText('Party created!').waitFor();
const code = (await admin.locator('.success b').innerText()).trim();
const partyUrl = new URL(admin.url()).pathname;

async function join(first, locale) {
	const page = await (await browser.newContext({ locale })).newPage();
	await page.goto(BASE + partyUrl);
	await page.locator('#code').fill(code);
	await page.locator('#code').press('Enter');
	await page.locator(`a[href="${partyUrl}/join"]`).click();
	await page.locator('#firstName').fill(first);
	await page.locator('form button[type=submit], form button:not([type])').last().click();
	await page.waitForURL(/\/me/);
	return page;
}
const anna = await join('Anna', 'en-US');
const bolek = await join('Bolek', 'pl-PL');

// the party page nudges members to turn notifications on
await anna.goto(BASE + partyUrl);
await anna.getByRole('link', { name: /Get notified when the draw happens/ }).waitFor();
console.log('✓ nudge shown');

await subscribe(admin, partyUrl, 'adam');
await subscribe(anna, partyUrl, 'anna');
await subscribe(bolek, partyUrl, 'bolek');

await waitFor(
	() => got.filter((g) => g.payload.tag?.startsWith('draw-soon')).length === 3,
	70_000,
	'draw reminder to 3 participants'
);
const bolekReminder = got.find((g) => g.who === 'bolek');
if (!/losowanie/i.test(bolekReminder.payload.title)) throw new Error('Polish reminder expected');
if (!/still empty/.test(got.find((g) => g.who === 'anna').payload.body))
	throw new Error('empty-wishlist nudge expected');
if (
	!/^vapid t=/.test(got[0].headers.authorization) ||
	got[0].headers['content-encoding'] !== 'aes128gcm'
)
	throw new Error('bad headers');
console.log('✓ Polish text + empty wishlist nudge + VAPID/aes128gcm headers');

const status = await anna.evaluate(
	async (u) =>
		(
			await fetch(u + '/push?test', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: '{}'
			})
		).status,
	partyUrl
);
await waitFor(
	() => got.some((g) => g.who === 'anna' && g.payload.tag === 'test') && status === 200,
	10_000,
	'test notification'
);

// SSRF guard: arbitrary endpoints are refused
const bad = await anna.evaluate(
	async (u) =>
		(
			await fetch(u + '/push', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					endpoint: 'https://127.0.0.1:22/x',
					keys: { p256dh: 'abc', auth: 'abc' }
				})
			})
		).status,
	partyUrl
);
if (bad !== 400) throw new Error('SSRF guard: ' + bad);
console.log('✓ foreign endpoint rejected');

await admin.goto(BASE + partyUrl + '/admin');
await admin.getByRole('button', { name: /Draw now/ }).click();
await waitFor(
	() => got.filter((g) => g.payload.tag?.startsWith('drawn-')).length === 3,
	15_000,
	'draw-done to 3 participants'
);

// who drew Anna?
let giver;
for (const [who, page] of [
	['adam', admin],
	['bolek', bolek]
]) {
	await page.goto(BASE + partyUrl);
	await page.locator('button', { hasText: /Unwrap|Rozpakuj/ }).click();
	const name = (await page.locator('p.font-display.text-4xl').innerText()).trim();
	if (name === 'Anna') giver = who;
}
console.log('  Anna was drawn by', giver);
await anna.goto(BASE + partyUrl + '/me');
await anna.locator('textarea[name=wishlist]').fill('Socks');
await anna.getByRole('button', { name: 'Save' }).first().click();
await anna.getByText('Saved').waitFor();
await anna.locator('textarea[name=wishlist]').fill('Socks and a book');
await anna.getByRole('button', { name: 'Save' }).first().click();
await anna.getByText('Saved').waitFor();
await waitFor(
	() => got.some((g) => g.payload.tag?.startsWith('wishlist-')),
	200_000,
	'wishlist update pushed after settling'
);
const wl = got.filter((g) => g.payload.tag?.startsWith('wishlist-'));
if (wl.length !== 1 || wl[0].who !== giver)
	throw new Error(`wishlist push went to ${wl.map((w) => w.who)} (giver ${giver})`);
if (/Anna/.test(wl[0].payload.title + wl[0].payload.body))
	throw new Error('wishlist push must not name the person');
console.log('✓ exactly one wishlist push, to the giver, without the name');
await new Promise((r) => setTimeout(r, 35_000));
if (got.filter((g) => g.payload.tag?.startsWith('draw-soon')).length !== 3)
	throw new Error('reminder repeated');
console.log('✓ reminder not repeated');
console.log('ALL GOOD');
await browser.close();
process.exit(0);
