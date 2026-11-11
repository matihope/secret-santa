import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema.ts';
import { DATABASE_URL } from '$app/env/private';

mkdirSync(dirname(resolve(DATABASE_URL)), { recursive: true });

const client = new Database(DATABASE_URL);
client.pragma('journal_mode = WAL');
client.pragma('foreign_keys = ON');

export const db = drizzle(client, { schema });

migrate(db, { migrationsFolder: resolve(process.env.MIGRATIONS_DIR ?? 'drizzle') });

export { schema };
