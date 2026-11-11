import { getLocale, type Locale } from '#lib/paraglide/runtime.js';

export type Language = {
	/** Name in the language itself, shown in the language picker. */
	name: string;
	/** Flag image in `static/flags/` (decorative; the name is what identifies the language). */
	flag: string;
	/** BCP 47 tag used for Intl date/number formatting. */
	intl: string;
	/** Opening and closing quotation marks. */
	quotes: [string, string];
};

/**
 * Every locale from `project.inlang/settings.json` must be listed here (enforced by the type).
 * Adding a language: add it to the settings, add a column in `scripts/messages.py`, add an
 * entry here and a flag SVG in `static/flags/`.
 */
export const LANGUAGES: Record<Locale, Language> = {
	pl: { name: 'Polski', flag: '/flags/pl.svg', intl: 'pl-PL', quotes: ['„', '”'] },
	en: { name: 'English', flag: '/flags/gb.svg', intl: 'en-GB', quotes: ['“', '”'] }
};

export const language = (locale: string = getLocale()): Language =>
	LANGUAGES[locale as Locale] ?? LANGUAGES.en;
