import { defineConfig } from 'vitest/config';

/**
 * Live integration run. Hits the deployed testnet contract and therefore needs
 * the network, the recorded RPC endpoint and a deployment that still exists.
 * Deliberately not part of the default `npm test`, and never part of the
 * required CI checks.
 *
 *   npm run test:integration --workspace strata-sdk
 */
export default defineConfig({
  test: {
    include: ['test/**/*.integration.test.ts'],
    exclude: ['**/node_modules/**'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
