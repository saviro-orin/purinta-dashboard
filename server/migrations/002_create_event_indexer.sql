CREATE TABLE IF NOT EXISTS indexer_state (
  name TEXT PRIMARY KEY,
  last_indexed_block INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS indexed_blocks (
  block_number INTEGER PRIMARY KEY,
  block_timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_registry (
  market_id TEXT PRIMARY KEY,
  name TEXT,
  loan_symbol TEXT,
  collateral_symbol TEXT,
  collateral_address TEXT,
  oracle_address TEXT,
  lltv TEXT,
  source TEXT NOT NULL,
  first_seen_block INTEGER NOT NULL,
  last_seen_block INTEGER NOT NULL,
  cap_assets TEXT,
  in_supply_queue INTEGER NOT NULL DEFAULT 0,
  in_withdraw_queue INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS morpho_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_name TEXT NOT NULL,
  market_id TEXT,
  account TEXT,
  assets TEXT,
  shares TEXT,
  block_number INTEGER NOT NULL,
  block_timestamp TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS morpho_events_market_block_idx
ON morpho_events (market_id, block_number, log_index);

CREATE INDEX IF NOT EXISTS morpho_events_event_block_idx
ON morpho_events (event_name, block_number, log_index);

CREATE INDEX IF NOT EXISTS morpho_events_block_idx
ON morpho_events (block_number, log_index);
