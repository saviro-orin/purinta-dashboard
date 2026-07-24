import { PURINTA_MARKETS } from '../server/markets';

const url = process.env.SMOKE_WS_URL ?? 'ws://127.0.0.1:4300/ws';
const minimumMarkets = PURINTA_MARKETS.length;
const configuredKeys = new Set(PURINTA_MARKETS.map((market) => `${market.chain_id}:${market.id.toLowerCase()}`));

const ws = new WebSocket(url);
const timeout = setTimeout(() => {
  ws.close();
  throw new Error('timed out waiting for websocket snapshot');
}, 10_000);

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data.toString()) as {
    type?: string;
    payload?: { status?: string; markets?: Array<{ id: string; chain_id?: number; chain_name?: string }> };
  };
  if (message.type !== 'snapshot') return;

  const markets = message.payload?.markets;
  if (message.payload?.status !== 'live') throw new Error(`snapshot status ${message.payload?.status}`);
  if (markets === undefined || markets.length < minimumMarkets)
    throw new Error(`expected at least ${minimumMarkets} markets, got ${markets?.length}`);
  const marketKeys = markets.map((market) => `${market.chain_id ?? 1}:${market.id.toLowerCase()}`);
  if (new Set(marketKeys).size !== marketKeys.length) throw new Error('snapshot contains duplicate chain/market IDs');
  for (const key of configuredKeys) {
    if (!marketKeys.includes(key)) throw new Error(`missing configured market ${key}`);
  }
  if (!markets.some((market) => market.chain_name === 'Robinhood Chain'))
    throw new Error('missing Robinhood Chain markets');

  clearTimeout(timeout);
  console.log('websocket snapshot', message.payload.status, markets.length);
  ws.close();
});
