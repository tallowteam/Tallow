/**
 * Data Export & Erasure Functions
 *
 * GDPR Article 15 (Right to Access) & Article 17 (Right to Erasure)
 * CCPA Section 1798.100 (Right to Know) & Section 1798.105 (Right to Delete)
 *
 * Provides user-initiated data export and complete data deletion.
 */

'use client';

import { useSettingsStore } from '@/lib/stores/settings-store';
import { useDeviceStore } from '@/lib/stores/device-store';
import { getAllTransfers, clearHistory } from '@/lib/storage/transfer-history';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserDataExport {
  exportMetadata: {
    exportDate: string;
    exportVersion: string;
    dataProtectionNotice: string;
  };
  settings: {
    deviceName: string;
    deviceId: string;
    theme: string;
    privacy: {
      stripMetadata: boolean;
      ipLeakProtection: boolean;
      onionRoutingEnabled: boolean;
      allowLocalDiscovery: boolean;
      allowInternetP2P: boolean;
      temporaryVisibility: boolean;
      guestMode: boolean;
    };
    transfers: {
      autoAcceptFromFriends: boolean;
      saveLocation: string;
      maxConcurrentTransfers: number;
    };
    notifications: {
      notificationSound: boolean;
      notificationVolume: number;
      browserNotifications: boolean;
      toastPosition: string;
      notifyOnTransferComplete: boolean;
      notifyOnIncomingTransfer: boolean;
      notifyOnConnectionChange: boolean;
      notifyOnDeviceDiscovered: boolean;
      silentHoursEnabled: boolean;
      silentHoursStart: string;
      silentHoursEnd: string;
    };
  };
  devices: {
    favoriteDeviceIds: string[];
    recentDeviceIds: string[];
  };
  transferHistory: Array<{
    id: string;
    direction: string;
    files: Array<{
      name: string;
      size: number;
      type: string;
    }>;
    totalSize: number;
    peerName: string;
    peerEmail?: string;
    peerId: string;
    status: string;
    startedAt: string;
    completedAt: string;
    duration: number;
    speed: number;
  }>;
  dataInventory: {
    totalTransfers: number;
    totalDataSent: number;
    totalDataReceived: number;
    favoriteDevicesCount: number;
    recentDevicesCount: number;
  };
  privacyNotices: {
    encryptionKeys: string;
    fileContents: string;
    personalInformation: string;
  };
}

// ============================================================================
// DATA EXPORT FUNCTIONS
// ============================================================================

/**
 * Export all user data as JSON
 * Compliant with GDPR Article 20 (Data Portability) and CCPA Section 1798.100
 */
export async function exportUserData(): Promise<Blob> {
  try {
    // Get settings from Zustand store
    const settingsState = useSettingsStore.getState();

    // Get device data from Zustand store
    const deviceState = useDeviceStore.getState();

    // Get transfer history from IndexedDB
    const transfers = await getAllTransfers();

    // Calculate data inventory
    const totalDataSent = transfers
      .filter(t => t.direction === 'send')
      .reduce((acc, t) => acc + t.totalSize, 0);

    const totalDataReceived = transfers
      .filter(t => t.direction === 'receive')
      .reduce((acc, t) => acc + t.totalSize, 0);

    // Build comprehensive data export
    const exportData: UserDataExport = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0.0',
        dataProtectionNotice: `
This export contains all personal data stored by Tallow on your device.
This data is provided in compliance with GDPR Article 15 (Right to Access)
and CCPA Section 1798.100 (Right to Know).

IMPORTANT NOTES:
- Encryption keys are NOT included (security risk)
- File contents are NOT included (never stored by Tallow)
- This export is in JSON format for portability
- You can import this data into compatible applications
- Keep this file secure (it contains your device ID and transfer history)

For questions about this export, please review our Privacy Policy.
        `.trim(),
      },

      settings: {
        deviceName: settingsState.deviceName,
        deviceId: settingsState.deviceId,
        theme: settingsState.theme,
        privacy: {
          stripMetadata: settingsState.stripMetadata,
          ipLeakProtection: settingsState.ipLeakProtection,
          onionRoutingEnabled: settingsState.onionRoutingEnabled,
          allowLocalDiscovery: settingsState.allowLocalDiscovery,
          allowInternetP2P: settingsState.allowInternetP2P,
          temporaryVisibility: settingsState.temporaryVisibility,
          guestMode: settingsState.guestMode,
        },
        transfers: {
          autoAcceptFromFriends: settingsState.autoAcceptFromFriends,
          saveLocation: settingsState.saveLocation,
          maxConcurrentTransfers: settingsState.maxConcurrentTransfers,
        },
        notifications: {
          notificationSound: settingsState.notificationSound,
          notificationVolume: settingsState.notificationVolume,
          browserNotifications: settingsState.browserNotifications,
          toastPosition: settingsState.toastPosition,
          notifyOnTransferComplete: settingsState.notifyOnTransferComplete,
          notifyOnIncomingTransfer: settingsState.notifyOnIncomingTransfer,
          notifyOnConnectionChange: settingsState.notifyOnConnectionChange,
          notifyOnDeviceDiscovered: settingsState.notifyOnDeviceDiscovered,
          silentHoursEnabled: settingsState.silentHoursEnabled,
          silentHoursStart: settingsState.silentHoursStart,
          silentHoursEnd: settingsState.silentHoursEnd,
        },
      },

      devices: {
        favoriteDeviceIds: deviceState.favoriteDeviceIds,
        recentDeviceIds: deviceState.recentDeviceIds,
      },

      transferHistory: transfers.map(t => ({
        id: t.id,
        direction: t.direction,
        files: t.files,
        totalSize: t.totalSize,
        peerName: t.peerName,
        ...(t.peerEmail ? { peerEmail: t.peerEmail } : {}),
        peerId: t.peerId,
        status: t.status,
        startedAt: t.startedAt.toISOString(),
        completedAt: t.completedAt.toISOString(),
        duration: t.duration,
        speed: t.speed,
      })),

      dataInventory: {
        totalTransfers: transfers.length,
        totalDataSent,
        totalDataReceived,
        favoriteDevicesCount: deviceState.favoriteDeviceIds.length,
        recentDevicesCount: deviceState.recentDeviceIds.length,
      },

      privacyNotices: {
        encryptionKeys: 'Encryption keys are NOT included in this export for security reasons. Keys are ephemeral and destroyed after each session.',
        fileContents: 'File contents are NEVER stored by Tallow. Only metadata (filenames, sizes, timestamps) is recorded in transfer history.',
        personalInformation: 'Tallow does not collect real names, email addresses, phone numbers, or other personal identifiers unless voluntarily provided by the user.',
      },
    };

    // Convert to JSON with pretty printing
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create Blob for download
    const blob = new Blob([jsonString], { type: 'application/json' });

    return blob;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new Error('Failed to export user data. Please try again.');
  }
}

/**
 * Download exported data as JSON file
 */
export async function downloadUserData(): Promise<void> {
  try {
    const blob = await exportUserData();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tallow-data-export-${timestamp}.json`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading user data:', error);
    throw new Error('Failed to download user data. Please try again.');
  }
}

// ============================================================================
// DATA ERASURE FUNCTIONS
// ============================================================================

/**
 * Delete all locally stored user data
 * Compliant with GDPR Article 17 (Right to Erasure) and CCPA Section 1798.105
 *
 * WARNING: This action is IRREVERSIBLE. All data will be permanently deleted.
 */
export async function eraseUserData(): Promise<void> {
  try {
    // 1. Clear localStorage (settings store)
    const settingsStorageKey = 'tallow-settings-store';
    localStorage.removeItem(settingsStorageKey);

    // 2. Clear localStorage (device store - favorites/recent)
    const deviceStorageKey = 'tallow-device-store';
    localStorage.removeItem(deviceStorageKey);

    // 3. Clear IndexedDB (transfer history)
    await clearHistory();

    // 4. Clear any other localStorage keys
    const tallowKeys = Object.keys(localStorage).filter(key =>
      key.toLowerCase().includes('tallow')
    );
    tallowKeys.forEach(key => localStorage.removeItem(key));

    // 5. Clear sessionStorage
    sessionStorage.clear();

    // 6. Reset Zustand stores to default state
    useSettingsStore.getState().resetToDefaults();
    useDeviceStore.getState().clearDevices();

    // 7. Note: IndexedDB 'TallowDB' is cleared by clearHistory() above

    console.log('All user data has been permanently deleted.');
  } catch (error) {
    console.error('Error erasing user data:', error);
    throw new Error('Failed to erase user data. Please try again or contact support.');
  }
}

/**
 * Confirm and erase user data with safety check
 */
export async function confirmAndEraseUserData(
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  const confirmed = window.confirm(`
⚠️ WARNING: IRREVERSIBLE ACTION ⚠️

Are you absolutely sure you want to DELETE ALL YOUR DATA?

This will permanently erase:
• All settings and preferences
• Transfer history
• Device favorites and recent lists
• All locally stored data

This action CANNOT be undone.

Click OK to proceed with deletion, or Cancel to go back.
  `.trim());

  if (!confirmed) {
    return; // User cancelled
  }

  // Second confirmation for extra safety
  const doubleConfirmed = window.confirm(`
FINAL CONFIRMATION

This is your last chance to cancel.

Clicking OK will IMMEDIATELY and PERMANENTLY delete all your data.

Are you absolutely certain?
  `.trim());

  if (!doubleConfirmed) {
    return; // User cancelled on second prompt
  }

  try {
    await eraseUserData();
    if (onSuccess) {
      onSuccess();
    }
    // Optionally reload the page to reset state
    window.location.reload();
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      alert('Failed to delete data. Please try again or contact support.');
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format data size for human readability
 */
export function formatDataSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get summary of stored data for display
 */
export async function getDataSummary(): Promise<{
  settingsCount: number;
  transferHistoryCount: number;
  favoriteDevicesCount: number;
  recentDevicesCount: number;
  totalDataSent: string;
  totalDataReceived: string;
}> {
  try {
    const deviceState = useDeviceStore.getState();
    const transfers = await getAllTransfers();

    const totalDataSent = transfers
      .filter(t => t.direction === 'send')
      .reduce((acc, t) => acc + t.totalSize, 0);

    const totalDataReceived = transfers
      .filter(t => t.direction === 'receive')
      .reduce((acc, t) => acc + t.totalSize, 0);

    return {
      settingsCount: Object.keys(useSettingsStore.getState()).length,
      transferHistoryCount: transfers.length,
      favoriteDevicesCount: deviceState.favoriteDeviceIds.length,
      recentDevicesCount: deviceState.recentDeviceIds.length,
      totalDataSent: formatDataSize(totalDataSent),
      totalDataReceived: formatDataSize(totalDataReceived),
    };
  } catch (error) {
    console.error('Error getting data summary:', error);
    return {
      settingsCount: 0,
      transferHistoryCount: 0,
      favoriteDevicesCount: 0,
      recentDevicesCount: 0,
      totalDataSent: '0 B',
      totalDataReceived: '0 B',
    };
  }
}

/**
 * Check if user has any stored data
 */
export async function hasStoredData(): Promise<boolean> {
  try {
    const summary = await getDataSummary();
    return (
      summary.transferHistoryCount > 0 ||
      summary.favoriteDevicesCount > 0 ||
      summary.recentDevicesCount > 0
    );
  } catch (error) {
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  exportUserData,
  downloadUserData,
  eraseUserData,
  confirmAndEraseUserData,
  formatDataSize,
  getDataSummary,
  hasStoredData,
};
