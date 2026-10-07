---
name: Contract or waterfall mismatch
about: The app, the contract, and the spec disagree
title: ''
labels: bug
assignees: ''
---

This template is for a claim that **Strata itself** behaves differently from its
specification: the settlement maths, the waterfall, an entrypoint, or an error
code.

If the disagreement is between this app and the contract — a wrong format, a bad
display, a stale pin — use the bug report template instead.

## The claim

<!-- What the spec or code says should happen. Quote it, with a file and line. -->

## What happens

<!-- What the contract actually returned. -->

## Evidence

Include whatever you have. The more concrete, the better:

- [ ] The `project()` or view call that produced it, with its argument
- [ ] The full returned values, in base units
- [ ] The ledger sequence the call was simulated against
- [ ] The RPC endpoint
- [ ] Your own worked number from `strata-contracts/docs/waterfall-spec.md`,
      recomputed independently
- [ ] A test that fails, in `sdk/test/projection.test.ts` or a new one

State whether you recomputed the expected value by hand from the spec. An
expectation copied from another tool's output is not an independent check.

## Which repository

If this turns out to be a contract bug rather than an app bug, it will be moved
to the **strata-contracts** repository, which carries its own risk register.
That is fine; saying so early is useful.

## Note

Do not adjust an expectation to match what the contract returned. A divergence
is the finding, and it is worth recording on both sides.
