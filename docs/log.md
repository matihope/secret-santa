# Work log

Chronological notes of what was built and why. Newest at the bottom. Agents: append an entry when you finish a chunk of work.

## 2026-11-11 — initial build (Claude Code)

- Requirements gathered from the owner (family Secret Santa, generic). Plan approved:
  SvelteKit + SQLite, auto-draw at deadline, per-party members, anyone can create a party,
  admin participation optional, home lists public parties + parties joined in this browser.
- Repo initialised and pushed to `git@github.com:matihope/secret-santa.git` (HTTPS remote had
  no credentials; switched to SSH, which works for user `matihope`).
- Scaffolded with `npx sv create` (sv 1.3.0) → **SvelteKit 3.2 / Svelte 5 / Vite 8 / TS 6**,
  add-ons: prettier, vitest (unit), playwright, tailwind v4 (+forms), adapter-node, drizzle
  (sqlite, better-sqlite3), paraglide (pl base, en).
- Deploy pattern copied from `~/code/video-player`: publish a host port (8976), Nginx Proxy
  Manager proxies `santa.example.com` → `http://<server-lan-ip>:8976`, `.env` + `.env.example`,
  container user uid 1000, data in `./data`.
- Server core written: schema, auth (sessions, signed code-access cookies, rate limit),
  draw algorithm (TDD, `src/lib/server/draw.spec.ts`), rule catalog, party service.
- UI built: home (code entry, my/public parties), 4-step creation wizard (basics →
  questionnaire → rule builder + live statute → admin identity), party overview with countdown,
  statute, members and gift "unwrap" reveal, join/login, member profile (avatar, wishlist,
  couple exclusions, passcode), party admin panel, member editor, site admin, error page.
- Design: vintage Christmas card — cream paper with grain, pine/cranberry/gold, Fraunces
  (wonky) + Bricolage Grotesque (self-hosted via @fontsource). Logo: sneaky gift box in a Santa
  hat with shifty eyes and a "shh" mitten (`src/lib/components/Logo.svelte`, also favicon).
- Gotchas hit: kit 3 has no `$lib` and needs `.ts` extensions; Tailwind v4 needs `@utility`;
  better-sqlite3 has no prebuilt for node 24 in Docker → build stage installs python3/make/g++;
  without `ORIGIN` adapter-node assumes https and rejects form POSTs (403).
- Verified: `npm run check` clean, unit tests (draw) pass, Playwright e2e passes against the
  preview build and against the Docker image (create → join ×3 → avatar → couple exclusion →
  obscured wishlist → draw → valid reveals → join locked → archive/unarchive → PL; site admin).
- Not done yet: NPM proxy host for santa.example.com (to set up together with the owner).
