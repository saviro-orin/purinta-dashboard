import Decimal from 'decimal.js';
import { config } from './config';
import { fetchBlock } from './ethereum';
import { MORPHO_BLUE, PURINTA_MARKETS, type PurintaMarketConfig, VAULT_ADDRESS } from './markets';
import type { PurintaMarket, PurintaSnapshot } from './types';

const MARKET_QUERY = `
  query($id: String!) {
    marketById(marketId: $id, chainId: 1) {
      marketId
      lltv
      loanAsset { symbol address decimals }
      collateralAsset { symbol address }
      state {
        borrowAssets
        borrowAssetsUsd
        supplyAssets
        supplyAssetsUsd
        utilization
        borrowApy
        supplyApy
        netSupplyApy
      }
    }
  }
`;

interface MorphoMarketResponse {
  data?: {
    marketById?: {
      state?: {
        borrowAssets?: string | number;
        borrowAssetsUsd?: string | number;
        supplyAssets?: string | number;
        supplyAssetsUsd?: string | number;
        utilization?: number;
        borrowApy?: number;
        supplyApy?: number;
        netSupplyApy?: number;
      };
    } | null;
  };
  errors?: unknown;
}

function decimalString(value: Decimal.Value, places?: number) {
  const decimal = new Decimal(value);
  return places === undefined ? decimal.toString() : decimal.toDecimalPlaces(places).toString();
}

function assetAmount(value: string | number | undefined, decimals: number) {
  return new Decimal(value ?? 0).div(new Decimal(10).pow(decimals));
}

function percent(value: number | undefined) {
  return new Decimal(value ?? 0).mul(100);
}

function usd(value: string | number | undefined) {
  return decimalString(value ?? 0, 6);
}

async function fetchMarket(market: PurintaMarketConfig): Promise<PurintaMarket> {
  const response = await fetch(config.MORPHO_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: MARKET_QUERY, variables: { id: market.id } }),
  });

  if (!response.ok) throw new Error(`Morpho market ${market.name} failed with ${response.status}`);

  const body = (await response.json()) as MorphoMarketResponse;
  if (body.errors || !body.data?.marketById?.state) throw new Error(`Morpho market ${market.name} returned no state`);

  const state = body.data.marketById.state;
  const borrowUsdc = assetAmount(state.borrowAssets, 6);
  const supplyUsdc = assetAmount(state.supplyAssets, 6);

  return {
    id: market.id,
    name: market.name,
    loan_symbol: market.loan_symbol,
    collateral_symbol: market.collateral_symbol,
    collateral_address: market.collateral_address,
    oracle_address: market.oracle_address,
    lltv: decimalString(percent(market.lltv)),
    borrow_usdc: decimalString(borrowUsdc),
    borrow_usd: usd(state.borrowAssetsUsd),
    supply_usdc: decimalString(supplyUsdc),
    supply_usd: usd(state.supplyAssetsUsd),
    utilization: decimalString(percent(state.utilization)),
    borrow_apy: decimalString(percent(state.borrowApy)),
    supply_apy: decimalString(percent(state.supplyApy)),
    net_supply_apy: decimalString(percent(state.netSupplyApy ?? state.supplyApy)),
  };
}

function sumDecimal(markets: PurintaMarket[], key: 'borrow_usdc' | 'supply_usdc') {
  return markets.reduce((total, market) => total.plus(market[key]), new Decimal(0));
}

function weightedBorrowApy(markets: PurintaMarket[], totalBorrow: Decimal) {
  if (totalBorrow.isZero()) return new Decimal(0);

  return markets
    .reduce((total, market) => total.plus(new Decimal(market.borrow_usdc).mul(market.borrow_apy)), new Decimal(0))
    .div(totalBorrow);
}

export async function fetchSnapshot(): Promise<PurintaSnapshot> {
  const [block, markets] = await Promise.all([fetchBlock(), Promise.all(PURINTA_MARKETS.map(fetchMarket))]);
  const totalBorrow = sumDecimal(markets, 'borrow_usdc');
  const totalSupply = sumDecimal(markets, 'supply_usdc');

  return {
    fetched_at: new Date().toISOString(),
    block_number: block.block_number,
    block_timestamp: block.block_timestamp,
    vault_address: VAULT_ADDRESS,
    morpho_blue: MORPHO_BLUE,
    total_borrow_usdc: decimalString(totalBorrow),
    total_supply_usdc: decimalString(totalSupply),
    weighted_borrow_apy: decimalString(weightedBorrowApy(markets, totalBorrow)),
    markets,
    status: 'live',
    event_sync: {
      status: 'unknown',
      latest_block_number: block.block_number,
      last_indexed_block: null,
      lag_blocks: null,
      normal_lag_blocks: 12,
      message: 'Waiting for local event indexer state.',
      last_error: null,
    },
  };
}
