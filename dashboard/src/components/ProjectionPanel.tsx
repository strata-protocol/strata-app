import { useMemo, useState } from 'react';

import { formatAmount, type Epoch, type StrataClient, type ProjectedSplit } from 'strata-sdk';

import { formatBaseUnits, tryParseAmount, tryParsePercentToBps } from '../format';
import { useStrataRead } from '../useStrataRead';
import { Freshness, ReadOutcome } from './states';

interface ProjectionPanelProps {
  readonly client: StrataClient;
  readonly epoch: Epoch | null;
  readonly decimals: number;
  /** Bumped by the shell's refresh button, so one click re-runs the projection. */
  readonly refreshVersion: number;
}

type Mode = 'value' | 'yield';

type ParsedValue =
  { readonly ok: true; readonly value: bigint } | { readonly ok: false; readonly error: string };

function ProjectionResult({
  client,
  value,
  epoch,
  decimals,
  refreshVersion,
}: {
  readonly client: StrataClient;
  readonly value: bigint;
  readonly epoch: Epoch;
  readonly decimals: number;
  readonly refreshVersion: number;
}) {
  const read = useStrataRead(() => client.project(value), [client, value, refreshVersion]);

  return (
    <>
      <ReadOutcome read={read.result} loading={read.loading} error={read.error} label="projection">
        {(split: ProjectedSplit) => {
          // These are arithmetic on the *contract's own outputs* and the epoch
          // totals, not a reimplementation of the waterfall: I is the senior's
          // target interest implied by `senior_due`, and the cushion is J - I.
          const interest = split.senior_due - epoch.senior_total;
          const cushion = epoch.junior_total - interest;
          const seniorWhole = value >= split.senior_due;
          const juniorDelta = split.junior_payout - epoch.junior_total;

          return (
            <>
              <table>
                <caption>
                  Payout if the vault were worth {formatBaseUnits(value, decimals)} right now
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Output</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Senior target for this epoch (senior_due)</th>
                    <td>{formatBaseUnits(split.senior_due, decimals)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Senior payout</th>
                    <td>{formatBaseUnits(split.senior_payout, decimals)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Junior payout</th>
                    <td>{formatBaseUnits(split.junior_payout, decimals)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Conservation (senior + junior)</th>
                    <td>
                      {formatBaseUnits(split.senior_payout + split.junior_payout, decimals)}{' '}
                      {split.senior_payout + split.junior_payout === value
                        ? '(= V)'
                        : '(≠ V — bug)'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className={seniorWhole ? 'state state-ok' : 'state state-error'} role="status">
                <strong>
                  {seniorWhole
                    ? 'The senior tranche is made whole at this value.'
                    : 'The senior tranche is NOT made whole at this value.'}
                </strong>
                <p>
                  {seniorWhole
                    ? `The junior receives ${
                        juniorDelta >= 0n
                          ? `${formatBaseUnits(juniorDelta, decimals)} above`
                          : `${formatBaseUnits(-juniorDelta, decimals)} below`
                      } its principal.`
                    : 'The junior is wiped out — it receives nothing — and the senior covers the shortfall. A senior depositor can lose principal.'}
                </p>
              </div>

              <dl className="kv">
                <dt>Senior target interest (I)</dt>
                <dd>{formatBaseUnits(interest, decimals)} (= senior_due − S)</dd>
                <dt>Junior buffer (J)</dt>
                <dd>{formatBaseUnits(epoch.junior_total, decimals)}</dd>
                <dt>
                  Real loss cushion (J − I) <span className="badge badge-warn">not J</span>
                </dt>
                <dd>{formatBaseUnits(cushion, decimals)}</dd>
                <dt>Loss the senior absorbs at this value</dt>
                <dd>
                  {seniorWhole
                    ? 'none'
                    : formatBaseUnits(split.senior_due - split.senior_payout, decimals)}
                </dd>
              </dl>

              <p className="callout">
                The cushion is <strong>J − I</strong>, not <strong>J</strong>. The senior’s own
                target interest eats into the buffer, so a buffer exactly equal to <code>I</code>{' '}
                leaves a cushion of zero: the senior is made whole only in the break-even case. In
                the loss case the senior is paid first, and the junior absorbs everything below it.{' '}
                <span className="muted">
                  (From <code>strata-contracts/docs/waterfall-spec.md</code> §3 and{' '}
                  <code>docs/risks.md</code> R3.)
                </span>
              </p>
            </>
          );
        }}
      </ReadOutcome>
      {read.result !== null ? <Freshness read={read.result} /> : null}
    </>
  );
}

/**
 * The waterfall applied to an arbitrary underlying value, via the contract's
 * own `project()` view. No payout arithmetic happens in the browser.
 */
/** `?value=` or `?yield=` can prefill the projection, for a shareable link. */
function initialProjection(): { mode: Mode; input: string } {
  const params = new URLSearchParams(window.location.search);
  const value = params.get('value')?.trim();
  if (value !== undefined && value !== '') {
    return { mode: 'value', input: value };
  }
  const yieldPercent = params.get('yield')?.trim();
  if (yieldPercent !== undefined && yieldPercent !== '') {
    return { mode: 'yield', input: yieldPercent };
  }
  return { mode: 'value', input: '' };
}

export function ProjectionPanel({ client, epoch, decimals, refreshVersion }: ProjectionPanelProps) {
  const [mode, setMode] = useState<Mode>(() => initialProjection().mode);
  const [input, setInput] = useState(() => initialProjection().input);

  const parsed = useMemo<ParsedValue>(() => {
    if (epoch === null) {
      return { ok: false, error: 'There is no epoch to project against.' };
    }
    if (input.trim() === '') {
      return { ok: false, error: 'Enter an underlying value or a yield.' };
    }
    if (mode === 'value') {
      const result = tryParseAmount(input, decimals);
      if (!result.ok) {
        return result;
      }
      if (result.value < 0n) {
        return { ok: false, error: 'The underlying value cannot be negative.' };
      }
      return { ok: true, value: result.value };
    }
    const result = tryParsePercentToBps(input);
    if (!result.ok) {
      return result;
    }
    const principal = epoch.senior_total + epoch.junior_total;
    const value = principal + (principal * result.value) / 10_000n;
    if (value < 0n) {
      return { ok: false, error: 'That yield makes the underlying value negative.' };
    }
    return { ok: true, value };
  }, [mode, input, epoch, decimals]);

  const principal = epoch === null ? null : epoch.senior_total + epoch.junior_total;

  return (
    <section aria-labelledby="projection-heading">
      <h2 id="projection-heading">Payout projection</h2>
      <p className="muted">
        Set what the underlying vault would be worth, or a yield, and this panel calls the
        contract’s <code>project()</code> view. The split is computed by the contract; the app only
        displays it.
      </p>

      {epoch === null ? (
        <p className="muted">Projection needs a current epoch. None is open.</p>
      ) : (
        <>
          <form onSubmit={(event) => event.preventDefault()}>
            <fieldset>
              <legend>What to set</legend>
              <label>
                <input
                  type="radio"
                  name="projection-mode"
                  checked={mode === 'value'}
                  onChange={() => setMode('value')}
                />{' '}
                Underlying value (tokens)
              </label>
              <label>
                <input
                  type="radio"
                  name="projection-mode"
                  checked={mode === 'yield'}
                  onChange={() => setMode('yield')}
                />{' '}
                Yield (% of principal for the epoch)
              </label>
            </fieldset>

            <label htmlFor="projection-input">
              {mode === 'value' ? 'Underlying value (tokens)' : 'Yield (% over the epoch)'}
            </label>
            <input
              id="projection-input"
              name="projection-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder={mode === 'value' ? '2000000' : '0.5'}
              aria-describedby="projection-help"
            />
            <p id="projection-help" className="muted">
              {mode === 'value'
                ? 'The vault’s total value at maturity, in token units. Break-even is S + J.'
                : 'A percentage; 0.5 means the vault returns 0.5% more than the principal. Negative values are allowed.'}
            </p>

            {principal !== null ? (
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('value');
                    setInput(formatAmount(principal, decimals, { trimTrailingZeros: true }));
                  }}
                >
                  Break-even (S + J)
                </button>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('value');
                    setInput('0');
                  }}
                >
                  Total wipeout (0)
                </button>
              </p>
            ) : null}
          </form>

          {!parsed.ok ? (
            <p className="muted">{parsed.error}</p>
          ) : (
            <ProjectionResult
              client={client}
              value={parsed.value}
              epoch={epoch}
              decimals={decimals}
              refreshVersion={refreshVersion}
            />
          )}

          {epoch.status.tag !== 'Open' ? (
            <p className="muted">
              This epoch is {epoch.status.tag.toLowerCase()}, so <code>project()</code> uses its
              settled terms and final principal. It is still the contract’s own waterfall.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
