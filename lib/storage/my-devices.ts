'use client';

/**
 * My Devices Storage
 * Stores a list of all devices the user has used
 */

const MY_DEVICES_KEY = 'Tallow_my_devices';

export interface MyDevice {
    id: string;
    name: string;
    createdAt: Date;
    lastUsed: Date;
    isCurrent: boolean;
}

// Get all saved devices
export function getMyDevices(): MyDevice[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(MY_DEVICES_KEY);
        if (stored) {
            const devices = JSON.parse(stored);
            return devices.map((d: any) => ({
                ...d,
                createdAt: new Date(d.createdAt),
                lastUsed: new Date(d.lastUsed),
            }));
        }
    } catch { }

    return [];
}

// Save devices list
function saveMyDevices(devices: MyDevice[]): void {
    localStorage.setItem(MY_DEVICES_KEY, JSON.stringify(devices));
}

// Add or update current device
export function registerCurrentDevice(deviceId: string, deviceName: string): void {
    if (typeof window === 'undefined') return;

    const devices = getMyDevices();

    // Mark all as not current
    devices.forEach(d => d.isCurrent = false);

    // Find existing or create new
    const existingIndex = devices.findIndex(d => d.id === deviceId);

    if (existingIndex >= 0) {
        devices[existingIndex].name = deviceName;
        devices[existingIndex].lastUsed = new Date();
        devices[existingIndex].isCurrent = true;
    } else {
        devices.push({
            id: deviceId,
            name: deviceName,
            createdAt: new Date(),
            lastUsed: new Date(),
            isCurrent: true,
        });
    }

    saveMyDevices(devices);
}

// Update device name
export function updateDeviceName(deviceId: string, name: string): void {
    if (typeof window === 'undefined') return;

    const devices = getMyDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
        device.name = name;
        saveMyDevices(devices);
    }
}

// Remove a device
export function removeDevice(deviceId: string): void {
    if (typeof window === 'undefined') return;

    const devices = getMyDevices().filter(d => d.id !== deviceId);
    saveMyDevices(devices);
}

// Clear all devices
export function clearAllDevices(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(MY_DEVICES_KEY);
}

export default {
    getMyDevices,
    registerCurrentDevice,
    updateDeviceName,
    removeDevice,
    clearAllDevices,
};
