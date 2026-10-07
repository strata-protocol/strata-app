import { describe, expect, it } from 'vitest';

import {
  formatAmountWithUnits,
  formatBaseUnits,
  formatDuration,
  formatLedgerTime,
  freshnessOf,
  tryParseAmount,
  tryParsePercentToBps,
} from '../src/format';

/** The pinned underlying token is native XLM: 7 decimals. */
const DECIMALS = 7;

describe('formatBaseUnits', () => {
  it('shows zero as zero rather than a dash', () => {
    expect(formatBaseUnits(0n, DECIMALS)).toBe('0');
  });

  it('trims trailing zeros by default', () => {
    expect(formatBaseUnits(15_000_000n, DECIMALS)).toBe('1.5');
    expect(formatBaseUnits(10_000_000n, DECIMALS)).toBe('1');
  });

  it('keeps full precision when trimming is off', () => {
    expect(formatBaseUnits(15_000_000n, DECIMALS, false)).toBe('1.5000000');
  });

  it('groups the whole part in threes', () => {
    expect(formatBaseUnits(1_234_567_890_123n, DECIMALS)).toBe('123,456.7890123');
  });

  it('is exact well past the float safe-integer range', () => {
    // 2^53 is about 9.007e15 base units. These are i128-scale values, so a
    // float would have silently lost digits long before here.
    const large = 123_456_789_012_345_678_901_234n;
    expect(formatBaseUnits(large, DECIMALS)).toBe('12,345,678,901,234,567.8901234');
    expect(formatBaseUnits(-15_000_000n, DECIMALS)).toBe('-1.5');
  });

  it('handles a zero-decimal token', () => {
    expect(formatBaseUnits(1_234n, 0)).toBe('1,234');
  });
});

describe('formatAmountWithUnits', () => {
  it('shows the exact base-unit value alongside the display amount', () => {
    expect(formatAmountWithUnits(15_000_000n, DECIMALS)).toBe('1.5 (15000000 base units)');
  });
});

describe('formatLedgerTime', () => {
  it('renders a ledger close time as UTC', () => {
    expect(formatLedgerTime(1_700_000_000)).toBe('2023-11-14T22:13:20Z');
  });

  it('accepts a bigint without losing precision at the seconds scale', () => {
    expect(formatLedgerTime(1_700_000_000n)).toBe('2023-11-14T22:13:20Z');
  });

  it('shows a dash for an absent timestamp', () => {
    expect(formatLedgerTime(0)).toBe('—');
    expect(formatLedgerTime(0n)).toBe('—');
    expect(formatLedgerTime(-1)).toBe('—');
    expect(formatLedgerTime(Number.NaN)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('renders sub-minute and compound durations', () => {
    expect(formatDuration(0n)).toBe('0s');
    expect(formatDuration(59n)).toBe('59s');
    expect(formatDuration(61n)).toBe('1m 1s');
    expect(formatDuration(3_661n)).toBe('1h 1m 1s');
    expect(formatDuration(90_061n)).toBe('1d 1h 1m 1s');
  });

  it('drops leading zero units but never drops seconds', () => {
    expect(formatDuration(3_600n)).toBe('1h 0s');
  });

  it('shows a dash for a negative or unreadable count', () => {
    expect(formatDuration(-1n)).toBe('—');
  });
});

describe('tryParseAmount', () => {
  it('parses an exact decimal into base units', () => {
    expect(tryParseAmount('1.5', DECIMALS)).toEqual({ ok: true, value: 15_000_000n });
    expect(tryParseAmount('0', DECIMALS)).toEqual({ ok: true, value: 0n });
    expect(tryParseAmount('  2  ', DECIMALS)).toEqual({ ok: true, value: 20_000_000n });
  });

  it('accepts excess fractional digits only when they are zero', () => {
    expect(tryParseAmount('1.50000000', DECIMALS)).toEqual({ ok: true, value: 15_000_000n });
    expect(tryParseAmount('1.50000001', DECIMALS).ok).toBe(false);
  });

  it('reports a message rather than throwing', () => {
    const empty = tryParseAmount('', DECIMALS);
    expect(empty.ok).toBe(false);
    expect(empty.ok === false && empty.error).toMatch(/empty/);

    expect(tryParseAmount('twelve', DECIMALS).ok).toBe(false);
    expect(tryParseAmount('1e6', DECIMALS).ok).toBe(false);
  });
});

describe('tryParsePercentToBps', () => {
  it('maps a percentage onto basis points exactly', () => {
    // 1% = 100bps, so 2 decimal places land on bps with no rounding.
    expect(tryParsePercentToBps('12.5')).toEqual({ ok: true, value: 1_250n });
    expect(tryParsePercentToBps('0.5')).toEqual({ ok: true, value: 50n });
    expect(tryParsePercentToBps('100')).toEqual({ ok: true, value: 10_000n });
  });

  it('accepts a negative yield, which is the loss case', () => {
    expect(tryParsePercentToBps('-0.5')).toEqual({ ok: true, value: -50n });
  });

  it('rejects a third decimal place instead of rounding it', () => {
    expect(tryParsePercentToBps('1.234').ok).toBe(false);
  });
});

describe('freshnessOf', () => {
  it('shows the ledger and the fetch time', () => {
    expect(freshnessOf({ ledger: 5_069_336, fetchedAt: '2026-10-07T00:00:00Z' })).toBe(
      'Ledger 5,069,336 · fetched 2026-10-07T00:00:00Z',
    );
  });

  it('says the ledger is unknown rather than showing zero', () => {
    // A missing ledger is not ledger zero: zero would read as a real answer.
    expect(freshnessOf({ ledger: null, fetchedAt: '2026-10-07T00:00:00Z' })).toMatch(/unknown/);
  });
});
