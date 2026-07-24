import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { config } from './config';
import { db } from './db';
import { eventIndexerState, startEventIndexer } from './event-indexer';
import { isHistoryRange, marketHistory } from './history';
import { createLogger } from './logger';
import { runMigrations } from './migrations';
import { startPoller } from './poller';
import { latestSnapshot } from './snapshots';
import { primeSnapshot, registerSocket, unregisterSocket, type WebSocketData } from './websocket';

const log = createLogger('server');

runMigrations(db);
primeSnapshot(latestSnapshot(db));

const app = new Hono();
const clientRoot = './dist/client';
const indexPath = join(clientRoot, 'index.html');

app.get('/health', (c) => c.json({ status: 'ok', indexer: eventIndexerState(db) }));
app.get('/api/snapshot', (c) => c.json(latestSnapshot(db)));
app.get('/api/markets/:chainId/:id/history', (c) => {
  const chainId = Number(c.req.param('chainId'));
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    return c.json({ error: 'chainId must be a positive integer' }, 400);
  }
  const range = c.req.query('range') ?? '24h';
  if (!isHistoryRange(range)) {
    return c.json({ error: 'range must be one of 24h, 7d, 30d' }, 400);
  }
  return c.json(marketHistory(db, chainId, c.req.param('id'), range));
});
app.use('/assets/*', serveStatic({ root: clientRoot }));
app.use('/images/*', serveStatic({ root: './public' }));
app.use('/favicon.ico', serveStatic({ root: clientRoot }));
app.get('*', (c) => {
  if (!existsSync(indexPath)) {
    return c.text(
      'No production frontend build found. In development, open the Vite dev server at http://localhost:4301 (started by bun run dev). For production, run bun run build.',
      503
    );
  }
  return c.html(readFileSync(indexPath, 'utf8'));
});

startEventIndexer(db);
startPoller(db);

const server = Bun.serve<WebSocketData>({
  port: config.PORT,
  fetch(request, server) {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(request, {
        data: { clientId: crypto.randomUUID() },
      });
      if (upgraded) return;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    return app.fetch(request);
  },
  websocket: {
    open(socket) {
      registerSocket(socket);
    },
    close(socket) {
      unregisterSocket(socket);
    },
    message() {
      // The dashboard is server-push only for now.
    },
  },
});

log.info('Purinta dashboard listening', { port: server.port });
