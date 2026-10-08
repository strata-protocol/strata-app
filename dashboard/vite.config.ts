import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The dashboard consumes the SDK from source rather than a build output, so a
// dev server and the typecheck never need a preceding `npm run build`. The
// `strata-sdk` workspace dependency still declares the package for tooling.
export default defineConfig({
  // The base path is configurable so one build works both at a domain root
  // (`/`, the default) and under a project sub-path such as `/strata-app/`.
  // The Pages workflow derives it from the repository name, so the repo name is
  // never hardcoded here. See docs/deploy.md.
  base: process.env['VITE_BASE_PATH'] ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      'strata-sdk': fileURLToPath(new URL('../sdk/src/index.ts', import.meta.url)),
    },
  },
  define: {
    // Some XDR/base64 paths in the Stellar SDK reach for `global`.
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
