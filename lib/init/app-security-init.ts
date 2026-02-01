'use client';

/**
 * Application Security Initialization
 * Initializes security features on app startup
 */

import { initializeDeviceId } from '../auth/user-identity';
import { autoMigrate } from '../storage/migrate-to-secure';
import { initializeCSRF } from '../security/csrf';
import secureLog from '../utils/secure-logger';

let initialized = false;

/**
 * Initialize all security features
 * Should be called once on app startup
 */
export async function initializeAppSecurity(): Promise<void> {
  if (initialized) {
    secureLog.log('[Security] Already initialized');
    return;
  }

  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  try {
    secureLog.log('[Security] Initializing app security...');

    // 1. Initialize CSRF protection
    initializeCSRF();
    secureLog.log('[Security] CSRF protection initialized');

    // 2. Initialize device ID (loads from encrypted storage)
    await initializeDeviceId();
    secureLog.log('[Security] Device ID initialized');

    // 3. Migrate sensitive data to encrypted storage
    await autoMigrate();
    secureLog.log('[Security] Sensitive data migrated');

    initialized = true;
    secureLog.log('[Security] App security initialized successfully');
  } catch (error) {
    secureLog.error('[Security] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Check if security initialization is complete
 */
export function isSecurityInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization state (for testing)
 */
export function resetSecurityInit(): void {
  initialized = false;
}

export default {
  initializeAppSecurity,
  isSecurityInitialized,
  resetSecurityInit,
};
