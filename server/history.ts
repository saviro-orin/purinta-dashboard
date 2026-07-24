import type { Database } from 'bun:sqlite';
import type { PurintaSnapshot } from './types';

export type HistoryRange = '24h' | '7d' | '30d';

export interface MarketHistoryPoint {
  t: string;
  borrow_assets: number;
  supply_assets: number;
  /** @deprecated Use borrow_assets. Null for non-USDC loan markets. */
  borrow_usdc: number | null;
  /** @deprecated Use supply_assets. Null for non-USDC loan markets. */
  supply_usdc: number | null;
  utilization: number;
  borrow_apy: number;
  net_supply_apy: number;
}

export interface MarketHistory {
  chain_id: number;
  market_id: string;
  range: HistoryRange;
  points: MarketHistoryPoint[];
}

// Range window plus bucket width chosen to keep each series under ~360 points.
const RANGES: Record<HistoryRange, { ms: number; bucketSeconds: number }> = {
  '24h': { ms: 24 * 60 * 60 * 1000, bucketSeconds: 300 },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, bucketSeconds: 1800 },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, bucketSeconds: 7200 },
};

export function isHistoryRange(value: string): value is HistoryRange {
  return value in RANGES;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function marketHistory(
  db: Database,
  chainId: number,
  marketId: string,
  range: HistoryRange,
  now = Date.now()
): MarketHistory {
  const { ms, bucketSeconds } = RANGES[range];
  const cutoff = new Date(now - ms).toISOString();

  // One snapshot per time bucket (the latest in the bucket) keeps the
  // payload-parsing work bounded no matter how dense the poller data is.
  const rows = db
    .query<{ payload: string }, [string, number]>(
      `SELECT payload FROM market_snapshots
       WHERE id IN (
         SELECT MAX(id) FROM market_snapshots
         WHERE fetched_at >= ?1
         GROUP BY CAST(unixepoch(fetched_at) / ?2 AS INTEGER)
       )
       ORDER BY fetched_at ASC`
    )
    .all(cutoff, bucketSeconds);

  const points: MarketHistoryPoint[] = [];

  for (const row of rows) {
    const snapshot = JSON.parse(row.payload) as PurintaSnapshot;
    const market = snapshot.markets.find((entry) => (entry.chain_id ?? 1) === chainId && entry.id === marketId);
    if (!market || !snapshot.fetched_at) continue;

    const borrowAssets = toNumber(market.borrow_assets ?? market.borrow_usdc);
    const supplyAssets = toNumber(market.supply_assets ?? market.supply_usdc);
    const isUsdc = market.loan_symbol === 'USDC';

    points.push({
      t: snapshot.fetched_at,
      borrow_assets: borrowAssets,
      supply_assets: supplyAssets,
      borrow_usdc: isUsdc ? borrowAssets : null,
      supply_usdc: isUsdc ? supplyAssets : null,
      utilization: toNumber(market.utilization),
      borrow_apy: toNumber(market.borrow_apy),
      net_supply_apy: toNumber(market.net_supply_apy),
    });
  }

  return { chain_id: chainId, market_id: marketId, range, points };
}
