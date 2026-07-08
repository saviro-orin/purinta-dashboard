import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { classifyEventSync, eventIndexerState, usdcString } from '../server/event-indexer';
import { runMigrations } from '../server/migrations';

describe('event indexer persistence', () => {
  test('initializes checkpoint from the Purinta deployment block', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const state = eventIndexerState(db);

    expect(state.last_indexed_block).toBe(25_149_498);
    expect(state.status).toBe('initialized');
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
