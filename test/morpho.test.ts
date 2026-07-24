import { describe, expect, test } from 'bun:test';
import { PURINTA_MARKETS } from '../server/markets';
import { marketQueryVariables, requiredUsd } from '../server/morpho';

describe('Morpho USD valuations', () => {
  test('queries the CASHCAT market on Robinhood Chain', () => {
    const cashcat = PURINTA_MARKETS.find((market) => market.name === 'CASHCAT / USDG');
    if (!cashcat) throw new Error('CASHCAT / USDG market is not configured');
    expect(marketQueryVariables(cashcat)).toEqual({ id: cashcat.id, chainId: 4663 });
  });

  test('rejects a missing USD valuation instead of underreporting totals', () => {
    expect(() => requiredUsd(undefined, 'CASHCAT / USDG borrow')).toThrow('missing USD valuation');
    expect(() => requiredUsd(null, 'CASHCAT / USDG supply')).toThrow('missing USD valuation');
  });

  test('rejects non-finite USD valuations', () => {
    expect(() => requiredUsd('NaN', 'CASHCAT / USDG borrow')).toThrow('invalid USD valuation');
  });

  test('normalizes a valid USD valuation', () => {
    expect(requiredUsd('123.4567894', 'PEPE / USDC borrow')).toBe('123.456789');
  });
});
