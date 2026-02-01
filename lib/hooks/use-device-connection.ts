'use client';

/**
 * @fileoverview Custom hook for managing device connections and discovery
 * @module hooks/use-device-connection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getLocalDiscovery, DiscoveredDevice } from '@/lib/discovery/local-discovery';
import { getDeviceId } from '@/lib/auth/user-identity';

/**
 * Connection type options
 */
export type ConnectionType = 'local' | 'internet' | 'friends' | null;

/**
 * Device connection state interface
 */
export interface DeviceConnectionState {
  /** Current connection type selected */
  connectionType: ConnectionType;
  /** Whether currently connecting to a device */
  isConnecting: boolean;
  /** ID of connected peer device */
  connectedDeviceId: string | null;
  /** Name of connected peer device */
  connectedDeviceName: string | null;
  /** List of discovered local devices */
  discoveredDevices: DiscoveredDevice[];
  /** Connection error message if any */
  connectionError: string | null;
}

/**
 * Options for device connection hook
 */
export interface UseDeviceConnectionOptions {
  /** Enable local device discovery */
  enableDiscovery?: boolean;
  /** Discovery interval in milliseconds */
  discoveryInterval?: number;
  /** Callback when device is discovered */
  onDeviceDiscovered?: (device: DiscoveredDevice) => void;
  /** Callback when connection succeeds */
  onConnectionSuccess?: (deviceId: string, deviceName: string) => void;
  /** Callback when connection fails */
  onConnectionError?: (error: string) => void;
}

/**
 * Custom hook for managing device connections and local network discovery
 *
 * @param {UseDeviceConnectionOptions} options - Configuration options
 * @returns Device connection state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   connectionType,
 *   setConnectionType,
 *   discoveredDevices,
 *   connectToDevice,
 *   disconnect
 * } = useDeviceConnection({
 *   enableDiscovery: true,
 *   onConnectionSuccess: (id, name) => secureLog.log(`Connected to ${name}`)
 * });
 * ```
 */
export function useDeviceConnection(options: UseDeviceConnectionOptions = {}) {
  const {
    enableDiscovery = false,
    discoveryInterval = 5000,
    onDeviceDiscovered,
    onConnectionSuccess,
    onConnectionError
  } = options;

  // State
  const [state, setState] = useState<DeviceConnectionState>({
    connectionType: null,
    isConnecting: false,
    connectedDeviceId: null,
    connectedDeviceName: null,
    discoveredDevices: [],
    connectionError: null
  });

  // Refs for callbacks to avoid stale closures
  const onDeviceDiscoveredRef = useRef(onDeviceDiscovered);
  const onConnectionSuccessRef = useRef(onConnectionSuccess);
  const onConnectionErrorRef = useRef(onConnectionError);

  useEffect(() => {
    onDeviceDiscoveredRef.current = onDeviceDiscovered;
    onConnectionSuccessRef.current = onConnectionSuccess;
    onConnectionErrorRef.current = onConnectionError;
  }, [onDeviceDiscovered, onConnectionSuccess, onConnectionError]);

  // Local discovery setup
  const localDiscovery = useRef(getLocalDiscovery());
  const discoveryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Set the connection type
   *
   * @param {ConnectionType} type - Type of connection to establish
   */
  const setConnectionType = useCallback((type: ConnectionType) => {
    setState(prev => ({ ...prev, connectionType: type, connectionError: null }));
  }, []);

  /**
   * Start local network device discovery
   */
  const startDiscovery = useCallback(() => {
    if (!enableDiscovery) {return;}

    const discovery = localDiscovery.current;

    // Start discovery
    discovery.start();

    // Poll for discovered devices
    const pollDevices = () => {
      const devices = discovery.getDevices();
      setState(prev => {
        const currentIds = new Set(prev.discoveredDevices.map(d => d.id));
        const newDevices = devices.filter(d => !currentIds.has(d.id));

        // Notify about new devices
        newDevices.forEach(device => {
          onDeviceDiscoveredRef.current?.(device);
        });

        return { ...prev, discoveredDevices: devices };
      });
    };

    // Initial poll
    pollDevices();

    // Set up interval
    discoveryIntervalRef.current = setInterval(pollDevices, discoveryInterval);
  }, [enableDiscovery, discoveryInterval]);

  /**
   * Stop local network device discovery
   */
  const stopDiscovery = useCallback(() => {
    if (discoveryIntervalRef.current) {
      clearInterval(discoveryIntervalRef.current);
      discoveryIntervalRef.current = null;
    }
    localDiscovery.current.stop();
  }, []);

  /**
   * Connect to a specific device
   *
   * @param {string} deviceId - ID of device to connect to
   * @param {string} deviceName - Name of device to connect to
   * @returns {Promise<void>}
   */
  const connectToDevice = useCallback(async (deviceId: string, deviceName: string) => {
    setState(prev => ({
      ...prev,
      isConnecting: true,
      connectionError: null
    }));

    try {
      // Connection logic would be handled by parent component
      // This hook manages state only
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectedDeviceId: deviceId,
        connectedDeviceName: deviceName,
        connectionError: null
      }));

      onConnectionSuccessRef.current?.(deviceId, deviceName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: errorMessage
      }));

      onConnectionErrorRef.current?.(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Mark connection as established (to be called from parent)
   *
   * @param {string} deviceId - Connected device ID
   * @param {string} deviceName - Connected device name
   */
  const markConnected = useCallback((deviceId: string, deviceName: string) => {
    setState(prev => ({
      ...prev,
      isConnecting: false,
      connectedDeviceId: deviceId,
      connectedDeviceName: deviceName,
      connectionError: null
    }));
  }, []);

  /**
   * Mark connection as failed
   *
   * @param {string} error - Error message
   */
  const markConnectionFailed = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isConnecting: false,
      connectionError: error
    }));
    onConnectionErrorRef.current?.(error);
  }, []);

  /**
   * Disconnect from current device
   */
  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnecting: false,
      connectedDeviceId: null,
      connectedDeviceName: null,
      connectionError: null
    }));
  }, []);

  /**
   * Clear connection error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  /**
   * Get current device ID
   *
   * @returns {string} Current device ID
   */
  const getCurrentDeviceId = useCallback(() => {
    return getDeviceId();
  }, []);

  // Lifecycle management
  useEffect(() => {
    if (enableDiscovery && state.connectionType === 'local') {
      startDiscovery();
    }

    return () => {
      stopDiscovery();
    };
  }, [enableDiscovery, state.connectionType, startDiscovery, stopDiscovery]);

  return {
    // State
    connectionType: state.connectionType,
    isConnecting: state.isConnecting,
    connectedDeviceId: state.connectedDeviceId,
    connectedDeviceName: state.connectedDeviceName,
    discoveredDevices: state.discoveredDevices,
    connectionError: state.connectionError,
    isConnected: state.connectedDeviceId !== null,

    // Actions
    setConnectionType,
    connectToDevice,
    markConnected,
    markConnectionFailed,
    disconnect,
    clearError,
    startDiscovery,
    stopDiscovery,
    getCurrentDeviceId
  };
}

/**
 * Default export
 */
export default useDeviceConnection;
