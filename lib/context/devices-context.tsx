'use client';

/**
 * Devices Context
 * Centralized state management for devices and connections
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
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

export interface DeviceState {
  // Current device
  currentDevice: Device | null;
  // Discovered devices (local network)
  discoveredDevices: DiscoveredDevice[];
  // Connected peer
  connectedPeer: string | null;
  connectedPeerName: string | null;
  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  // Connection code
  connectionCode: string;
  // Connection type
  connectionType: 'p2p' | 'relay';
}

interface DevicesContextValue extends DeviceState {
  // Current device actions
  initializeCurrentDevice: (name?: string, platform?: string) => void;
  updateCurrentDevice: (updates: Partial<Device>) => void;

  // Discovered devices
  addDiscoveredDevice: (device: DiscoveredDevice) => void;
  removeDiscoveredDevice: (id: string) => void;
  updateDiscoveredDevice: (id: string, updates: Partial<DiscoveredDevice>) => void;
  clearDiscoveredDevices: () => void;

  // Connection state
  setConnectedPeer: (peerId: string | null, peerName?: string | null) => void;
  setIsConnecting: (value: boolean) => void;
  setIsConnected: (value: boolean) => void;
  setConnectionCode: (code: string) => void;
  setConnectionType: (type: 'p2p' | 'relay') => void;

  // Utility
  disconnectPeer: () => void;
}

const DevicesContext = createContext<DevicesContextValue | undefined>(undefined);

/**
 * Devices Provider
 */
export function DevicesProvider({ children }: { children: React.ReactNode }) {
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [connectedPeer, setConnectedPeerState] = useState<string | null>(null);
  const [connectedPeerName, setConnectedPeerName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [connectionType, setConnectionType] = useState<'p2p' | 'relay'>('p2p');

  // Current device
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
    setCurrentDevice(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Discovered devices
  const addDiscoveredDevice = useCallback((device: DiscoveredDevice) => {
    setDiscoveredDevices(prev => {
      const exists = prev.find(d => d.id === device.id);
      if (exists) {
        return prev.map(d => d.id === device.id ? device : d);
      }
      return [...prev, device];
    });
  }, []);

  const removeDiscoveredDevice = useCallback((id: string) => {
    setDiscoveredDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  const updateDiscoveredDevice = useCallback((id: string, updates: Partial<DiscoveredDevice>) => {
    setDiscoveredDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const clearDiscoveredDevices = useCallback(() => {
    setDiscoveredDevices([]);
  }, []);

  // Connection state
  const setConnectedPeer = useCallback((peerId: string | null, peerName?: string | null) => {
    setConnectedPeerState(peerId);
    if (peerName !== undefined) {
      setConnectedPeerName(peerName);
    }
  }, []);

  const disconnectPeer = useCallback(() => {
    setConnectedPeerState(null);
    setConnectedPeerName(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
  const contextValue = useMemo<DevicesContextValue>(() => ({
    // State
    currentDevice,
    discoveredDevices,
    connectedPeer,
    connectedPeerName,
    isConnecting,
    isConnected,
    connectionCode,
    connectionType,

    // Actions
    initializeCurrentDevice,
    updateCurrentDevice,
    addDiscoveredDevice,
    removeDiscoveredDevice,
    updateDiscoveredDevice,
    clearDiscoveredDevices,
    setConnectedPeer,
    setIsConnecting,
    setIsConnected,
    setConnectionCode,
    setConnectionType,
    disconnectPeer,
  }), [
    currentDevice,
    discoveredDevices,
    connectedPeer,
    connectedPeerName,
    isConnecting,
    isConnected,
    connectionCode,
    connectionType,
    initializeCurrentDevice,
    updateCurrentDevice,
    addDiscoveredDevice,
    removeDiscoveredDevice,
    updateDiscoveredDevice,
    clearDiscoveredDevices,
    setConnectedPeer,
    setIsConnecting,
    setIsConnected,
    setConnectionCode,
    setConnectionType,
    disconnectPeer,
  ]);

  return (
    <DevicesContext.Provider value={contextValue}>
      {children}
    </DevicesContext.Provider>
  );
}

/**
 * Hook to use devices context
 */
export function useDevices() {
  const context = useContext(DevicesContext);
  if (!context) {
    throw new Error('useDevices must be used within DevicesProvider');
  }
  return context;
}

export default DevicesContext;
