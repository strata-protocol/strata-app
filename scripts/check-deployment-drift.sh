#!/usr/bin/env bash
#
# Deployment drift check. Thin wrapper around check-deployment-drift.ts so the
# workflow and the docs have the shell entry point the repo layout promises.
#
# UNAUDITED TESTNET SOFTWARE.
#
# Exit codes are the interface:
#   0 no drift
#   1 the check could not run
#   2 a pinned contract is not on testnet (likely a reset)
#   3 drift (a contract ID or Wasm hash does not match the pin)
#
# Usage: npm run check:drift

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tsx="$root/node_modules/.bin/tsx"

if [ ! -x "$tsx" ]; then
  echo "error: $tsx not found. Run 'npm ci' first." >&2
  exit 1
fi

cd "$root/scripts"
exec "$tsx" check-deployment-drift.ts "$@"
