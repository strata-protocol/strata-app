import { describe, expect, it } from 'vitest';

import { expectOk, fixture, type FixtureProjectedSplit } from './fixture.js';

/**
 * `project()` is checked against worked numbers, not against a second
 * implementation of the waterfall. The app deliberately does not reimplement
 * the split in TypeScript; expected outputs are hand-computed from
 * `strata-contracts/docs/waterfall-spec.md` and frozen here as test vectors.
 *
 * The one thing derived here is the spec's section 4 interest term, so the
 * vectors cannot silently be stale relative to the epoch's own terms. That is
 * the `senior_due` formula only, not the split.
 *
 * Terms of the deployed demo epoch (from the captured fixture, and matching
 * `strata-contracts/docs/deployment.md`):
 *   S = J = 1 000 000 000 base units,  r = 10 000 bps,  t = 300 s
 */

const SENIOR_TOTAL = 1_000_000_000n;
const JUNIOR_TOTAL = 1_000_000_000n;
const RATE_BPS = 10_000n;
const TERM_SECONDS = 300n;
const BPS_DENOMINATOR = 10_000n;
const SECONDS_PER_YEAR = 31_536_000n;

// Spec §4: senior_interest = floor(S * r * t / (10_000 * SECONDS_PER_YEAR)).
// = floor(1_000_000_000 * 10_000 * 300 / (10_000 * 31_536_000))
// = floor(3_000_000_000_000_000 / 315_360_000_000) = 9 512
const SENIOR_INTEREST =
  (SENIOR_TOTAL * RATE_BPS * TERM_SECONDS) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
const SENIOR_DUE = SENIOR_TOTAL + SENIOR_INTEREST;
// Spec §3: the cushion is J - I, not J.
const CUSHION = JUNIOR_TOTAL - SENIOR_INTEREST;

/** Expected senior/junior payouts, computed by hand from the spec. */
const VECTORS: ReadonlyArray<{ value: bigint; senior: bigint; junior: bigint; note: string }> = [
  {
    value: 2_000_204_528n,
    senior: 1_000_009_512n,
    junior: 1_000_195_016n,
    note: 'good: vault gained 204 528; senior capped at its target',
  },
  {
    value: 2_000_000_000n,
    senior: 1_000_009_512n,
    junior: 999_990_488n,
    note: 'break-even: junior gets J - I, the cushion, not J (see FINDING in the final report)',
  },
  {
    value: 1_999_836_692n,
    senior: 1_000_009_512n,
    junior: 999_827_180n,
    note: 'loss: junior absorbs the whole 172 820 loss',
  },
  {
    value: 1_000_009_512n,
    senior: 1_000_009_512n,
    junior: 0n,
    note: 'exactly at the cushion limit J - I',
  },
  {
    value: 1_000_009_511n,
    senior: 1_000_009_511n,
    junior: 0n,
    note: 'one unit past the cushion: the senior starts paying',
  },
  { value: 0n, senior: 0n, junior: 0n, note: 'total wipeout' },
];

function splitFor(value: bigint): FixtureProjectedSplit {
  const entry = fixture.data.projections.find((p) => BigInt(p.value) === value);
  if (entry === undefined) {
    throw new Error(`fixture is missing project(${value})`);
  }
  return expectOk(entry.result, `project(${value})`);
}

describe('senior due recomputed from the spec', () => {
  it('matches the documented interest term and cushion', () => {
    expect(SENIOR_INTEREST).toBe(9_512n);
    expect(SENIOR_DUE).toBe(1_000_009_512n);
    expect(CUSHION).toBe(999_990_488n);
  });

  it('agrees with the contract on every vector', () => {
    for (const { value } of VECTORS) {
      expect(BigInt(splitFor(value).senior_due), `senior_due at V=${value}`).toBe(SENIOR_DUE);
    }
  });
});

describe('project() against worked numbers', () => {
  for (const { value, senior, junior, note } of VECTORS) {
    it(`V = ${value} (${note})`, () => {
      const split = splitFor(value);
      expect(BigInt(split.senior_payout)).toBe(senior);
      expect(BigInt(split.junior_payout)).toBe(junior);
      // Invariant 1, checked at every point rather than trusted.
      expect(senior + junior).toBe(value);
    });
  }

  it('pays the cushion J - I at break-even, not J', () => {
    // At V = S + J the senior takes its full target and the junior receives
    // exactly the cushion J - I. The senior's own target interest comes out of
    // the junior buffer even at zero yield. Some prose in the contracts docs
    // (waterfall-spec §3, deployment.md) says the junior gets "exactly J" at
    // break-even; the contract and the doc's own table both say J - I. The
    // contract is what this asserts.
    const split = splitFor(2_000_000_000n);
    expect(BigInt(split.senior_payout)).toBe(SENIOR_DUE);
    expect(BigInt(split.junior_payout)).toBe(CUSHION);
    expect(CUSHION).not.toBe(JUNIOR_TOTAL);
  });

  it('caps the senior, so a very good epoch benefits the junior', () => {
    const good = splitFor(2_000_204_528n);
    const excess = 2_000_204_528n - 2_000_000_000n;
    expect(BigInt(good.senior_payout)).toBe(SENIOR_DUE);
    expect(BigInt(good.junior_payout)).toBe(JUNIOR_TOTAL + excess - SENIOR_INTEREST);
  });
});
