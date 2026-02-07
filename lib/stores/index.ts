'use client';

/**
 * Stores Barrel Export
 * Central export for all Zustand stores
 */

// Storage
export { safeStorage, createSafeStorage } from './storage';

// Device Store
export {
  useDeviceStore,
  deviceStoreApi,
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
  transferStoreApi,
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

// Settings Store
export {
  useSettingsStore,
  // Types
  type SettingsState,
  // Selectors
  selectDeviceName,
  selectDeviceId,
  selectTheme,
  selectStripMetadata,
  selectIpLeakProtection,
  selectOnionRoutingEnabled,
  selectAllowLocalDiscovery,
  selectAllowInternetP2P,
  selectTemporaryVisibility,
  selectGuestMode,
  selectAutoAcceptFromFriends,
  selectSaveLocation,
  selectMaxConcurrentTransfers,
  selectNotificationSound,
  selectNotificationVolume,
  selectBrowserNotifications,
  selectToastPosition,
  selectNotifyOnTransferComplete,
  selectNotifyOnIncomingTransfer,
  selectNotifyOnConnectionChange,
  selectNotifyOnDeviceDiscovered,
} from './settings-store';

// Friends Store
export {
  useFriendsStore,
  // Types
  type Friend,
  type PendingRequest,
  type PairingSession,
  type FriendsStoreState,
  // Selectors
  selectFriends,
  selectOnlineFriends,
  selectOfflineFriends,
  selectTrustedFriends,
  selectPendingRequests,
  selectPendingRequestsCount,
  selectCurrentPairingSession,
  selectFriendsCount,
  selectIsLoading as selectFriendsIsLoading,
} from './friends-store';

// Room Store
export {
  useRoomStore,
  // Types
  type RoomConnectionStatus,
  type RoomStoreState,
  // Selectors
  selectConnectionStatus as selectRoomConnectionStatus,
  selectIsConnected as selectIsConnectedToRoom,
  selectIsInRoom,
  selectConnectionError as selectRoomConnectionError,
  selectConnectionQuality,
  selectCurrentRoom,
  selectRoomCode,
  selectIsHost,
  selectMembers,
  selectMemberCount,
  selectOnlineMembers,
  selectHostMember,
} from './room-store';
