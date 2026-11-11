import { describe, expect, it } from 'vitest';
import { avatarDataUri, avatarSvg, traitsFor } from './avatar-art.ts';

describe('generated avatars', () => {
	it('is stable for the same seed', () => {
		expect(traitsFor('abc')).toEqual(traitsFor('abc'));
		expect(avatarDataUri('abc')).toBe(avatarDataUri('abc'));
	});

	it('varies between seeds', () => {
		const looks = new Set(Array.from({ length: 30 }, (_, i) => avatarSvg(traitsFor(`m${i}`))));
		expect(looks.size).toBeGreaterThan(25);
	});

	it('produces an svg data uri', () => {
		expect(avatarDataUri('x')).toMatch(/^data:image\/svg\+xml,%3Csvg/);
	});
});
