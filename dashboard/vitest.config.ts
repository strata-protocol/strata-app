import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Dashboard unit tests. Offline: no RPC, no contract call. The live read path
 * is exercised by the SDK's own integration suite against testnet, not from
 * here, so a testnet reset cannot turn the required `test` check red.
 *
 * The SDK is aliased to source, matching vite.config.ts, so a test never
 * depends on a prior `npm run build`.
 */
export default defineConfig({
  resolve: {
    alias: {
      'strata-sdk': fileURLToPath(new URL('../sdk/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    environment: 'node',
  },
});
