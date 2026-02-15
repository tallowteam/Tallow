/**
 * Settings Store - Zustand State Management
 *
 * Manages application settings with persistence to localStorage
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SettingsState {
  // Device Settings
  deviceName: string;
  deviceId: string;

  // Appearance
  theme: 'dark' | 'light' | 'system';

  // Privacy & Security
  stripMetadata: boolean;
  ipLeakProtection: boolean;
  onionRoutingEnabled: boolean;
  allowLocalDiscovery: boolean;
  allowInternetP2P: boolean;
  temporaryVisibility: boolean;
  guestMode: boolean;

  // Transfer Settings
  autoAcceptFromFriends: boolean;
  saveLocation: string;
  maxConcurrentTransfers: 1 | 2 | 3 | 5;

  // Notification Settings
  notificationSound: boolean;
  notificationVolume: number; // 0-1 range
  browserNotifications: boolean;
  toastPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  notifyOnTransferComplete: boolean;
  notifyOnIncomingTransfer: boolean;
  notifyOnConnectionChange: boolean;
  notifyOnDeviceDiscovered: boolean;
  silentHoursEnabled: boolean;
  silentHoursStart: string; // Format: "HH:MM"
  silentHoursEnd: string;   // Format: "HH:MM"

  // Clipboard Settings
  clipboardAutoSendEnabled: boolean;
  clipboardTargetDeviceId: string | null;
  clipboardConfirmBeforeSend: boolean;
  clipboardSendImages: boolean;
  clipboardSendDocuments: boolean;
  clipboardSendText: boolean;
  clipboardSendAllTypes: boolean;
  clipboardMaxFileSize: number; // in bytes

  // Actions
  setDeviceName: (name: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setStripMetadata: (enabled: boolean) => void;
  setIpLeakProtection: (enabled: boolean) => void;
  setOnionRoutingEnabled: (enabled: boolean) => void;
  setAllowLocalDiscovery: (enabled: boolean) => void;
  setAllowInternetP2P: (enabled: boolean) => void;
  setTemporaryVisibility: (enabled: boolean) => void;
  setGuestMode: (enabled: boolean) => void;
  setAutoAcceptFromFriends: (enabled: boolean) => void;
  setSaveLocation: (location: string) => void;
  setMaxConcurrentTransfers: (max: 1 | 2 | 3 | 5) => void;
  setNotificationSound: (enabled: boolean) => void;
  setNotificationVolume: (volume: number) => void;
  setBrowserNotifications: (enabled: boolean) => void;
  setToastPosition: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center') => void;
  setNotifyOnTransferComplete: (enabled: boolean) => void;
  setNotifyOnIncomingTransfer: (enabled: boolean) => void;
  setNotifyOnConnectionChange: (enabled: boolean) => void;
  setNotifyOnDeviceDiscovered: (enabled: boolean) => void;
  setSilentHoursEnabled: (enabled: boolean) => void;
  setSilentHoursStart: (time: string) => void;
  setSilentHoursEnd: (time: string) => void;
  setClipboardAutoSendEnabled: (enabled: boolean) => void;
  setClipboardTargetDeviceId: (deviceId: string | null) => void;
  setClipboardConfirmBeforeSend: (enabled: boolean) => void;
  setClipboardSendImages: (enabled: boolean) => void;
  setClipboardSendDocuments: (enabled: boolean) => void;
  setClipboardSendText: (enabled: boolean) => void;
  setClipboardSendAllTypes: (enabled: boolean) => void;
  setClipboardMaxFileSize: (size: number) => void;
  resetToDefaults: () => void;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const generateDeviceId = (): string => {
  // Generate a random device ID
  return `device-${Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => b.toString(36)).join('').substring(0, 13)}`;
};

const getDefaultDeviceName = (): string => {
  if (typeof window === 'undefined') {return 'My Device';}

  // Try to get a meaningful device name from browser
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) {return 'Windows Device';}
  if (userAgent.includes('Mac')) {return 'Mac';}
  if (userAgent.includes('Linux')) {return 'Linux Device';}
  if (userAgent.includes('Android')) {return 'Android Device';}
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {return 'iOS Device';}
  return 'My Device';
};

const createDefaultSettings = () => ({
  deviceName: getDefaultDeviceName(),
  deviceId: generateDeviceId(),
  theme: 'dark' as const,
  stripMetadata: true,
  ipLeakProtection: true,
  onionRoutingEnabled: false,
  allowLocalDiscovery: true,
  allowInternetP2P: true,
  temporaryVisibility: false,
  guestMode: false,
  autoAcceptFromFriends: false,
  saveLocation: 'Downloads',
  maxConcurrentTransfers: 3 as const,
  notificationSound: true,
  notificationVolume: 0.3,
  browserNotifications: true,
  toastPosition: 'bottom-right' as const,
  notifyOnTransferComplete: true,
  notifyOnIncomingTransfer: true,
  notifyOnConnectionChange: true,
  notifyOnDeviceDiscovered: false,
  silentHoursEnabled: false,
  silentHoursStart: '22:00',
  silentHoursEnd: '08:00',
  clipboardAutoSendEnabled: false,
  clipboardTargetDeviceId: null,
  clipboardConfirmBeforeSend: true,
  clipboardSendImages: true,
  clipboardSendDocuments: true,
  clipboardSendText: true,
  clipboardSendAllTypes: false,
  clipboardMaxFileSize: 10 * 1024 * 1024,
});

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        ...createDefaultSettings(),

        // Device Settings
        setDeviceName: (name) => set({ deviceName: name }),

        // Appearance
        setTheme: (theme) => set({ theme }),

        // Privacy & Security
        setStripMetadata: (enabled) => set({ stripMetadata: enabled }),
        setIpLeakProtection: (enabled) => set({ ipLeakProtection: enabled }),
        setOnionRoutingEnabled: (enabled) => set({ onionRoutingEnabled: enabled }),
        setAllowLocalDiscovery: (enabled) => set({ allowLocalDiscovery: enabled }),
        setAllowInternetP2P: (enabled) => set({ allowInternetP2P: enabled }),
        setTemporaryVisibility: (enabled) => set({ temporaryVisibility: enabled }),
        setGuestMode: (enabled) => set({ guestMode: enabled }),

        // Transfer Settings
        setAutoAcceptFromFriends: (enabled) => set({ autoAcceptFromFriends: enabled }),
        setSaveLocation: (location) => set({ saveLocation: location }),
        setMaxConcurrentTransfers: (max) => set({ maxConcurrentTransfers: max }),

        // Notification Settings
        setNotificationSound: (enabled) => set({ notificationSound: enabled }),
        setNotificationVolume: (volume) => set({ notificationVolume: Math.max(0, Math.min(1, volume)) }),
        setBrowserNotifications: (enabled) => set({ browserNotifications: enabled }),
        setToastPosition: (position) => set({ toastPosition: position }),
        setNotifyOnTransferComplete: (enabled) => set({ notifyOnTransferComplete: enabled }),
        setNotifyOnIncomingTransfer: (enabled) => set({ notifyOnIncomingTransfer: enabled }),
        setNotifyOnConnectionChange: (enabled) => set({ notifyOnConnectionChange: enabled }),
        setNotifyOnDeviceDiscovered: (enabled) => set({ notifyOnDeviceDiscovered: enabled }),
        setSilentHoursEnabled: (enabled) => set({ silentHoursEnabled: enabled }),
        setSilentHoursStart: (time) => set({ silentHoursStart: time }),
        setSilentHoursEnd: (time) => set({ silentHoursEnd: time }),
        setClipboardAutoSendEnabled: (enabled) => set({ clipboardAutoSendEnabled: enabled }),
        setClipboardTargetDeviceId: (deviceId) => set({ clipboardTargetDeviceId: deviceId }),
        setClipboardConfirmBeforeSend: (enabled) => set({ clipboardConfirmBeforeSend: enabled }),
        setClipboardSendImages: (enabled) => set({ clipboardSendImages: enabled }),
        setClipboardSendDocuments: (enabled) => set({ clipboardSendDocuments: enabled }),
        setClipboardSendText: (enabled) => set({ clipboardSendText: enabled }),
        setClipboardSendAllTypes: (enabled) => set({ clipboardSendAllTypes: enabled }),
        setClipboardMaxFileSize: (size) => set({ clipboardMaxFileSize: Math.max(0, size) }),

        // Reset
        resetToDefaults: () => set(createDefaultSettings()),
      }),
      {
        name: 'tallow-settings-store',
        storage: createJSONStorage(() => safeStorage),
      }
    ),
    { name: 'SettingsStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectDeviceName = (state: SettingsState) => state.deviceName;
export const selectDeviceId = (state: SettingsState) => state.deviceId;
export const selectTheme = (state: SettingsState) => state.theme;
export const selectStripMetadata = (state: SettingsState) => state.stripMetadata;
export const selectIpLeakProtection = (state: SettingsState) => state.ipLeakProtection;
export const selectOnionRoutingEnabled = (state: SettingsState) => state.onionRoutingEnabled;
export const selectAllowLocalDiscovery = (state: SettingsState) => state.allowLocalDiscovery;
export const selectAllowInternetP2P = (state: SettingsState) => state.allowInternetP2P;
export const selectTemporaryVisibility = (state: SettingsState) => state.temporaryVisibility;
export const selectGuestMode = (state: SettingsState) => state.guestMode;
export const selectAutoAcceptFromFriends = (state: SettingsState) => state.autoAcceptFromFriends;
export const selectSaveLocation = (state: SettingsState) => state.saveLocation;
export const selectMaxConcurrentTransfers = (state: SettingsState) => state.maxConcurrentTransfers;
export const selectNotificationSound = (state: SettingsState) => state.notificationSound;
export const selectNotificationVolume = (state: SettingsState) => state.notificationVolume;
export const selectBrowserNotifications = (state: SettingsState) => state.browserNotifications;
export const selectToastPosition = (state: SettingsState) => state.toastPosition;
export const selectNotifyOnTransferComplete = (state: SettingsState) => state.notifyOnTransferComplete;
export const selectNotifyOnIncomingTransfer = (state: SettingsState) => state.notifyOnIncomingTransfer;
export const selectNotifyOnConnectionChange = (state: SettingsState) => state.notifyOnConnectionChange;
export const selectNotifyOnDeviceDiscovered = (state: SettingsState) => state.notifyOnDeviceDiscovered;
export const selectSilentHoursEnabled = (state: SettingsState) => state.silentHoursEnabled;
export const selectSilentHoursStart = (state: SettingsState) => state.silentHoursStart;
export const selectSilentHoursEnd = (state: SettingsState) => state.silentHoursEnd;
