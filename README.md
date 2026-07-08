# Purinta Dashboard

A public, read-only dashboard for monitoring Purinta's Morpho markets: how much USDC is borrowed against PEPE and SPX collateral, current APYs, utilization, liquidity, and market history.

Built with Bun, Hono, SQLite, and Vite + React.

## Quick start

```bash
bun install
bun run dev
```

Then open http://localhost:4301. One command runs both the API server (port 4300) and the Vite dev server with hot reload.

## What it shows

- Total USDC borrowed, supplied, and still available across the tracked markets.
- Per-market borrow APY, net supply APY, utilization, and LLTV.
- Per-market history charts from persisted snapshots.
- Live connection status and the Ethereum block behind the current snapshot.
- Event indexer sync status, including whether events are within the normal small block lag or still catching up.

## Data model

The dashboard currently has two data layers. They are intentionally separate so the UI can stay useful while the indexed ledger becomes complete.

| Layer | What it powers today | Why it exists |
| --- | --- | --- |
| Current market snapshot | The headline totals, per-market balances, utilization, and APYs shown in the dashboard | Keeps the public dashboard fresh while the event ledger catches up and while event-derived calculations are completed |
| Event ledger | The event sync badge, checkpointing, and the durable history foundation in SQLite | Provides a rebuildable record of market activity from the Purinta vault deployment block forward |

Current data flow:

1. `server/event-indexer.ts` records Morpho Blue and MetaMorpho events into SQLite and stores checkpoints in `indexer_state`.
2. `server/poller.ts` refreshes the current market snapshot about every 30 seconds and stores it in `market_snapshots`.
3. `server/history.ts` serves chart history from SQLite snapshots.

The intended direction is for the event ledger to become the canonical source for more of the dashboard. Until that transition is complete, the current snapshot layer is a temporary live-state bridge for fields such as APY, utilization, and balances. The UI labels these as a current market snapshot, while the event badge separately shows whether the durable event ledger is caught up.

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

Copy `.env.example` to `.env` and adjust as needed. Defaults use public/free RPC endpoints and conservative indexing limits:

```env
PORT=4300
SQLITE_PATH=./data/purinta-dashboard.sqlite3
PURINTA_POLL_INTERVAL_MS=30000
ETHEREUM_RPC_URL=https://eth.drpc.org
ETHEREUM_RPC_FALLBACK_URL=https://eth-mainnet.public.blastapi.io
MORPHO_GRAPHQL_URL=https://blue-api.morpho.org/graphql
PURINTA_INDEXER_ENABLED=true
PURINTA_INDEXER_START_BLOCK=25149499
PURINTA_INDEXER_INTERVAL_MS=60000
PURINTA_INDEXER_DELAY_MS=250
PURINTA_INDEXER_BATCH_BLOCKS=25
PURINTA_INDEXER_MAX_BLOCKS_PER_RUN=2000
PURINTA_INDEXER_BLOCK_LAG=8
PURINTA_INDEXER_NORMAL_LAG_BLOCKS=12
```

Indexer settings:

- `PURINTA_INDEXER_START_BLOCK`: Purinta vault deployment block.
- `PURINTA_INDEXER_DELAY_MS`: delay between `eth_getLogs` batches to avoid public RPC throttling.
- `PURINTA_INDEXER_BATCH_BLOCKS`: preferred block span per `eth_getLogs` call. The indexer adaptively splits a range if an RPC rejects or times out.
- `PURINTA_INDEXER_MAX_BLOCKS_PER_RUN`: caps work per interval so the server remains responsive.
- `PURINTA_INDEXER_BLOCK_LAG`: leaves a few blocks unindexed to reduce reorg risk.
- `PURINTA_INDEXER_NORMAL_LAG_BLOCKS`: dashboard threshold for normal event lag. At or below this value is shown as normal; above it is shown as catching up.
- `ETHEREUM_RPC_FALLBACK_URL`: optional second RPC endpoint used automatically if the primary fails.

## Production (Docker)

```bash
docker compose up -d --build
```

The app serves on port 4300 and stores SQLite data in `./data`. Health check:

```bash
curl -fsS http://localhost:4300/health
```

The health response includes indexer checkpoint/status details.

## Project layout

```
client/    React frontend (Vite + Tailwind)
server/    Bun + Hono API, WebSocket, event indexer, and snapshot poller
scripts/   Dev runner and smoke checks
test/      Bun tests
```
