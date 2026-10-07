import { describe, expect, it } from 'vitest';

import {
  AmountError,
  MAX_PRINCIPAL_BASE_UNITS,
  formatAmount,
  parseAmount,
} from '../src/amounts.js';

const XLM_DECIMALS = 7;

describe('parseAmount', () => {
  it('parses zero', () => {
    expect(parseAmount('0', XLM_DECIMALS)).toBe(0n);
    expect(parseAmount('0.0', XLM_DECIMALS)).toBe(0n);
    expect(parseAmount('.0', XLM_DECIMALS)).toBe(0n);
    expect(parseAmount('0.0000000', XLM_DECIMALS)).toBe(0n);
  });

  it('parses the maximum principal documented in the waterfall spec', () => {
    // 1e26 base units. With 7 decimals that is 10000000000000000000 whole XLM.
    const maximum = '10000000000000000000.0000000';
    expect(parseAmount(maximum, XLM_DECIMALS)).toBe(MAX_PRINCIPAL_BASE_UNITS);
    expect(parseAmount(`+${maximum}`, XLM_DECIMALS)).toBe(MAX_PRINCIPAL_BASE_UNITS);
    expect(MAX_PRINCIPAL_BASE_UNITS).toBe(100_000_000_000_000_000_000_000_000n);
  });

  it('handles trailing zeros exactly', () => {
    expect(parseAmount('1.5', XLM_DECIMALS)).toBe(15_000_000n);
    expect(parseAmount('1.5000000', XLM_DECIMALS)).toBe(15_000_000n);
    expect(parseAmount('1.50000000', XLM_DECIMALS)).toBe(15_000_000n);
    expect(parseAmount('0001.5', XLM_DECIMALS)).toBe(15_000_000n);
  });

  it('parses negatives (used for signed yield figures)', () => {
    expect(parseAmount('-1.5', XLM_DECIMALS)).toBe(-15_000_000n);
  });

  it('respects the decimals argument', () => {
    expect(parseAmount('1', 0)).toBe(1n);
    expect(parseAmount('1.5', 2)).toBe(150n);
    expect(parseAmount('1.5', 18)).toBe(1_500_000_000_000_000_000n);
  });

  it('never returns a number', () => {
    expect(typeof parseAmount('1.5', XLM_DECIMALS)).toBe('bigint');
  });

  it('refuses a non-zero digit beyond the declared decimals', () => {
    expect(() => parseAmount('1.50000001', XLM_DECIMALS)).toThrow(AmountError);
    expect(() => parseAmount('0.123', 2)).toThrow(AmountError);
  });

  it('refuses non-decimal input', () => {
    for (const bad of ['', ' ', 'abc', '1,000', '1e7', '1.2.3', '+', '.', '1 000']) {
      expect(() => parseAmount(bad, XLM_DECIMALS), bad).toThrow(AmountError);
    }
  });

  it('refuses an out-of-range decimals argument', () => {
    expect(() => parseAmount('1', -1)).toThrow(AmountError);
    expect(() => parseAmount('1', 39)).toThrow(AmountError);
    expect(() => parseAmount('1', 1.5)).toThrow(AmountError);
  });
});

describe('formatAmount', () => {
  it('formats zero', () => {
    expect(formatAmount(0n, XLM_DECIMALS)).toBe('0.0000000');
    expect(formatAmount(0n, XLM_DECIMALS, { trimTrailingZeros: true })).toBe('0');
    expect(formatAmount(0n, 0)).toBe('0');
  });

  it('formats trailing zeros exactly by default', () => {
    expect(formatAmount(15_000_000n, XLM_DECIMALS)).toBe('1.5000000');
    expect(formatAmount(10_000_000n, XLM_DECIMALS)).toBe('1.0000000');
  });

  it('can trim trailing zeros for display', () => {
    expect(formatAmount(15_000_000n, XLM_DECIMALS, { trimTrailingZeros: true })).toBe('1.5');
    expect(formatAmount(10_000_000n, XLM_DECIMALS, { trimTrailingZeros: true })).toBe('1');
  });

  it('formats the maximum principal', () => {
    expect(formatAmount(MAX_PRINCIPAL_BASE_UNITS, XLM_DECIMALS)).toBe(
      '10000000000000000000.0000000',
    );
    // and it round-trips
    expect(
      parseAmount(formatAmount(MAX_PRINCIPAL_BASE_UNITS, XLM_DECIMALS), XLM_DECIMALS),
    ).toBe(MAX_PRINCIPAL_BASE_UNITS);
  });

  it('formats negatives', () => {
    expect(formatAmount(-15_000_000n, XLM_DECIMALS)).toBe('-1.5000000');
  });

  it('pads the fractional part', () => {
    expect(formatAmount(1n, XLM_DECIMALS)).toBe('0.0000001');
    expect(formatAmount(999n, 3)).toBe('0.999');
  });

  it('can group thousands', () => {
    expect(formatAmount(123_456_789n, 2, { group: true })).toBe('1,234,567.89');
    expect(formatAmount(1_234_567_890n, 2, { trimTrailingZeros: true, group: true })).toBe(
      '12,345,678.9',
    );
    expect(formatAmount(123n, 0, { group: true, groupSeparator: ' ' })).toBe('123');
    expect(formatAmount(1_234_567n, 0, { group: true, groupSeparator: ' ' })).toBe('1 234 567');
  });

  it('round-trips a range of values exactly', () => {
    const samples = [0n, 1n, 9n, 10n, 123_456_789n, -42n, MAX_PRINCIPAL_BASE_UNITS];
    for (const sample of samples) {
      expect(parseAmount(formatAmount(sample, XLM_DECIMALS), XLM_DECIMALS)).toBe(sample);
    }
  });
});
