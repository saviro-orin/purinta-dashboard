import type { Database } from 'bun:sqlite';
import { decodeEventLog, type Hex, parseAbiItem, toEventSelector } from 'viem';
import { config } from './config';
import { hexToInteger, rpc } from './ethereum';
import { createLogger } from './logger';
import { MORPHO_BLUE, PURINTA_MARKETS, VAULT_ADDRESS } from './markets';
import type { EventSyncStatus } from './types';

const INDEXER_NAME = 'morpho-events';
const USDC_DECIMALS = 6;
const log = createLogger('event-indexer');

const MORPHO_EVENTS = [
  parseAbiItem(
    'event Supply(bytes32 indexed id, address indexed caller, address indexed onBehalf, uint256 assets, uint256 shares)'
  ),
  parseAbiItem(
    'event Withdraw(bytes32 indexed id, address indexed caller, address indexed onBehalf, address receiver, uint256 assets, uint256 shares)'
  ),
  parseAbiItem(
    'event Borrow(bytes32 indexed id, address indexed caller, address indexed onBehalf, address receiver, uint256 assets, uint256 shares)'
  ),
  parseAbiItem(
    'event Repay(bytes32 indexed id, address indexed caller, address indexed onBehalf, uint256 assets, uint256 shares)'
  ),
  parseAbiItem(
    'event Liquidate(bytes32 indexed id, address indexed caller, address indexed borrower, uint256 repaidAssets, uint256 repaidShares, uint256 seizedAssets, uint256 badDebtAssets, uint256 badDebtShares)'
  ),
];

const VAULT_EVENTS = [
  parseAbiItem('event SetCap(address indexed caller, bytes32 indexed id, uint256 cap)'),
  parseAbiItem('event SubmitCap(address indexed caller, bytes32 indexed id, uint256 cap)'),
  parseAbiItem('event SetSupplyQueue(address indexed caller, bytes32[] newSupplyQueue)'),
  parseAbiItem('event SetWithdrawQueue(address indexed caller, bytes32[] newWithdrawQueue)'),
  parseAbiItem(
    'event ReallocateSupply(address indexed caller, bytes32 indexed id, uint256 suppliedAssets, uint256 suppliedShares)'
  ),
  parseAbiItem(
    'event ReallocateWithdraw(address indexed caller, bytes32 indexed id, uint256 withdrawnAssets, uint256 withdrawnShares)'
  ),
];

const MORPHO_EVENT_TOPICS = MORPHO_EVENTS.map((event) => toEventSelector(event));
const VAULT_EVENT_TOPICS = VAULT_EVENTS.map((event) => toEventSelector(event));

interface RpcLog {
  address: string;
  topics: Hex[];
  data: Hex;
  blockNumber: Hex;
  transactionHash: string;
  logIndex: Hex;
}

interface IndexerState {
  last_indexed_block: number;
  status: string;
  last_error: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.toLowerCase();
}

function bigintString(value: unknown) {
  return typeof value === 'bigint' ? value.toString() : String(value ?? '0');
}

function usdcString(rawAssets: string) {
  const value = BigInt(rawAssets);
  const divisor = 10n ** BigInt(USDC_DECIMALS);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionText = fraction.toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
  return fractionText.length === 0 ? whole.toString() : `${whole.toString()}.${fractionText}`;
}

function toIso(timestamp: number) {
  return new Date(timestamp * 1000).toISOString();
}

function knownMarket(marketId: string) {
  return PURINTA_MARKETS.find((market) => market.id.toLowerCase() === marketId.toLowerCase());
}

function initialLastIndexedBlock() {
  return config.PURINTA_INDEXER_START_BLOCK - 1;
}

function ensureSeedMarkets(db: Database) {
  const statement = db.query(
    `INSERT INTO market_registry (
       market_id, name, loan_symbol, collateral_symbol, collateral_address, oracle_address, lltv,
       source, first_seen_block, last_seen_block, cap_assets, in_supply_queue, in_withdraw_queue, updated_at
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'configured', ?8, ?8, NULL, 0, 0, ?9)
     ON CONFLICT(market_id) DO UPDATE SET
       name = excluded.name,
       loan_symbol = excluded.loan_symbol,
       collateral_symbol = excluded.collateral_symbol,
       collateral_address = excluded.collateral_address,
       oracle_address = excluded.oracle_address,
       lltv = excluded.lltv,
       updated_at = excluded.updated_at`
  );
  const now = new Date().toISOString();

  for (const market of PURINTA_MARKETS) {
    statement.run(
      market.id.toLowerCase(),
      market.name,
      market.loan_symbol,
      market.collateral_symbol,
      market.collateral_address,
      market.oracle_address,
      String(market.lltv),
      config.PURINTA_INDEXER_START_BLOCK,
      now
    );
  }
}

function getState(db: Database): IndexerState {
  const row = db
    .query<IndexerState, [string]>('SELECT last_indexed_block, status, last_error FROM indexer_state WHERE name = ?1')
    .get(INDEXER_NAME);

  if (row) return row;

  const now = new Date().toISOString();
  db.query(
    'INSERT INTO indexer_state (name, last_indexed_block, updated_at, status, last_error) VALUES (?1, ?2, ?3, ?4, NULL)'
  ).run(INDEXER_NAME, initialLastIndexedBlock(), now, 'initialized');

  return { last_indexed_block: initialLastIndexedBlock(), status: 'initialized', last_error: null };
}

function classifyEventSync(db: Database, latestBlockNumber: number | null): EventSyncStatus {
  if (!config.PURINTA_INDEXER_ENABLED) {
    return {
      status: 'disabled',
      latest_block_number: latestBlockNumber,
      last_indexed_block: null,
      lag_blocks: null,
      normal_lag_blocks: config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS,
      message: 'Event indexer is disabled.',
      last_error: null,
    };
  }

  const state = getState(db);
  const lagBlocks = latestBlockNumber === null ? null : Math.max(0, latestBlockNumber - state.last_indexed_block);

  if (state.status === 'error') {
    return {
      status: 'error',
      latest_block_number: latestBlockNumber,
      last_indexed_block: state.last_indexed_block,
      lag_blocks: lagBlocks,
      normal_lag_blocks: config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS,
      message: 'Event indexing hit an RPC or app error. The dashboard will resume from the last indexed block.',
      last_error: state.last_error,
    };
  }

  if (lagBlocks === null) {
    return {
      status: 'unknown',
      latest_block_number: latestBlockNumber,
      last_indexed_block: state.last_indexed_block,
      lag_blocks: null,
      normal_lag_blocks: config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS,
      message: 'Waiting for latest Ethereum block height before measuring event sync lag.',
      last_error: state.last_error,
    };
  }

  if (lagBlocks <= config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS) {
    return {
      status: 'live',
      latest_block_number: latestBlockNumber,
      last_indexed_block: state.last_indexed_block,
      lag_blocks: lagBlocks,
      normal_lag_blocks: config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS,
      message: `Event indexer is within the normal ${config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS}-block lag window.`,
      last_error: state.last_error,
    };
  }

  return {
    status: 'syncing',
    latest_block_number: latestBlockNumber,
    last_indexed_block: state.last_indexed_block,
    lag_blocks: lagBlocks,
    normal_lag_blocks: config.PURINTA_INDEXER_NORMAL_LAG_BLOCKS,
    message: `Event indexer is ${lagBlocks.toLocaleString()} blocks behind Ethereum and still catching up.`,
    last_error: state.last_error,
  };
}

function setState(db: Database, lastIndexedBlock: number, status: string, lastError: string | null) {
  db.query(
    `INSERT INTO indexer_state (name, last_indexed_block, updated_at, status, last_error)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(name) DO UPDATE SET
       last_indexed_block = excluded.last_indexed_block,
       updated_at = excluded.updated_at,
       status = excluded.status,
       last_error = excluded.last_error`
  ).run(INDEXER_NAME, lastIndexedBlock, new Date().toISOString(), status, lastError);
}

function eventId(entry: RpcLog) {
  return `${entry.transactionHash}-${Number(hexToInteger(entry.logIndex) ?? 0)}`;
}

function saveBlock(db: Database, blockNumber: number, timestamp: string) {
  db.query('INSERT OR IGNORE INTO indexed_blocks (block_number, block_timestamp) VALUES (?1, ?2)').run(
    blockNumber,
    timestamp
  );
}

function upsertRegistryFromMarketId(
  db: Database,
  marketId: string,
  source: string,
  blockNumber: number,
  updates: Record<string, unknown> = {}
) {
  const configured = knownMarket(marketId);
  const now = new Date().toISOString();
  const existing = db
    .query<{ market_id: string }, [string]>('SELECT market_id FROM market_registry WHERE market_id = ?1')
    .get(marketId);

  if (!existing) {
    db.query(
      `INSERT INTO market_registry (
         market_id, name, loan_symbol, collateral_symbol, collateral_address, oracle_address, lltv,
         source, first_seen_block, last_seen_block, cap_assets, in_supply_queue, in_withdraw_queue, updated_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9, ?10, ?11, ?12, ?13)`
    ).run(
      marketId,
      configured?.name ?? null,
      configured?.loan_symbol ?? null,
      configured?.collateral_symbol ?? null,
      configured?.collateral_address ?? null,
      configured?.oracle_address ?? null,
      configured === undefined ? null : String(configured.lltv),
      source,
      blockNumber,
      updates.cap_assets === undefined ? null : String(updates.cap_assets),
      Number(updates.in_supply_queue ?? 0),
      Number(updates.in_withdraw_queue ?? 0),
      now
    );
    return;
  }

  const entries = Object.entries(updates);
  const setClauses = [
    'last_seen_block = ?2',
    'updated_at = ?3',
    ...entries.map(([key], index) => `${key} = ?${index + 4}`),
  ];
  const values = entries.map(([, value]) => (typeof value === 'number' ? value : String(value ?? '')));
  db.query(`UPDATE market_registry SET ${setClauses.join(', ')} WHERE market_id = ?1`).run(
    marketId,
    blockNumber,
    now,
    ...values
  );
}

function saveEvent(
  db: Database,
  source: string,
  entry: RpcLog,
  decoded: { eventName: string; args: Record<string, unknown> },
  timestamp: string
) {
  const blockNumber = hexToInteger(entry.blockNumber);
  const logIndex = hexToInteger(entry.logIndex);
  if (blockNumber === null || logIndex === null) throw new Error('indexed log missing block or log index');

  const args = decoded.args;
  const marketId = typeof args.id === 'string' ? args.id.toLowerCase() : null;
  const account =
    typeof args.onBehalf === 'string' ? args.onBehalf : typeof args.borrower === 'string' ? args.borrower : null;
  const assets =
    'assets' in args ? bigintString(args.assets) : 'repaidAssets' in args ? bigintString(args.repaidAssets) : '0';
  const shares =
    'shares' in args ? bigintString(args.shares) : 'repaidShares' in args ? bigintString(args.repaidShares) : '0';

  if (marketId) upsertRegistryFromMarketId(db, marketId, source, blockNumber);

  db.query(
    `INSERT OR IGNORE INTO morpho_events (
       id, source, event_name, market_id, account, assets, shares, block_number, block_timestamp,
       transaction_hash, log_index, payload
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
  ).run(
    eventId(entry),
    source,
    decoded.eventName,
    marketId,
    account === null ? null : account.toLowerCase(),
    assets,
    shares,
    blockNumber,
    timestamp,
    entry.transactionHash,
    logIndex,
    JSON.stringify(args, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

function decodeLog(entry: RpcLog) {
  const address = normalize(entry.address);
  const candidates =
    address === normalize(MORPHO_BLUE) ? MORPHO_EVENTS : address === normalize(VAULT_ADDRESS) ? VAULT_EVENTS : [];

  for (const abiItem of candidates) {
    try {
      const decoded = decodeEventLog({ abi: [abiItem], data: entry.data, topics: entry.topics as [Hex, ...Hex[]] });
      return { eventName: decoded.eventName, args: decoded.args as Record<string, unknown> };
    } catch {
      // Try the next event signature for this contract.
    }
  }

  return null;
}

function updateVaultRegistry(
  db: Database,
  decoded: { eventName: string; args: Record<string, unknown> },
  blockNumber: number
) {
  const args = decoded.args;

  if ((decoded.eventName === 'SetCap' || decoded.eventName === 'SubmitCap') && typeof args.id === 'string') {
    upsertRegistryFromMarketId(db, args.id.toLowerCase(), 'vault', blockNumber, { cap_assets: bigintString(args.cap) });
    return;
  }

  if (decoded.eventName === 'SetSupplyQueue' && Array.isArray(args.newSupplyQueue)) {
    db.exec('UPDATE market_registry SET in_supply_queue = 0');
    for (const id of args.newSupplyQueue) {
      if (typeof id === 'string')
        upsertRegistryFromMarketId(db, id.toLowerCase(), 'vault', blockNumber, { in_supply_queue: 1 });
    }
    return;
  }

  if (decoded.eventName === 'SetWithdrawQueue' && Array.isArray(args.newWithdrawQueue)) {
    db.exec('UPDATE market_registry SET in_withdraw_queue = 0');
    for (const id of args.newWithdrawQueue) {
      if (typeof id === 'string')
        upsertRegistryFromMarketId(db, id.toLowerCase(), 'vault', blockNumber, { in_withdraw_queue: 1 });
    }
  }
}

function indexedMarketIds(db: Database) {
  const rows = db.query<{ market_id: string }, []>('SELECT market_id FROM market_registry').all();
  const ids = rows.map((row) => row.market_id as Hex);
  return ids.length === 0 ? PURINTA_MARKETS.map((market) => market.id as Hex) : ids;
}

function sortLogs(entries: RpcLog[]) {
  return entries.sort((left, right) => {
    const leftBlock = hexToInteger(left.blockNumber) ?? 0;
    const rightBlock = hexToInteger(right.blockNumber) ?? 0;
    if (leftBlock !== rightBlock) return leftBlock - rightBlock;
    return (hexToInteger(left.logIndex) ?? 0) - (hexToInteger(right.logIndex) ?? 0);
  });
}

async function fetchLogsStrict(db: Database, fromBlock: number, toBlock: number) {
  const range = {
    fromBlock: `0x${fromBlock.toString(16)}`,
    toBlock: `0x${toBlock.toString(16)}`,
  };
  const marketIds = indexedMarketIds(db);
  const [vaultLogs, marketLogs] = await Promise.all([
    rpc<RpcLog[]>('eth_getLogs', [
      {
        address: VAULT_ADDRESS,
        ...range,
        topics: [VAULT_EVENT_TOPICS],
      },
    ]),
    rpc<RpcLog[]>('eth_getLogs', [
      {
        address: MORPHO_BLUE,
        ...range,
        topics: [MORPHO_EVENT_TOPICS, marketIds],
      },
    ]),
  ]);

  return sortLogs([...vaultLogs, ...marketLogs]);
}

async function fetchLogs(db: Database, fromBlock: number, toBlock: number): Promise<RpcLog[]> {
  try {
    return await fetchLogsStrict(db, fromBlock, toBlock);
  } catch (error) {
    if (fromBlock >= toBlock) throw error;

    const message = error instanceof Error ? error.message : String(error);
    const midpoint = Math.floor((fromBlock + toBlock) / 2);
    log.warn('splitting indexer range after RPC rejection', {
      fromBlock,
      toBlock,
      leftToBlock: midpoint,
      rightFromBlock: midpoint + 1,
      error: message,
    });
    const left = await fetchLogs(db, fromBlock, midpoint);
    const right = await fetchLogs(db, midpoint + 1, toBlock);
    return sortLogs([...left, ...right]);
  }
}

async function fetchBlockTimestamp(blockNumber: number) {
  const block = await rpc<{ timestamp?: string }>('eth_getBlockByNumber', [`0x${blockNumber.toString(16)}`, false]);
  const timestamp = hexToInteger(block.timestamp);
  if (timestamp === null) throw new Error(`block ${blockNumber} returned no timestamp`);
  return toIso(timestamp);
}

async function indexRange(db: Database, fromBlock: number, toBlock: number) {
  const entries = await fetchLogs(db, fromBlock, toBlock);
  const timestampCache = new Map<number, string>();
  let saved = 0;

  for (const entry of entries) {
    const blockNumber = hexToInteger(entry.blockNumber);
    if (blockNumber === null) continue;

    const decoded = decodeLog(entry);
    if (!decoded) continue;

    let timestamp = timestampCache.get(blockNumber);
    if (!timestamp) {
      timestamp = fetchExistingBlockTimestamp(db, blockNumber) ?? (await fetchBlockTimestamp(blockNumber));
      timestampCache.set(blockNumber, timestamp);
      saveBlock(db, blockNumber, timestamp);
    }

    saveEvent(
      db,
      normalize(entry.address) === normalize(VAULT_ADDRESS) ? 'metamorpho_vault' : 'morpho_blue',
      entry,
      decoded,
      timestamp
    );
    if (normalize(entry.address) === normalize(VAULT_ADDRESS)) updateVaultRegistry(db, decoded, blockNumber);
    saved += 1;
  }

  setState(db, toBlock, 'live', null);
  return { logs: entries.length, saved };
}

function fetchExistingBlockTimestamp(db: Database, blockNumber: number) {
  return db
    .query<{ block_timestamp: string }, [number]>('SELECT block_timestamp FROM indexed_blocks WHERE block_number = ?1')
    .get(blockNumber)?.block_timestamp;
}

async function runIndexerOnce(db: Database) {
  ensureSeedMarkets(db);
  const state = getState(db);
  const latestHex = await rpc<string>('eth_blockNumber', []);
  const latest = hexToInteger(latestHex);
  if (latest === null) throw new Error('eth_blockNumber returned no block');

  const target = Math.max(config.PURINTA_INDEXER_START_BLOCK - 1, latest - config.PURINTA_INDEXER_BLOCK_LAG);
  const start = Math.max(state.last_indexed_block + 1, config.PURINTA_INDEXER_START_BLOCK);
  const maxTo = Math.min(target, state.last_indexed_block + config.PURINTA_INDEXER_MAX_BLOCKS_PER_RUN);

  if (start > maxTo) {
    log.info('already caught up', { lastIndexedBlock: state.last_indexed_block, target });
    setState(db, state.last_indexed_block, 'caught_up', null);
    return { fromBlock: start, toBlock: maxTo, ranges: 0, logs: 0, saved: 0 };
  }

  let cursor = start;
  let ranges = 0;
  let logs = 0;
  let saved = 0;
  log.info('indexing run started', {
    fromBlock: start,
    toBlock: maxTo,
    batchBlocks: config.PURINTA_INDEXER_BATCH_BLOCKS,
  });

  while (cursor <= maxTo) {
    const toBlock = Math.min(maxTo, cursor + config.PURINTA_INDEXER_BATCH_BLOCKS - 1);
    const result = await indexRange(db, cursor, toBlock);
    ranges += 1;
    logs += result.logs;
    saved += result.saved;
    cursor = toBlock + 1;

    if (cursor <= maxTo && config.PURINTA_INDEXER_DELAY_MS > 0) await sleep(config.PURINTA_INDEXER_DELAY_MS);
  }

  log.info('indexing run completed', { fromBlock: start, toBlock: maxTo, ranges, logs, saved });
  return { fromBlock: start, toBlock: maxTo, ranges, logs, saved };
}

function startEventIndexer(db: Database) {
  if (!config.PURINTA_INDEXER_ENABLED) {
    log.info('disabled by configuration');
    return () => undefined;
  }

  let running = false;

  async function tick() {
    if (running) {
      log.warn('previous indexing run still active; skipping tick');
      return;
    }

    running = true;
    try {
      await runIndexerOnce(db);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const state = getState(db);
      setState(db, state.last_indexed_block, 'error', message);
      log.error('indexing run failed', { error: message, lastIndexedBlock: state.last_indexed_block });
    } finally {
      running = false;
    }
  }

  const interval = setInterval(() => void tick(), config.PURINTA_INDEXER_INTERVAL_MS);
  void tick();

  return () => clearInterval(interval);
}

export { classifyEventSync, getState as eventIndexerState, runIndexerOnce, startEventIndexer, usdcString };
