# Stack and pinned versions

UNAUDITED TESTNET SOFTWARE. Every version below is pinned exactly in
`package-lock.json`, which is committed. Recorded 2026-10-07.

Nothing here was chosen by guessing at a version. Where a version came from an
upstream document or a `--help` output, that source is named.

## Runtime

| Tool | Version | Source |
|---|---|---|
| Node.js | 24 (LTS line), pinned in `.nvmrc` | current LTS at the time of writing |
| npm | 11 | ships with the Node line above |

CI reads `.nvmrc` through `actions/setup-node`, so local and CI run the same
Node line.

## Build and test tooling

| Package | Version | Why |
|---|---|---|
| `typescript` | 6.0.3 | `strict` plus `noUncheckedIndexedAccess`, per the brief |
| `vitest` | 5.0.3 | unit tests |
| `eslint` | 10.12.0 | lint |
| `typescript-eslint` | 8.71.1 | type-aware lint rules |
| `@eslint/js` | 10.0.1 | ESLint's own recommended rules |
| `prettier` | 3.9.9 | formatting; `npm run format:check` is part of the lint job |
| `globals` | 17.13.0 | env globals per workspace |
| `tsx` | 4.23.15 | runs `scripts/snapshot-epoch.ts` |

## Stellar

| Package / tool | Version | Source |
|---|---|---|
| `@stellar/stellar-sdk` | 17.2.1 | npm dist-tag at install time |
| Stellar CLI (contracts build) | 28.1.0 | recorded in the contracts repo's `deployments/testnet.json`; this repo does not install it |

The SDK version is not an independent choice. `strata-contracts` risk register
R16 records SDK version coupling as a real risk, and the bindings this repo
generates must stay readable against the same XDR the contracts produce. If the
contracts repo moves its SDK, this pin must move with it.

### Verified endpoints

| Item | Value | How it was verified |
|---|---|---|
| Network | Stellar testnet | `network` field in the contracts repo's `deployments/testnet.json` |
| Network passphrase | `Test SDF Network ; September 2015` | copied from that file; asserted by `assertTestnetPassphrase` |
| Soroban RPC (testnet) | `https://soroban-testnet.stellar.org` | the testnet default in the Stellar RPC docs (`https://developers.stellar.org/docs/data/apis/rpc`), and the default the JS SDK's own generator uses for `--network testnet`; checked again on 2026-10-06 |

There is no mainnet URL anywhere in this repository, on purpose. A mainnet
endpoint has no reason to exist in a testnet-only app, and its absence is a
checkable property.

## Bindings generation

`stellar contract bindings typescript` is deprecated in Stellar CLI 28.1.0. Its
own help text says so:

```
$ stellar contract bindings typescript --help
⚠️ Deprecated, use the JavaScript Stellar SDK instead
```

So `scripts/generate-sdk.sh` uses the JS SDK's generator,
`@stellar/stellar-sdk`'s `stellar-js generate`, which reads the contract's
specification over Soroban RPC and emits a typed TypeScript client. The
deprecated subcommand still works at 28.1.0 and remains the fallback if the JS
generator is ever unavailable.

The generated output is committed. A build never regenerates it, so CI needs no
network and no Stellar CLI to typecheck.

## Dashboard

| Package | Version |
|---|---|
| `react` / `react-dom` | 19.3.0 |
| `vite` | 8.3.3 |
| `@vitejs/plugin-react` | 6.1.2 |
| `buffer` | 6.0.3 |
| `jsdom` | 30.1.2 (dev only) |
| `@types/react` / `@types/react-dom` | 19.3.0 |

No UI framework and no charting library. The only visualisation is the
projection panel's tables and figures, which are HTML.

`buffer` is a direct dependency on purpose: some XDR and base64 paths in the
Stellar SDK reach for a global `Buffer`, and a static browser bundle does not
have one. `dashboard/src/main.tsx` installs it before any SDK call.

The main bundle is about 900 kB (roughly 215 kB gzipped), nearly all of it the
Stellar SDK. That is recorded in `docs/risks.md` as a known cost, not fixed
here.

## Workspaces

npm workspaces: `sdk`, `dashboard`, `scripts`. The dashboard resolves
`strata-sdk` to `../sdk/src/index.ts` through both its tsconfig `paths` and a
Vite alias, so a dev server and the typecheck never depend on a preceding
build.

## Re-verifying

```sh
npm ci                 # installs exactly package-lock.json
npm run check          # lint, format:check, typecheck, build, test
npm run test:integration   # live testnet, not part of CI
npm run check:drift         # live testnet, not part of CI
```

The two live commands are deliberately absent from the required CI checks: a
testnet reset or an RPC outage must not be able to block a pull request.
