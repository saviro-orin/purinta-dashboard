import { PURINTA_MARKETS } from '../server/markets';

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:4300';
const minimumMarkets = PURINTA_MARKETS.length;
const configuredKeys = new Set(PURINTA_MARKETS.map((market) => `${market.chain_id}:${market.id.toLowerCase()}`));

async function get(path: string) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
  return response;
}

const health = await get('/health');
console.log('health', await health.text());

const snapshot = (await (await get('/api/snapshot')).json()) as {
  status: string;
  markets: Array<{ id: string; chain_id?: number; chain_name?: string }>;
  block_number: number | null;
  event_sync?: { status?: string; lag_blocks?: number | null; normal_lag_blocks?: number };
};
if (snapshot.status !== 'live') throw new Error(`snapshot status ${snapshot.status}`);
if (snapshot.markets.length < minimumMarkets)
  throw new Error(`expected at least ${minimumMarkets} markets, got ${snapshot.markets.length}`);
const marketKeys = snapshot.markets.map((market) => `${market.chain_id ?? 1}:${market.id.toLowerCase()}`);
if (new Set(marketKeys).size !== marketKeys.length) throw new Error('snapshot contains duplicate chain/market IDs');
for (const key of configuredKeys) {
  if (!marketKeys.includes(key)) throw new Error(`missing configured market ${key}`);
}
if (!snapshot.markets.some((market) => market.chain_name === 'Robinhood Chain'))
  throw new Error('missing Robinhood Chain markets');
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
