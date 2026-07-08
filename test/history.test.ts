import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { isHistoryRange, marketHistory } from '../server/history';
import { runMigrations } from '../server/migrations';
import type { PurintaSnapshot } from '../server/types';

const NOW = Date.parse('2026-07-07T12:00:00.000Z');

function makeSnapshot(fetchedAt: string, borrow: string): PurintaSnapshot {
  return {
    fetched_at: fetchedAt,
    block_number: 1,
    block_timestamp: fetchedAt,
    vault_address: '0xvault',
    morpho_blue: '0xmorpho',
    total_borrow_usdc: borrow,
    total_supply_usdc: '100',
    weighted_borrow_apy: '1',
    status: 'live',
    markets: [
      {
        id: 'market-1',
        name: 'PEPE / USDC',
        loan_symbol: 'USDC',
        collateral_symbol: 'PEPE',
        collateral_address: '0xcol',
        oracle_address: '0xoracle',
        lltv: '62.5',
        borrow_usdc: borrow,
        borrow_usd: borrow,
        supply_usdc: '100',
        supply_usd: '100',
        utilization: '10',
        borrow_apy: '1.5',
        supply_apy: '1',
        net_supply_apy: '0.9',
      },
    ],
  };
}

function seed(db: Database, fetchedAt: string, borrow: string) {
  const snapshot = makeSnapshot(fetchedAt, borrow);
  db.query(
    `INSERT INTO market_snapshots (fetched_at, block_number, block_timestamp, status, payload)
     VALUES (?, ?, ?, ?, ?)`
  ).run(fetchedAt, 1, fetchedAt, 'live', JSON.stringify(snapshot));
}

describe('marketHistory', () => {
  test('returns points for the requested market inside the range, oldest first', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    seed(db, new Date(NOW - 2 * 60 * 60 * 1000).toISOString(), '5');
    seed(db, new Date(NOW - 60 * 60 * 1000).toISOString(), '7');
    seed(db, new Date(NOW - 48 * 60 * 60 * 1000).toISOString(), '99'); // outside 24h

    const history = marketHistory(db, 'market-1', '24h', NOW);

    expect(history.market_id).toBe('market-1');
    expect(history.points.map((point) => point.borrow_usdc)).toEqual([5, 7]);
    expect(history.points[0]?.supply_usdc).toBe(100);
    expect(history.points[0]?.borrow_apy).toBe(1.5);
  });

  test('buckets dense snapshots down to one point per bucket', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    // 20 snapshots 30s apart all fall inside two 5-minute buckets.
    for (let i = 0; i < 20; i++) {
      seed(db, new Date(NOW - i * 30 * 1000).toISOString(), String(i));
    }

    const history = marketHistory(db, 'market-1', '24h', NOW);
    expect(history.points.length).toBeLessThanOrEqual(3);
    expect(history.points.length).toBeGreaterThan(0);
  });

  test('returns no points for an unknown market', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    seed(db, new Date(NOW - 1000).toISOString(), '5');

    expect(marketHistory(db, 'unknown', '24h', NOW).points).toEqual([]);
  });

  test('isHistoryRange accepts only known ranges', () => {
    expect(isHistoryRange('24h')).toBe(true);
    expect(isHistoryRange('7d')).toBe(true);
    expect(isHistoryRange('30d')).toBe(true);
    expect(isHistoryRange('1y')).toBe(false);
  });
});
