import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '#lib/paraglide/runtime.js';
import { ruleSentence, sanitizeRules } from './catalog.ts';

const ctx = { currency: 'PLN', tz: 'Europe/Warsaw' };
const sentence = (n: string) => ruleSentence({ type: 'gift_count', value: { n } }, ctx);

describe('gift_count rule', () => {
	afterEach(() => overwriteGetLocale(() => 'pl'));

	it('says gifts go to the one drawn person (en)', () => {
		overwriteGetLocale(() => 'en');
		expect(sentence('1')).toBe('Everyone prepares 1 gift for the one person they drew.');
		expect(sentence('3')).toBe('Everyone prepares 3 gifts for the one person they drew.');
	});

	it('uses Polish plural forms', () => {
		overwriteGetLocale(() => 'pl');
		expect(sentence('1')).toBe('Każdy przygotowuje 1 prezent dla jednej wylosowanej osoby.');
		expect(sentence('3')).toBe('Każdy przygotowuje 3 prezenty dla jednej wylosowanej osoby.');
		expect(sentence('5')).toBe('Każdy przygotowuje 5 prezentów dla jednej wylosowanej osoby.');
		expect(sentence('22')).toBe('Każdy przygotowuje 22 prezenty dla jednej wylosowanej osoby.');
	});
});

describe('sanitizeRules', () => {
	it('drops unknown types and invalid values', () => {
		expect(
			sanitizeRules([
				{ type: 'nope', value: {} },
				{ type: 'gift_count', value: { n: '0' } },
				{ type: 'gift_count', value: { n: '2' } },
				{ type: 'max_cost', value: { amount: '99,5' } },
				{ type: 'secrecy', value: { option: 'hack' } }
			])
		).toEqual([
			{ type: 'gift_count', value: { n: '2' } },
			{ type: 'max_cost', value: { amount: '99.5' } },
			{ type: 'secrecy', value: { option: 'until_party' } }
		]);
	});
});
