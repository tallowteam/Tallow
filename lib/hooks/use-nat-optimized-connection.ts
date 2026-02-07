'use client';

/**
 * NAT-Optimized Connection Hook
 *
 * React hook for establishing WebRTC connections with intelligent
 * NAT traversal optimization:
 * - Automatic NAT type detection
 * - Adaptive connection strategy selection
 * - TURN server health monitoring
 * - Success rate tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { detectNATType, getOptimizedICEConfig, type NATType, type NATDetectionResult } from '../network/nat-detection';
import { getStrategySelector, type AdaptiveStrategyResult } from '../network/connection-strategy';
import { getTURNHealthMonitor, createDefaultTURNConfig, type TURNServer } from '../network/turn-health';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface NATOptimizedConnectionState {
  // NAT Detection
  localNAT: NATType | null;
  localNATResult: NATDetectionResult | null;
  remoteNAT: NATType | null;
  natDetecting: boolean;
  natDetectionError: string | null;

  // Connection Strategy
  strategy: AdaptiveStrategyResult | null;
  recommendedTimeout: number;
  estimatedConnectionTime: number;
  shouldUseTURN: boolean;

  // TURN Server Health
  bestTURNServer: TURNServer | null;
  turnHealthy: boolean;
  turnMonitoring: boolean;

  // Connection State
  connecting: boolean;
  connected: boolean;
  connectionError: string | null;
  connectionType: 'direct' | 'relayed' | 'unknown';
  connectionTime: number | null;
}

export interface UseNATOptimizedConnectionOptions {
  autoDetectNAT?: boolean; // Auto-detect NAT on mount
  enableTURNHealth?: boolean; // Enable TURN health monitoring
  remoteNATType?: NATType; // Remote peer's NAT type if known
  onNATDetected?: (result: NATDetectionResult) => void;
  onStrategySelected?: (strategy: AdaptiveStrategyResult) => void;
  onConnectionSuccess?: (connectionTime: number, connectionType: string) => void;
  onConnectionFailure?: (error: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useNATOptimizedConnection(options: UseNATOptimizedConnectionOptions = {}) {
  const {
    autoDetectNAT = true,
    enableTURNHealth = true,
    remoteNATType: initialRemoteNAT = null,
    onNATDetected,
    onStrategySelected,
    onConnectionSuccess,
    onConnectionFailure,
  } = options;

  // State
  const [state, setState] = useState<NATOptimizedConnectionState>({
    localNAT: null,
    localNATResult: null,
    remoteNAT: initialRemoteNAT,
    natDetecting: false,
    natDetectionError: null,
    strategy: null,
    recommendedTimeout: 15000,
    estimatedConnectionTime: 0,
    shouldUseTURN: false,
    bestTURNServer: null,
    turnHealthy: false,
    turnMonitoring: false,
    connecting: false,
    connected: false,
    connectionError: null,
    connectionType: 'unknown',
    connectionTime: null,
  });

  // Refs
  const strategySelector = useRef(getStrategySelector());
  const turnMonitor = useRef<ReturnType<typeof getTURNHealthMonitor> | null>(null);
  const connectionAttemptId = useRef<string | null>(null);

  /**
   * Detect local NAT type
   */
  const detectLocalNAT = useCallback(async () => {
    setState(prev => ({ ...prev, natDetecting: true, natDetectionError: null }));

    try {
      const result = await detectNATType();

      setState(prev => ({
        ...prev,
        localNAT: result.type,
        localNATResult: result,
        natDetecting: false,
      }));

      onNATDetected?.(result);

      secureLog.log('[NAT Hook] Local NAT detected:', result.type);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'NAT detection failed';

      setState(prev => ({
        ...prev,
        natDetecting: false,
        natDetectionError: errorMsg,
      }));

      secureLog.error('[NAT Hook] NAT detection failed:', error);

      return null;
    }
  }, [onNATDetected]);

  /**
   * Update remote NAT type
   */
  const setRemoteNAT = useCallback((natType: NATType) => {
    setState(prev => ({ ...prev, remoteNAT: natType }));
    secureLog.log('[NAT Hook] Remote NAT set:', natType);
  }, []);

  /**
   * Calculate optimal connection strategy
   */
  const calculateStrategy = useCallback((localNAT: NATType | null, remoteNAT: NATType | null) => {
    if (!localNAT || !remoteNAT) {
      secureLog.warn('[NAT Hook] Cannot calculate strategy: missing NAT info');
      return null;
    }

    const strategy = strategySelector.current.getStrategy(localNAT, remoteNAT);

    setState(prev => ({
      ...prev,
      strategy,
      recommendedTimeout: strategy.directTimeout,
      estimatedConnectionTime: strategy.estimatedConnectionTime,
      shouldUseTURN: strategy.useTURN,
    }));

    onStrategySelected?.(strategy);

    secureLog.log('[NAT Hook] Strategy calculated:', strategy.strategy);

    return strategy;
  }, [onStrategySelected]);

  /**
   * Initialize TURN health monitoring
   */
  const initializeTURNMonitoring = useCallback(() => {
    if (!enableTURNHealth) {return;}

    try {
      const config = createDefaultTURNConfig();

      if (config.servers.length === 0) {
        secureLog.warn('[NAT Hook] No TURN servers configured');
        return;
      }

      if (!turnMonitor.current) {
        turnMonitor.current = getTURNHealthMonitor(config);
      }

      turnMonitor.current.start();

      setState(prev => ({ ...prev, turnMonitoring: true }));

      // Update best server periodically
      const updateBestServer = () => {
        if (!turnMonitor.current) {return;}

        const bestServer = turnMonitor.current.getBestServer();
        const stats = turnMonitor.current.getStatistics();

        setState(prev => ({
          ...prev,
          bestTURNServer: bestServer,
          turnHealthy: stats.healthy > 0,
        }));
      };

      updateBestServer();
      const interval = setInterval(updateBestServer, 30000); // Update every 30s

      secureLog.log('[NAT Hook] TURN monitoring initialized');

      return () => {
        clearInterval(interval);
        turnMonitor.current?.stop();
      };
    } catch (error) {
      secureLog.error('[NAT Hook] TURN monitoring init failed:', error);
      return undefined;
    }
  }, [enableTURNHealth]);

  /**
   * Get optimized ICE configuration
   */
  const getICEConfig = useCallback((localNAT: NATType | null, bestTURNServer: TURNServer | null): RTCConfiguration | null => {
    if (!localNAT) {
      secureLog.warn('[NAT Hook] Cannot get ICE config: NAT not detected');
      return null;
    }

    let turnServer: string | undefined;
    let turnCredentials: { username: string; credential: string } | undefined;

    if (bestTURNServer) {
      const urls = Array.isArray(bestTURNServer.urls)
        ? bestTURNServer.urls[0]
        : bestTURNServer.urls;

      turnServer = urls;

      if (bestTURNServer.username && bestTURNServer.credential) {
        turnCredentials = {
          username: bestTURNServer.username,
          credential: bestTURNServer.credential,
        };
      }
    }

    return getOptimizedICEConfig(localNAT, turnServer, turnCredentials);
  }, []);

  /**
   * Record connection attempt start
   */
  const startConnectionAttempt = useCallback((
    localNAT: NATType | null,
    remoteNAT: NATType | null,
    strategy: AdaptiveStrategyResult | null,
    shouldUseTURN: boolean
  ) => {
    if (!localNAT || !remoteNAT || !strategy) {
      secureLog.warn('[NAT Hook] Cannot start connection: missing info');
      return;
    }

    connectionAttemptId.current = strategySelector.current.startAttempt(
      strategy.strategy,
      localNAT,
      remoteNAT,
      shouldUseTURN
    );

    setState(prev => ({
      ...prev,
      connecting: true,
      connectionError: null,
      connectionTime: null,
    }));

    secureLog.log('[NAT Hook] Connection attempt started');
  }, []);

  /**
   * Record successful connection
   */
  const recordConnectionSuccess = useCallback((connectionTime: number, connectionType: 'direct' | 'relayed', strategy: AdaptiveStrategyResult | null) => {
    if (!strategy) {return;}

    strategySelector.current.recordSuccess(strategy.strategy, connectionTime);

    setState(prev => ({
      ...prev,
      connecting: false,
      connected: true,
      connectionType,
      connectionTime,
    }));

    onConnectionSuccess?.(connectionTime, connectionType);

    secureLog.log('[NAT Hook] Connection succeeded:', {
      time: `${connectionTime}ms`,
      type: connectionType,
    });
  }, [onConnectionSuccess]);

  /**
   * Record connection failure
   */
  const recordConnectionFailure = useCallback((error: string, strategy: AdaptiveStrategyResult | null) => {
    if (!strategy) {return;}

    strategySelector.current.recordFailure(strategy.strategy, error);

    setState(prev => ({
      ...prev,
      connecting: false,
      connected: false,
      connectionError: error,
    }));

    onConnectionFailure?.(error);

    secureLog.error('[NAT Hook] Connection failed:', error);
  }, [onConnectionFailure]);

  /**
   * Reset connection state
   */
  const resetConnection = useCallback(() => {
    setState(prev => ({
      ...prev,
      connecting: false,
      connected: false,
      connectionError: null,
      connectionType: 'unknown',
      connectionTime: null,
    }));

    connectionAttemptId.current = null;
  }, []);

  /**
   * Get connection quality metrics
   */
  const getMetrics = useCallback(() => {
    return strategySelector.current.getMetrics();
  }, []);

  // Auto-detect NAT on mount
  useEffect(() => {
    if (autoDetectNAT) {
      detectLocalNAT();
    }
  }, [autoDetectNAT, detectLocalNAT]);

  // Initialize TURN monitoring
  useEffect(() => {
    return initializeTURNMonitoring();
  }, [initializeTURNMonitoring]);

  // Calculate strategy when both NAT types are known
  useEffect(() => {
    if (state.localNAT && state.remoteNAT) {
      calculateStrategy(state.localNAT, state.remoteNAT);
    }
  }, [state.localNAT, state.remoteNAT, calculateStrategy]);

  return {
    // State
    ...state,

    // Actions
    detectLocalNAT,
    setRemoteNAT,
    calculateStrategy: () => calculateStrategy(state.localNAT, state.remoteNAT),
    getICEConfig: () => getICEConfig(state.localNAT, state.bestTURNServer),
    startConnectionAttempt: () => startConnectionAttempt(state.localNAT, state.remoteNAT, state.strategy, state.shouldUseTURN),
    recordConnectionSuccess: (connectionTime: number, connectionType: 'direct' | 'relayed') =>
      recordConnectionSuccess(connectionTime, connectionType, state.strategy),
    recordConnectionFailure: (error: string) => recordConnectionFailure(error, state.strategy),
    resetConnection,
    getMetrics,

    // Computed
    isReady: state.localNAT !== null && state.remoteNAT !== null,
    canConnect: state.localNAT !== null && state.remoteNAT !== null && !state.connecting,
  };
}

export default useNATOptimizedConnection;
