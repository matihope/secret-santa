import { randomInt } from 'node:crypto';

export type DrawResult = { ok: true; assignments: Map<string, string> } | { ok: false };

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = randomInt(i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/**
 * Randomly assigns each participant a different participant to give a gift to.
 * `pairs` are mutual exclusions: neither person may draw the other.
 * Tries to avoid mutual pairs (A→B and B→A) when possible.
 */
export function drawAssignments(ids: string[], pairs: [string, string][]): DrawResult {
	if (ids.length < 2) return { ok: false };
	const forbidden = new Set<string>();
	for (const [a, b] of pairs) {
		forbidden.add(`${a}>${b}`);
		forbidden.add(`${b}>${a}`);
	}
	const allowed = (g: string, r: string) => g !== r && !forbidden.has(`${g}>${r}`);

	for (const avoidMutual of [true, false]) {
		if (avoidMutual && ids.length < 3) continue;
		const result = search(shuffle(ids), allowed, avoidMutual);
		if (result) return { ok: true, assignments: result };
	}
	return { ok: false };
}

function search(
	givers: string[],
	allowed: (g: string, r: string) => boolean,
	avoidMutual: boolean
): Map<string, string> | null {
	const assigned = new Map<string, string>();
	const taken = new Set<string>();
	let steps = 0;

	const step = (i: number): boolean => {
		if (++steps > 200_000) return false;
		if (i === givers.length) return true;
		const giver = givers[i];
		for (const receiver of shuffle(givers)) {
			if (taken.has(receiver) || !allowed(giver, receiver)) continue;
			if (avoidMutual && assigned.get(receiver) === giver) continue;
			assigned.set(giver, receiver);
			taken.add(receiver);
			if (step(i + 1)) return true;
			assigned.delete(giver);
			taken.delete(receiver);
		}
		return false;
	};

	return step(0) ? assigned : null;
}
