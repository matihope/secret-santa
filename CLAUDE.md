# Secret Santa — agent guide

Family/generic Secret Santa manager. Read `docs/decisions.md` (why) and `docs/log.md` (history)
before larger changes; append to the log when you finish a chunk of work.

## Stack (newer than many models' training data — check `node_modules` types when unsure)

- **SvelteKit 3.2**, Svelte 5 runes (forced on), Vite 8, TypeScript 6, Tailwind v4.
- Env vars are declared in `src/env.ts` with `defineEnvVars` and imported from
  `$app/env/private` / `$app/env/public` (not `$env/...`).
- Package imports alias `#lib/*` → `src/lib/*`. **`$lib` does not exist in kit 3.** Imports need
  explicit extensions (`#lib/names.ts`, `./party.ts`); `allowImportingTsExtensions` is on.
- `SubmitFunction` type comes from `$app/forms`; hook types (`Handle`, `ServerInit`) from
  `@sveltejs/kit/hooks`. `+page.server.ts` may not export anything besides load/actions/config.
- Tailwind v4: custom classes (`card`, `btn-*`, `input`, `label`, `chip`…) are `@utility`
  blocks in `src/routes/layout.css` (`@apply` cannot use `@layer components` classes).
- Form actions (`+page.server.ts` `actions`, `use:enhance` from `$app/forms`) are used for all
  mutations. Remote functions exist but are not used.
- Drizzle ORM + better-sqlite3. Migrations in `drizzle/`, applied on boot in
  `src/lib/server/db/index.ts`. After editing `schema.ts`: `npm run db:generate`.
- Paraglide JS 2: **edit `scripts/messages.py`** (key → (en, pl)) and run
  `python3 scripts/messages.py` to regenerate `messages/{en,pl}.json`. Compiled output in
  `src/lib/paraglide` (gitignored; `npx @inlang/paraglide-js compile --project ./project.inlang
--outdir ./src/lib/paraglide` if svelte-check complains before a dev/build run).
  Use `import { m } from '#lib/paraglide/messages.js'`. Form-action errors return a key `x`
  rendered via `errorText()` → message `err_x`.

## Commands

- `npm run dev` — dev server
- `npm run check` — svelte-check + TS
- `npx vitest run` — unit tests (`*.spec.ts`)
- `npx playwright test` — e2e in `e2e/` (builds + previews on 4173 with `data-e2e/`);
  `PW_BASE_URL=… PW_ADMIN_PASSWORD=…` targets a running instance instead
- `npm run icons` — re-render iPhone/Android home-screen icons from `src/lib/assets/favicon.svg`
- `npm run screenshots` — regenerate README screenshots (build + throwaway preview + capture)
- `docker compose up -d --build` — production (port 8976)

## Layout

- `src/lib/server/` — db, auth (sessions, code access, rate limit), draw algorithm,
  party service, scheduler
- `src/lib/rules/catalog.ts` — rule types for the statute (questionnaire + builder)
- `src/lib/components/` — UI components (Logo, Countdown, Avatar, RuleBuilder, Obscured…)
- `src/routes/` — `/` home, `/new` wizard, `/p/[id]` overview (+ code gate, reveal),
  `/p/[id]/{join,login,me,admin,admin/members/[mid]}`, `/admin` site admin, `/uploads/[file]`
- Access checks: `src/lib/server/guards.ts` (`requireAccess` / `requireMember` / `requireAdmin`)
  — call one at the top of every party load/action.

## Conventions

- **Repo is public: never commit the owner's domain, IPs or other infra details.** Use
  placeholders (`santa.example.com`, `<server-lan-ip>`); real values stay in the local `.env`.

- All user-facing text goes through Paraglide (pl + en).
- Never expose assignments to admins in the UI.
- Wishlists in admin views are obscured until "Reveal" is clicked.
- Logo lives in two places: `Logo.svelte` (animated) and `src/lib/assets/favicon.svg` (static
  copy) — keep them in sync, then `npm run icons`.
- Times: UTC in DB, convert with `src/lib/time.ts` using the `TIMEZONE` env.
