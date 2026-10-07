/**
 * What the reader sees when the app cannot start at all.
 *
 * UNAUDITED TESTNET SOFTWARE. The one failure this exists for is the network
 * guard: the app refused to run because the configured passphrase is not the
 * testnet passphrase. That is the intended behaviour, so it is explained
 * rather than dumped as a stack trace.
 */
export function FatalStartup({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const isGuard = error instanceof Error && error.name === 'NetworkGuardError';

  return (
    <main>
      <h1>Strata dashboard cannot start</h1>
      <p className="banner" role="alert">
        {isGuard
          ? 'This app is testnet-only and refused to start against a network that is not Stellar testnet. That is a safety guard, not a bug: set the testnet passphrase, or delete the override and use the pinned default.'
          : 'The dashboard failed to start. Unaudited testnet software.'}
      </p>
      <pre className="detail">{message}</pre>
    </main>
  );
}
