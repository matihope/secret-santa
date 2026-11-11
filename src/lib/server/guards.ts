import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { getSessionMember, hasCodeAccess, isSiteAdmin } from './auth.ts';
import { getParty, runDraw } from './party.ts';
import type { Member, Party } from './db/schema.ts';

export type PartyContext = {
	party: Party;
	me: Member | null;
	siteAdmin: boolean;
	access: boolean;
	/** Members and the site admin see the whole party; code-only guests just the name + join/login. */
	insider: boolean;
	canAdmin: boolean;
};

/** Loads the party for `/p/[id]/…` and resolves who is looking at it. */
export function partyContext(event: RequestEvent): PartyContext {
	const id = event.params.id;
	if (!id) error(404);
	let party = getParty(id);
	if (!party) error(404, 'not_found');

	// lazy auto-draw in case the scheduler hasn't ticked yet
	if (
		party.drawAt &&
		party.drawAt <= new Date() &&
		!party.drawnAt &&
		!party.archivedAt &&
		!party.drawError
	) {
		runDraw(party.id);
		party = getParty(id)!;
	}

	const siteAdmin = isSiteAdmin(event.cookies);
	const me = getSessionMember(event.cookies, party.id);
	const access = siteAdmin || !!me || hasCodeAccess(event.cookies, party);
	return {
		party,
		me,
		siteAdmin,
		access,
		insider: siteAdmin || !!me,
		canAdmin: siteAdmin || !!me?.isAdmin
	};
}

export function requireAccess(event: RequestEvent) {
	const ctx = partyContext(event);
	if (!ctx.access) redirect(303, `/p/${ctx.party.id}`);
	return ctx;
}

export function requireMember(event: RequestEvent) {
	const ctx = requireAccess(event);
	if (!ctx.me) redirect(303, `/p/${ctx.party.id}/login`);
	return { ...ctx, me: ctx.me };
}

export function requireAdmin(event: RequestEvent) {
	const ctx = requireAccess(event);
	if (!ctx.canAdmin) redirect(303, `/p/${ctx.party.id}`);
	return ctx;
}

/** Fields safe to send to any party viewer. */
export function publicMember(m: Member) {
	return {
		id: m.id,
		firstName: m.firstName,
		lastName: m.lastName,
		nickname: m.nickname,
		avatar: m.avatar,
		isAdmin: m.isAdmin,
		participates: m.participates,
		hasPasscode: !!m.passcodeHash
	};
}
export type PublicMember = ReturnType<typeof publicMember>;

/** Party fields safe for viewers with access (no code). */
export function publicParty(p: Party) {
	const { codeNorm: _n, code: _c, ...rest } = p;
	return rest;
}

export const formString = (data: FormData, key: string, max = 200) =>
	String(data.get(key) ?? '')
		.trim()
		.slice(0, max);
