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
  Manager proxies the public domain → `http://<server-lan-ip>:8976`, `.env` + `.env.example`,
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

## 2026-11-11 — deployed

- Production `.env` written (random `SITE_ADMIN_PASSWORD`, `ORIGIN` = public URL,
  `ADDRESS_HEADER=X-Forwarded-For`), `docker compose up -d --build`, container on :8976.
- Owner added the NPM proxy host → `http://<server-lan-ip>:8976` with their wildcard cert. Verified over public HTTPS: valid cert + HTTP/2, form POSTs pass the
  origin check, cookies `Secure; HttpOnly; SameSite=Lax`, 7.9 MB photo upload goes through
  NPM and is resized; throwaway test party deleted afterwards (DB left empty).
- Note: public port 80 times out for every host on the owner's domain (not app-specific), so the HTTP→HTTPS
  redirect can't be observed from outside; on the LAN :80 serves plain HTTP for both hosts.

- Owner's domain and LAN IP must not appear in the (public) repo — use placeholders like
  `santa.example.com` / `<server-lan-ip>`. Real values live only in the local `.env`.
- README screenshots added (`scripts/screenshots.mjs`, demo data on a local preview build).
- Clarified the `gift_count` rule: everyone still draws ONE person and prepares N gifts for
  them (old wording "Each person gives N gifts" read like giving to N people). Unit tests in
  `src/lib/rules/catalog.spec.ts` cover the sentence and Polish plurals.

## 2026-11-11 — logo + language picker

- Logo/favicon: the "shh" mitten finger could be read as rude, replaced with a zipped mouth
  (lips sealed) whose pull tab swings with the wiggle animation.
- Language switch is now a drop-down (`LangSwitch.svelte`, ARIA menu with menuitemradio,
  arrow keys / Escape) showing a flag + native name. Flags are SVGs in `static/flags/` (emoji
  flags don't render on Windows); the name is primary, the flag decorative.
- `src/lib/languages.ts` is the per-language registry (name, flag, Intl tag, quotes) typed as
  `Record<Locale, …>`; time/currency formatting and rule quotes use it instead of `=== 'pl'`.
  `scripts/messages.py` has `LANGS` and asserts every entry has all columns.

- App name is a brand constant (`src/lib/brand.ts`, "Secret Santa" in every language) instead
  of the `app_name` message; Polish no longer shows "Tajny Mikołaj" as the title. Descriptive
  Polish text (e.g. "Impreza Tajnego Mikołaja", rules) still uses the Polish term.
- Polish party eyebrow is "Impreza Secret-Santa" (owner found "Impreza Tajnego Mikołaja"
  silly); guess-your-Santa rule says just "Mikołajem".
- `npm run screenshots` (`scripts/screenshots.sh`) automates build → throwaway preview on
  :4174 with fresh `data-shots/` → capture → server shutdown.
- Logo: owner picked the "bandit mask" candidate out of 10 (gift in a Santa hat wearing a
  domino mask with fluttering ties, shifty eyes, sly smile). Replaces the zipper mouth.
- Logo hat hops and tilts after the wiggle (own `.hat` group; the inner group keeps the static
  -9° tilt because a CSS transform would override the `transform` attribute).
- Home-screen icons: `npm run icons` (`scripts/icons.mjs`) renders opaque PNGs on pine from
  the favicon — `apple-touch-icon.png` (iOS ignores SVG), 192/512 + maskable for the
  manifest. Manifest uses `display: "browser"` on purpose: a standalone home-screen app on iOS
  gets its own cookie jar, so people would have to re-enter the party code and log in again.
- Members without a photo get a generated cartoon person (`src/lib/avatar-art.ts`, seeded by
  member id, so the face is stable across renames) instead of coloured initials. Same
  generator draws the README demo avatars (`scripts/screenshots.mjs` imports the .ts file via
  Node type stripping).
- Home-screen app now opens full screen (`display: "standalone"` + apple-mobile-web-app-capable),
  on the owner's request. Trade-off: iOS gives a home-screen app its own cookie jar, so after
  "Add to Home Screen" people enter the party code and log in once more inside the app. Every
  page keeps in-app navigation (logo → home, party tabs, back links) since there is no browser
  back button.
