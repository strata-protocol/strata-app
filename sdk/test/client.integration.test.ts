import { randomBytes } from 'node:crypto';

import { StrKey } from '@stellar/stellar-sdk';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  createStrataClient,
  TRANCHE_JUNIOR,
  TRANCHE_SENIOR,
  type StrataClient,
} from '../src/client.js';
import { pinnedDeployment } from '../src/deployment.js';

/**
 * Live testnet integration test. Excluded from the default `npm test` run;
 * run it with `npm run test:integration --workspace strata-sdk`.
 *
 * It reads the deployed manager only. Nothing here signs or submits. If the
 * testnet has been reset, the deployment is gone and these tests fail on
 * purpose — with a message saying so, rather than a confusing RPC error.
 */

const REQUIRED_VECTORS: ReadonlyArray<{ value: bigint; senior: bigint; junior: bigint }> = [
  { value: 2_000_204_528n, senior: 1_000_009_512n, junior: 1_000_195_016n },
  { value: 2_000_000_000n, senior: 1_000_009_512n, junior: 999_990_488n },
  { value: 1_999_836_692n, senior: 1_000_009_512n, junior: 999_827_180n },
  { value: 1_000_009_512n, senior: 1_000_009_512n, junior: 0n },
  { value: 1_000_009_511n, senior: 1_000_009_511n, junior: 0n },
  { value: 0n, senior: 0n, junior: 0n },
];

const SENIOR_DEPOSITOR = 'GA7YTWEK2EKB5KRRE4ZQMIQKIVZ4AGYU35IKT5XKOQPNXUWQWSMRHBB6';

function requireLive(kind: string, label: string): void {
  if (kind === 'not-found') {
    throw new Error(
      `${label} returned "not-found". The testnet deployment is gone, most likely because ` +
        `SDF reset testnet. Re-deploy strata-contracts and re-pin sdk/src/deployments.testnet.json.`,
    );
  }
  if (kind === 'archived') {
    throw new Error(
      `${label} returned "archived": a persistent entry this read needs has expired. ` +
        `Run strata-contracts/scripts/extend-ttl-testnet.sh.`,
    );
  }
}

let client: StrataClient;

beforeAll(() => {
  client = createStrataClient();
});

describe('manager config', () => {
  it('reads the pinned contract addresses', async () => {
    const read = await client.managerConfig();
    requireLive(read.kind, 'managerConfig');
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') return;
    expect(read.value.admin).toBe(pinnedDeployment.admin_public_address);
    expect(read.value.vault).toBe(pinnedDeployment.contracts.mock_vault.contract_id);
    expect(read.value.asset).toBe(pinnedDeployment.token.contract_id);
  });

  it('reads the underlying token decimals from the token contract', async () => {
    const read = await client.tokenDecimals();
    requireLive(read.kind, 'tokenDecimals');
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') return;
    expect(read.value).toBe(pinnedDeployment.token.decimals);
  });
});

describe('current epoch', () => {
  it('reads an epoch with a consistent, closed book of claims', async () => {
    const read = await client.currentEpoch();
    requireLive(read.kind, 'currentEpoch');
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') return;

    expect(read.value).not.toBeNull();
    const epoch = read.value;
    if (epoch === null) return;

    // Conservation holds whatever the epoch's state.
    expect(epoch.senior_payout + epoch.junior_payout).toBe(epoch.value_redeemed);

    // The demo epoch that is live now is the settled `loss` run.
    if (epoch.status.tag === 'Closed') {
      expect(epoch.senior_unclaimed).toBe(0n);
      expect(epoch.junior_unclaimed).toBe(0n);
    }
  });
});

describe('project() against worked numbers', () => {
  for (const { value, senior, junior } of REQUIRED_VECTORS) {
    it(`V = ${value}`, async () => {
      const read = await client.project(value);
      requireLive(read.kind, `project(${value})`);
      expect(read.kind).toBe('ok');
      if (read.kind !== 'ok') return;
      expect(read.value.senior_payout).toBe(senior);
      expect(read.value.junior_payout).toBe(junior);
      expect(read.value.senior_payout + read.value.junior_payout).toBe(value);
    });
  }
});

describe('positions', () => {
  it('reads a position for an account that deposited in the demo epoch', async () => {
    for (const tranche of [TRANCHE_SENIOR, TRANCHE_JUNIOR]) {
      const read = await client.position(SENIOR_DEPOSITOR, tranche);
      requireLive(read.kind, `position(${tranche.tag})`);
      expect(read.kind, `position(${tranche.tag})`).toBe('ok');
    }
  });
});

describe('failure classification', () => {
  it('reports a missing contract as not-found rather than throwing', async () => {
    const missing = StrKey.encodeContract(randomBytes(32));
    const missingClient = createStrataClient({ managerId: missing });
    const read = await missingClient.currentEpoch();
    expect(read.kind).toBe('not-found');
  });
});
