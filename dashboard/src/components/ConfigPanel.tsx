import { pinnedDeployment, type StrataNetworkConfig } from 'strata-sdk';

import type { UseStrataReadResult } from '../useStrataRead';
import type { ManagerConfigView } from 'strata-sdk';
import { Freshness, ReadOutcome } from './states';

interface ConfigPanelProps {
  readonly read: UseStrataReadResult<ManagerConfigView>;
  readonly config: StrataNetworkConfig;
  readonly decimals: number;
}

/** Where the app is pointed, and where that pin came from. */
export function ConfigPanel({ read, config, decimals }: ConfigPanelProps) {
  return (
    <section aria-labelledby="config-heading">
      <h2 id="config-heading">Deployment</h2>
      <p className="muted">
        The app reads one pinned testnet deployment. Contract IDs appear in exactly one file (
        <code>sdk/src/deployments.testnet.json</code>); the values below are read from the contract
        and from that pin, not typed in.
      </p>

      <ReadOutcome
        read={read.result}
        loading={read.loading}
        error={read.error}
        label="manager config"
      >
        {(value) => (
          <dl className="kv">
            <dt>Network</dt>
            <dd>{pinnedDeployment.network}</dd>
            <dt>Network passphrase</dt>
            <dd>
              <code>{config.networkPassphrase}</code>
            </dd>
            <dt>RPC endpoint</dt>
            <dd>
              <code>{config.rpcUrl}</code>
            </dd>
            <dt>Epoch manager</dt>
            <dd>
              <code>{config.managerId}</code>
            </dd>
            <dt>Admin</dt>
            <dd>
              <code>{value.admin}</code>
            </dd>
            <dt>Vault (from contract)</dt>
            <dd>
              <code>{value.vault}</code>
            </dd>
            <dt>Underlying token (from contract)</dt>
            <dd>
              <code>{value.asset}</code>
            </dd>
            <dt>Token decimals</dt>
            <dd>{decimals}</dd>
            <dt>Pinned from</dt>
            <dd>
              <code>
                {pinnedDeployment.pinned_from.repo}@
                {pinnedDeployment.pinned_from.commit.slice(0, 12)}
              </code>{' '}
              (copied {pinnedDeployment.pinned_from.copied_at_utc})
            </dd>
            <dt>Deployed at</dt>
            <dd>{pinnedDeployment.deployed_at_utc}</dd>
            <dt>Contracts repo build</dt>
            <dd>
              Stellar CLI {pinnedDeployment.stellar_cli_version} · soroban-sdk{' '}
              {pinnedDeployment.soroban_sdk_version}
            </dd>
          </dl>
        )}
      </ReadOutcome>

      {read.result !== null ? <Freshness read={read.result} /> : null}
    </section>
  );
}
