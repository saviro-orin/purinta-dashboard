import type { Database } from 'bun:sqlite';
import { classifyEventSync } from './event-indexer';
import { MORPHO_BLUE, PURINTA_DEPLOYMENTS, VAULT_ADDRESS } from './markets';
import type { PurintaSnapshot } from './types';

export const EMPTY_SNAPSHOT: PurintaSnapshot = {
  fetched_at: null,
  block_number: null,
  block_timestamp: null,
  vault_address: VAULT_ADDRESS,
  morpho_blue: MORPHO_BLUE,
  total_borrow_usdc: '0',
  total_supply_usdc: '0',
  total_borrow_usd: '0',
  total_supply_usd: '0',
  weighted_borrow_apy: '0',
  markets: [],
  deployments: PURINTA_DEPLOYMENTS,
  status: 'syncing',
  event_sync: {
    status: 'unknown',
    latest_block_number: null,
    last_indexed_block: null,
    lag_blocks: null,
    normal_lag_blocks: 12,
    message: 'Waiting for first snapshot before measuring event sync lag.',
    last_error: null,
  },
};

export function latestSnapshot(db: Database): PurintaSnapshot {
  const row = db
    .query<{ payload: string }, []>('SELECT payload FROM market_snapshots ORDER BY fetched_at DESC LIMIT 1')
    .get();

  const snapshot = row ? (JSON.parse(row.payload) as PurintaSnapshot) : EMPTY_SNAPSHOT;
  return {
    ...snapshot,
    total_borrow_usd: snapshot.total_borrow_usd ?? snapshot.total_borrow_usdc,
    total_supply_usd: snapshot.total_supply_usd ?? snapshot.total_supply_usdc,
    deployments: snapshot.deployments ?? PURINTA_DEPLOYMENTS,
    markets: snapshot.markets.map((market) => ({
      ...market,
      borrow_assets: market.borrow_assets ?? market.borrow_usdc ?? '0',
      supply_assets: market.supply_assets ?? market.supply_usdc ?? '0',
    })),
    event_sync: classifyEventSync(db, snapshot.block_number),
  };
}

export function saveSnapshot(db: Database, snapshot: PurintaSnapshot) {
  db.query(
    `INSERT INTO market_snapshots (fetched_at, block_number, block_timestamp, status, payload)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    snapshot.fetched_at ?? new Date().toISOString(),
    snapshot.block_number,
    snapshot.block_timestamp,
    snapshot.status,
    JSON.stringify(snapshot)
  );
}
