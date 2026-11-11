// Light / dark theme. The choice lives in the `theme` cookie (absent = follow the device).
// The same logic runs before first paint as an inline script in src/app.html — keep them in sync.

export type ThemeChoice = 'auto' | 'light' | 'dark';
export const THEME_CHOICES: ThemeChoice[] = ['auto', 'light', 'dark'];
export const THEME_COOKIE = 'theme';

export const parseTheme = (value: string | undefined): ThemeChoice =>
	value === 'light' || value === 'dark' ? value : 'auto';

/** Resolves the choice and applies it to <html> (data-theme → color-scheme → all colours). */
export function applyTheme(choice: ThemeChoice) {
	const dark =
		choice === 'dark' || (choice === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.dataset.theme = dark ? 'dark' : 'light';
	// Dark pages tell Dark Reader there is nothing to do; light pages leave it free to work.
	let lock = document.head.querySelector('meta[name="darkreader-lock"]');
	if (dark && !lock) {
		lock = document.createElement('meta');
		lock.setAttribute('name', 'darkreader-lock');
		document.head.append(lock);
	} else if (!dark) lock?.remove();
}

export function setTheme(choice: ThemeChoice) {
	document.cookie =
		choice === 'auto'
			? `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`
			: `${THEME_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;
	applyTheme(choice);
}
