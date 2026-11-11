export type NamedMember = { firstName: string; lastName: string; nickname: string };

export function displayName(m: NamedMember): string {
	return m.nickname.trim() || `${m.firstName} ${m.lastName}`.trim() || '?';
}

export function fullName(m: NamedMember): string {
	const real = `${m.firstName} ${m.lastName}`.trim();
	const nick = m.nickname.trim();
	if (nick && real) return `${nick} (${real})`;
	return nick || real || '?';
}

export function initials(m: NamedMember): string {
	const nick = m.nickname.trim();
	if (nick) return nick.slice(0, 2).toUpperCase();
	return ((m.firstName[0] ?? '') + (m.lastName[0] ?? '')).toUpperCase() || '?';
}
