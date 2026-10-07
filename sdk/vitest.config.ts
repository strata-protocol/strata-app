import { defineConfig } from 'vitest/config';

/**
 * Default unit-test run. It must work offline: no Soroban RPC, no network
 * passphrase and no contract ID. The live testnet tests live in
 * `test/**\/*.integration.test.ts` and are run separately with
 * `npm run test:integration --workspace strata-sdk`.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/**/*.integration.test.ts', '**/node_modules/**'],
  },
});
