# Planned issues

UNAUDITED TESTNET SOFTWARE.

These are drafts, not stubs. Nothing in this file is implemented, and nothing
here is presented as working. Each is ready to file as a GitHub issue once a
repo owner is settled.

Every issue keeps the same ground rules as the code: testnet only, no wallet
without an explicit decision, no mainnet path, amounts as `bigint`, and no
waterfall arithmetic outside the contract.

Complexity uses the Wave point levels: `drips:1` is small, `drips:3` is a
session, `drips:5` is a day, `drips:8` is larger than a day.

---

## 1. Connect a wallet to the dashboard

**Labels:** `enhancement`, `needs-design`
**Complexity:** `drips:8`
**Status:** Planned, not yet filed

### Summary

Let a reader connect a wallet so the dashboard can show their own position
without pasting an address. The current version takes a pasted address, which is
fine for looking someone up and useless for looking yourself up.

### Acceptance Criteria

- [ ] A connect control using a well-reviewed Stellar wallet library, chosen against current official docs at implementation time
- [ ] The connected address pre-fills the existing position panel, which keeps working unchanged for pasted addresses
- [ ] Disconnect clears the address and any panel state derived from it
- [ ] The connected public address is the only thing read. No secret key, seed phrase, or signing path is added by this issue
- [ ] A visible note states that connecting is optional and read-only
- [ ] The app still refuses to run on a non-testnet network, connected or not
- [ ] Works in two browsers on desktop

### Tech Stack

React 19, Vite, a Stellar wallet connector, the existing `strata-sdk` client.

### Note

Connecting must not imply the ability to act. Claiming is a separate issue, and
signing needs its own review before it happens.

---

## 2. Deposit flow

**Labels:** `enhancement`, `needs-design`
**Complexity:** `drips:8`
**Status:** Planned, not yet filed

### Summary

Add a deposit flow: pick a tranche and an amount, review the projected payout,
then sign and submit.

### Acceptance Criteria

- [ ] Tranche selection is explicit, and the junior-first gating from `strata-contracts/docs/deployment.md` is surfaced before submission rather than as a failed transaction
- [ ] Amount input parses through the SDK's `parseAmount`; no path converts an amount to a `number`
- [ ] The projected payout comes from `project()`, and the panel states it is a projection
- [ ] The max senior ratio cap is checked client-side, and the check is explained rather than silent
- [ ] Simulate, review, then sign, with every step separately visible
- [ ] The success state shows the ledger the transaction landed in, not just "submitted"
- [ ] A failed simulation shows the contract's error code and its readable message
- [ ] Rejected signatures and expired transactions are handled with distinct messages
- [ ] No mainnet network option exists in the UI or the code path

### Tech Stack

`strata-sdk` with an added write path, a wallet connector, React.

### Note

This is the first issue that touches signing. It should not be merged without a
separate threat review.

---

## 3. Claim flow

**Labels:** `enhancement`, `needs-design`
**Complexity:** `drips:5`
**Status:** Planned, not yet filed

### Summary

Let a depositor claim a settled payout from the position panel.

### Acceptance Criteria

- [ ] The claim control appears only for a settled epoch, and says why it is absent otherwise
- [ ] Both tranches are claimable in one action, or individually, with the choice stated
- [ ] The claimed amount is shown in both display units and exact base units before signing
- [ ] A position that has already been claimed is shown as claimed, not as an empty position; the current panel cannot tell these apart and that ambiguity should go
- [ ] Success shows the resulting zeroed position and the transaction ledger
- [ ] A contract error surfaces its code and readable message

### Tech Stack

`strata-sdk` write path, React.

---

## 4. Settle button for the epoch admin

**Labels:** `enhancement`, `admin-only`, `needs-design`
**Complexity:** `drips:5`
**Status:** Planned, not yet filed

### Summary

Let the admin settle an epoch from the dashboard instead of using the CLI.

### Acceptance Criteria

- [ ] The control is shown only when the connected address matches the admin read from the contract
- [ ] The panel states that settlement is irreversible before offering the action
- [ ] The projected split at the vault's current value is shown for confirmation
- [ ] Success shows the settled payouts and refreshes the epoch panel
- [ ] A vault that reverts on settlement produces the contract's error message, not a generic failure
- [ ] There is no way to reach this from a non-admin address, client-side or otherwise

### Tech Stack

`strata-sdk` write path, React.

### Note

`strata-contracts/docs/risks.md` R8 covers a reverting vault blocking
settlement. The error surface matters here more than the happy path.

---

## 5. Epoch and event history

**Labels:** `enhancement`
**Complexity:** `drips:8`
**Status:** Planned, not yet filed

### Summary

Show past epochs and their events. The manager holds one epoch at a time, so
the dashboard currently cannot show any history at all and says so.

### Acceptance Criteria

- [ ] Each option below is decided explicitly: a contract-side history view, a backend indexer, or reading RPC history directly for the epoch ledger range
- [ ] Past epochs show status, term, rate, tranche totals, and final payouts
- [ ] Events for a chosen epoch are listed with ledger sequence and timestamp
- [ ] Each read states the ledger range it covers, so a gap in history is visible rather than silent
- [ ] A history read that is incomplete says so and names the missing range
- [ ] No payout is recomputed client-side; settled figures are read, not derived

### Tech Stack

Depends on the decision in the first acceptance criterion. A static dashboard
can read RPC history for a bounded range; a full history needs a backend.

---

## 6. Multiple-RPC fallback and cross-check

**Labels:** `enhancement`
**Complexity:** `drips:5`
**Status:** Filed as [#4](https://github.com/strata-protocol/strata-app/issues/4)

### Summary

Read from more than one RPC endpoint and compare. `docs/risks.md` A3 is the most
serious unresolved limitation in the app: every figure comes from one endpoint,
which can be stale, lagging, or hostile, and a wrong answer currently renders
exactly like a right one.

### Acceptance Criteria

- [ ] A configurable list of testnet RPC endpoints, all recorded in `docs/stack.md` with their sources
- [ ] A read queries the primary, and falls back to a secondary when the primary fails or is unreachable
- [ ] When two endpoints disagree on a value, the panel says so and shows both figures with their ledgers
- [ ] The ledger sequence of each responding endpoint is shown, so a lagging endpoint is identifiable
- [ ] Disagreement is surfaced as a warning state, never silently resolved in favour of one endpoint
- [ ] Endpoint failure remains distinct from contract-gone; a fallback must not turn a testnet reset into an RPC error
- [ ] The SDK's typed `StrataRead` results are preserved across the fallback path

### Tech Stack

`strata-sdk` client changes, React panel states.

---

## 7. Mobile and narrow-viewport layout

**Labels:** `enhancement`, `good first issue`
**Complexity:** `drips:3`
**Status:** Filed as [#5](https://github.com/strata-protocol/strata-app/issues/5)

### Summary

Make the dashboard usable on a phone. The layout is built for a wide viewport:
the epoch and position tables have six to eight columns and will not fit.

### Acceptance Criteria

- [ ] Tables collapse to a stacked or scrollable form below roughly 600px, without hiding any figure
- [ ] Every input remains reachable and operable by touch
- [ ] The projection panel's controls fit without horizontal scrolling
- [ ] No information is lost relative to the desktop layout; a figure shown on one is shown on both
- [ ] Checked on at least one narrow viewport in a real browser, at 320px and at 375px

### Tech Stack

CSS in `dashboard/src/styles.css`. No layout library is wanted.

---

## 8. End-to-end test against testnet

**Labels:** `testing`
**Complexity:** `drips:5`
**Status:** Planned, not yet filed

### Summary

Cover the dashboard's panels end to end against a live testnet deployment. The
SDK's live integration tests pass; the dashboard's own components are not
exercised against real data.

### Acceptance Criteria

- [ ] A test renders the app with a real client against testnet and asserts the epoch panel shows a status, figures, and a freshness line
- [ ] A test drives the position form with a real address that deposited in a demo epoch and asserts principal appears
- [ ] A test drives the projection panel and asserts `senior_payout + junior_payout === input`
- [ ] A test covers the "contract not found" screen using a nonexistent contract ID
- [ ] The suite is excluded from the default test run and runs from a documented command, as the SDK's live tests are
- [ ] It is not wired into the required CI checks, so a testnet reset cannot block a pull request
- [ ] Fixtures recorded from a run are committed with their capture date, as `sdk/test/fixtures/` already does

### Tech Stack

Vitest, jsdom or a headless browser, the existing live test config.

---

## 9. Code-split the dashboard bundle

**Labels:** `enhancement`, `performance`
**Complexity:** `drips:1`
**Status:** Filed as [#6](https://github.com/strata-protocol/strata-app/issues/6)

### Summary

Reduce the ~900 kB bundle (~215 kB gzipped), nearly all of it the Stellar SDK.
`docs/risks.md` A8.

### Acceptance Criteria

- [ ] Bundle size is measured before and after, with the numbers recorded
- [ ] A real reduction is achieved, not only a moved warning threshold
- [ ] All panels still render real data
- [ ] No behaviour changes

### Tech Stack

Vite build configuration, dynamic import.

---

## 10. Snapshot script for CI diagnostics

**Labels:** `enhancement`, `good first issue`
**Complexity:** `drips:1`
**Status:** Filed as [#7](https://github.com/strata-protocol/strata-app/issues/7)

### Summary

`scripts/snapshot-epoch.ts` prints epoch state and a position to the terminal.
Make it easy to attach that output to a bug report.

### Acceptance Criteria

- [ ] The script accepts `--json` and prints one machine-readable object
- [ ] The output includes the ledger sequence and the RPC endpoint it read from
- [ ] Every read's failure kind is represented in the JSON, not only the successful values
- [ ] A short README section shows the command to run and where the output belongs in an issue

### Tech Stack

`tsx`, the existing `strata-sdk` client.

---

## 11. Per-panel staleness indicator

**Labels:** `enhancement`
**Complexity:** `drips:1`
**Status:** Filed as [#8](https://github.com/strata-protocol/strata-app/issues/8)

### Summary

Panels show the ledger and fetch time of their own read, but nothing marks a
panel as noticeably old. `docs/risks.md` A2.

### Acceptance Criteria

- [ ] A panel whose data is older than a stated threshold is visibly marked as stale
- [ ] The threshold is in seconds and is configurable
- [ ] A refreshed panel clears the mark
- [ ] The mark does not rely on colour alone, so it survives a monochrome or high-contrast display
- [ ] The refresh button refreshes every panel in one click

### Tech Stack

React, CSS.

---

## 12. Keyboard and screen-reader pass

**Labels:** `enhancement`, `accessibility`, `good first issue`
**Complexity:** `drips:3`
**Status:** Filed as [#9](https://github.com/strata-protocol/strata-app/issues/9)

### Summary

Audit the dashboard properly. The current build has labelled inputs, semantic
tables with scoped headers, live regions for status, and visible focus, but it
has not been tested with a screen reader.

### Acceptance Criteria

- [ ] Every control is reachable and operable by keyboard, with visible focus at each stop
- [ ] Each failure state is announced, since they currently differ only visually in places
- [ ] The projection panel's radio group announces its selected option
- [ ] Tables are navigable by row and column headers with a screen reader
- [ ] Colour contrast meets WCAG AA for body text, muted text, and every state colour against its background
- [ ] Findings are recorded, including anything checked and found acceptable

### Tech Stack

No new dependencies wanted.
