/**
 * Deployment drift check.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * Answers one question: is the deployment this app is pinned to still the
 * deployment that is on testnet? It checks, in order:
 *
 *   1. The generated bindings header still names the pinned manager contract.
 *      (Offline; catches "someone regenerated the bindings from a different
 *      deployment and did not re-pin the deployment file".)
 *   2. Each pinned contract still exists on testnet.
 *   3. Its on-chain Wasm sha256 still matches the pinned `wasm_sha256`.
 *
 * Exit codes are the interface (a workflow branches on them):
 *   0  no drift
 *   1  the check could not run (bad input, RPC unreachable, missing file)
 *   2  a pinned contract is not found (most likely a testnet reset)
 *   3  drift: a contract ID or Wasm hash does not match the pin
 *
 * It never writes. Run it from the repo root with `npm run check:drift`.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createStrataClient, describeUnknownError, pinnedDeployment } from 'strata-sdk';

const GENERATED_HEADER = fileURLToPath(new URL('../sdk/src/generated/client.ts', import.meta.url));

export const EXIT_OK = 0;
export const EXIT_UNRUNNABLE = 1;
export const EXIT_NOT_FOUND = 2;
export const EXIT_DRIFT = 3;

interface Finding {
  readonly kind: 'drift' | 'not-found';
  readonly subject: string;
  readonly detail: string;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function isMissingContract(error: unknown): boolean {
  // The RPC client error is a plain object `{ code, message }`, not an Error.
  if (error !== null && typeof error === 'object' && 'code' in error) {
    if ((error as { code?: unknown }).code === 404) {
      return true;
    }
  }
  const message = describeUnknownError(error);
  return /could not obtain contract|not found|does not exist|could not find|missing|non-existing value|no such contract/i.test(
    message,
  );
}

function checkGeneratedHeader(managerId: string, wasmSha: string): Finding | null {
  let header: string;
  try {
    header = readFileSync(GENERATED_HEADER, 'utf8');
  } catch {
    return {
      kind: 'drift',
      subject: 'generated bindings',
      detail: `the generated bindings are missing (${GENERATED_HEADER}); run \`npm run generate:sdk\`.`,
    };
  }

  if (!header.includes(managerId)) {
    return {
      kind: 'drift',
      subject: 'generated bindings',
      detail: `the generated header does not name the pinned manager ${managerId}. The bindings and the pinned deployment disagree.`,
    };
  }
  if (!header.includes(wasmSha)) {
    return {
      kind: 'drift',
      subject: 'generated bindings',
      detail: `the generated header does not carry the pinned Wasm hash ${wasmSha}.`,
    };
  }
  return null;
}

async function checkContract(
  client: ReturnType<typeof createStrataClient>,
  label: string,
  contractId: string,
  expectedWasmSha256: string,
): Promise<Finding | null> {
  let wasm: Uint8Array;
  try {
    wasm = await client.server.getContractWasmByContractId(contractId);
  } catch (error) {
    if (isMissingContract(error)) {
      return {
        kind: 'not-found',
        subject: label,
        detail: `${contractId} is not on testnet. This is what a testnet reset looks like.`,
      };
    }
    throw error;
  }

  const actual = sha256Hex(wasm);
  if (actual !== expectedWasmSha256) {
    return {
      kind: 'drift',
      subject: label,
      detail: `on-chain Wasm sha256 is ${actual} but the pin says ${expectedWasmSha256}.`,
    };
  }
  return null;
}

async function main(): Promise<number> {
  const manager = pinnedDeployment.contracts.epoch_manager;
  const vault = pinnedDeployment.contracts.mock_vault;

  console.log(`Drift check — ${pinnedDeployment.network}`);
  console.log(
    `  pinned from ${pinnedDeployment.pinned_from.repo}@${pinnedDeployment.pinned_from.commit}`,
  );
  console.log(`  copied at   ${pinnedDeployment.pinned_from.copied_at_utc}`);
  console.log('');

  const findings: Finding[] = [];

  const headerFinding = checkGeneratedHeader(manager.contract_id, manager.wasm_sha256);
  if (headerFinding !== null) {
    findings.push(headerFinding);
  } else {
    console.log('OK   generated bindings header names the pinned manager and Wasm hash');
  }

  const client = createStrataClient();

  for (const [label, contract] of [
    ['epoch-manager', manager],
    ['mock-vault', vault],
  ] as const) {
    const finding = await checkContract(client, label, contract.contract_id, contract.wasm_sha256);
    if (finding !== null) {
      findings.push(finding);
      console.log(`BAD  ${label}: ${finding.detail}`);
    } else {
      console.log(`OK   ${label} ${contract.contract_id} matches wasm ${contract.wasm_sha256}`);
    }
  }

  console.log('');

  const drift = findings.filter((f) => f.kind === 'drift');
  const missing = findings.filter((f) => f.kind === 'not-found');

  if (drift.length > 0) {
    console.error(
      `DRIFT: ${drift.length} mismatch(es). Re-pin sdk/src/deployments.testnet.json (and regenerate the bindings).`,
    );
    return EXIT_DRIFT;
  }
  if (missing.length > 0) {
    console.error(
      `NOT FOUND: ${missing.length} pinned contract(s) are gone. Testnet may have been reset; re-deploy and re-pin.`,
    );
    return EXIT_NOT_FOUND;
  }

  console.log('No drift.');
  return EXIT_OK;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(`drift check could not run: ${describeUnknownError(error)}`);
    process.exitCode = EXIT_UNRUNNABLE;
  });
