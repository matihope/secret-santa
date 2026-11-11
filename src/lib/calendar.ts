// Calendar export: iCalendar (.ics, RFC 5545) and "add to Google Calendar" links.

export type CalendarEvent = {
	uid: string;
	title: string;
	start: Date;
	end: Date;
	description?: string;
	location?: string;
	url?: string;
	/** Reminders, in minutes before the start (0 = at start). */
	alarms?: number[];
};

/** 2026-12-24T17:00:00.000Z → 20261224T170000Z */
export const icsDate = (d: Date) =>
	d
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');

const escapeText = (s: string) =>
	s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a content line to 75 octets per RFC 5545 §3.1 (continuation lines start with a space). */
function fold(line: string): string {
	const bytes = new TextEncoder();
	if (bytes.encode(line).length <= 75) return line;
	const out: string[] = [];
	let cur = '';
	let size = 0;
	for (const ch of line) {
		const n = bytes.encode(ch).length;
		if (size + n > (out.length ? 74 : 75)) {
			out.push(cur);
			cur = '';
			size = 0;
		}
		cur += ch;
		size += n;
	}
	out.push(cur);
	return out.join('\r\n ');
}

export function buildIcs(events: CalendarEvent[], now = new Date()): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Secret Santa//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH'
	];
	for (const e of events) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:${e.uid}`,
			`DTSTAMP:${icsDate(now)}`,
			`DTSTART:${icsDate(e.start)}`,
			`DTEND:${icsDate(e.end)}`,
			`SUMMARY:${escapeText(e.title)}`
		);
		if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
		if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
		if (e.url) lines.push(`URL:${e.url}`);
		for (const min of e.alarms ?? []) {
			lines.push(
				'BEGIN:VALARM',
				'ACTION:DISPLAY',
				`DESCRIPTION:${escapeText(e.title)}`,
				`TRIGGER:${min ? `-PT${min}M` : 'PT0M'}`,
				'END:VALARM'
			);
		}
		lines.push('END:VEVENT');
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(e: CalendarEvent): string {
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: e.title,
		dates: `${icsDate(e.start)}/${icsDate(e.end)}`
	});
	const details = [e.description, e.url].filter(Boolean).join('\n\n');
	if (details) params.set('details', details);
	if (e.location) params.set('location', e.location);
	return `https://calendar.google.com/calendar/render?${params}`;
}
