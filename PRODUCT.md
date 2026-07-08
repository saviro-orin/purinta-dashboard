# Product

## Register

product

## Users

Purinta community members and DeFi-curious observers checking market health on their phones or desktops. No accounts, no auth: anyone with the URL. Their job: glance at the dashboard and answer "how much USDC is borrowed against Purinta meme collateral, and are the markets healthy?" in under ten seconds.

## Product Purpose

A public, read-only monitoring dashboard for Purinta's PEPE and SPX collateral markets on Morpho (Ethereum mainnet). It shows live borrow/supply totals, utilization, APYs, LLTV, and feed status via WebSocket snapshots. Success: a first-time visitor understands the numbers without a DeFi glossary, and a returning visitor gets the answer at a glance.

## Brand Personality

Friendly, legible, trustworthy. Visually close to Purinta's own app: cream base, green/mint/blush panels, USDC-blue accents, rounded raised cards. Playful surface, serious numbers.

## Anti-references

- Dense DeFi terminal aesthetics (dark mode, monospace walls, ten decimals everywhere).
- Generic SaaS analytics dashboards with gradient hero metrics.
- Anything requiring a glossary to parse: labels must read as plain financial English.

## Design Principles

1. **Glanceable first.** The headline numbers (borrowed, supplied, utilization) must be readable in seconds on a phone.
2. **Explain inline, don't decorate.** Financial terms get one clear label; explanations are available but never crowd the data.
3. **Purinta's skin, dashboard's bones.** Keep the cream/green/blush identity, but let standard dashboard patterns carry the data.
4. **Live means visible.** Connection state and data freshness are always evident, never buried.
5. **Numbers earn their precision.** Round to what a reader needs; don't dump raw chain data.

## Accessibility & Inclusion

- WCAG AA contrast for all text, including on tinted panels.
- Mobile-first layouts; tables degrade gracefully on small screens.
- Reduced-motion alternatives for any animation.
- Status conveyed by text + color, never color alone.
