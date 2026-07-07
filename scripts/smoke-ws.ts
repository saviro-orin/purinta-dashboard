export {};

const url = process.env.SMOKE_WS_URL ?? 'ws://127.0.0.1:4300/ws';

const ws = new WebSocket(url);
const timeout = setTimeout(() => {
  ws.close();
  throw new Error('timed out waiting for websocket snapshot');
}, 10_000);

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data.toString()) as {
    type?: string;
    payload?: { status?: string; markets?: unknown[] };
  };
  if (message.type !== 'snapshot') return;

  if (message.payload?.status !== 'live') throw new Error(`snapshot status ${message.payload?.status}`);
  if (message.payload.markets?.length !== 2)
    throw new Error(`expected 2 markets, got ${message.payload?.markets?.length}`);

  clearTimeout(timeout);
  console.log('websocket snapshot', message.payload.status, message.payload.markets.length);
  ws.close();
});
