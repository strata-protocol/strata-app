/**
 * Epoch snapshot.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds.
 *
 * Prints the current epoch's state, the freshness of the read, and — if asked
 * for an account — that account's position in each tranche. Read-only: it
 * simulates calls through the SDK and prints. It never signs or submits.
 *
 * Usage:
 *   npm run snapshot
 *   npm run snapshot -- --account GAS6OUIK657OS6DY47DDFTXJNE3DZBUUSS5ZSCQAVFW6D6UXSBMWNVXK
 *   npm run snapshot -- --json
 *
 * Amounts are i128 base units. They are formatted with `formatAmount`, which
 * never uses floating point. The decimals come from the pinned deployment
 * file (and are verifiable on-chain with the SDK's `tokenDecimals` read).
 */

import {
  TRANCHE_JUNIOR,
  TRANCHE_SENIOR,
  createStrataClient,
  formatAmount,
  pinnedDeployment,
  pinnedNetworkConfig,
  type Epoch,
  type StrataRead,
  type Tranche,
} from 'strata-sdk';

interface Options {
  readonly account: string | null;
  readonly json: boolean;
}

function parseArgs(argv: readonly string[]): Options {
  let account: string | null = null;
  let json = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }
    if (arg === '--account') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new Error('--account needs an address');
      }
      account = value;
      i += 1;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('usage: snapshot-epoch [--account <address>] [--json]');
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      // A bare positional address, so `npm run snapshot -- <address>` works.
      if (account !== null) {
        throw new Error(`unexpected extra argument: ${arg}`);
      }
      account = arg;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { account, json };
}

function line(label: string, value: string): string {
  return `${label.padEnd(24)}${value}`;
}

function describeRead<T>(read: StrataRead<T>, format: (value: T) => string): string {
  switch (read.kind) {
    case 'ok':
      return format(read.value);
    case 'archived':
      return `ARCHIVED — ${read.message}`;
    case 'not-found':
      return `NOT FOUND — ${read.message}`;
    case 'contract-error':
      return `CONTRACT ERROR (${read.code ?? '?'}) — ${read.message}`;
    case 'rpc-error':
      return `RPC ERROR — ${read.message}`;
  }
}

function statusLabel(epoch: Epoch): string {
  return epoch.status.tag;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const decimals = pinnedNetworkConfig().tokenDecimals;
  const amount = (value: bigint): string =>
    `${formatAmount(value, decimals, { trimTrailingZeros: true, group: true })} (${value} base units)`;

  const client = createStrataClient();

  const [epochRead, configRead, decimalsRead] = await Promise.all([
    client.currentEpoch(),
    client.managerConfig(),
    client.tokenDecimals(),
  ]);

  const snapshot: Record<string, unknown> = {
    network: pinnedDeployment.network,
    networkPassphrase: pinnedDeployment.network_passphrase,
    rpcUrl: client.config.rpcUrl,
    managerId: client.config.managerId,
    pinnedFrom: {
      repo: pinnedDeployment.pinned_from.repo,
      commit: pinnedDeployment.pinned_from.commit,
      copiedAtUtc: pinnedDeployment.pinned_from.copied_at_utc,
    },
    read: {
      kind: epochRead.kind,
      ledger: epochRead.ledger,
      fetchedAt: epochRead.fetchedAt,
    },
    tokenDecimals: decimalsRead.kind === 'ok' ? decimalsRead.value : null,
  };

  if (epochRead.kind === 'ok' && epochRead.value !== null) {
    const epoch = epochRead.value;
    snapshot['epoch'] = {
      status: statusLabel(epoch),
      startTs: epoch.start_ts.toString(),
      maturityTs: epoch.maturity_ts.toString(),
      termSeconds: epoch.term_seconds.toString(),
      rateBps: epoch.rate_bps,
      maxSeniorRatioBps: epoch.max_senior_ratio_bps,
      seniorTotal: epoch.senior_total.toString(),
      juniorTotal: epoch.junior_total.toString(),
      vaultShares: epoch.vault_shares.toString(),
      valueRedeemed: epoch.value_redeemed.toString(),
      seniorPayout: epoch.senior_payout.toString(),
      juniorPayout: epoch.junior_payout.toString(),
      seniorUnclaimed: epoch.senior_unclaimed.toString(),
      juniorUnclaimed: epoch.junior_unclaimed.toString(),
    };
  }

  if (options.account !== null) {
    const positions: Record<string, unknown> = {};
    for (const tranche of [TRANCHE_SENIOR, TRANCHE_JUNIOR] as Tranche[]) {
      const read = await client.position(options.account, tranche);
      positions[tranche.tag] =
        read.kind === 'ok'
          ? {
              principal: read.value.principal.toString(),
              estimatedPayout: read.value.estimated_payout.toString(),
            }
          : { kind: read.kind, message: 'message' in read ? read.message : '' };
    }
    snapshot['positions'] = { who: options.account, ...positions };
  }

  if (options.json) {
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  console.log('Strata epoch snapshot — UNAUDITED TESTNET SOFTWARE');
  console.log(line('Network', String(snapshot['network'])));
  console.log(line('RPC', client.config.rpcUrl));
  console.log(line('Manager', client.config.managerId));
  console.log(
    line(
      'Pinned from',
      `${pinnedDeployment.pinned_from.repo}@${pinnedDeployment.pinned_from.commit.slice(0, 12)}`,
    ),
  );
  console.log(line('Read ledger', String(epochRead.ledger ?? 'unknown')));
  console.log(line('Fetched at', epochRead.fetchedAt));
  console.log(
    line(
      'Token decimals',
      decimalsRead.kind === 'ok' ? String(decimalsRead.value) : `unreadable (${decimalsRead.kind})`,
    ),
  );
  if (configRead.kind === 'ok') {
    console.log(line('Admin', configRead.value.admin));
    console.log(line('Vault', configRead.value.vault));
    console.log(line('Underlying token', configRead.value.asset));
  }
  console.log('');

  if (epochRead.kind !== 'ok') {
    console.log(`Epoch: ${describeRead(epochRead, () => '')}`);
  } else if (epochRead.value === null) {
    console.log('Epoch: none open');
  } else {
    const epoch = epochRead.value;
    console.log(`Epoch: ${statusLabel(epoch)}`);
    console.log(line('  Term', `${epoch.term_seconds} s`));
    console.log(line('  Senior rate', `${epoch.rate_bps} bps/yr`));
    console.log(line('  Max senior ratio', `${epoch.max_senior_ratio_bps} bps`));
    console.log(line('  Senior total', amount(epoch.senior_total)));
    console.log(line('  Junior total', amount(epoch.junior_total)));
    console.log(line('  Value redeemed', amount(epoch.value_redeemed)));
    console.log(line('  Senior payout', amount(epoch.senior_payout)));
    console.log(line('  Junior payout', amount(epoch.junior_payout)));
    console.log(line('  Vault shares', epoch.vault_shares.toString()));
  }
  console.log('');

  if (options.account !== null) {
    console.log(`Positions for ${options.account}`);
    for (const tranche of [TRANCHE_SENIOR, TRANCHE_JUNIOR] as Tranche[]) {
      const read = await client.position(options.account, tranche);
      const label = `  ${tranche.tag}`;
      if (read.kind === 'ok') {
        console.log(
          line(
            label,
            `principal ${amount(read.value.principal)} / estimated ${amount(read.value.estimated_payout)}`,
          ),
        );
      } else {
        console.log(
          line(
            label,
            describeRead(read, () => ''),
          ),
        );
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(`snapshot failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
