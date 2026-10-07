import type { Epoch } from 'strata-sdk';

import { formatBaseUnits, formatDuration, formatLedgerTime } from '../format';
import type { UseStrataReadResult } from '../useStrataRead';
import { Freshness, ReadOutcome } from './states';

interface EpochPanelProps {
  readonly epoch: UseStrataReadResult<Epoch | null>;
  readonly seconds: UseStrataReadResult<bigint>;
  readonly decimals: number;
}

function StatusBadge({ status }: { status: Epoch['status'] }) {
  return <span className={`badge badge-${status.tag.toLowerCase()}`}>{status.tag}</span>;
}

/** The current epoch. The manager holds one at a time. */
export function EpochPanel({ epoch, seconds, decimals }: EpochPanelProps) {
  return (
    <section aria-labelledby="epoch-heading">
      <h2 id="epoch-heading">Epoch</h2>
      <p className="muted">
        Strata runs one epoch at a time. The manager exposes only the current one; a list of past
        epochs would need an indexer, which this read-only app deliberately does not have.
      </p>

      <ReadOutcome
        read={epoch.result}
        loading={epoch.loading}
        error={epoch.error}
        label="current epoch"
      >
        {(value) =>
          value === null ? (
            <p className="muted">No epoch is open.</p>
          ) : (
            <>
              <table>
                <caption>Current epoch</caption>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Starts (UTC)</th>
                    <th scope="col">Matures (UTC)</th>
                    <th scope="col">Term</th>
                    <th scope="col">Senior rate</th>
                    <th scope="col">Max senior ratio</th>
                    <th scope="col">Senior total</th>
                    <th scope="col">Junior total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <StatusBadge status={value.status} />
                    </td>
                    <td>{formatLedgerTime(value.start_ts)}</td>
                    <td>{formatLedgerTime(value.maturity_ts)}</td>
                    <td>{formatDuration(value.term_seconds)}</td>
                    <td>{(value.rate_bps / 100).toFixed(2)}%/yr</td>
                    <td>{(value.max_senior_ratio_bps / 10_000).toFixed(2)}×</td>
                    <td>{formatBaseUnits(value.senior_total, decimals)}</td>
                    <td>{formatBaseUnits(value.junior_total, decimals)}</td>
                  </tr>
                </tbody>
              </table>

              <table>
                <caption>Epoch figures</caption>
                <thead>
                  <tr>
                    <th scope="col">Figure</th>
                    <th scope="col">Senior</th>
                    <th scope="col">Junior</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Payout fixed at settlement</th>
                    <td>{formatBaseUnits(value.senior_payout, decimals)}</td>
                    <td>{formatBaseUnits(value.junior_payout, decimals)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Already paid out</th>
                    <td>{formatBaseUnits(value.senior_paid, decimals)}</td>
                    <td>{formatBaseUnits(value.junior_paid, decimals)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Unclaimed principal</th>
                    <td>{formatBaseUnits(value.senior_unclaimed, decimals)}</td>
                    <td>{formatBaseUnits(value.junior_unclaimed, decimals)}</td>
                  </tr>
                </tbody>
              </table>

              <dl className="kv">
                <dt>Value redeemed from the vault (V)</dt>
                <dd>{formatBaseUnits(value.value_redeemed, decimals)}</dd>
                <dt>Manager vault shares</dt>
                <dd>{value.vault_shares.toString()}</dd>
                <dt>Time to maturity</dt>
                <dd>
                  {seconds.loading
                    ? '…'
                    : seconds.result?.kind === 'ok'
                      ? `${
                          value.status.tag === 'Open'
                            ? formatDuration(seconds.result.value)
                            : 'matured'
                        } (contract clock)`
                      : 'unavailable'}
                </dd>
              </dl>

              {value.status.tag !== 'Open' ? (
                <p className="muted">
                  This epoch is settled; payouts above are final and claims are open. Deposits are
                  closed.
                </p>
              ) : null}
            </>
          )
        }
      </ReadOutcome>

      {epoch.result !== null ? <Freshness read={epoch.result} /> : null}
    </section>
  );
}
