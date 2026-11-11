import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (fallback: string) => (value: string | undefined) =>
	value === undefined || value === '' ? fallback : value;

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Path to the SQLite database file.',
		schema: optional('data/santa.db')
	},
	DATA_DIR: {
		description: 'Directory for uploaded files (avatars).',
		schema: optional('./data')
	},
	SITE_ADMIN_PASSWORD: {
		description: 'Password for the website admin panel at /admin. Panel is disabled when empty.',
		schema: optional('')
	},
	COOKIE_SECURE: {
		description: 'Set to "false" to allow cookies over plain HTTP (LAN testing).',
		schema: (value) => value !== 'false'
	},
	TIMEZONE: {
		description: 'IANA timezone used to display and enter dates.',
		public: true,
		schema: optional('Europe/Warsaw')
	}
});
