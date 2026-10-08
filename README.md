# Strata app

> ## Disclaimer
>
> **Strata is unaudited and testnet-only.** Nothing in this repository has been
> reviewed by a third party. This app talks to a deployment on Stellar
> **testnet** and nothing else. It has no mainnet code path and no mainnet
> network option. **It never moves funds**: it reads contract state and renders
> it. Do not put real funds into Strata.

A typed, read-only TypeScript SDK and a static dashboard for the Strata tranche
wrapper on Stellar Soroban.

Strata wraps a Soroban vault and splits the yield of one fixed-term epoch into
two tranches. The senior tranche earns a fixed target rate, is paid first, and
is protected by the junior buffer. The junior tranche earns everything above
that target and absorbs losses first. The contract lifecycle is: create epoch,
deposit, lock, settle, claim.

The contracts live in a separate repository, `strata-contracts`, and are already
deployed to testnet. Its URL is recorded, derived from that repository's
`git remote get-url origin`, in the `pinned_from` block of
`sdk/src/deployments.testnet.json`.
This repository contains no contract source and does not change the waterfall.

- `sdk/` — a typed client pinned to one deployed contract version
- `dashboard/` — a static, read-only web app showing live testnet state
- `scripts/` — SDK generation, deployment-drift check, epoch snapshot

---

## Architecture

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
                              │ Soroban RPC, read-only
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  sdk/src/generated/      bindings from the deployed spec   │
   │  sdk/src/deployment.ts   the one pinned deployment + guard  │
   │  sdk/src/amounts.ts      base-unit ↔ decimal, no floats    │
   │  sdk/src/errors.ts       contract error code → message    │
   │  sdk/src/client.ts       typed StrataRead results          │
   └──────────────────────────┬─────────────────────────────────┘
                              │ StrataRead<T>, never thrown
              ┌───────────────┴────────────────┐
              ▼                                ▼
   ┌──────────────────────────┐   ┌──────────────────────────────┐
   │  dashboard (static)      │   │  scripts (node)              │
   │  React + Vite, no server │   │  snapshot-epoch.ts           │
   └──────────────────────────┘   │  check-deployment-drift      │
                                  └──────────────────────────────┘
```

Nothing in that diagram signs or submits a transaction. Reads are simulated:
the SDK asks the contract what it *would* return and stops before the
signature. That is why the dashboard can show real positions with no wallet.

Full write-up in [`docs/architecture.md`](docs/architecture.md).

---

## Quickstart

Node 24 (see `.nvmrc`) and npm 11.

```sh
npm ci                 # install exactly what package-lock.json pins
npm run check          # lint, format:check, typecheck, build, test
npm run dev --workspace strata-dashboard    # http://localhost:5173
```

`npm run check` is offline. It makes no RPC call and needs no Stellar CLI.

Two commands do need testnet, and neither is a required CI check:

```sh
npm run test:integration   # live SDK tests against the pinned deployment
npm run check:drift        # pinned deployment vs. what is actually on chain
```

The dashboard needs no configuration. Defaults come from the pinned deployment
file, which is compiled into the bundle.

---

## Environment variables

All optional. Each only overrides a pinned default; none is required.

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_RPC_URL` | Soroban RPC endpoint for testnet | from the pinned deployment file |
| `VITE_NETWORK_PASSPHRASE` | Network passphrase | from the pinned deployment file |
| `VITE_MANAGER_ID` | Epoch manager contract ID | from the pinned deployment file |
| `VITE_VAULT_ID` | Mock vault contract ID | from the pinned deployment file |
| `VITE_TOKEN_ID` | Underlying token contract ID | from the pinned deployment file |

The default RPC endpoint is `https://soroban-testnet.stellar.org`, verified
against the Stellar RPC docs and recorded in
[`docs/stack.md`](docs/stack.md). See
[`dashboard/.env.example`](dashboard/.env.example).

The app refuses to start if the network passphrase is not the testnet
passphrase. That is a guard, not a warning.

---

## Status

An item is marked done only if it was actually run.

| Piece | State | What was verified |
| --- | --- | --- |
| Workspaces, TypeScript, lint, format | done | `npm run check` passes |
| Typed SDK client, pinned to one deployment | done | 59 unit tests; 11 live testnet tests |
| Amount helpers, no floating point | done | 17 unit tests, including the documented maximum |
| Contract error messages | done | 8 tests; every enum variant covered |
| Read helpers and typed failure states | done | Unit tests plus live classification tests |
| Projection against worked numbers | done | 10 tests against values recomputed from the spec |
| Recorded testnet fixtures | done | Captured 2026-10-07, stored with their date |
| Dashboard shell, banner, network guard | done | 9 tests; run in a headless browser |
| Epoch panel | done | Rendered real testnet data in a headless browser |
| Account position panel | done | Live lookup rendered in a headless browser |
| Projection panel | done | Rendered at 199.98, 150 and 50 in a headless browser |
| SDK generation script | done | Ran; output committed |
| Deployment-drift check | done | Ran against testnet; no drift |
| Epoch snapshot script | done | Ran; printed the live epoch |
| CI: lint, typecheck, build, test | done | All four jobs offline |
| Live integration workflow | done | Manual, not a required check |
| Weekly drift workflow | done | Manual and weekly |
| Documentation | done | `docs/` |
| Issue backlog | done | 12 drafts in `docs/planned-issues.md` |
| Hosted demo | **not done** | Not deployed; URL is `TODO(maintainer)` |
| Wallet connection | not started | Out of scope; issue drafted |
| Deposit, claim, settle flows | not started | Out of scope; issues drafted |
| Epoch and event history | not started | Needs an indexer; issue drafted |
| Multiple-RPC fallback | not started | Issue drafted |
| Mobile layout | not started | Issue drafted |
| End-to-end test against testnet | not started | Issue drafted |

---

## How the app reads

Every helper in the SDK returns a discriminated result instead of throwing,
because a read can fail in ways that are not bugs and the caller needs to tell
them apart:

| `kind` | meaning | what a reader should do |
| --- | --- | --- |
| `ok` | the value, which may itself be `null` | read it |
| `archived` | a persistent ledger entry has expired | a restore would be needed |
| `not-found` | no such contract on this network | testnet may have been reset |
| `rpc-error` | the RPC failed or returned nonsense | retry; distrust the page |
| `contract-error` | the contract ran and returned its error | the code is decoded and shown |

The dashboard renders each as its own explained screen. A testnet reset and an
RPC outage look identical if you collapse them into one error box, and they call
for opposite responses.

Two invariants the code keeps:

- **Amounts are `bigint`.** Every amount is an `i128` count of the token's
  smallest unit. `number` is a double and loses precision above 2^53, well
  inside the range used here. No path converts an amount to a float, and token
  decimals are read from the token contract rather than assumed.
- **The waterfall is not reimplemented.** Payout splits come from the contract's
  `project()` view. The dashboard displays what the contract returned and shows
  a conservation check, so a divergence would be visible rather than hidden.

---

## The pinned deployment

Stellar testnet is resettable, and a reset removes contracts. So a deployed
contract ID is a promise that expires, and this app treats it that way.

Contract IDs live in exactly one file, `sdk/src/deployments.testnet.json`, which
is a verbatim copy of the contracts repo's `deployments/testnet.json` plus a
`pinned_from` block recording the source repo, the commit, and when it was
copied. The generated bindings repeat the ID once, in a header.

`npm run check:drift` compares that pin against testnet and distinguishes
outcomes by exit code:

| Exit | Meaning |
| --- | --- |
| 0 | no drift |
| 1 | could not run |
| 2 | a pinned contract is gone (testnet was probably reset) |
| 3 | drift: the contract exists but differs from the pin |

It runs weekly and on demand, never as a required PR check, because a testnet
reset must not be able to block a pull request.

---

## Documentation

| Document | What is in it |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Data flow, the pinned-deployment model, why reads are simulated |
| [`docs/stack.md`](docs/stack.md) | Pinned versions with the source of each, verified endpoints |
| [`docs/deploy.md`](docs/deploy.md) | Building and hosting the static dashboard |
| [`docs/risks.md`](docs/risks.md) | The app's own risk register |
| [`docs/planned-issues.md`](docs/planned-issues.md) | 12 drafted issues for the work not done |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Ground rules, commit style, labels, Wave points |
| [`SECURITY.md`](SECURITY.md) | Unaudited status, reporting, known limitations |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Code of conduct |

Two things are worth reading before trusting a number on screen: `risks.md` A3,
because a single RPC can return a wrong answer that renders exactly like a
right one, and the waterfall note below.

### A note on the cushion

The junior buffer is `J`, but the real loss cushion is `J - I`, where `I` is the
senior's own target interest. The senior's interest eats into the buffer before
any loss lands, so a buffer exactly equal to `I` leaves a cushion of zero and
the senior is made whole only in the break-even case. `J - I`, not `J`. This is
`strata-contracts/docs/waterfall-spec.md` §3 and `docs/risks.md` R3, and the
projection panel says so on screen.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). The short version: testnet only, no
signing, `bigint` amounts, no waterfall arithmetic outside the contract, one
pinned deployment file, and no hardcoded GitHub owner. Unfinished work becomes
an issue draft in `docs/planned-issues.md`, never a stub.

---

## Credits

<!-- The repository owner below is a placeholder. It must match the owner in
     `git remote get-url origin`; the owner is being changed, so nothing in this
     repository hardcodes it. Run `npm run credits:link` after the rename and
     it will fill these links in from the remote. -->

Contributors:

<a href="https://github.com/strata-protocol/graphs/contributors">
  <img
    src="https://contrib.rocks/image?repo=strata-protocol/strata-app"
    alt="Contributors to strata-app"
  />
</a>

Built on the [Stellar SDK](https://github.com/stellar/js-stellar-sdk).

The contracts, the waterfall specification, and the risk register this app
cites live in the `strata-contracts` repository.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
