#!/usr/bin/env bash
#
# create-issues.sh — file the drafted issues in docs/planned-issues.md.
#
# UNAUDITED TESTNET SOFTWARE. This script only talks to GitHub; it touches no
# chain and no secret.
#
# The 12 drafts in docs/planned-issues.md are embedded below, verbatim in
# substance, so this script files them in one run without parsing Markdown.
#
# Usage:
#   bash scripts/create-issues.sh --dry-run
#   bash scripts/create-issues.sh --repo ORG/REPO
#   bash scripts/create-issues.sh            # repo detected from gh
#
# Flags:
#   --dry-run        print what would be created; make no change
#   --repo ORG/REPO  target repository (default: gh's current repository)
#   -h, --help       this text
#
# Behaviour:
#   - checks that gh is installed and, when creating, authenticated
#   - creates any missing label and never overwrites an existing one
#   - skips any issue whose title already exists (any state)
#
# Written for macOS bash 3.2: no associative arrays, no mapfile. Bodies use
# `read -r -d '' VAR <<'EOF' || true`, which is the portable form.

set -euo pipefail

DRY_RUN=0
REPO=""

usage() {
  sed -n '2,28p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --repo)
      shift
      REPO="${1:-}"
      if [ -z "$REPO" ]; then
        echo "error: --repo needs ORG/REPO" >&2
        exit 2
      fi
      ;;
    --repo=*)
      REPO="${1#*=}"
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

# --- preconditions ----------------------------------------------------------

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh (GitHub CLI) is not installed or not on PATH." >&2
  exit 1
fi

if [ "$DRY_RUN" -eq 0 ]; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh is not authenticated. Run 'gh auth login' first." >&2
    exit 1
  fi
fi

if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
fi

if [ -z "$REPO" ]; then
  echo "error: could not determine the target repository." >&2
  echo "       pass --repo ORG/REPO explicitly." >&2
  exit 1
fi

echo "repository: $REPO"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "mode:       dry run (nothing will be created)"
fi
echo

# --- labels -----------------------------------------------------------------

# Every label the drafts use, plus the Wave complexity labels. Colours and
# descriptions are local choices; only the names matter to the drafts.
LABEL_NAMES="enhancement|needs-design|admin-only|good first issue|testing|performance|accessibility|drips:1|drips:3|drips:5|drips:8"
LABEL_COLORS="a2eeef|d4c5f9|b60205|7057ff|fbca04|0e8a16|1d76db|c2e0c6|bfd4f2|fef2c0|f9d0c4"
LABEL_DESCS="a new feature or an improvement|needs a maintainer decision before it can be built|touches admin-gated behaviour|small, self-contained, with a clear finish line|tests, fixtures, or test infrastructure|bundle size, load time, or render cost|keyboard, screen-reader, or contrast work|very small: under an hour|small: half a day|medium: a day|large: more than a day, or needs a design decision first"

EXISTING_LABELS=""
if [ "$DRY_RUN" -eq 0 ]; then
  EXISTING_LABELS="$(gh label list --repo "$REPO" --limit 200 --json name -q '.[].name' 2>/dev/null || true)"
fi

# Parallel arrays: bash 3.2 has no associative arrays. The lists are
# `|`-delimited so a label name containing spaces ("good first issue") survives.
OLD_IFS="$IFS"
IFS='|'
set -- $LABEL_NAMES
LABEL_NAME_ARR=("$@")
set -- $LABEL_COLORS
LABEL_COLOR_ARR=("$@")
set -- $LABEL_DESCS
LABEL_DESC_ARR=("$@")
IFS="$OLD_IFS"

i=0
while [ "$i" -lt "${#LABEL_NAME_ARR[@]}" ]; do
  name="${LABEL_NAME_ARR[$i]}"
  color="${LABEL_COLOR_ARR[$i]}"
  desc="${LABEL_DESC_ARR[$i]}"
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] would ensure label: $name"
  elif printf '%s\n' "$EXISTING_LABELS" | grep -Fxq -- "$name"; then
    echo "label exists: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" >/dev/null
    echo "created label: $name"
  fi
  i=$((i + 1))
done
echo

# --- issues -----------------------------------------------------------------

EXISTING_TITLES=""
if [ "$DRY_RUN" -eq 0 ]; then
  EXISTING_TITLES="$(gh issue list --repo "$REPO" --state all --limit 500 --json title -q '.[].title' 2>/dev/null || true)"
fi

CREATED=0
SKIPPED=0

# create_issue TITLE LABELS COMPLEXITY DRIPS BODY
# LABELS is comma-separated and must not include the drips label; it is added.
create_issue() {
  title="$1"
  labels="$2"
  complexity="$3"
  drips="$4"
  body="$5"
  all_labels="$labels,$drips"

  full_body="$body

## Suggested Wave complexity

Suggested: **$complexity** (\`$drips\`).

## Ground rules

- Testnet only. No mainnet path, in this issue or anywhere.
- No secret keys, seeds, or wallet code in this repository.
- Comment on this issue before you start, so two people do not do the same work.
- Read \`CONTRIBUTING.md\` first."

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] would create: $title"
    echo "            labels:     $all_labels"
    echo "            complexity: $complexity ($drips)"
    CREATED=$((CREATED + 1))
    return 0
  fi

  if printf '%s\n' "$EXISTING_TITLES" | grep -Fxq -- "$title"; then
    echo "skip (title already exists): $title"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  url="$(gh issue create --repo "$REPO" --title "$title" --body "$full_body" --label "$all_labels")"
  echo "created: $title"
  echo "         $url"
  CREATED=$((CREATED + 1))
}

# 1 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Let a reader connect a wallet so the dashboard can show their own position
without pasting an address. The current version takes a pasted address, which is
fine for looking someone up and useless for looking yourself up.

## Acceptance Criteria

- [ ] A connect control using a well-reviewed Stellar wallet library, chosen against current official docs at implementation time
- [ ] The connected address pre-fills the existing position panel, which keeps working unchanged for pasted addresses
- [ ] Disconnect clears the address and any panel state derived from it
- [ ] The connected public address is the only thing read. No secret key, seed phrase, or signing path is added by this issue
- [ ] A visible note states that connecting is optional and read-only
- [ ] The app still refuses to run on a non-testnet network, connected or not
- [ ] Works in two browsers on desktop

## Tech Stack

React 19, Vite, a Stellar wallet connector, the existing `strata-sdk` client.

## Note

Connecting must not imply the ability to act. Claiming is a separate issue, and
signing needs its own review before it happens.
EOF
create_issue \
  "Connect a wallet to the dashboard" \
  "enhancement,needs-design" \
  "High" "drips:8" \
  "$body"

# 2 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Add a deposit flow: pick a tranche and an amount, review the projected payout,
then sign and submit.

## Acceptance Criteria

- [ ] Tranche selection is explicit, and the junior-first gating from `strata-contracts/docs/deployment.md` is surfaced before submission rather than as a failed transaction
- [ ] Amount input parses through the SDK's `parseAmount`; no path converts an amount to a `number`
- [ ] The projected payout comes from `project()`, and the panel states it is a projection
- [ ] The max senior ratio cap is checked client-side, and the check is explained rather than silent
- [ ] Simulate, review, then sign, with every step separately visible
- [ ] The success state shows the ledger the transaction landed in, not just "submitted"
- [ ] A failed simulation shows the contract's error code and its readable message
- [ ] Rejected signatures and expired transactions are handled with distinct messages
- [ ] No mainnet network option exists in the UI or the code path

## Tech Stack

`strata-sdk` with an added write path, a wallet connector, React.

## Note

This is the first issue that touches signing. It should not be merged without a
separate threat review.
EOF
create_issue \
  "Deposit flow" \
  "enhancement,needs-design" \
  "High" "drips:8" \
  "$body"

# 3 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Let a depositor claim a settled payout from the position panel.

## Acceptance Criteria

- [ ] The claim control appears only for a settled epoch, and says why it is absent otherwise
- [ ] Both tranches are claimable in one action, or individually, with the choice stated
- [ ] The claimed amount is shown in both display units and exact base units before signing
- [ ] A position that has already been claimed is shown as claimed, not as an empty position; the current panel cannot tell these apart and that ambiguity should go
- [ ] Success shows the resulting zeroed position and the transaction ledger
- [ ] A contract error surfaces its code and readable message

## Tech Stack

`strata-sdk` write path, React.
EOF
create_issue \
  "Claim flow" \
  "enhancement,needs-design" \
  "Medium" "drips:5" \
  "$body"

# 4 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Let the admin settle an epoch from the dashboard instead of using the CLI.

## Acceptance Criteria

- [ ] The control is shown only when the connected address matches the admin read from the contract
- [ ] The panel states that settlement is irreversible before offering the action
- [ ] The projected split at the vault's current value is shown for confirmation
- [ ] Success shows the settled payouts and refreshes the epoch panel
- [ ] A vault that reverts on settlement produces the contract's error message, not a generic failure
- [ ] There is no way to reach this from a non-admin address, client-side or otherwise

## Tech Stack

`strata-sdk` write path, React.

## Note

`strata-contracts/docs/risks.md` R8 covers a reverting vault blocking
settlement. The error surface matters here more than the happy path.
EOF
create_issue \
  "Settle button for the epoch admin" \
  "enhancement,admin-only,needs-design" \
  "Medium" "drips:5" \
  "$body"

# 5 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Show past epochs and their events. The manager holds one epoch at a time, so
the dashboard currently cannot show any history at all and says so.

## Acceptance Criteria

- [ ] Each option below is decided explicitly: a contract-side history view, a backend indexer, or reading RPC history directly for the epoch ledger range
- [ ] Past epochs show status, term, rate, tranche totals, and final payouts
- [ ] Events for a chosen epoch are listed with ledger sequence and timestamp
- [ ] Each read states the ledger range it covers, so a gap in history is visible rather than silent
- [ ] A history read that is incomplete says so and names the missing range
- [ ] No payout is recomputed client-side; settled figures are read, not derived

## Tech Stack

Depends on the decision in the first acceptance criterion. A static dashboard
can read RPC history for a bounded range; a full history needs a backend.
EOF
create_issue \
  "Epoch and event history" \
  "enhancement" \
  "High" "drips:8" \
  "$body"

# 6 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Read from more than one RPC endpoint and compare. `docs/risks.md` A3 is the most
serious unresolved limitation in the app: every figure comes from one endpoint,
which can be stale, lagging, or hostile, and a wrong answer currently renders
exactly like a right one.

## Acceptance Criteria

- [ ] A configurable list of testnet RPC endpoints, all recorded in `docs/stack.md` with their sources
- [ ] A read queries the primary, and falls back to a secondary when the primary fails or is unreachable
- [ ] When two endpoints disagree on a value, the panel says so and shows both figures with their ledgers
- [ ] The ledger sequence of each responding endpoint is shown, so a lagging endpoint is identifiable
- [ ] Disagreement is surfaced as a warning state, never silently resolved in favour of one endpoint
- [ ] Endpoint failure remains distinct from contract-gone; a fallback must not turn a testnet reset into an RPC error
- [ ] The SDK's typed `StrataRead` results are preserved across the fallback path

## Tech Stack

`strata-sdk` client changes, React panel states.
EOF
create_issue \
  "Multiple-RPC fallback and cross-check" \
  "enhancement" \
  "Medium" "drips:5" \
  "$body"

# 7 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Make the dashboard usable on a phone. The layout is built for a wide viewport:
the epoch and position tables have six to eight columns and will not fit.

## Acceptance Criteria

- [ ] Tables collapse to a stacked or scrollable form below roughly 600px, without hiding any figure
- [ ] Every input remains reachable and operable by touch
- [ ] The projection panel's controls fit without horizontal scrolling
- [ ] No information is lost relative to the desktop layout; a figure shown on one is shown on both
- [ ] Checked on at least one narrow viewport in a real browser, at 320px and at 375px

## Tech Stack

CSS in `dashboard/src/styles.css`. No layout library is wanted.
EOF
create_issue \
  "Mobile and narrow-viewport layout" \
  "enhancement,good first issue" \
  "Medium" "drips:3" \
  "$body"

# 8 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Cover the dashboard's panels end to end against a live testnet deployment. The
SDK's live integration tests pass; the dashboard's own components are not
exercised against real data.

## Acceptance Criteria

- [ ] A test renders the app with a real client against testnet and asserts the epoch panel shows a status, figures, and a freshness line
- [ ] A test drives the position form with a real address that deposited in a demo epoch and asserts principal appears
- [ ] A test drives the projection panel and asserts `senior_payout + junior_payout === input`
- [ ] A test covers the "contract not found" screen using a nonexistent contract ID
- [ ] The suite is excluded from the default test run and runs from a documented command, as the SDK's live tests are
- [ ] It is not wired into the required CI checks, so a testnet reset cannot block a pull request
- [ ] Fixtures recorded from a run are committed with their capture date, as `sdk/test/fixtures/` already does

## Tech Stack

Vitest, jsdom or a headless browser, the existing live test config.
EOF
create_issue \
  "End-to-end test against testnet" \
  "testing" \
  "Medium" "drips:5" \
  "$body"

# 9 ---------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Reduce the ~900 kB bundle (~215 kB gzipped), nearly all of it the Stellar SDK.
`docs/risks.md` A8.

## Acceptance Criteria

- [ ] Bundle size is measured before and after, with the numbers recorded
- [ ] A real reduction is achieved, not only a moved warning threshold
- [ ] All panels still render real data
- [ ] No behaviour changes

## Tech Stack

Vite build configuration, dynamic import.
EOF
create_issue \
  "Code-split the dashboard bundle" \
  "enhancement,performance" \
  "Trivial" "drips:1" \
  "$body"

# 10 --------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

`scripts/snapshot-epoch.ts` prints epoch state and a position to the terminal.
Make it easy to attach that output to a bug report.

## Acceptance Criteria

- [ ] The script accepts `--json` and prints one machine-readable object
- [ ] The output includes the ledger sequence and the RPC endpoint it read from
- [ ] Every read's failure kind is represented in the JSON, not only the successful values
- [ ] A short README section shows the command to run and where the output belongs in an issue

## Tech Stack

`tsx`, the existing `strata-sdk` client.
EOF
create_issue \
  "Snapshot script for CI diagnostics" \
  "enhancement,good first issue" \
  "Trivial" "drips:1" \
  "$body"

# 11 --------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Panels show the ledger and fetch time of their own read, but nothing marks a
panel as noticeably old. `docs/risks.md` A2.

## Acceptance Criteria

- [ ] A panel whose data is older than a stated threshold is visibly marked as stale
- [ ] The threshold is in seconds and is configurable
- [ ] A refreshed panel clears the mark
- [ ] The mark does not rely on colour alone, so it survives a monochrome or high-contrast display
- [ ] The refresh button refreshes every panel in one click

## Tech Stack

React, CSS.
EOF
create_issue \
  "Per-panel staleness indicator" \
  "enhancement" \
  "Trivial" "drips:1" \
  "$body"

# 12 --------------------------------------------------------------------------
read -r -d '' body <<'EOF' || true
## Summary

Audit the dashboard properly. The current build has labelled inputs, semantic
tables with scoped headers, live regions for status, and visible focus, but it
has not been tested with a screen reader.

## Acceptance Criteria

- [ ] Every control is reachable and operable by keyboard, with visible focus at each stop
- [ ] Each failure state is announced, since they currently differ only visually in places
- [ ] The projection panel's radio group announces its selected option
- [ ] Tables are navigable by row and column headers with a screen reader
- [ ] Colour contrast meets WCAG AA for body text, muted text, and every state colour against its background
- [ ] Findings are recorded, including anything checked and found acceptable

## Tech Stack

No new dependencies wanted.
EOF
create_issue \
  "Keyboard and screen-reader pass" \
  "enhancement,accessibility,good first issue" \
  "Medium" "drips:3" \
  "$body"

echo
if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry run: would file $CREATED issue(s)."
else
  echo "created $CREATED issue(s), skipped $SKIPPED."
fi
