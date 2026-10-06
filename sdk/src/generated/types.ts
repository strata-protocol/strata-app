/*
 * GENERATED FILE - DO NOT EDIT BY HAND.
 *
 * Regenerate with: npm run generate:sdk
 *
 * Source contract : epoch-manager (testnet)
 * Contract ID     : CB57H6NE7CIPHEDO2HJT7IX55NHP6RXI2EPSUIGK65NLG5CCXC4JB7QU
 * Wasm sha256     : b12c8af8403df7478ee67f4e6dd292230236f086a4908894ef80d19417828f7a
 * Network         : testnet - Test SDF Network ; September 2015
 * RPC endpoint    : https://soroban-testnet.stellar.org
 *
 * Source repo     : https://github.com/strata-protocol/strata-contracts
 * Source commit   : ecb5276be34561304264f7021a6916c0d2ff9646
 * Deployed at     : 2026-10-05T11:35:50Z
 * soroban-sdk     : 27.0.6
 * Generator       : @stellar/stellar-sdk@17.2.1 (stellar-js generate)
 *
 * Amounts in this file are i128 values in the token's smallest unit and are
 * typed bigint. Never convert one to a number.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 */
import {Address} from '@stellar/stellar-sdk';

    /**
 * Everything about the current epoch, in one entry.
 *
 * Kept as a single struct so one TTL bump covers the whole epoch.
 * Per-depositor positions are separate entries, bumped individually.
 */
export interface Epoch {
  /**
   * Junior already paid out.
   */
  junior_paid: bigint;
  /**
   * The junior's share of `V`, fixed at settlement.
   */
  junior_payout: bigint;
  /**
   * Total junior principal deposited.
   */
  junior_total: bigint;
  /**
   * Junior principal deposited but not yet claimed.
   */
  junior_unclaimed: bigint;
  /**
   * Ledger timestamp at which the epoch matures. Deposits close here.
   */
  maturity_ts: bigint;
  /**
   * Cap on senior principal as a fraction of junior principal, in bps.
   */
  max_senior_ratio_bps: number;
  /**
   * Senior target rate in basis points per year.
   */
  rate_bps: number;
  /**
   * Senior already paid out, for the last-claimer's remainder.
   */
  senior_paid: bigint;
  /**
   * The senior's share of `V`, fixed at settlement.
   */
  senior_payout: bigint;
  /**
   * Total senior principal deposited. Immutable once the epoch settles, and
   * the denominator of the pro-rata split.
   */
  senior_total: bigint;
  /**
   * Senior principal deposited but not yet claimed. Used **only** to detect
   * which claim is the last one in the tranche, so the final claimant can
   * absorb the rounding remainder.
   *
   * Deliberately *not* the denominator of the pro-rata split. The split is
   * defined against `senior_total`, which does not shrink as people claim;
   * dividing by a shrinking figure would hand later claimants a larger
   * slice than their share.
   */
  senior_unclaimed: bigint;
  /**
   * Ledger timestamp at which the epoch opened.
   */
  start_ts: bigint;
  /**
   * Lifecycle position.
   */
  status: Status;
  /**
   * `maturity_ts - start_ts`, the waterfall's `t`.
   */
  term_seconds: bigint;
  /**
   * Assets actually redeemed from the vault: the spec's `V`.
   */
  value_redeemed: bigint;
  /**
   * Vault shares held by the manager, redeemed at settlement.
   */
  vault_shares: bigint;
}

/**
 * Error Enum: Error
 */
export const Error = {
  /**
   * The contract is already initialised. A constructor cannot be re-run.
   */
  1 : { message: "AlreadyInitialized" },
  /**
   * An epoch is already open, or is settled and not yet fully claimed.
   */
  2 : { message: "EpochAlreadyActive" },
  /**
   * No epoch exists.
   */
  3 : { message: "NoActiveEpoch" },
  /**
   * The epoch has not reached maturity, so it cannot be settled yet.
   */
  4 : { message: "NotMature" },
  /**
   * The epoch is already settled.
   */
  5 : { message: "AlreadySettled" },
  /**
   * A deposit arrived at or after maturity.
   */
  6 : { message: "DepositsClosed" },
  /**
   * Only the admin may do this.
   */
  7 : { message: "Unauthorized" },
  /**
   * An amount was zero or negative.
   */
  8 : { message: "InvalidAmount" },
  /**
   * An input violated a documented limit in the waterfall spec.
   */
  9 : { message: "InvalidParameter" },
  /**
   * A senior deposit would breach the junior buffer gate. See spec
   * section 7.
   */
  10 : { message: "SeniorGateViolated" },
  /**
   * The caller holds no position in that tranche.
   */
  11 : { message: "NoPosition" },
  /**
   * Arithmetic exceeded the documented bounds.
   */
  12 : { message: "ArithmeticOverflow" },
  /**
   * The epoch still has unclaimed positions.
   */
  13 : { message: "ClaimsOutstanding" },
  /**
   * The manager held no vault shares at settlement.
   */
  14 : { message: "NoVaultShares" }
}

/**
 * Addresses the contract was built with. Immutable after construction.
 */
export interface Config {
  admin: string;
  /**
   * The underlying token, read from the vault once at construction and
   * pinned. Re-reading per call would let a vault swap the token out from
   * under a live epoch.
   */
  asset: string;
  /**
   * The underlying ERC-4626 vault.
   */
  vault: string;
}

/**
 * Where an epoch is in its lifecycle.
 */
 export type Status =
  /**
   * Accepting deposits, not yet at maturity.
   */
  { tag: "Open"; values: void } |
  /**
   * Past maturity and settled. Payouts are fixed; claims are open.
   */
  { tag: "Settled"; values: void } |
  /**
   * Every position has been claimed. A new epoch may be created.
   */
  { tag: "Closed"; values: void };

/**
 * Union: DataKey
 */
 export type DataKey =
  { tag: "Config"; values: void } |
  { tag: "Epoch"; values: void } |
  { tag: "Position"; values: readonly [string, Tranche] };

/**
 * Which tranche a position belongs to.
 */
 export type Tranche =
  /**
   * Capped at a fixed target rate, paid first, protected by the junior
   * buffer.
   */
  { tag: "Senior"; values: void } |
  /**
   * Receives everything above the senior target, absorbs losses first.
   */
  { tag: "Junior"; values: void };

/**
 * A depositor's position in one tranche.
 */
export interface Position {
  /**
   * What that principal is worth. Exact once the epoch settles; a projection
   * against the vault's live valuation before that.
   */
  estimated_payout: bigint;
  /**
   * The principal `who` deposited into this tranche.
   */
  principal: bigint;
}

/**
 * Event: ClaimEvent
 */
export interface ClaimEventEvent {
  name: "ClaimEvent";
  data: {
    claimant: string;
    tranche: Tranche;
    amount?: bigint;
  };
}

/**
 * Event: DepositEvent
 */
export interface DepositEventEvent {
  name: "DepositEvent";
  data: {
    depositor: string;
    tranche: Tranche;
    amount?: bigint;
    shares?: bigint;
  };
}

/**
 * Event: SettledEvent
 */
export interface SettledEventEvent {
  name: "SettledEvent";
  data: {
    epoch_start_ts: bigint;
    value_redeemed?: bigint;
    senior_due?: bigint;
    senior_payout?: bigint;
    junior_payout?: bigint;
  };
}

/**
 * The result of projecting an arbitrary `V` through the waterfall.
 */
export interface ProjectedSplit {
  /**
   * What the junior would receive.
   */
  junior_payout: bigint;
  /**
   * The senior's target for this epoch's terms and principal.
   */
  senior_due: bigint;
  /**
   * What the senior would receive.
   */
  senior_payout: bigint;
}

/**
 * Event: EpochClosedEvent
 */
export interface EpochClosedEventEvent {
  name: "EpochClosedEvent";
  data: {
    epoch_start_ts: bigint;
    value_redeemed?: bigint;
  };
}

/**
 * Event: EpochOpenedEvent
 */
export interface EpochOpenedEventEvent {
  name: "EpochOpenedEvent";
  data: {
    start_ts?: bigint;
    maturity_ts?: bigint;
    term_seconds?: bigint;
    rate_bps?: number;
    max_senior_ratio_bps?: number;
  };
}

/**
 * Event: InitializedEvent
 */
export interface InitializedEventEvent {
  name: "InitializedEvent";
  data: {
    admin: string;
    vault: string;
    asset?: string;
  };
}
    export type ContractEvent = ClaimEventEvent | DepositEventEvent | SettledEventEvent | EpochClosedEventEvent | EpochOpenedEventEvent | InitializedEventEvent;
    