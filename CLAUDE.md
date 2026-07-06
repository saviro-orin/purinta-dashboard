# Purinta Dashboard

Phoenix 1.8 + Inertia React application for monitoring Purinta markets.

## Project invariants

- No user accounts, auth, email, or i18n. This is a public read-only monitoring dashboard.
- Root page is `assets/js/pages/Home.tsx` rendered by `PurintaDashboardWeb.PageController`.
- Live updates use the anonymous Phoenix channel topic `purinta`.
- `PurintaDashboard.Purinta.MarketPoller` fetches live Morpho state, persists a `market_snapshots` row, and broadcasts the payload.
- Keep the app mobile-first and visually close to Purinta: cream base, green/mint/blush panels, USDC-blue accents, rounded raised cards, and clear financial labels.
- Phoenix reads normalized indexed snapshots from Postgres. The optional Envio HyperIndex scaffold lives in `indexer/` and should stay sidecar-shaped, not embedded through NIFs.
- Do not expose secrets. `ENVIO_API_TOKEN`, database passwords, and Phoenix secrets belong in `.env`/deployment secrets only.

## Commands

- `mix setup` for local deps/db/assets.
- `mix precommit` before committing.
- `docker compose up --build` for local Docker on port 4300.
- Health check: `curl -fsS http://localhost:4300/health`.
