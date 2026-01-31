/**
 * React Hooks for Onion Routing Integration
 *
 * WARNING: Onion routing is EXPERIMENTAL and NOT FUNCTIONAL.
 * These hooks will work for configuration UI purposes but actual
 * routing operations will fail because the relay network does not exist.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  OnionRoutingManager,
  OnionRoutingConfig,
  OnionRoutingMode,
  OnionRoutingStats,
  RelayNode,
  getOnionRoutingManager,
  isOnionRoutingAvailable,
  ONION_ROUTING_STATUS,
  OnionRoutingNotImplementedError,
} from '@/lib/transport/onion-routing-integration';

/**
 * Hook for onion routing manager
 *
 * WARNING: Onion routing is EXPERIMENTAL and NOT FUNCTIONAL.
 * The isAvailable property will always be false until the relay
 * network infrastructure is implemented.
 */
export function useOnionRouting(initialConfig?: Partial<OnionRoutingConfig>) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<OnionRoutingConfig | null>(null);
  const [stats, setStats] = useState<OnionRoutingStats | null>(null);
  const [relayNodes, setRelayNodes] = useState<RelayNode[]>([]);
  const [activePaths, setActivePaths] = useState<Map<string, string[]>>(new Map());

  // Feature availability - always false until relay network is implemented
  const isAvailable = isOnionRoutingAvailable();
  const featureStatus = ONION_ROUTING_STATUS;

  const managerRef = useRef<OnionRoutingManager | null>(null);

  // Initialize manager
  useEffect(() => {
    const initManager = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const manager = getOnionRoutingManager();
        managerRef.current = manager;

        if (initialConfig) {
          manager.updateConfig(initialConfig);
        }

        await manager.initialize();

        setConfig(manager.getConfig());
        setStats(manager.getStats());
        setRelayNodes(manager.getRelayNodes());
        setActivePaths(manager.getActivePaths());
        setIsInitialized(true);

        // Event listeners
        manager.on('configUpdated', (newConfig) => {
          setConfig(newConfig);
        });

        manager.on('relaysUpdated', (nodes) => {
          setRelayNodes(nodes);
        });

        manager.on('transferComplete', () => {
          setStats(manager.getStats());
          setActivePaths(manager.getActivePaths());
        });

        manager.on('transferFailed', (data) => {
          setError(data.error);
          setStats(manager.getStats());
        });

        manager.on('error', (err) => {
          setError(err);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
      } finally {
        setIsLoading(false);
      }
    };

    initManager();

    return () => {
      if (managerRef.current) {
        managerRef.current.removeAllListeners();
      }
    };
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<OnionRoutingConfig>) => {
    if (managerRef.current) {
      managerRef.current.updateConfig(newConfig);
      setConfig(managerRef.current.getConfig());
    }
  }, []);

  // Route data through onion network
  // WARNING: This will always fail - feature is not functional
  const routeData = useCallback(
    async (_transferId: string, _data: ArrayBuffer, _destination: string): Promise<never> => {
      // CRITICAL: Always throw error - feature is not available
      const err = new OnionRoutingNotImplementedError('routeData');
      setError(err);
      throw err;
    },
    []
  );

  // Select relay path
  const selectPath = useCallback(async (numHops?: number) => {
    if (!managerRef.current) {
      throw new Error('Onion routing not initialized');
    }

    try {
      return await managerRef.current.selectRelayPath(numHops);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to select path'));
      throw err;
    }
  }, []);

  return {
    // Feature availability status
    isAvailable,
    featureStatus,
    // Initialization state
    isInitialized,
    isLoading,
    error,
    config,
    stats,
    relayNodes,
    activePaths,
    updateConfig,
    routeData,
    selectPath,
  };
}

/**
 * Hook for onion routing mode toggle
 */
export function useOnionRoutingMode() {
  const [mode, setMode] = useState<OnionRoutingMode>('disabled');
  const { updateConfig } = useOnionRouting();

  const toggleMode = useCallback(
    (newMode: OnionRoutingMode) => {
      setMode(newMode);
      updateConfig({ mode: newMode });
    },
    [updateConfig]
  );

  return {
    mode,
    toggleMode,
  };
}

/**
 * Hook for relay node selection
 */
export function useRelaySelection() {
  const { relayNodes, selectPath } = useOnionRouting();
  const [selectedNodes, setSelectedNodes] = useState<RelayNode[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const selectOptimalPath = useCallback(
    async (numHops: number = 3) => {
      setIsSelecting(true);
      try {
        const path = await selectPath(numHops);
        setSelectedNodes(path);
        return path;
      } finally {
        setIsSelecting(false);
      }
    },
    [selectPath]
  );

  return {
    relayNodes,
    selectedNodes,
    isSelecting,
    selectOptimalPath,
  };
}

/**
 * Hook for onion routing statistics
 */
export function useOnionStats() {
  const { stats } = useOnionRouting();

  const successRate = stats
    ? stats.totalTransfers > 0
      ? (stats.successfulTransfers / stats.totalTransfers) * 100
      : 0
    : 0;

  const failureRate = stats
    ? stats.totalTransfers > 0
      ? (stats.failedTransfers / stats.totalTransfers) * 100
      : 0
    : 0;

  return {
    stats,
    successRate,
    failureRate,
  };
}
