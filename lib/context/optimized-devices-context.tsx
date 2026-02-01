'use client';

/**
 * Optimized Devices Context
 * React 19 optimized with context selectors and split contexts
 * Reduces unnecessary re-renders
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Device } from '../types';
import { getDeviceId } from '../auth/user-identity';

export interface DiscoveredDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: Date;
  platform?: string;
}

// ============================================================================
// SPLIT CONTEXTS
// ============================================================================

// Current device context (rarely changes)
interface CurrentDeviceContextValue {
  currentDevice: Device | null;
  initializeCurrentDevice: (name?: string, platform?: string) => void;
  updateCurrentDevice: (updates: Partial<Device>) => void;
}

// Discovered devices context (changes when network discovery runs)
interface DiscoveredDevicesContextValue {
  discoveredDevices: DiscoveredDevice[];
  addDiscoveredDevice: (device: DiscoveredDevice) => void;
  removeDiscoveredDevice: (id: string) => void;
  updateDiscoveredDevice: (id: string, updates: Partial<DiscoveredDevice>) => void;
  clearDiscoveredDevices: () => void;
}

// Connection context (changes during connection lifecycle)
interface ConnectionContextValue {
  connectedPeer: string | null;
  connectedPeerName: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectionCode: string;
  connectionType: 'p2p' | 'relay';
  setConnectedPeer: (peerId: string | null, peerName?: string | null) => void;
  setIsConnecting: (value: boolean) => void;
  setIsConnected: (value: boolean) => void;
  setConnectionCode: (code: string) => void;
  setConnectionType: (type: 'p2p' | 'relay') => void;
  disconnectPeer: () => void;
}

const CurrentDeviceContext = createContext<CurrentDeviceContextValue | undefined>(undefined);
const DiscoveredDevicesContext = createContext<DiscoveredDevicesContextValue | undefined>(undefined);
const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

// ============================================================================
// OPTIMIZED PROVIDER
// ============================================================================

export function OptimizedDevicesProvider({ children }: { children: React.ReactNode }) {
  // Current device state
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  // Discovered devices state
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);

  // Connection state
  const [connectedPeer, setConnectedPeerState] = useState<string | null>(null);
  const [connectedPeerName, setConnectedPeerName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [connectionType, setConnectionType] = useState<'p2p' | 'relay'>('p2p');

  // Current device actions
  const initializeCurrentDevice = useCallback((name?: string, platform?: string) => {
    const device: Device = {
      id: getDeviceId(),
      name: name || 'Web Device',
      platform: (platform || 'web') as Device['platform'],
      ip: null,
      port: null,
      isOnline: true,
      isFavorite: false,
      lastSeen: Date.now(),
      avatar: null,
    };
    setCurrentDevice(device);
  }, []);

  const updateCurrentDevice = useCallback((updates: Partial<Device>) => {
    setCurrentDevice((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Discovered devices actions
  const addDiscoveredDevice = useCallback((device: DiscoveredDevice) => {
    setDiscoveredDevices((prev) => {
      const exists = prev.find((d) => d.id === device.id);
      if (exists) {
        return prev.map((d) => (d.id === device.id ? device : d));
      }
      return [...prev, device];
    });
  }, []);

  const removeDiscoveredDevice = useCallback((id: string) => {
    setDiscoveredDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDiscoveredDevice = useCallback(
    (id: string, updates: Partial<DiscoveredDevice>) => {
      setDiscoveredDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
    },
    []
  );

  const clearDiscoveredDevices = useCallback(() => {
    setDiscoveredDevices([]);
  }, []);

  // Connection actions
  const setConnectedPeer = useCallback(
    (peerId: string | null, peerName?: string | null) => {
      setConnectedPeerState(peerId);
      if (peerName !== undefined) {
        setConnectedPeerName(peerName);
      }
    },
    []
  );

  const disconnectPeer = useCallback(() => {
    setConnectedPeerState(null);
    setConnectedPeerName(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Memoize context values
  const currentDeviceValue = useMemo<CurrentDeviceContextValue>(
    () => ({
      currentDevice,
      initializeCurrentDevice,
      updateCurrentDevice,
    }),
    [currentDevice, initializeCurrentDevice, updateCurrentDevice]
  );

  const discoveredDevicesValue = useMemo<DiscoveredDevicesContextValue>(
    () => ({
      discoveredDevices,
      addDiscoveredDevice,
      removeDiscoveredDevice,
      updateDiscoveredDevice,
      clearDiscoveredDevices,
    }),
    [
      discoveredDevices,
      addDiscoveredDevice,
      removeDiscoveredDevice,
      updateDiscoveredDevice,
      clearDiscoveredDevices,
    ]
  );

  const connectionValue = useMemo<ConnectionContextValue>(
    () => ({
      connectedPeer,
      connectedPeerName,
      isConnecting,
      isConnected,
      connectionCode,
      connectionType,
      setConnectedPeer,
      setIsConnecting,
      setIsConnected,
      setConnectionCode,
      setConnectionType,
      disconnectPeer,
    }),
    [
      connectedPeer,
      connectedPeerName,
      isConnecting,
      isConnected,
      connectionCode,
      connectionType,
      setConnectedPeer,
      disconnectPeer,
    ]
  );

  return (
    <CurrentDeviceContext.Provider value={currentDeviceValue}>
      <DiscoveredDevicesContext.Provider value={discoveredDevicesValue}>
        <ConnectionContext.Provider value={connectionValue}>
          {children}
        </ConnectionContext.Provider>
      </DiscoveredDevicesContext.Provider>
    </CurrentDeviceContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useCurrentDevice() {
  const context = useContext(CurrentDeviceContext);
  if (!context) {
    throw new Error('useCurrentDevice must be used within OptimizedDevicesProvider');
  }
  return context;
}

export function useDiscoveredDevices() {
  const context = useContext(DiscoveredDevicesContext);
  if (!context) {
    throw new Error('useDiscoveredDevices must be used within OptimizedDevicesProvider');
  }
  return context;
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within OptimizedDevicesProvider');
  }
  return context;
}

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Get online devices only
 */
export function useOnlineDevices(): DiscoveredDevice[] {
  const { discoveredDevices } = useDiscoveredDevices();
  return useMemo(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return discoveredDevices.filter((d) => d.lastSeen > fiveMinutesAgo);
  }, [discoveredDevices]);
}

/**
 * Get device by ID
 */
export function useDeviceById(id: string | null): DiscoveredDevice | null {
  const { discoveredDevices } = useDiscoveredDevices();
  return useMemo(() => {
    if (!id) {return null;}
    return discoveredDevices.find((d) => d.id === id) || null;
  }, [discoveredDevices, id]);
}

/**
 * Check if connected
 */
export function useIsConnectedToDevice(): boolean {
  const { isConnected } = useConnection();
  return isConnected;
}

/**
 * Get connection status text
 */
export function useConnectionStatus(): string {
  const { isConnecting, isConnected, connectedPeerName } = useConnection();
  return useMemo(() => {
    if (isConnected && connectedPeerName) {
      return `Connected to ${connectedPeerName}`;
    }
    if (isConnecting) {
      return 'Connecting...';
    }
    return 'Not connected';
  }, [isConnecting, isConnected, connectedPeerName]);
}

export default OptimizedDevicesProvider;
