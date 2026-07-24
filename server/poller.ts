import type { Database } from 'bun:sqlite';
import { config } from './config';
import { classifyEventSync } from './event-indexer';
import { createLogger } from './logger';
import { fetchSnapshot } from './morpho';
import { saveSnapshot } from './snapshots';
import { broadcastSnapshot, broadcastStatus } from './websocket';

const log = createLogger('poller');

export function startPoller(db: Database) {
  let running = false;

  async function refresh() {
    if (running) {
      log.warn('previous snapshot refresh still active; skipping tick');
      return;
    }

    running = true;

    try {
      const fetched = await fetchSnapshot(db);
      const snapshot = { ...fetched, event_sync: classifyEventSync(db, fetched.block_number) };
      saveSnapshot(db, snapshot);
      broadcastSnapshot(snapshot);
      log.info('snapshot refreshed', {
        block: snapshot.block_number ?? 'unknown',
        markets: snapshot.markets.length,
        eventSync: snapshot.event_sync.status,
        eventLagBlocks: snapshot.event_sync.lag_blocks ?? 'unknown',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown refresh error';
      log.error('snapshot refresh failed', { error: message });
      broadcastStatus('error', message);
    } finally {
      running = false;
    }
  }

  const interval = setInterval(() => void refresh(), config.PURINTA_POLL_INTERVAL_MS);
  void refresh();

  return () => clearInterval(interval);
}
