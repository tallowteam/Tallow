/**
 * Hook for managing temporary visibility feature
 * Controls mDNS broadcasting based on tab visibility
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';

interface UseTemporaryVisibilityOptions {
  onVisibilityChange?: (isVisible: boolean) => void;
  onBroadcastStart?: () => void;
  onBroadcastStop?: () => void;
}

export function useTemporaryVisibility(options: UseTemporaryVisibilityOptions = {}) {
  const { temporaryVisibility } = useSettingsStore();
  const { onVisibilityChange, onBroadcastStart, onBroadcastStop } = options;

  const isVisibleRef = useRef(true);
  const isBroadcastingRef = useRef(false);

  const startBroadcast = useCallback(() => {
    if (isBroadcastingRef.current) {
      return;
    }

    isBroadcastingRef.current = true;

    if (onBroadcastStart) {
      onBroadcastStart();
    }

    console.log('[TemporaryVisibility] Started mDNS broadcasting');
  }, [onBroadcastStart]);

  const stopBroadcast = useCallback(() => {
    if (!isBroadcastingRef.current) {
      return;
    }

    isBroadcastingRef.current = false;

    if (onBroadcastStop) {
      onBroadcastStop();
    }

    console.log('[TemporaryVisibility] Stopped mDNS broadcasting');
  }, [onBroadcastStop]);

  useEffect(() => {
    if (!temporaryVisibility) {
      // If temporary visibility is disabled, ensure broadcasting is on
      if (!isBroadcastingRef.current) {
        startBroadcast();
      }
      return;
    }

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isVisible;

      if (onVisibilityChange) {
        onVisibilityChange(isVisible);
      }

      if (isVisible) {
        startBroadcast();
      } else {
        stopBroadcast();
      }
    };

    // Check initial visibility state
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Restore broadcasting when unmounting if it was stopped
      if (!isBroadcastingRef.current) {
        startBroadcast();
      }
    };
  }, [temporaryVisibility, onVisibilityChange, startBroadcast, stopBroadcast]);

  return {
    isVisible: isVisibleRef.current,
    isBroadcasting: isBroadcastingRef.current,
    temporaryVisibility,
  };
}
