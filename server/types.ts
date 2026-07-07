export interface PurintaMarket {
  id: string;
  name: string;
  loan_symbol: string;
  collateral_symbol: string;
  collateral_address: string;
  oracle_address: string;
  lltv: string;
  borrow_usdc: string;
  borrow_usd: string;
  supply_usdc: string;
  supply_usd: string;
  utilization: string;
  borrow_apy: string;
  supply_apy: string;
  net_supply_apy: string;
}

export interface PurintaSnapshot {
  fetched_at: string | null;
  block_number: number | null;
  block_timestamp: string | null;
  vault_address: string;
  morpho_blue: string;
  total_borrow_usdc: string;
  total_supply_usdc: string;
  weighted_borrow_apy: string;
  markets: PurintaMarket[];
  status: 'syncing' | 'live' | 'error';
}

export type SnapshotMessage = { type: 'snapshot'; payload: PurintaSnapshot };
export type StatusMessage = {
  type: 'status';
  payload: { status: PurintaSnapshot['status']; message?: string };
};
export type WebsocketMessage = SnapshotMessage | StatusMessage;
