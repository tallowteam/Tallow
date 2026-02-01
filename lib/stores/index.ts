/**
 * Stores Barrel Export
 * Central export for all Zustand stores
 */

// Scroll Animation Store
export {
  useScrollAnimationStore,
  // Types
  type SectionVisibility,
  type AnimationState,
  type EuvekaTheme,
  type AnimationPreferences,
  type SpringConfig,
  type ScrollDirection,
  type ScrollAnimationState,
  // Selectors
  selectScrollProgress,
  selectScrollDirection,
  selectActiveSection,
  selectVisibleSections,
  selectViewedSections,
  createSectionSelector,
  createAnimationSelector,
  selectReducedMotion,
  selectAnimationPreferences,
  selectEuvekaTheme,
  selectResolvedTheme,
  selectSpringConfig,
  selectHasRunningAnimations,
  selectOverallAnimationProgress,
  selectIsNearTop,
  selectIsNearBottom,
} from './scroll-animation-store';

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
