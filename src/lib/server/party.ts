import { and, asc, eq, inArray, isNull, lte } from 'drizzle-orm';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from '$app/env/private';
import { db, schema } from './db/index.ts';
import { drawAssignments } from './draw.ts';
import { newId, normalizeCode } from './ids.ts';
import type { RuleEntry } from '#lib/rules/catalog.ts';

export const uploadsDir = () => join(DATA_DIR, 'uploads');

export function findPartyByCode(code: string) {
	const norm = normalizeCode(code);
	if (!norm) return undefined;
	return db.select().from(schema.parties).where(eq(schema.parties.codeNorm, norm)).get();
}

export function getParty(id: string) {
	return db.select().from(schema.parties).where(eq(schema.parties.id, id)).get();
}

export function codeTaken(code: string, exceptPartyId?: string) {
	const p = findPartyByCode(code);
	return !!p && p.id !== exceptPartyId;
}

export function getRules(partyId: string): RuleEntry[] {
	return db
		.select()
		.from(schema.rules)
		.where(eq(schema.rules.partyId, partyId))
		.orderBy(asc(schema.rules.position))
		.all()
		.map((r) => ({ type: r.type, value: r.value }));
}

export function replaceRules(partyId: string, entries: RuleEntry[]) {
	db.transaction((tx) => {
		tx.delete(schema.rules).where(eq(schema.rules.partyId, partyId)).run();
		entries.forEach((e, i) =>
			tx
				.insert(schema.rules)
				.values({ id: newId(), partyId, type: e.type, value: e.value, position: i })
				.run()
		);
	});
}

export function getMembers(partyId: string) {
	return db
		.select()
		.from(schema.members)
		.where(eq(schema.members.partyId, partyId))
		.orderBy(asc(schema.members.createdAt))
		.all();
}

export function getExclusions(partyId: string) {
	return db.select().from(schema.exclusions).where(eq(schema.exclusions.partyId, partyId)).all();
}

/** Something affecting the draw changed: clear a stored draw failure so the scheduler retries. */
export function touchDraw(partyId: string) {
	db.update(schema.parties).set({ drawError: null }).where(eq(schema.parties.id, partyId)).run();
}

export type DrawOutcome = 'ok' | 'too_few' | 'impossible';

export function runDraw(partyId: string): DrawOutcome {
	return db.transaction((tx) => {
		const participants = tx
			.select({ id: schema.members.id })
			.from(schema.members)
			.where(and(eq(schema.members.partyId, partyId), eq(schema.members.participates, true)))
			.all()
			.map((m) => m.id);

		const fail = (reason: DrawOutcome) => {
			tx.update(schema.parties)
				.set({ drawError: reason })
				.where(eq(schema.parties.id, partyId))
				.run();
			return reason;
		};

		if (participants.length < 2) return fail('too_few');

		const ids = new Set(participants);
		const pairs = tx
			.select()
			.from(schema.exclusions)
			.where(and(eq(schema.exclusions.partyId, partyId), eq(schema.exclusions.status, 'accepted')))
			.all()
			.filter((e) => ids.has(e.requesterId) && ids.has(e.targetId))
			.map((e) => [e.requesterId, e.targetId] as [string, string]);

		const result = drawAssignments(participants, pairs);
		if (!result.ok) return fail('impossible');

		tx.delete(schema.assignments).where(eq(schema.assignments.partyId, partyId)).run();
		for (const [giverId, receiverId] of result.assignments) {
			tx.insert(schema.assignments).values({ partyId, giverId, receiverId }).run();
		}
		tx.update(schema.parties)
			.set({ drawnAt: new Date(), drawError: null })
			.where(eq(schema.parties.id, partyId))
			.run();
		return 'ok';
	});
}

export function resetDraw(partyId: string) {
	const party = getParty(partyId);
	db.transaction((tx) => {
		tx.delete(schema.assignments).where(eq(schema.assignments.partyId, partyId)).run();
		tx.update(schema.parties)
			.set({
				drawnAt: null,
				drawError: null,
				// a past deadline would trigger an immediate re-draw; admin sets a new one
				drawAt: party?.drawAt && party.drawAt > new Date() ? party.drawAt : null
			})
			.where(eq(schema.parties.id, partyId))
			.run();
	});
}

/** Draws every party whose deadline passed. Returns ids drawn. */
export function drawDueParties(now = new Date()): string[] {
	const due = db
		.select({ id: schema.parties.id })
		.from(schema.parties)
		.where(
			and(
				lte(schema.parties.drawAt, now),
				isNull(schema.parties.drawnAt),
				isNull(schema.parties.archivedAt),
				isNull(schema.parties.drawError)
			)
		)
		.all();
	return due.filter((p) => runDraw(p.id) === 'ok').map((p) => p.id);
}

export function getAssignment(partyId: string, giverId: string) {
	const a = db
		.select()
		.from(schema.assignments)
		.where(and(eq(schema.assignments.partyId, partyId), eq(schema.assignments.giverId, giverId)))
		.get();
	if (!a) return null;
	return db.select().from(schema.members).where(eq(schema.members.id, a.receiverId)).get() ?? null;
}

export function removeAvatarFile(avatar: string | null) {
	if (!avatar || !/^[a-z0-9-]+\.webp$/.test(avatar)) return;
	rmSync(join(uploadsDir(), avatar), { force: true });
}

export function deleteMember(partyId: string, memberId: string) {
	const member = db
		.select()
		.from(schema.members)
		.where(and(eq(schema.members.id, memberId), eq(schema.members.partyId, partyId)))
		.get();
	if (!member) return;
	const party = getParty(partyId);
	if (party?.drawnAt) resetDraw(partyId);
	db.delete(schema.members).where(eq(schema.members.id, memberId)).run();
	removeAvatarFile(member.avatar);
	touchDraw(partyId);
}

export function deleteParty(partyId: string) {
	const members = getMembers(partyId);
	db.delete(schema.parties).where(eq(schema.parties.id, partyId)).run();
	members.forEach((m) => removeAvatarFile(m.avatar));
}

export function partiesByIds(ids: string[]) {
	if (!ids.length) return [];
	return db.select().from(schema.parties).where(inArray(schema.parties.id, ids)).all();
}
