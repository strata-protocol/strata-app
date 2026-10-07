## What this changes

<!-- One paragraph. If it fixes something, the issue number. -->

## Why

<!-- What was wrong, or what is now possible. -->

## Type

- [ ] SDK
- [ ] Dashboard
- [ ] Scripts
- [ ] Docs
- [ ] CI
- [ ] Repo hygiene

## Ground rules

Confirm these. They are not preferences; a PR that breaks one will not merge.

- [ ] Testnet only. No mainnet URL, passphrase, network option, or code path
      anywhere, including comments and examples.
- [ ] No signing, no wallet code, no secret-key handling.
- [ ] No amount converted to `number`, and no floating point in money code.
- [ ] No reimplementation of the waterfall. Payouts come from the contract's
      `project()` view.
- [ ] No contract ID outside `sdk/src/deployments.testnet.json` and the
      generated bindings header.
- [ ] No hardcoded GitHub owner or org. Links come from `git remote get-url
      origin` or are relative.
- [ ] No invented IDs, URLs, versions, or CLI flags. Anything unverified is
      marked unverified, with the reason.

## Verification

Tick what you ran, and paste the relevant output. **Not verified** is a valid
answer here, as long as it says why.

- [ ] `npm run check` (lint, format:check, typecheck, build, test) — offline
- [ ] `npm run test:integration` — live testnet
- [ ] `npm run check:drift` — live testnet
- [ ] Dashboard run in a browser, with what it showed

## Testing

- [ ] New or changed behaviour has a test.
- [ ] Tests that need the network are excluded from the default run and have a
      documented command.
- [ ] Recorded fixtures carry their capture date.

## Docs

- [ ] Documentation changed alongside the code, or nothing user-visible changed.
- [ ] Any new fact names where it came from: a contracts-repo file, the pinned
      deployment file, or an upstream document.
- [ ] Any field only a maintainer can fill is `TODO(maintainer)` and is listed in
      the report.

## Commits

- [ ] Conventional commits: `type(scope): description`.
- [ ] One logical change per commit, pushed as they were made.
- [ ] No unrelated reformatting, formatting fixes belong in their own commit.

## Screenshots

<!-- Only if the dashboard's appearance changed. Include the testnet banner in
     any screenshot; a cropped panel without it would misrepresent the app. -->
