import { useMemo, useState } from 'react';

import { createStrataClient, type StrataNetworkConfig } from 'strata-sdk';

import { ConfigPanel } from './components/ConfigPanel';
import { EpochPanel } from './components/EpochPanel';
import { TestnetBanner } from './components/TestnetBanner';
import { pinnedDefaults } from './config';
import { useStrataRead } from './useStrataRead';

/**
 * Read-only dashboard for the pinned Strata testnet deployment.
 *
 * It never signs or submits anything, and it refuses to start against a
 * network that is not testnet.
 *
 * The reads the shell owns live here; the refresh counter is held here too,
 * so one click re-reads the epoch and the deployment rather than each panel
 * keeping its own button and its own idea of when it last read.
 */
export function App({ config }: { config: StrataNetworkConfig }) {
  const client = useMemo(() => createStrataClient(config), [config]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const bump = () => setRefreshVersion((current) => current + 1);

  const managerConfig = useStrataRead(() => client.managerConfig(), [client, refreshVersion]);
  const decimalsRead = useStrataRead(() => client.tokenDecimals(), [client, refreshVersion]);
  const epochRead = useStrataRead(() => client.currentEpoch(), [client, refreshVersion]);
  const secondsRead = useStrataRead(() => client.secondsToMaturity(), [client, refreshVersion]);

  // The token contract is the source of truth for decimals. The pinned
  // deployment's value is the fallback for the moment before that read lands,
  // so no panel has to render an amount at an unknown scale.
  const decimals =
    decimalsRead.result?.kind === 'ok' ? decimalsRead.result.value : config.tokenDecimals;

  return (
    <>
      <TestnetBanner />

      <header className="page-header">
        <h1>Strata read-only testnet dashboard</h1>
        <p>
          Epoch state, a depositor’s position, and projected payouts for the pinned Strata
          deployment on Stellar testnet. Amounts are the underlying token’s smallest unit,
          formatted without floating point.
        </p>
        <p>
          <button type="button" onClick={bump}>
            Refresh reads
          </button>
        </p>
      </header>

      <main>
        <EpochPanel epoch={epochRead} seconds={secondsRead} decimals={decimals} />

        <ConfigPanel read={managerConfig} config={config} decimals={decimals} />
      </main>

      <footer>
        <p>
          Unaudited testnet software. The pinned default manager is{' '}
          <code>{pinnedDefaults.managerId.slice(0, 8)}…</code>. Every figure here is read from a
          single RPC endpoint and is only as trustworthy as that endpoint.
        </p>
      </footer>
    </>
  );
}
