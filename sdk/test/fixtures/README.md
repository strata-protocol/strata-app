# Test fixtures

Real responses captured from the **deployed testnet** manager. Not hand-written
and not synthesised.

- `testnet-reads.json` — captured **2026-10-07** against
  `https://soroban-testnet.stellar.org` from the manager pinned in
  `sdk/src/deployments.testnet.json`. The capture's own `provenance` block
  records the exact timestamp, endpoint, contract ID and ledger.

Amounts are stored as decimal strings so the file stays portable JSON; the SDK
returns `bigint`. `sdk/test/fixture.ts` adds the types and the string -> bigint
conversion.

They exist so the offline unit tests can assert real shapes and real
invariants (conservation, the senior cap, the cushion) without the network.
The live equivalents are in `sdk/test/client.integration.test.ts`.

## Refreshing

The fixture is a point-in-time record, not something that needs to track the
chain. To refresh it, point a capture script at `createStrataClient()` and
write the same shape. If testnet has been reset the contract IDs in it are
meaningless; re-deploy `strata-contracts`, re-pin
`sdk/src/deployments.testnet.json`, then re-capture.

The live testnet deployment currently holds the settled, closed `loss` demo
epoch. There is no open epoch, so `project()` is evaluated against the closed
epoch's final terms, which is why the "positions" captured for the demo
depositors are zero (their claims were made and cleared).
