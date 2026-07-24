import { describe, expect, test } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { TooltipProvider } from '../client/components/Tooltip';
import { TokenLogo } from '../client/components/ui';
import Home from '../client/pages/Home';
import type { PurintaSnapshot } from '../client/types';

const snapshot: PurintaSnapshot = {
  fetched_at: '2026-07-07T00:00:00.000Z',
  block_number: 123,
  block_timestamp: '2026-07-07T00:00:00.000Z',
  vault_address: '0xc92A37Fd0250F4eecF092960a2F70A1334217528',
  morpho_blue: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
  total_borrow_usdc: '10',
  total_supply_usdc: '20',
  total_borrow_usd: '10',
  total_supply_usd: '20',
  weighted_borrow_apy: '3.5',
  status: 'live',
  event_sync: {
    status: 'syncing',
    latest_block_number: 123,
    last_indexed_block: 100,
    lag_blocks: 23,
    normal_lag_blocks: 12,
    message: 'Event indexer is 23 blocks behind Ethereum and still catching up.',
    last_error: null,
  },
  markets: [
    {
      id: 'market-1',
      name: 'PEPE / USDC',
      chain_id: 1,
      chain_name: 'Ethereum',
      morpho_network: 'mainnet',
      explorer_url: 'https://etherscan.io',
      loan_symbol: 'USDC',
      collateral_symbol: 'PEPE',
      collateral_address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
      oracle_address: '0xAe53190c12cb206A497EB45d2be1dd0A87046501',
      lltv: '62.5',
      borrow_assets: '10',
      borrow_usdc: '10',
      borrow_usd: '10',
      supply_assets: '20',
      supply_usdc: '20',
      supply_usd: '20',
      utilization: '50',
      borrow_apy: '3.5',
      supply_apy: '2',
      net_supply_apy: '2',
    },
    {
      id: 'market-2',
      name: 'CASHCAT / USDG',
      chain_id: 4663,
      chain_name: 'Robinhood Chain',
      morpho_network: 'robinhood-chain',
      explorer_url: 'https://robinhoodchain.blockscout.com',
      loan_symbol: 'USDG',
      collateral_symbol: 'CASHCAT',
      collateral_address: '0x020bfC650A365f8BB26819deAAbF3E21291018b4',
      oracle_address: '0x1bc8eDC42a2d5ABDC094E56Bec1BebbcF516990A',
      lltv: '38.5',
      borrow_assets: '12.5',
      borrow_usdc: null,
      borrow_usd: '0',
      supply_assets: '25',
      supply_usdc: null,
      supply_usd: '0',
      utilization: '0',
      borrow_apy: '0',
      supply_apy: '0',
      net_supply_apy: '0',
    },
  ],
  deployments: [
    {
      chain_id: 4663,
      chain_name: 'Robinhood Chain',
      vault_address: '0x37788ff0c1d4e45A7FE06BC7e71e0cc00121d0A8',
      explorer_url: 'https://robinhoodchain.blockscout.com',
      morpho_url:
        'https://app.morpho.org/robinhood-chain/vault/0x37788ff0c1d4e45A7FE06BC7e71e0cc00121d0A8/purinta-usdg',
    },
  ],
};

describe('Home page rendering', () => {
  test('renders tooltip-backed dashboard content inside provider', () => {
    const html = renderToString(
      <TooltipProvider>
        <Home snapshot={snapshot} />
      </TooltipProvider>
    );

    expect(html).toContain('Purinta markets');
    expect(html).toContain('Borrowed now');
    expect(html).toContain('Ethereum events catching up');
    expect(html).toContain('Current market snapshot');
    expect(html).toContain('Ethereum event ledger');
    expect(html).toContain('PEPE / USDC');
    expect(html).toContain('CASHCAT / USDG');
    expect(html).toContain('12.50');
    expect(html).toContain('Robinhood Chain');
    expect(html).toContain('<table');
    expect(html).toContain('markets across');
    expect(html).toContain('href="/market/1/market-1"');
    expect(html).toContain('href="/market/4663/market-2"');
  });

  test('renders local logos for every tracked collateral', () => {
    expect(renderToString(<TokenLogo symbol="PEPE" />)).toContain('/images/tokens/pepe.svg');
    expect(renderToString(<TokenLogo symbol="SPX" />)).toContain('/images/tokens/spx.png');
    expect(renderToString(<TokenLogo symbol="SHIB" />)).toContain('/images/tokens/shib.svg');
    expect(renderToString(<TokenLogo symbol="CASHCAT" />)).toContain('/images/tokens/cashcat.svg');
  });

  test('uses Morpho metadata for automatically discovered market logos', () => {
    expect(renderToString(<TokenLogo symbol="NEW" logoUrl="https://cdn.morpho.org/new.svg" />)).toContain(
      'https://cdn.morpho.org/new.svg'
    );
  });
});
