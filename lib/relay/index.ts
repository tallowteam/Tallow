/**
 * Relay Module
 *
 * Exports relay directory and client functionality for onion routing.
 */

export {
    RelayDirectoryService,
    getRelayDirectory,
    type RelayNodeInfo,
    type RelayDirectoryConfig,
    type RelaySelectionCriteria,
    type RelayRole,
} from './relay-directory';

export {
    RelayClient,
    getRelayClient,
    type RelayConnection,
    type OnionCircuit,
    type CircuitHop,
} from './relay-client';
