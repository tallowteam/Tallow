'use client';

/**
 * @fileoverview React hook wrapper for Post-Quantum Cryptography
 * @module hooks/use-pqc-manager
 *
 * Thin wrapper around lib/crypto/pqc-crypto.ts PQCryptoService
 * Provides React-friendly API for hybrid PQC operations.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PQCryptoService,
  HybridKeyPair,
  HybridPublicKey,
  HybridCiphertext,
  EncryptedData,
  SessionKeys
} from '@/lib/crypto/pqc-crypto';

/**
 * Options for PQC manager hook
 */
export interface UsePQCManagerOptions {
  /** Auto-initialize singleton on mount (default: true) */
  autoInit?: boolean;
  /** Reset nonce counter on initialization (default: false) */
  resetNonces?: boolean;
  /** Callback when initialization completes */
  onReady?: () => void;
  /** Callback when initialization fails */
  onInitError?: (error: string) => void;
}

/**
 * Custom hook for Post-Quantum Cryptography operations
 *
 * Wraps PQCryptoService as a React hook with lazy initialization
 * and state management. Provides hybrid PQC (ML-KEM-768 + X25519).
 *
 * @param {UsePQCManagerOptions} options - Configuration options
 * @returns PQC state and cryptographic methods
 *
 * @example
 * ```tsx
 * const {
 *   isInitialized,
 *   error,
 *   generateKeyPair,
 *   encapsulate,
 *   encrypt,
 *   decrypt
 * } = usePQCManager();
 *
 * // Generate keypair
 * const keyPair = await generateKeyPair();
 *
 * // Encapsulate shared secret
 * const { ciphertext, sharedSecret } = await encapsulate(recipientPublicKey);
 *
 * // Encrypt data
 * const encrypted = await encrypt(plaintext, encryptionKey);
 * ```
 */
export function usePQCManager(options: UsePQCManagerOptions = {}) {
  const {
    autoInit = true,
    resetNonces = false,
    onReady,
    onInitError
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<PQCryptoService | null>(null);
  const initAttemptedRef = useRef(false);

  // Initialize PQC service on mount
  useEffect(() => {
    if (!autoInit || initAttemptedRef.current) {return;}

    initAttemptedRef.current = true;

    const initialize = async () => {
      try {
        // Get singleton instance
        serviceRef.current = PQCryptoService.getInstance();

        // Reset nonce manager if requested
        if (resetNonces) {
          serviceRef.current.resetNonceManager();
        }

        setIsInitialized(true);
        setError(null);
        onReady?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize PQC';
        setError(errorMessage);
        setIsInitialized(false);
        onInitError?.(errorMessage);
      }
    };

    initialize();
  }, [autoInit, resetNonces, onReady, onInitError]);

  /**
   * Generate a hybrid keypair (ML-KEM-768 + X25519)
   */
  const generateKeyPair = useCallback(async (): Promise<HybridKeyPair | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const keyPair = await serviceRef.current.generateHybridKeypair();
      return keyPair;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate keypair';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get public key from keypair
   */
  const getPublicKey = useCallback((keyPair: HybridKeyPair): HybridPublicKey | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.getPublicKey(keyPair);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get public key';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Encapsulate: Create shared secret using recipient's public key
   */
  const encapsulate = useCallback(async (
    recipientPublicKey: HybridPublicKey
  ): Promise<{ ciphertext: HybridCiphertext; sharedSecret: Uint8Array } | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const result = await serviceRef.current.encapsulate(recipientPublicKey);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to encapsulate';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Decapsulate: Recover shared secret using own private key
   */
  const decapsulate = useCallback(async (
    ciphertext: HybridCiphertext,
    ownKeyPair: HybridKeyPair
  ): Promise<Uint8Array | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const sharedSecret = await serviceRef.current.decapsulate(ciphertext, ownKeyPair);
      return sharedSecret;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decapsulate';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Derive session keys from shared secret
   */
  const deriveSessionKeys = useCallback((sharedSecret: Uint8Array): SessionKeys | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.deriveSessionKeys(sharedSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to derive keys';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Derive key from password using Argon2id
   */
  const deriveKeyFromPassword = useCallback(async (
    password: string,
    salt: Uint8Array
  ): Promise<Uint8Array | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const key = await serviceRef.current.deriveKeyFromPassword(password, salt);
      return key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to derive key from password';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Encrypt data using AES-256-GCM
   */
  const encrypt = useCallback(async (
    plaintext: Uint8Array,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<EncryptedData | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const encrypted = await serviceRef.current.encrypt(plaintext, key, associatedData);
      return encrypted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Decrypt data using AES-256-GCM
   */
  const decrypt = useCallback(async (
    encrypted: EncryptedData,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<Uint8Array | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const plaintext = await serviceRef.current.decrypt(encrypted, key, associatedData);
      return plaintext;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Compute SHA-256 hash
   */
  const hash = useCallback((data: Uint8Array): Uint8Array | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.hash(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to hash';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Compute HMAC-SHA-256
   */
  const mac = useCallback(async (
    key: Uint8Array,
    data: Uint8Array
  ): Promise<Uint8Array | null> => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      const signature = await serviceRef.current.mac(key, data);
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compute MAC';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Constant-time comparison
   */
  const constantTimeEqual = useCallback((a: Uint8Array, b: Uint8Array): boolean => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return false;
    }

    try {
      return serviceRef.current.constantTimeEqual(a, b);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare';
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Generate random bytes
   */
  const randomBytes = useCallback((length: number): Uint8Array | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.randomBytes(length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate random bytes';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Serialize public key for transmission
   */
  const serializePublicKey = useCallback((publicKey: HybridPublicKey): Uint8Array | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.serializePublicKey(publicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to serialize public key';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Deserialize public key
   */
  const deserializePublicKey = useCallback((serialized: Uint8Array): HybridPublicKey | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.deserializePublicKey(serialized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deserialize public key';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Serialize ciphertext for transmission
   */
  const serializeCiphertext = useCallback((ciphertext: HybridCiphertext): Uint8Array | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.serializeCiphertext(ciphertext);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to serialize ciphertext';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Deserialize ciphertext
   */
  const deserializeCiphertext = useCallback((serialized: Uint8Array): HybridCiphertext | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.deserializeCiphertext(serialized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deserialize ciphertext';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Reset nonce manager (call when key rotates)
   */
  const resetNonceManager = useCallback(() => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return;
    }

    try {
      serviceRef.current.resetNonceManager();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset nonce manager';
      setError(errorMessage);
    }
  }, []);

  /**
   * Get nonce manager status
   */
  const getNonceStatus = useCallback((): { counter: bigint; isNearCapacity: boolean } | null => {
    if (!serviceRef.current) {
      setError('PQC service not initialized');
      return null;
    }

    try {
      return serviceRef.current.getNonceStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get nonce status';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isInitialized,
    error,

    // Key generation and exchange
    generateKeyPair,
    getPublicKey,
    encapsulate,
    decapsulate,
    deriveSessionKeys,
    deriveKeyFromPassword,

    // Encryption/Decryption
    encrypt,
    decrypt,

    // Hashing and MAC
    hash,
    mac,
    constantTimeEqual,

    // Utilities
    randomBytes,
    serializePublicKey,
    deserializePublicKey,
    serializeCiphertext,
    deserializeCiphertext,
    resetNonceManager,
    getNonceStatus,

    // Error handling
    clearError
  };
}

export default usePQCManager;
