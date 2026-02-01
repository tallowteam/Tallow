'use client';

/**
 * React Hook for Group Discovery and Connection
 * Manages device discovery, selection, and connection for group transfers
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    getGroupDiscoveryManager,
    GroupDiscoveryOptions,
    GroupDiscoveryResult,
    DiscoveredDeviceWithChannel,
} from '../discovery/group-discovery-manager';
import { getLocalDiscovery, DiscoveredDevice } from '../discovery/local-discovery';
import secureLog from '../utils/secure-logger';

export interface GroupDiscoveryState {
    isDiscovering: boolean;
    isConnecting: boolean;
    discoveredDevices: DiscoveredDevice[];
    selectedDevices: DiscoveredDevice[];
    connectedDevices: DiscoveredDeviceWithChannel[];
    connectionResult: GroupDiscoveryResult | null;
    error: string | null;
}

export interface UseGroupDiscoveryOptions {
    autoStart?: boolean;
    discoveryOptions?: GroupDiscoveryOptions;
    onDevicesDiscovered?: (devices: DiscoveredDevice[]) => void;
    onConnectionComplete?: (result: GroupDiscoveryResult) => void;
    onDeviceConnected?: (device: DiscoveredDevice) => void;
    onDeviceFailed?: (device: DiscoveredDevice, error: string) => void;
}

/**
 * Hook for discovering and connecting to multiple devices for group transfers
 */
export function useGroupDiscovery(options: UseGroupDiscoveryOptions = {}) {
    const {
        autoStart = false,
        discoveryOptions = {},
        onDevicesDiscovered,
        onConnectionComplete,
        onDeviceConnected,
        onDeviceFailed,
    } = options;

    const [state, setState] = useState<GroupDiscoveryState>({
        isDiscovering: false,
        isConnecting: false,
        discoveredDevices: [],
        selectedDevices: [],
        connectedDevices: [],
        connectionResult: null,
        error: null,
    });

    const managerRef = useRef(getGroupDiscoveryManager());
    const discoveryRef = useRef(getLocalDiscovery());
    const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Start device discovery
     */
    const startDiscovery = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            isDiscovering: true,
            error: null,
        }));

        try {
            // Start local discovery
            discoveryRef.current.start();

            // Wait for initial device discovery
            const devices = await managerRef.current.discoverGroupTransferDevices(discoveryOptions);

            setState((prev) => ({
                ...prev,
                isDiscovering: false,
                discoveredDevices: devices,
            }));

            onDevicesDiscovered?.(devices);
        } catch (error) {
            const errorMsg = (error as Error).message;
            setState((prev) => ({
                ...prev,
                isDiscovering: false,
                error: errorMsg,
            }));

            secureLog.error('[useGroupDiscovery] Discovery failed:', error);
        }
    }, [discoveryOptions, onDevicesDiscovered]);

    /**
     * Refresh device list
     */
    const refreshDevices = useCallback(() => {
        discoveryRef.current.refresh();
        startDiscovery();
    }, [startDiscovery]);

    /**
     * Select device for group transfer
     */
    const selectDevice = useCallback((device: DiscoveredDevice) => {
        setState((prev) => {
            const isAlreadySelected = prev.selectedDevices.some((d) => d.id === device.id);
            if (isAlreadySelected) {
                return prev;
            }

            return {
                ...prev,
                selectedDevices: [...prev.selectedDevices, device],
            };
        });
    }, []);

    /**
     * Deselect device
     */
    const deselectDevice = useCallback((deviceId: string) => {
        setState((prev) => ({
            ...prev,
            selectedDevices: prev.selectedDevices.filter((d) => d.id !== deviceId),
        }));
    }, []);

    /**
     * Select all devices
     */
    const selectAllDevices = useCallback(() => {
        setState((prev) => ({
            ...prev,
            selectedDevices: [...prev.discoveredDevices],
        }));
    }, []);

    /**
     * Clear selection
     */
    const clearSelection = useCallback(() => {
        setState((prev) => ({
            ...prev,
            selectedDevices: [],
        }));
    }, []);

    /**
     * Connect to selected devices
     */
    const connectToSelectedDevices = useCallback(
        async (timeout: number = 30000) => {
            if (state.selectedDevices.length === 0) {
                setState((prev) => ({
                    ...prev,
                    error: 'No devices selected',
                }));
                return null;
            }

            setState((prev) => ({
                ...prev,
                isConnecting: true,
                error: null,
            }));

            try {
                // Validate devices first
                const validation = managerRef.current.validateDevicesForGroupTransfer(
                    state.selectedDevices
                );

                if (validation.invalid.length > 0) {
                    validation.invalid.forEach(({ device, reason }) => {
                        onDeviceFailed?.(device, reason);
                    });
                }

                if (validation.valid.length === 0) {
                    throw new Error('No valid devices to connect');
                }

                // Connect to valid devices
                const result = await managerRef.current.connectToDevices(validation.valid, {
                    timeout,
                });

                setState((prev) => ({
                    ...prev,
                    isConnecting: false,
                    connectedDevices: result.devices,
                    connectionResult: result,
                }));

                // Notify for each connected device
                result.devices.forEach((device) => {
                    onDeviceConnected?.(device);
                });

                onConnectionComplete?.(result);

                return result;
            } catch (error) {
                const errorMsg = (error as Error).message;
                setState((prev) => ({
                    ...prev,
                    isConnecting: false,
                    error: errorMsg,
                }));

                secureLog.error('[useGroupDiscovery] Connection failed:', error);
                return null;
            }
        },
        [state.selectedDevices, onConnectionComplete, onDeviceConnected, onDeviceFailed]
    );

    /**
     * Disconnect from all devices
     */
    const disconnectAll = useCallback(() => {
        managerRef.current.closeAllConnections();

        setState((prev) => ({
            ...prev,
            connectedDevices: [],
            connectionResult: null,
        }));
    }, []);

    /**
     * Mark transfer complete for device
     */
    const markTransferComplete = useCallback(
        async (deviceId: string, success: boolean, bytesSent: number = 0) => {
            await managerRef.current.markTransferComplete(deviceId, success, bytesSent);
        },
        []
    );

    /**
     * Auto-start discovery
     */
    useEffect(() => {
        if (autoStart) {
            startDiscovery();
        }

        return () => {
            // Don't stop discovery on unmount to allow persistent discovery
        };
    }, [autoStart, startDiscovery]);

    /**
     * Update device list periodically
     */
    useEffect(() => {
        if (state.isDiscovering) {
            updateIntervalRef.current = setInterval(() => {
                const devices = discoveryRef.current.getGroupTransferCapableDevices();
                setState((prev) => ({
                    ...prev,
                    discoveredDevices: devices,
                }));
            }, 1000); // Update every second

            return () => {
                if (updateIntervalRef.current) {
                    clearInterval(updateIntervalRef.current);
                    updateIntervalRef.current = null;
                }
            };
        }

        return undefined;
    }, [state.isDiscovering]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }
            // Don't destroy manager to allow reuse
        };
    }, []);

    return {
        // State
        ...state,

        // Computed
        hasSelectedDevices: state.selectedDevices.length > 0,
        hasConnectedDevices: state.connectedDevices.length > 0,
        selectedCount: state.selectedDevices.length,
        connectedCount: state.connectedDevices.length,

        // Actions
        startDiscovery,
        refreshDevices,
        selectDevice,
        deselectDevice,
        selectAllDevices,
        clearSelection,
        connectToSelectedDevices,
        disconnectAll,
        markTransferComplete,

        // Utilities
        isDeviceSelected: (deviceId: string) =>
            state.selectedDevices.some((d) => d.id === deviceId),
        isDeviceConnected: (deviceId: string) =>
            state.connectedDevices.some((d) => d.id === deviceId),
        getDeviceById: (deviceId: string) =>
            state.discoveredDevices.find((d) => d.id === deviceId),
    };
}
