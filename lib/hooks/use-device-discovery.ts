'use client';

/**
 * Device Discovery Hook — Thin React Wrapper
 *
 * The actual discovery logic lives in discovery-controller.ts, a plain
 * TypeScript module whose functions are NOT inside a React hook. This
 * prevents the React compiler / Turbopack from transforming
 * store.getState() calls into reactive subscriptions (which caused
 * infinite re-render loops).
 *
 * This hook only:
 * 1. Starts the controller on mount
 * 2. Stops the controller on unmount
 * 3. Keeps the controller's device name in sync with settings
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import {
  discoveryController,
  type DiscoveryStatus,
} from '@/lib/discovery/discovery-controller';

export type { DiscoveryStatus };

export interface UseDeviceDiscoveryReturn {
  status: DiscoveryStatus;
  refresh: () => void;
  startDiscovery: () => void;
  stopDiscovery: () => void;
}

/**
 * Device discovery hook.
 *
 * Manages device discovery lifecycle by delegating to the singleton
 * discoveryController. Because the controller is a plain module (not
 * a React hook), its store access via .getState() cannot be transformed
 * by the compiler into a reactive subscription.
 */
export function useDeviceDiscovery(): UseDeviceDiscoveryReturn {
  const { deviceName } = useSettingsStore();

  // Keep the controller's device name in sync with settings.
  // This is a synchronous assignment, not an effect, so it runs
  // before any effect cleanup could fire.
  discoveryController.setDeviceName(deviceName);

  // Start on mount, stop on unmount.
  // The only possible dep the compiler can add is `deviceName` (a string
  // primitive from the settings store). Even if added, it only changes
  // when the user explicitly renames their device — no loop.
  useEffect(() => {
    discoveryController.start(deviceName);
    return () => {
      discoveryController.stop();
    };
  }, []);

  return {
    status: discoveryController.status,
    refresh: discoveryController.refresh,
    startDiscovery: discoveryController.start,
    stopDiscovery: discoveryController.stop,
  };
}

/**
 * Hook to get discovery status (read-only)
 */
export function useDiscoveryStatus(): DiscoveryStatus {
  return discoveryController.status;
}
