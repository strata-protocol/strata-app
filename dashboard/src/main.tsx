import { Buffer } from 'buffer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { resolveDashboardConfig } from './config';
import { FatalStartup } from './components/FatalStartup';
import './styles.css';

// Some XDR/base64 paths in the Stellar SDK expect a global `Buffer`.
const globalScope = globalThis as unknown as { Buffer?: typeof Buffer };
if (globalScope.Buffer === undefined) {
  globalScope.Buffer = Buffer;
}

const container = document.getElementById('root');
if (container === null) {
  throw new Error('index.html is missing #root');
}

try {
  // Resolve before rendering. `resolveDashboardConfig` throws if the network
  // is not testnet, and this app has no mainnet path to fall back to.
  const config = resolveDashboardConfig();
  createRoot(container).render(
    <StrictMode>
      <App config={config} />
    </StrictMode>,
  );
} catch (error) {
  createRoot(container).render(<FatalStartup error={error} />);
}
