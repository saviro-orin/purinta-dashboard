# Purinta Dashboard

Bun + Hono + SQLite + Vite React application for monitoring Purinta markets.

## Project invariants

- No user accounts, auth, email, or i18n. This is a public read-only monitoring dashboard.
- Root frontend page is `client/pages/Home.tsx`.
- Live updates use native WebSocket route `/ws`; clients receive `{ type: "snapshot", payload }` messages.
- `server/poller.ts` fetches live Morpho state, persists a `market_snapshots` row in SQLite, and broadcasts the payload.
- Keep the app mobile-first and visually close to Purinta: cream base, green/mint/blush panels, USDC-blue accents, rounded raised cards, and clear financial labels.
- SQLite lives at `SQLITE_PATH`; Docker mounts `./data:/app/data`.
- The optional Envio HyperIndex scaffold lives in `indexer/` and should stay sidecar-shaped until credentials and the full event-indexing path are ready.
- Do not expose secrets. `ENVIO_API_TOKEN` and RPC provider keys belong in `.env`/deployment secrets only.

## Commands

- `bun install` for deps.
- `bun run verify` for lint, typecheck, tests, and build.
- `docker compose up -d --build` for local Docker on port 4300.
- Health check: `curl -fsS http://localhost:4300/health`.
- Snapshot check: `curl -fsS http://localhost:4300/api/snapshot`.
- WebSocket check: `bun run smoke:ws`.
