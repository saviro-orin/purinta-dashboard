import { z } from 'zod';

const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional());

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4300),
  SQLITE_PATH: z.string().min(1).default('./data/purinta-dashboard.sqlite3'),
  PURINTA_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
  ETHEREUM_RPC_URL: z.string().url().default('https://eth.drpc.org'),
  ETHEREUM_RPC_FALLBACK_URL: optionalUrl.default('https://eth-mainnet.public.blastapi.io'),
  MORPHO_GRAPHQL_URL: z.string().url().default('https://blue-api.morpho.org/graphql'),
  PURINTA_INDEXER_ENABLED: z.coerce.boolean().default(true),
  PURINTA_INDEXER_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  PURINTA_INDEXER_DELAY_MS: z.coerce.number().int().nonnegative().default(250),
  PURINTA_INDEXER_BATCH_BLOCKS: z.coerce.number().int().positive().default(25),
  PURINTA_INDEXER_MAX_BLOCKS_PER_RUN: z.coerce.number().int().positive().default(2_000),
  PURINTA_INDEXER_BLOCK_LAG: z.coerce.number().int().nonnegative().default(8),
  PURINTA_INDEXER_NORMAL_LAG_BLOCKS: z.coerce.number().int().nonnegative().default(12),
  PURINTA_INDEXER_START_BLOCK: z.coerce.number().int().positive().default(25_149_499),
  NODE_ENV: z.string().default('development'),
});

export const config = envSchema.parse(process.env);
