# Strata app v0.1.0

UNAUDITED TESTNET SOFTWARE. Do not use real funds.

Strata app is a typed, read-only TypeScript SDK and a static dashboard for the
Strata tranche wrapper on Stellar Soroban.

This is the first tag of `strata-app`. It is **testnet-only** and **read-only**.
It reads one pinned testnet deployment and renders it; it does not sign, submit,
deposit, claim, or settle anything. No part of this repository has been reviewed
by a third party. There is no mainnet code path and no mainnet network option.

## Pinned deployment

This release points at one deployment on Stellar testnet. The contract IDs and
Wasm hashes below are copied from
[`sdk/src/deployments.testnet.json`](../sdk/src/deployments.testnet.json), which
is the single place they are recorded in this repository.

| Contract | Role | Contract ID | Wasm SHA-256 |
| --- | --- | --- | --- |
| epoch-manager | holds one epoch, settles, pays out | `CB57H6NE7CIPHEDO2HJT7IX55NHP6RXI2EPSUIGK65NLG5CCXC4JB7QU` | `b12c8af8403df7478ee67f4e6dd292230236f086a4908894ef80d19417828f7a` |
| mock-vault | stands in for the yield source | `CDWJS65BA26QBTA4L6LBX76B2XPGAQHY25USI6Z3MSQ73T5NQTXARSQ6` | `a3599c7022dc90c5df2fe009e49e25de6fb087536f872c588efc5cc732346759` |
| underlying token | native XLM Stellar Asset Contract (7 decimals) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | — |

Explorer (StellarExpert, testnet), URL format verified by loading it:

- epoch-manager: https://stellar.expert/explorer/testnet/contract/CB57H6NE7CIPHEDO2HJT7IX55NHP6RXI2EPSUIGK65NLG5CCXC4JB7QU
- mock-vault: https://stellar.expert/explorer/testnet/contract/CDWJS65BA26QBTA4L6LBX76B2XPGAQHY25USI6Z3MSQ73T5NQTXARSQ6
- underlying token: https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

The pin is a verbatim copy of
[`strata-protocol/strata-contracts`](https://github.com/strata-protocol/strata-contracts)
`deployments/testnet.json` at commit
`ecb5276be34561304264f7021a6916c0d2ff9646`, copied at `2026-10-06T14:58:59Z`
and deployed at `2026-10-05T11:35:50Z`. The contracts repository does not yet
have a `v0.1.0` release, so there is no contracts release link to point at here.

The bindings in `sdk/src/generated/` are generated once from that deployment and
committed, so a build needs no network and no Stellar CLI.

## Verification in this release

Everything below was re-run in this release session, on `main` at commit
`fff052da2328325edf1b27d108e8ccab7b572591`, not copied from an older document.

- **Local checks.** `npm ci` then `npm run check` (lint, format:check,
  typecheck, build, test) exited `0`.
- **Unit tests.** 89 passed, 0 failed:
  - `strata-sdk`: 59 tests across 5 files
    (`fixtures` 13, `projection` 10, `amounts` 17, `client` 11, `errors` 8).
  - `strata-dashboard`: 30 tests across 2 files (`format` 21, `config` 9).
- **Live testnet integration.** `npm run test:integration` exited `0`: 11 tests
  passed against the pinned deployment.
- **Deployment drift.** `npm run check:drift` exited `0` (no drift). The
  on-chain Wasm hashes for the epoch-manager and the mock-vault match the pinned
  file, and the generated bindings header names the same manager and hash.
- **Live demo.** https://strata-protocol.github.io/strata-app/ loaded with HTTP
  `200`, and the served bundle contains the banner
  `UNAUDITED · TESTNET ONLY · READ-ONLY`.

## Live demo

https://strata-protocol.github.io/strata-app/

The dashboard is a static site built from this repository and served from GitHub
Pages. It runs with no `.env`: it reads its defaults from the pinned deployment
file compiled into the bundle, and it refuses to start on a non-testnet
passphrase. See [`docs/deploy.md`](deploy.md).

## What is included

- **SDK** (`sdk/`): a typed, read-only client pinned to one deployed contract
  version. Every read returns a discriminated `StrataRead<T>` result instead of
  throwing, and amounts are `bigint` base units with no floating point.
- **Dashboard** (`dashboard/`): a static React + Vite read-only app showing live
  testnet state, with a distinct screen for each failure kind.
- **Scripts** (`scripts/`): SDK generation, the deployment-drift check, and an
  epoch snapshot tool.
- **CI** (`.github/workflows/`): offline `lint`, `typecheck`, `build` and `test`
  jobs; a manual live-integration workflow; a manual + weekly drift workflow; and
  a Pages deploy job.
- **Docs** (`docs/`): architecture, stack and pinned versions, deploy guide,
  risk register, planned issues, plus `CONTRIBUTING.md` and `SECURITY.md`.

## What is not included

- **No wallet and no signing.** There is no key-handling path. The app reads a
  position and cannot act on it.
- **No write flows.** Deposit, claim, and settle are out of scope and drafted as
  issues.
- **A single RPC endpoint.** Every figure comes from one endpoint, which can be
  stale or wrong; there is no second opinion. See `docs/risks.md` A3.
- **No indexer, no history.** The manager holds one epoch at a time, so past
  epochs cannot be shown.
- **No audit and no mainnet.** Unaudited testnet software only.

## Risks

The app's own register is [`docs/risks.md`](risks.md): **10 risks, A1–A10**. The
two most important are A1 (the pinned deployment can go stale if testnet is
reset) and A3 (a single RPC endpoint can return a wrong answer that renders
exactly like a right one). Contract-side risks live in the contracts
repository's `docs/risks.md`.

## Open issues

Work not done in this release is tracked as GitHub issues:
https://github.com/strata-protocol/strata-app/issues — 6 open at the time of
tagging. Further drafts that are not yet filed are in
[`docs/planned-issues.md`](planned-issues.md).

## License

Apache-2.0. See [`LICENSE`](../LICENSE).
