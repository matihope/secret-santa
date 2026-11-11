import { m } from '#lib/paraglide/messages.js';

/** Translates an error key returned by a form action (`err_<key>` message). */
export function errorText(key: string | undefined | null): string {
	if (!key) return '';
	const fn = (m as unknown as Record<string, (() => string) | undefined>)[`err_${key}`];
	return fn ? fn() : key;
}
