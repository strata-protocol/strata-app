# Architecture

UNAUDITED TESTNET SOFTWARE. Everything described here runs against Stellar
testnet and is not audited. Do not use real funds.

## What this repository is

Two things: a typed read-only SDK for the deployed Strata contracts, and a
static dashboard that renders what the SDK reads. It also carries the scripts
that keep the SDK honest against the chain.

This repository contains no contract source and does not modify the waterfall.
The contracts live in `strata-contracts`; this repository only reads them.

## Data flow

```
                    ┌──────────────────────────────────────────┐
                    │  strata-contracts (separate repo)        │
                    │  Rust contracts + waterfall spec         │
                    └───────────────────┬──────────────────────┘
                                        │ deployed to testnet
                                        ▼
   ┌────────────────────────────────────────────────────────────┐
   │  Stellar testnet                                            │
   │  epoch-manager ──▶ vault ──▶ native XLM SAC (underlying)   │
   └──────────────────────────┬─────────────────────────────────┘
                              │ Soroban RPC (read-only)
                              │ simulateSimulateTransaction
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  sdk/src/generated/      bindings, generated from the      │
   │                         deployed spec over RPC             │
   │  sdk/src/deployment.ts   the one pinned deployment + guard  │
   │  sdk/src/amounts.ts      base-unit ↔ decimal, no floats    │
   │  sdk/src/errors.ts       contract error code → message    │
   │  sdk/src/client.ts       reads; typed StrataRead results   │
   └──────────────────────────┬─────────────────────────────────┘
                              │ StrataRead<T>, never thrown
              ┌───────────────┴────────────────┐
              ▼                                ▼
   ┌──────────────────────────┐   ┌──────────────────────────────┐
   │  dashboard (static)      │   │  scripts (node)              │
   │  React + Vite, no server │   │  snapshot-epoch.ts           │
   │  renders epochs, a       │   │  check-deployment-drift      │
   │  position, a projection  │   └──────────────────────────────┘
   └──────────────────────────┘
```

Nothing in the diagram signs or submits a transaction. The dashboard is a
static bundle: `npm run build` emits files, and any static host serves them.
There is no backend, and no wallet.

## The pinned-deployment model

This is the central constraint of the design.

`strata-contracts` deploys to testnet. Stellar testnet is resettable, and a
reset removes contracts and ledger entries. So a deployed contract ID is a
promise that expires. The app handles that by pinning one deployment to a file
and never treating a live lookup as authoritative:

- `sdk/src/deployments.testnet.json` is the **only** place a contract ID appears.
  It is a verbatim copy of the contracts repo's `deployments/testnet.json` plus
  a `pinned_from` block recording the source repo, the commit SHA, and when the
  copy was made.
- Nothing else may hardcode a contract ID. The generated bindings repeat it
  once, in a header, for the benefit of anyone reading that file.
- `docs/stack.md` records where the endpoint and versions came from.

The check that keeps this honest is `scripts/check-deployment-drift.sh`. It
compares the pin against what is actually on testnet: the contract must exist
and its Wasm hash must match the pinned hash. It distinguishes "gone" from
"changed" by exit code, and runs weekly and on demand rather than as a
required PR check, because a testnet reset must never turn a pull request red.

If drift is found, the fix is to redeploy in the contracts repo and re-pin this
file, not to edit the hash.

## Reads are simulated, not submitted

Every read goes through the generated client's simulate path, which returns the
value the contract *would* return. That is the same mechanism a transaction
would use before signing, stopped before the signature. It is what makes a
read-only app possible without a key.

A `project()` call is therefore a pure function of one input. That is also why
the dashboard never reimplements the waterfall: the split it displays is the
contract's own arithmetic, and the panel shows a conservation check
(`senior + junior === input`) precisely so a divergence would be visible.

The consequence worth stating: a simulated read is only as true as the RPC that
answered it. One endpoint can be down, lagging, or wrong, and this
architecture has no second opinion. `docs/risks.md` carries that as a standing
risk rather than a resolved one.

## Typed results instead of exceptions

Network reads fail in ways that are not bugs: the contract may not be deployed,
a ledger entry may be archived, the RPC may be down, or the contract may return
its own error enum. A caller needs to tell those apart, because they imply
different actions.

So `StrataClient` never throws for these. Every helper returns a discriminated
`StrataRead<T>`:

| `kind` | meaning | what the reader should do |
|---|---|---|
| `ok` | the value (which may itself be `null`) | read it |
| `archived` | a persistent entry has expired | a restore would be needed |
| `not-found` | no such contract on this network | testnet may have been reset |
| `rpc-error` | the RPC failed or returned nonsense | retry; distrust the page |
| `contract-error` | the contract ran and returned its error | the error carries its decoded code |

The dashboard renders each as its own explained screen for the same reason. A
testnet reset and an RPC outage look identical if you collapse them into one
error box, and they call for opposite responses.

## Amounts

Every amount is an `i128` count of the underlying token's smallest unit, typed
`bigint`. JavaScript `number` is a double and loses precision above 2^53, well
inside the range Strata uses, so no path converts an amount to a `number`.
`sdk/src/amounts.ts` does decimal-string ↔ base-unit conversion with `bigint`
and string arithmetic only, and token decimals are read from the token contract
rather than assumed.

## Layout

| Path | what lives there |
|---|---|
| `sdk/src/generated/` | bindings generated from the deployed spec; header records the contract ID and version |
| `sdk/src/deployments.testnet.json` | the pinned deployment and its provenance |
| `sdk/src/client.ts` | RPC setup and the typed read helpers |
| `dashboard/src/` | React components, one panel per read |
| `scripts/` | SDK generation, drift check, epoch snapshot |
| `docs/` | this file, the stack record, hosting, risks, planned work |

## Boundaries kept on purpose

No wallet connection, no key handling, no transaction signing, no mainnet path,
no indexer. Each is out of scope and drafted as an issue in
`docs/planned-issues.md` rather than half-built here.
