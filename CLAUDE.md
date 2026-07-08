# Purinta Dashboard

Bun + Hono + SQLite + Vite React application for monitoring Purinta markets.

## Project invariants

- No user accounts, auth, email, or i18n. This is a public read-only monitoring dashboard.
- Root frontend page is `client/pages/Home.tsx`.
- Market detail page is `client/pages/MarketDetail.tsx`.
- Live updates use native WebSocket route `/ws`; clients receive `{ type: "snapshot", payload }` messages.
- `server/event-indexer.ts` is the built-in Bun/SQLite on-chain event indexer. It starts from Purinta vault deployment block `25149499`, writes `morpho_events`, `market_registry`, `indexed_blocks`, and `indexer_state`, and must checkpoint after every batch.
- `server/poller.ts` currently fetches live Morpho state, persists a `market_snapshots` row in SQLite, and broadcasts the payload. Treat Morpho API as a temporary live-state fallback while indexed history becomes canonical.
- Keep the indexer public-RPC friendly: small `eth_getLogs` ranges, `PURINTA_INDEXER_DELAY_MS` between batches, `PURINTA_INDEXER_BLOCK_LAG` for reorg safety, and optional `ETHEREUM_RPC_FALLBACK_URL`.
- The dashboard should show event sync status separately from live market polling. A few blocks behind is normal; when `lag_blocks > PURINTA_INDEXER_NORMAL_LAG_BLOCKS`, label events as catching up.
- Keep the app mobile-first and visually close to Purinta: cream base, green/mint/blush panels, USDC-blue accents, rounded raised cards, and clear financial labels.
- SQLite lives at `SQLITE_PATH`; Docker mounts `./data:/app/data`.
- Do not expose secrets. RPC provider keys belong in `.env`/deployment secrets only.

## Git

- Never add a co-author (such as Claude) to commit messages or PRs. No `Co-Authored-By` trailers or "Generated with" footers.

## Commands

- `bun install` for deps.
- `bun run dev` for local development: starts the API server (4300) and Vite with hot reload (4301) together; no build step needed.
- `bun run verify` for lint, typecheck, tests, and build.
- `docker compose up -d --build` for local Docker on port 4300.
- Health check: `curl -fsS http://localhost:4300/health`.
- Snapshot check: `curl -fsS http://localhost:4300/api/snapshot`.
- WebSocket check: `bun run smoke:ws`.
