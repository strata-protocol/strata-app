#!/usr/bin/env bash
#
# Regenerate the TypeScript bindings in sdk/src/generated from the deployed
# epoch-manager contract.
#
# UNAUDITED TESTNET SOFTWARE.
#
# What it does
#   1. Reads the contract ID, wasm hash and network details from the pinned
#      deployment file. The script contains no contract ID of its own.
#   2. Asks the Stellar JS SDK's generator to read the contract's specification
#      over Soroban RPC and emit a typed client.
#   3. Prepends a provenance header to each generated file, so a reader of the
#      committed output can see which contract and which contracts-repo commit
#      produced it without running anything.
#   4. Copies only the TypeScript sources into sdk/src/generated.
#
# Why the JS SDK generator and not `stellar contract bindings typescript`
#   Stellar CLI 28.1.0 marks its TypeScript bindings subcommand as deprecated
#   and points at the JS SDK CLI instead:
#
#     $ stellar contract bindings typescript --help
#     ⚠️ Deprecated, use the JavaScript Stellar SDK instead
#        (https://github.com/stellar/js-stellar-sdk#cli)
#
#   The generator below is that replacement. `stellar contract bindings
#   typescript` still works at 28.1.0 and is the fallback if the JS CLI is ever
#   unavailable.
#
# This script needs the network. It is not a CI job. The generated output is
# committed, so a build never regenerates it.
#
# Usage: npm run generate:sdk

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

deployment="sdk/src/deployments.testnet.json"
if [ ! -f "$deployment" ]; then
  echo "error: $deployment is missing, so there is nothing to generate from." >&2
  exit 1
fi

# Read one dotted path out of the pinned deployment file. Node does the reading
# so the script needs no jq, and the contract ID never appears in this file.
pinned() {
  node -e '
    const fs = require("fs");
    const doc = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const value = process.argv[2].split(".").reduce((o, k) => o[k], doc);
    process.stdout.write(String(value));
  ' "$deployment" "$1"
}

manager_id="$(pinned contracts.epoch_manager.contract_id)"
manager_wasm_sha="$(pinned contracts.epoch_manager.wasm_sha256)"
network="$(pinned network)"
passphrase="$(pinned network_passphrase)"
rpc_url="$(pinned rpc_url)"
source_repo="$(pinned pinned_from.repo)"
source_commit="$(pinned pinned_from.commit)"
soroban_sdk_version="$(pinned soroban_sdk_version)"
deployed_at="$(pinned deployed_at_utc)"
contract_name="epoch-manager"
out_dir="sdk/src/generated"

generator_bin="node_modules/.bin/stellar-js"
if [ ! -x "$generator_bin" ]; then
  echo "error: $generator_bin not found. Run 'npm ci' first." >&2
  exit 1
fi

# The package's `exports` map does not expose ./package.json, so require() of it
# throws ERR_PACKAGE_PATH_NOT_EXPORTED. Read the file off disk instead.
generator_version="$(
  node -e '
    const fs = require("fs");
    const path = "node_modules/@stellar/stellar-sdk/package.json";
    process.stdout.write(JSON.parse(fs.readFileSync(path, "utf8")).version);
  '
)"

# A scratch directory inside the repository, so the path handed to the
# generator is relative and needs no platform-specific conversion. Removed on
# every exit path, including failure.
scratch=".generate-sdk-scratch"
rm -rf "$scratch"
trap 'rm -rf "$scratch"' EXIT

echo "Generating bindings for $contract_name"
echo "  contract id : $manager_id"
echo "  network     : $network ($passphrase)"
echo "  rpc         : $rpc_url"
echo "  generator   : @stellar/stellar-sdk@$generator_version"
echo

# `--network` supplies the passphrase the generator signs its read-only
# simulation with; `--rpc-url` pins the endpoint to the one recorded in the
# pinned deployment file rather than letting the generator choose.
"$generator_bin" generate \
  --contract-id "$manager_id" \
  --network "$network" \
  --rpc-url "$rpc_url" \
  --contract-name "$contract_name" \
  --output-dir "$scratch" \
  --overwrite

if [ ! -d "$scratch/src" ]; then
  echo "error: the generator produced no $scratch/src directory." >&2
  exit 1
fi

header_file="$scratch/header.txt"
cat >"$header_file" <<EOF
/*
 * GENERATED FILE - DO NOT EDIT BY HAND.
 *
 * Regenerate with: npm run generate:sdk
 *
 * Source contract : $contract_name ($network)
 * Contract ID     : $manager_id
 * Wasm sha256     : $manager_wasm_sha
 * Network         : $network - $passphrase
 * RPC endpoint    : $rpc_url
 *
 * Source repo     : $source_repo
 * Source commit   : $source_commit
 * Deployed at     : $deployed_at
 * soroban-sdk     : $soroban_sdk_version
 * Generator       : @stellar/stellar-sdk@$generator_version (stellar-js generate)
 *
 * Amounts in this file are i128 values in the token's smallest unit and are
 * typed bigint. Never convert one to a number.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 */
EOF

mkdir -p "$out_dir"
rm -f "$out_dir"/*.ts

count=0
for generated in "$scratch"/src/*.ts; do
  [ -e "$generated" ] || continue
  name="$(basename "$generated")"
  cat "$header_file" "$generated" >"$out_dir/$name"
  echo "  wrote $out_dir/$name"
  count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
  echo "error: the generator produced no TypeScript files." >&2
  exit 1
fi

echo
echo "Wrote $count file(s) to $out_dir."
