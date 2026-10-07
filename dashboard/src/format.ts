/**
 * Display helpers. No floating point anywhere near an amount: base units go
 * through the SDK's `formatAmount` (string and bigint only).
 */

import { formatAmount, parseAmount } from 'strata-sdk';

/** Format a base-unit amount. `trim` drops trailing zeros for readability. */
export function formatBaseUnits(value: bigint, decimals: number, trim = true): string {
  return formatAmount(value, decimals, { trimTrailingZeros: trim, group: true });
}

/** Format an amount together with its exact base-unit value, for auditability. */
export function formatAmountWithUnits(value: bigint, decimals: number): string {
  return `${formatBaseUnits(value, decimals)} (${value.toString()} base units)`;
}

/** A ledger timestamp (seconds) as a UTC string. Timestamps are not amounts. */
export function formatLedgerTime(seconds: bigint | number): string {
  const asNumber = typeof seconds === 'bigint' ? Number(seconds) : seconds;
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return '—';
  }
  return new Date(asNumber * 1000).toISOString().replace('.000Z', 'Z');
}

/** Human duration from a count of seconds. */
export function formatDuration(seconds: bigint): string {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total < 0) {
    return '—';
  }
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const secs = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

/** Parse a user-typed decimal amount into base units, or return an error string. */
export function tryParseAmount(
  input: string,
  decimals: number,
): { ok: true; value: bigint } | { ok: false; error: string } {
  try {
    return { ok: true, value: parseAmount(input, decimals) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Parse a user-typed percentage (e.g. `12.5` meaning 12.5%) into basis points. */
export function tryParsePercentToBps(
  input: string,
): { ok: true; value: bigint } | { ok: false; error: string } {
  // 1% = 100 bps, so two decimal places map exactly onto basis points.
  try {
    return { ok: true, value: parseAmount(input, 2) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** The freshness line every data panel shows. */
export function freshnessOf(read: {
  readonly ledger: number | null;
  readonly fetchedAt: string;
}): string {
  const ledger = read.ledger === null ? 'unknown' : read.ledger.toLocaleString('en-US');
  return `Ledger ${ledger} · fetched ${read.fetchedAt}`;
}
