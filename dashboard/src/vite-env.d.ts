/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Soroban RPC endpoint. Defaults to the pinned deployment's endpoint. */
  readonly VITE_RPC_URL?: string;
  /** Network passphrase. Must be the testnet passphrase; the app refuses otherwise. */
  readonly VITE_NETWORK_PASSPHRASE?: string;
  /** Epoch manager contract ID. Defaults to the pinned deployment. */
  readonly VITE_MANAGER_ID?: string;
  /** Mock vault contract ID. Defaults to the pinned deployment. */
  readonly VITE_VAULT_ID?: string;
  /** Underlying token contract ID. Defaults to the pinned deployment. */
  readonly VITE_TOKEN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
