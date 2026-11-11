import { describe, expect, it } from 'vitest';
import { buildIcs, googleCalendarUrl, icsDate, type CalendarEvent } from './calendar.ts';

const ev: CalendarEvent = {
	uid: 'party-abc@secret-santa',
	title: 'Wigilia, u babci; 🎄',
	start: new Date('2026-12-24T16:00:00Z'),
	end: new Date('2026-12-24T19:00:00Z'),
	description: 'Line one\nLine two — ' + 'ż'.repeat(60),
	location: 'Kraków',
	url: 'https://santa.example.com/p/abc',
	alarms: [1440, 0]
};

describe('calendar', () => {
	it('formats UTC dates', () => {
		expect(icsDate(new Date('2026-12-24T16:05:09.123Z'))).toBe('20261224T160509Z');
	});

	it('builds a valid, escaped and folded ics', () => {
		const ics = buildIcs([ev], new Date('2026-11-11T00:00:00Z'));
		expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
		expect(ics).toContain('SUMMARY:Wigilia\\, u babci\\; 🎄\r\n');
		expect(ics).toContain('DTSTART:20261224T160000Z');
		expect(ics).toContain('TRIGGER:-PT1440M');
		expect(ics).toContain('TRIGGER:PT0M');
		for (const line of ics.split('\r\n')) {
			expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
		}
		// unfolding restores the original description
		const unfolded = ics.replace(/\r\n /g, '');
		expect(unfolded).toContain('DESCRIPTION:Line one\\nLine two — ' + 'ż'.repeat(60));
	});

	it('links to Google Calendar', () => {
		const url = new URL(googleCalendarUrl(ev));
		expect(url.hostname).toBe('calendar.google.com');
		expect(url.searchParams.get('dates')).toBe('20261224T160000Z/20261224T190000Z');
		expect(url.searchParams.get('location')).toBe('Kraków');
		expect(url.searchParams.get('details')).toContain(ev.url);
	});
});
