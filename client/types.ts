export interface Flash {
  info?: string;
  error?: string;
}

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

export type HistoryRange = '24h' | '7d' | '30d';

export interface MarketHistoryPoint {
  t: string;
  borrow_usdc: number;
  supply_usdc: number;
  utilization: number;
  borrow_apy: number;
  net_supply_apy: number;
}

export interface MarketHistory {
  market_id: string;
  range: HistoryRange;
  points: MarketHistoryPoint[];
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
  weighted_borrow_apy: string;
  markets: PurintaMarket[];
  status: string;
  event_sync: EventSyncStatus;
}
