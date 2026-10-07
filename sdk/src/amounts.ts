/**
 * Decimal-string <-> `bigint` base-unit conversion for on-chain amounts.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * Every amount in the Strata contracts is an `i128` count of the underlying
 * token's smallest unit (for the native XLM SAC that is stroops, 7 decimals).
 * JavaScript `number` is a double and silently loses precision above 2^53, so
 * it must never touch an amount. Everything here is string and `bigint`
 * arithmetic only; there is no floating-point operation on any path.
 *
 * `parseAmount` and `formatAmount` are the inverse of each other for every
 * value that round-trips through the base units.
 */

/** Thrown when a string is not an exact decimal amount. */
export class AmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmountError';
  }
}

/**
 * The documented ceiling on a principal, in the underlying token's smallest
 * unit. Copied from `strata-contracts/docs/waterfall-spec.md` §3
 * (`MAX_PRINCIPAL = 100_000_000_000_000_000_000_000_000`, i.e. 1e26). The spec
 * derives it from `i128` overflow headroom; it is not a guess.
 */
export const MAX_PRINCIPAL_BASE_UNITS = 100_000_000_000_000_000_000_000_000n;

/**
 * Upper bound on `decimals` accepted by the helpers. A token with more than 38
 * decimal places cannot be represented exactly in `i128` base units anyway.
 */
export const MAX_DECIMALS = 38;

/** `[sign][whole][.fraction]`, with no exponent and no thousands separators. */
const DECIMAL_PATTERN = /^([+-]?)(\d*)(?:\.(\d*))?$/;

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new AmountError(
      `decimals must be an integer in [0, ${MAX_DECIMALS}], received ${String(decimals)}`,
    );
  }
}

/**
 * Parse an exact decimal string into a `bigint` count of base units.
 *
 * `parseAmount('1.5', 7)` is `15000000n`. A fraction longer than `decimals` is
 * accepted only when the excess digits are all zero (so `'1.50000000'` with 7
 * decimals is fine but `'1.50000001'` is refused) — silently truncating a
 * non-zero digit would quietly change a value, which money code must not do.
 *
 * @throws {AmountError} if the string is not an exact decimal amount.
 */
export function parseAmount(input: string, decimals: number): bigint {
  assertDecimals(decimals);

  const text = input.trim();
  if (text === '') {
    throw new AmountError('empty amount');
  }

  const match = DECIMAL_PATTERN.exec(text);
  if (match === null) {
    throw new AmountError(`not a decimal amount: ${JSON.stringify(input)}`);
  }

  const sign = match[1] === '-' ? -1n : 1n;
  const wholePart = match[2] ?? '';
  let fractionPart = match[3] ?? '';

  if (wholePart === '' && fractionPart === '') {
    throw new AmountError(`not a decimal amount: ${JSON.stringify(input)}`);
  }

  if (fractionPart.length > decimals) {
    const excess = fractionPart.slice(decimals);
    if (!/^0*$/.test(excess)) {
      throw new AmountError(
        `too many decimal places for ${decimals} decimals: ${JSON.stringify(input)}`,
      );
    }
    fractionPart = fractionPart.slice(0, decimals);
  }

  const scale = 10n ** BigInt(decimals);
  const whole = wholePart === '' ? 0n : BigInt(wholePart);
  const fraction = BigInt(fractionPart.padEnd(decimals, '0') || '0');

  return sign * (whole * scale + fraction);
}

function groupDigits(digits: string, separator: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      out += separator;
    }
    out += digits.charAt(i);
  }
  return out;
}

/** Options for {@link formatAmount}. */
export interface FormatAmountOptions {
  /**
   * Drop trailing zeros in the fractional part. `false` (the default) always
   * prints exactly `decimals` places, so the output is exact and stable width.
   */
  trimTrailingZeros?: boolean;
  /** Group the whole part in threes. Default `false` (plain, re-parseable). */
  group?: boolean;
  /** Group separator. Default `,`. Ignored unless `group` is true. */
  groupSeparator?: string;
}

/**
 * Format a `bigint` count of base units as an exact decimal string.
 *
 * `formatAmount(15000000n, 7)` is `'1.5000000'`; with
 * `{ trimTrailingZeros: true }` it is `'1.5'`. Never uses floating point.
 *
 * @throws {AmountError} if `decimals` is out of range.
 */
export function formatAmount(
  value: bigint,
  decimals: number,
  options: FormatAmountOptions = {},
): string {
  assertDecimals(decimals);

  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = magnitude / scale;
  const fraction = magnitude % scale;

  let wholeText = whole.toString();
  let fractionText = decimals === 0 ? '' : fraction.toString().padStart(decimals, '0');

  if (decimals > 0 && options.trimTrailingZeros === true) {
    fractionText = fractionText.replace(/0+$/, '');
  }
  if (options.group === true) {
    wholeText = groupDigits(wholeText, options.groupSeparator ?? ',');
  }

  const sign = negative ? '-' : '';
  return fractionText === '' ? `${sign}${wholeText}` : `${sign}${wholeText}.${fractionText}`;
}
