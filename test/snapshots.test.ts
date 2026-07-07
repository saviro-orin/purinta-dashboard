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

    expect(latestSnapshot(db)).toEqual(snapshot);
  });
});
