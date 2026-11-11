// Generates README screenshots from demo data.
//
//   npm run build
//   DATABASE_URL=data-shots/santa.db DATA_DIR=data-shots SITE_ADMIN_PASSWORD=shots \
//     COOKIE_SECURE=false npx vite preview --port 4174 &
//   node scripts/screenshots.mjs [http://localhost:4174] [--compose-only]
//
// Writes docs/screenshots/*.webp. Use a fresh data dir: the script creates parties.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'http://localhost:4174';
const OUT = 'docs/screenshots';
const TMP = 'data-shots/tmp';
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

/* ---------- cartoon avatars ---------- */

function avatarSvg({ bg, skin, hair, style, shirt, glasses, hat, beard }) {
	const hairBack =
		style === 'long'
			? `<ellipse cx="160" cy="175" rx="92" ry="105" fill="${hair}"/>`
			: style === 'bun'
				? `<circle cx="160" cy="62" r="34" fill="${hair}"/>`
				: '';
	const hairTop =
		style === 'bald'
			? `<path d="M88 150 q-6 -30 10 -40 M232 150 q6 -30 -10 -40" stroke="${hair}" stroke-width="16" stroke-linecap="round" fill="none"/>`
			: `<path d="M86 150 C 84 85, 130 62, 160 62 C 200 62, 238 85, 234 150 C 220 112, 190 100, 160 104 C 128 100, 100 115, 86 150 Z" fill="${hair}"/>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
	<rect width="320" height="320" fill="${bg}"/>
	<path d="M40 330 C 50 250, 110 228, 160 228 C 210 228, 270 250, 280 330 Z" fill="${shirt}"/>
	${hairBack}
	<rect x="140" y="196" width="40" height="40" rx="12" fill="${skin}"/>
	<ellipse cx="160" cy="150" rx="74" ry="80" fill="${skin}"/>
	<circle cx="86" cy="158" r="12" fill="${skin}"/><circle cx="234" cy="158" r="12" fill="${skin}"/>
	${hairTop}
	<circle cx="132" cy="152" r="8" fill="#2b1d17"/><circle cx="188" cy="152" r="8" fill="#2b1d17"/>
	<circle cx="134.5" cy="149.5" r="2.5" fill="#fff"/><circle cx="190.5" cy="149.5" r="2.5" fill="#fff"/>
	<circle cx="114" cy="180" r="11" fill="#ff8a8a" opacity=".45"/><circle cx="206" cy="180" r="11" fill="#ff8a8a" opacity=".45"/>
	${beard ? `<path d="M100 170 C 105 250, 215 250, 220 170 C 200 200, 120 200, 100 170 Z" fill="#f4f1ea"/><path d="M134 192 q26 -14 52 0" stroke="#e8e2d6" stroke-width="10" fill="none" stroke-linecap="round"/>` : `<path d="M138 188 q22 20 44 0" stroke="#7a2a22" stroke-width="6" fill="none" stroke-linecap="round"/>`}
	${glasses ? `<g fill="none" stroke="#2b1d17" stroke-width="5"><circle cx="132" cy="152" r="20"/><circle cx="188" cy="152" r="20"/><path d="M152 150 h16"/></g>` : ''}
	${hat ? `<path d="M80 108 C 100 40, 170 10, 230 40 C 250 50, 262 70, 262 92 C 240 80, 220 80, 210 92 C 220 96, 232 102, 240 110 Z" fill="#b4232f"/><rect x="74" y="98" width="172" height="24" rx="12" fill="#fffdf8"/><circle cx="262" cy="96" r="16" fill="#fffdf8"/>` : ''}
</svg>`;
}

const AVATARS = {
	mateusz: {
		bg: '#e9c36a',
		skin: '#f2c9a5',
		hair: '#5a3b26',
		style: 'short',
		shirt: '#17382a',
		hat: true
	},
	ania: { bg: '#cfe3d6', skin: '#f6d2b8', hair: '#a0522d', style: 'long', shirt: '#b4232f' },
	kuba: {
		bg: '#f3d9d9',
		skin: '#eac0a0',
		hair: '#2e2420',
		style: 'short',
		shirt: '#24523d',
		glasses: true
	},
	hela: {
		bg: '#efe4cf',
		skin: '#f3d3bd',
		hair: '#d9d6d0',
		style: 'bun',
		shirt: '#8f1a24',
		glasses: true
	},
	jozek: {
		bg: '#dbe7f0',
		skin: '#efc4a4',
		hair: '#d9d6d0',
		style: 'bald',
		shirt: '#24523d',
		beard: true,
		hat: true
	},
	zosia: { bg: '#fde2c4', skin: '#f8d6c0', hair: '#e0a84a', style: 'bun', shirt: '#c8962b' },
	marta: { bg: '#e6dcf0', skin: '#c99a76', hair: '#1f1612', style: 'long', shirt: '#17382a' },
	piotr: {
		bg: '#d6ead9',
		skin: '#f0c8a8',
		hair: '#c26b2c',
		style: 'short',
		shirt: '#b4232f',
		glasses: true
	},
	kasia: { bg: '#f7d6dc', skin: '#f6d2b8', hair: '#3a2416', style: 'long', shirt: '#24523d' },
	bartek: { bg: '#e9c36a', skin: '#a8754f', hair: '#1f1612', style: 'short', shirt: '#8f1a24' }
};

async function avatarFile(key) {
	const file = join(TMP, `${key}.png`);
	await sharp(Buffer.from(avatarSvg(AVATARS[key])))
		.png()
		.toFile(file);
	return file;
}

/* ---------- helpers ---------- */

const COMPOSE_ONLY = process.argv.includes('--compose-only');
const browser = COMPOSE_ONLY ? null : await chromium.launch();
const desktop = { locale: 'en-US', viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 };
const mobile = {
	locale: 'en-US',
	viewport: { width: 390, height: 844 },
	deviceScaleFactor: 2,
	isMobile: true,
	hasTouch: true
};

async function settle(page) {
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(1300);
}

async function shot(page, name, opts = {}) {
	await settle(page);
	const buf = await page.screenshot(opts);
	await sharp(buf)
		.webp({ quality: 88 })
		.toFile(join(OUT, `${name}.webp`));
	return buf;
}

async function createParty(
	ctxOpts,
	{ name, description, drawAt, partyAt, location, admin, answers = {} }
) {
	const ctx = await browser.newContext(ctxOpts);
	const page = await ctx.newPage();
	page.on('dialog', (d) => d.accept());
	await page.goto(BASE + '/new');
	await page.getByLabel('Party name').fill(name);
	if (description) await page.locator('#description').fill(description);
	await page.locator('#drawAt').fill(drawAt);
	if (partyAt) await page.locator('#partyAt').fill(partyAt);
	if (location) await page.locator('#location').fill(location);
	await page.getByLabel(/Show on the home page/).check();
	await page.getByRole('button', { name: /Next/ }).click();
	for (const [question, value] of Object.entries(answers)) {
		const card = page.locator('.card', { hasText: question });
		await card.getByRole('radio', { name: 'Yes' }).click();
		if (value) await card.locator('input').first().fill(value);
	}
	return { ctx, page };
}

async function finishParty(page, admin, nexts) {
	for (let i = 0; i < nexts; i++) await page.getByRole('button', { name: /Next/ }).click();
	await page.getByLabel('First name').fill(admin.first);
	if (admin.last) await page.getByLabel('Last name').fill(admin.last);
	await page.getByLabel('Admin password').fill('demo-pass-123');
	await page.getByLabel('Repeat').fill('demo-pass-123');
	await page.getByRole('button', { name: /Create a party/ }).click();
	await page.getByText('Party created!').waitFor();
	const code = (await page.locator('.success b').innerText()).trim();
	return { code, url: new URL(page.url()).pathname };
}

async function setProfile(page, url, { avatar, wishlist }) {
	await page.goto(BASE + url + '/me');
	if (avatar) {
		await page.locator('input[name=avatar]').setInputFiles(await avatarFile(avatar));
		await page.locator('img[src^="/uploads/"]').first().waitFor();
	}
	if (wishlist) {
		await page.getByLabel('What would you like to get?').fill(wishlist);
		await page.getByRole('button', { name: 'Save' }).first().click();
		await page.getByText('Saved').waitFor();
	}
}

async function joinParty(code, url, person, ctxOpts = desktop) {
	const ctx = await browser.newContext(ctxOpts);
	const page = await ctx.newPage();
	await page.goto(BASE + '/');
	await page.getByLabel('Christmas Party Code').fill(code);
	await page.getByRole('button', { name: /Enter/ }).click();
	await page
		.getByRole('link', { name: /Join the party/ })
		.first()
		.click();
	if (person.first) await page.getByLabel('First name').fill(person.first);
	if (person.last) await page.getByLabel('Last name').fill(person.last);
	if (person.nick) await page.getByLabel(/Nickname/).fill(person.nick);
	await page.getByPlaceholder('Passcode').fill('demo-pass');
	await page.getByPlaceholder('Repeat').fill('demo-pass');
	await page.getByRole('button', { name: /Join the party/ }).click();
	await page.getByText('Welcome!').waitFor();
	await setProfile(page, url, person);
	return { ctx, page };
}

let heroDesktop, mobGift, mobReveal, mobPl, builderShot, statuteShot;
if (!COMPOSE_ONLY) {
	/* ---------- party 1: the family (not drawn yet) ---------- */

	const fam = await createParty(desktop, {
		name: 'Christmas at Grandma’s',
		description: 'Pierogi, carols and one very secret gift each. 🎄',
		drawAt: '2026-12-06T18:00',
		partyAt: '2026-12-24T17:00',
		location: 'Grandma Hela’s house, Kraków',
		answers: {
			'Is there anything people must not buy?': 'gift cards, socks (Grandpa has enough)',
			'Are handmade gifts welcome?': '',
			'Will everyone try to guess their Santa at the party?': ''
		}
	});
	await fam.page
		.locator('.card', { hasText: 'Is there a maximum gift budget?' })
		.locator('input')
		.fill('150');
	await settle(fam.page);
	await shot(fam.page, 'wizard-questions');
	await fam.page.getByRole('button', { name: /Next/ }).click();
	await fam.page.getByRole('combobox', { name: 'Add rule' }).selectOption('dress_code');
	await fam.page.getByRole('button', { name: /Add rule/ }).click();
	await fam.page.getByPlaceholder('ugly Christmas sweaters').fill('ugly Christmas sweaters');
	await settle(fam.page);
	const builderCard = fam.page
		.locator('form .card')
		.filter({ has: fam.page.getByRole('button', { name: /Add rule/ }) });
	builderShot = await builderCard.screenshot();
	statuteShot = await fam.page.locator('article', { hasText: 'Statute' }).screenshot();
	const famParty = await finishParty(fam.page, { first: 'Mateusz', last: 'Kowalski' }, 1);
	await setProfile(fam.page, famParty.url, {
		avatar: 'mateusz',
		wishlist: 'A board game we can all play after dinner.'
	});

	const family = [
		{
			key: 'ania',
			first: 'Anna',
			last: 'Kowalska',
			nick: 'Ania',
			avatar: 'ania',
			wishlist: 'A cosy scarf (green!), a crime novel, good coffee beans.'
		},
		{
			key: 'kuba',
			first: 'Jakub',
			last: 'Nowak',
			nick: 'Kuba',
			avatar: 'kuba',
			wishlist: 'Anything for my bike, or a puzzle with 1000+ pieces.'
		},
		{
			key: 'hela',
			nick: 'Grandma Hela',
			first: 'Helena',
			last: 'Kowalska',
			avatar: 'hela',
			wishlist: 'Seeds for the garden and a photo of all of you.'
		},
		{
			key: 'jozek',
			nick: 'Grandpa Józek',
			first: 'Józef',
			last: 'Kowalski',
			avatar: 'jozek',
			wishlist: 'NOT socks. A good chess book.'
		},
		{
			key: 'zosia',
			first: 'Zosia',
			last: 'Nowak',
			avatar: 'zosia',
			wishlist: 'Unicorn stickers 🦄 and a sketchbook.'
		},
		{
			key: 'ola',
			first: 'Ola',
			last: 'Wiśniewska',
			wishlist: 'Tea, candles, a plant I can’t kill.'
		},
		{
			key: 'tomek',
			first: 'Tomek',
			last: 'Wiśniewski',
			wishlist: 'Hot sauce. The hotter the better.'
		}
	];
	const famMembers = {};
	for (const person of family)
		famMembers[person.key] = await joinParty(famParty.code, famParty.url, person);

	// the couple
	const ania = famMembers.ania.page;
	await ania.goto(BASE + famParty.url + '/me');
	await ania.getByRole('combobox', { name: 'Choose a person…' }).selectOption({ label: 'Kuba' });
	await ania.getByRole('button', { name: 'Propose' }).click();
	await ania.getByText('waiting for acceptance').waitFor();
	const kuba = famMembers.kuba.page;
	await kuba.goto(BASE + famParty.url + '/me');
	await kuba.getByRole('button', { name: 'Accept' }).click();
	await kuba.getByText("you won't draw each other").waitFor();

	/* ---------- party 2: friends (drawn) ---------- */

	const fr = await createParty(desktop, {
		name: 'Friends’ Winter Swap',
		drawAt: '2026-11-30T20:00',
		partyAt: '2026-12-13T19:00',
		location: 'Marta’s flat'
	});
	const frParty = await finishParty(fr.page, { first: 'Marta' }, 2);
	await setProfile(fr.page, frParty.url, {
		avatar: 'marta',
		wishlist: 'Vinyl records (jazz), fancy chocolate.'
	});
	const friends = [
		{
			key: 'piotr',
			first: 'Piotr',
			avatar: 'piotr',
			wishlist: 'A cookbook from anywhere in Asia, chopsticks.'
		},
		{
			key: 'kasia',
			first: 'Kasia',
			avatar: 'kasia',
			wishlist: 'Yoga socks, a mug with a cat on it, bath bombs.'
		},
		{
			key: 'bartek',
			first: 'Bartek',
			avatar: 'bartek',
			wishlist: 'Board game “Wingspan” or anything with dragons.'
		}
	];
	const frMembers = {};
	for (const person of friends)
		frMembers[person.key] = await joinParty(frParty.code, frParty.url, person, mobile);
	await fr.page.goto(BASE + frParty.url + '/admin');
	await fr.page.getByRole('button', { name: /Draw now/ }).click();
	await fr.page.getByText(/Drawn on/).waitFor();

	/* ---------- desktop shots ---------- */

	const admin = fam.page;
	await admin.goto(BASE + '/');
	await shot(admin, 'home');

	await admin.goto(BASE + famParty.url);
	heroDesktop = await shot(admin, 'party');

	await admin.goto(BASE + famParty.url + '/admin');
	const members = admin.locator('section', { hasText: 'Participants (' });
	await members
		.locator('li', { hasText: 'Anna Kowalska' })
		.getByRole('button', { name: 'Reveal' })
		.click();
	await settle(admin);
	await sharp(await members.screenshot())
		.webp({ quality: 88 })
		.toFile(join(OUT, 'admin-members.webp'));

	/* ---------- mobile shots ---------- */

	const kasia = frMembers.kasia.page;
	await kasia.goto(BASE + frParty.url);
	await kasia.getByRole('button', { name: /Unwrap/ }).scrollIntoViewIfNeeded();
	await settle(kasia);
	mobGift = await kasia.screenshot();
	await kasia.getByRole('button', { name: /Unwrap/ }).click();
	await kasia.locator('p.font-display.text-4xl').scrollIntoViewIfNeeded();
	await kasia.evaluate(() => window.scrollBy(0, -120));
	await settle(kasia);
	mobReveal = await kasia.screenshot();

	const plCtx = await browser.newContext({ ...mobile, locale: 'pl-PL' });
	const plPage = await plCtx.newPage();
	await plCtx.addCookies(await famMembers.zosia.ctx.cookies());
	await plPage.goto(BASE + famParty.url);
	await plPage.getByRole('button', { name: /^(Language|Język)/ }).click();
	await plPage.getByRole('menuitemradio', { name: 'Polski' }).click();
	await plPage.waitForLoadState('networkidle');
	await settle(plPage);
	mobPl = await plPage.screenshot();

	for (const [n, b] of Object.entries({
		heroDesktop,
		mobGift,
		mobReveal,
		mobPl,
		builderShot,
		statuteShot
	}))
		writeFileSync(join(TMP, `${n}.png`), b);
	writeFileSync(join(TMP, 'codes.json'), JSON.stringify({ famParty, frParty }, null, 2));
	await browser.close();
} else {
	[heroDesktop, mobGift, mobReveal, mobPl, builderShot, statuteShot] = [
		'heroDesktop',
		'mobGift',
		'mobReveal',
		'mobPl',
		'builderShot',
		'statuteShot'
	].map((n) => readFileSync(join(TMP, `${n}.png`)));
}

/* ---------- compositions ---------- */

const PINE = '#17382a';

async function rounded(buf, width, radius) {
	const { data, info } = await sharp(buf)
		.resize({ width })
		.png()
		.toBuffer({ resolveWithObject: true });
	const height = info.height;
	const mask = Buffer.from(
		`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`
	);
	const out = await sharp(data)
		.composite([{ input: mask, blend: 'dest-in' }])
		.png()
		.toBuffer();
	return { buf: out, width, height };
}

function shadow(width, height, radius, blur = 40) {
	const pad = blur * 2;
	return sharp(
		Buffer.from(
			`<svg width="${width + pad * 2}" height="${height + pad * 2}"><rect x="${pad}" y="${pad + blur / 2}" width="${width}" height="${height}" rx="${radius}" fill="#000" opacity=".45"/></svg>`
		)
	)
		.blur(blur / 2)
		.png()
		.toBuffer()
		.then((b) => ({ buf: b, pad }));
}

function background(w, h) {
	const dots = Array.from({ length: 70 }, (_, i) => {
		const x = (i * 397) % w;
		const y = (i * 211) % h;
		const r = 2 + (i % 4);
		return `<circle cx="${x}" cy="${y}" r="${r}" fill="#e9c36a" opacity="${0.08 + (i % 5) * 0.03}"/>`;
	}).join('');
	return Buffer.from(
		`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${PINE}"/>${dots}</svg>`
	);
}

async function place(layers, item, left, top, radius) {
	const s = await shadow(item.width, item.height, radius);
	layers.push({ input: s.buf, left: left - s.pad, top: top - s.pad });
	layers.push({ input: item.buf, left, top });
}

// hero: desktop party page + phone with the reveal
{
	const W = 2400;
	const H = 1600;
	const layers = [];
	const desk = await rounded(heroDesktop, 1900, 28);
	const phone = await rounded(mobReveal, 520, 56);
	await place(layers, desk, 110, 110, 28);
	await place(layers, phone, W - 520 - 110, H - phone.height - 110, 56);
	await sharp(await sharp(background(W, H)).composite(layers).png().toBuffer())
		.resize({ width: 1600 })
		.webp({ quality: 90 })
		.toFile(join(OUT, 'hero.webp'));
}

// mobile strip: gift → reveal → Polish party page
{
	const shots = [mobGift, mobReveal, mobPl];
	const pw = 560;
	const gap = 90;
	const W = shots.length * pw + (shots.length + 1) * gap;
	const items = await Promise.all(shots.map((b) => rounded(b, pw, 56)));
	const H = items[0].height + gap * 2;
	const layers = [];
	for (const [i, it] of items.entries()) await place(layers, it, gap + i * (pw + gap), gap, 56);
	await sharp(await sharp(background(W, H)).composite(layers).png().toBuffer())
		.resize({ width: 1600 })
		.webp({ quality: 90 })
		.toFile(join(OUT, 'mobile.webp'));
}

// rules: builder (top part) next to the rendered statute
{
	const colW = 1000;
	const gap = 100;
	const statute = await rounded(statuteShot, colW, 48);
	const builderFull = await sharp(builderShot).resize({ width: colW }).png().toBuffer();
	const builder = await rounded(
		await sharp(builderFull)
			.extract({ left: 0, top: 0, width: colW, height: statute.height })
			.png()
			.toBuffer(),
		colW,
		48
	);
	const W = colW * 2 + gap * 3;
	const H = statute.height + gap * 2;
	const layers = [];
	await place(layers, builder, gap, gap, 48);
	await place(layers, statute, gap * 2 + colW, gap, 48);
	await sharp(await sharp(background(W, H)).composite(layers).png().toBuffer())
		.resize({ width: 1600 })
		.webp({ quality: 90 })
		.toFile(join(OUT, 'rules.webp'));
}

console.log('done →', OUT);
