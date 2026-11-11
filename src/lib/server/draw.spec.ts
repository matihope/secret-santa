import { describe, expect, it } from 'vitest';
import { drawAssignments } from './draw.ts';

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function assertValid(ids: string[], result: Map<string, string>, pairs: [string, string][] = []) {
	expect(result.size).toBe(ids.length);
	expect(new Set(result.values()).size).toBe(ids.length);
	for (const [giver, receiver] of result) {
		expect(giver).not.toBe(receiver);
		expect(ids).toContain(receiver);
	}
	for (const [a, b] of pairs) {
		expect(result.get(a)).not.toBe(b);
		expect(result.get(b)).not.toBe(a);
	}
}

describe('drawAssignments', () => {
	it('produces a valid derangement', () => {
		for (let n = 2; n <= 12; n++) {
			const ids = people(n);
			const r = drawAssignments(ids, []);
			expect(r.ok).toBe(true);
			if (r.ok) assertValid(ids, r.assignments);
		}
	});

	it('honours exclusions in both directions over many runs', () => {
		const ids = people(6);
		const pairs: [string, string][] = [
			['p0', 'p1'],
			['p2', 'p3']
		];
		for (let i = 0; i < 500; i++) {
			const r = drawAssignments(ids, pairs);
			expect(r.ok).toBe(true);
			if (r.ok) assertValid(ids, r.assignments, pairs);
		}
	});

	it('avoids mutual pairs when possible', () => {
		const ids = people(5);
		for (let i = 0; i < 200; i++) {
			const r = drawAssignments(ids, []);
			expect(r.ok).toBe(true);
			if (!r.ok) continue;
			for (const [g, rec] of r.assignments) expect(r.assignments.get(rec)).not.toBe(g);
		}
	});

	it('is random', () => {
		const ids = people(5);
		const seen = new Set<string>();
		for (let i = 0; i < 100; i++) {
			const r = drawAssignments(ids, []);
			if (r.ok) seen.add(ids.map((id) => r.assignments.get(id)).join());
		}
		expect(seen.size).toBeGreaterThan(5);
	});

	it('detects impossible configurations', () => {
		expect(drawAssignments(['a'], []).ok).toBe(false);
		expect(drawAssignments([], []).ok).toBe(false);
		expect(drawAssignments(['a', 'b'], [['a', 'b']]).ok).toBe(false);
		// a couple among three people: a and b can only give to c
		expect(drawAssignments(['a', 'b', 'c'], [['a', 'b']]).ok).toBe(false);
	});

	it('works for 4 people with 2 couples', () => {
		const pairs: [string, string][] = [
			['a', 'b'],
			['c', 'd']
		];
		const r = drawAssignments(['a', 'b', 'c', 'd'], pairs);
		expect(r.ok).toBe(true);
		if (r.ok) assertValid(['a', 'b', 'c', 'd'], r.assignments, pairs);
	});
});
