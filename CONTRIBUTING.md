# Contributing

Thanks for looking. This project is small and the rules below exist because
the code handles money-shaped numbers, even if it never moves funds.

**Strata is unaudited and testnet-only.** Nothing here has been reviewed by a
third party. Every contribution lands in that category unless it is a security
fix that changes that.

## Before you start

- For anything that would change a contract interface or the waterfall spec,
  open an issue in the **strata-contracts** repository first. This repository
  only reads those contracts; a change here cannot change them, and one
  attempted here would be wrong by construction.
- Anything unfinished belongs in `docs/planned-issues.md` as an issue draft.
  Do not commit a stub that looks finished.
- If you cannot verify a contract address, a version, an endpoint, or a CLI
  flag, say so. Write "unverified" and explain. Do not fill the gap with a
  plausible-looking value.

## Ground rules

These are not preferences. A change that breaks one of them will not merge.

- **Testnet only.** No mainnet URL, passphrase, network option, or code path in
  any commit, including comments and examples.
- **No signing, no keys.** No wallet code, no secret key handling, no key
  derivation. Transaction signing is out of scope for this version and is
  tracked as an issue.
- **Amounts are `bigint`, always.** Every amount is an `i128` count of the
  token's smallest unit. `number` is a double and loses precision above 2^53,
  well inside the range used here. No amount may pass through a float. If you
  need a display string, use `sdk/src/amounts.ts`.
- **Do not reimplement the waterfall.** Payout splits come from the contract's
  `project()` view. A second implementation in TypeScript is a second source of
  truth, and it will eventually disagree with the contract.
- **One pinned deployment file.** Contract IDs live in
  `sdk/src/deployments.testnet.json` and in the generated bindings header.
  Nowhere else. If you need another address, it belongs in that file.
- **Do not hardcode an owner or org name.** Derive repo links from
  `git remote get-url origin` or use a relative path. The GitHub owner is being
  changed.

## Development

```sh
npm ci
npm run dev --workspace strata-dashboard    # http://localhost:5173
npm run check                               # lint, typecheck, build, test
```

`npm run check` is what CI runs. It must pass offline: no RPC call, no network
passphrase, no Stellar CLI. If your change needs the network, it belongs in a
test excluded from the default run.

Two commands do need testnet, and neither is a required check:

```sh
npm run test:integration   # live SDK tests against the pinned deployment
npm run check:drift        # compares the pinned deployment to what is on chain
```

## Commits and branches

Conventional commits: `type(scope): description`, with `type` in `feat`, `fix`,
`chore`, `docs`, `ci`, `test`, `style`, `refactor`.

Work on a branch off `main`. One commit per logical unit, and push after each
one. Do not batch unrelated changes into a single commit, and do not merge,
tag, or release your own work: a maintainer reviews the pull request.

Scope is the workspace or area, for example `sdk`, `dashboard`, `scripts`,
`docs`, `repo`, `workflows`.

## CI jobs

These four job names are the branch-protection contract. Renaming one breaks
the ruleset, so treat them as API:

| Job | What it does |
| --- | --- |
| `lint` | ESLint, Prettier check, `bash -n` on shell scripts |
| `typecheck` | `tsc --noEmit` across every workspace |
| `build` | builds the SDK and the dashboard |
| `test` | unit tests, offline |

Two workflows reach testnet and are deliberately **not** required checks:
`Live testnet integration` (manual) and `Deployment drift` (manual and weekly).
A testnet reset must never be able to block a pull request.

## Labels

| Label | Meaning |
| --- | --- |
| `enhancement` | a new feature or an improvement |
| `bug` | something does not behave as documented |
| `documentation` | docs only |
| `testing` | tests, fixtures, or test infrastructure |
| `accessibility` | keyboard, screen-reader, or contrast work |
| `performance` | bundle size, load time, or render cost |
| `good first issue` | small, self-contained, with a clear finish line |
| `needs-design` | needs a maintainer decision before it can be built |
| `admin-only` | touches admin-gated behaviour |
| `blocked` | waiting on something else |

## Wave point levels

Complexity is sized in Wave points, from the issue's own label:

| Label | Size | Roughly |
| --- | --- | --- |
| `drips:1` | very small | under an hour |
| `drips:3` | small | half a day |
| `drips:5` | medium | a day |
| `drips:8` | large | more than a day, or needs a design decision first |

Size the issue when you open it. If you pick wrong, that is fine and worth
saying so in the issue; a wrong guess costs less than a silent one.

Pick `needs-design` over a large point count when the real blocker is a
decision, not effort. Wallet connection, deposit, and settle are all in that
category: the work is not the hard part, the decision about signing is.

## Pull requests

Describe what changed and what you ran. If you tested against testnet, say so
and paste the ledger sequence. If you did not, say that too. An honest "not
verified, here is why" is more useful here than a claim that outruns the
evidence.

Keep one logical change per pull request. Unrelated cleanups belong in their own.

## Security

Do not open a public issue for a vulnerability. See `SECURITY.md`.

## Code of conduct

`CODE_OF_CONDUCT.md`. Participation is governed by it.

## License

Contributions are licensed under Apache-2.0, the same as the repository. See
`LICENSE`.
