/**
 * Stores Barrel Export
 * Central export for all Zustand stores
 */

// Storage
export { safeStorage, createSafeStorage } from './storage';

// Device Store
export {
  useDeviceStore,
  // Types
  type DeviceConnectionState,
  type DeviceDiscoveryState,
  type OptimisticUpdate,
  type DeviceStoreState,
  // Selectors
  selectDevices,
  selectSelectedDevice,
  selectConnectionStatus,
  selectIsConnected,
  selectIsScanning,
  selectIsLoading,
  selectOnlineDevices,
  selectOfflineDevices,
  selectFavoriteIds,
} from './device-store';

// Transfer Store
export {
  useTransferStore,
  // Types
  type TransferStatus,
  type TransferStats,
  type TransferStoreState,
  // Selectors
  selectTransfers,
  selectActiveTransfers,
  selectCompletedTransfers,
  selectUploadProgress,
  selectDownloadProgress,
  selectIsTransferring,
  selectIsReceiving,
  selectQueue,
  selectQueueLength,
  selectHasActiveTransfers,
  selectTotalSpeed,
} from './transfer-store';
