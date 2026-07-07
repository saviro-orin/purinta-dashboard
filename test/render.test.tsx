import { describe, expect, test } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { TooltipProvider } from '../client/components/Tooltip';
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
  weighted_borrow_apy: '3.5',
  status: 'live',
  markets: [
    {
      id: 'market-1',
      name: 'PEPE / USDC',
      loan_symbol: 'USDC',
      collateral_symbol: 'PEPE',
      collateral_address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
      oracle_address: '0xAe53190c12cb206A497EB45d2be1dd0A87046501',
      lltv: '62.5',
      borrow_usdc: '10',
      borrow_usd: '10',
      supply_usdc: '20',
      supply_usd: '20',
      utilization: '50',
      borrow_apy: '3.5',
      supply_apy: '2',
      net_supply_apy: '2',
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

    expect(html).toContain('How much USDC is borrowed');
    expect(html).toContain('Market table');
    expect(html).toContain('PEPE / USDC');
  });
});
