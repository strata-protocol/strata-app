/**
 * Dashboard configuration.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * Defaults come from the pinned deployment file, so the app runs with no
 * `.env` at all. The `VITE_*` variables only *override*. The network
 * passphrase is guarded: if it is anything other than the testnet passphrase,
 * `resolveDashboardConfig` throws before any network call, and the app refuses
 * to start. There is no mainnet code path.
 */

import {
  NetworkGuardError,
  pinnedNetworkConfig,
  resolveNetworkConfig,
  type StrataNetworkConfig,
} from 'strata-sdk';

/** The environment variables the dashboard reads, in the order the docs list them. */
export const ENV_VARS = [
  'VITE_RPC_URL',
  'VITE_NETWORK_PASSPHRASE',
  'VITE_MANAGER_ID',
  'VITE_VAULT_ID',
  'VITE_TOKEN_ID',
] as const;

export type EnvVar = (typeof ENV_VARS)[number];

function envValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Resolve the config from the pinned deployment, applying `VITE_*` overrides.
 *
 * @throws {NetworkGuardError} if the resulting passphrase is not testnet.
 */
export function resolveDashboardConfig(): StrataNetworkConfig {
  // A mutable shape; `StrataNetworkConfig`'s fields are readonly.
  const overrides: {
    rpcUrl?: string;
    networkPassphrase?: string;
    managerId?: string;
    vaultId?: string;
    tokenId?: string;
  } = {};

  const rpcUrl = envValue(import.meta.env.VITE_RPC_URL);
  if (rpcUrl !== undefined) {
    overrides.rpcUrl = rpcUrl;
  }
  const passphrase = envValue(import.meta.env.VITE_NETWORK_PASSPHRASE);
  if (passphrase !== undefined) {
    overrides.networkPassphrase = passphrase;
  }
  const managerId = envValue(import.meta.env.VITE_MANAGER_ID);
  if (managerId !== undefined) {
    overrides.managerId = managerId;
  }
  const vaultId = envValue(import.meta.env.VITE_VAULT_ID);
  if (vaultId !== undefined) {
    overrides.vaultId = vaultId;
  }
  const tokenId = envValue(import.meta.env.VITE_TOKEN_ID);
  if (tokenId !== undefined) {
    overrides.tokenId = tokenId;
  }

  return resolveNetworkConfig(overrides);
}

/** The pinned defaults, shown in the UI so the source of a value is never a mystery. */
export const pinnedDefaults = pinnedNetworkConfig();

export { NetworkGuardError };
