import type { Database } from 'bun:sqlite';
import Decimal from 'decimal.js';
import { config } from './config';
import { fetchBlock } from './ethereum';
import {
  MORPHO_BLUE,
  PURINTA_DEPLOYMENTS,
  type PurintaMarketTarget,
  trackedMarketTargets,
  VAULT_ADDRESS,
} from './markets';
import type { PurintaMarket, PurintaSnapshot } from './types';

const MARKET_QUERY = `
  query($id: String!, $chainId: Int!) {
    marketById(marketId: $id, chainId: $chainId) {
      marketId
      lltv
      loanAsset { symbol address decimals }
      collateralAsset { symbol address logoURI }
      oracle { address }
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
      marketId: string;
      lltv: string;
      loanAsset: { symbol: string; address: string; decimals: number };
      collateralAsset: { symbol: string; address: string; logoURI?: string | null };
      oracle?: { address?: string | null } | null;
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

export function requiredUsd(value: string | number | null | undefined, label: string) {
  if (value === null || value === undefined) throw new Error(`${label} is missing USD valuation`);
  const decimal = new Decimal(value);
  if (!decimal.isFinite() || decimal.isNegative()) throw new Error(`${label} has invalid USD valuation`);
  return decimalString(decimal, 6);
}

export function marketQueryVariables(market: PurintaMarketTarget) {
  return { id: market.id, chainId: market.chain_id };
}

async function fetchMarket(market: PurintaMarketTarget): Promise<PurintaMarket> {
  const response = await fetch(config.MORPHO_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: MARKET_QUERY, variables: marketQueryVariables(market) }),
  });

  if (!response.ok) throw new Error(`Morpho market ${market.id} failed with ${response.status}`);

  const body = (await response.json()) as MorphoMarketResponse;
  if (body.errors || !body.data?.marketById?.state) throw new Error(`Morpho market ${market.id} returned no state`);

  const remote = body.data.marketById;
  const state = remote.state;
  if (state === undefined) throw new Error(`Morpho market ${market.id} returned no state`);
  const borrowAssets = assetAmount(state.borrowAssets, remote.loanAsset.decimals);
  const supplyAssets = assetAmount(state.supplyAssets, remote.loanAsset.decimals);
  const name = `${remote.collateralAsset.symbol} / ${remote.loanAsset.symbol}`;

  return {
    id: market.id,
    name,
    chain_id: market.chain_id,
    chain_name: market.chain_name,
    morpho_network: market.morpho_network,
    explorer_url: market.explorer_url,
    loan_symbol: remote.loanAsset.symbol,
    collateral_symbol: remote.collateralAsset.symbol,
    collateral_address: remote.collateralAsset.address,
    collateral_logo_url: remote.collateralAsset.logoURI ?? null,
    oracle_address: remote.oracle?.address ?? '',
    lltv: decimalString(new Decimal(remote.lltv).div('10000000000000000')),
    borrow_assets: decimalString(borrowAssets),
    borrow_usdc: remote.loanAsset.symbol === 'USDC' ? decimalString(borrowAssets) : null,
    borrow_usd: requiredUsd(state.borrowAssetsUsd, `${name} borrow`),
    supply_assets: decimalString(supplyAssets),
    supply_usdc: remote.loanAsset.symbol === 'USDC' ? decimalString(supplyAssets) : null,
    supply_usd: requiredUsd(state.supplyAssetsUsd, `${name} supply`),
    utilization: decimalString(percent(state.utilization)),
    borrow_apy: decimalString(percent(state.borrowApy)),
    supply_apy: decimalString(percent(state.supplyApy)),
    net_supply_apy: decimalString(percent(state.netSupplyApy ?? state.supplyApy)),
  };
}

function sumDecimal(markets: PurintaMarket[], key: 'borrow_assets' | 'supply_assets' | 'borrow_usd' | 'supply_usd') {
  return markets.reduce((total, market) => total.plus(market[key]), new Decimal(0));
}

function weightedBorrowApy(markets: PurintaMarket[], totalBorrowUsd: Decimal) {
  if (totalBorrowUsd.isZero()) return new Decimal(0);

  return markets
    .reduce((total, market) => total.plus(new Decimal(market.borrow_usd).mul(market.borrow_apy)), new Decimal(0))
    .div(totalBorrowUsd);
}

export async function fetchSnapshot(db?: Database): Promise<PurintaSnapshot> {
  const targets = trackedMarketTargets(db);
  const [block, markets] = await Promise.all([fetchBlock(), Promise.all(targets.map(fetchMarket))]);
  const usdcMarkets = markets.filter((market) => market.loan_symbol === 'USDC');
  const totalBorrow = sumDecimal(usdcMarkets, 'borrow_assets');
  const totalSupply = sumDecimal(usdcMarkets, 'supply_assets');
  const totalBorrowUsd = sumDecimal(markets, 'borrow_usd');
  const totalSupplyUsd = sumDecimal(markets, 'supply_usd');

  return {
    fetched_at: new Date().toISOString(),
    block_number: block.block_number,
    block_timestamp: block.block_timestamp,
    vault_address: VAULT_ADDRESS,
    morpho_blue: MORPHO_BLUE,
    total_borrow_usdc: decimalString(totalBorrow),
    total_supply_usdc: decimalString(totalSupply),
    total_borrow_usd: decimalString(totalBorrowUsd),
    total_supply_usd: decimalString(totalSupplyUsd),
    weighted_borrow_apy: decimalString(weightedBorrowApy(markets, totalBorrowUsd)),
    markets,
    deployments: PURINTA_DEPLOYMENTS,
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
