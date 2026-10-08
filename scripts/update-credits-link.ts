#!/usr/bin/env node
/**
 * Replace the OWNER placeholder in README.md with the owner from this
 * repository's `origin` remote.
 *
 * UNAUDITED TESTNET SOFTWARE.
 *
 * Why this exists: the GitHub owner is being changed, so no file in this
 * repository hardcodes it. README.md therefore carries a `OWNER` placeholder
 * in the two links that genuinely need it — the contributors graph and the
 * contributor image — and this script fills them in from the real remote.
 *
 * It is a maintainer convenience, not a build step. Nothing in CI runs it, and
 * the app builds and tests fine with the placeholder still in place.
 *
 * Usage:
 *   npm run credits:link          # rewrite README.md in place
 *   npm run credits:link -- --check   # report what would change, write nothing
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const checkOnly = process.argv.includes('--check');
const readmePath = fileURLToPath(new URL('../README.md', import.meta.url));

/**
 * Read the owner and repository name from `git remote get-url origin`, so the
 * value comes from the checkout rather than from anything written by hand.
 * Handles both SSH and HTTPS remotes.
 */
function ownerAndRepo(): { owner: string; repo: string } {
  let url: string;
  try {
    url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    throw new Error('no `origin` remote found; cannot derive the owner');
  }

  // git@github.com:owner/repo.git  and  https://github.com/owner/repo.git
  const match = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(url);
  const [, owner, repo] = match ?? [];
  if (owner === undefined || repo === undefined) {
    throw new Error(`could not read an owner and repository from the origin remote: ${url}`);
  }
  return { owner, repo };
}

const { owner, repo } = ownerAndRepo();
const readme = readFileSync(readmePath, 'utf8');

if (!readme.includes('OWNER')) {
  console.log(`README.md has no OWNER placeholder. Remote is ${owner}/${repo}. Nothing to do.`);
  process.exit(0);
}

const count = readme.split('OWNER').length - 1;
const updated = readme
  // a link to the owner's page, e.g. https://github.com/OWNER/<repo>/graphs/contributors
  .replaceAll(/https:\/\/github\.com\/OWNER\/[A-Za-z0-9_.-]+/g, `https://github.com/${owner}`)
  // a badge that names the repository, e.g. https://contrib.rocks/image?repo=OWNER/<repo>
  .replaceAll(`repo=OWNER/${repo}`, `repo=${owner}/${repo}`);

if (checkOnly) {
  console.log(`Would replace ${count} OWNER placeholder(s) in README.md with ${owner}.`);
  process.exit(0);
}

const remaining = updated.split('OWNER').length - 1;

writeFileSync(readmePath, updated);
console.log(
  `Replaced ${count - remaining} OWNER placeholder(s) in README.md with ${owner}/${repo}.`,
);
if (remaining > 0) {
  console.warn(
    `Warning: ${remaining} OWNER placeholder(s) remain; check for a form this script does not know.`,
  );
}
console.log('Review the diff, then commit README.md.');
