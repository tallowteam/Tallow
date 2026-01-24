'use client';

/**
 * Secure Storage Module
 * Encrypts sensitive data before storing in localStorage
 * Uses AES-256-GCM with a non-extractable CryptoKey stored in IndexedDB
 */

const STORAGE_KEY_SEED = 'tallow_storage_key_seed'; // Legacy, migrated away
const ENCRYPTED_PREFIX = 'enc:';
const IDB_NAME = 'tallow_secure_keys';
const IDB_STORE = 'keys';
const IDB_KEY_ID = 'storage_master_key';

// Check if SubtleCrypto is available (requires secure context: HTTPS or localhost)
function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  return null;
}

// In-memory cache of the encryption key (not persisted outside IndexedDB)
let encryptionKey: CryptoKey | null = null;
let migrationDone = false;

// ============================================================================
// IndexedDB Key Storage
// ============================================================================

function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredKey(): Promise<CryptoKey | null> {
  try {
    const db = await openKeyStore();
    return await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(IDB_KEY_ID);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

async function storeKey(key: CryptoKey): Promise<void> {
  const db = await openKeyStore();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const request = store.put(key, IDB_KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Generate a new non-extractable AES-256-GCM key
 */
async function generateMasterKey(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  if (!subtle) throw new Error('SubtleCrypto not available (requires secure context)');
  return await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // NON-EXTRACTABLE - key cannot be read from IndexedDB
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive the legacy key from a localStorage seed (for migration)
 */
async function deriveLegacyKey(seed: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  if (!subtle) throw new Error('SubtleCrypto not available (requires secure context)');
  const seedBytes = new Uint8Array(seed.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  const baseKey = await subtle.importKey(
    'raw',
    seedBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('tallow-secure-storage-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Core Encryption
// ============================================================================

/**
 * Get the master encryption key.
 * Priority: in-memory cache → IndexedDB → migrate from legacy seed → generate new
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  if (encryptionKey) return encryptionKey;

  // Try IndexedDB first
  const storedKey = await getStoredKey();
  if (storedKey) {
    encryptionKey = storedKey;
    // Run migration from legacy seed if not done yet
    if (!migrationDone) {
      migrationDone = true;
      await migrateLegacySeed();
    }
    return encryptionKey;
  }

  // Check for legacy seed to migrate from
  const legacySeed = typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY_SEED)
    : null;

  if (legacySeed) {
    // Migrate: derive old key, generate new key, re-encrypt data, delete seed
    const legacyKey = await deriveLegacyKey(legacySeed);
    const newKey = await generateMasterKey();

    // Re-encrypt all existing data with the new key
    await reEncryptAll(legacyKey, newKey);

    // Store new key in IndexedDB
    await storeKey(newKey);

    // Remove the plaintext seed from localStorage
    localStorage.removeItem(STORAGE_KEY_SEED);

    encryptionKey = newKey;
    migrationDone = true;
    return encryptionKey;
  }

  // Fresh install: generate new key
  const newKey = await generateMasterKey();
  await storeKey(newKey);
  encryptionKey = newKey;
  migrationDone = true;
  return encryptionKey;
}

/**
 * Remove legacy seed if it still exists (for cases where IndexedDB key was set
 * but seed wasn't cleaned up in a previous session)
 */
async function migrateLegacySeed(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  const legacySeed = localStorage.getItem(STORAGE_KEY_SEED);
  if (legacySeed) {
    // Seed still exists but we have an IndexedDB key - just remove it
    localStorage.removeItem(STORAGE_KEY_SEED);
  }
}

/**
 * Re-encrypt all localStorage data from oldKey to newKey
 */
async function reEncryptAll(oldKey: CryptoKey, newKey: CryptoKey): Promise<void> {
  if (typeof localStorage === 'undefined') return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === STORAGE_KEY_SEED) continue;

    const value = localStorage.getItem(key);
    if (!value || !value.startsWith(ENCRYPTED_PREFIX)) continue;

    try {
      // Decrypt with old key
      const plaintext = await decryptWithKey(value, oldKey);
      // Re-encrypt with new key
      const reEncrypted = await encryptWithKey(plaintext, newKey);
      localStorage.setItem(key, reEncrypted);
    } catch {
      // Skip items that fail (may not be ours)
    }
  }
}

async function encryptWithKey(value: string, key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  if (!subtle) throw new Error('SubtleCrypto not available (requires secure context)');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return ENCRYPTED_PREFIX + btoa(String.fromCharCode(...combined));
}

async function decryptWithKey(encrypted: string, key: CryptoKey): Promise<string> {
  const data = encrypted.slice(ENCRYPTED_PREFIX.length);
  const combined = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const subtle = getSubtleCrypto();
  if (!subtle) throw new Error('SubtleCrypto not available (requires secure context)');
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ============================================================================
// Public API
// ============================================================================

async function encrypt(value: string): Promise<string> {
  const key = await getEncryptionKey();
  return encryptWithKey(value, key);
}

async function decrypt(encrypted: string): Promise<string> {
  if (!encrypted.startsWith(ENCRYPTED_PREFIX)) {
    throw new Error('Cannot decrypt: value is not encrypted');
  }
  const key = await getEncryptionKey();
  return decryptWithKey(encrypted, key);
}

/**
 * Secure Storage API
 * Drop-in replacement for localStorage with encryption
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (!getSubtleCrypto()) {
      // Fallback: store unencrypted when crypto unavailable (non-secure context)
      localStorage.setItem(key, value);
      return;
    }
    const encrypted = await encrypt(value);
    localStorage.setItem(key, encrypted);
  },

  async getItem(key: string): Promise<string | null> {
    const value = localStorage.getItem(key);
    if (value === null) return null;

    if (!value.startsWith(ENCRYPTED_PREFIX)) {
      if (!getSubtleCrypto()) {
        // No crypto available - return as-is
        return value;
      }
      // Legacy unencrypted data - encrypt it in-place
      await this.setItem(key, value);
      return value;
    }

    if (!getSubtleCrypto()) {
      // Cannot decrypt without crypto - return null
      return null;
    }
    return await decrypt(value);
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
    encryptionKey = null;
  },

  async migrateKey(key: string): Promise<void> {
    const value = localStorage.getItem(key);
    if (value && !value.startsWith(ENCRYPTED_PREFIX)) {
      await this.setItem(key, value);
    }
  },

  isEncrypted(key: string): boolean {
    const value = localStorage.getItem(key);
    return value !== null && value.startsWith(ENCRYPTED_PREFIX);
  },
};

/**
 * List of sensitive keys that should be encrypted
 */
export const SENSITIVE_KEYS = [
  // Keys that are read through secureStorage (async):
  'tallow_verification_sessions',
  'Tallow_clipboard_history',
  'Tallow_transfer_states',
  'tallow_friends',
  'tallow_friend_requests',
  'tallow_my_friend_code',
];

/**
 * Migrate all sensitive data to encrypted storage
 */
export async function migrateSensitiveData(): Promise<void> {
  const failures: string[] = [];

  for (const key of SENSITIVE_KEYS) {
    try {
      await secureStorage.migrateKey(key);
    } catch {
      failures.push(key);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Failed to encrypt ${failures.length} sensitive key(s): ${failures.join(', ')}. ` +
      `Data remains unencrypted until resolved.`
    );
  }
}

export default secureStorage;
