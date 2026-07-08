import { config } from './config';
import { createLogger } from './logger';

const log = createLogger('ethereum-rpc');

interface RpcResponse<T> {
  result?: T;
  error?: { code?: number; message?: string } | unknown;
}

function rpcUrls() {
  return [config.ETHEREUM_RPC_URL, config.ETHEREUM_RPC_FALLBACK_URL].filter((url): url is string => Boolean(url));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function callRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const body = (await response.json()) as RpcResponse<T>;
  if (body.error || body.result === undefined || body.result === null) {
    throw new Error(typeof body.error === 'object' ? JSON.stringify(body.error) : `no result: ${String(body.error)}`);
  }

  return body.result;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const errors: string[] = [];

  for (const [index, url] of rpcUrls().entries()) {
    try {
      const result = await callRpc<T>(url, method, params);
      if (index > 0) log.warn('primary failed; fallback RPC succeeded', { method, fallback: url });
      return result;
    } catch (error) {
      const message = errorMessage(error);
      errors.push(`${url}: ${message}`);
      log.warn('RPC call failed', { method, url, error: message });
    }
  }

  throw new Error(`Ethereum RPC ${method} failed on all endpoints: ${errors.join(' | ')}`);
}

function hexToInteger(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (!value.startsWith('0x')) return Number.parseInt(value, 10);
  return Number.parseInt(value.slice(2), 16);
}

async function fetchBlock() {
  const blockNumberHex = await rpc<string>('eth_blockNumber', []);
  const block = await rpc<{ timestamp?: string }>('eth_getBlockByNumber', [blockNumberHex, false]);
  const blockNumber = hexToInteger(blockNumberHex);
  const timestamp = hexToInteger(block.timestamp);

  return {
    block_number: blockNumber,
    block_timestamp: timestamp === null ? null : new Date(timestamp * 1000).toISOString(),
  };
}

export { fetchBlock, hexToInteger, rpc };
