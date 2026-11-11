import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { uploadsDir } from '#lib/server/party.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	if (!/^[a-z0-9]+-[a-z0-9]+\.webp$/.test(params.file)) error(404);
	try {
		const body = await readFile(join(uploadsDir(), params.file));
		return new Response(body, {
			headers: {
				'content-type': 'image/webp',
				'cache-control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		error(404);
	}
};
