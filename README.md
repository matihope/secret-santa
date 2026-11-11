# Secret Santa 🎅 (Tajny Mikołaj)

Self-hosted Secret Santa manager for families and friend groups. Polish and English.

## Features

- **Parties behind a code** — every party has a "Christmas Party Code" (random like `K7QM-4XPA`
  or chosen by the admin). The home page lists public parties (name + date only) and the parties
  you already joined in this browser.
- **Join in seconds** — name and/or nickname, optional (but recommended) passcode, profile picture,
  wishlist. No global accounts: you join each party separately.
- **Statute builder** — creating a party walks you through a questionnaire (budget, secrecy,
  deadline, things not to buy, signed gifts, wrapping, wishlists, theme, dress code…). Answers
  become nicely worded rules; anything that doesn't apply is left out. Edit, reorder, add custom
  rules later. Rules are rendered in the viewer's language.
- **Couples** — ask not to draw someone; it works both ways once the other person accepts.
  Admins can add pairs directly.
- **Big countdown** to the draw (then to the party). The draw happens **automatically** at the
  set time, or the admin can draw early. Everyone unwraps their result on the party page.
- **Party admin** (password required): edit settings, date, location, code, rules, members
  (names, passcodes, admin flag, participation). Wishlists are hidden behind "Reveal" so admins
  don't spoil their own surprise. Archive / restore, delete. Nobody can see the assignments.
- **Website admin** at `/admin` (password from `.env`) can see and manage every party.

## Running

```bash
cp .env.example .env        # set SITE_ADMIN_PASSWORD
docker compose up -d --build
```

The app listens on host port **8976**. Data (SQLite DB and avatars) lives in `./data`,
owned by uid 1000. Migrations run automatically on start.

### Nginx Proxy Manager

Proxy host `santa.example.com` → `http://<server-lan-ip>:8976`, with the `*.example.com` certificate
and Force SSL. Avatars are resized server-side (uploads up to 10 MB), so the default body-size
limit is fine.

`ORIGIN` in `.env` must match the public URL, otherwise form submissions are rejected
("Cross-site POST form submissions are forbidden"). Session cookies are `Secure`; for plain-HTTP
testing on a LAN IP set `COOKIE_SECURE=false` and `ORIGIN=http://<ip>:8976`.

## Development

```bash
npm install
npm run dev               # http://localhost:5173 (uses ./data/santa.db)
npm run check             # types
npx vitest run            # unit tests
npx playwright test       # end-to-end (builds and runs a preview server)
PW_BASE_URL=http://localhost:8976 PW_ADMIN_PASSWORD=… npx playwright test   # against a running instance
```

UI strings live in `scripts/messages.py` → `python3 scripts/messages.py` regenerates
`messages/{en,pl}.json`. After changing `src/lib/server/db/schema.ts` run `npm run db:generate`.

See `CLAUDE.md`, `docs/decisions.md` and `docs/log.md` for architecture notes.
