import { describe, expect, it } from 'vitest';

import { TESTNET_NETWORK_PASSPHRASE, pinnedDeployment } from '../src/deployment.js';
import { expectOk, fixture, type FixtureEpoch, type FixtureProjectedSplit } from './fixture.js';

/**
 * These tests run offline against real responses captured from the deployed
 * manager (see `test/fixtures/testnet-reads.json` and the provenance block in
 * it). They check the invariants the app relies on, not just that a value is
 * present. The live equivalent is in `client.integration.test.ts`.
 */

const epoch: FixtureEpoch = (() => {
  const value = expectOk(fixture.data.currentEpoch, 'currentEpoch');
  if (value === null) {
    throw new Error('fixture has no epoch');
  }
  return value;
})();

describe('fixture provenance', () => {
  it('was captured from the pinned testnet deployment', () => {
    expect(fixture.provenance.network).toBe(TESTNET_NETWORK_PASSPHRASE);
    expect(fixture.provenance.managerId).toBe(pinnedDeployment.contracts.epoch_manager.contract_id);
    expect(fixture.provenance.rpcUrl).toBe(pinnedDeployment.rpc_url);
    expect(fixture.provenance.capturedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('was captured with a ledger reported', () => {
    expect(fixture.provenance.latestLedger).toBeTypeOf('number');
  });
});

describe('captured epoch', () => {
  it('is the closed `loss` demo epoch, with the documented figures', () => {
    expect(epoch.status.tag).toBe('Closed');
    // deployment.md: the `loss` run redeemed 1 999 836 692 and paid the
    // senior 1 000 009 512 and the junior 999 827 180.
    expect(BigInt(epoch.value_redeemed)).toBe(1_999_836_692n);
    expect(BigInt(epoch.senior_payout)).toBe(1_000_009_512n);
    expect(BigInt(epoch.junior_payout)).toBe(999_827_180n);
  });

  it('satisfies conservation: the two payouts sum to the value redeemed', () => {
    const senior = BigInt(epoch.senior_payout);
    const junior = BigInt(epoch.junior_payout);
    expect(senior + junior).toBe(BigInt(epoch.value_redeemed));
  });

  it('is fully claimed, which is why it could be closed', () => {
    expect(BigInt(epoch.senior_unclaimed)).toBe(0n);
    expect(BigInt(epoch.junior_unclaimed)).toBe(0n);
    expect(BigInt(epoch.senior_paid)).toBe(BigInt(epoch.senior_payout));
    expect(BigInt(epoch.junior_paid)).toBe(BigInt(epoch.junior_payout));
  });

  it('records the same senior and junior principal', () => {
    expect(BigInt(epoch.senior_total)).toBe(1_000_000_000n);
    expect(BigInt(epoch.junior_total)).toBe(1_000_000_000n);
    expect(epoch.rate_bps).toBe(10_000);
    expect(BigInt(epoch.term_seconds)).toBe(300n);
  });
});

describe('captured projections', () => {
  const projections = fixture.data.projections;

  it('captured several points', () => {
    expect(projections.length).toBeGreaterThanOrEqual(5);
  });

  it('conserves value and honours the senior cap at every captured point', () => {
    for (const { value, result } of projections) {
      const split: FixtureProjectedSplit = expectOk(result, `project(${value})`);
      const v = BigInt(value);
      const senior = BigInt(split.senior_payout);
      const junior = BigInt(split.junior_payout);
      const due = BigInt(split.senior_due);

      expect(senior + junior, `project(${value}) conservation`).toBe(v);
      expect(senior <= due, `project(${value}) senior cap`).toBe(true);
      if (junior > 0n) {
        expect(senior, `project(${value}) senior paid first`).toBe(due);
      }
    }
  });

  it('is monotonic in the underlying value', () => {
    const ordered = [...projections].sort((a, b) => (BigInt(a.value) < BigInt(b.value) ? -1 : 1));
    let previousSenior = -1n;
    let previousJunior = -1n;
    for (const { value, result } of ordered) {
      const split = expectOk(result, `project(${value})`);
      const senior = BigInt(split.senior_payout);
      const junior = BigInt(split.junior_payout);
      expect(senior >= previousSenior, `senior not decreasing at ${value}`).toBe(true);
      expect(junior >= previousJunior, `junior not decreasing at ${value}`).toBe(true);
      previousSenior = senior;
      previousJunior = junior;
    }
  });

  it('pays the junior nothing when the senior is not made whole', () => {
    const pastCushion = projections.find((p) => p.value === '1000009511');
    if (pastCushion === undefined) {
      throw new Error('fixture is missing project(1000009511)');
    }
    const split = expectOk(pastCushion.result, 'project(1000009511)');
    expect(BigInt(split.junior_payout)).toBe(0n);
    expect(BigInt(split.senior_payout)).toBe(1_000_009_511n);
  });
});

describe('captured positions and config', () => {
  it('reports claimed positions as zero', () => {
    expect(fixture.data.positions.length).toBeGreaterThan(0);
    for (const position of fixture.data.positions) {
      const value = expectOk(position.result, `${position.who}/${position.tranche}`);
      expect(BigInt(value.principal)).toBe(0n);
      expect(BigInt(value.estimated_payout)).toBe(0n);
    }
  });

  it('reports the manager config that matches the pinned deployment', () => {
    const config = expectOk(fixture.data.managerConfig, 'managerConfig');
    expect(config.vault).toBe(pinnedDeployment.contracts.mock_vault.contract_id);
    expect(config.asset).toBe(pinnedDeployment.token.contract_id);
    expect(config.admin).toBe(pinnedDeployment.admin_public_address);
  });

  it('reads the token decimals the pinned deployment records', () => {
    expect(expectOk(fixture.data.tokenDecimals, 'tokenDecimals')).toBe(
      pinnedDeployment.token.decimals,
    );
  });
});
