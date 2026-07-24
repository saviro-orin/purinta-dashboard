import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import {
  classifyEventSync,
  EVENT_INDEXER_MARKETS,
  ensureSeedMarkets,
  eventIndexerState,
  indexedMarketIds,
  updateVaultRegistry,
  usdcString,
} from '../server/event-indexer';
import { runMigrations } from '../server/migrations';

describe('event indexer persistence', () => {
  test('indexes configured Ethereum markets only', () => {
    expect(EVENT_INDEXER_MARKETS.length).toBeGreaterThan(0);
    expect(EVENT_INDEXER_MARKETS.every((market) => market.chain_id === 1)).toBe(true);
    expect(EVENT_INDEXER_MARKETS.some((market) => market.chain_id === 4663)).toBe(false);
  });

  test('excludes any stale non-Ethereum configured market from Ethereum log filters', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    const staleRobinhoodMarket = '0xc845da65a020ddca5f132efa8fea79676d8edfdea504226a4c01e7a9e34cddd6';
    db.query(
      `INSERT INTO market_registry (market_id, source, first_seen_block, last_seen_block, updated_at)
       VALUES (?1, 'configured', 1, 1, ?2)`
    ).run(staleRobinhoodMarket, new Date().toISOString());

    const ids = indexedMarketIds(db);

    expect(ids).not.toContain(staleRobinhoodMarket);
    expect(ids.map(String)).toEqual(EVENT_INDEXER_MARKETS.map((market) => market.id));

    ensureSeedMarkets(db);
    const configuredIds = db
      .query<{ market_id: string }, []>(
        "SELECT market_id FROM market_registry WHERE source = 'configured' ORDER BY market_id"
      )
      .all()
      .map((row) => row.market_id);
    expect(configuredIds).toEqual(EVENT_INDEXER_MARKETS.map((market) => market.id).sort());
  });

  test('initializes checkpoint from the Purinta deployment block', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const state = eventIndexerState(db);

    expect(state.last_indexed_block).toBe(25_149_498);
    expect(state.status).toBe('initialized');
  });

  test('does not activate a market until its cap is accepted', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    const marketId = '0xpending';

    updateVaultRegistry(db, { eventName: 'SubmitCap', args: { id: marketId, cap: 1000n } }, 100);
    expect(
      db
        .query<{ cap_assets: string | null }, [string]>('SELECT cap_assets FROM market_registry WHERE market_id = ?1')
        .get(marketId)?.cap_assets
    ).toBeNull();

    updateVaultRegistry(db, { eventName: 'SetCap', args: { id: marketId, cap: 1000n } }, 101);
    expect(
      db
        .query<{ cap_assets: string | null }, [string]>('SELECT cap_assets FROM market_registry WHERE market_id = ?1')
        .get(marketId)?.cap_assets
    ).toBe('1000');
    expect(indexedMarketIds(db)).toContain(marketId);
    db.close();
  });

  test('formats raw USDC assets without floating point math', () => {
    expect(usdcString('0')).toBe('0');
    expect(usdcString('1000000')).toBe('1');
    expect(usdcString('1234567')).toBe('1.234567');
    expect(usdcString('1200000')).toBe('1.2');
  });

  test('classifies normal block lag as live', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    eventIndexerState(db);
    db.query("UPDATE indexer_state SET last_indexed_block = 1000, status = 'live', last_error = NULL").run();

    const sync = classifyEventSync(db, 1008);

    expect(sync.status).toBe('live');
    expect(sync.lag_blocks).toBe(8);
    expect(sync.message).toContain('normal');
  });

  test('classifies lag beyond the normal window as syncing', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    eventIndexerState(db);
    db.query("UPDATE indexer_state SET last_indexed_block = 1000, status = 'live', last_error = NULL").run();

    const sync = classifyEventSync(db, 1100);

    expect(sync.status).toBe('syncing');
    expect(sync.lag_blocks).toBe(100);
    expect(sync.message).toContain('still catching up');
  });
});
