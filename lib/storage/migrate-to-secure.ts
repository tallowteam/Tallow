'use client';

/**
 * Migration Utility for Secure Storage
 * Migrates all sensitive localStorage data to encrypted storage
 */

import secureStorage, { SENSITIVE_KEYS } from './secure-storage';
import { secureLog } from '../utils/secure-logger';

// Additional sensitive keys that need encryption
const ADDITIONAL_SENSITIVE_KEYS = [
  'Tallow_device_id',
  'Tallow_my_devices',
  'Tallow_proxy_config',
  'tallow_advanced_privacy_mode',
  'tallow_bandwidth_limit',
  'tallow_connection_history',
];

// All sensitive keys that should be encrypted
export const ALL_SENSITIVE_KEYS = [
  ...SENSITIVE_KEYS,
  ...ADDITIONAL_SENSITIVE_KEYS,
];

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  if (typeof localStorage === 'undefined') {return false;}

  for (const key of ALL_SENSITIVE_KEYS) {
    const value = localStorage.getItem(key);
    if (value && !value.startsWith('enc:')) {
      return true; // Found unencrypted sensitive data
    }
  }

  return false;
}

/**
 * Migrate all sensitive data to encrypted storage
 */
export async function migrateAllSensitiveData(): Promise<{
  migrated: string[];
  failed: string[];
  skipped: string[];
}> {
  const migrated: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  for (const key of ALL_SENSITIVE_KEYS) {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        skipped.push(key);
        continue;
      }

      if (value.startsWith('enc:')) {
        skipped.push(key);
        continue;
      }

      // Migrate to encrypted storage
      await secureStorage.setItem(key, value);
      migrated.push(key);
    } catch (error) {
      secureLog.error(`Failed to migrate ${key}:`, error);
      failed.push(key);
    }
  }

  return { migrated, failed, skipped };
}

/**
 * Verify all sensitive data is encrypted
 */
export function verifySensitiveDataEncrypted(): {
  encrypted: string[];
  plaintext: string[];
  missing: string[];
} {
  const encrypted: string[] = [];
  const plaintext: string[] = [];
  const missing: string[] = [];

  for (const key of ALL_SENSITIVE_KEYS) {
    const value = localStorage.getItem(key);

    if (!value) {
      missing.push(key);
    } else if (value.startsWith('enc:')) {
      encrypted.push(key);
    } else {
      plaintext.push(key);
    }
  }

  return { encrypted, plaintext, missing };
}

/**
 * Auto-migrate on app startup
 * Should be called early in the application lifecycle
 */
export async function autoMigrate(): Promise<void> {
  if (!needsMigration()) {
    secureLog.log('[SecureStorage] No migration needed');
    return;
  }

  secureLog.log('[SecureStorage] Starting sensitive data migration...');
  const result = await migrateAllSensitiveData();

  if (result.migrated.length > 0) {
    secureLog.log(`[SecureStorage] Migrated ${result.migrated.length} keys:`, result.migrated);
  }

  if (result.failed.length > 0) {
    secureLog.error(`[SecureStorage] Failed to migrate ${result.failed.length} keys:`, result.failed);
    throw new Error(`Secure storage migration failed for: ${result.failed.join(', ')}`);
  }

  secureLog.log('[SecureStorage] Migration complete');
}

export default {
  needsMigration,
  migrateAllSensitiveData,
  verifySensitiveDataEncrypted,
  autoMigrate,
  ALL_SENSITIVE_KEYS,
};
