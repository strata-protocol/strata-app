import { useState } from 'react';

import { StrKey } from '@stellar/stellar-sdk';
import {
  TRANCHE_JUNIOR,
  TRANCHE_SENIOR,
  type Position,
  type StrataClient,
  type Tranche,
} from 'strata-sdk';

import { formatBaseUnits } from '../format';
import { useStrataRead } from '../useStrataRead';
import { Freshness, ReadOutcome } from './states';

interface PositionPanelProps {
  readonly client: StrataClient;
  readonly decimals: number;
  readonly epochStatus: 'Open' | 'Settled' | 'Closed' | null;
  /** Bumped by the shell's refresh button, so one click re-reads positions too. */
  readonly refreshVersion: number;
}

/**
 * A depositor is either a G… account or a C… contract. Validated with the
 * Stellar SDK's own StrKey rather than a shape regex, so a bad checksum or a
 * wrong payload is caught here instead of turning into a confusing contract
 * error after a round trip.
 */
function isValidAddress(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value) || StrKey.isValidContract(value);
}

function payoutLabel(epochStatus: PositionPanelProps['epochStatus']): string {
  return epochStatus === 'Open'
    ? 'Estimated payout (projected against the vault’s live value — not final)'
    : 'Claimable payout (fixed at settlement)';
}

interface PositionsProps extends PositionPanelProps {
  readonly who: string;
}

function Positions({ client, decimals, epochStatus, refreshVersion, who }: PositionsProps) {
  const senior = useStrataRead(
    () => client.position(who, TRANCHE_SENIOR),
    [client, who, refreshVersion],
  );
  const junior = useStrataRead(
    () => client.position(who, TRANCHE_JUNIOR),
    [client, who, refreshVersion],
  );

  const row = (tranche: Tranche, read: typeof senior) => (
    <tr>
      <th scope="row">{tranche.tag}</th>
      <td>
        <ReadOutcome
          read={read.result}
          loading={read.loading}
          error={read.error}
          label={`${tranche.tag} position`}
        >
          {(position: Position) => (
            <>
              <div>Principal: {formatBaseUnits(position.principal, decimals)}</div>
              <div>
                {payoutLabel(epochStatus)}: {formatBaseUnits(position.estimated_payout, decimals)}
              </div>
            </>
          )}
        </ReadOutcome>
      </td>
    </tr>
  );

  const seniorOk = senior.result?.kind === 'ok' ? senior.result.value : null;
  const juniorOk = junior.result?.kind === 'ok' ? junior.result.value : null;
  const noPosition =
    seniorOk !== null &&
    juniorOk !== null &&
    seniorOk.principal === 0n &&
    juniorOk.principal === 0n;

  return (
    <>
      <table>
        <caption>Positions for {who}</caption>
        <thead>
          <tr>
            <th scope="col">Tranche</th>
            <th scope="col">Principal and payout</th>
          </tr>
        </thead>
        <tbody>
          {row(TRANCHE_SENIOR, senior)}
          {row(TRANCHE_JUNIOR, junior)}
        </tbody>
      </table>

      {noPosition ? (
        <p className="muted">
          This address holds no position in the current epoch. That is also what a position looks
          like after it has been claimed — the claim clears it.
        </p>
      ) : null}

      {senior.result !== null ? <Freshness read={senior.result} /> : null}
    </>
  );
}

/** A `?account=` query parameter can prefill the lookup, for a shareable link. */
function initialAccount(): { input: string; who: string | null } {
  const account = new URLSearchParams(window.location.search).get('account')?.trim() ?? '';
  return { input: account, who: isValidAddress(account) ? account : null };
}

/** Look up a pasted account's position. No wallet, no signing. */
export function PositionPanel({
  client,
  decimals,
  epochStatus,
  refreshVersion,
}: PositionPanelProps) {
  const [input, setInput] = useState(() => initialAccount().input);
  const [who, setWho] = useState<string | null>(() => initialAccount().who);
  const [error, setError] = useState<string | null>(null);

  return (
    <section aria-labelledby="position-heading">
      <h2 id="position-heading">A depositor’s position</h2>
      <p className="muted">
        Paste an account address to read its tranche positions. There is no wallet connection and
        nothing is signed; this only simulates reads.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = input.trim();
          if (!isValidAddress(value)) {
            setError(
              'Enter a Stellar address: an account address starting G, or a contract address starting C.',
            );
            setWho(null);
            return;
          }
          setError(null);
          setWho(value);
        }}
      >
        <label htmlFor="position-address">Account address</label>
        <input
          id="position-address"
          name="address"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="G…"
          aria-describedby="position-help"
        />
        <button type="submit">Look up position</button>
        <p id="position-help" className="muted">
          Positions are not transferable, so nothing can claim on another account’s behalf.
        </p>
      </form>

      {error !== null ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {who !== null ? (
        <Positions
          client={client}
          who={who}
          decimals={decimals}
          epochStatus={epochStatus}
          refreshVersion={refreshVersion}
        />
      ) : null}
    </section>
  );
}
