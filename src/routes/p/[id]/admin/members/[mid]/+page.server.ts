import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { hashSecret, revokeMemberSessions } from '#lib/server/auth.ts';
import { formString, publicMember, requireAdmin } from '#lib/server/guards.ts';
import {
	clearAvatar,
	readNames,
	saveAvatar,
	validateNames,
	validatePasscode
} from '#lib/server/members.ts';
import { deleteMember, getMembers, touchDraw } from '#lib/server/party.ts';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function target(event: RequestEvent) {
	const ctx = requireAdmin(event);
	const member = db
		.select()
		.from(schema.members)
		.where(and(eq(schema.members.id, event.params.mid!), eq(schema.members.partyId, ctx.party.id)))
		.get();
	if (!member) error(404, 'not_found');
	return { ...ctx, member };
}

export const load: PageServerLoad = (event) => {
	const { member } = target(event);
	return { member: { ...publicMember(member), wishlist: member.wishlist } };
};

export const actions: Actions = {
	save: async (event) => {
		const { party, member, me } = target(event);
		const data = await event.request.formData();
		const names = readNames(data);
		const nameErr = validateNames(names, party.id, member.id);
		if (nameErr) return fail(400, { error: nameErr });

		const isAdmin = data.get('isAdmin') === 'on';
		const participates = party.drawnAt ? member.participates : data.get('participates') === 'on';
		const pass = String(data.get('passcode') ?? '');
		const removePass = data.get('removePasscode') === 'on' && !pass;
		const passErr = validatePasscode(pass, pass, false);
		if (passErr) return fail(400, { error: passErr });

		const willHavePass = pass ? true : removePass ? false : !!member.passcodeHash;
		if (isAdmin && !willHavePass) return fail(400, { error: 'admin_password_required' });
		if (!isAdmin && member.isAdmin) {
			const otherAdmins = getMembers(party.id).filter((x) => x.isAdmin && x.id !== member.id);
			if (!otherAdmins.length) return fail(400, { error: 'last_admin' });
		}

		const update: Partial<typeof schema.members.$inferInsert> = {
			...names,
			wishlist: formString(data, 'wishlist', 4000),
			isAdmin,
			participates
		};
		if (pass) update.passcodeHash = await hashSecret(pass);
		if (removePass) update.passcodeHash = null;
		db.update(schema.members).set(update).where(eq(schema.members.id, member.id)).run();
		if ((pass || removePass) && member.id !== me?.id) revokeMemberSessions(member.id);
		if (participates !== member.participates) touchDraw(party.id);
		return { ok: true };
	},
	avatar: async (event) => {
		const { member } = target(event);
		const err = await saveAvatar(member.id, (await event.request.formData()).get('avatar'));
		if (err) return fail(400, { error: err });
		return { ok: true };
	},
	removeAvatar: (event) => {
		const { member } = target(event);
		clearAvatar(member.id);
		return { ok: true };
	},
	delete: (event) => {
		const { party, member } = target(event);
		if (member.isAdmin && getMembers(party.id).filter((x) => x.isAdmin).length <= 1)
			return fail(400, { error: 'last_admin' });
		deleteMember(party.id, member.id);
		redirect(303, `/p/${party.id}/admin`);
	}
};
