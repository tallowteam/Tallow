'use client';

/**
 * My Devices Storage
 * Stores a list of all devices the user has used
 * SECURITY: Device data is now encrypted in localStorage
 */

import secureStorage from './secure-storage';
import { isObject, hasProperty, isString, isArrayOf } from '../types/type-guards';

const MY_DEVICES_KEY = 'Tallow_my_devices';

export interface DeviceTransferStats {
    totalTransfers: number;
    successfulTransfers: number;
    failedTransfers: number;
    totalBytesSent: number;
    totalBytesReceived: number;
    lastTransferDate?: Date;
}

export interface MyDevice {
    id: string;
    name: string;
    createdAt: Date;
    lastUsed: Date;
    isCurrent: boolean;
    supportsGroupTransfer?: boolean;
    transferStats?: DeviceTransferStats;
    recentTransferPartners?: string[]; // Device IDs of recent transfer partners
}

/**
 * Stored device format (JSON serializable)
 */
interface StoredDevice {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string;
  isCurrent: boolean;
  supportsGroupTransfer?: boolean;
  transferStats?: {
    totalTransfers: number;
    successfulTransfers: number;
    failedTransfers: number;
    totalBytesSent: number;
    totalBytesReceived: number;
    lastTransferDate?: string;
  };
  recentTransferPartners?: string[];
}

/**
 * Type guard for stored device
 */
function isStoredDevice(value: unknown): value is StoredDevice {
  if (!isObject(value)) {return false;}

  return (
    hasProperty(value, 'id') && isString(value['id']) &&
    hasProperty(value, 'name') && isString(value['name']) &&
    hasProperty(value, 'createdAt') && isString(value['createdAt']) &&
    hasProperty(value, 'lastUsed') && isString(value['lastUsed']) &&
    hasProperty(value, 'isCurrent') && typeof value['isCurrent'] === 'boolean'
  );
}

/**
 * Type guard for stored device array
 */
function isStoredDeviceArray(value: unknown): value is StoredDevice[] {
  return isArrayOf(value, isStoredDevice);
}

// Get all saved devices
export async function getMyDevices(): Promise<MyDevice[]> {
    if (typeof window === 'undefined') {return [];}

    try {
        const stored = await secureStorage.getItem(MY_DEVICES_KEY);
        if (stored) {
            const devices: unknown = JSON.parse(stored);
            if (!isStoredDeviceArray(devices)) {
              throw new Error('Invalid stored devices format');
            }

            return devices.map((d): MyDevice => ({
                id: d.id,
                name: d.name,
                createdAt: new Date(d.createdAt),
                lastUsed: new Date(d.lastUsed),
                isCurrent: d.isCurrent,
                ...(d.supportsGroupTransfer !== undefined ? { supportsGroupTransfer: d.supportsGroupTransfer } : {}),
                ...(d.transferStats ? {
                    transferStats: {
                        totalTransfers: d.transferStats.totalTransfers,
                        successfulTransfers: d.transferStats.successfulTransfers,
                        failedTransfers: d.transferStats.failedTransfers,
                        totalBytesSent: d.transferStats.totalBytesSent,
                        totalBytesReceived: d.transferStats.totalBytesReceived,
                        ...(d.transferStats.lastTransferDate ? { lastTransferDate: new Date(d.transferStats.lastTransferDate) } : {}),
                    }
                } : {}),
                ...(d.recentTransferPartners ? { recentTransferPartners: d.recentTransferPartners } : {}),
            }));
        }
    } catch { }

    return [];
}

// Save devices list
async function saveMyDevices(devices: MyDevice[]): Promise<void> {
    await secureStorage.setItem(MY_DEVICES_KEY, JSON.stringify(devices));
}

// Add or update current device
export async function registerCurrentDevice(deviceId: string, deviceName: string): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const devices = await getMyDevices();

    // Mark all as not current
    devices.forEach(d => d.isCurrent = false);

    // Find existing or create new
    const existingIndex = devices.findIndex(d => d.id === deviceId);

    if (existingIndex >= 0) {
        const existingDevice = devices[existingIndex];
        if (existingDevice) {
            existingDevice.name = deviceName;
            existingDevice.lastUsed = new Date();
            existingDevice.isCurrent = true;
        }
    } else {
        devices.push({
            id: deviceId,
            name: deviceName,
            createdAt: new Date(),
            lastUsed: new Date(),
            isCurrent: true,
        });
    }

    await saveMyDevices(devices);
}

// Update device name
export async function updateDeviceName(deviceId: string, name: string): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const devices = await getMyDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
        device.name = name;
        await saveMyDevices(devices);
    }
}

// Remove a device
export async function removeDevice(deviceId: string): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const devices = await getMyDevices();
    const filtered = devices.filter(d => d.id !== deviceId);
    await saveMyDevices(filtered);
}

// Clear all devices
export async function clearAllDevices(): Promise<void> {
    if (typeof window === 'undefined') {return;}
    secureStorage.removeItem(MY_DEVICES_KEY);
}

// Update transfer statistics
export async function updateTransferStats(
    deviceId: string,
    success: boolean,
    bytesSent: number = 0,
    bytesReceived: number = 0
): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const devices = await getMyDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
        const stats = device.transferStats || {
            totalTransfers: 0,
            successfulTransfers: 0,
            failedTransfers: 0,
            totalBytesSent: 0,
            totalBytesReceived: 0,
        };

        stats.totalTransfers++;
        if (success) {
            stats.successfulTransfers++;
        } else {
            stats.failedTransfers++;
        }
        stats.totalBytesSent += bytesSent;
        stats.totalBytesReceived += bytesReceived;
        stats.lastTransferDate = new Date();

        device.transferStats = stats;
        device.lastUsed = new Date();

        await saveMyDevices(devices);
    }
}

// Add recent transfer partner
export async function addRecentTransferPartner(deviceId: string, partnerDeviceId: string): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const devices = await getMyDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
        const partners = device.recentTransferPartners || [];

        // Remove partner if already exists
        const filtered = partners.filter(p => p !== partnerDeviceId);

        // Add to front of list
        filtered.unshift(partnerDeviceId);

        // Keep only last 20 partners
        device.recentTransferPartners = filtered.slice(0, 20);
        device.lastUsed = new Date();

        await saveMyDevices(devices);
    }
}

// Get recent transfer partners
export async function getRecentTransferPartners(deviceId: string): Promise<string[]> {
    if (typeof window === 'undefined') {return [];}

    const devices = await getMyDevices();
    const device = devices.find(d => d.id === deviceId);
    return device?.recentTransferPartners || [];
}

// Enable group transfer capability
export async function setGroupTransferSupport(deviceId: string, enabled: boolean): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const devices = await getMyDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
        device.supportsGroupTransfer = enabled;
        await saveMyDevices(devices);
    }
}

// Get devices with group transfer support
export async function getGroupTransferDevices(): Promise<MyDevice[]> {
    const devices = await getMyDevices();
    return devices.filter(d => d.supportsGroupTransfer === true);
}

export default {
    getMyDevices,
    registerCurrentDevice,
    updateDeviceName,
    removeDevice,
    clearAllDevices,
    updateTransferStats,
    addRecentTransferPartner,
    getRecentTransferPartners,
    setGroupTransferSupport,
    getGroupTransferDevices,
};
