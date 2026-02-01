'use client';

/**
 * React Hook for NAT Type Detection
 *
 * Provides easy integration of NAT detection in React components
 * for optimizing WebRTC connection strategies.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  detectNATType,
  getConnectionStrategy,
  getOptimizedICEConfig,
  clearNATCache,
  getNATTypeDescription,
  isRestrictiveNAT,
  type NATType,
  type NATDetectionResult,
  type NATDetectionOptions,
  type ConnectionStrategyResult,
} from '../network/nat-detection';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

export interface UseNATDetectionOptions extends NATDetectionOptions {
  /** Automatically detect on mount */
  autoDetect?: boolean;
  /** Callback when detection completes */
  onDetected?: (result: NATDetectionResult) => void;
  /** Callback when detection fails */
  onError?: (error: Error) => void;
}

export interface UseNATDetectionResult {
  /** Current NAT detection result */
  result: NATDetectionResult | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Error if detection failed */
  error: Error | null;
  /** Trigger manual detection */
  detect: () => Promise<NATDetectionResult | null>;
  /** Clear cached result and re-detect */
  refresh: () => Promise<NATDetectionResult | null>;
  /** Get connection strategy for a remote peer */
  getStrategy: (remoteNAT: NATType) => ConnectionStrategyResult | null;
  /** Get optimized ICE configuration */
  getICEConfig: (turnServer?: string, turnCredentials?: { username: string; credential: string }) => RTCConfiguration | null;
  /** Human-readable NAT type description */
  description: string | null;
  /** Whether NAT is considered restrictive */
  isRestrictive: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useNATDetection(
  options: UseNATDetectionOptions = {}
): UseNATDetectionResult {
  const {
    autoDetect = true,
    timeout,
    stunServers,
    onDetected,
    onError,
  } = options;

  const [result, setResult] = useState<NATDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const detectionRef = useRef<Promise<NATDetectionResult> | null>(null);

  // Perform NAT detection
  const detect = useCallback(async (): Promise<NATDetectionResult | null> => {
    // Avoid duplicate concurrent detections
    if (detectionRef.current) {
      return detectionRef.current;
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Only pass defined options
      const detectionOptions: NATDetectionOptions = {};
      if (timeout !== undefined) {
        detectionOptions.timeout = timeout;
      }
      if (stunServers !== undefined) {
        detectionOptions.stunServers = stunServers;
      }

      const detectionPromise = detectNATType(detectionOptions);
      detectionRef.current = detectionPromise;

      const detectionResult = await detectionPromise;

      if (mountedRef.current) {
        setResult(detectionResult);
        setIsDetecting(false);
        onDetected?.(detectionResult);
      }

      return detectionResult;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));

      if (mountedRef.current) {
        setError(errorObj);
        setIsDetecting(false);
        onError?.(errorObj);
      }

      secureLog.error('[useNATDetection] Detection failed:', err);
      return null;
    } finally {
      detectionRef.current = null;
    }
  }, [timeout, stunServers, onDetected, onError]);

  // Clear cache and re-detect
  const refresh = useCallback(async (): Promise<NATDetectionResult | null> => {
    clearNATCache();
    return detect();
  }, [detect]);

  // Get connection strategy for remote peer
  const getStrategy = useCallback(
    (remoteNAT: NATType): ConnectionStrategyResult | null => {
      if (!result) {return null;}
      return getConnectionStrategy(result.type, remoteNAT);
    },
    [result]
  );

  // Get optimized ICE configuration
  const getICEConfig = useCallback(
    (
      turnServer?: string,
      turnCredentials?: { username: string; credential: string }
    ): RTCConfiguration | null => {
      if (!result) {return null;}
      return getOptimizedICEConfig(result.type, turnServer, turnCredentials);
    },
    [result]
  );

  // Auto-detect on mount if enabled
  useEffect(() => {
    mountedRef.current = true;

    if (autoDetect) {
      detect();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoDetect, detect]);

  // Derived values
  const description = result ? getNATTypeDescription(result.type) : null;
  const isRestrictive = result ? isRestrictiveNAT(result.type) : false;

  return {
    result,
    isDetecting,
    error,
    detect,
    refresh,
    getStrategy,
    getICEConfig,
    description,
    isRestrictive,
  };
}

// ============================================================================
// Peer Connection Strategy Hook
// ============================================================================

export interface UsePeerConnectionStrategyOptions {
  /** Local NAT detection result */
  localNAT?: NATDetectionResult | null;
  /** Remote peer's NAT type (received via signaling) */
  remoteNAT?: NATType;
  /** TURN server URL */
  turnServer?: string;
  /** TURN credentials */
  turnCredentials?: { username: string; credential: string };
}

export interface UsePeerConnectionStrategyResult {
  /** Recommended connection strategy */
  strategy: ConnectionStrategyResult | null;
  /** Optimized ICE configuration */
  iceConfig: RTCConfiguration | null;
  /** Whether to use TURN relay */
  useTURN: boolean;
  /** Timeout for direct connection attempts */
  directTimeout: number;
  /** Whether connection is ready to be established */
  isReady: boolean;
}

export function usePeerConnectionStrategy(
  options: UsePeerConnectionStrategyOptions = {}
): UsePeerConnectionStrategyResult {
  const { localNAT, remoteNAT, turnServer, turnCredentials } = options;

  const [strategy, setStrategy] = useState<ConnectionStrategyResult | null>(null);
  const [iceConfig, setIceConfig] = useState<RTCConfiguration | null>(null);

  useEffect(() => {
    if (!localNAT || !remoteNAT) {
      setStrategy(null);
      setIceConfig(null);
      return;
    }

    // Calculate strategy
    const newStrategy = getConnectionStrategy(localNAT.type, remoteNAT);
    setStrategy(newStrategy);

    // Generate optimized ICE config
    const newConfig = getOptimizedICEConfig(
      localNAT.type,
      turnServer,
      turnCredentials
    );
    setIceConfig(newConfig);

    secureLog.log('[usePeerConnectionStrategy] Strategy calculated', {
      local: localNAT.type,
      remote: remoteNAT,
      strategy: newStrategy.strategy,
      reason: newStrategy.reason,
    });
  }, [localNAT, remoteNAT, turnServer, turnCredentials]);

  return {
    strategy,
    iceConfig,
    useTURN: strategy?.useTURN ?? false,
    directTimeout: strategy?.directTimeout ?? 15000,
    isReady: !!(strategy && iceConfig),
  };
}

export default useNATDetection;
