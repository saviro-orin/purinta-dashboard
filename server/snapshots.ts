import type { Database } from 'bun:sqlite';
import { MORPHO_BLUE, VAULT_ADDRESS } from './markets';
import type { PurintaSnapshot } from './types';

export const EMPTY_SNAPSHOT: PurintaSnapshot = {
  fetched_at: null,
  block_number: null,
  block_timestamp: null,
  vault_address: VAULT_ADDRESS,
  morpho_blue: MORPHO_BLUE,
  total_borrow_usdc: '0',
  total_supply_usdc: '0',
  weighted_borrow_apy: '0',
  markets: [],
  status: 'syncing',
};

export function latestSnapshot(db: Database): PurintaSnapshot {
  const row = db
    .query<{ payload: string }, []>('SELECT payload FROM market_snapshots ORDER BY fetched_at DESC LIMIT 1')
    .get();

  if (!row) return EMPTY_SNAPSHOT;
  return JSON.parse(row.payload) as PurintaSnapshot;
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
