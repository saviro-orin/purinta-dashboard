import { describe, expect, test } from 'bun:test';
import { hexToInteger } from '../server/ethereum';

describe('hexToInteger', () => {
  test('parses Ethereum hex quantities', () => {
    expect(hexToInteger('0x10')).toBe(16);
    expect(hexToInteger('0x184bf80')).toBe(25476992);
  });

  test('passes through numbers and nullish values', () => {
    expect(hexToInteger(42)).toBe(42);
    expect(hexToInteger(null)).toBeNull();
    expect(hexToInteger(undefined)).toBeNull();
  });
});
