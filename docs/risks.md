# App risk register

UNAUDITED TESTNET SOFTWARE. The risks below are properties of this app, not of
the contracts. The contracts have their own register in
`strata-contracts/docs/risks.md`, and where a risk is inherited from there it is
named rather than restated as if it were new.

Severity is this app's own judgement.

## A1 — The pinned deployment goes stale — **High**

`strata-app` points at one testnet deployment recorded in
`sdk/src/deployments.testnet.json`. Stellar testnet is resettable. A reset
removes the contracts and the ledger entries that hold the epoch.

When it happens, every panel on the dashboard shows "not found on this network",
which is accurate but tells the reader nothing about *why*.

Mitigations in place: `not-found` is its own state rather than a generic error,
and its message names the likely cause; `scripts/check-deployment-drift.sh`
distinguishes "contract gone" (exit 2) from "contract changed" (exit 3) and runs
weekly. Both are response, not prevention.

Residual risk: the pin cannot be kept correct automatically. Recovery is
redeploy in the contracts repo, re-pin, rebuild.

## A2 — Testnet resets out from under a reader — **Medium**

Same cause, different consequence: a page left open across a reset shows stale
figures that were true when fetched. Every panel displays the ledger sequence
and fetch time, so a reader can see how old the data is, but nothing invalidates
it automatically.

Mitigation in place: the freshness line on every data panel. No auto-refresh is
implemented; the refresh button is manual.

## A3 — A single RPC can be wrong, not just absent — **High**

Every figure comes from one endpoint. That endpoint can be stale, behind a
load balancer, misbehaving, or hostile. There is no second opinion and no
cross-check against another source, so a wrong answer renders exactly like a
right one.

This is the most important limitation in the app. It is not mitigated; it is
disclosed. `docs/planned-issues.md` tracks multiple-RPC fallback as planned
work.

What a reader can do: notice the ledger sequence lagging far behind, and treat
any large unexpected figure with suspicion.

## A4 — Display rounding misleads — **Medium**

Amounts are `i128` base units with 7 decimals, formatted for display by
`sdk/src/amounts.ts`. That helper never uses floating point, so no digits are
lost in conversion — but the *rendered* figure is not the full value, and
trailing zeros are trimmed for readability.

Mitigations in place: trimming is opt-out (`formatBaseUnits(value, decimals,
false)`); `formatAmountWithUnits` shows the exact base-unit count; the
projection panel labels its figures with the underlying unit.

Residual risk: someone reading a rounded figure as the contract's exact figure.
The panels that matter state which is which.

## A5 — Archived entries cannot be read — **Medium**

Soroban persistent entries expire. `strata-contracts/docs/risks.md` R9 covers
this on the contract side. Once an entry the read needs has expired, the value
is gone from the chain's live state and a restore is required.

Mitigation in place: `archived` is a distinct result kind with its own screen,
which explicitly says "this is not an empty result, the data exists, it is
expired". A reader who conflated that with "no position" would be badly misled.

Residual risk: a restore is outside this app's control. The app can report the
condition and nothing more.

## A6 — No wallet, so nothing can be acted on — **By design, stated**

There is no wallet connection and no signing. A reader sees a position and
cannot claim it from here. That is the intended scope, not an oversight, but it
is a limit worth stating in a risk register because it changes what the app is
for.

The upside is the absence of any key-handling path, and therefore no
key-management risk surface at all. Wallet connection and the write flows are
drafted as issues in `docs/planned-issues.md`.

## A7 — Bindings can drift from the deployed contract — **Medium**

`sdk/src/generated/` is generated once and committed. If the contracts repo
redeploys, the committed bindings may describe a contract that no longer exists,
and a read could fail in a way that looks like a contract bug.

Mitigations in place: the generated header records the contract ID, the Wasm
hash, and the source commit; the drift check compares the pin and the on-chain
Wasm hash weekly and on demand; regeneration is a documented one-liner
(`npm run generate:sdk`).

## A8 — One bundle, and it is large — **Low**

The shipped bundle is roughly 900 kB (about 215 kB gzipped), almost entirely the
Stellar SDK. That is a slow first paint on a poor connection, and for a read-only
dashboard the SDK is doing more than the page needs.

No code-splitting is implemented. Recorded rather than fixed; it is a
performance improvement, not a correctness one.

## A9 — Simulated reads are only as fresh as the ledger — **Low**

Every read simulates a transaction against a chosen ledger, and the SDK reports
the ledger the simulation ran against where the RPC supplies one. If the RPC
supplies none, the freshness line says "unknown" rather than showing a zero that
would read as a real answer.

## A10 — An error message could leak internals — **Low**

`contract-error` results carry the decoded contract error code and its readable
message. Failure states also show the underlying error string for diagnosis.

That is useful for a testnet debugging tool and is not sanitised. Everything
displayed comes from a public testnet RPC against a public contract, so there is
nothing secret to leak, but it would need revisiting before any deployment that
is not testnet.

## Accepted, and not worked around

- **No mainnet support.** Deliberate. There is no mainnet URL or code path in
  this repository, and the app refuses to start on a non-testnet passphrase.
- **No waterfall reimplementation.** Payout projections come from the
  contract's `project()` view. Reimplementing the maths in TypeScript would
  create a second source of truth that could disagree with the contract.
- **No indexer.** There is no history of past epochs, because the manager holds
  one epoch at a time and reading the past would need an indexer the app
  deliberately does not have.
- **One pinned deployment.** Supporting several would multiply A1.
