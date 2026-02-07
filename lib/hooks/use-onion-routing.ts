/**
 * React Hooks for Onion Routing Integration
 *
 * Provides React hooks for managing onion routing circuits and
 * configuration in the TALLOW application.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    OnionRoutingManager,
    OnionRoutingConfig,
    OnionRoutingMode,
    OnionRoutingStats,
    RelayNode,
    getOnionRoutingManager,
    ONION_ROUTING_STATUS,
} from '@/lib/transport/onion-routing-integration';
import {
    getOnionRoutingStatus,
    OnionRoutingStatus,
} from '@/lib/transport/onion-routing';

// ============================================================================
// Types
// ============================================================================

export interface UseOnionRoutingResult {
    /** Whether onion routing is available */
    isAvailable: boolean;
    /** Feature status for UI display */
    featureStatus: typeof ONION_ROUTING_STATUS;
    /** Whether the system is initialized */
    isInitialized: boolean;
    /** Whether operations are loading */
    isLoading: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Current configuration */
    config: OnionRoutingConfig | null;
    /** Routing statistics */
    stats: OnionRoutingStats | null;
    /** Available relay nodes */
    relayNodes: RelayNode[];
    /** Active transfer paths */
    activePaths: Map<string, string[]>;
    /** Update configuration */
    updateConfig: (config: Partial<OnionRoutingConfig>) => void;
    /** Route data through onion network */
    routeData: (transferId: string, data: ArrayBuffer, destination: string) => Promise<void>;
    /** Select a relay path */
    selectPath: (numHops?: number) => Promise<RelayNode[]>;
    /** Refresh relay list */
    refreshRelays: () => Promise<void>;
    /** Close a transfer circuit */
    closeCircuit: (transferId: string) => void;
    /** System status */
    systemStatus: OnionRoutingStatus;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for onion routing manager
 */
export function useOnionRouting(
    initialConfig?: Partial<OnionRoutingConfig>
): UseOnionRoutingResult {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [config, setConfig] = useState<OnionRoutingConfig | null>(null);
    const [stats, setStats] = useState<OnionRoutingStats | null>(null);
    const [relayNodes, setRelayNodes] = useState<RelayNode[]>([]);
    const [activePaths, setActivePaths] = useState<Map<string, string[]>>(new Map());
    const [systemStatus, setSystemStatus] = useState<OnionRoutingStatus>(getOnionRoutingStatus());

    const managerRef = useRef<OnionRoutingManager | null>(null);

    // Memoize feature status
    const featureStatus = useMemo(() => {
        const status = getOnionRoutingStatus();
        return {
            available: status.available as true,
            status: status.status as 'ready',
            label: (status.available ? 'Ready' : 'Unavailable') as 'Ready',
            message: status.message as typeof ONION_ROUTING_STATUS.message,
        };
        // Note: systemStatus triggers recalculation when it changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemStatus.available, systemStatus.status]);

    // Check availability
    const isAvailable = useMemo(() => {
        return systemStatus.available;
    }, [systemStatus]);

    // Initialize manager
    useEffect(() => {
        let mounted = true;

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

                if (!mounted) {return;}

                const currentConfig = manager.getConfig();
                setConfig(currentConfig);
                setStats(manager.getStats());
                setRelayNodes(manager.getRelayNodes());
                setActivePaths(manager.getActivePaths());
                setSystemStatus(getOnionRoutingStatus());
                setIsInitialized(true);

                // Set up event listeners
                const handleConfigUpdated = (newConfig: OnionRoutingConfig) => {
                    if (mounted) {setConfig(newConfig);}
                };

                const handleRelaysUpdated = (nodes: RelayNode[]) => {
                    if (mounted) {
                        setRelayNodes(nodes);
                        setSystemStatus(getOnionRoutingStatus());
                    }
                };

                const handleTransferComplete = () => {
                    if (mounted && managerRef.current) {
                        setStats(managerRef.current.getStats());
                        setActivePaths(managerRef.current.getActivePaths());
                    }
                };

                const handleTransferFailed = (data: { error: Error }) => {
                    if (mounted) {
                        setError(data.error);
                        if (managerRef.current) {
                            setStats(managerRef.current.getStats());
                        }
                    }
                };

                const handleError = (err: Error) => {
                    if (mounted) {setError(err);}
                };

                manager.on('configUpdated', handleConfigUpdated);
                manager.on('relaysUpdated', handleRelaysUpdated);
                manager.on('transferComplete', handleTransferComplete);
                manager.on('transferFailed', handleTransferFailed);
                manager.on('error', handleError);
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err : new Error('Failed to initialize onion routing'));
                    setSystemStatus(getOnionRoutingStatus());
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initManager();

        return () => {
            mounted = false;
        };
        // Only run on mount - initialConfig is used once for initialization
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update configuration
    const updateConfig = useCallback((newConfig: Partial<OnionRoutingConfig>) => {
        if (managerRef.current) {
            managerRef.current.updateConfig(newConfig);
            const updatedConfig = managerRef.current.getConfig();
            setConfig(updatedConfig);
            setSystemStatus(getOnionRoutingStatus());
        }
    }, []);

    // Route data through onion network
    const routeData = useCallback(
        async (transferId: string, data: ArrayBuffer, destination: string): Promise<void> => {
            if (!managerRef.current) {
                throw new Error('Onion routing not initialized');
            }

            setError(null);

            try {
                await managerRef.current.routeThroughOnion(transferId, data, destination);
                setStats(managerRef.current.getStats());
                setActivePaths(managerRef.current.getActivePaths());
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Routing failed');
                setError(error);
                throw error;
            }
        },
        []
    );

    // Select relay path
    const selectPath = useCallback(async (numHops?: number): Promise<RelayNode[]> => {
        if (!managerRef.current) {
            throw new Error('Onion routing not initialized');
        }

        try {
            const path = await managerRef.current.selectRelayPath(numHops);
            return path;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to select path'));
            throw err;
        }
    }, []);

    // Refresh relays
    const refreshRelays = useCallback(async (): Promise<void> => {
        if (!managerRef.current) {
            return;
        }

        setIsLoading(true);
        try {
            await managerRef.current.refreshRelays();
            const nodes = managerRef.current.getRelayNodes();
            setRelayNodes(nodes);
            setSystemStatus(getOnionRoutingStatus());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to refresh relays'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Close circuit
    const closeCircuit = useCallback((transferId: string): void => {
        if (managerRef.current) {
            managerRef.current.closeTransferCircuit(transferId);
            setStats(managerRef.current.getStats());
            setActivePaths(managerRef.current.getActivePaths());
        }
    }, []);

    return {
        isAvailable,
        featureStatus,
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
        refreshRelays,
        closeCircuit,
        systemStatus,
    };
}

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook for onion routing mode toggle
 */
export function useOnionRoutingMode() {
    const { config, updateConfig, isAvailable } = useOnionRouting();
    const [mode, setMode] = useState<OnionRoutingMode>(config?.mode || 'disabled');

    useEffect(() => {
        if (config) {
            setMode(config.mode);
        }
    }, [config]);

    const toggleMode = useCallback(
        (newMode: OnionRoutingMode) => {
            if (!isAvailable && newMode !== 'disabled') {
                console.warn('Onion routing is not available');
                return;
            }

            setMode(newMode);
            updateConfig({ mode: newMode });
        },
        [updateConfig, isAvailable]
    );

    const enableMultiHop = useCallback(() => {
        toggleMode('multi-hop');
    }, [toggleMode]);

    const enableSingleHop = useCallback(() => {
        toggleMode('single-hop');
    }, [toggleMode]);

    const disable = useCallback(() => {
        toggleMode('disabled');
    }, [toggleMode]);

    return {
        mode,
        toggleMode,
        enableMultiHop,
        enableSingleHop,
        disable,
        isAvailable,
    };
}

/**
 * Hook for relay node selection
 */
export function useRelaySelection() {
    const { relayNodes, selectPath, refreshRelays, isLoading } = useOnionRouting();
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

    const clearSelection = useCallback(() => {
        setSelectedNodes([]);
    }, []);

    return {
        relayNodes,
        selectedNodes,
        isSelecting: isSelecting || isLoading,
        selectOptimalPath,
        clearSelection,
        refreshRelays,
    };
}

/**
 * Hook for onion routing statistics
 */
export function useOnionStats() {
    const { stats, systemStatus } = useOnionRouting();

    const successRate = useMemo(() => {
        if (!stats || stats.totalTransfers === 0) {return 0;}
        return (stats.successfulTransfers / stats.totalTransfers) * 100;
    }, [stats]);

    const failureRate = useMemo(() => {
        if (!stats || stats.totalTransfers === 0) {return 0;}
        return (stats.failedTransfers / stats.totalTransfers) * 100;
    }, [stats]);

    const formattedBytesTransferred = useMemo(() => {
        if (!stats) {return '0 B';}
        const bytes = stats.bytesTransferred;
        if (bytes < 1024) {return `${bytes} B`;}
        if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(2)} KB`;}
        if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;}
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }, [stats]);

    return {
        stats,
        successRate,
        failureRate,
        formattedBytesTransferred,
        systemStatus,
        activeRelays: systemStatus.relayCount,
        activeCircuits: systemStatus.circuitCount,
    };
}

/**
 * Hook for circuit management
 */
export function useCircuitManagement() {
    const { activePaths, closeCircuit, stats } = useOnionRouting();

    const activeCircuitIds = useMemo(() => {
        return Array.from(activePaths.keys());
    }, [activePaths]);

    const getCircuitPath = useCallback(
        (transferId: string): string[] | undefined => {
            return activePaths.get(transferId);
        },
        [activePaths]
    );

    const closeAllCircuits = useCallback(() => {
        for (const transferId of activeCircuitIds) {
            closeCircuit(transferId);
        }
    }, [activeCircuitIds, closeCircuit]);

    return {
        activePaths,
        activeCircuitIds,
        circuitCount: stats?.circuitsActive ?? 0,
        getCircuitPath,
        closeCircuit,
        closeAllCircuits,
    };
}
