---
name: Bug report
about: Something does not behave as documented
title: ''
labels: bug
assignees: ''
---

**Strata is unaudited and testnet-only.** Please do not report real-fund loss;
there is no mainnet deployment. Keep it to behaviour and documentation.

## What happened

<!-- What you did, and what you saw instead. -->

## What you expected

<!-- What the code or a document says should happen. Link the file and line if you can. -->

## Where

- Repository area: SDK / dashboard / scripts / docs / CI
- Pinned deployment commit, if the app displayed one:

## How to reproduce

1.
2.
3.

## Environment

- Node version (`node --version`):
- npm version (`npm --version`):
- Commit or branch:
- RPC endpoint shown in the dashboard's Deployment panel, if the app ran:

## Verification run

If you ran any of these, say which and paste the output:

```sh
npm run check              # lint, typecheck, build, test
npm run test:integration   # live testnet
npm run check:drift        # live testnet
```

## Anything else

<!-- Console errors, a screenshot, the ledger sequence the failure happened at. -->
