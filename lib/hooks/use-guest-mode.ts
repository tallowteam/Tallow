/**
 * Hook for managing guest mode functionality
 * Handles cleanup of transfer history and device cache on session end
 */

import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { useDeviceStore } from '@/lib/stores/device-store';

export function useGuestMode() {
  const { guestMode } = useSettingsStore();

  const cleanupGuestData = useCallback(() => {
    if (!guestMode) {
      return;
    }

    // Use getState() to avoid Turbopack hook issues
    const transferStore = useTransferStore.getState();
    const deviceStore = useDeviceStore.getState();

    console.log('[GuestMode] Cleaning up session data...');

    // Clear all transfer history
    transferStore.clearTransfers();

    // Clear recent devices (but preserve favorites)
    deviceStore.clearRecent();

    // Clear queue
    transferStore.clearQueue();

    console.log('[GuestMode] Session data cleared');
  }, [guestMode]);

  useEffect(() => {
    if (!guestMode) {
      return;
    }

    // Clean up on page unload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      cleanupGuestData();

      // Note: Most browsers ignore custom messages, but we include one anyway
      const message = 'Guest mode session will be cleared. Continue?';
      event.returnValue = message;
      return message;
    };

    // Clean up on visibility change (tab close/switch in some browsers)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanupGuestData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clean up when component unmounts (navigation away)
      cleanupGuestData();
    };
  }, [guestMode, cleanupGuestData]);

  // Prevent accidental saves in guest mode
  const shouldSaveHistory = useCallback(() => {
    return !guestMode;
  }, [guestMode]);

  return {
    guestMode,
    shouldSaveHistory,
    cleanupGuestData,
  };
}
