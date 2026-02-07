'use client';

/**
 * WebAuthn Credential Store
 *
 * Manages storage and retrieval of WebAuthn credentials
 * with encryption for sensitive data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoredCredential } from './webauthn';
import { addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// Type Definitions
// ============================================================================

export interface WebAuthnStoreState {
  // Stored credentials
  credentials: StoredCredential[];

  // Currently selected credential for authentication
  selectedCredentialId: string | null;

  // User preferences
  autoAuthenticate: boolean;
  preferPlatformAuthenticator: boolean;

  // Actions - Credential Management
  addCredential: (credential: StoredCredential) => void;
  removeCredential: (credentialId: string) => void;
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
  markCredentialUsed: (credentialId: string) => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useWebAuthnStore = create<WebAuthnStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      credentials: [],
      selectedCredentialId: null,
      autoAuthenticate: false,
      preferPlatformAuthenticator: true,

      // Actions - Credential Management
      addCredential: (credential: StoredCredential) => {
        addBreadcrumb('Adding WebAuthn credential', 'webauthn-store', {
          credentialId: credential.credentialId.slice(0, 16) + '...',
          deviceName: credential.deviceName,
          authenticatorAttachment: credential.authenticatorAttachment,
        });

        set((state) => {
          // Check if credential already exists
          const exists = state.credentials.some(
            (c) => c.credentialId === credential.credentialId
          );

          if (exists) {
            // Update existing credential
            return {
              credentials: state.credentials.map((c) =>
                c.credentialId === credential.credentialId
                  ? { ...c, ...credential }
                  : c
              ),
            };
          }

          // Add new credential
          return {
            credentials: [...state.credentials, credential],
          };
        });
      },

      removeCredential: (credentialId: string) => {
        addBreadcrumb('Removing WebAuthn credential', 'webauthn-store', {
          credentialId: credentialId.slice(0, 16) + '...',
        });

        set((state) => ({
          credentials: state.credentials.filter(
            (c) => c.credentialId !== credentialId
          ),
          selectedCredentialId:
            state.selectedCredentialId === credentialId
              ? null
              : state.selectedCredentialId,
        }));
      },

      updateCredential: (credentialId: string, updates: Partial<StoredCredential>) => {
        set((state) => ({
          credentials: state.credentials.map((c) =>
            c.credentialId === credentialId ? { ...c, ...updates } : c
          ),
        }));
      },

      clearCredentials: () => {
        addBreadcrumb('Clearing all WebAuthn credentials', 'webauthn-store');

        set({
          credentials: [],
          selectedCredentialId: null,
        });
      },

      // Actions - Selection
      selectCredential: (credentialId: string | null) => {
        set({ selectedCredentialId: credentialId });
      },

      // Actions - Preferences
      setAutoAuthenticate: (enabled: boolean) => {
        addBreadcrumb('Setting auto-authenticate', 'webauthn-store', {
          enabled,
        });

        set({ autoAuthenticate: enabled });
      },

      setPreferPlatformAuthenticator: (prefer: boolean) => {
        set({ preferPlatformAuthenticator: prefer });
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

        // Return most recently used credential
        const sorted = [...state.credentials].sort(
          (a, b) => b.lastUsedAt - a.lastUsedAt
        );
        return sorted[0];
      },

      // Actions - Usage Tracking
      markCredentialUsed: (credentialId: string) => {
        const now = Date.now();

        set((state) => ({
          credentials: state.credentials.map((c) =>
            c.credentialId === credentialId
              ? { ...c, lastUsedAt: now, counter: c.counter + 1 }
              : c
          ),
        }));
      },
    }),
    {
      name: 'tallow-webauthn-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credentials: state.credentials,
        selectedCredentialId: state.selectedCredentialId,
        autoAuthenticate: state.autoAuthenticate,
        preferPlatformAuthenticator: state.preferPlatformAuthenticator,
      }),
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a device name from user agent
 */
export function generateDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'Unknown Device';
  }

  const ua = window.navigator.userAgent.toLowerCase();

  if (ua.includes('chrome')) {
    return 'Chrome Browser';
  } else if (ua.includes('safari')) {
    return 'Safari Browser';
  } else if (ua.includes('firefox')) {
    return 'Firefox Browser';
  } else if (ua.includes('edge')) {
    return 'Edge Browser';
  }

  if (ua.includes('windows')) {
    return 'Windows Device';
  } else if (ua.includes('mac')) {
    return 'Mac Device';
  } else if (ua.includes('linux')) {
    return 'Linux Device';
  } else if (ua.includes('android')) {
    return 'Android Device';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    return 'iOS Device';
  }

  return 'Unknown Device';
}

/**
 * Create a StoredCredential from a PublicKeyCredential
 */
export function createStoredCredential(
  credential: PublicKeyCredential,
  deviceName?: string
): StoredCredential {
  const response = credential.response as AuthenticatorAttestationResponse;

  // Extract public key from attestation object (simplified)
  // In production, you'd parse the CBOR attestation object properly
  const publicKeyBytes = new Uint8Array(response.getPublicKey() || new ArrayBuffer(0));
  const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    id: credential.id,
    credentialId: credential.id,
    publicKey: publicKeyBase64,
    counter: 0,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    deviceName: deviceName || generateDeviceName(),
    authenticatorAttachment: (credential as any).authenticatorAttachment,
    // @ts-expect-error - getTransports may not be available in all browsers
    transports: response.getTransports?.() || [],
  };
}

// ============================================================================
// Export helper functions
// ============================================================================

export const webauthnStore = {
  generateDeviceName,
  createStoredCredential,
};
