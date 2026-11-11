# Decisions

Short records of non-obvious choices. Add new ones at the bottom.

## Accounts are per party

A "member" belongs to one party (name + optional passcode). No global users. Matches a family
use case where people join once a year with a code. One browser can be logged into several
parties: the session cookie is per party (`ss_m_<partyId>`).

## Party access = code, not URL

URLs use a random party id (`/p/<id>`), so sharing a URL does not grant access. Entering the
code sets a signed cookie `ss_c_<partyId>` = HMAC(`id:codeNorm`). Changing the code revokes
code-only access; logged-in members keep access through their session.
The HMAC secret is generated on first use and stored in the `settings` table (no env var).

## Passcode optional, admin password mandatory

Members without a passcode can be impersonated by anyone with the party code. UI warns and
nudges. Party admins (members with `isAdmin`) must have a password.

## Website admin via env

`SITE_ADMIN_PASSWORD` enables `/admin`. Empty = disabled. No admin users table.

## Draw

- Randomized backtracking (`src/lib/server/draw.ts`), first tries to avoid mutual pairs
  (A→B and B→A), then allows them. Exclusions (accepted) block both directions.
- Auto-draw: scheduler every 30 s (`hooks.server.ts` init) + lazy check on party load.
- A failed draw stores `drawError` and the scheduler skips that party until something
  changes (member/exclusion/participation edits call `touchDraw`) or the admin retries.
- Resetting a draw clears `drawAt` if it is already in the past, otherwise the scheduler
  would immediately re-draw.
- Deleting a member after the draw resets the draw.
- Nobody (party or site admin) can see assignments in the UI — no spoilers.

## Rules are data, sentences are rendered

Rules are stored as `{type, value}` rows. The sentence is rendered at view time from Paraglide
messages, so the statute shows in the viewer's language. Catalog: `src/lib/rules/catalog.ts`.
Untrusted input always goes through `sanitizeRules`.

## Times

Stored as UTC ms. Entered and displayed in `TIMEZONE` (public env, default Europe/Warsaw)
using `src/lib/time.ts` (no date library).

## Locale

Paraglide strategy: cookie → preferred language → base locale (`pl`). No URL prefixes.

## Home-screen app opens full screen

`static/manifest.webmanifest` uses `display: "standalone"`. On iOS a standalone web app has
storage separate from Safari, so the party-code and member cookies don't carry over — users
log in again once inside the app. Accepted for the app-like feel. Because there is no browser
chrome, every page must keep its own way back (header logo, party tabs, back links).
