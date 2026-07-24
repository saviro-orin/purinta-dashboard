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
    total_borrow_usd: borrow,
    total_supply_usd: '100',
    weighted_borrow_apy: '1',
    deployments: [],
    status: 'live',
    event_sync: {
      status: 'live',
      latest_block_number: 1,
      last_indexed_block: 1,
      lag_blocks: 0,
      normal_lag_blocks: 12,
      message: 'fixture',
      last_error: null,
    },
    markets: [
      {
        id: 'market-1',
        name: 'PEPE / USDC',
        chain_id: 1,
        chain_name: 'Ethereum',
        morpho_network: 'mainnet',
        explorer_url: 'https://etherscan.io',
        loan_symbol: 'USDC',
        collateral_symbol: 'PEPE',
        collateral_address: '0xcol',
        oracle_address: '0xoracle',
        lltv: '62.5',
        borrow_assets: borrow,
        borrow_usdc: borrow,
        borrow_usd: borrow,
        supply_assets: '100',
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

    const history = marketHistory(db, 1, 'market-1', '24h', NOW);

    expect(history.chain_id).toBe(1);
    expect(history.market_id).toBe('market-1');
    expect(history.points.map((point) => point.borrow_assets)).toEqual([5, 7]);
    expect(history.points[0]?.supply_assets).toBe(100);
    expect(history.points.map((point) => point.borrow_usdc)).toEqual([5, 7]);
    expect(history.points[0]?.borrow_apy).toBe(1.5);
  });

  test('qualifies identical market IDs by chain', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    const fetchedAt = new Date(NOW - 1000).toISOString();
    const snapshot = makeSnapshot(fetchedAt, '5');
    const ethereum = snapshot.markets[0];
    if (!ethereum) throw new Error('missing fixture market');
    snapshot.markets.push({
      ...ethereum,
      chain_id: 4663,
      chain_name: 'Robinhood Chain',
      borrow_assets: '42',
      borrow_usdc: null,
      borrow_usd: '42',
      loan_symbol: 'USDG',
    });
    db.query(
      `INSERT INTO market_snapshots (fetched_at, block_number, block_timestamp, status, payload)
       VALUES (?, ?, ?, ?, ?)`
    ).run(fetchedAt, 1, fetchedAt, 'live', JSON.stringify(snapshot));

    const history = marketHistory(db, 4663, 'market-1', '24h', NOW);

    expect(history.chain_id).toBe(4663);
    expect(history.points.map((point) => point.borrow_assets)).toEqual([42]);
    expect(history.points[0]?.borrow_usdc).toBeNull();
  });

  test('buckets dense snapshots down to one point per bucket', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    // 20 snapshots 30s apart all fall inside two 5-minute buckets.
    for (let i = 0; i < 20; i++) {
      seed(db, new Date(NOW - i * 30 * 1000).toISOString(), String(i));
    }

    const history = marketHistory(db, 1, 'market-1', '24h', NOW);
    expect(history.points.length).toBeLessThanOrEqual(3);
    expect(history.points.length).toBeGreaterThan(0);
  });

  test('returns no points for an unknown market', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    seed(db, new Date(NOW - 1000).toISOString(), '5');

    expect(marketHistory(db, 1, 'unknown', '24h', NOW).points).toEqual([]);
  });

  test('isHistoryRange accepts only known ranges', () => {
    expect(isHistoryRange('24h')).toBe(true);
    expect(isHistoryRange('7d')).toBe(true);
    expect(isHistoryRange('30d')).toBe(true);
    expect(isHistoryRange('1y')).toBe(false);
  });
});
