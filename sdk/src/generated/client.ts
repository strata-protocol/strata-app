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
import {Tranche, ProjectedSplit, Position, Epoch, ContractEvent} from './types.js';
import {Result, Spec, AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, ExternalExecutableRef} from '@stellar/stellar-sdk/contract';
import {Address, xdr} from '@stellar/stellar-sdk';

export interface Client {
  /**
   * The administrator.
   */
  admin(options?: MethodOptions): Promise<AssembledTransaction<string>>;
  /**
   * The underlying token, pinned at construction.
   */
  asset(options?: MethodOptions): Promise<AssembledTransaction<string>>;
  /**
   * Pays `claimant` their settled payout in `tranche`.
   *
   * Payouts are pro-rata by principal, with the ordinary floor division
   * that leaves dust behind. The **last** claim in a tranche is paid the
   * remainder instead, so the tranche pays out exactly its
   * `senior_payout` or `junior_payout` in total and invariant 1 holds at
   * the depositor level too. See spec section 8.
   *
   * Permissionless to call, but always for the named `claimant`, who must
   * authorise it. A position is not transferable, so there is no allowance
   * surface and nobody can claim on someone else's behalf.
   */
  claim(args: { claimant: string | Address; tranche: Tranche }, options?: MethodOptions): Promise<AssembledTransaction<Result<bigint, Error>>>;
  /**
   * The underlying ERC-4626 vault.
   */
  vault(options?: MethodOptions): Promise<AssembledTransaction<string>>;
  /**
   * Settles the epoch: redeems the manager's entire vault position and
   * splits the result through the waterfall.
   *
   * Permissionless once mature. That is deliberate — settlement only ever
   * moves the epoch forward, and it is fully determined by the vault's
   * redemption plus the pure settlement math, so there is nothing for an
   * admin to do and nobody to trust with the timing.
   *
   * Claims open immediately afterwards.
   */
  settle(options?: MethodOptions): Promise<AssembledTransaction<Result<ProjectedSplit, Error>>>;
  /**
   * Deposits `amount` into `tranche` on behalf of `from`.
   *
   * `from` is explicit rather than taken from `env.invoker()` so that the
   * authorisation scope is exactly what the caller sees in the transaction.
   * `from` must authorise the call.
   *
   * The tokens are pulled from `from` and locked into the underlying vault
   * immediately, so a position earns yield from the moment it is made
   * rather than from maturity. That is also why the manager tracks vault
   * shares: redemption is shares-proportional, and the share price moves.
   *
   * Senior deposits pass the junior buffer gate from spec section 7. Junior
   * deposits are never gated — junior capital is what makes the structure
   * safe, so it is always welcome.
   *
   * Refuses at or after maturity, which is how deposits close: there is no
   * admin override and no separate close step.
   */
  deposit(args: { from: string | Address; tranche: Tranche; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<bigint, Error>>>;
  /**
   * What the two tranches would receive if the vault were worth `value`
   * right now.
   *
   * The dashboard's projection hook: the waterfall applied to an arbitrary
   * `V`, so a depositor can see their outcome across a range of underlying
   * returns without waiting for maturity.
   */
  project(args: { value: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<ProjectedSplit, Error>>>;
  /**
   * Closes a fully-claimed settled epoch, freeing the manager to open
   * another.
   *
   * Permissionless on purpose: it can only move the state machine forward,
   * and only once nothing is owed to anyone.
   */
  close_epoch(options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * A depositor's position in one tranche, and what it is currently worth.
   */
  position_of(args: { who: string | Address; tranche: Tranche }, options?: MethodOptions): Promise<AssembledTransaction<Result<Position, Error>>>;
  /**
   * How much *more* senior principal the gate would still admit, given the
   * junior principal deposited so far and what senior principal is already
   * in. Zero once deposits have closed.
   */
  senior_room(options?: MethodOptions): Promise<AssembledTransaction<Result<bigint, Error>>>;
  /**
   * Opens a new epoch. Admin only.
   *
   * Refuses while an epoch is open, or while a settled epoch still has
   * unclaimed positions. That is what "one active epoch at a time" means in
   * code: there is no path to a second epoch while funds from the first are
   * still outstanding.
   *
   * Every parameter is validated against the documented limits in the
   * waterfall spec *before* anything is written, so a rejected epoch leaves
   * no state behind.
   */
  create_epoch(args: { term_seconds: bigint; rate_bps: number; max_senior_ratio_bps: number }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * The manager's vault shares, for accounting and for tests.
   */
  vault_shares(options?: MethodOptions): Promise<AssembledTransaction<bigint>>;
  /**
   * The current epoch, or nothing if none is open.
   */
  current_epoch(options?: MethodOptions): Promise<AssembledTransaction<Epoch | null>>;
  /**
   * Seconds until maturity, or zero once it has passed.
   */
  seconds_to_maturity(options?: MethodOptions): Promise<AssembledTransaction<Result<bigint, Error>>>;
}

export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new Spec(["AAAAAQAAALVFdmVyeXRoaW5nIGFib3V0IHRoZSBjdXJyZW50IGVwb2NoLCBpbiBvbmUgZW50cnkuCgpLZXB0IGFzIGEgc2luZ2xlIHN0cnVjdCBzbyBvbmUgVFRMIGJ1bXAgY292ZXJzIHRoZSB3aG9sZSBlcG9jaC4KUGVyLWRlcG9zaXRvciBwb3NpdGlvbnMgYXJlIHNlcGFyYXRlIGVudHJpZXMsIGJ1bXBlZCBpbmRpdmlkdWFsbHkuAAAAAAAAAAAAAAVFcG9jaAAAAAAAABAAAAAYSnVuaW9yIGFscmVhZHkgcGFpZCBvdXQuAAAAC2p1bmlvcl9wYWlkAAAAAAsAAAAvVGhlIGp1bmlvcidzIHNoYXJlIG9mIGBWYCwgZml4ZWQgYXQgc2V0dGxlbWVudC4AAAAADWp1bmlvcl9wYXlvdXQAAAAAAAALAAAAIVRvdGFsIGp1bmlvciBwcmluY2lwYWwgZGVwb3NpdGVkLgAAAAAAAAxqdW5pb3JfdG90YWwAAAALAAAAL0p1bmlvciBwcmluY2lwYWwgZGVwb3NpdGVkIGJ1dCBub3QgeWV0IGNsYWltZWQuAAAAABBqdW5pb3JfdW5jbGFpbWVkAAAACwAAAEFMZWRnZXIgdGltZXN0YW1wIGF0IHdoaWNoIHRoZSBlcG9jaCBtYXR1cmVzLiBEZXBvc2l0cyBjbG9zZSBoZXJlLgAAAAAAAAttYXR1cml0eV90cwAAAAAGAAAAQkNhcCBvbiBzZW5pb3IgcHJpbmNpcGFsIGFzIGEgZnJhY3Rpb24gb2YganVuaW9yIHByaW5jaXBhbCwgaW4gYnBzLgAAAAAAFG1heF9zZW5pb3JfcmF0aW9fYnBzAAAABAAAACxTZW5pb3IgdGFyZ2V0IHJhdGUgaW4gYmFzaXMgcG9pbnRzIHBlciB5ZWFyLgAAAAhyYXRlX2JwcwAAAAQAAAA6U2VuaW9yIGFscmVhZHkgcGFpZCBvdXQsIGZvciB0aGUgbGFzdC1jbGFpbWVyJ3MgcmVtYWluZGVyLgAAAAAAC3Nlbmlvcl9wYWlkAAAAAAsAAAAvVGhlIHNlbmlvcidzIHNoYXJlIG9mIGBWYCwgZml4ZWQgYXQgc2V0dGxlbWVudC4AAAAADXNlbmlvcl9wYXlvdXQAAAAAAAALAAAAblRvdGFsIHNlbmlvciBwcmluY2lwYWwgZGVwb3NpdGVkLiBJbW11dGFibGUgb25jZSB0aGUgZXBvY2ggc2V0dGxlcywgYW5kCnRoZSBkZW5vbWluYXRvciBvZiB0aGUgcHJvLXJhdGEgc3BsaXQuAAAAAAAMc2VuaW9yX3RvdGFsAAAACwAAAZZTZW5pb3IgcHJpbmNpcGFsIGRlcG9zaXRlZCBidXQgbm90IHlldCBjbGFpbWVkLiBVc2VkICoqb25seSoqIHRvIGRldGVjdAp3aGljaCBjbGFpbSBpcyB0aGUgbGFzdCBvbmUgaW4gdGhlIHRyYW5jaGUsIHNvIHRoZSBmaW5hbCBjbGFpbWFudCBjYW4KYWJzb3JiIHRoZSByb3VuZGluZyByZW1haW5kZXIuCgpEZWxpYmVyYXRlbHkgKm5vdCogdGhlIGRlbm9taW5hdG9yIG9mIHRoZSBwcm8tcmF0YSBzcGxpdC4gVGhlIHNwbGl0IGlzCmRlZmluZWQgYWdhaW5zdCBgc2VuaW9yX3RvdGFsYCwgd2hpY2ggZG9lcyBub3Qgc2hyaW5rIGFzIHBlb3BsZSBjbGFpbTsKZGl2aWRpbmcgYnkgYSBzaHJpbmtpbmcgZmlndXJlIHdvdWxkIGhhbmQgbGF0ZXIgY2xhaW1hbnRzIGEgbGFyZ2VyCnNsaWNlIHRoYW4gdGhlaXIgc2hhcmUuAAAAAAAQc2VuaW9yX3VuY2xhaW1lZAAAAAsAAAArTGVkZ2VyIHRpbWVzdGFtcCBhdCB3aGljaCB0aGUgZXBvY2ggb3BlbmVkLgAAAAAIc3RhcnRfdHMAAAAGAAAAE0xpZmVjeWNsZSBwb3NpdGlvbi4AAAAABnN0YXR1cwAAAAAH0AAAAAZTdGF0dXMAAAAAAC5gbWF0dXJpdHlfdHMgLSBzdGFydF90c2AsIHRoZSB3YXRlcmZhbGwncyBgdGAuAAAAAAAMdGVybV9zZWNvbmRzAAAABgAAADhBc3NldHMgYWN0dWFsbHkgcmVkZWVtZWQgZnJvbSB0aGUgdmF1bHQ6IHRoZSBzcGVjJ3MgYFZgLgAAAA52YWx1ZV9yZWRlZW1lZAAAAAAACwAAADlWYXVsdCBzaGFyZXMgaGVsZCBieSB0aGUgbWFuYWdlciwgcmVkZWVtZWQgYXQgc2V0dGxlbWVudC4AAAAAAAAMdmF1bHRfc2hhcmVzAAAACw==", "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADgAAAERUaGUgY29udHJhY3QgaXMgYWxyZWFkeSBpbml0aWFsaXNlZC4gQSBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgcmUtcnVuLgAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAABCQW4gZXBvY2ggaXMgYWxyZWFkeSBvcGVuLCBvciBpcyBzZXR0bGVkIGFuZCBub3QgeWV0IGZ1bGx5IGNsYWltZWQuAAAAAAASRXBvY2hBbHJlYWR5QWN0aXZlAAAAAAACAAAAEE5vIGVwb2NoIGV4aXN0cy4AAAANTm9BY3RpdmVFcG9jaAAAAAAAAAMAAABAVGhlIGVwb2NoIGhhcyBub3QgcmVhY2hlZCBtYXR1cml0eSwgc28gaXQgY2Fubm90IGJlIHNldHRsZWQgeWV0LgAAAAlOb3RNYXR1cmUAAAAAAAAEAAAAHVRoZSBlcG9jaCBpcyBhbHJlYWR5IHNldHRsZWQuAAAAAAAADkFscmVhZHlTZXR0bGVkAAAAAAAFAAAAJ0EgZGVwb3NpdCBhcnJpdmVkIGF0IG9yIGFmdGVyIG1hdHVyaXR5LgAAAAAORGVwb3NpdHNDbG9zZWQAAAAAAAYAAAAbT25seSB0aGUgYWRtaW4gbWF5IGRvIHRoaXMuAAAAAAxVbmF1dGhvcml6ZWQAAAAHAAAAH0FuIGFtb3VudCB3YXMgemVybyBvciBuZWdhdGl2ZS4AAAAADUludmFsaWRBbW91bnQAAAAAAAAIAAAAO0FuIGlucHV0IHZpb2xhdGVkIGEgZG9jdW1lbnRlZCBsaW1pdCBpbiB0aGUgd2F0ZXJmYWxsIHNwZWMuAAAAABBJbnZhbGlkUGFyYW1ldGVyAAAACQAAAElBIHNlbmlvciBkZXBvc2l0IHdvdWxkIGJyZWFjaCB0aGUganVuaW9yIGJ1ZmZlciBnYXRlLiBTZWUgc3BlYwpzZWN0aW9uIDcuAAAAAAAAElNlbmlvckdhdGVWaW9sYXRlZAAAAAAACgAAAC1UaGUgY2FsbGVyIGhvbGRzIG5vIHBvc2l0aW9uIGluIHRoYXQgdHJhbmNoZS4AAAAAAAAKTm9Qb3NpdGlvbgAAAAAACwAAACpBcml0aG1ldGljIGV4Y2VlZGVkIHRoZSBkb2N1bWVudGVkIGJvdW5kcy4AAAAAABJBcml0aG1ldGljT3ZlcmZsb3cAAAAAAAwAAAAoVGhlIGVwb2NoIHN0aWxsIGhhcyB1bmNsYWltZWQgcG9zaXRpb25zLgAAABFDbGFpbXNPdXRzdGFuZGluZwAAAAAAAA0AAAAvVGhlIG1hbmFnZXIgaGVsZCBubyB2YXVsdCBzaGFyZXMgYXQgc2V0dGxlbWVudC4AAAAADU5vVmF1bHRTaGFyZXMAAAAAAAAO", "AAAAAQAAAERBZGRyZXNzZXMgdGhlIGNvbnRyYWN0IHdhcyBidWlsdCB3aXRoLiBJbW11dGFibGUgYWZ0ZXIgY29uc3RydWN0aW9uLgAAAAAAAAAGQ29uZmlnAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAACcVGhlIHVuZGVybHlpbmcgdG9rZW4sIHJlYWQgZnJvbSB0aGUgdmF1bHQgb25jZSBhdCBjb25zdHJ1Y3Rpb24gYW5kCnBpbm5lZC4gUmUtcmVhZGluZyBwZXIgY2FsbCB3b3VsZCBsZXQgYSB2YXVsdCBzd2FwIHRoZSB0b2tlbiBvdXQgZnJvbQp1bmRlciBhIGxpdmUgZXBvY2guAAAABWFzc2V0AAAAAAAAEwAAAB5UaGUgdW5kZXJseWluZyBFUkMtNDYyNiB2YXVsdC4AAAAAAAV2YXVsdAAAAAAAABM=", "AAAAAgAAACNXaGVyZSBhbiBlcG9jaCBpcyBpbiBpdHMgbGlmZWN5Y2xlLgAAAAAAAAAABlN0YXR1cwAAAAAAAwAAAAAAAAAoQWNjZXB0aW5nIGRlcG9zaXRzLCBub3QgeWV0IGF0IG1hdHVyaXR5LgAAAARPcGVuAAAAAAAAAD5QYXN0IG1hdHVyaXR5IGFuZCBzZXR0bGVkLiBQYXlvdXRzIGFyZSBmaXhlZDsgY2xhaW1zIGFyZSBvcGVuLgAAAAAAB1NldHRsZWQAAAAAAAAAADxFdmVyeSBwb3NpdGlvbiBoYXMgYmVlbiBjbGFpbWVkLiBBIG5ldyBlcG9jaCBtYXkgYmUgY3JlYXRlZC4AAAAGQ2xvc2VkAAA=", "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAAFRXBvY2gAAAAAAAABAAAAAAAAAAhQb3NpdGlvbgAAAAIAAAATAAAH0AAAAAdUcmFuY2hlAA==", "AAAAAgAAACRXaGljaCB0cmFuY2hlIGEgcG9zaXRpb24gYmVsb25ncyB0by4AAAAAAAAAB1RyYW5jaGUAAAAAAgAAAAAAAABKQ2FwcGVkIGF0IGEgZml4ZWQgdGFyZ2V0IHJhdGUsIHBhaWQgZmlyc3QsIHByb3RlY3RlZCBieSB0aGUganVuaW9yCmJ1ZmZlci4AAAAAAAZTZW5pb3IAAAAAAAAAAABCUmVjZWl2ZXMgZXZlcnl0aGluZyBhYm92ZSB0aGUgc2VuaW9yIHRhcmdldCwgYWJzb3JicyBsb3NzZXMgZmlyc3QuAAAAAAAGSnVuaW9yAAA=", "AAAAAQAAACZBIGRlcG9zaXRvcidzIHBvc2l0aW9uIGluIG9uZSB0cmFuY2hlLgAAAAAAAAAAAAhQb3NpdGlvbgAAAAIAAAB4V2hhdCB0aGF0IHByaW5jaXBhbCBpcyB3b3J0aC4gRXhhY3Qgb25jZSB0aGUgZXBvY2ggc2V0dGxlczsgYSBwcm9qZWN0aW9uCmFnYWluc3QgdGhlIHZhdWx0J3MgbGl2ZSB2YWx1YXRpb24gYmVmb3JlIHRoYXQuAAAAEGVzdGltYXRlZF9wYXlvdXQAAAALAAAAMFRoZSBwcmluY2lwYWwgYHdob2AgZGVwb3NpdGVkIGludG8gdGhpcyB0cmFuY2hlLgAAAAlwcmluY2lwYWwAAAAAAAAL", "AAAABQAAAAAAAAAAAAAACkNsYWltRXZlbnQAAAAAAAEAAAALY2xhaW1fZXZlbnQAAAAAAwAAAAAAAAAIY2xhaW1hbnQAAAATAAAAAQAAAAAAAAAHdHJhbmNoZQAAAAfQAAAAB1RyYW5jaGUAAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=", "AAAABQAAAAAAAAAAAAAADERlcG9zaXRFdmVudAAAAAEAAAANZGVwb3NpdF9ldmVudAAAAAAAAAQAAAAAAAAACWRlcG9zaXRvcgAAAAAAABMAAAABAAAAAAAAAAd0cmFuY2hlAAAAB9AAAAAHVHJhbmNoZQAAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAADFNldHRsZWRFdmVudAAAAAEAAAANc2V0dGxlZF9ldmVudAAAAAAAAAUAAAAAAAAADmVwb2NoX3N0YXJ0X3RzAAAAAAAGAAAAAQAAAAAAAAAOdmFsdWVfcmVkZWVtZWQAAAAAAAsAAAAAAAAAAAAAAApzZW5pb3JfZHVlAAAAAAALAAAAAAAAAAAAAAANc2VuaW9yX3BheW91dAAAAAAAAAsAAAAAAAAAAAAAAA1qdW5pb3JfcGF5b3V0AAAAAAAACwAAAAAAAAAC", "AAAAAQAAAEBUaGUgcmVzdWx0IG9mIHByb2plY3RpbmcgYW4gYXJiaXRyYXJ5IGBWYCB0aHJvdWdoIHRoZSB3YXRlcmZhbGwuAAAAAAAAAA5Qcm9qZWN0ZWRTcGxpdAAAAAAAAwAAAB5XaGF0IHRoZSBqdW5pb3Igd291bGQgcmVjZWl2ZS4AAAAAAA1qdW5pb3JfcGF5b3V0AAAAAAAACwAAADlUaGUgc2VuaW9yJ3MgdGFyZ2V0IGZvciB0aGlzIGVwb2NoJ3MgdGVybXMgYW5kIHByaW5jaXBhbC4AAAAAAAAKc2VuaW9yX2R1ZQAAAAAACwAAAB5XaGF0IHRoZSBzZW5pb3Igd291bGQgcmVjZWl2ZS4AAAAAAA1zZW5pb3JfcGF5b3V0AAAAAAAACw==", "AAAABQAAAAAAAAAAAAAAEEVwb2NoQ2xvc2VkRXZlbnQAAAABAAAAEmVwb2NoX2Nsb3NlZF9ldmVudAAAAAAAAgAAAAAAAAAOZXBvY2hfc3RhcnRfdHMAAAAAAAYAAAABAAAAAAAAAA52YWx1ZV9yZWRlZW1lZAAAAAAACwAAAAAAAAAC", "AAAABQAAAAAAAAAAAAAAEEVwb2NoT3BlbmVkRXZlbnQAAAABAAAAEmVwb2NoX29wZW5lZF9ldmVudAAAAAAABQAAAAAAAAAIc3RhcnRfdHMAAAAGAAAAAAAAAAAAAAALbWF0dXJpdHlfdHMAAAAABgAAAAAAAAAAAAAADHRlcm1fc2Vjb25kcwAAAAYAAAAAAAAAAAAAAAhyYXRlX2JwcwAAAAQAAAAAAAAAAAAAABRtYXhfc2VuaW9yX3JhdGlvX2JwcwAAAAQAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAAEEluaXRpYWxpemVkRXZlbnQAAAABAAAAEWluaXRpYWxpemVkX2V2ZW50AAAAAAAAAwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAAAAAAAAFdmF1bHQAAAAAAAATAAAAAQAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAI=", "AAAAAAAAABJUaGUgYWRtaW5pc3RyYXRvci4AAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAAEw==", "AAAAAAAAAC1UaGUgdW5kZXJseWluZyB0b2tlbiwgcGlubmVkIGF0IGNvbnN0cnVjdGlvbi4AAAAAAAAFYXNzZXQAAAAAAAAAAAAAAQAAABM=", "AAAAAAAAAipQYXlzIGBjbGFpbWFudGAgdGhlaXIgc2V0dGxlZCBwYXlvdXQgaW4gYHRyYW5jaGVgLgoKUGF5b3V0cyBhcmUgcHJvLXJhdGEgYnkgcHJpbmNpcGFsLCB3aXRoIHRoZSBvcmRpbmFyeSBmbG9vciBkaXZpc2lvbgp0aGF0IGxlYXZlcyBkdXN0IGJlaGluZC4gVGhlICoqbGFzdCoqIGNsYWltIGluIGEgdHJhbmNoZSBpcyBwYWlkIHRoZQpyZW1haW5kZXIgaW5zdGVhZCwgc28gdGhlIHRyYW5jaGUgcGF5cyBvdXQgZXhhY3RseSBpdHMKYHNlbmlvcl9wYXlvdXRgIG9yIGBqdW5pb3JfcGF5b3V0YCBpbiB0b3RhbCBhbmQgaW52YXJpYW50IDEgaG9sZHMgYXQKdGhlIGRlcG9zaXRvciBsZXZlbCB0b28uIFNlZSBzcGVjIHNlY3Rpb24gOC4KClBlcm1pc3Npb25sZXNzIHRvIGNhbGwsIGJ1dCBhbHdheXMgZm9yIHRoZSBuYW1lZCBgY2xhaW1hbnRgLCB3aG8gbXVzdAphdXRob3Jpc2UgaXQuIEEgcG9zaXRpb24gaXMgbm90IHRyYW5zZmVyYWJsZSwgc28gdGhlcmUgaXMgbm8gYWxsb3dhbmNlCnN1cmZhY2UgYW5kIG5vYm9keSBjYW4gY2xhaW0gb24gc29tZW9uZSBlbHNlJ3MgYmVoYWxmLgAAAAAABWNsYWltAAAAAAAAAgAAAAAAAAAIY2xhaW1hbnQAAAATAAAAAAAAAAd0cmFuY2hlAAAAB9AAAAAHVHJhbmNoZQAAAAABAAAD6QAAAAsAAAAD", "AAAAAAAAAB5UaGUgdW5kZXJseWluZyBFUkMtNDYyNiB2YXVsdC4AAAAAAAV2YXVsdAAAAAAAAAAAAAABAAAAEw==", "AAAAAAAAAZJTZXR0bGVzIHRoZSBlcG9jaDogcmVkZWVtcyB0aGUgbWFuYWdlcidzIGVudGlyZSB2YXVsdCBwb3NpdGlvbiBhbmQKc3BsaXRzIHRoZSByZXN1bHQgdGhyb3VnaCB0aGUgd2F0ZXJmYWxsLgoKUGVybWlzc2lvbmxlc3Mgb25jZSBtYXR1cmUuIFRoYXQgaXMgZGVsaWJlcmF0ZSDigJQgc2V0dGxlbWVudCBvbmx5IGV2ZXIKbW92ZXMgdGhlIGVwb2NoIGZvcndhcmQsIGFuZCBpdCBpcyBmdWxseSBkZXRlcm1pbmVkIGJ5IHRoZSB2YXVsdCdzCnJlZGVtcHRpb24gcGx1cyB0aGUgcHVyZSBzZXR0bGVtZW50IG1hdGgsIHNvIHRoZXJlIGlzIG5vdGhpbmcgZm9yIGFuCmFkbWluIHRvIGRvIGFuZCBub2JvZHkgdG8gdHJ1c3Qgd2l0aCB0aGUgdGltaW5nLgoKQ2xhaW1zIG9wZW4gaW1tZWRpYXRlbHkgYWZ0ZXJ3YXJkcy4AAAAAAAZzZXR0bGUAAAAAAAAAAAABAAAD6QAAB9AAAAAOUHJvamVjdGVkU3BsaXQAAAAAAAM=", "AAAAAAAAAxxEZXBvc2l0cyBgYW1vdW50YCBpbnRvIGB0cmFuY2hlYCBvbiBiZWhhbGYgb2YgYGZyb21gLgoKYGZyb21gIGlzIGV4cGxpY2l0IHJhdGhlciB0aGFuIHRha2VuIGZyb20gYGVudi5pbnZva2VyKClgIHNvIHRoYXQgdGhlCmF1dGhvcmlzYXRpb24gc2NvcGUgaXMgZXhhY3RseSB3aGF0IHRoZSBjYWxsZXIgc2VlcyBpbiB0aGUgdHJhbnNhY3Rpb24uCmBmcm9tYCBtdXN0IGF1dGhvcmlzZSB0aGUgY2FsbC4KClRoZSB0b2tlbnMgYXJlIHB1bGxlZCBmcm9tIGBmcm9tYCBhbmQgbG9ja2VkIGludG8gdGhlIHVuZGVybHlpbmcgdmF1bHQKaW1tZWRpYXRlbHksIHNvIGEgcG9zaXRpb24gZWFybnMgeWllbGQgZnJvbSB0aGUgbW9tZW50IGl0IGlzIG1hZGUKcmF0aGVyIHRoYW4gZnJvbSBtYXR1cml0eS4gVGhhdCBpcyBhbHNvIHdoeSB0aGUgbWFuYWdlciB0cmFja3MgdmF1bHQKc2hhcmVzOiByZWRlbXB0aW9uIGlzIHNoYXJlcy1wcm9wb3J0aW9uYWwsIGFuZCB0aGUgc2hhcmUgcHJpY2UgbW92ZXMuCgpTZW5pb3IgZGVwb3NpdHMgcGFzcyB0aGUganVuaW9yIGJ1ZmZlciBnYXRlIGZyb20gc3BlYyBzZWN0aW9uIDcuIEp1bmlvcgpkZXBvc2l0cyBhcmUgbmV2ZXIgZ2F0ZWQg4oCUIGp1bmlvciBjYXBpdGFsIGlzIHdoYXQgbWFrZXMgdGhlIHN0cnVjdHVyZQpzYWZlLCBzbyBpdCBpcyBhbHdheXMgd2VsY29tZS4KClJlZnVzZXMgYXQgb3IgYWZ0ZXIgbWF0dXJpdHksIHdoaWNoIGlzIGhvdyBkZXBvc2l0cyBjbG9zZTogdGhlcmUgaXMgbm8KYWRtaW4gb3ZlcnJpZGUgYW5kIG5vIHNlcGFyYXRlIGNsb3NlIHN0ZXAuAAAAB2RlcG9zaXQAAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAB3RyYW5jaGUAAAAH0AAAAAdUcmFuY2hlAAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAALAAAAAw==", "AAAAAAAAAQNXaGF0IHRoZSB0d28gdHJhbmNoZXMgd291bGQgcmVjZWl2ZSBpZiB0aGUgdmF1bHQgd2VyZSB3b3J0aCBgdmFsdWVgCnJpZ2h0IG5vdy4KClRoZSBkYXNoYm9hcmQncyBwcm9qZWN0aW9uIGhvb2s6IHRoZSB3YXRlcmZhbGwgYXBwbGllZCB0byBhbiBhcmJpdHJhcnkKYFZgLCBzbyBhIGRlcG9zaXRvciBjYW4gc2VlIHRoZWlyIG91dGNvbWUgYWNyb3NzIGEgcmFuZ2Ugb2YgdW5kZXJseWluZwpyZXR1cm5zIHdpdGhvdXQgd2FpdGluZyBmb3IgbWF0dXJpdHkuAAAAAAdwcm9qZWN0AAAAAAEAAAAAAAAABXZhbHVlAAAAAAAACwAAAAEAAAPpAAAH0AAAAA5Qcm9qZWN0ZWRTcGxpdAAAAAAAAw==", "AAAAAAAAALtDbG9zZXMgYSBmdWxseS1jbGFpbWVkIHNldHRsZWQgZXBvY2gsIGZyZWVpbmcgdGhlIG1hbmFnZXIgdG8gb3Blbgphbm90aGVyLgoKUGVybWlzc2lvbmxlc3Mgb24gcHVycG9zZTogaXQgY2FuIG9ubHkgbW92ZSB0aGUgc3RhdGUgbWFjaGluZSBmb3J3YXJkLAphbmQgb25seSBvbmNlIG5vdGhpbmcgaXMgb3dlZCB0byBhbnlvbmUuAAAAAAtjbG9zZV9lcG9jaAAAAAAAAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAEZBIGRlcG9zaXRvcidzIHBvc2l0aW9uIGluIG9uZSB0cmFuY2hlLCBhbmQgd2hhdCBpdCBpcyBjdXJyZW50bHkgd29ydGguAAAAAAALcG9zaXRpb25fb2YAAAAAAgAAAAAAAAADd2hvAAAAABMAAAAAAAAAB3RyYW5jaGUAAAAH0AAAAAdUcmFuY2hlAAAAAAEAAAPpAAAH0AAAAAhQb3NpdGlvbgAAAAM=", "AAAAAAAAALFIb3cgbXVjaCAqbW9yZSogc2VuaW9yIHByaW5jaXBhbCB0aGUgZ2F0ZSB3b3VsZCBzdGlsbCBhZG1pdCwgZ2l2ZW4gdGhlCmp1bmlvciBwcmluY2lwYWwgZGVwb3NpdGVkIHNvIGZhciBhbmQgd2hhdCBzZW5pb3IgcHJpbmNpcGFsIGlzIGFscmVhZHkKaW4uIFplcm8gb25jZSBkZXBvc2l0cyBoYXZlIGNsb3NlZC4AAAAAAAALc2VuaW9yX3Jvb20AAAAAAAAAAAEAAAPpAAAACwAAAAM=", "AAAAAAAAAaFPcGVucyBhIG5ldyBlcG9jaC4gQWRtaW4gb25seS4KClJlZnVzZXMgd2hpbGUgYW4gZXBvY2ggaXMgb3Blbiwgb3Igd2hpbGUgYSBzZXR0bGVkIGVwb2NoIHN0aWxsIGhhcwp1bmNsYWltZWQgcG9zaXRpb25zLiBUaGF0IGlzIHdoYXQgIm9uZSBhY3RpdmUgZXBvY2ggYXQgYSB0aW1lIiBtZWFucyBpbgpjb2RlOiB0aGVyZSBpcyBubyBwYXRoIHRvIGEgc2Vjb25kIGVwb2NoIHdoaWxlIGZ1bmRzIGZyb20gdGhlIGZpcnN0IGFyZQpzdGlsbCBvdXRzdGFuZGluZy4KCkV2ZXJ5IHBhcmFtZXRlciBpcyB2YWxpZGF0ZWQgYWdhaW5zdCB0aGUgZG9jdW1lbnRlZCBsaW1pdHMgaW4gdGhlCndhdGVyZmFsbCBzcGVjICpiZWZvcmUqIGFueXRoaW5nIGlzIHdyaXR0ZW4sIHNvIGEgcmVqZWN0ZWQgZXBvY2ggbGVhdmVzCm5vIHN0YXRlIGJlaGluZC4AAAAAAAAMY3JlYXRlX2Vwb2NoAAAAAwAAAAAAAAAMdGVybV9zZWNvbmRzAAAABgAAAAAAAAAIcmF0ZV9icHMAAAAEAAAAAAAAABRtYXhfc2VuaW9yX3JhdGlvX2JwcwAAAAQAAAABAAAD6QAAAAIAAAAD", "AAAAAAAAADlUaGUgbWFuYWdlcidzIHZhdWx0IHNoYXJlcywgZm9yIGFjY291bnRpbmcgYW5kIGZvciB0ZXN0cy4AAAAAAAAMdmF1bHRfc2hhcmVzAAAAAAAAAAEAAAAL", "AAAAAAAAAPlCdWlsZHMgYSBtYW5hZ2VyIG92ZXIgYHZhdWx0YCwgYWRtaW5pc3RlcmVkIGJ5IGBhZG1pbmAuCgpUaGUgdW5kZXJseWluZyB0b2tlbiBpcyByZWFkIGZyb20gdGhlIHZhdWx0IGhlcmUgYW5kIHBpbm5lZCwgc28gaXQKY2Fubm90IGNoYW5nZSB1bmRlcm5lYXRoIGEgbGl2ZSBlcG9jaC4gQSB2YXVsdCB3aG9zZSBgYXNzZXQoKWAgY2FsbApmYWlscyBjYW5ub3QgYmUgd3JhcHBlZCwgd2hpY2ggaXMgdGhlIGludGVuZGVkIGJlaGF2aW91ci4AAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFdmF1bHQAAAAAAAATAAAAAA==", "AAAAAAAAAC5UaGUgY3VycmVudCBlcG9jaCwgb3Igbm90aGluZyBpZiBub25lIGlzIG9wZW4uAAAAAAANY3VycmVudF9lcG9jaAAAAAAAAAAAAAABAAAD6AAAB9AAAAAFRXBvY2gAAAA=", "AAAAAAAAADNTZWNvbmRzIHVudGlsIG1hdHVyaXR5LCBvciB6ZXJvIG9uY2UgaXQgaGFzIHBhc3NlZC4AAAAAE3NlY29uZHNfdG9fbWF0dXJpdHkAAAAAAAAAAAEAAAPpAAAABgAAAAM="]),
      options
    );
  }

   static deploy<T = Client>(args: { admin: string | Address; vault: string | Address }, options: MethodOptions & Omit<ContractClientOptions, 'contractId'> & { salt?: Uint8Array; address?: string; } & ({ wasmHash: Uint8Array | string; format?: "hex" | "base64"; externalRef?: never; } | { externalRef: ExternalExecutableRef; wasmHash?: never; format?: never; })): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(args, options);
  }
  public readonly fromJson = {
    admin : this.txFromJson<string>,  asset : this.txFromJson<string>,  claim : this.txFromJson<Result<bigint, Error>>,  vault : this.txFromJson<string>,  settle : this.txFromJson<Result<ProjectedSplit, Error>>,  deposit : this.txFromJson<Result<bigint, Error>>,  project : this.txFromJson<Result<ProjectedSplit, Error>>,  close_epoch : this.txFromJson<Result<null, Error>>,  position_of : this.txFromJson<Result<Position, Error>>,  senior_room : this.txFromJson<Result<bigint, Error>>,  create_epoch : this.txFromJson<Result<null, Error>>,  vault_shares : this.txFromJson<bigint>,  current_epoch : this.txFromJson<Epoch | null>,  seconds_to_maturity : this.txFromJson<Result<bigint, Error>>
  };

  /** @deprecated Use fromJson instead. */
  public readonly fromJSON = this.fromJson;

  /**
   * Parse a raw contract event (topics + data) into a typed {@link ContractEvent}.
   */
  parseEvent(topics: xdr.ScVal[] | string[], data: xdr.ScVal | string): ContractEvent | undefined {
    return this.spec.parseEvent(topics, data) as ContractEvent | undefined;
  }
  /**
   * Build a topics filter row for the "ClaimEvent" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  claimEventEventFilter(topicValues?: { claimant?: string | Address; tranche?: Tranche }): string[] {
    return this.spec.eventTopicFilter("ClaimEvent", topicValues);
  }
  /**
   * Build a topics filter row for the "DepositEvent" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  depositEventEventFilter(topicValues?: { depositor?: string | Address; tranche?: Tranche }): string[] {
    return this.spec.eventTopicFilter("DepositEvent", topicValues);
  }
  /**
   * Build a topics filter row for the "SettledEvent" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  settledEventEventFilter(topicValues?: { epoch_start_ts?: bigint }): string[] {
    return this.spec.eventTopicFilter("SettledEvent", topicValues);
  }
  /**
   * Build a topics filter row for the "EpochClosedEvent" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  epochClosedEventEventFilter(topicValues?: { epoch_start_ts?: bigint }): string[] {
    return this.spec.eventTopicFilter("EpochClosedEvent", topicValues);
  }
  /**
   * Build a topics filter row for the "EpochOpenedEvent" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  epochOpenedEventEventFilter(): string[] {
    return this.spec.eventTopicFilter("EpochOpenedEvent");
  }
  /**
   * Build a topics filter row for the "InitializedEvent" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  initializedEventEventFilter(topicValues?: { admin?: string | Address; vault?: string | Address }): string[] {
    return this.spec.eventTopicFilter("InitializedEvent", topicValues);
  }
}