# Isotopiq Hub

A private, password-protected hub for every tool you use. Sign in, and your links are yours alone — add, edit, and delete them from the in-app settings drawer.

## Run it

```bash
npm install
npm start        # http://localhost:3000
```

Needs Node 22.5+ — storage uses Node's built-in `node:sqlite`, so there is no native module to compile (installs and Docker builds take seconds). `npm run dev` restarts on file changes. Data lives in `data/hub.db` (SQLite, created on first run; override the location with `DATA_DIR`).

## How it works

- `server/index.js` — Express API + static file server
- `server/auth.js` — bcrypt password hashing, opaque session IDs in an httpOnly cookie (30 days)
- `server/db.js` — SQLite schema (`users`, `sessions`, `links`) and per-user seeding, via built-in `node:sqlite`
- `server/seed-links.js` — the starter links every new account gets
- `public/` — the UI (no framework, no build step)

Links are scoped to `user_id` on every query, so accounts never see each other's data.

### API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create an account and sign in |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | End the session |
| GET | `/api/health` | Liveness probe for Docker / EasyPanel |
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
- Isotopiq branding (navy `#262262` / blue `#2787e7`) with light and dark logo variants in `public/assets/`
- Dark / light theme toggle on both the sign-in screen and the hub, remembered per browser and defaulting to your OS preference
- Keyboard: `/` focuses search, `Enter` opens the top result, `Esc` clears or closes settings

## Deploy with EasyPanel (Docker Compose)

The repo ships a `Dockerfile` and `docker-compose.yml`. The container listens on 3000 and is published on host port **7480** (unique to this app, so it won't collide with other EasyPanel services).

In EasyPanel: create a project → **Compose** service → point it at this repo → paste your variables into the **Environment** tab (see `.env.example`) → Deploy. Then add a domain mapped to port `7480`.

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` there and that account is created on first boot, so you can sign in immediately without using the sign-up form:

```env
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-long-password
ADMIN_NAME=Edmund
```

It is only created if no account with that email exists — changing `ADMIN_PASSWORD` later does **not** rewrite the password of an existing account.

Or run it anywhere Docker is installed:

```bash
docker compose up -d --build   # http://<host>:7480
```

### Environment

| Variable | Default | Notes |
| --- | --- | --- |
| `HUB_PORT` | `7480` | Host port published by compose |
| `DATA_DIR` | `/data` | SQLite lives here; backed by the `hub-data` volume |
| `COOKIE_SECURE` | `true` | Set to `false` if you reach the app over plain HTTP without TLS in front, otherwise sign-in cookies are dropped |
| `TRUST_PROXY` | `1` | Number of proxy hops to trust (EasyPanel's Traefik counts as one) |
| `ADMIN_EMAIL` | — | First account's email; created on startup when set together with `ADMIN_PASSWORD` |
| `ADMIN_PASSWORD` | — | First account's password (at least 8 characters) |
| `ADMIN_NAME` | email prefix | Display name for the first account |

`/api/health` backs the compose healthcheck. The `hub-data` volume keeps accounts and links across redeploys.

## Other hosts

Any Node host works (Railway, Render, Fly.io). Set `NODE_ENV=production` so the session cookie is marked `Secure`, and mount a persistent volume at `DATA_DIR` so the SQLite file survives restarts. GitHub Pages cannot host this — it needs a server.
