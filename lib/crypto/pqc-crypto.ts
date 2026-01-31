'use client';

/**
 * Post-Quantum Cryptography Service
 * Implements hybrid encryption: ML-KEM-768 (Kyber) + X25519 + AES-256-GCM
 *
 * This provides defense against both classical and quantum attacks.
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 * Random nonces have birthday paradox risk; counter-based nonces guarantee uniqueness.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { x25519 } from '@noble/curves/ed25519.js';
import * as kyber from 'pqc-kyber';
import { NonceManager } from './nonce-manager';
import { deriveKeyFromPassword as deriveKeyArgon2, ARGON2_DEFAULTS } from './argon2-browser';

// ============================================================================
// Type Definitions
// ============================================================================

export interface KyberKeyPair {
  publicKey: Uint8Array;  // 1184 bytes for ML-KEM-768
  secretKey: Uint8Array;  // 2400 bytes for ML-KEM-768
}

export interface X25519KeyPair {
  publicKey: Uint8Array;  // 32 bytes
  privateKey: Uint8Array; // 32 bytes
}

export interface HybridKeyPair {
  kyber: KyberKeyPair;
  x25519: X25519KeyPair;
}

export interface HybridCiphertext {
  kyberCiphertext: Uint8Array;  // 1088 bytes for ML-KEM-768
  x25519EphemeralPublic: Uint8Array;  // 32 bytes
}

export interface HybridPublicKey {
  kyberPublicKey: Uint8Array;
  x25519PublicKey: Uint8Array;
}

export interface EncryptedData {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export interface SessionKeys {
  encryptionKey: Uint8Array;  // 32 bytes for AES-256
  authKey: Uint8Array;        // 32 bytes for HMAC
  sessionId: Uint8Array;      // 16 bytes
}

// ============================================================================
// PQC Crypto Service
// ============================================================================

export class PQCryptoService {
  private static instance: PQCryptoService;
  private nonceManager: NonceManager;

  private constructor() {
    // Initialize counter-based nonce manager for AES-GCM encryption
    // This prevents nonce reuse which would be catastrophic for security
    this.nonceManager = new NonceManager();
  }

  /**
   * Convert Uint8Array to ArrayBuffer (for Web Crypto API compatibility)
   */
  private toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }

  static getInstance(): PQCryptoService {
    if (!PQCryptoService.instance) {
      PQCryptoService.instance = new PQCryptoService();
    }
    return PQCryptoService.instance;
  }

  // ==========================================================================
  // Key Generation
  // ==========================================================================

  /**
   * Generate a hybrid keypair (Kyber + X25519)
   * This provides post-quantum security via Kyber and classical security via X25519
   */
  async generateHybridKeypair(): Promise<HybridKeyPair> {
    // Generate Kyber keypair (post-quantum)
    const kyberKeys = kyber.keypair();

    // Generate X25519 keypair (classical)
    const x25519PrivateKey = this.randomBytes(32);
    const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

    return {
      kyber: {
        publicKey: kyberKeys.pubkey,
        secretKey: kyberKeys.secret,
      },
      x25519: {
        publicKey: x25519PublicKey,
        privateKey: x25519PrivateKey,
      },
    };
  }

  /**
   * Get the public portion of a hybrid keypair for sharing
   */
  getPublicKey(keyPair: HybridKeyPair): HybridPublicKey {
    return {
      kyberPublicKey: keyPair.kyber.publicKey,
      x25519PublicKey: keyPair.x25519.publicKey,
    };
  }

  // ==========================================================================
  // Key Exchange (Encapsulation/Decapsulation)
  // ==========================================================================

  /**
   * Encapsulate: Sender creates shared secret using recipient's public key
   *
   * The shared secret is derived from both:
   * - Kyber encapsulation (quantum-resistant)
   * - X25519 ECDH (classically secure)
   */
  async encapsulate(
    recipientPublicKey: HybridPublicKey
  ): Promise<{ ciphertext: HybridCiphertext; sharedSecret: Uint8Array }> {
    if (!recipientPublicKey.kyberPublicKey || recipientPublicKey.kyberPublicKey.length !== 1184) {
      throw new Error('Invalid Kyber public key: must be 1184 bytes');
    }
    if (!recipientPublicKey.x25519PublicKey || recipientPublicKey.x25519PublicKey.length !== 32) {
      throw new Error('Invalid X25519 public key: must be 32 bytes');
    }

    // Kyber encapsulation
    const kyberResult = kyber.encapsulate(recipientPublicKey.kyberPublicKey);

    // X25519 ephemeral key exchange
    const ephemeralPrivateKey = this.randomBytes(32);
    const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);
    const x25519SharedSecret = x25519.getSharedSecret(
      ephemeralPrivateKey,
      recipientPublicKey.x25519PublicKey
    );

    // Combine both shared secrets using HKDF
    const combinedSecret = this.combineSecrets(
      kyberResult.sharedSecret,
      x25519SharedSecret
    );

    return {
      ciphertext: {
        kyberCiphertext: kyberResult.ciphertext,
        x25519EphemeralPublic: ephemeralPublicKey,
      },
      sharedSecret: combinedSecret,
    };
  }

  /**
   * Decapsulate: Recipient recovers shared secret using their private key
   */
  async decapsulate(
    ciphertext: HybridCiphertext,
    ownKeyPair: HybridKeyPair
  ): Promise<Uint8Array> {
    // Kyber decapsulation
    const kyberSharedSecret = kyber.decapsulate(
      ciphertext.kyberCiphertext,
      ownKeyPair.kyber.secretKey
    );

    if (!kyberSharedSecret) {
      throw new Error('Kyber decapsulation failed - ciphertext may not match your keys. Make sure the sender used YOUR public key to encapsulate.');
    }

    // X25519 key recovery
    const x25519SharedSecret = x25519.getSharedSecret(
      ownKeyPair.x25519.privateKey,
      ciphertext.x25519EphemeralPublic
    );

    // Combine both shared secrets using HKDF
    return this.combineSecrets(kyberSharedSecret, x25519SharedSecret);
  }

  /**
   * Combine two shared secrets using HKDF
   * This ensures the combined secret is cryptographically strong
   */
  private combineSecrets(
    kyberSecret: Uint8Array,
    x25519Secret: Uint8Array
  ): Uint8Array {
    // Concatenate secrets as input key material
    const ikm = new Uint8Array(kyberSecret.length + x25519Secret.length);
    ikm.set(kyberSecret, 0);
    ikm.set(x25519Secret, kyberSecret.length);

    // Use HKDF to derive the combined secret
    const info = new TextEncoder().encode('tallow-hybrid-v1');
    const result = hkdf(sha256, ikm, undefined, info, 32);

    // Zero intermediate buffer to prevent key material leakage
    ikm.fill(0);

    return result;
  }

  // ==========================================================================
  // Session Key Derivation
  // ==========================================================================

  /**
   * Derive session keys from shared secret using HKDF
   *
   * Derives three separate keys:
   * - Encryption key (AES-256)
   * - Authentication key (HMAC-SHA-256)
   * - Session ID
   */
  deriveSessionKeys(sharedSecret: Uint8Array): SessionKeys {
    // Derive all keys in one HKDF call for efficiency
    const info = new TextEncoder().encode('tallow-session-keys-v1');
    // Use a fixed salt (better than undefined which defaults to zeros)
    // This salt is public and consistent - it's the "domain separation" for our app
    const salt = new TextEncoder().encode('tallow-kdf-salt-v1-2024');
    const keyMaterial = hkdf(
      sha256,
      sharedSecret,
      salt,
      info,
      80  // 32 + 32 + 16 bytes
    );

    return {
      encryptionKey: keyMaterial.slice(0, 32),
      authKey: keyMaterial.slice(32, 64),
      sessionId: keyMaterial.slice(64, 80),
    };
  }

  /**
   * Derive a key from password using Argon2id (memory-hard KDF)
   *
   * SECURITY: Uses Argon2id with OWASP-recommended parameters:
   * - 64 MiB memory cost (GPU/ASIC resistant)
   * - 3 iterations (time cost)
   * - 4 parallelism factor
   *
   * This is significantly more secure than HKDF for password-derived keys
   * as it provides protection against brute-force attacks with specialized hardware.
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
    // Use Argon2id from argon2-browser.ts with OWASP-recommended defaults
    // (64MB memory, 3 iterations, 4 parallelism)
    return deriveKeyArgon2(password, salt, {
      memory: ARGON2_DEFAULTS.memory,
      iterations: ARGON2_DEFAULTS.iterations,
      parallelism: ARGON2_DEFAULTS.parallelism,
      hashLength: 32,
    });
  }

  // ==========================================================================
  // Encryption/Decryption (AES-256-GCM)
  // ==========================================================================

  /**
   * Reset the nonce manager (call when key is rotated)
   *
   * SECURITY: This must be called whenever the encryption key changes
   * to ensure a fresh nonce sequence for the new key.
   */
  resetNonceManager(): void {
    this.nonceManager = new NonceManager();
  }

  /**
   * Get nonce manager status (for monitoring/debugging)
   */
  getNonceStatus(): { counter: bigint; isNearCapacity: boolean } {
    return {
      counter: this.nonceManager.getCounter(),
      isNearCapacity: this.nonceManager.isNearCapacity(),
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   *
   * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
   * Random nonces have birthday paradox risk after 2^48 messages with the same key.
   * Counter-based nonces guarantee uniqueness up to 2^64 messages per session.
   */
  async encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<EncryptedData> {
    if (!(plaintext instanceof Uint8Array)) {
      throw new Error('Plaintext must be a Uint8Array');
    }
    if (!(key instanceof Uint8Array)) {
      throw new Error('Key must be a Uint8Array');
    }
    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes');
    }
    if (plaintext.length === 0) {
      throw new Error('Plaintext must not be empty');
    }

    // Get counter-based nonce (96 bits for GCM)
    // Counter-based nonces prevent collision attacks that random nonces are vulnerable to
    const nonce = this.nonceManager.getNextNonce();

    // Import key for Web Crypto
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      this.toArrayBuffer(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt with AES-256-GCM
    const params: AesGcmParams = {
      name: 'AES-GCM',
      iv: this.toArrayBuffer(nonce),
      tagLength: 128,
    };
    if (associatedData) {
      params.additionalData = this.toArrayBuffer(associatedData);
    }

    const encrypted = await crypto.subtle.encrypt(
      params,
      cryptoKey,
      this.toArrayBuffer(plaintext)
    );

    return {
      ciphertext: new Uint8Array(encrypted),
      nonce,
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(
    encrypted: EncryptedData,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<Uint8Array> {
    // Validate key length
    if (key.length !== 32) {
      throw new Error('Decryption key must be 32 bytes');
    }

    // Import key for Web Crypto
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      this.toArrayBuffer(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt
    const params: AesGcmParams = {
      name: 'AES-GCM',
      iv: this.toArrayBuffer(encrypted.nonce),
      tagLength: 128,
    };
    if (associatedData) {
      params.additionalData = this.toArrayBuffer(associatedData);
    }

    const decrypted = await crypto.subtle.decrypt(
      params,
      cryptoKey,
      this.toArrayBuffer(encrypted.ciphertext)
    );

    return new Uint8Array(decrypted);
  }

  // ==========================================================================
  // Hashing
  // ==========================================================================

  /**
   * Compute SHA-256 hash
   */
  hash(data: Uint8Array): Uint8Array {
    return sha256(data);
  }

  /**
   * Compute HMAC-SHA-256
   */
  async mac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      this.toArrayBuffer(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, this.toArrayBuffer(data));
    return new Uint8Array(signature);
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Constant-time comparison to prevent timing attacks
   * Both length check and content check are constant-time
   */
  constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    // Use the longer length to avoid leaking length information
    const len = Math.max(a.length, b.length);
    let result = a.length ^ b.length; // Non-zero if lengths differ

    for (let i = 0; i < len; i++) {
      // Use 0 for out-of-bounds access (safe: XOR with 0 is identity)
      result |= (a[i] || 0) ^ (b[i] || 0);
    }
    return result === 0;
  }

  /**
   * Generate cryptographically secure random bytes
   */
  randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Serialize hybrid public key for transmission
   * Format: [kyberLen:2][kyberPubKey][x25519PubKey:32]
   */
  serializePublicKey(publicKey: HybridPublicKey): Uint8Array {
    if (!publicKey.kyberPublicKey || !(publicKey.kyberPublicKey instanceof Uint8Array) || publicKey.kyberPublicKey.length === 0) {
      throw new Error('Invalid Kyber public key for serialization');
    }
    if (!publicKey.x25519PublicKey || !(publicKey.x25519PublicKey instanceof Uint8Array) || publicKey.x25519PublicKey.length !== 32) {
      throw new Error('Invalid X25519 public key for serialization: must be 32 bytes');
    }

    const kyberLen = publicKey.kyberPublicKey.length;
    const totalLen = 2 + kyberLen + 32;

    const serialized = new Uint8Array(totalLen);
    const view = new DataView(serialized.buffer);

    // Write Kyber public key length
    view.setUint16(0, kyberLen, false);

    // Write Kyber public key
    serialized.set(publicKey.kyberPublicKey, 2);

    // Write X25519 public key
    serialized.set(publicKey.x25519PublicKey, 2 + kyberLen);

    return serialized;
  }

  /**
   * Deserialize hybrid public key
   * Validates kyberLen bounds to prevent memory exhaustion attacks
   */
  deserializePublicKey(serialized: Uint8Array): HybridPublicKey {
    if (serialized.length < 2 + 32) {
      throw new Error('Invalid serialized public key: too short');
    }

    const view = new DataView(serialized.buffer, serialized.byteOffset);
    const kyberLen = view.getUint16(0, false);

    // Validate Kyber key length (ML-KEM-768 = 1184 bytes exactly)
    if (kyberLen !== 1184) {
      throw new Error('Invalid Kyber public key length: ' + kyberLen + ' (expected 1184)');
    }

    if (serialized.length !== 2 + kyberLen + 32) {
      throw new Error('Invalid serialized public key: length mismatch');
    }

    return {
      kyberPublicKey: serialized.slice(2, 2 + kyberLen),
      x25519PublicKey: serialized.slice(2 + kyberLen, 2 + kyberLen + 32),
    };
  }

  /**
   * Serialize hybrid ciphertext for transmission
   * Format: [kyberCtLen:2][kyberCt][x25519Eph:32]
   */
  serializeCiphertext(ciphertext: HybridCiphertext): Uint8Array {
    const kyberCtLen = ciphertext.kyberCiphertext.length;
    const totalLen = 2 + kyberCtLen + 32;

    const serialized = new Uint8Array(totalLen);
    const view = new DataView(serialized.buffer);

    // Write Kyber ciphertext length
    view.setUint16(0, kyberCtLen, false);

    // Write Kyber ciphertext
    serialized.set(ciphertext.kyberCiphertext, 2);

    // Write X25519 ephemeral public key
    serialized.set(ciphertext.x25519EphemeralPublic, 2 + kyberCtLen);

    return serialized;
  }

  /**
   * Deserialize hybrid ciphertext
   * Validates ciphertext length bounds
   */
  deserializeCiphertext(serialized: Uint8Array): HybridCiphertext {
    if (serialized.length < 2 + 32) {
      throw new Error('Invalid serialized ciphertext: too short');
    }

    const view = new DataView(serialized.buffer, serialized.byteOffset);
    const kyberCtLen = view.getUint16(0, false);

    // Validate Kyber ciphertext length (ML-KEM-768 = 1088 bytes exactly)
    if (kyberCtLen !== 1088) {
      throw new Error('Invalid Kyber ciphertext length: ' + kyberCtLen + ' (expected 1088)');
    }

    if (serialized.length !== 2 + kyberCtLen + 32) {
      throw new Error('Invalid serialized ciphertext: length mismatch');
    }

    return {
      kyberCiphertext: serialized.slice(2, 2 + kyberCtLen),
      x25519EphemeralPublic: serialized.slice(2 + kyberCtLen, 2 + kyberCtLen + 32),
    };
  }

  /**
   * Serialize a full keypair for transmission (public key only!)
   * Use this when you need to serialize from a HybridKeyPair
   */
  serializeKeypairPublic(keyPair: HybridKeyPair): Uint8Array {
    return this.serializePublicKey(this.getPublicKey(keyPair));
  }
}

// Export singleton instance
export const pqCrypto = PQCryptoService.getInstance();

// Re-export types for convenience
export type { HybridKeyPair as PQCKeyPair };
