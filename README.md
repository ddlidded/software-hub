# Software Hub

A private, password-protected hub for every tool you use. Sign in, and your links are yours alone — add, edit, and delete them from the in-app settings drawer.

## Run it

```bash
npm install
npm start        # http://localhost:3000
```

`npm run dev` restarts on file changes. Data lives in `data/hub.db` (SQLite, created on first run; override the location with `DATA_DIR`).

## How it works

- `server/index.js` — Express API + static file server
- `server/auth.js` — bcrypt password hashing, opaque session IDs in an httpOnly cookie (30 days)
- `server/db.js` — SQLite schema (`users`, `sessions`, `links`) and per-user seeding
- `server/seed-links.js` — the starter links every new account gets
- `public/` — the UI (no framework, no build step)

Links are scoped to `user_id` on every query, so accounts never see each other's data.

### API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create an account and sign in |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | End the session |
| GET | `/api/me` | Current user, or `null` |
| GET | `/api/links` | Your links |
| POST | `/api/links` | Add a link |
| PUT | `/api/links/:id` | Update a link |
| DELETE | `/api/links/:id` | Delete a link |

## Features

- Email + password accounts; links are hidden until you sign in
- Settings drawer to add / edit / delete links with categories and descriptions
- Instant search across names, descriptions, hostnames, and categories
- Category filter chips, auto-fetched favicons
- Dark / light theme, remembered per browser
- Keyboard: `/` focuses search, `Enter` opens the top result, `Esc` clears or closes settings

## Deploy

Any Node host works (Railway, Render, Fly.io). Set `NODE_ENV=production` so the session cookie is marked `Secure`, and mount a persistent volume at `DATA_DIR` so the SQLite file survives restarts. GitHub Pages cannot host this — it needs a server.
