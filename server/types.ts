export interface PurintaMarket {
  id: string;
  name: string;
  chain_id: number;
  chain_name: string;
  morpho_network: string;
  explorer_url: string;
  loan_symbol: string;
  collateral_symbol: string;
  collateral_address: string;
  collateral_logo_url?: string | null;
  oracle_address: string;
  lltv: string;
  borrow_assets: string;
  /** @deprecated Use borrow_assets. Null for non-USDC loan markets. */
  borrow_usdc: string | null;
  borrow_usd: string;
  supply_assets: string;
  /** @deprecated Use supply_assets. Null for non-USDC loan markets. */
  supply_usdc: string | null;
  supply_usd: string;
  utilization: string;
  borrow_apy: string;
  supply_apy: string;
  net_supply_apy: string;
}

export interface PurintaDeployment {
  chain_id: number;
  chain_name: string;
  vault_address: string;
  explorer_url: string;
  morpho_url: string;
}

export interface EventSyncStatus {
  status: 'live' | 'syncing' | 'error' | 'disabled' | 'unknown';
  latest_block_number: number | null;
  last_indexed_block: number | null;
  lag_blocks: number | null;
  normal_lag_blocks: number;
  message: string;
  last_error: string | null;
}

export interface PurintaSnapshot {
  fetched_at: string | null;
  block_number: number | null;
  block_timestamp: string | null;
  vault_address: string;
  morpho_blue: string;
  total_borrow_usdc: string;
  total_supply_usdc: string;
  total_borrow_usd: string;
  total_supply_usd: string;
  weighted_borrow_apy: string;
  markets: PurintaMarket[];
  deployments: PurintaDeployment[];
  status: 'syncing' | 'live' | 'error';
  event_sync: EventSyncStatus;
}

export type SnapshotMessage = { type: 'snapshot'; payload: PurintaSnapshot };
export type StatusMessage = {
  type: 'status';
  payload: { status: PurintaSnapshot['status']; message?: string };
};
export type WebsocketMessage = SnapshotMessage | StatusMessage;
