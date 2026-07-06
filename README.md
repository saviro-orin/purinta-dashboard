# Purinta Dashboard

Mobile-friendly Phoenix + React dashboard for monitoring Purinta's live Morpho markets.

## What it shows

- Active USDC borrows for Purinta's PEPE and SPX collateral markets.
- Supply, utilization, borrow APY, supply APY, and net supply APY.
- Morpho/Purinta contract links and current indexed block metadata.
- Live browser refresh over Phoenix Channels as new snapshots are fetched.

## Architecture

```text
Phoenix/Inertia dashboard ── reads ── Postgres market_snapshots
          ▲                                ▲
          │ Phoenix Channel broadcasts      │
          └──── MarketPoller fetches Morpho ┘
```

The app stores normalized market snapshots in Postgres. The repo also includes an optional Envio HyperIndex sidecar scaffold under `indexer/` for event indexing once an `ENVIO_API_TOKEN` is provided.

## Local Docker

```bash
cp .env.example .env
docker compose up --build
```

Open: <http://localhost:4300>

## Development

```bash
mise trust && mise install
mix setup
mix phx.server
```

## Verification

```bash
mix precommit
npm --prefix assets run lint
docker compose up --build
curl -fsS http://localhost:4300/health
curl -fsS http://localhost:4300/api/snapshot
```
