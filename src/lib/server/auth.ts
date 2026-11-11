import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { and, eq, gt, lt } from 'drizzle-orm';
import { COOKIE_SECURE, SITE_ADMIN_PASSWORD } from '$app/env/private';
import { db, schema } from './db/index.ts';
import { newToken } from './ids.ts';
import type { Member, Party } from './db/schema.ts';

const SESSION_DAYS = 90;
const cookieOpts = () => ({
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: COOKIE_SECURE,
	maxAge: SESSION_DAYS * 24 * 3600
});

export const memberCookie = (partyId: string) => `ss_m_${partyId}`;
export const codeCookie = (partyId: string) => `ss_c_${partyId}`;
const ADMIN_COOKIE = 'ss_admin';

/* ---------- hashing ---------- */

export const hashSecret = (secret: string) => hash(secret);
export async function verifySecret(hashed: string, secret: string) {
	try {
		return await verify(hashed, secret);
	} catch {
		return false;
	}
}

/* ---------- app secret (for signed cookies) ---------- */

let appSecret: string | undefined;
function getAppSecret(): string {
	if (appSecret) return appSecret;
	const row = db.select().from(schema.settings).where(eq(schema.settings.key, 'secret')).get();
	if (row) return (appSecret = row.value);
	const value = randomBytes(32).toString('base64url');
	db.insert(schema.settings).values({ key: 'secret', value }).onConflictDoNothing().run();
	return (appSecret = db
		.select()
		.from(schema.settings)
		.where(eq(schema.settings.key, 'secret'))
		.get()!.value);
}

function sign(data: string) {
	return createHmac('sha256', getAppSecret()).update(data).digest('base64url');
}

function safeEqual(a: string, b: string) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/* ---------- party code access ---------- */

export function grantCodeAccess(cookies: Cookies, party: Pick<Party, 'id' | 'codeNorm'>) {
	cookies.set(codeCookie(party.id), sign(`${party.id}:${party.codeNorm}`), cookieOpts());
}

export function hasCodeAccess(cookies: Cookies, party: Pick<Party, 'id' | 'codeNorm'>) {
	const value = cookies.get(codeCookie(party.id));
	return !!value && safeEqual(value, sign(`${party.id}:${party.codeNorm}`));
}

/* ---------- sessions ---------- */

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

function createSession(values: { memberId?: string; isSiteAdmin?: boolean }) {
	const token = newToken();
	db.insert(schema.sessions)
		.values({
			id: tokenHash(token),
			memberId: values.memberId ?? null,
			isSiteAdmin: values.isSiteAdmin ?? false,
			expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)
		})
		.run();
	return token;
}

function validSession(token: string | undefined) {
	if (!token) return null;
	return (
		db
			.select()
			.from(schema.sessions)
			.where(
				and(eq(schema.sessions.id, tokenHash(token)), gt(schema.sessions.expiresAt, new Date()))
			)
			.get() ?? null
	);
}

export function loginMember(cookies: Cookies, member: Pick<Member, 'id' | 'partyId'>) {
	cookies.set(memberCookie(member.partyId), createSession({ memberId: member.id }), cookieOpts());
}

export function getSessionMember(cookies: Cookies, partyId: string): Member | null {
	const session = validSession(cookies.get(memberCookie(partyId)));
	if (!session?.memberId) return null;
	const member = db
		.select()
		.from(schema.members)
		.where(and(eq(schema.members.id, session.memberId), eq(schema.members.partyId, partyId)))
		.get();
	return member ?? null;
}

export function logoutMember(cookies: Cookies, partyId: string) {
	const token = cookies.get(memberCookie(partyId));
	if (token)
		db.delete(schema.sessions)
			.where(eq(schema.sessions.id, tokenHash(token)))
			.run();
	cookies.delete(memberCookie(partyId), { path: '/' });
}

/** Drops all sessions of a member (e.g. after a passcode change by an admin). */
export function revokeMemberSessions(memberId: string) {
	db.delete(schema.sessions).where(eq(schema.sessions.memberId, memberId)).run();
}

/** Party ids this browser is logged into. */
export function joinedPartyIds(cookies: Cookies): string[] {
	return cookies
		.getAll()
		.filter((c) => c.name.startsWith('ss_m_'))
		.filter((c) => validSession(c.value)?.memberId)
		.map((c) => c.name.slice(5));
}

/* ---------- site admin ---------- */

export const siteAdminEnabled = () => SITE_ADMIN_PASSWORD.length > 0;

export function checkSiteAdminPassword(password: string) {
	return siteAdminEnabled() && safeEqual(sign(password), sign(SITE_ADMIN_PASSWORD));
}

export function loginSiteAdmin(cookies: Cookies) {
	cookies.set(ADMIN_COOKIE, createSession({ isSiteAdmin: true }), {
		...cookieOpts(),
		maxAge: 7 * 24 * 3600
	});
}

export function isSiteAdmin(cookies: Cookies) {
	return siteAdminEnabled() && !!validSession(cookies.get(ADMIN_COOKIE))?.isSiteAdmin;
}

export function logoutSiteAdmin(cookies: Cookies) {
	const token = cookies.get(ADMIN_COOKIE);
	if (token)
		db.delete(schema.sessions)
			.where(eq(schema.sessions.id, tokenHash(token)))
			.run();
	cookies.delete(ADMIN_COOKIE, { path: '/' });
}

export function purgeExpiredSessions() {
	db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).run();
}

/* ---------- rate limiting ---------- */

const attempts = new Map<string, { count: number; reset: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_FAILS = 20;

function clientKey(event: RequestEvent, bucket: string) {
	let ip = 'unknown';
	try {
		ip = event.getClientAddress();
	} catch {
		/* ignore */
	}
	return `${bucket}:${ip}`;
}

export function isRateLimited(event: RequestEvent, bucket: string) {
	const entry = attempts.get(clientKey(event, bucket));
	return !!entry && entry.reset > Date.now() && entry.count >= MAX_FAILS;
}

export function recordFailure(event: RequestEvent, bucket: string) {
	const key = clientKey(event, bucket);
	const now = Date.now();
	const entry = attempts.get(key);
	if (!entry || entry.reset < now) attempts.set(key, { count: 1, reset: now + WINDOW });
	else entry.count++;
}
