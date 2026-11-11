import { expect, test, type Browser, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function joinParty(browser: Browser, code: string, first: string, passcode?: string) {
	const ctx = await browser.newContext({ locale: 'en-US' });
	const page = await ctx.newPage();
	await page.goto('/');
	await page.getByLabel('Christmas Party Code').fill(code);
	await page.getByRole('button', { name: /Enter/ }).click();
	await page.getByRole('link', { name: /Join the party/ }).click();
	await page.getByLabel('First name').fill(first);
	await page.getByLabel('Last name').fill('Tester');
	if (passcode) {
		await page.getByPlaceholder('Passcode').fill(passcode);
		await page.getByPlaceholder('Repeat').fill(passcode);
	}
	await page.getByRole('button', { name: /Join the party/ }).click();
	await expect(page.getByText('Welcome!')).toBeVisible();
	return page;
}

async function revealedName(page: Page, partyUrl: string) {
	await page.goto(partyUrl);
	await page.getByRole('button', { name: /Unwrap/ }).click();
	const name = await page.locator('p.font-display.text-4xl').innerText();
	return name.trim();
}

test('full party lifecycle', async ({ browser }) => {
	test.setTimeout(120_000);
	const adminCtx = await browser.newContext({ locale: 'en-US' });
	const admin = await adminCtx.newPage();
	admin.on('dialog', (d) => d.accept());

	// --- create party via questionnaire
	await admin.goto('/');
	await admin
		.getByRole('link', { name: /Create a party/ })
		.first()
		.click();
	await admin.getByLabel('Party name').fill('E2E Christmas');
	await admin.locator('#drawAt').fill('2035-12-01T18:00');
	await admin.locator('#partyAt').fill('2035-12-24T17:00');
	await admin.getByLabel(/Location/).fill('Grandma’s house');
	await admin.getByRole('button', { name: /Next/ }).click();

	await expect(admin.getByText('Is there a maximum gift budget?')).toBeVisible();
	await admin.locator('input[type=number]').first().fill('150');
	// say "yes" to restrictions and fill it
	const restrictions = admin.locator('.card', {
		hasText: 'Is there anything people must not buy?'
	});
	await restrictions.getByRole('radio', { name: 'Yes' }).click();
	await restrictions.getByRole('textbox').fill('alcohol');
	await admin.getByRole('button', { name: /Next/ }).click();

	const statute = admin.locator('article', { hasText: 'Statute' });
	await expect(statute).toContainText('150');
	await expect(statute).toContainText('Do not buy: alcohol.');
	await expect(statute).not.toContainText('Handmade');
	await admin.getByRole('button', { name: /Next/ }).click();

	await admin.getByLabel('First name').fill('Mateusz');
	await admin.getByLabel('Admin password').fill('secret123');
	await admin.getByLabel('Repeat').fill('secret123');
	await admin.getByRole('button', { name: /Create a party/ }).click();

	await expect(admin.getByText('Party created!')).toBeVisible();
	const code = (await admin.locator('.success b').innerText()).trim();
	expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
	const partyUrl = new URL(admin.url()).pathname;
	await expect(admin.getByText('Time left until the draw')).toBeVisible();
	await expect(admin.getByText('Do not buy: alcohol.')).toBeVisible();

	// --- wrong code is rejected
	const stranger = await (await browser.newContext({ locale: 'en-US' })).newPage();
	await stranger.goto(partyUrl);
	await expect(stranger.getByText('This party is secret')).toBeVisible();
	await stranger.getByLabel('Christmas Party Code').fill('NOPE-NOPE');
	await stranger.getByRole('button', { name: /Enter/ }).click();
	await expect(stranger.getByText('No party with this code')).toBeVisible();

	// --- members join
	const anna = await joinParty(browser, code, 'Anna', 'anna1234');
	const bob = await joinParty(browser, code, 'Bob', 'bob12345');
	const celina = await joinParty(browser, code, 'Celina');

	// avatar upload
	await anna.locator('input[name=avatar]').setInputFiles('e2e/fixtures/avatar.png');
	await expect(anna.locator('img[src^="/uploads/"]').first()).toBeVisible();
	const src = await anna.locator('img[src^="/uploads/"]').first().getAttribute('src');
	expect((await anna.request.get(src!)).headers()['content-type']).toBe('image/webp');

	// wishlist
	await anna.getByLabel('What would you like to get?').fill('Warm socks');
	await anna.getByRole('button', { name: 'Save' }).first().click();
	await expect(anna.getByText('Saved')).toBeVisible();

	// --- couple exclusion: Anna proposes Bob, Bob accepts
	await anna
		.getByRole('combobox', { name: 'Choose a person…' })
		.selectOption({ label: 'Bob Tester' });
	await anna.getByRole('button', { name: 'Propose' }).click();
	await expect(anna.getByText('waiting for acceptance')).toBeVisible();
	await bob.reload();
	await expect(bob.getByText('asks not to draw each other')).toBeVisible();
	await bob.getByRole('button', { name: 'Accept' }).click();
	await expect(bob.getByText("you won't draw each other")).toBeVisible();

	// --- admin: wishlist obscured until revealed
	await admin.goto(`${partyUrl}/admin`);
	const annaRow = admin.locator('li', {
		hasText: 'Anna Tester',
		has: admin.getByRole('link', { name: /Edit/ })
	});
	await expect(annaRow).not.toContainText('Warm socks');
	await annaRow.getByRole('button', { name: 'Reveal' }).click();
	await expect(annaRow).toContainText('Warm socks');
	await expect(admin.locator('li', { hasText: '⇄' })).toContainText('Bob');

	// --- draw
	await admin.getByRole('button', { name: /Draw now/ }).click();
	await expect(admin.getByText(/Drawn on/)).toBeVisible();

	const names = {
		Mateusz: await revealedName(admin, partyUrl),
		Anna: await revealedName(anna, partyUrl),
		Bob: await revealedName(bob, partyUrl),
		Celina: await revealedName(celina, partyUrl)
	};
	const receivers = Object.values(names);
	expect(new Set(receivers).size).toBe(4);
	for (const [giver, receiver] of Object.entries(names)) expect(receiver).not.toContain(giver);
	expect(names.Anna).not.toContain('Bob');
	expect(names.Bob).not.toContain('Anna');
	// wishlist visible to whoever drew Anna
	const annaSanta = Object.entries(names).find(([, r]) => r.startsWith('Anna'))![0];
	const santaPage = { Mateusz: admin, Anna: anna, Bob: bob, Celina: celina }[annaSanta]!;
	await expect(santaPage.getByText('Warm socks')).toBeVisible();

	// joining is closed now
	const late = await (await browser.newContext({ locale: 'en-US' })).newPage();
	await late.goto('/');
	await late.getByLabel('Christmas Party Code').fill(code);
	await late.getByRole('button', { name: /Enter/ }).click();
	await expect(late.getByRole('link', { name: /Join the party/ })).toHaveCount(0);

	// --- archive / unarchive
	await admin.goto(`${partyUrl}/admin`);
	await admin.getByRole('button', { name: /Archive/ }).click();
	await expect(admin.getByText('This party is archived.')).toBeVisible();
	await admin.goto('/');
	await expect(admin.getByText('E2E Christmas')).toHaveCount(0);
	await admin.goto('/?archived');
	await expect(admin.getByText('E2E Christmas')).toBeVisible();
	await admin.goto(`${partyUrl}/admin`);
	await admin.getByRole('button', { name: /Restore from archive/ }).click();
	await admin.goto('/');
	await expect(admin.getByText('E2E Christmas')).toBeVisible();

	// --- language switch
	await admin.goto(partyUrl);
	await admin.getByRole('button', { name: 'pl', exact: true }).click();
	await expect(admin.getByRole('heading', { name: 'Regulamin' })).toBeVisible();
	await expect(admin.getByText('Nie kupujemy: alcohol.')).toBeVisible();
});

test('site admin sees all parties', async ({ page }) => {
	await page.goto('/admin');
	await page.getByLabel('Password').fill('wrong');
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page.getByText('Wrong password.')).toBeVisible();
	await page.getByLabel('Password').fill(process.env.PW_ADMIN_PASSWORD ?? 'e2e-admin');
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page.getByRole('cell', { name: /E2E Christmas/ })).toBeVisible();
	await page.getByRole('link', { name: 'Manage' }).first().click();
	await expect(page.getByRole('heading', { name: 'Party admin' })).toBeVisible();
});
