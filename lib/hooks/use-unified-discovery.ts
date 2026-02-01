'use client';

/**
 * React Hook for Unified Device Discovery
 *
 * Provides an easy way to discover devices using both mDNS
 * (local network) and signaling server (internet) methods.
 *
 * Features:
 * - Automatic mDNS fallback to signaling
 * - Device state management
 * - Connection method selection
 * - TypeScript support
 *
 * @example
 * ```tsx
 * function DeviceList() {
 *   const {
 *     devices,
 *     isDiscovering,
 *     isMdnsAvailable,
 *     startDiscovery,
 *     stopDiscovery,
 *   } = useUnifiedDiscovery();
 *
 *   return (
 *     <ul>
 *       {devices.map(device => (
 *         <li key={device.id}>
 *           {device.name} ({device.source})
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUnifiedDiscovery,
  type UnifiedDevice,
  type UnifiedDiscoveryOptions,
  type DiscoverySource,
} from '@/lib/discovery/unified-discovery';
import type { DeviceCapabilities } from '@/lib/discovery/local-discovery';

// ============================================================================
// Types
// ============================================================================

/**
 * Hook options
 */
export interface UseUnifiedDiscoveryOptions extends UnifiedDiscoveryOptions {
  /** Auto-start discovery on mount */
  autoStart?: boolean;
  /** Filter devices by source */
  sourceFilter?: DiscoverySource;
  /** Filter devices by capabilities */
  capabilityFilter?: Partial<DeviceCapabilities>;
}

/**
 * Hook return type
 */
export interface UseUnifiedDiscoveryResult {
  /** List of discovered devices */
  devices: UnifiedDevice[];
  /** Whether discovery is active */
  isDiscovering: boolean;
  /** Whether mDNS daemon is available */
  isMdnsAvailable: boolean;
  /** Whether signaling is connected */
  isSignalingConnected: boolean;
  /** Count of mDNS devices */
  mdnsDeviceCount: number;
  /** Count of signaling devices */
  signalingDeviceCount: number;
  /** Start discovery */
  startDiscovery: () => Promise<void>;
  /** Stop discovery */
  stopDiscovery: () => void;
  /** Refresh discovery */
  refresh: () => Promise<void>;
  /** Get best connection method for a device */
  getBestConnectionMethod: (deviceId: string) => 'direct' | 'signaling' | null;
  /** Get device by ID */
  getDevice: (deviceId: string) => UnifiedDevice | undefined;
  /** Advertise this device (requires mDNS) */
  advertise: () => void;
  /** Stop advertising */
  stopAdvertising: () => void;
  /** Error if any */
  error: Error | null;
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<UseUnifiedDiscoveryOptions> = {
  enableMdns: true,
  enableSignaling: true,
  preferMdns: true,
  daemonUrl: 'ws://localhost:53318',
  autoAdvertise: true,
  autoStart: true,
  sourceFilter: undefined as unknown as DiscoverySource,
  capabilityFilter: undefined as unknown as Partial<DeviceCapabilities>,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for unified device discovery
 */
export function useUnifiedDiscovery(
  options: UseUnifiedDiscoveryOptions = {}
): UseUnifiedDiscoveryResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const discoveryRef = useRef(getUnifiedDiscovery(opts));

  // State
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isMdnsAvailable, setIsMdnsAvailable] = useState(false);
  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [mdnsDeviceCount, setMdnsDeviceCount] = useState(0);
  const [signalingDeviceCount, setSignalingDeviceCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Filter devices based on options
   */
  const filterDevices = useCallback(
    (allDevices: UnifiedDevice[]): UnifiedDevice[] => {
      let filtered = allDevices;

      // Filter by source
      if (opts.sourceFilter) {
        filtered = filtered.filter((d) => {
          if (opts.sourceFilter === 'mdns') {return d.hasMdns;}
          if (opts.sourceFilter === 'signaling') {return d.hasSignaling;}
          if (opts.sourceFilter === 'both') {return d.hasMdns && d.hasSignaling;}
          return true;
        });
      }

      // Filter by capabilities
      if (opts.capabilityFilter) {
        filtered = filtered.filter((d) => {
          if (!d.capabilities) {return false;}
          const cap = opts.capabilityFilter!;
          if (cap.supportsPQC && !d.capabilities.supportsPQC) {return false;}
          if (cap.supportsGroupTransfer && !d.capabilities.supportsGroupTransfer) {return false;}
          return true;
        });
      }

      return filtered;
    },
    [opts.sourceFilter, opts.capabilityFilter]
  );

  /**
   * Update status from discovery manager
   */
  const updateStatus = useCallback(() => {
    const discovery = discoveryRef.current;
    const status = discovery.getStatus();

    setIsDiscovering(status.started);
    setIsMdnsAvailable(status.mdnsAvailable);
    setIsSignalingConnected(status.signalingConnected);
    setMdnsDeviceCount(status.mdnsDeviceCount);
    setSignalingDeviceCount(status.signalingDeviceCount);
  }, []);

  /**
   * Start discovery
   */
  const startDiscovery = useCallback(async () => {
    try {
      setError(null);
      await discoveryRef.current.start();
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [updateStatus]);

  /**
   * Stop discovery
   */
  const stopDiscovery = useCallback(() => {
    discoveryRef.current.stop();
    setIsDiscovering(false);
    setDevices([]);
  }, []);

  /**
   * Refresh discovery
   */
  const refresh = useCallback(async () => {
    try {
      setError(null);
      await discoveryRef.current.refresh();
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [updateStatus]);

  /**
   * Get best connection method
   */
  const getBestConnectionMethod = useCallback(
    (deviceId: string): 'direct' | 'signaling' | null => {
      return discoveryRef.current.getBestConnectionMethod(deviceId);
    },
    []
  );

  /**
   * Get device by ID
   */
  const getDevice = useCallback((deviceId: string): UnifiedDevice | undefined => {
    return discoveryRef.current.getDevice(deviceId);
  }, []);

  /**
   * Advertise this device
   */
  const advertise = useCallback(() => {
    discoveryRef.current.advertise();
  }, []);

  /**
   * Stop advertising
   */
  const stopAdvertising = useCallback(() => {
    discoveryRef.current.stopAdvertising();
  }, []);

  // Subscribe to device changes
  useEffect(() => {
    const discovery = discoveryRef.current;

    const unsubscribe = discovery.onDevicesChanged((allDevices) => {
      setDevices(filterDevices(allDevices));
      updateStatus();
    });

    return unsubscribe;
  }, [filterDevices, updateStatus]);

  // Auto-start discovery
  useEffect(() => {
    if (opts.autoStart) {
      startDiscovery();
    }

    return () => {
      // Don't stop discovery on unmount as other components may use it
      // The singleton will be cleaned up when the app closes
    };
  }, [opts.autoStart, startDiscovery]);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  return {
    devices,
    isDiscovering,
    isMdnsAvailable,
    isSignalingConnected,
    mdnsDeviceCount,
    signalingDeviceCount,
    startDiscovery,
    stopDiscovery,
    refresh,
    getBestConnectionMethod,
    getDevice,
    advertise,
    stopAdvertising,
    error,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook that only uses mDNS discovery (requires local daemon)
 */
export function useMdnsDiscovery(options: Omit<UseUnifiedDiscoveryOptions, 'enableSignaling'> = {}) {
  return useUnifiedDiscovery({
    ...options,
    enableSignaling: false,
    sourceFilter: 'mdns',
  });
}

/**
 * Hook that only uses signaling discovery (works everywhere)
 */
export function useSignalingDiscovery(options: Omit<UseUnifiedDiscoveryOptions, 'enableMdns'> = {}) {
  return useUnifiedDiscovery({
    ...options,
    enableMdns: false,
    sourceFilter: 'signaling',
  });
}

/**
 * Hook to check if mDNS daemon is available
 */
export function useMdnsStatus() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');
        const available = await isDaemonAvailable();
        if (!cancelled) {
          setIsAvailable(available);
          setIsChecking(false);
        }
      } catch {
        if (!cancelled) {
          setIsAvailable(false);
          setIsChecking(false);
        }
      }
    }

    check();

    // Re-check periodically
    const interval = setInterval(check, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { isAvailable, isChecking };
}

export default useUnifiedDiscovery;
