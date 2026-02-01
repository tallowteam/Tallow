'use client';

/**
 * ChaCha20-Poly1305 AEAD Encryption
 * Alternative to AES-256-GCM for environments where AES hardware acceleration is unavailable
 *
 * ChaCha20-Poly1305 offers:
 * - Fast software implementation
 * - Constant-time execution (resistant to timing attacks)
 * - IETF standard (RFC 8439)
 * - 256-bit key, 96-bit nonce, 128-bit auth tag
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 * Random nonces have birthday paradox risk; counter-based nonces guarantee uniqueness.
 */

import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { NonceManager } from './nonce-manager';

export interface ChaCha20EncryptedData {
  ciphertext: Uint8Array;
  nonce: Uint8Array; // 96-bit (12 bytes)
  tag: Uint8Array; // 128-bit (16 bytes) auth tag
}

// Module-level nonce manager for ChaCha20-Poly1305
// Each instance provides counter-based nonces with a random session prefix
let chaCha20NonceManager: NonceManager = new NonceManager();

/**
 * Reset the ChaCha20 nonce manager (call when key is rotated)
 *
 * SECURITY: This must be called whenever the encryption key changes
 * to ensure a fresh nonce sequence for the new key.
 */
export function resetChaCha20NonceManager(): void {
  chaCha20NonceManager = new NonceManager();
}

/**
 * Get ChaCha20 nonce manager status (for monitoring/debugging)
 */
export function getChaCha20NonceStatus(): { counter: bigint; isNearCapacity: boolean } {
  return {
    counter: chaCha20NonceManager.getCounter(),
    isNearCapacity: chaCha20NonceManager.isNearCapacity(),
  };
}

/**
 * Encrypt data using ChaCha20-Poly1305
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 * Random nonces have birthday paradox risk after 2^48 messages with the same key.
 * Counter-based nonces guarantee uniqueness up to 2^64 messages per session.
 *
 * @param plaintext Data to encrypt
 * @param key 256-bit (32 byte) encryption key
 * @param associatedData Optional authenticated associated data (AAD)
 * @returns Encrypted data with nonce and auth tag
 */
export function chaCha20Encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  associatedData?: Uint8Array
): ChaCha20EncryptedData {
  if (key.length !== 32) {
    throw new Error('ChaCha20-Poly1305 requires 256-bit (32 byte) key');
  }

  // Get counter-based 96-bit nonce
  // Counter-based nonces prevent collision attacks that random nonces are vulnerable to
  const nonce = chaCha20NonceManager.getNextNonce();

  // Create cipher instance
  const cipher = chacha20poly1305(key, nonce, associatedData);

  // Encrypt and authenticate (returns ciphertext || tag)
  const sealed = cipher.encrypt(plaintext);

  // Split sealed data: ciphertext || tag
  const ciphertext = sealed.slice(0, -16);
  const tag = sealed.slice(-16);

  return {
    ciphertext,
    nonce,
    tag,
  };
}

/**
 * Decrypt data using ChaCha20-Poly1305
 * @param encrypted Encrypted data with nonce and tag
 * @param key 256-bit (32 byte) encryption key
 * @param associatedData Optional authenticated associated data (AAD)
 * @returns Decrypted plaintext
 * @throws Error if authentication fails
 */
export function chaCha20Decrypt(
  encrypted: ChaCha20EncryptedData,
  key: Uint8Array,
  associatedData?: Uint8Array
): Uint8Array {
  if (key.length !== 32) {
    throw new Error('ChaCha20-Poly1305 requires 256-bit (32 byte) key');
  }

  if (encrypted.nonce.length !== 12) {
    throw new Error('ChaCha20-Poly1305 requires 96-bit (12 byte) nonce');
  }

  if (encrypted.tag.length !== 16) {
    throw new Error('ChaCha20-Poly1305 requires 128-bit (16 byte) auth tag');
  }

  // Reconstruct sealed data: ciphertext || tag
  const sealed = new Uint8Array(encrypted.ciphertext.length + encrypted.tag.length);
  sealed.set(encrypted.ciphertext, 0);
  sealed.set(encrypted.tag, encrypted.ciphertext.length);

  // Create cipher instance
  const cipher = chacha20poly1305(key, encrypted.nonce, associatedData);

  // Decrypt and verify (throws on authentication failure)
  try {
    const plaintext = cipher.decrypt(sealed);
    return plaintext;
  } catch (_error) {
    throw new Error('ChaCha20-Poly1305 decryption failed: authentication tag mismatch');
  }
}

/**
 * Generate a random 256-bit ChaCha20 key
 */
export function generateChaCha20Key(): Uint8Array {
  return randomBytes(32);
}

/**
 * Serialize encrypted data to base64 for transmission
 */
export function serializeChaCha20Data(data: ChaCha20EncryptedData): string {
  const combined = new Uint8Array(
    data.nonce.length + data.ciphertext.length + data.tag.length
  );

  combined.set(data.nonce, 0);
  combined.set(data.ciphertext, data.nonce.length);
  combined.set(data.tag, data.nonce.length + data.ciphertext.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Deserialize encrypted data from base64
 */
export function deserializeChaCha20Data(serialized: string): ChaCha20EncryptedData {
  const combined = new Uint8Array(
    atob(serialized).split('').map(c => c.charCodeAt(0))
  );

  const nonce = combined.slice(0, 12);
  const tag = combined.slice(-16);
  const ciphertext = combined.slice(12, -16);

  return { ciphertext, nonce, tag };
}

/**
 * Encrypt string data (convenience wrapper)
 */
export function encryptString(
  text: string,
  key: Uint8Array,
  associatedData?: string
): string {
  const plaintext = new TextEncoder().encode(text);
  const aad = associatedData ? new TextEncoder().encode(associatedData) : undefined;
  const encrypted = chaCha20Encrypt(plaintext, key, aad);
  return serializeChaCha20Data(encrypted);
}

/**
 * Decrypt string data (convenience wrapper)
 */
export function decryptString(
  encrypted: string,
  key: Uint8Array,
  associatedData?: string
): string {
  const data = deserializeChaCha20Data(encrypted);
  const aad = associatedData ? new TextEncoder().encode(associatedData) : undefined;
  const plaintext = chaCha20Decrypt(data, key, aad);
  return new TextDecoder().decode(plaintext);
}

/**
 * ChaCha20-Poly1305 Encryption Service
 * Provides a consistent interface similar to AES-GCM
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 */
export class ChaCha20Service {
  private static instance: ChaCha20Service;

  private constructor() {}

  static getInstance(): ChaCha20Service {
    if (!ChaCha20Service.instance) {
      ChaCha20Service.instance = new ChaCha20Service();
    }
    return ChaCha20Service.instance;
  }

  /**
   * Generate encryption key
   */
  generateKey(): Uint8Array {
    return generateChaCha20Key();
  }

  /**
   * Encrypt data
   *
   * SECURITY: Uses counter-based nonces internally via chaCha20Encrypt
   */
  encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): ChaCha20EncryptedData {
    return chaCha20Encrypt(plaintext, key, associatedData);
  }

  /**
   * Decrypt data
   */
  decrypt(
    encrypted: ChaCha20EncryptedData,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Uint8Array {
    return chaCha20Decrypt(encrypted, key, associatedData);
  }

  /**
   * Serialize encrypted data
   */
  serialize(data: ChaCha20EncryptedData): string {
    return serializeChaCha20Data(data);
  }

  /**
   * Deserialize encrypted data
   */
  deserialize(serialized: string): ChaCha20EncryptedData {
    return deserializeChaCha20Data(serialized);
  }

  /**
   * Reset nonce manager (call when key is rotated)
   *
   * SECURITY: Must be called whenever the encryption key changes
   */
  resetNonceManager(): void {
    resetChaCha20NonceManager();
  }

  /**
   * Get nonce status (for monitoring/debugging)
   */
  getNonceStatus(): { counter: bigint; isNearCapacity: boolean } {
    return getChaCha20NonceStatus();
  }
}

// Export singleton instance
export const chaCha20Service = ChaCha20Service.getInstance();
