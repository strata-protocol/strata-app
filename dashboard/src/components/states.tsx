import type { ReactNode } from 'react';

import type { StrataRead } from 'strata-sdk';

import { freshnessOf } from '../format';

/** The freshness line every data panel shows. */
export function Freshness({ read }: { read: { ledger: number | null; fetchedAt: string } }) {
  return <p className="freshness">{freshnessOf(read)}</p>;
}

interface ReadOutcomeProps<T> {
  readonly read: StrataRead<T> | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly label: string;
  readonly children: (value: T) => ReactNode;
}

/**
 * Render a `StrataRead` uniformly: the value when ok, and a distinct,
 * explained state for each way it can fail. The four failure kinds are
 * deliberately different screens, because they need different actions from
 * the reader.
 */
export function ReadOutcome<T>({ read, loading, error, label, children }: ReadOutcomeProps<T>) {
  if (loading) {
    return (
      <p className="muted" role="status">
        Loading {label}…
      </p>
    );
  }
  if (error !== null) {
    return (
      <div className="state state-error" role="alert">
        <strong>{label} failed unexpectedly.</strong>
        <p className="detail">{error}</p>
      </div>
    );
  }
  if (read === null) {
    return <p className="muted">No result for {label}.</p>;
  }

  switch (read.kind) {
    case 'ok':
      return <>{children(read.value)}</>;
    case 'archived':
      return (
        <div className="state state-warn" role="alert">
          <strong>{label}: an entry this read needs has expired.</strong>
          <p>
            A persistent Soroban entry is archived. It would have to be restored before it can be
            read again. This is not an empty result — the data exists, it is just expired.
          </p>
          <p className="detail">{read.message}</p>
        </div>
      );
    case 'not-found':
      return (
        <div className="state state-error" role="alert">
          <strong>{label}: not found on this network.</strong>
          <p>
            The contract is not deployed here. Strata testnet may have been reset — that removes
            contracts and ledger entries. Re-deploy, re-pin the deployment file, and reload.
          </p>
          <p className="detail">{read.message}</p>
        </div>
      );
    case 'rpc-error':
      return (
        <div className="state state-error" role="alert">
          <strong>{label}: the RPC endpoint failed.</strong>
          <p>
            The chain may be fine; a single RPC can be down or lie. Retry, and treat every figure on
            this page as coming from an endpoint you do not control.
          </p>
          <p className="detail">{read.message}</p>
        </div>
      );
    case 'contract-error':
      return (
        <div className="state state-warn" role="alert">
          <strong>
            {label}: the contract returned an error
            {read.code === null ? '' : ` (code ${read.code})`}.
          </strong>
          <p>{read.message}</p>
        </div>
      );
  }
}
