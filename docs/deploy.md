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
absolute `/assets/...` paths, so the site must be served from the root of a
host. A site served from a subdirectory (a project page, for instance) needs a
`base` setting in `dashboard/vite.config.ts`; that is a one-line change and is
not made here because the target host is not chosen yet.

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

This guide does not deploy anything. Publishing is a decision for the
maintainer, and the demo URL is `TODO(maintainer)` in the README.
