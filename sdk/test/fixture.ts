/**
 * Typed access to the recorded testnet fixtures.
 *
 * The fixture file holds real responses captured from the deployed manager.
 * Amounts are stored as decimal strings so the JSON stays portable; the SDK
 * returns `bigint`. This module adds the types and the string -> bigint
 * conversion, so the tests never invent a value.
 */

import raw from './fixtures/testnet-reads.json' with { type: 'json' };

export interface FixtureProvenance {
  readonly capturedAtUtc: string;
  readonly network: string;
  readonly rpcUrl: string;
  readonly managerId: string;
  readonly latestLedger: number | null;
}

export interface FixtureMeta {
  readonly rpcUrl: string;
  readonly networkPassphrase: string;
  readonly managerId: string;
  readonly ledger: number | null;
  readonly fetchedAt: string;
}

export interface FixtureEpoch {
  readonly junior_paid: string;
  readonly junior_payout: string;
  readonly junior_total: string;
  readonly junior_unclaimed: string;
  readonly maturity_ts: string;
  readonly max_senior_ratio_bps: number;
  readonly rate_bps: number;
  readonly senior_paid: string;
  readonly senior_payout: string;
  readonly senior_total: string;
  readonly senior_unclaimed: string;
  readonly start_ts: string;
  readonly status: { readonly tag: string };
  readonly term_seconds: string;
  readonly value_redeemed: string;
  readonly vault_shares: string;
}

export interface FixtureProjectedSplit {
  readonly senior_due: string;
  readonly senior_payout: string;
  readonly junior_payout: string;
}

export interface FixturePosition {
  readonly estimated_payout: string;
  readonly principal: string;
}

export type FixtureRead<T> =
  | (FixtureMeta & { readonly kind: 'ok'; readonly value: T })
  | (FixtureMeta & { readonly kind: 'archived'; readonly message: string })
  | (FixtureMeta & { readonly kind: 'not-found'; readonly message: string })
  | (FixtureMeta & { readonly kind: 'rpc-error'; readonly message: string })
  | (FixtureMeta & {
      readonly kind: 'contract-error';
      readonly code: number | null;
      readonly message: string;
    });

export interface FixtureFile {
  readonly provenance: FixtureProvenance;
  readonly data: {
    readonly currentEpoch: FixtureRead<FixtureEpoch | null>;
    readonly managerConfig: FixtureRead<{
      readonly admin: string;
      readonly vault: string;
      readonly asset: string;
    }>;
    readonly tokenDecimals: FixtureRead<number>;
    readonly seniorRoom: FixtureRead<string>;
    readonly secondsToMaturity: FixtureRead<string>;
    readonly projections: ReadonlyArray<{
      readonly value: string;
      readonly result: FixtureRead<FixtureProjectedSplit>;
    }>;
    readonly positions: ReadonlyArray<{
      readonly who: string;
      readonly tranche: string;
      readonly result: FixtureRead<FixturePosition>;
    }>;
  };
}

export const fixture = raw as unknown as FixtureFile;

/** Narrow a fixture read to its ok value, failing the test with a clear message otherwise. */
export function expectOk<T>(read: FixtureRead<T>, label: string): T {
  if (read.kind !== 'ok') {
    throw new Error(`fixture read ${label} was ${read.kind}, expected ok`);
  }
  return read.value;
}
