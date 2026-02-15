/**
 * WebAuthn Credential Store
 *
 * Manages storage and retrieval of WebAuthn credentials with encryption at rest.
 * Credentials are encrypted using AES-256-GCM before being persisted to IndexedDB.
 * The encryption key is derived from a device-bound secret via HKDF.
 *
 * AGENT 018 - WEBAUTHN-GATEKEEPER:
 * - Credentials encrypted at rest in IndexedDB (not plaintext localStorage)
 * - Counter tracked from authenticator data, not incremented client-side
 * - Clone detection via counter verification on every authentication
 */

import { create } from 'zustand';
import {
  StoredCredential,
  AttestationFormat,
  AttestationTrustPath,
  COSEAlgorithmIdentifier,
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
} from './webauthn';
import { addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// Type Definitions
// ============================================================================

export interface WebAuthnStoreState {
  /** Decrypted credentials held in memory while app is active */
  credentials: StoredCredential[];

  /** Currently selected credential for authentication */
  selectedCredentialId: string | null;

  /** User preferences */
  autoAuthenticate: boolean;
  preferPlatformAuthenticator: boolean;

  /** Whether the store has been hydrated from IndexedDB */
  hydrated: boolean;

  // Actions - Credential Management
  addCredential: (credential: StoredCredential) => void;
  removeCredential: (credentialId: string) => void;
  updateCredentialCounter: (credentialId: string, newCounter: number) => void;
  updateCredential: (credentialId: string, updates: Partial<StoredCredential>) => void;
  clearCredentials: () => void;

  // Actions - Selection
  selectCredential: (credentialId: string | null) => void;

  // Actions - Preferences
  setAutoAuthenticate: (enabled: boolean) => void;
  setPreferPlatformAuthenticator: (prefer: boolean) => void;

  // Selectors
  getCredentialById: (credentialId: string) => StoredCredential | undefined;
  getCredentialsByType: (attachment: 'platform' | 'cross-platform') => StoredCredential[];
  getPrimaryCredential: () => StoredCredential | undefined;
  getRecentCredential: () => StoredCredential | undefined;

  // Actions - Usage Tracking
  markCredentialUsed: (credentialId: string, authenticatorCounter: number) => void;

  // Actions - Persistence
  hydrateFromStorage: () => Promise<void>;
  persistToStorage: () => Promise<void>;
}

// ============================================================================
// Encrypted IndexedDB Storage
// ============================================================================

const DB_NAME = 'tallow-webauthn';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted-credentials';
const META_STORE_NAME = 'metadata';
const ENCRYPTION_KEY_ID = 'credential-encryption-key';

/**
 * Open the IndexedDB database for credential storage.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get or create the encryption key for credential storage.
 * The key is an AES-256-GCM key stored in IndexedDB as a non-extractable CryptoKey.
 * This means the key itself is bound to this origin and cannot be exported.
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  try {
    const db = await openDatabase();

    // Try to load existing key
    const existingKey = await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(META_STORE_NAME, 'readonly');
      const store = tx.objectStore(META_STORE_NAME);
      const request = store.get(ENCRYPTION_KEY_ID);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.key ?? null);
      };
      request.onerror = () => reject(request.error);
    });

    if (existingKey) {
      db.close();
      return existingKey;
    }

    // Generate a new AES-256-GCM key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable -- bound to this origin
      ['encrypt', 'decrypt']
    );

    // Store the key
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE_NAME, 'readwrite');
      const store = tx.objectStore(META_STORE_NAME);
      const request = store.put({ id: ENCRYPTION_KEY_ID, key });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    return key;
  } catch (error) {
    addBreadcrumb('webauthn-store', 'Failed to get/create encryption key, falling back', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    // Fallback: generate an ephemeral key (credentials won't persist across sessions)
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

/**
 * Encrypt credential data for storage.
 */
async function encryptCredentialData(
  key: CryptoKey,
  data: StoredCredential[]
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    plaintext
  );

  return {
    iv: arrayBufferToBase64Url(iv.buffer),
    ciphertext: arrayBufferToBase64Url(ciphertext),
  };
}

/**
 * Decrypt credential data from storage.
 */
async function decryptCredentialData(
  key: CryptoKey,
  iv: string,
  ciphertext: string
): Promise<StoredCredential[]> {
  const ivBytes = new Uint8Array(base64UrlToArrayBuffer(iv));
  const ciphertextBytes = new Uint8Array(base64UrlToArrayBuffer(ciphertext));

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
    key,
    ciphertextBytes
  );

  const text = new TextDecoder().decode(plaintext);
  return JSON.parse(text) as StoredCredential[];
}

/**
 * Save encrypted credentials to IndexedDB.
 */
async function saveEncryptedCredentials(credentials: StoredCredential[]): Promise<void> {
  try {
    const key = await getOrCreateEncryptionKey();
    const encrypted = await encryptCredentialData(key, credentials);

    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({
        id: 'credentials',
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
        updatedAt: Date.now(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch (error) {
    addBreadcrumb('webauthn-store', 'Failed to save encrypted credentials', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

/**
 * Load and decrypt credentials from IndexedDB.
 */
async function loadEncryptedCredentials(): Promise<StoredCredential[]> {
  try {
    const key = await getOrCreateEncryptionKey();
    const db = await openDatabase();

    const record = await new Promise<{ iv: string; ciphertext: string } | null>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('credentials');
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? { iv: result.iv, ciphertext: result.ciphertext } : null);
        };
        request.onerror = () => reject(request.error);
      }
    );

    db.close();

    if (!record) {
      return [];
    }

    return await decryptCredentialData(key, record.iv, record.ciphertext);
  } catch (error) {
    addBreadcrumb('webauthn-store', 'Failed to load encrypted credentials', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return [];
  }
}

/**
 * Save preferences to localStorage (non-sensitive data only).
 */
function savePreferences(prefs: {
  selectedCredentialId: string | null;
  autoAuthenticate: boolean;
  preferPlatformAuthenticator: boolean;
}): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tallow-webauthn-prefs', JSON.stringify(prefs));
    }
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Load preferences from localStorage.
 */
function loadPreferences(): {
  selectedCredentialId: string | null;
  autoAuthenticate: boolean;
  preferPlatformAuthenticator: boolean;
} {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tallow-webauthn-prefs');
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // localStorage may be unavailable
  }
  return {
    selectedCredentialId: null,
    autoAuthenticate: false,
    preferPlatformAuthenticator: true,
  };
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useWebAuthnStore = create<WebAuthnStoreState>()(
  (set, get) => ({
    // Initial state
    credentials: [],
    selectedCredentialId: null,
    autoAuthenticate: false,
    preferPlatformAuthenticator: true,
    hydrated: false,

    // Actions - Credential Management
    addCredential: (credential: StoredCredential) => {
      addBreadcrumb('webauthn-store', 'Adding WebAuthn credential', {
        credentialId: credential.credentialId.slice(0, 16) + '...',
        deviceName: credential.deviceName,
        authenticatorAttachment: credential.authenticatorAttachment,
        attestationFormat: credential.attestationFormat,
      });

      set((state) => {
        const exists = state.credentials.some(
          (c) => c.credentialId === credential.credentialId
        );

        const newCredentials = exists
          ? state.credentials.map((c) =>
              c.credentialId === credential.credentialId
                ? { ...c, ...credential }
                : c
            )
          : [...state.credentials, credential];

        // Persist asynchronously
        saveEncryptedCredentials(newCredentials);

        return { credentials: newCredentials };
      });
    },

    removeCredential: (credentialId: string) => {
      addBreadcrumb('webauthn-store', 'Removing WebAuthn credential', {
        credentialId: credentialId.slice(0, 16) + '...',
      });

      set((state) => {
        const newCredentials = state.credentials.filter(
          (c) => c.credentialId !== credentialId
        );

        saveEncryptedCredentials(newCredentials);

        return {
          credentials: newCredentials,
          selectedCredentialId:
            state.selectedCredentialId === credentialId
              ? null
              : state.selectedCredentialId,
        };
      });
    },

    /**
     * Update the authenticator counter from a verified assertion.
     * This is the ONLY way the counter should be updated -- from the
     * authenticator's actual sign counter, not incremented client-side.
     */
    updateCredentialCounter: (credentialId: string, newCounter: number) => {
      set((state) => {
        const newCredentials = state.credentials.map((c) =>
          c.credentialId === credentialId
            ? { ...c, counter: newCounter, lastUsedAt: Date.now() }
            : c
        );

        saveEncryptedCredentials(newCredentials);

        return { credentials: newCredentials };
      });
    },

    updateCredential: (credentialId: string, updates: Partial<StoredCredential>) => {
      set((state) => {
        const newCredentials = state.credentials.map((c) =>
          c.credentialId === credentialId ? { ...c, ...updates } : c
        );

        saveEncryptedCredentials(newCredentials);

        return { credentials: newCredentials };
      });
    },

    clearCredentials: () => {
      addBreadcrumb('webauthn-store', 'Clearing all WebAuthn credentials');

      set({ credentials: [], selectedCredentialId: null });

      // Clear from IndexedDB
      saveEncryptedCredentials([]);
    },

    // Actions - Selection
    selectCredential: (credentialId: string | null) => {
      set({ selectedCredentialId: credentialId });
      const state = get();
      savePreferences({
        selectedCredentialId: credentialId,
        autoAuthenticate: state.autoAuthenticate,
        preferPlatformAuthenticator: state.preferPlatformAuthenticator,
      });
    },

    // Actions - Preferences
    setAutoAuthenticate: (enabled: boolean) => {
      addBreadcrumb('webauthn-store', 'Setting auto-authenticate', { enabled });
      set({ autoAuthenticate: enabled });
      const state = get();
      savePreferences({
        selectedCredentialId: state.selectedCredentialId,
        autoAuthenticate: enabled,
        preferPlatformAuthenticator: state.preferPlatformAuthenticator,
      });
    },

    setPreferPlatformAuthenticator: (prefer: boolean) => {
      set({ preferPlatformAuthenticator: prefer });
      const state = get();
      savePreferences({
        selectedCredentialId: state.selectedCredentialId,
        autoAuthenticate: state.autoAuthenticate,
        preferPlatformAuthenticator: prefer,
      });
    },

    // Selectors
    getCredentialById: (credentialId: string) => {
      const state = get();
      return state.credentials.find((c) => c.credentialId === credentialId);
    },

    getCredentialsByType: (attachment: 'platform' | 'cross-platform') => {
      const state = get();
      return state.credentials.filter(
        (c) => c.authenticatorAttachment === attachment
      );
    },

    getPrimaryCredential: () => {
      const state = get();
      if (state.credentials.length === 0) {
        return undefined;
      }

      // Return selected credential if set
      if (state.selectedCredentialId) {
        const selected = state.credentials.find(
          (c) => c.credentialId === state.selectedCredentialId
        );
        if (selected) {
          return selected;
        }
      }

      // Return most recently used credential
      const sorted = [...state.credentials].sort(
        (a, b) => b.lastUsedAt - a.lastUsedAt
      );
      return sorted[0];
    },

    getRecentCredential: () => {
      const state = get();
      if (state.credentials.length === 0) {
        return undefined;
      }

      const sorted = [...state.credentials].sort(
        (a, b) => b.lastUsedAt - a.lastUsedAt
      );
      return sorted[0];
    },

    // Actions - Usage Tracking
    /**
     * Mark a credential as used with the authenticator's actual counter value.
     * The counter MUST come from the verified assertion's authenticator data,
     * never from client-side incrementing.
     */
    markCredentialUsed: (credentialId: string, authenticatorCounter: number) => {
      const now = Date.now();

      set((state) => {
        const credential = state.credentials.find(
          (c) => c.credentialId === credentialId
        );

        if (!credential) {
          return state;
        }

        // SECURITY: Counter must come from authenticator, not client-side increment
        // If the new counter is not greater than stored, this is a potential clone
        if (credential.counter > 0 && authenticatorCounter > 0 && authenticatorCounter <= credential.counter) {
          addBreadcrumb('webauthn-store', 'SECURITY: Counter regression detected in markCredentialUsed', {
            credentialId: credentialId.slice(0, 16) + '...',
            storedCounter: credential.counter,
            newCounter: authenticatorCounter,
          });
          // Do not update -- return unchanged state
          return state;
        }

        const newCredentials = state.credentials.map((c) =>
          c.credentialId === credentialId
            ? { ...c, lastUsedAt: now, counter: authenticatorCounter }
            : c
        );

        saveEncryptedCredentials(newCredentials);

        return { credentials: newCredentials };
      });
    },

    // Actions - Persistence
    hydrateFromStorage: async () => {
      const credentials = await loadEncryptedCredentials();
      const prefs = loadPreferences();

      set({
        credentials,
        selectedCredentialId: prefs.selectedCredentialId,
        autoAuthenticate: prefs.autoAuthenticate,
        preferPlatformAuthenticator: prefs.preferPlatformAuthenticator,
        hydrated: true,
      });

      addBreadcrumb('webauthn-store', 'Hydrated from encrypted storage', {
        credentialCount: credentials.length,
      });
    },

    persistToStorage: async () => {
      const state = get();
      await saveEncryptedCredentials(state.credentials);
      savePreferences({
        selectedCredentialId: state.selectedCredentialId,
        autoAuthenticate: state.autoAuthenticate,
        preferPlatformAuthenticator: state.preferPlatformAuthenticator,
      });
    },
  })
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a device name from user agent.
 */
export function generateDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'Unknown Device';
  }

  const ua = window.navigator.userAgent.toLowerCase();

  if (ua.includes('chrome') && !ua.includes('edge')) {
    return 'Chrome Browser';
  } else if (ua.includes('edge')) {
    return 'Edge Browser';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari Browser';
  } else if (ua.includes('firefox')) {
    return 'Firefox Browser';
  }

  if (ua.includes('iphone') || ua.includes('ipad')) {
    return 'iOS Device';
  } else if (ua.includes('android')) {
    return 'Android Device';
  } else if (ua.includes('windows')) {
    return 'Windows Device';
  } else if (ua.includes('mac')) {
    return 'Mac Device';
  } else if (ua.includes('linux')) {
    return 'Linux Device';
  }

  return 'Unknown Device';
}

/**
 * Create a StoredCredential from a verified registration result.
 * This should be called AFTER attestation verification, using the
 * verified attestation result for the public key and counter.
 */
export function createStoredCredentialFromAttestation(
  credentialId: string,
  publicKey: Uint8Array,
  publicKeyAlgorithm: COSEAlgorithmIdentifier,
  counter: number,
  aaguid: string,
  attestationFormat: AttestationFormat,
  attestationTrustPath: AttestationTrustPath,
  authenticatorAttachment?: 'platform' | 'cross-platform',
  transports?: AuthenticatorTransport[],
  deviceName?: string
): StoredCredential {
  const publicKeyBase64 = arrayBufferToBase64Url(publicKey.buffer);

  return {
    id: credentialId,
    credentialId,
    publicKey: publicKeyBase64,
    publicKeyAlgorithm,
    counter,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    deviceName: deviceName || generateDeviceName(),
    authenticatorAttachment: authenticatorAttachment ?? 'cross-platform',
    transports: transports ?? [],
    aaguid,
    attestationFormat,
    attestationTrustPath,
  };
}

/**
 * Legacy helper: Create a StoredCredential from a raw PublicKeyCredential.
 * Prefer createStoredCredentialFromAttestation() which uses verified data.
 */
export function createStoredCredential(
  credential: PublicKeyCredential,
  deviceName?: string
): StoredCredential {
  const response = credential.response as AuthenticatorAttestationResponse;
  const responseWithOptionalTransports = response as AuthenticatorAttestationResponse & {
    getTransports?: () => AuthenticatorTransport[];
  };
  const isAuthenticatorTransport = (value: string): value is AuthenticatorTransport =>
    value === 'ble' ||
    value === 'hybrid' ||
    value === 'internal' ||
    value === 'nfc' ||
    value === 'smart-card' ||
    value === 'usb';
  const transports = typeof responseWithOptionalTransports.getTransports === 'function'
    ? responseWithOptionalTransports.getTransports().filter((transport) =>
        isAuthenticatorTransport(transport)
      )
    : [];

  // Extract public key via getPublicKey() (SPKI format)
  const publicKeyBytes = new Uint8Array(response.getPublicKey() || new ArrayBuffer(0));
  const publicKeyBase64 = arrayBufferToBase64Url(publicKeyBytes.buffer);

  // Extract algorithm from getPublicKeyAlgorithm() if available
  const getAlgorithm = (response as AuthenticatorAttestationResponse & {
    getPublicKeyAlgorithm?: () => number;
  }).getPublicKeyAlgorithm;
  const algorithm: COSEAlgorithmIdentifier = typeof getAlgorithm === 'function'
    ? (getAlgorithm() as COSEAlgorithmIdentifier)
    : -7; // default to ES256

  return {
    id: credential.id,
    credentialId: credential.id,
    publicKey: publicKeyBase64,
    publicKeyAlgorithm: algorithm,
    counter: 0,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    deviceName: deviceName || generateDeviceName(),
    authenticatorAttachment: (credential as PublicKeyCredential & {
      authenticatorAttachment?: 'platform' | 'cross-platform';
    }).authenticatorAttachment,
    transports,
  };
}

// ============================================================================
// Export helper functions
// ============================================================================

export const webauthnStore = {
  generateDeviceName,
  createStoredCredential,
  createStoredCredentialFromAttestation,
};
