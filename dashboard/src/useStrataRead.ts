import { useEffect, useRef, useState } from 'react';

import type { StrataRead } from 'strata-sdk';

export interface UseStrataReadResult<T> {
  readonly loading: boolean;
  readonly result: StrataRead<T> | null;
  readonly error: string | null;
  readonly refresh: () => void;
}

interface ReadState<T> {
  readonly loading: boolean;
  readonly result: StrataRead<T> | null;
  readonly error: string | null;
}

interface Tracked {
  /** The dependency values the current result was produced from. */
  readonly deps: readonly unknown[];
  /**
   * A counter that identifies one query: one value of `deps`, read once. The
   * effect depends on this rather than on `deps` themselves, so the dependency
   * list stays a literal and the rule can check it.
   */
  readonly queryId: number;
}

const IDLE: ReadState<never> = { loading: true, result: null, error: null };

/**
 * Run an SDK read and track its state.
 *
 * The SDK reads never throw for network or contract problems (they return a
 * `StrataRead`), so `error` is only reserved for a genuinely unexpected
 * failure.
 *
 * `deps` are the query parameters: the account, the underlying value, the
 * client. Changing one of them starts a new query. `refresh` starts another
 * with the same parameters.
 */
export function useStrataRead<T>(
  factory: () => Promise<StrataRead<T>>,
  deps: readonly unknown[],
): UseStrataReadResult<T> {
  const [tracked, setTracked] = useState<Tracked>(() => ({ deps: [...deps], queryId: 0 }));
  const [state, setState] = useState<ReadState<T>>(IDLE);

  // Callers pass an inline arrow function, so its identity changes every
  // render. Hold it in a ref and let the effect below read it when a query
  // actually runs.
  const factoryRef = useRef(factory);
  useEffect(() => {
    factoryRef.current = factory;
  });

  // When an input changes, drop the stale result *during render* rather than
  // in an effect. An effect runs after the browser has already painted, so it
  // would show the previous query's numbers under the new input for a frame.
  // React re-runs the render immediately with the new state, so nothing
  // mismatched ever reaches the DOM.
  const inputsChanged =
    deps.length !== tracked.deps.length ||
    deps.some((dep, index) => !Object.is(dep, tracked.deps[index]));
  const queryId = inputsChanged ? tracked.queryId + 1 : tracked.queryId;

  if (inputsChanged) {
    setTracked({ deps: [...deps], queryId });
    setState(IDLE);
  }

  useEffect(() => {
    let alive = true;
    void factoryRef.current().then(
      (result) => {
        if (alive) {
          setState({ loading: false, result, error: null });
        }
      },
      (error: unknown) => {
        if (alive) {
          setState({
            loading: false,
            result: null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );
    return () => {
      // A newer query has superseded this one; ignore whatever it resolves to.
      alive = false;
    };
  }, [queryId]);

  const refresh = () => {
    setState(IDLE);
    setTracked((current) => ({ deps: current.deps, queryId: current.queryId + 1 }));
  };

  return { ...state, refresh };
}
