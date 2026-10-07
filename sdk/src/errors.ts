/**
 * Contract error codes and SDK read failures, turned into readable text.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * The numeric codes are the manager's `#[contracterror] enum Error`, published
 * in the contract spec and therefore present in the generated bindings
 * (`sdk/src/generated/types.ts`). The readable messages are derived from that
 * enum's own doc comments in
 * `strata-contracts/contracts/epoch-manager/src/lib.rs`; a test asserts that
 * every variant the spec publishes has a message here, so a new error code
 * cannot be added on-chain without this file being updated.
 */

import { Error as GeneratedError } from './generated/types.js';

/** Readable text for each published contract error code. */
export const CONTRACT_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  1: 'The contract is already initialised; a constructor cannot run twice.',
  2: 'An epoch is already open, or a settled epoch still has unclaimed positions. Strata runs one epoch at a time.',
  3: 'No epoch exists yet.',
  4: 'The epoch has not reached maturity, so it cannot be settled.',
  5: 'The epoch is already settled; deposits are closed.',
  6: 'Deposits are closed: the epoch is at or past maturity.',
  7: 'This call requires admin authorisation.',
  8: 'The amount was zero or negative.',
  9: 'A parameter is outside the limits documented in the waterfall spec.',
  10: 'A senior deposit would breach the junior buffer gate (waterfall spec section 7).',
  11: 'This address holds no position in that tranche.',
  12: 'The arithmetic exceeded the documented bounds.',
  13: 'The epoch still has unclaimed positions; it cannot close yet.',
  14: 'The manager held no vault shares at settlement.',
};

/** Fallback for a code the deployed contract does not publish. */
export function unknownContractErrorMessage(code: number): string {
  return `The contract returned an unknown error code (${String(code)}). It may be a contract version this client was not generated against.`;
}

/** The published enum name for a code, e.g. `SeniorGateViolated`, if known. */
export function contractErrorName(code: number): string | undefined {
  const entry = (GeneratedError as Record<number, { message: string } | undefined>)[code];
  return entry?.message;
}

/** A readable message for a contract error code, never empty. */
export function contractErrorMessage(code: number): string {
  return CONTRACT_ERROR_MESSAGES[code] ?? unknownContractErrorMessage(code);
}

/** A short label combining the code, the enum name and the readable message. */
export function describeContractErrorCode(code: number): string {
  const name = contractErrorName(code);
  const label = name === undefined ? `code ${String(code)}` : `${name} (code ${String(code)})`;
  return `${label}: ${contractErrorMessage(code)}`;
}

/**
 * Best-effort readable text for anything thrown by the SDK, RPC or fetch
 * layer. Network and XDR errors arrive as plain `Error`s with useful
 * `message`s; this never assumes a shape it has not checked.
 */
export function describeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    // `JSON.stringify` returns `undefined` (not a string) for `undefined`,
    // functions and symbols, and throws on a cyclic object.
    const json: string | undefined = JSON.stringify(error);
    return json ?? String(error);
  } catch {
    return String(error);
  }
}
