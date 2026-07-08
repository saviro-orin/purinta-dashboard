import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { runMigrations } from '../server/migrations';
import { latestSnapshot, saveSnapshot } from '../server/snapshots';
import type { PurintaSnapshot } from '../server/types';

const snapshot: PurintaSnapshot = {
  fetched_at: '2026-07-07T00:00:00.000Z',
  block_number: 123,
  block_timestamp: '2026-07-07T00:00:00.000Z',
  vault_address: 'vault',
  morpho_blue: 'morpho',
  total_borrow_usdc: '10',
  total_supply_usdc: '20',
  weighted_borrow_apy: '3.5',
  markets: [],
  status: 'live',
  event_sync: {
    status: 'syncing',
    latest_block_number: 123,
    last_indexed_block: 25_149_498,
    lag_blocks: null,
    normal_lag_blocks: 12,
    message: 'fixture',
    last_error: null,
  },
};

describe('snapshots', () => {
  test('returns an empty syncing payload before first save', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    expect(latestSnapshot(db).status).toBe('syncing');
  });

  test('saves and reads latest snapshot payload', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    saveSnapshot(db, snapshot);

    const latest = latestSnapshot(db);

    expect(latest.status).toBe(snapshot.status);
    expect(latest.block_number).toBe(snapshot.block_number);
    expect(latest.event_sync.status).toBe('live');
    expect(latest.event_sync.lag_blocks).toBe(0);
  });
});
