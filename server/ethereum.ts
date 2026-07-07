import { config } from './config';

interface RpcResponse<T> {
  result?: T;
  error?: unknown;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(config.ETHEREUM_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!response.ok) throw new Error(`Ethereum RPC ${method} failed with ${response.status}`);

  const body = (await response.json()) as RpcResponse<T>;
  if (body.error || body.result === undefined || body.result === null) {
    throw new Error(`Ethereum RPC ${method} returned no result`);
  }

  return body.result;
}

export function hexToInteger(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (!value.startsWith('0x')) return Number.parseInt(value, 10);
  return Number.parseInt(value.slice(2), 16);
}

export async function fetchBlock() {
  const blockNumberHex = await rpc<string>('eth_blockNumber', []);
  const block = await rpc<{ timestamp?: string }>('eth_getBlockByNumber', [blockNumberHex, false]);
  const blockNumber = hexToInteger(blockNumberHex);
  const timestamp = hexToInteger(block.timestamp);

  return {
    block_number: blockNumber,
    block_timestamp: timestamp === null ? null : new Date(timestamp * 1000).toISOString(),
  };
}
