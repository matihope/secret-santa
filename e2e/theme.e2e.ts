import { expect, test, type Page } from '@playwright/test';

// The theme is applied before first paint by the inline script in src/app.html.
// A dark page carries <meta name="darkreader-lock"> and color-scheme: dark so that the
// Dark Reader extension recognises the built-in dark theme and leaves the page alone.

const state = (page: Page) =>
	page.evaluate(() => ({
		theme: document.documentElement.dataset.theme,
		scheme: getComputedStyle(document.documentElement).colorScheme,
		lock: !!document.querySelector('meta[name="darkreader-lock"]'),
		bg: getComputedStyle(document.documentElement).backgroundColor
	}));

const LIGHT = { theme: 'light', scheme: 'light', lock: false, bg: 'rgb(247, 240, 227)' };
const DARK = { theme: 'dark', scheme: 'dark', lock: true, bg: 'rgb(17, 26, 21)' };

test('follows the device setting', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	expect(await state(page)).toEqual(LIGHT);

	await page.emulateMedia({ colorScheme: 'dark' });
	await expect.poll(() => state(page)).toEqual(DARK);

	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => state(page)).toEqual(LIGHT);
});

test('the switch overrides the device and is remembered', async ({ page, context }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	const button = page.getByRole('button', { name: /^Theme/ });
	await expect(button).toHaveAccessibleName(/Automatic/);

	await button.click(); // → light
	await expect(button).toHaveAccessibleName(/Light/);
	await button.click(); // → dark
	await expect(button).toHaveAccessibleName(/Dark/);
	expect(await state(page)).toEqual(DARK);

	// survives a reload and wins over a light device, already on the server-rendered page
	await page.reload();
	expect(await state(page)).toEqual(DARK);
	await expect(button).toHaveAccessibleName(/Dark/);
	expect((await context.cookies()).find((c) => c.name === 'theme')?.value).toBe('dark');

	await button.click(); // → automatic again: cookie gone, back to the (light) device
	await expect(button).toHaveAccessibleName(/Automatic/);
	expect(await state(page)).toEqual(LIGHT);
	expect((await context.cookies()).find((c) => c.name === 'theme')).toBeUndefined();
});
