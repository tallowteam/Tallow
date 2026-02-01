/**
 * React 19 & Next.js 16 Optimizations
 * Central export for all optimization features
 */

// ============================================================================
// REACT 19 HOOKS
// ============================================================================

export {
  useOptimisticTransfer,
  type OptimisticTransferState,
  type TransferAction,
} from '../hooks/use-optimistic-transfer';

export {
  useAsyncResource,
  createResource,
  createCachedResource,
  type AsyncResource,
  type ResourceStatus,
} from '../hooks/use-async-resource';

export {
  useFormStatusEnhanced,
  useFormSubmissionHistory,
  useDebouncedFormValidation,
  type FormStatusState,
  type EnhancedFormStatus,
} from '../hooks/use-form-status-enhanced';

// ============================================================================
// LIST VIRTUALIZATION
// ============================================================================

export {
  VirtualizedTransferList,
  type VirtualizedTransferListProps,
} from '../../components/transfer/virtualized-transfer-list';

export {
  VirtualizedDeviceList,
  type VirtualizedDeviceListProps,
} from '../../components/devices/virtualized-device-list';

// ============================================================================
// LOADING SKELETONS
// ============================================================================

export {
  TransferCardSkeleton,
  TransferListSkeleton,
  TransferQueueSkeleton,
} from '../../components/loading/transfer-skeleton';

export {
  DeviceCardSkeleton,
  DeviceListSkeleton,
  DeviceGridSkeleton,
} from '../../components/loading/device-skeleton';

export {
  DashboardSkeleton,
  SettingsSkeleton,
  FeaturePageSkeleton,
  FormSkeleton,
} from '../../components/loading/page-skeleton';

// ============================================================================
// ERROR BOUNDARIES
// ============================================================================

export {
  ErrorBoundary,
  withErrorBoundary,
} from '../../components/error-boundary';

export {
  FeatureErrorBoundary,
  withFeatureErrorBoundary,
  type FeatureErrorBoundaryProps,
  type RecoveryStrategy,
} from '../../components/error-boundaries/feature-error-boundary';

export {
  AsyncErrorBoundary,
  type AsyncErrorBoundaryProps,
} from '../../components/error-boundaries/async-error-boundary';

export {
  ErrorRecoveryUI,
  NetworkErrorRecovery,
  NotFoundRecovery,
  PermissionErrorRecovery,
  TimeoutErrorRecovery,
  type ErrorRecoveryProps,
} from '../../components/error-boundaries/recovery-ui';

// ============================================================================
// OPTIMIZED CONTEXT
// ============================================================================

export {
  OptimizedTransfersProvider,
  useTransferList,
  useTransferProgress,
  useTransferState,
  useTransferById,
  useTransfersByStatus,
  useActiveTransfersCount,
  useTotalTransferSize,
  useTransferSpeed,
} from '../context/optimized-transfers-context';

export {
  OptimizedDevicesProvider,
  useCurrentDevice,
  useDiscoveredDevices,
  useConnection,
  useOnlineDevices,
  useDeviceById,
  useIsConnectedToDevice,
  useConnectionStatus,
  type DiscoveredDevice,
} from '../context/optimized-devices-context';

// ============================================================================
// ROUTE PREFETCHING
// ============================================================================

export {
  useRoutePrefetch,
  useHoverPrefetch,
  useIntersectionPrefetch,
  useBatchPrefetch,
  usePredictivePrefetch,
  type PrefetchOptions,
} from '../prefetch/route-prefetcher';

export {
  preloadResource,
  prefetchResource,
  dnsPrefetch,
  preconnect,
  preloadFonts,
  preloadImages,
  usePreloadCriticalResources,
  useIdlePrefetch,
  useDNSPrefetch,
  usePreconnect,
  usePrefetchOnHover,
  useProgressiveImage,
  useAdaptiveLoading,
  type ResourceHint,
  type ResourceType,
  type Priority,
} from '../prefetch/resource-hints';

export {
  PrefetchLink,
  type PrefetchLinkProps,
} from '../../components/prefetch/prefetch-link';

// ============================================================================
// SERVER ACTIONS
// ============================================================================

export {
  createTransferAction,
  updateTransferStatusAction,
  cancelTransferAction,
  deleteTransferAction,
  bulkDeleteTransfersAction,
  exportTransferHistoryAction,
} from '../actions/transfer-actions';

export {
  registerDeviceAction,
  updateDeviceAction,
  deleteDeviceAction,
  toggleDeviceFavoriteAction,
  getDeviceStatsAction,
  syncDevicesAction,
} from '../actions/device-actions';

export {
  updateSettingsAction,
  resetSettingsAction,
  exportSettingsAction,
  importSettingsAction,
  clearCacheAction,
} from '../actions/settings-actions';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  Transfer,
  Device,
} from '../types';
