# Purinta Dashboard

Mobile-friendly Bun + React dashboard for monitoring Purinta's live Morpho markets.

## What it shows

- Active USDC borrows for Purinta's PEPE and SPX collateral markets.
- Supply, borrow, utilization, LLTV, borrow APY, supply APY, and net supply APY.
- Ethereum block height checked for the current snapshot.
- Live browser updates over a native WebSocket.

## Stack

- Bun + Hono for the HTTP/WebSocket server.
- SQLite for persisted market snapshots.
- Vite + React + Tailwind for the frontend.
- Optional Envio HyperIndex scaffold in `indexer/` for future event indexing.

## Local development

```bash
bun install
bun run dev
```

The server defaults to:

```text
http://localhost:4300
```

Build and verify:

```bash
bun run verify
```

## Docker

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:4300
http://192.168.1.182:4300
```

SQLite snapshots are stored in:

```text
./data/purinta-dashboard.sqlite3
```

## Smoke checks

```bash
bun run smoke:http
bun run smoke:ws
```

## Environment

See `.env.example`.

Common values:

```env
PORT=4300
SQLITE_PATH=./data/purinta-dashboard.sqlite3
PURINTA_POLL_INTERVAL_MS=30000
ETHEREUM_RPC_URL=https://ethereum-rpc.publicnode.com
MORPHO_GRAPHQL_URL=https://blue-api.morpho.org/graphql
```
