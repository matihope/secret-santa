/** Offset (ms) of `tz` relative to UTC at instant `date`. */
function tzOffset(date: Date, tz: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(date);
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
	const asUtc = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour'),
		get('minute'),
		get('second')
	);
	return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** `YYYY-MM-DDTHH:mm` (wall clock in `tz`) → Date. Returns null for empty/invalid input. */
export function fromInputValue(value: string | null | undefined, tz: string): Date | null {
	if (!value) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
	if (!m) return null;
	const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
	let result = guess - tzOffset(new Date(guess), tz);
	// second pass handles DST boundaries
	result = guess - tzOffset(new Date(result), tz);
	return new Date(result);
}

/** Date → `YYYY-MM-DDTHH:mm` wall clock in `tz` (for datetime-local inputs). */
export function toInputValue(date: Date | null | undefined, tz: string): string {
	if (!date) return '';
	const local = new Date(date.getTime() + tzOffset(date, tz));
	return local.toISOString().slice(0, 16);
}

export function formatDateTime(date: Date | null | undefined, locale: string, tz: string): string {
	if (!date) return '';
	return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
		timeZone: tz,
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}

export function formatDate(date: Date | null | undefined, locale: string, tz: string): string {
	if (!date) return '';
	return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
		timeZone: tz,
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(date);
}
