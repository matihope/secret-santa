import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { and, eq, inArray, or } from 'drizzle-orm';
import { db, schema } from './db/index.ts';
import { newId } from './ids.ts';
import { getMembers, removeAvatarFile, uploadsDir } from './party.ts';
import { displayName } from '#lib/names.ts';
import { formString } from './guards.ts';

export type NameFields = { firstName: string; lastName: string; nickname: string };

export function readNames(data: FormData): NameFields {
	return {
		firstName: formString(data, 'firstName', 60),
		lastName: formString(data, 'lastName', 60),
		nickname: formString(data, 'nickname', 60)
	};
}

/** Returns an error message key or null. */
export function validateNames(
	names: NameFields,
	partyId: string,
	exceptId?: string
): 'name_required' | 'name_taken' | null {
	if (!names.nickname && !names.firstName) return 'name_required';
	const wanted = displayName(names).toLocaleLowerCase();
	const clash = getMembers(partyId).some(
		(m) => m.id !== exceptId && displayName(m).toLocaleLowerCase() === wanted
	);
	return clash ? 'name_taken' : null;
}

/** Returns an error message key or null. */
export function validatePasscode(
	pass: string,
	repeat: string,
	required: boolean
): 'passcode_required' | 'passcode_short' | 'passcode_mismatch' | null {
	if (!pass) return required ? 'passcode_required' : null;
	if (pass.length < 4) return 'passcode_short';
	if (pass !== repeat) return 'passcode_mismatch';
	return null;
}

export function createMember(
	partyId: string,
	values: NameFields & { passcodeHash: string | null; isAdmin?: boolean; participates?: boolean }
) {
	const id = newId();
	db.insert(schema.members)
		.values({
			id,
			partyId,
			...values,
			isAdmin: values.isAdmin ?? false,
			participates: values.participates ?? true
		})
		.run();
	return db.select().from(schema.members).where(eq(schema.members.id, id)).get()!;
}

export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/** Resizes and stores an uploaded avatar. Returns error key or null. */
export async function saveAvatar(
	memberId: string,
	file: FormDataEntryValue | null
): Promise<'avatar_invalid' | 'avatar_too_big' | null> {
	if (!(file instanceof File) || file.size === 0) return 'avatar_invalid';
	if (file.size > MAX_AVATAR_BYTES) return 'avatar_too_big';
	let output: Buffer;
	try {
		output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
			.rotate()
			.resize(320, 320, { fit: 'cover', position: 'attention' })
			.webp({ quality: 82 })
			.toBuffer();
	} catch {
		return 'avatar_invalid';
	}
	const dir = uploadsDir();
	mkdirSync(dir, { recursive: true });
	const name = `${memberId}-${newId(6)}.webp`;
	writeFileSync(join(dir, name), output);
	const old = db.select().from(schema.members).where(eq(schema.members.id, memberId)).get();
	db.update(schema.members).set({ avatar: name }).where(eq(schema.members.id, memberId)).run();
	removeAvatarFile(old?.avatar ?? null);
	return null;
}

export function clearAvatar(memberId: string) {
	const m = db.select().from(schema.members).where(eq(schema.members.id, memberId)).get();
	db.update(schema.members).set({ avatar: null }).where(eq(schema.members.id, memberId)).run();
	removeAvatarFile(m?.avatar ?? null);
}

/** Active (pending/accepted) exclusions touching any of the given members. */
export function activeExclusionsFor(partyId: string, memberIds: string[]) {
	return db
		.select()
		.from(schema.exclusions)
		.where(
			and(
				eq(schema.exclusions.partyId, partyId),
				inArray(schema.exclusions.status, ['pending', 'accepted']),
				or(
					inArray(schema.exclusions.requesterId, memberIds),
					inArray(schema.exclusions.targetId, memberIds)
				)
			)
		)
		.all();
}
