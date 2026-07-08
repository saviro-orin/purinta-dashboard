# Purinta Dashboard

A public, read-only dashboard for monitoring Purinta's live Morpho markets: how much USDC is borrowed against PEPE and SPX collateral, current APYs, utilization, and liquidity. Updates arrive in the browser over a WebSocket as the server polls the chain.

Built with Bun, Hono, SQLite, and Vite + React.

## Quick start

```bash
bun install
bun run dev
```

Then open http://localhost:4301. That's it: one command runs both the API server (port 4300) and the Vite dev server with hot reload. No build step is needed for development.

## What it shows

- Total USDC borrowed, supplied, and still available across the tracked markets.
- Per-market borrow APY, net supply APY, utilization, and LLTV.
- Live connection status and the Ethereum block behind the current snapshot.

Data comes from the Morpho Blue API and an Ethereum JSON-RPC endpoint. Snapshots are persisted to SQLite so history survives restarts.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the API server and Vite dev server together |
| `bun run verify` | Lint, typecheck, test, and build |
| `bun test` | Run the test suite |
| `bun run build` | Build the frontend and server for production |
| `bun run start` | Serve the production build on port 4300 |
| `bun run smoke:http` / `bun run smoke:ws` | Smoke-check a running server |

## Configuration

Copy `.env.example` to `.env` and adjust as needed. Defaults work out of the box:

```env
PORT=4300
SQLITE_PATH=./data/purinta-dashboard.sqlite3
PURINTA_POLL_INTERVAL_MS=30000
ETHEREUM_RPC_URL=https://ethereum-rpc.publicnode.com
MORPHO_GRAPHQL_URL=https://blue-api.morpho.org/graphql
```

## Production (Docker)

```bash
docker compose up -d --build
```

The app serves on port 4300 and stores SQLite data in `./data`. Health check: `curl -fsS http://localhost:4300/health`.

## Project layout

```
client/    React frontend (Vite + Tailwind)
server/    Bun + Hono API, WebSocket, and Morpho poller
scripts/   Dev runner and smoke checks
indexer/   Optional Envio HyperIndex scaffold (sidecar, not wired in)
test/      Bun tests
```
