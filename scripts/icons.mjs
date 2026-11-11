// Renders the home-screen icons in static/ from src/lib/assets/favicon.svg:
//   apple-touch-icon.png (180, iOS — must be opaque PNG, iOS rounds the corners itself),
//   icon-192.png / icon-512.png (manifest), icon-maskable-512.png (Android adaptive icons).
// Run `npm run icons` after changing the logo.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const logo = readFileSync('src/lib/assets/favicon.svg');
const BG = '#17382a';

async function icon(file, size, scale) {
	const inner = Math.round(size * scale);
	const art = await sharp(logo, { density: Math.ceil((72 * inner) / 120) * 2 })
		.resize(inner, inner)
		.png()
		.toBuffer();
	await sharp({ create: { width: size, height: size, channels: 3, background: BG } })
		.composite([
			{ input: art, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }
		])
		.flatten({ background: BG })
		.png({ compressionLevel: 9 })
		.toFile(`static/${file}`);
	console.log(`static/${file}`);
}

await icon('apple-touch-icon.png', 180, 0.82);
await icon('icon-192.png', 192, 0.82);
await icon('icon-512.png', 512, 0.82);
await icon('icon-maskable-512.png', 512, 0.66);
