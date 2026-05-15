# Ripple

**Full-stack polling with live analytics, authenticated sessions, and anonymous response deduplication — not a single-form vote widget.**

React + Express + **PostgreSQL** + **Socket.io**. pnpm monorepo (`client` / `server` / `shared`).

---

## What goes beyond a simple poll app

| Capability | Why it matters |
|------------|----------------|
| **Multi-question polls** | Wizard builder, mandatory flags, 2–4 options per question, transactional create |
| **Dual response paths** | Same endpoint for logged-in users and anonymous visitors (`optionalAuth`) |
| **DB-enforced dedup** | Unique indexes on `(poll, user)` and `(poll, visitor)`; FingerprintJS for anonymous identity |
| **Answer integrity** | Server validates question/option IDs belong to the poll before insert |
| **Poll lifecycle** | `active` → `closed` (expiry) → `published` (creator releases results) |
| **Live surfaces** | Socket.io rooms for respondents, creators, and thank-you page; JWT-gated creator room |
| **Creator analytics** | SQL aggregations, per-option %, hourly timeline; live refresh on new responses |
| **Production auth** | JWT (15m) + `httpOnly` refresh (7d), rotation, Postgres JTI denylist on logout |
| **Hardening** | Zod at API boundary, bcrypt-12, IP rate limits (auth + respond), transactional writes |

---

## Architecture

```
React (Vite) ── REST + Socket.io ── Express 5 ── Drizzle ── PostgreSQL 16
```

- **REST** for CRUD, auth, analytics queries.
- **Sockets** signal *when* to refetch; **REST** returns *what* changed (consistent under concurrency).
- **Rooms:** `poll:{id}` (public status), `poll:{id}:creator` (JWT on join), `poll:{id}:thankyou` (live stats).

Poll status: **`active`** → **`closed`** → **`published`**

---

## Engineering highlights

**Auth** — Access token in memory; refresh in `httpOnly` + `sameSite: strict` cookie. Rotation denylists old JTIs. Axios auto-refreshes on 401.

**Real-time** — After submit: `poll:response_received` (creator), `poll:stats_update` (thank-you). On close/publish: `poll:status_changed`. Socket errors never fail a committed `201`.

**Data** — Normalized schema with FK cascades and indexes on poll-scoped lookups. `createPoll` / `submitResponse` use transactions.

**Analytics** — `GROUP BY` option counts + `DATE_TRUNC` hourly timeline at read time. Creator-only; ownership checked server-side.



---

## Tech stack

React 19 · Vite · TypeScript · Zustand · Axios · Socket.io-client · FingerprintJS · Tailwind  
Express 5 · Zod · Drizzle ORM · PostgreSQL 16 · bcrypt · JWT · cookie-parser  
Docker Compose (Postgres dev only)

---

## API (summary)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout` |
| Polls | `POST /polls`, `GET /polls`, `GET /polls/:id`, `POST /polls/:id/respond`, `GET .../stats`, `GET .../analytics`, `POST .../publish`, `DELETE .../:id` |
| Health | `GET /health` |

Errors: `{ "error": "message" }` via centralized `ApiError` handler.

---

## Quick start

```bash
docker compose up -d          # Postgres on localhost:5433
pnpm install
```

**`server/.env`** — `PORT`, `CLIENT_URL`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`  
**`client/.env`** — `VITE_API_BASE_URL`, `VITE_SOCKET_URL` (Socket.io origin, no `/api`)

```bash
cd server && pnpm exec drizzle-kit migrate && pnpm seed   # optional seed
cd server && pnpm dev    # :8080
cd client && pnpm dev    # :5173
```

**Production build:** `client` → `pnpm build` · `server` → `pnpm build` → `node dist/index.js`  
Set `NODE_ENV=production`, `secure` cookies, matching `CLIENT_URL`, WebSocket-capable proxy.

---

## Structure

```
client/src/pages/     # Home, Dashboard, CreatePoll, PollPage, Analytics, ThankYou, …
server/src/module/    # auth, polls (routes → controller → service)
server/src/db/        # schema.ts, migrations/
shared/src/types/
```

---

ISC
