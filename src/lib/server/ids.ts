import { randomInt, randomBytes } from 'node:crypto';

const ID_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function pick(alphabet: string, n: number): string {
	let s = '';
	for (let i = 0; i < n; i++) s += alphabet[randomInt(alphabet.length)];
	return s;
}

export const newId = (n = 12) => pick(ID_ALPHABET, n);

export const newToken = () => randomBytes(32).toString('base64url');

/** Random party code like `K7QM-4XPA`. */
export const generatePartyCode = () => `${pick(CODE_ALPHABET, 4)}-${pick(CODE_ALPHABET, 4)}`;

/** Normalized form used for lookups: uppercase, letters/digits only. */
export const normalizeCode = (code: string) =>
	code
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '');

/** Validates a custom code. Returns cleaned display form or null. */
export function cleanCustomCode(code: string): string | null {
	const display = code.trim().toUpperCase().replace(/\s+/g, '-');
	if (!/^[A-Z0-9-]+$/.test(display)) return null;
	const norm = normalizeCode(display);
	if (norm.length < 4 || norm.length > 32) return null;
	return display;
}
