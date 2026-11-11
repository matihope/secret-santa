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

## No home-screen widgets; calendar + push instead

Android home-screen widgets need a native app (web "PWA widgets" only exist on Windows 11), so
the countdown reaches people through their calendar (Google link / `.ics` with alarms) and
Web Push.

## Push notifications

- Standard Web Push with VAPID; the key pair is generated on first use and kept in `settings`
  (no configuration). Subject: `PUSH_SUBJECT` or `ORIGIN` (Apple rejects missing/invalid ones).
- One subscription row per member per device, with the device's UI locale so texts are
  translated. Unsubscribing only deletes our row — the browser subscription may serve other
  parties on the same device.
- Endpoints must be https on a known push service host (FCM, Apple, Mozilla, WNS): the URL comes
  from the client and the server POSTs to it, so anything else would be an SSRF hole.
  `PUSH_TEST_HOSTS` exists only for `npm run test:push`.
- Reminders: 24 h before the draw / party (not within the last hour). `draw_reminder_for` /
  `party_reminder_for` store the date the reminder was sent for, so changing the date re-arms it.
- Wishlist changes after the draw set `members.wishlist_changed_at`; the scheduler notifies the
  giver once it has been quiet for 2 minutes (one push per editing session). The text says
  "your person", never the name, because notifications show on lock screens.
- The service worker only handles push — no offline caching, party data must be fresh.

## Dark theme

- Colour tokens in `layout.css` are `light-dark(light, dark)` pairs, so the whole palette flips
  with `color-scheme`; no `dark:` classes needed. `html[data-theme]` sets the scheme and is
  applied before first paint by an inline script in `src/app.html` (cookie `theme`, else the
  device's `prefers-color-scheme`). `src/lib/theme.ts` holds the same logic for the switch —
  keep both in sync.
- Two kinds of accent tokens: `pine`/`berry` are for text, borders and tints and get lighter in
  the dark; `holly`/`ribbon` are solid fills under `cream` text and stay deep. Use
  `bg-holly|bg-ribbon text-cream` for filled buttons/badges, never `bg-pine text-snow`.
  `snow` is the card/input surface (dark in dark mode), not "white".
- Dark Reader: when our page is dark we add `<meta name="darkreader-lock">` (Dark Reader
  removes its theme when it appears, even later — checked in its 4.9.135 source) and computed
  `color-scheme: dark` (what its optional "Detect dark theme" checks). When our page is light
  there is no lock, so people who use Dark Reader still get their dark page. We do not sniff for
  the extension.
- Choice cookie is not httpOnly (the pre-paint script reads it); `+layout.server.ts` passes it
  to the switch so the right icon is server-rendered.

## What a code-only guest sees

- Having the party code (or clicking a public party and entering it) is not membership. Such
  guests see only the party name and the join / "I'm already in" buttons, plus a note that the
  rest appears after joining or logging in. Description, dates, location, statute, guest list
  and the `.ics` export need `insider` (a member of the party or the site admin), and the server
  does not send those fields to guests at all (`+layout.server.ts`, `+page.server.ts`).
- The login page still lists members to pick from: that is how you log in, and you already had
  the code to get there.
