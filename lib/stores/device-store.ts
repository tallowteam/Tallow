/**
 * Device Store - Zustand State Management
 *
 * Manages device discovery, selection, and connection states
 * with optimistic updates for improved UX.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { Device } from '../types';
import { safeStorage } from './storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DeviceConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';
  peerId: string | null;
  peerName: string | null;
  connectionType: 'p2p' | 'relay' | null;
  error: string | null;
  timestamp: number | null;
}

export interface DeviceDiscoveryState {
  isScanning: boolean;
  lastScanAt: number | null;
  scanDuration: number;
  error: string | null;
}

export interface OptimisticUpdate<T> {
  id: string;
  type: 'add' | 'update' | 'remove';
  data: T;
  timestamp: number;
  rollback: () => void;
}

export interface DeviceStoreState {
  // Device lists
  devices: Device[];
  favoriteDeviceIds: string[];
  recentDeviceIds: string[];

  // Selection
  selectedDeviceId: string | null;
  selectedDevice: Device | null;

  // Connection state
  connection: DeviceConnectionState;

  // Discovery state
  discovery: DeviceDiscoveryState;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions - Device Management
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  clearDevices: () => void;

  // Actions - Selection
  selectDevice: (device: Device | null) => void;
  selectDeviceById: (id: string | null) => void;

  // Actions - Favorites
  toggleFavorite: (id: string) => void;
  setFavorite: (id: string, isFavorite: boolean) => void;

  // Actions - Recent
  addToRecent: (id: string) => void;
  clearRecent: () => void;

  // Actions - Connection
  startConnecting: (peerId: string, peerName?: string) => void;
  setConnected: (connectionType: 'p2p' | 'relay') => void;
  setConnectionError: (error: string) => void;
  disconnect: () => void;

  // Actions - Discovery
  startScanning: () => void;
  stopScanning: () => void;
  setScanError: (error: string) => void;

  // Actions - Loading
  setLoading: (isLoading: boolean) => void;
  setInitialized: () => void;

  // Selectors
  getDeviceById: (id: string) => Device | undefined;
  getOnlineDevices: () => Device[];
  getOfflineDevices: () => Device[];
  getFavoriteDevices: () => Device[];
  getRecentDevices: () => Device[];
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

const MAX_RECENT_DEVICES = 10;

export const useDeviceStore = create<DeviceStoreState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          devices: [],
          favoriteDeviceIds: [],
          recentDeviceIds: [],
          selectedDeviceId: null,
          selectedDevice: null,
          connection: {
            status: 'idle',
            peerId: null,
            peerName: null,
            connectionType: null,
            error: null,
            timestamp: null,
          },
          discovery: {
            isScanning: false,
            lastScanAt: null,
            scanDuration: 0,
            error: null,
          },
          isLoading: false,
          isInitialized: false,

          // Device Management
          setDevices: (devices) =>
            set((state) => ({
              devices,
              selectedDevice: state.selectedDeviceId
                ? devices.find((d) => d.id === state.selectedDeviceId) || null
                : null,
            })),

          addDevice: (device) =>
            set((state) => {
              const existingIndex = state.devices.findIndex((d) => d.id === device.id);
              if (existingIndex >= 0) {
                const newDevices = [...state.devices];
                newDevices[existingIndex] = device;
                return { devices: newDevices };
              }
              return { devices: [...state.devices, device] };
            }),

          updateDevice: (id, updates) =>
            set((state) => {
              const index = state.devices.findIndex((d) => d.id === id);
              if (index < 0) {return state;}

              const newDevices = [...state.devices];
              const existingDevice = newDevices[index];
              // Guard check - if device doesn't exist, return unchanged state
              if (!existingDevice) {return state;}

              // Merge updates with existing device
              const updatedDevice: Device = {
                id: updates.id ?? existingDevice.id,
                name: updates.name ?? existingDevice.name,
                platform: updates.platform ?? existingDevice.platform,
                ip: updates.ip !== undefined ? updates.ip : existingDevice.ip,
                port: updates.port !== undefined ? updates.port : existingDevice.port,
                isOnline: updates.isOnline ?? existingDevice.isOnline,
                isFavorite: updates.isFavorite ?? existingDevice.isFavorite,
                lastSeen: updates.lastSeen ?? existingDevice.lastSeen,
                avatar: updates.avatar !== undefined ? updates.avatar : existingDevice.avatar,
              };
              newDevices[index] = updatedDevice;

              return {
                devices: newDevices,
                selectedDevice:
                  state.selectedDeviceId === id ? updatedDevice : state.selectedDevice,
              };
            }),

          removeDevice: (id) =>
            set((state) => ({
              devices: state.devices.filter((d) => d.id !== id),
              selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId,
              selectedDevice: state.selectedDeviceId === id ? null : state.selectedDevice,
              favoriteDeviceIds: state.favoriteDeviceIds.filter((fid) => fid !== id),
              recentDeviceIds: state.recentDeviceIds.filter((rid) => rid !== id),
            })),

          clearDevices: () =>
            set({
              devices: [],
              selectedDeviceId: null,
              selectedDevice: null,
            }),

          // Selection
          selectDevice: (device) =>
            set((state) => ({
              selectedDevice: device,
              selectedDeviceId: device?.id || null,
              recentDeviceIds: device
                ? [device.id, ...state.recentDeviceIds.filter((id) => id !== device.id)].slice(
                    0,
                    MAX_RECENT_DEVICES
                  )
                : state.recentDeviceIds,
            })),

          selectDeviceById: (id) => {
            const device = id ? get().devices.find((d) => d.id === id) : null;
            set((state) => ({
              selectedDeviceId: id,
              selectedDevice: device || null,
              recentDeviceIds: id
                ? [id, ...state.recentDeviceIds.filter((rid) => rid !== id)].slice(
                    0,
                    MAX_RECENT_DEVICES
                  )
                : state.recentDeviceIds,
            }));
          },

          // Favorites
          toggleFavorite: (id) =>
            set((state) => {
              const isFavorite = state.favoriteDeviceIds.includes(id);
              const newFavoriteIds = isFavorite
                ? state.favoriteDeviceIds.filter((fid) => fid !== id)
                : [...state.favoriteDeviceIds, id];

              const newDevices = state.devices.map((d) =>
                d.id === id ? { ...d, isFavorite: !isFavorite } : d
              );

              return {
                favoriteDeviceIds: newFavoriteIds,
                devices: newDevices,
                selectedDevice:
                  state.selectedDeviceId === id
                    ? newDevices.find((d) => d.id === id) || null
                    : state.selectedDevice,
              };
            }),

          setFavorite: (id, isFavorite) =>
            set((state) => {
              const newFavoriteIds = isFavorite
                ? state.favoriteDeviceIds.includes(id)
                  ? state.favoriteDeviceIds
                  : [...state.favoriteDeviceIds, id]
                : state.favoriteDeviceIds.filter((fid) => fid !== id);

              const newDevices = state.devices.map((d) =>
                d.id === id ? { ...d, isFavorite } : d
              );

              return {
                favoriteDeviceIds: newFavoriteIds,
                devices: newDevices,
                selectedDevice:
                  state.selectedDeviceId === id
                    ? newDevices.find((d) => d.id === id) || null
                    : state.selectedDevice,
              };
            }),

          // Recent
          addToRecent: (id) =>
            set((state) => ({
              recentDeviceIds: [id, ...state.recentDeviceIds.filter((rid) => rid !== id)].slice(
                0,
                MAX_RECENT_DEVICES
              ),
            })),

          clearRecent: () => set({ recentDeviceIds: [] }),

          // Connection
          startConnecting: (peerId, peerName) =>
            set({
              connection: {
                status: 'connecting',
                peerId,
                peerName: peerName || null,
                connectionType: null,
                error: null,
                timestamp: Date.now(),
              },
            }),

          setConnected: (connectionType) =>
            set((state) => ({
              connection: {
                ...state.connection,
                status: 'connected',
                connectionType,
                timestamp: Date.now(),
              },
            })),

          setConnectionError: (error) =>
            set((state) => ({
              connection: {
                ...state.connection,
                status: 'error',
                error,
                timestamp: Date.now(),
              },
            })),

          disconnect: () =>
            set({
              connection: {
                status: 'idle',
                peerId: null,
                peerName: null,
                connectionType: null,
                error: null,
                timestamp: null,
              },
            }),

          // Discovery
          startScanning: () =>
            set({
              discovery: {
                isScanning: true,
                lastScanAt: Date.now(),
                scanDuration: 0,
                error: null,
              },
            }),

          stopScanning: () =>
            set((state) => ({
              discovery: {
                ...state.discovery,
                isScanning: false,
                scanDuration: state.discovery.lastScanAt
                  ? Date.now() - state.discovery.lastScanAt
                  : 0,
              },
            })),

          setScanError: (error) =>
            set((state) => ({
              discovery: {
                ...state.discovery,
                error,
                isScanning: false,
              },
            })),

          // Loading
          setLoading: (isLoading) => set({ isLoading }),
          setInitialized: () => set({ isInitialized: true }),

          // Selectors
          getDeviceById: (id) => get().devices.find((d) => d.id === id),
          getOnlineDevices: () => get().devices.filter((d) => d.isOnline),
          getOfflineDevices: () => get().devices.filter((d) => !d.isOnline),
          getFavoriteDevices: () =>
            get().devices.filter((d) => get().favoriteDeviceIds.includes(d.id)),
          getRecentDevices: () => {
            const { devices, recentDeviceIds } = get();
            return recentDeviceIds
              .map((id) => devices.find((d) => d.id === id))
              .filter((d): d is Device => d !== undefined);
          },
        }),
        {
          name: 'tallow-device-store',
          storage: createJSONStorage(() => safeStorage),
          partialize: (state) => ({
            favoriteDeviceIds: state.favoriteDeviceIds,
            recentDeviceIds: state.recentDeviceIds,
          }),
        }
      )
    ),
    { name: 'DeviceStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectDevices = (state: DeviceStoreState) => state.devices;
export const selectSelectedDevice = (state: DeviceStoreState) => state.selectedDevice;
export const selectConnectionStatus = (state: DeviceStoreState) => state.connection.status;
export const selectIsConnected = (state: DeviceStoreState) =>
  state.connection.status === 'connected';
export const selectIsScanning = (state: DeviceStoreState) => state.discovery.isScanning;
export const selectIsLoading = (state: DeviceStoreState) => state.isLoading;
export const selectOnlineDevices = (state: DeviceStoreState) =>
  state.devices.filter((d) => d.isOnline);
export const selectOfflineDevices = (state: DeviceStoreState) =>
  state.devices.filter((d) => !d.isOnline);
export const selectFavoriteIds = (state: DeviceStoreState) => state.favoriteDeviceIds;

/**
 * Non-hook accessor for useDeviceStore.
 * Use this in callbacks / effects where you call .getState() so the React
 * compiler does not hoist it into a reactive subscription (it only hoists
 * identifiers that start with "use").
 */
export const deviceStoreApi = useDeviceStore;
