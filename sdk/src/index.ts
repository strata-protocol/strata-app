/**
 * Strata SDK — a typed, read-only client for the Strata epoch manager on
 * Stellar Soroban testnet.
 *
 * UNAUDITED TESTNET SOFTWARE. Do not use real funds. This app never moves
 * funds; every helper here simulates a read.
 *
 * @packageDocumentation
 */

export {
  AmountError,
  MAX_DECIMALS,
  MAX_PRINCIPAL_BASE_UNITS,
  formatAmount,
  parseAmount,
  type FormatAmountOptions,
} from './amounts.js';

export {
  NetworkGuardError,
  TESTNET_NETWORK_PASSPHRASE,
  assertTestnetPassphrase,
  pinnedDeployment,
  pinnedNetworkConfig,
  resolveNetworkConfig,
  type DeploymentProvenance,
  type PinnedContract,
  type PinnedDeployment,
  type StrataNetworkConfig,
} from './deployment.js';

export {
  CONTRACT_ERROR_MESSAGES,
  contractErrorName,
  contractErrorMessage,
  describeContractErrorCode,
  describeUnknownError,
  unknownContractErrorMessage,
} from './errors.js';

export {
  TRANCHE_JUNIOR,
  TRANCHE_SENIOR,
  createStrataClient,
  decodeContractErrorCode,
  trancheLabel,
  type ManagerConfigView,
  type ReadKind,
  type ReadMeta,
  type StrataClient,
  type StrataRead,
} from './client.js';

export type {
  Config,
  ContractEvent,
  Epoch,
  Position,
  ProjectedSplit,
  Status,
  Tranche,
} from './generated/types.js';
