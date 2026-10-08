# Security policy

## Status: unaudited, testnet-only

**Strata is unaudited software and this app is testnet-only.** No part of it has
been reviewed by a third party. It reads one deployment on Stellar **testnet**
and has no mainnet code path, no mainnet network option, and no wallet.

**Do not put real funds into Strata.** There is no mainnet deployment to put them
into.

This is stated first because it is the honest summary of this repository's
security posture. Everything below is secondary to it.

## What this repository can and cannot do

It can read contract state and render it. That is all.

It cannot:

- move funds, deposit, claim, or settle
- sign a transaction
- hold, generate, derive, or import a secret key
- connect to a wallet

There is no key-handling path, so there is no key-management risk surface in
this version. Adding one is a separate, larger piece of work tracked in
`docs/planned-issues.md`, and it should not be merged without its own threat
review.

## Reporting a vulnerability

Do not open a public issue for a security problem.

Report it privately through GitHub:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Fill in the form.

Please include:

- what an attacker can do, who would be affected, and what they need in order
  to do it
- exact steps, a failing test or a script that reproduces the problem, or the
  request sequence if it is an RPC or SDK issue
- the commit hash or release tag you tested, and which pinned deployment and
  ledger you observed it on

Out of scope: testnet resets or RPC outages, and the open risks already listed
in `docs/risks.md`, unless you have a new reproduction or a change in severity.

### What to expect

We aim to acknowledge reports within 7 days and to send a status update within
14 days. Strata is unaudited, testnet-only software maintained by a small team,
so we cannot promise a fix timeline.

Fixes carry no SLA. This is an unaudited testnet project maintained in the
open, and the maintainers are volunteers.

We will acknowledge a report, and we will say so if we cannot fix something.
Takedown requests against an honest disclosure of an unaudited testnet project
will be considered on their merits, not refused by default.

## Known limitations that look like vulnerabilities

Some of these are expected behaviour. They are listed here so a reader does not
have to guess which is which.

- **A single RPC endpoint can return a wrong answer.** Every figure comes from
  one endpoint. A stale, lagging, or hostile endpoint renders exactly like a
  correct one. See `docs/risks.md` A3. Cross-checking against a second endpoint
  is planned, not implemented.
- **A pinned testnet deployment can disappear.** Testnet is resettable, and a
  reset removes the contracts. The app reports "not found on this network" and
  names the likely cause. See `docs/risks.md` A1.
- **Archived ledger entries cannot be read.** Once a persistent entry expires,
  a restore is required. The app distinguishes this from an empty result
  rather than showing zero. See `docs/risks.md` A5.
- **Error messages are not sanitised.** They carry contract error codes and
  underlying RPC text, which is useful for diagnosis. Everything shown comes
  from a public testnet RPC against a public contract. See `docs/risks.md` A10.
- **The waterfall is not implemented here.** Payout figures come from the
  contract's own `project()` view. If a figure looks wrong, the contract is
  where to look, and the contract repository has its own risk register.

## Scope

In scope: this repository — the SDK, the dashboard, the scripts, and CI.

Out of scope: the contracts themselves, which live in the **strata-contracts**
repository and carry their own risk register at
`strata-contracts/docs/risks.md`. A bug in the settlement maths is a
strata-contracts report. Report it through that repository's Security tab.

## Responsible disclosure

Good-faith research on this repository is welcome: read the code, run it
against testnet, report what does not match its documentation. Report
vulnerabilities privately. Do not exploit testnet, do not touch other users'
positions, and do not publish a working exploit before the maintainers have had
a reasonable chance to respond.
