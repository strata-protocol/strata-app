# Strata app

> ## Disclaimer
>
> **Strata is unaudited and testnet-only.** Nothing in this repository has been
> reviewed by a third party. This app talks to a deployment on Stellar **testnet**
> and nothing else. It has no mainnet code path and no mainnet network option. Do
> not put real funds into it.

A typed, read-only TypeScript client and dashboard for the Strata tranche wrapper
on Stellar Soroban.

Strata wraps a Soroban vault and splits the yield of one fixed-term epoch into two
tranches. The senior tranche earns a fixed target rate, paid first and protected by
the junior buffer. The junior tranche earns everything above that target and absorbs
losses first. The contract lifecycle is create epoch, deposit, lock, settle, claim.

The contracts live in a separate repository and are already deployed to testnet.
**This app never moves funds.** It reads contract state and renders it.

- `sdk/` — a typed client pinned to one deployed contract version
- `dashboard/` — a static, read-only web app showing live testnet state
- `scripts/` — SDK generation, deployment-drift check, and an epoch snapshot helper

---

## Status

This repository is under construction. It is not usable yet.

| Piece | State |
| --- | --- |
| Workspace, TypeScript, lint and format configuration | done |
| Typed SDK | planned |
| Dashboard | planned |
| Generation, drift and snapshot scripts | planned |
| CI | planned |
| Documentation | planned |

The status table in the final README marks an item done only when it has been run.

---

## Documentation

Documentation is being written alongside the code. Planned documents:

`docs/architecture.md`, `docs/stack.md`, `docs/deploy.md`, `docs/risks.md`,
`docs/planned-issues.md`.

## Contributing

`CONTRIBUTING.md`, `SECURITY.md` and `CODE_OF_CONDUCT.md` are planned.

## Maintainers

TODO(maintainer)

## License

Apache-2.0. See [LICENSE](LICENSE).
