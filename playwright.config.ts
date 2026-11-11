import { defineConfig } from '@playwright/test';

const external = process.env.PW_BASE_URL;

export default defineConfig({
	webServer: external
		? undefined
		: {
				command: 'rm -rf data-e2e && npm run build && npm run preview -- --port 4173',
				port: 4173,
				env: {
					DATABASE_URL: 'data-e2e/santa.db',
					DATA_DIR: 'data-e2e',
					SITE_ADMIN_PASSWORD: 'e2e-admin',
					COOKIE_SECURE: 'false',
					TIMEZONE: 'Europe/Warsaw'
				},
				reuseExistingServer: false,
				timeout: 180_000
			},
	use: { baseURL: external ?? 'http://localhost:4173', locale: 'en-US' },
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}'
});
