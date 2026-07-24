import type { Database } from 'bun:sqlite';

export const VAULT_ADDRESS = '0xc92A37Fd0250F4eecF092960a2F70A1334217528';
export const ROBINHOOD_VAULT_ADDRESS = '0x37788ff0c1d4e45A7FE06BC7e71e0cc00121d0A8';
export const MORPHO_BLUE = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDG_ADDRESS = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168';

export interface PurintaDeployment {
  chain_id: number;
  chain_name: string;
  vault_address: string;
  explorer_url: string;
  morpho_url: string;
}

export const PURINTA_DEPLOYMENTS: PurintaDeployment[] = [
  {
    chain_id: 1,
    chain_name: 'Ethereum',
    vault_address: VAULT_ADDRESS,
    explorer_url: 'https://etherscan.io',
    morpho_url: `https://app.morpho.org/vault?vault=${VAULT_ADDRESS}&network=mainnet`,
  },
  {
    chain_id: 4663,
    chain_name: 'Robinhood Chain',
    vault_address: ROBINHOOD_VAULT_ADDRESS,
    explorer_url: 'https://robinhoodchain.blockscout.com',
    morpho_url: `https://app.morpho.org/robinhood-chain/vault/${ROBINHOOD_VAULT_ADDRESS}/purinta-usdg?tab=vault#overview`,
  },
];

export interface PurintaMarketConfig {
  id: string;
  name: string;
  chain_id: number;
  chain_name: string;
  morpho_network: string;
  explorer_url: string;
  loan_symbol: string;
  collateral_symbol: string;
  loan_address: string;
  loan_decimals: number;
  collateral_address: string;
  oracle_address: string;
  lltv: number;
}

export type PurintaMarketTarget = Pick<
  PurintaMarketConfig,
  'id' | 'chain_id' | 'chain_name' | 'morpho_network' | 'explorer_url'
>;

export const PURINTA_MARKETS: PurintaMarketConfig[] = [
  {
    id: '0xde2bb82278de27e7851625e2d7c25280adc6d499c000cc6904eb0ab29124a481',
    name: 'PEPE / USDC',
    chain_id: 1,
    chain_name: 'Ethereum',
    morpho_network: 'mainnet',
    explorer_url: 'https://etherscan.io',
    loan_symbol: 'USDC',
    collateral_symbol: 'PEPE',
    loan_address: USDC_ADDRESS,
    loan_decimals: 6,
    collateral_address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    oracle_address: '0xAe53190c12cb206A497EB45d2be1dd0A87046501',
    lltv: 0.625,
  },
  {
    id: '0x31a277fde40c1bd37dd00cb2167fe1d5831b450efecc63323679228a101e9979',
    name: 'SPX / USDC',
    chain_id: 1,
    chain_name: 'Ethereum',
    morpho_network: 'mainnet',
    explorer_url: 'https://etherscan.io',
    loan_symbol: 'USDC',
    collateral_symbol: 'SPX',
    loan_address: USDC_ADDRESS,
    loan_decimals: 6,
    collateral_address: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C',
    oracle_address: '0x5D4ad982F7F67003c7F0c2F1807f7c3d08B80c8b',
    lltv: 0.625,
  },
  {
    id: '0x87753839ac836a59dd13f66ea6ea5481ba2374ae76dfdfbe8c4861e835833646',
    name: 'SHIB / USDC',
    chain_id: 1,
    chain_name: 'Ethereum',
    morpho_network: 'mainnet',
    explorer_url: 'https://etherscan.io',
    loan_symbol: 'USDC',
    collateral_symbol: 'SHIB',
    loan_address: USDC_ADDRESS,
    loan_decimals: 6,
    collateral_address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    oracle_address: '0x671841e7aF8067D4091C7b64DCb4f7461202d88A',
    lltv: 0.625,
  },
  {
    id: '0x039503b6308d6d818d181e626d3fbc667d6e68393c3d74332a6124cd2dd6e755',
    name: 'CASHCAT / USDG',
    chain_id: 4663,
    chain_name: 'Robinhood Chain',
    morpho_network: 'robinhood-chain',
    explorer_url: 'https://robinhoodchain.blockscout.com',
    loan_symbol: 'USDG',
    collateral_symbol: 'CASHCAT',
    loan_address: USDG_ADDRESS,
    loan_decimals: 6,
    collateral_address: '0x020bfC650A365f8BB26819deAAbF3E21291018b4',
    oracle_address: '0x1bc8eDC42a2d5ABDC094E56Bec1BebbcF516990A',
    lltv: 0.385,
  },
];

/**
 * Returns the confirmed market list plus any Ethereum market IDs learned from
 * Purinta's vault events. Once the vault activates a market, the next snapshot
 * poll resolves its metadata through Morpho and includes it without another
 * release; dynamically discovered markets disappear again once cap and queue
 * membership are all removed.
 */
export function trackedMarketTargets(db?: Database): PurintaMarketTarget[] {
  const targets = new Map<string, PurintaMarketTarget>(
    PURINTA_MARKETS.map((market) => [`${market.chain_id}:${market.id.toLowerCase()}`, market])
  );

  if (db === undefined) return [...targets.values()];

  const ethereum = PURINTA_DEPLOYMENTS.find((deployment) => deployment.chain_id === 1);
  if (ethereum === undefined) return [...targets.values()];

  const discovered = db
    .query<{ market_id: string }, []>(
      `SELECT market_id
       FROM market_registry
       WHERE in_supply_queue = 1
          OR in_withdraw_queue = 1
          OR (cap_assets IS NOT NULL AND cap_assets <> '0')`
    )
    .all();

  for (const { market_id: id } of discovered) {
    const key = `1:${id.toLowerCase()}`;
    if (targets.has(key)) continue;

    targets.set(key, {
      id,
      chain_id: 1,
      chain_name: ethereum.chain_name,
      morpho_network: 'mainnet',
      explorer_url: ethereum.explorer_url,
    });
  }

  return [...targets.values()];
}
