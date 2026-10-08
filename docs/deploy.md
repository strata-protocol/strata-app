# Deploying the dashboard

UNAUDITED TESTNET SOFTWARE. What you deploy is a read-only testnet dashboard.
It moves no funds. Do not use real funds.

The dashboard is a static site: `npm run build` emits files into
`dashboard/dist`, and any static host serves that directory. There is no server,
no database, and no API of our own.

## Build

From the repository root:

```sh
npm ci
npm run build --workspace strata-sdk      # only needed if you want dist/
npm run build --workspace strata-dashboard
```

`npm run build` at the root builds every workspace.

The output is `dashboard/dist`:

```
dist/index.html
dist/assets/*.js
dist/assets/*.css
```

Serve that directory as the site root. `index.html` references its assets with
absolute paths derived from Vite's `base`.

### Base path

Vite's `base` comes from the `VITE_BASE_PATH` environment variable and defaults
to `/`:

```sh
# a host that serves the site from its domain root
npm run build --workspace strata-dashboard

# a host that serves it from a sub-path, e.g. a project Pages site
VITE_BASE_PATH=/strata-app/ npm run build --workspace strata-dashboard
```

A host that serves the site from the domain root needs nothing: `/` is the
default, so the plain build is correct for Netlify, Vercel, Cloudflare Pages,
S3, or any other static host that serves the site at `/`. Only a host that
serves the site from a sub-path needs `VITE_BASE_PATH` set to that sub-path.

## No environment file is required

Every default comes from the pinned deployment file
(`sdk/src/deployments.testnet.json`), which is compiled into the bundle. The app
runs with no `.env` at all.

The build embeds the pinned contract IDs. If testnet is reset and the contracts
are redeployed, rebuild from a re-pinned file rather than editing the output.

## Overrides

If you need to point the built site at a different RPC endpoint, or at a
different pinned deployment, set these at build time. They override the pinned
defaults and nothing else:

| Variable | Purpose |
|---|---|
| `VITE_RPC_URL` | Soroban RPC endpoint for testnet |
| `VITE_NETWORK_PASSPHRASE` | network passphrase; must be testnet |
| `VITE_MANAGER_ID` | epoch manager contract ID |
| `VITE_VAULT_ID` | mock vault contract ID |
| `VITE_TOKEN_ID` | underlying token contract ID |

Vite only inlines variables that are present when the build runs:

```sh
VITE_RPC_URL=https://soroban-testnet.stellar.org npm run build --workspace strata-dashboard
```

Because these are baked into the bundle, they are public. There is nothing
secret here and nothing secret should ever be added. The app refuses to start
if the passphrase is not testnet, so a mis-set override produces a refusal, not
a silent connection to another network.

## GitHub Pages

The dashboard publishes to GitHub Pages from `.github/workflows/pages.yml`.
The workflow builds the dashboard with the base path taken from the repository
name in the workflow context, uploads `dashboard/dist` as a Pages artifact, and
deploys it with the official Pages actions. It runs on pushes to `main` and on
demand, and it is not a required status check, so a Pages outage cannot block a
pull request.

Expected URL for this repository:

```
https://strata-protocol.github.io/strata-app/
```

The workflow builds under `/strata-app/`, which is exactly this repository's
name, so no name is hardcoded in the workflow or in `vite.config.ts`.

**One-time human step.** In the repository, open **Settings → Pages**, and
under **Build and deployment → Source** select **GitHub Actions**. The workflow
cannot enable Pages itself; that needs a token with Pages write access, which
is deliberately not wired up here. Until the source is set, the Pages steps
cannot complete.

The dashboard reads the testnet RPC from the Pages origin. That path is only
exercised once the site is live, and it is not tested from that origin here.

## Host checklist

- Serve `dashboard/dist` as the site root, over HTTPS.
- Keep the site static. Nothing here needs a runtime.
- SPA routing is not needed; there is one route and it uses query parameters
  (`?account=`, `?value=`, `?yield=`) rather than paths. A catch-all rewrite is
  therefore unnecessary, though serving `index.html` for unknown paths does no
  harm.
- Long cache headers on `/assets/*` are safe: Vite fingerprints those filenames.
- No server-side rendering, no API proxy, no database.

## Verifying a deployment

After publishing, open the URL and check, in this order:

1. The orange banner reads `UNAUDITED · TESTNET ONLY · READ-ONLY`.
2. The Epoch panel shows a status and figures, with a `Ledger … · fetched …`
   line.
3. The Deployment panel shows the network passphrase as
   `Test SDF Network ; September 2015` and an RPC endpoint.
4. Paste an account that deposited in a demo epoch and confirm the position
   panel shows principal.
5. Set an underlying value in the projection panel and confirm the split adds
   back to the input.

If the panels show "not found on this network", the pinned deployment is gone:
testnet was almost certainly reset. Redeploy via the contracts repo, re-pin
`sdk/src/deployments.testnet.json`, rebuild. `npm run check:drift` tells you
which of the two happened.

## Local preview

```sh
npm run dev --workspace strata-dashboard     # http://localhost:5173
npm run preview --workspace strata-dashboard # serves the built output
```

## Not done here

GitHub Pages is wired up in `.github/workflows/pages.yml`, but a maintainer
still has to enable Pages once (Settings → Pages → Source = GitHub Actions).
The live demo URL is `TODO(maintainer)` in the README until then.
