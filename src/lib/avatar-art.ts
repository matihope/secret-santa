// Cartoon avatars for members without a photo. Pure (no app imports) so that
// scripts/screenshots.mjs can import it directly with Node's type stripping.

export type HairStyle = 'short' | 'long' | 'bun' | 'bald' | 'curly';

export type AvatarTraits = {
	bg: string;
	skin: string;
	hair: string;
	style: HairStyle;
	shirt: string;
	glasses?: boolean;
	hat?: boolean;
	beard?: boolean;
};

const BGS = [
	'#e9c36a',
	'#cfe3d6',
	'#f3d9d9',
	'#efe4cf',
	'#dbe7f0',
	'#fde2c4',
	'#e6dcf0',
	'#d6ead9',
	'#f7d6dc'
];
const SKINS = [
	'#f8d6c0',
	'#f6d2b8',
	'#f2c9a5',
	'#eac0a0',
	'#d9a77f',
	'#c99a76',
	'#a8754f',
	'#7d5236'
];
const HAIRS = [
	'#2e2420',
	'#1f1612',
	'#3a2416',
	'#5a3b26',
	'#a0522d',
	'#c26b2c',
	'#e0a84a',
	'#d9d6d0'
];
const SHIRTS = ['#17382a', '#24523d', '#b4232f', '#8f1a24', '#c8962b', '#3d5a80', '#6b5a4e'];
const STYLES: HairStyle[] = ['short', 'short', 'long', 'long', 'bun', 'curly', 'curly', 'bald'];

/** Deterministic pseudo-random generator seeded from a string (FNV-1a + mulberry32). */
function rng(seed: string) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
	let a = h >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Same seed → same person. */
export function traitsFor(seed: string): AvatarTraits {
	const r = rng(seed);
	const pick = <T>(list: T[]) => list[Math.floor(r() * list.length)];
	const style = pick(STYLES);
	return {
		bg: pick(BGS),
		skin: pick(SKINS),
		hair: pick(HAIRS),
		style,
		shirt: pick(SHIRTS),
		glasses: r() < 0.25,
		hat: r() < 0.2,
		beard: (style === 'short' || style === 'bald') && r() < 0.3
	};
}

export function avatarSvg({
	bg,
	skin,
	hair,
	style,
	shirt,
	glasses,
	hat,
	beard
}: AvatarTraits): string {
	const hairBack =
		style === 'long'
			? `<ellipse cx="160" cy="175" rx="92" ry="105" fill="${hair}"/>`
			: style === 'bun'
				? `<circle cx="160" cy="62" r="34" fill="${hair}"/>`
				: style === 'curly'
					? `<g fill="${hair}"><circle cx="92" cy="150" r="26"/><circle cx="228" cy="150" r="26"/><circle cx="96" cy="190" r="20"/><circle cx="224" cy="190" r="20"/></g>`
					: '';
	const hairTop =
		style === 'bald'
			? `<path d="M88 150 q-6 -30 10 -40 M232 150 q6 -30 -10 -40" stroke="${hair}" stroke-width="16" stroke-linecap="round" fill="none"/>`
			: style === 'curly'
				? `<g fill="${hair}"><circle cx="100" cy="118" r="28"/><circle cx="128" cy="88" r="30"/><circle cx="162" cy="78" r="32"/><circle cx="196" cy="88" r="30"/><circle cx="222" cy="118" r="28"/><circle cx="160" cy="108" r="30"/></g>`
				: `<path d="M86 150 C 84 85, 130 62, 160 62 C 200 62, 238 85, 234 150 C 220 112, 190 100, 160 104 C 128 100, 100 115, 86 150 Z" fill="${hair}"/>`;
	const mouth = `<path d="M138 188 q22 20 44 0" stroke="#7a2a22" stroke-width="6" fill="none" stroke-linecap="round"/>`;
	const beardSvg = beard
		? `<path d="M90 160 C 92 250, 228 250, 230 160 C 214 196, 106 196, 90 160 Z" fill="${hair}"/><path d="M140 196 q20 12 40 0" stroke="#fff" stroke-opacity=".55" stroke-width="6" fill="none" stroke-linecap="round"/>`
		: mouth;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
<rect width="320" height="320" fill="${bg}"/>
<path d="M40 330 C 50 250, 110 228, 160 228 C 210 228, 270 250, 280 330 Z" fill="${shirt}"/>
${hairBack}
<rect x="140" y="196" width="40" height="40" rx="12" fill="${skin}"/>
<ellipse cx="160" cy="150" rx="74" ry="80" fill="${skin}"/>
<circle cx="86" cy="158" r="12" fill="${skin}"/><circle cx="234" cy="158" r="12" fill="${skin}"/>
${hairTop}
<circle cx="132" cy="152" r="8" fill="#2b1d17"/><circle cx="188" cy="152" r="8" fill="#2b1d17"/>
<circle cx="134.5" cy="149.5" r="2.5" fill="#fff"/><circle cx="190.5" cy="149.5" r="2.5" fill="#fff"/>
<circle cx="114" cy="180" r="11" fill="#ff8a8a" opacity=".45"/><circle cx="206" cy="180" r="11" fill="#ff8a8a" opacity=".45"/>
${beardSvg}
${glasses ? `<g fill="none" stroke="#2b1d17" stroke-width="5"><circle cx="132" cy="152" r="20"/><circle cx="188" cy="152" r="20"/><path d="M152 150 h16"/></g>` : ''}
${hat ? `<path d="M80 108 C 100 40, 170 10, 230 40 C 250 50, 262 70, 262 92 C 240 80, 220 80, 210 92 C 220 96, 232 102, 240 110 Z" fill="#b4232f"/><rect x="74" y="98" width="172" height="24" rx="12" fill="#fffdf8"/><circle cx="262" cy="96" r="16" fill="#fffdf8"/>` : ''}
</svg>`;
}

export const avatarDataUri = (seed: string) =>
	`data:image/svg+xml,${encodeURIComponent(avatarSvg(traitsFor(seed)))}`;
