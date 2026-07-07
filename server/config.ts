import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4300),
  SQLITE_PATH: z.string().min(1).default('./data/purinta-dashboard.sqlite3'),
  PURINTA_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
  ETHEREUM_RPC_URL: z.string().url().default('https://ethereum-rpc.publicnode.com'),
  MORPHO_GRAPHQL_URL: z.string().url().default('https://blue-api.morpho.org/graphql'),
  NODE_ENV: z.string().default('development'),
});

export const config = envSchema.parse(process.env);
