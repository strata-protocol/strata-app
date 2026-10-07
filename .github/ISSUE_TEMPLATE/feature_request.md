---
name: Feature request
about: Propose new work in this repository
title: ''
labels: enhancement
assignees: ''
---

**Strata is unaudited and testnet-only.** Anything proposed here stays in those
bounds: testnet, read-only unless a design decision says otherwise, no mainnet
path.

## Summary

<!-- What you want, in a sentence or two. -->

## Why

<!-- The problem it solves. If it is about a number the app shows, say which
     panel and what looked wrong or missing. -->

## Scope check

- [ ] This does not change a contract interface or the waterfall spec. If it
      does, it belongs in the **strata-contracts** repository.
- [ ] This keeps amounts as `bigint` and introduces no floating point.
- [ ] This adds no mainnet URL, passphrase, or code path.
- [ ] This adds no signing, wallet, or secret-key handling. If it needs a
      wallet connection, that is a separate issue and needs a design decision
      first — say so below.

## Acceptance criteria

- [ ]
- [ ]
- [ ]

## Complexity

Wave points, from the issue labels: `drips:1` under an hour, `drips:3` half a
day, `drips:5` a day, `drips:8` more than a day or blocked on a decision.

`drips:`

## Alternatives

<!-- What you considered, or how the app behaves today instead. -->
