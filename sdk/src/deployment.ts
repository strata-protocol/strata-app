/**
 * The pinned testnet deployment this app points at.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * Everything here comes from `deployments.testnet.json`, which is a verbatim
 * copy of `strata-contracts/deployments/testnet.json` plus a `pinned_from`
 * block recording where it was copied from. This is the only place a contract
 * ID is allowed to appear in this repository (the generated bindings header
 * repeats them for the reader). Do not add a contract ID anywhere else.
 */

import raw from './deployments.testnet.json' with { type: 'json' };

/** Which of the deployed contracts a recorded address belongs to. */
export interface PinnedContract {
  readonly contract_id: string;
  readonly wasm_sha256: string;
  readonly wasm_bytes: number;
}

/** Where the pinned copy came from. */
export interface DeploymentProvenance {
  readonly repo: string;
  readonly repo_url_source: string;
  readonly path: string;
  readonly commit: string;
  readonly copied_at_utc: string;
}

/** The shape of `deployments.testnet.json`. */
export interface PinnedDeployment {
  readonly network: string;
  readonly audited: boolean;
  readonly warning: string;
  readonly pinned_from: DeploymentProvenance;
  readonly network_passphrase: string;
  readonly rpc_url: string;
  readonly rpc_url_source: string;
  readonly deployed_at_utc: string;
  readonly stellar_cli_version: string;
  readonly soroban_sdk_version: string;
  readonly admin_public_address: string;
  readonly token: {
    readonly kind: string;
    readonly decimals: number;
    readonly contract_id: string;
    readonly note: string;
  };
  readonly contracts: {
    readonly mock_vault: PinnedContract;
    readonly epoch_manager: PinnedContract & { readonly vault: string };
  };
}

/** The pinned deployment, exactly as committed. */
export const pinnedDeployment: PinnedDeployment = raw;

/** The Stellar testnet passphrase, as recorded by the contracts repo. */
export const TESTNET_NETWORK_PASSPHRASE = pinnedDeployment.network_passphrase;

/**
 * Everything a client needs to talk to the pinned deployment. Env-var
 * overrides are applied by the caller (the dashboard), not here, so the SDK
 * stays free of `import.meta.env`.
 */
export interface StrataNetworkConfig {
  readonly rpcUrl: string;
  readonly networkPassphrase: string;
  readonly managerId: string;
  readonly vaultId: string;
  readonly tokenId: string;
  readonly tokenDecimals: number;
}

/** The config implied by the pinned deployment file. */
export function pinnedNetworkConfig(): StrataNetworkConfig {
  return {
    rpcUrl: pinnedDeployment.rpc_url,
    networkPassphrase: pinnedDeployment.network_passphrase,
    managerId: pinnedDeployment.contracts.epoch_manager.contract_id,
    vaultId: pinnedDeployment.contracts.mock_vault.contract_id,
    tokenId: pinnedDeployment.token.contract_id,
    tokenDecimals: pinnedDeployment.token.decimals,
  };
}

/**
 * Thrown when a caller asks to run against something other than testnet. This
 * app has no mainnet code path; refusing early is the guarantee, not a check
 * somewhere deeper that a different path could skip.
 */
export class NetworkGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkGuardError';
  }
}

/** Refuse anything that is not the pinned testnet passphrase. */
export function assertTestnetPassphrase(passphrase: string): void {
  if (passphrase !== TESTNET_NETWORK_PASSPHRASE) {
    throw new NetworkGuardError(
      `This app is testnet-only. Expected network passphrase ${JSON.stringify(
        TESTNET_NETWORK_PASSPHRASE,
      )}, received ${JSON.stringify(passphrase)}.`,
    );
  }
}

/**
 * Merge a pinned config with optional overrides, refusing any override that
 * moves the network off testnet. Overrides exist so a host can point at a
 * different RPC endpoint; they must not be able to change the network.
 */
export function resolveNetworkConfig(
  overrides: Partial<StrataNetworkConfig> = {},
): StrataNetworkConfig {
  const config: StrataNetworkConfig = { ...pinnedNetworkConfig(), ...overrides };
  assertTestnetPassphrase(config.networkPassphrase);
  if (config.tokenDecimals < 0 || !Number.isInteger(config.tokenDecimals)) {
    throw new NetworkGuardError(
      `tokenDecimals must be a non-negative integer, received ${String(config.tokenDecimals)}`,
    );
  }
  return config;
}
