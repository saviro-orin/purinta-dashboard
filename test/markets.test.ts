import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { PURINTA_MARKETS, trackedMarketTargets } from '../server/markets';

describe('tracked Purinta markets', () => {
  test('tracks only the confirmed CASHCAT market on Robinhood Chain', () => {
    const robinhoodMarkets = PURINTA_MARKETS.filter((market) => market.chain_id === 4663);

    expect(robinhoodMarkets.map((market) => market.name)).toEqual(['CASHCAT / USDG']);
    expect(robinhoodMarkets.some((market) => market.name === 'USDe / USDG')).toBe(false);
  });

  test('tracks all markets currently published by Purinta', () => {
    expect(PURINTA_MARKETS.map((market) => market.name)).toEqual([
      'PEPE / USDC',
      'SPX / USDC',
      'SHIB / USDC',
      'CASHCAT / USDG',
    ]);
  });

  test('automatically adds Ethereum markets learned by the event indexer', () => {
    const db = new Database(':memory:');
    db.exec(`CREATE TABLE market_registry (
      market_id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      cap_assets TEXT,
      in_supply_queue INTEGER NOT NULL DEFAULT 0,
      in_withdraw_queue INTEGER NOT NULL DEFAULT 0
    )`);
    db.query(
      `INSERT INTO market_registry
         (market_id, source, cap_assets, in_supply_queue, in_withdraw_queue)
       VALUES (?1, 'metamorpho_vault', '1000', 1, 1), (?2, 'metamorpho_vault', '0', 0, 0)`
    ).run('0xautomatic', '0xremoved');

    const targets = trackedMarketTargets(db);

    expect(targets.filter((market) => market.id === '0xautomatic')).toEqual([
      {
        id: '0xautomatic',
        chain_id: 1,
        chain_name: 'Ethereum',
        morpho_network: 'mainnet',
        explorer_url: 'https://etherscan.io',
      },
    ]);
    expect(targets.some((market) => market.id === '0xremoved')).toBe(false);
    db.close();
  });
});
