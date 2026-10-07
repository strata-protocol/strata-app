/**
 * RPC setup and typed read helpers for the Strata epoch manager.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * Every helper here is a *read*: it simulates a call and returns the result.
 * Nothing in this module signs, submits or moves funds. Each helper returns a
 * discriminated {@link StrataRead} instead of throwing, so a caller (the
 * dashboard) can distinguish "the contract is fine but there is no epoch"
 * from "the deployment is gone", "the entry is archived" and "the RPC is
 * down" without parsing error strings.
 */

import { xdr } from '@stellar/stellar-sdk';
import {
  Client as GenericContractClient,
  type AssembledTransaction,
  type Result as ContractResult,
} from '@stellar/stellar-sdk/contract';
import { Server } from '@stellar/stellar-sdk/rpc';

import {
  assertTestnetPassphrase,
  pinnedNetworkConfig,
  type StrataNetworkConfig,
} from './deployment.js';
import {
  contractErrorMessage,
  describeUnknownError,
  unknownContractErrorMessage,
} from './errors.js';
import { Client as ManagerClient } from './generated/client.js';
import type { Epoch, Position, ProjectedSplit, Tranche } from './generated/types.js';

export type { Epoch, Position, ProjectedSplit, Tranche } from './generated/types.js';

/** The two tranches, as the generated bindings model them. */
export const TRANCHE_SENIOR: Tranche = { tag: 'Senior', values: undefined };
export const TRANCHE_JUNIOR: Tranche = { tag: 'Junior', values: undefined };

/** `'Senior' | 'Junior'` for display. */
export function trancheLabel(tranche: Tranche): 'Senior' | 'Junior' {
  return tranche.tag;
}

/** Why a read did not return a value. */
export type ReadKind = 'ok' | 'archived' | 'not-found' | 'rpc-error' | 'contract-error';

/** Where a value came from, so a panel can show how fresh it is. */
export interface ReadMeta {
  readonly rpcUrl: string;
  readonly networkPassphrase: string;
  readonly managerId: string;
  /** Ledger sequence the read was simulated against, if the RPC reported one. */
  readonly ledger: number | null;
  /** ISO-8601 timestamp of when the read completed. */
  readonly fetchedAt: string;
}

/**
 * The result of a read. Never thrown:
 * - `ok` — the value, which may itself be `null` (e.g. no epoch).
 * - `archived` — a persistent entry this read needed has expired; a restore
 *   would be required.
 * - `not-found` — the contract (or an entry) does not exist on this network.
 * - `rpc-error` — the RPC call failed, or returned something unrecognised.
 * - `contract-error` — the contract ran and returned its own error enum.
 */
export type StrataRead<T> =
  | (ReadMeta & { readonly kind: 'ok'; readonly value: T })
  | (ReadMeta & { readonly kind: 'archived'; readonly message: string })
  | (ReadMeta & { readonly kind: 'not-found'; readonly message: string })
  | (ReadMeta & { readonly kind: 'rpc-error'; readonly message: string })
  | (ReadMeta & {
      readonly kind: 'contract-error';
      readonly code: number | null;
      readonly message: string;
    });

/** The generated manager's `Result<T, Error>` shape, with a readable fallback. */
type RawResult<T> = ContractResult<T, { message: string }>;

/** Internal signal used to turn a `Result::Err` into a `contract-error` read. */
class ContractCallError extends Error {
  constructor(
    readonly code: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'ContractCallError';
  }
}

/**
 * A `Result::Err` from the SDK carries the base64 XDR of the contract error,
 * not the numeric code. Decode it so the code can be mapped to a message.
 */
export function decodeContractErrorCode(base64Message: string): number | null {
  try {
    const error = xdr.ScError.fromXdr(base64Message, 'base64');
    const asContract = error as { type?: string; contractCode?: number };
    if (asContract.type === 'sceContract' && typeof asContract.contractCode === 'number') {
      return asContract.contractCode;
    }
  } catch {
    // Not an ScError payload; fall through to "unknown code".
  }
  return null;
}

function unwrapResult<T>(result: RawResult<T>): T {
  if (result.isOk()) {
    return result.unwrap();
  }
  const code = decodeContractErrorCode(result.unwrapErr().message);
  throw new ContractCallError(
    code,
    code === null ? unknownContractErrorMessage(-1) : contractErrorMessage(code),
  );
}

interface ClassifiedError {
  kind: 'archived' | 'not-found' | 'rpc-error';
  message: string;
}

/** The numeric `code` an RPC client error carries, if it carries one. */
function errorCodeOf(error: unknown): number | null {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'number') {
      return code;
    }
  }
  return null;
}

function classifyError(error: unknown): ClassifiedError {
  const message = describeUnknownError(error);
  const name = error instanceof Error ? error.name : '';
  const haystack = `${name} ${message}`;
  if (/expiredstate|expired|archiv/i.test(haystack)) {
    return { kind: 'archived', message };
  }
  // A contract that is not deployed shows up either as an RPC 404 or, on the
  // simulation path, as a `HostError: Error(Storage, MissingValue)` naming a
  // non-existing contract instance.
  if (
    errorCodeOf(error) === 404 ||
    /could not obtain contract|not found|does not exist|could not find|missingvalue|missing value|non-existing value|no such contract/i.test(
      haystack,
    )
  ) {
    return { kind: 'not-found', message };
  }
  return { kind: 'rpc-error', message };
}

function metaOf(config: StrataNetworkConfig, ledger: number | null, fetchedAt: string): ReadMeta {
  return {
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    managerId: config.managerId,
    ledger,
    fetchedAt,
  };
}

async function latestLedgerOrNull(server: Server): Promise<number | null> {
  try {
    const response = await server.getLatestLedger();
    return response.sequence;
  } catch {
    return null;
  }
}

/**
 * Testnet RPC connections drop intermittently (`fetch failed`, TLS resets).
 * That is the network, not the contract, so retry a couple of times before
 * reporting it. A contract error or an archived entry is never retried.
 */
const TRANSIENT_ERROR =
  /fetch failed|econnreset|etimedout|socket hang up|sendrequest|network error|timeout/i;

async function withRetry<TValue>(operation: () => Promise<TValue>, attempts = 3): Promise<TValue> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof ContractCallError ||
        !TRANSIENT_ERROR.test(describeUnknownError(error))
      ) {
        throw error;
      }
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw last;
}

/** Run a caller-supplied read and classify anything it throws. */
async function runRead<TValue>(
  config: StrataNetworkConfig,
  server: Server,
  produce: () => Promise<{ value: TValue; ledger: number | null }>,
): Promise<StrataRead<TValue>> {
  const fetchedAt = new Date().toISOString();

  try {
    const { value, ledger } = await withRetry(produce);
    return { kind: 'ok', value, ...metaOf(config, ledger, fetchedAt) };
  } catch (error) {
    const ledger = await latestLedgerOrNull(server);
    if (error instanceof ContractCallError) {
      return {
        kind: 'contract-error',
        code: error.code,
        message: error.message,
        ...metaOf(config, ledger, fetchedAt),
      };
    }
    const classified = classifyError(error);
    return { ...classified, ...metaOf(config, ledger, fetchedAt) };
  }
}

async function attempt<TRaw, TValue>(
  config: StrataNetworkConfig,
  server: Server,
  produce: () => Promise<AssembledTransaction<TRaw>>,
  extract: (raw: TRaw) => TValue,
): Promise<StrataRead<TValue>> {
  return runRead(config, server, async () => {
    const transaction = await produce();
    return {
      value: extract(transaction.result),
      ledger: transaction.simulation?.latestLedger ?? null,
    };
  });
}

/** Contract config that a read can return: admin, vault and underlying token. */
export interface ManagerConfigView {
  readonly admin: string;
  readonly vault: string;
  readonly asset: string;
}

/** The read surface the dashboard and scripts use. */
export interface StrataClient {
  readonly config: StrataNetworkConfig;
  /** The generated, pinned manager client. Reads only; never submit through it here. */
  readonly manager: ManagerClient;
  readonly server: Server;
  currentEpoch(): Promise<StrataRead<Epoch | null>>;
  position(who: string, tranche: Tranche): Promise<StrataRead<Position>>;
  project(value: bigint): Promise<StrataRead<ProjectedSplit>>;
  seniorRoom(): Promise<StrataRead<bigint>>;
  secondsToMaturity(): Promise<StrataRead<bigint>>;
  managerConfig(): Promise<StrataRead<ManagerConfigView>>;
  vaultShares(): Promise<StrataRead<bigint>>;
  tokenDecimals(): Promise<StrataRead<number>>;
  latestLedger(): Promise<number | null>;
}

/**
 * Build a read-only client for the pinned testnet deployment. Refuses a
 * non-testnet passphrase before any network call is made.
 */
export function createStrataClient(overrides: Partial<StrataNetworkConfig> = {}): StrataClient {
  const config: StrataNetworkConfig = { ...pinnedNetworkConfig(), ...overrides };
  assertTestnetPassphrase(config.networkPassphrase);

  const server = new Server(config.rpcUrl);
  const manager = new ManagerClient({
    contractId: config.managerId,
    networkPassphrase: config.networkPassphrase,
    rpcUrl: config.rpcUrl,
  });

  return {
    config,
    manager,
    server,

    currentEpoch: () =>
      attempt(
        config,
        server,
        () => manager.current_epoch(),
        (raw) => raw as Epoch | null,
      ),

    position: (who, tranche) =>
      attempt(
        config,
        server,
        () => manager.position_of({ who, tranche }),
        (raw) => unwrapResult(raw as RawResult<Position>),
      ),

    project: (value) =>
      attempt(
        config,
        server,
        () => manager.project({ value }),
        (raw) => unwrapResult(raw as RawResult<ProjectedSplit>),
      ),

    seniorRoom: () =>
      attempt(
        config,
        server,
        () => manager.senior_room(),
        (raw) => unwrapResult(raw as RawResult<bigint>),
      ),

    secondsToMaturity: () =>
      attempt(
        config,
        server,
        () => manager.seconds_to_maturity(),
        (raw) => unwrapResult(raw as RawResult<bigint>),
      ),

    vaultShares: () =>
      attempt(
        config,
        server,
        () => manager.vault_shares(),
        (raw) => raw as bigint,
      ),

    managerConfig: () =>
      runRead(config, server, async () => {
        // The generated client gives one method per view; assemble them into
        // the single config snapshot a panel wants.
        const [adminTx, vaultTx, assetTx] = await Promise.all([
          manager.admin(),
          manager.vault(),
          manager.asset(),
        ]);
        return {
          value: { admin: adminTx.result, vault: vaultTx.result, asset: assetTx.result },
          ledger: adminTx.simulation?.latestLedger ?? null,
        };
      }),

    tokenDecimals: () =>
      attempt(
        config,
        server,
        async () => {
          const token = await GenericContractClient.from<{
            decimals: () => Promise<AssembledTransaction<number>>;
          }>({
            contractId: config.tokenId,
            networkPassphrase: config.networkPassphrase,
            rpcUrl: config.rpcUrl,
          });
          return token.decimals();
        },
        (raw) => raw,
      ),

    latestLedger: () => latestLedgerOrNull(server),
  };
}
