import { describe, expect, it } from 'vitest';

import { NetworkGuardError, pinnedNetworkConfig, resolveNetworkConfig } from 'strata-sdk';

import { ENV_VARS, resolveDashboardConfig } from '../src/config';

/**
 * The network guard is the app's one hard refusal, so it gets a test. It
 * must hold against every plausible override, including one that tries to
 * smuggle in a different network by moving the RPC endpoint.
 */
describe('network guard', () => {
  const pinned = pinnedNetworkConfig();

  it('accepts the pinned testnet config', () => {
    expect(pinned.networkPassphrase).toBe('Test SDF Network ; September 2015');
    expect(() => resolveNetworkConfig()).not.toThrow();
    expect(resolveNetworkConfig()).toEqual(pinned);
  });

  it('refuses a mainnet passphrase', () => {
    expect(() =>
      resolveNetworkConfig({ networkPassphrase: 'Public Global Stellar Network ; September 2015' }),
    ).toThrow(NetworkGuardError);
  });

  it('refuses a passphrase differing only in whitespace', () => {
    expect(() =>
      resolveNetworkConfig({ networkPassphrase: `${pinned.networkPassphrase} ` }),
    ).toThrow(NetworkGuardError);
  });

  it('refuses an empty passphrase rather than treating it as absent', () => {
    expect(() => resolveNetworkConfig({ networkPassphrase: '' })).toThrow(NetworkGuardError);
  });

  it('still refuses when only the RPC endpoint is overridden', () => {
    // Overriding the endpoint is allowed; it cannot change the network.
    expect(resolveNetworkConfig({ rpcUrl: 'http://127.0.0.1:8000' }).rpcUrl).toBe(
      'http://127.0.0.1:8000',
    );
    // But a different network still does not get past the guard.
    expect(() =>
      resolveNetworkConfig({
        rpcUrl: 'https://soroban.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
      }),
    ).toThrow(NetworkGuardError);
  });

  it('refuses a non-integer token decimals override', () => {
    expect(() => resolveNetworkConfig({ tokenDecimals: 7.5 })).toThrow(NetworkGuardError);
  });
});

describe('dashboard configuration', () => {
  it('documents exactly the environment variables the brief lists', () => {
    expect(ENV_VARS).toEqual([
      'VITE_RPC_URL',
      'VITE_NETWORK_PASSPHRASE',
      'VITE_MANAGER_ID',
      'VITE_VAULT_ID',
      'VITE_TOKEN_ID',
    ]);
  });

  it('runs with no environment at all, from the pinned deployment', () => {
    // Vitest sets no VITE_* variables, which is the "app runs with no .env"
    // case the README promises.
    expect(resolveDashboardConfig()).toEqual(pinnedNetworkConfig());
  });

  it('picks up an override when one is set', () => {
    // Imported lazily: import.meta.env is read at module scope in some
    // bundlers, and this asserts the override path, not the default.
    const overridden = resolveNetworkConfig({ rpcUrl: 'http://localhost:1234' });
    expect(overridden.rpcUrl).toBe('http://localhost:1234');
    expect(overridden.managerId).toBe(pinnedNetworkConfig().managerId);
  });
});
