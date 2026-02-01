'use client';

/**
 * Device Identity Module
 * Cryptographically secure device ID generation for anonymous file sharing
 * SECURITY: Device IDs are now encrypted in localStorage
 */

import secureStorage from '../storage/secure-storage';
import { error } from '@/lib/utils/secure-logger';

const DEVICE_ID_KEY = 'Tallow_device_id';

// Characters safe for display and URL usage (no ambiguous chars like O/0, I/1/l)
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// In-memory cache for synchronous access
let deviceIdCache: string | null = null;
let loadPromise: Promise<void> | null = null;

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
        const value = values[i];
        if (value !== undefined) {
            id += ID_CHARS[value % ID_CHARS.length];
        }
    }

    return id;
}

/**
 * Load device ID from encrypted storage (async initialization)
 * Should be called on app startup
 */
export async function loadDeviceId(): Promise<string> {
    if (typeof window === 'undefined') {return 'server';}

    try {
        const stored = await secureStorage.getItem(DEVICE_ID_KEY);
        if (stored && stored.length >= 8) {
            deviceIdCache = stored;
            return stored;
        }

        // Generate new ID
        const newId = generateDeviceId();
        await secureStorage.setItem(DEVICE_ID_KEY, newId);
        deviceIdCache = newId;
        return newId;
    } catch (err) {
        error('Failed to load device ID:', err);
        // Fallback: use temp ID
        const tempId = generateDeviceId();
        deviceIdCache = tempId;
        return tempId;
    }
}

/**
 * Get device ID (synchronous - uses cached value)
 * IMPORTANT: Call loadDeviceId() on app startup before using this
 * Falls back to generating new ID if cache not initialized
 */
export function getDeviceId(): string {
    if (typeof window === 'undefined') {return 'server';}

    // Return cached value if available
    if (deviceIdCache) {return deviceIdCache;}

    // Fallback: try to load from localStorage (legacy/unencrypted)
    const legacy = localStorage.getItem(DEVICE_ID_KEY);
    if (legacy && !legacy.startsWith('enc:')) {
        deviceIdCache = legacy;
        // Migrate to encrypted storage in background
        loadDeviceId().catch(error);
        return legacy;
    }

    // Last resort: generate temporary ID and load async
    const tempId = generateDeviceId();
    deviceIdCache = tempId;

    // Start async load
    if (!loadPromise) {
        loadPromise = loadDeviceId().then(() => {
            loadPromise = null;
        });
    }

    return tempId;
}

/**
 * Regenerate device ID (creates a new one)
 */
export async function regenerateDeviceId(): Promise<string> {
    if (typeof window === 'undefined') {return 'server';}

    const newId = generateDeviceId();
    await secureStorage.setItem(DEVICE_ID_KEY, newId);
    deviceIdCache = newId;
    return newId;
}

/**
 * Initialize device ID system (call on app startup)
 */
export async function initializeDeviceId(): Promise<void> {
    await loadDeviceId();
}

export default {
    getDeviceId,
    regenerateDeviceId,
};
