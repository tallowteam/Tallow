'use client';

/**
 * Device Identity Module
 * Cryptographically secure device ID generation for anonymous file sharing
 */

const DEVICE_ID_KEY = 'Tallow_device_id';

// Characters safe for display and URL usage (no ambiguous chars like O/0, I/1/l)
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a cryptographically secure device ID (12 chars)
 * Uses crypto.getRandomValues for unpredictable output
 * Entropy: 12 chars * log2(32) = 60 bits
 */
function generateDeviceId(): string {
    const values = new Uint8Array(12);
    crypto.getRandomValues(values);

    let id = '';
    for (let i = 0; i < 12; i++) {
        id += ID_CHARS[values[i] % ID_CHARS.length];
    }

    return id;
}

/**
 * Get or create device ID
 * Stores in localStorage for persistence across sessions
 */
export function getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';

    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId || deviceId.length < 8) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

/**
 * Regenerate device ID (creates a new one)
 */
export function regenerateDeviceId(): string {
    if (typeof window === 'undefined') return 'server';

    const newId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
}

export default {
    getDeviceId,
    regenerateDeviceId,
};
