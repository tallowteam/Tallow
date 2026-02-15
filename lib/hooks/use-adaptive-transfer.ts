'use client';

/**
 * useAdaptiveTransfer Hook
 * Provides adaptive bitrate control for file transfers with real-time network adaptation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    AdaptiveBitrateController,
    createAdaptiveController,
    TransferMetrics,
    AdaptiveConfig,
} from '@/lib/transfer/adaptive-bitrate';
import {
    isLocalNetwork,
    assessNetworkQuality,
    NetworkQuality,
    onBasicNetworkChange,
} from '@/lib/network/network-interfaces';

export interface AdaptiveTransferState {
    isInitialized: boolean;
    isLAN: boolean;
    chunkSize: number;
    targetBitrate: number;
    concurrency: number;
    networkQuality: NetworkQuality | null;
    stats: {
        averageRTT: number;
        averageLoss: number;
        averageThroughput: number;
        sampleCount: number;
    };
}

export interface AdaptiveTransferActions {
    reportMetrics: (metrics: TransferMetrics) => void;
    reset: () => void;
    setMode: (mode: 'aggressive' | 'balanced' | 'conservative') => void;
}

export function useAdaptiveTransfer(
    targetIP?: string,
    initialMode: 'aggressive' | 'balanced' | 'conservative' = 'balanced'
): [AdaptiveTransferState, AdaptiveTransferActions] {
    const controllerRef = useRef<AdaptiveBitrateController | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLAN, setIsLAN] = useState(false);
    const [config, setConfig] = useState<AdaptiveConfig | null>(null);
    const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
    const [stats, setStats] = useState({
        averageRTT: 0,
        averageLoss: 0,
        averageThroughput: 0,
        sampleCount: 0,
    });

    // Initialize controller
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Detect if we're on local network
                const localNetwork = await isLocalNetwork(targetIP);
                const quality = await assessNetworkQuality();

                if (!mounted) {return;}

                setIsLAN(localNetwork);
                setNetworkQuality(quality);

                // Create controller with detected settings
                const controller = createAdaptiveController(localNetwork, initialMode);

                // Listen for config changes
                controller.onUpdate((newConfig) => {
                    if (mounted) {
                        setConfig(newConfig);
                        setStats(controller.getStats());
                    }
                });

                controllerRef.current = controller;
                setConfig(controller.getConfig());
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize adaptive transfer:', error);
                // Create default controller
                const controller = createAdaptiveController(false, initialMode);
                controllerRef.current = controller;
                setConfig(controller.getConfig());
                setIsInitialized(true);
            }
        };

        init();

        // Listen for network changes
        const cleanup = onBasicNetworkChange(() => {
            init();
        });

        return () => {
            mounted = false;
            cleanup();
        };
    }, [targetIP, initialMode]);

    // Report metrics to controller
    const reportMetrics = useCallback((metrics: TransferMetrics) => {
        controllerRef.current?.reportMetrics(metrics);
    }, []);

    // Reset controller
    const reset = useCallback(() => {
        controllerRef.current?.reset();
        if (controllerRef.current) {
            setConfig(controllerRef.current.getConfig());
            setStats(controllerRef.current.getStats());
        }
    }, []);

    // Change mode
    const setMode = useCallback((mode: 'aggressive' | 'balanced' | 'conservative') => {
        if (controllerRef.current) {
            // Recreate controller with new mode
            const newController = createAdaptiveController(isLAN, mode);
            controllerRef.current = newController;
            setConfig(newController.getConfig());
        }
    }, [isLAN]);

    const state: AdaptiveTransferState = {
        isInitialized,
        isLAN,
        chunkSize: config?.currentChunkSize ?? 64 * 1024,
        targetBitrate: config?.targetBitrate ?? 5 * 1024 * 1024,
        concurrency: config?.concurrency ?? 3,
        networkQuality,
        stats,
    };

    const actions: AdaptiveTransferActions = {
        reportMetrics,
        reset,
        setMode,
    };

    return [state, actions];
}

/**
 * Hook for getting optimal chunk size based on current network conditions
 */
export function useOptimalChunkSize(targetIP?: string): number {
    const [chunkSize, setChunkSize] = useState(64 * 1024);

    useEffect(() => {
        const detectOptimal = async () => {
            const localNet = await isLocalNetwork(targetIP);
            const quality = await assessNetworkQuality();

            if (localNet && quality.grade === 'excellent') {
                setChunkSize(1024 * 1024); // 1MB for excellent LAN
            } else if (localNet) {
                setChunkSize(512 * 1024); // 512KB for LAN
            } else if (quality.grade === 'excellent' || quality.grade === 'good') {
                setChunkSize(128 * 1024); // 128KB for good internet
            } else if (quality.grade === 'fair') {
                setChunkSize(64 * 1024); // 64KB default
            } else {
                setChunkSize(32 * 1024); // 32KB for poor connections
            }
        };

        detectOptimal();
    }, [targetIP]);

    return chunkSize;
}

/**
 * Hook for network quality monitoring
 */
export function useNetworkQuality(): {
    quality: NetworkQuality | null;
    isOnline: boolean;
    connectionType: string;
} {
    const [quality, setQuality] = useState<NetworkQuality | null>(null);
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        let mounted = true;

        const assess = async () => {
            try {
                const q = await assessNetworkQuality();
                if (mounted) {setQuality(q);}
            } catch {
                // Ignore errors
            }
        };

        assess();

        const handleOnline = () => {
            setIsOnline(true);
            assess();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Re-assess periodically
        const interval = setInterval(assess, 30000);

        return () => {
            mounted = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    // Get connection type
    const connection = typeof navigator !== 'undefined'
        ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
        : null;
    const connectionType = connection?.effectiveType ?? 'unknown';

    return { quality, isOnline, connectionType };
}

export default useAdaptiveTransfer;
