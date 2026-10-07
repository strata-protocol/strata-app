import { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import {
  decodeContractErrorCode,
  trancheLabel,
  TRANCHE_JUNIOR,
  TRANCHE_SENIOR,
} from '../src/client.js';
import {
  NetworkGuardError,
  TESTNET_NETWORK_PASSPHRASE,
  assertTestnetPassphrase,
  pinnedDeployment,
  pinnedNetworkConfig,
  resolveNetworkConfig,
} from '../src/deployment.js';

describe('decodeContractErrorCode', () => {
  it('decodes a contract error code from the SDK result payload', () => {
    for (let code = 1; code <= 14; code += 1) {
      const encoded = xdr.ScError.sceContract(code).toXdr('base64');
      expect(decodeContractErrorCode(encoded)).toBe(code);
    }
  });

  it('returns null for something that is not an ScError payload', () => {
    expect(decodeContractErrorCode('not-base64-xdr')).toBeNull();
    expect(decodeContractErrorCode('')).toBeNull();
  });

  it('returns null for a non-contract ScError', () => {
    // sceValue / sceBudget etc. carry no contract code.
    const encoded = xdr.ScError.sceValue(xdr.ScErrorCode.scecInvalidInput).toXdr('base64');
    expect(decodeContractErrorCode(encoded)).toBeNull();
  });
});

describe('trancheLabel', () => {
  it('labels both tranches', () => {
    expect(trancheLabel(TRANCHE_SENIOR)).toBe('Senior');
    expect(trancheLabel(TRANCHE_JUNIOR)).toBe('Junior');
  });
});

describe('pinned deployment', () => {
  it('is a testnet record', () => {
    expect(pinnedDeployment.network).toBe('testnet');
    expect(pinnedDeployment.audited).toBe(false);
    expect(pinnedDeployment.warning).toContain('UNAUDITED');
  });

  it('records where it was copied from', () => {
    expect(pinnedDeployment.pinned_from.repo).toContain('strata-contracts');
    expect(pinnedDeployment.pinned_from.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(pinnedDeployment.pinned_from.copied_at_utc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('resolves to the config the rest of the app uses', () => {
    const config = pinnedNetworkConfig();
    expect(config.managerId).toBe(pinnedDeployment.contracts.epoch_manager.contract_id);
    expect(config.vaultId).toBe(pinnedDeployment.contracts.mock_vault.contract_id);
    expect(config.tokenId).toBe(pinnedDeployment.token.contract_id);
    expect(config.tokenDecimals).toBe(pinnedDeployment.token.decimals);
    expect(config.networkPassphrase).toBe(TESTNET_NETWORK_PASSPHRASE);
  });
});

describe('network guard', () => {
  it('accepts the testnet passphrase', () => {
    expect(() => assertTestnetPassphrase(TESTNET_NETWORK_PASSPHRASE)).not.toThrow();
  });

  it('refuses the mainnet passphrase', () => {
    expect(() => assertTestnetPassphrase('Public Global Stellar Network ; September 2015')).toThrow(
      NetworkGuardError,
    );
  });

  it('refuses an override that moves the network off testnet', () => {
    expect(() =>
      resolveNetworkConfig({ networkPassphrase: 'Public Global Stellar Network ; September 2015' }),
    ).toThrow(NetworkGuardError);
  });

  it('allows an rpc endpoint override', () => {
    const config = resolveNetworkConfig({ rpcUrl: 'https://example.test' });
    expect(config.rpcUrl).toBe('https://example.test');
    expect(config.managerId).toBe(pinnedDeployment.contracts.epoch_manager.contract_id);
  });
});
