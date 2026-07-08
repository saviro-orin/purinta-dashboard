export {};

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:4300';

async function get(path: string) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
  return response;
}

const health = await get('/health');
console.log('health', await health.text());

const snapshot = (await (await get('/api/snapshot')).json()) as {
  status: string;
  markets: unknown[];
  block_number: number | null;
  event_sync?: { status?: string; lag_blocks?: number | null; normal_lag_blocks?: number };
};
if (snapshot.status !== 'live') throw new Error(`snapshot status ${snapshot.status}`);
if (snapshot.markets.length !== 2) throw new Error(`expected 2 markets, got ${snapshot.markets.length}`);
if (!snapshot.block_number) throw new Error('missing block number');
if (!snapshot.event_sync) throw new Error('missing event sync status');
if (!snapshot.event_sync.status) throw new Error('missing event sync status label');
if (
  snapshot.event_sync.lag_blocks !== null &&
  snapshot.event_sync.lag_blocks !== undefined &&
  snapshot.event_sync.lag_blocks < 0
) {
  throw new Error(`invalid event sync lag ${snapshot.event_sync.lag_blocks}`);
}
console.log(
  'snapshot',
  snapshot.status,
  snapshot.markets.length,
  snapshot.block_number,
  'events',
  snapshot.event_sync.status,
  snapshot.event_sync.lag_blocks ?? 'unknown'
);

const root = await get('/');
console.log('root', root.status, root.headers.get('content-type'));
