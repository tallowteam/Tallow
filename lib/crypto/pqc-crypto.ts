/**
 * AGENT 006 - PQC-KEYSMITH
 *
 * Post-Quantum Cryptography Service
 * Implements hybrid encryption: ML-KEM-768 (FIPS 203) + X25519 + AES-256-GCM
 *
 * This provides defense against both classical and quantum attacks.
 * The hybrid construction ensures security even if one primitive is broken.
 *
 * Protocol: tallow-v3-hybrid-kex
 *   ML-KEM-768 public key    = 1184 bytes (MLKEM768_PK_BYTES)
 *   ML-KEM-768 secret key    = 2400 bytes (MLKEM768_SK_BYTES)
 *   ML-KEM-768 ciphertext    = 1088 bytes (MLKEM768_CT_BYTES)
 *   ML-KEM-768 shared secret = 32 bytes   (MLKEM768_SS_BYTES)
 *   X25519 public key        = 32 bytes
 *   X25519 shared secret     = 32 bytes
 *   Combined via BLAKE3 derive_key with domain separation
 *
 * SECURITY INVARIANTS:
 * - CSPRNG exclusively -- no Math.random()
 * - All key material zeroed immediately after use
 * - Counter-based nonces prevent nonce reuse attacks
 * - X25519 mandatory even if ML-KEM succeeds (hybrid defense-in-depth)
 * - Raw shared secrets never used directly -- always BLAKE3 with domain separation
 */

import { x25519 } from '@noble/curves/ed25519.js';
import { NonceManager } from './nonce-manager';
import { deriveKeyFromPassword as deriveKeyArgon2, ARGON2_DEFAULTS } from './argon2-browser';
import { deriveKey as deriveBlake3Key, hash as blake3Hash, keyedHash as blake3KeyedHash } from './blake3';
import { zeroMemory } from './secure-buffer';

// ============================================================================
// ML-KEM-768 FIPS 203 Constants
// ============================================================================

/** ML-KEM-768 encapsulation key (public key) size in bytes per FIPS 203 */
export const MLKEM768_PK_BYTES = 1184;

/** ML-KEM-768 decapsulation key (secret key) size in bytes per FIPS 203 */
export const MLKEM768_SK_BYTES = 2400;

/** ML-KEM-768 ciphertext size in bytes per FIPS 203 */
export const MLKEM768_CT_BYTES = 1088;

/** ML-KEM-768 shared secret size in bytes per FIPS 203 */
export const MLKEM768_SS_BYTES = 32;

/** X25519 key size in bytes */
export const X25519_KEY_BYTES = 32;

/** Canonical domain separator for the hybrid key exchange */
export const HYBRID_KEX_DOMAIN = 'tallow-v3-hybrid-kex';

// ============================================================================
// WASM Module Type
// ============================================================================

type KyberModule = {
  keypair: () => { pubkey: Uint8Array; secret: Uint8Array };
  encapsulate: (publicKey: Uint8Array) => { ciphertext: Uint8Array; sharedSecret: Uint8Array };
  decapsulate: (ciphertext: Uint8Array, secretKey: Uint8Array) => Uint8Array | null;
};

let kyberModulePromise: Promise<KyberModule> | null = null;

// ============================================================================
// Session Key Domain Separation Contexts (BLAKE3 derive_key)
// ============================================================================

export const PQC_DOMAIN_SESSION_ENCRYPTION_KEY = 'tallow.pqc.session.encryption-key.v1';
export const PQC_DOMAIN_SESSION_AUTH_KEY = 'tallow.pqc.session.auth-key.v1';
export const PQC_DOMAIN_SESSION_ID = 'tallow.pqc.session.id.v1';

async function loadKyberModule(): Promise<KyberModule> {
  if (!kyberModulePromise) {
    kyberModulePromise = import('pqc-kyber')
      .then((module) => module as unknown as KyberModule)
      .catch((error) => {
        kyberModulePromise = null;
        throw error;
      });
  }

  return kyberModulePromise;
}

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
   * Securely wipe key material using the double-overwrite pattern.
   * Delegates to zeroMemory() which writes random data first (prevents
   * optimizer elision) then zeros.
   */
  private secureZero(data: Uint8Array | null | undefined): void {
    if (!data) {
      return;
    }
    zeroMemory(data);
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
   * Generate a hybrid keypair (ML-KEM-768 + X25519)
   *
   * This provides post-quantum security via ML-KEM-768 and classical security
   * via X25519. Both primitives use CSPRNG exclusively.
   *
   * Post-generation validation ensures key sizes match FIPS 203 requirements.
   */
  async generateHybridKeypair(): Promise<HybridKeyPair> {
    const kyber = await loadKyberModule();

    // Generate ML-KEM-768 keypair (post-quantum) -- uses WASM module's internal CSPRNG
    const kyberKeys = kyber.keypair();

    // Validate ML-KEM-768 key sizes per FIPS 203
    if (kyberKeys.pubkey.length !== MLKEM768_PK_BYTES) {
      throw new Error(
        `ML-KEM-768 public key size mismatch: got ${kyberKeys.pubkey.length}, expected ${MLKEM768_PK_BYTES}`
      );
    }
    if (kyberKeys.secret.length !== MLKEM768_SK_BYTES) {
      throw new Error(
        `ML-KEM-768 secret key size mismatch: got ${kyberKeys.secret.length}, expected ${MLKEM768_SK_BYTES}`
      );
    }

    // Generate X25519 keypair (classical) -- CSPRNG only, never Math.random()
    const x25519PrivateKey = this.randomBytes(X25519_KEY_BYTES);
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
   * Protocol steps (Responder / Bob side):
   *   1. (mlkemCT, mlkemSS) = ML-KEM-768.Encaps(mlkemPK)
   *   2. (x25519PK_B, x25519SK_B) = X25519.KeyGen()
   *   3. x25519SS = X25519.DH(x25519SK_B, x25519PK_A)
   *   4. sessionKey = BLAKE3-derive_key(ikm: mlkemSS || x25519SS, context: HYBRID_KEX_DOMAIN)
   *   5. Zero: mlkemSS, x25519SS, x25519SK_B
   *
   * Both ML-KEM-768 AND X25519 are mandatory -- hybrid defense-in-depth.
   */
  async encapsulate(
    recipientPublicKey: HybridPublicKey
  ): Promise<{ ciphertext: HybridCiphertext; sharedSecret: Uint8Array }> {
    const kyber = await loadKyberModule();

    if (!recipientPublicKey.kyberPublicKey || recipientPublicKey.kyberPublicKey.length !== MLKEM768_PK_BYTES) {
      throw new Error(`Invalid ML-KEM-768 public key: must be ${MLKEM768_PK_BYTES} bytes`);
    }
    if (!recipientPublicKey.x25519PublicKey || recipientPublicKey.x25519PublicKey.length !== X25519_KEY_BYTES) {
      throw new Error(`Invalid X25519 public key: must be ${X25519_KEY_BYTES} bytes`);
    }

    let kyberSharedSecretMaterial: Uint8Array | null = null;
    let x25519SharedSecretMaterial: Uint8Array | null = null;
    let ephemeralPrivateKey: Uint8Array | null = null;

    try {
      // ML-KEM-768 encapsulation
      const kyberResult = kyber.encapsulate(recipientPublicKey.kyberPublicKey);

      // Validate ciphertext and shared secret sizes per FIPS 203
      if (kyberResult.ciphertext.length !== MLKEM768_CT_BYTES) {
        throw new Error(
          `ML-KEM-768 ciphertext size mismatch: got ${kyberResult.ciphertext.length}, expected ${MLKEM768_CT_BYTES}`
        );
      }
      if (kyberResult.sharedSecret.length !== MLKEM768_SS_BYTES) {
        throw new Error(
          `ML-KEM-768 shared secret size mismatch: got ${kyberResult.sharedSecret.length}, expected ${MLKEM768_SS_BYTES}`
        );
      }

      kyberSharedSecretMaterial = new Uint8Array(kyberResult.sharedSecret);

      // X25519 ephemeral key exchange -- CSPRNG only
      ephemeralPrivateKey = this.randomBytes(X25519_KEY_BYTES);
      const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);
      const x25519SharedSecret = x25519.getSharedSecret(
        ephemeralPrivateKey,
        recipientPublicKey.x25519PublicKey
      );
      x25519SharedSecretMaterial = new Uint8Array(x25519SharedSecret);

      // Clone buffers before secure wiping to avoid aliasing issues
      const kyberCiphertext = new Uint8Array(kyberResult.ciphertext);
      const x25519EphemeralPublic = new Uint8Array(ephemeralPublicKey);

      // Combine both shared secrets via BLAKE3 with domain separation
      const combinedSecret = this.combineSecrets(
        kyberSharedSecretMaterial,
        x25519SharedSecretMaterial
      );

      return {
        ciphertext: {
          kyberCiphertext,
          x25519EphemeralPublic,
        },
        sharedSecret: combinedSecret,
      };
    } finally {
      // SECURITY: Zero all intermediate key material immediately
      this.secureZero(kyberSharedSecretMaterial);
      this.secureZero(x25519SharedSecretMaterial);
      this.secureZero(ephemeralPrivateKey);
    }
  }

  /**
   * Decapsulate: Recipient recovers shared secret using their private key
   *
   * Protocol steps (Initiator / Alice completes):
   *   1. mlkemSS = ML-KEM-768.Decaps(mlkemSK, mlkemCT)
   *   2. x25519SS = X25519.DH(x25519SK_A, x25519PK_B)
   *   3. sessionKey = BLAKE3-derive_key(ikm: mlkemSS || x25519SS, context: HYBRID_KEX_DOMAIN)
   *   4. Zero: mlkemSS, x25519SS, mlkemSK, x25519SK_A
   */
  async decapsulate(
    ciphertext: HybridCiphertext,
    ownKeyPair: HybridKeyPair
  ): Promise<Uint8Array> {
    const kyber = await loadKyberModule();

    // Validate ciphertext sizes per FIPS 203
    if (ciphertext.kyberCiphertext.length !== MLKEM768_CT_BYTES) {
      throw new Error(`Invalid ML-KEM-768 ciphertext: must be ${MLKEM768_CT_BYTES} bytes`);
    }
    if (ciphertext.x25519EphemeralPublic.length !== X25519_KEY_BYTES) {
      throw new Error(`Invalid X25519 ephemeral public key: must be ${X25519_KEY_BYTES} bytes`);
    }

    let kyberSharedSecretMaterial: Uint8Array | null = null;
    let x25519SharedSecretMaterial: Uint8Array | null = null;

    try {
      // ML-KEM-768 decapsulation
      const kyberSharedSecret = kyber.decapsulate(
        ciphertext.kyberCiphertext,
        ownKeyPair.kyber.secretKey
      );

      if (!kyberSharedSecret) {
        throw new Error(
          'ML-KEM-768 decapsulation failed -- ciphertext may not match your keys. '
          + 'Ensure the sender used YOUR public key to encapsulate.'
        );
      }

      if (kyberSharedSecret.length !== MLKEM768_SS_BYTES) {
        throw new Error(
          `ML-KEM-768 decapsulated secret size mismatch: got ${kyberSharedSecret.length}, expected ${MLKEM768_SS_BYTES}`
        );
      }

      kyberSharedSecretMaterial = new Uint8Array(kyberSharedSecret);

      // X25519 key recovery -- both sides mandatory for hybrid defense-in-depth
      const x25519SharedSecret = x25519.getSharedSecret(
        ownKeyPair.x25519.privateKey,
        ciphertext.x25519EphemeralPublic
      );
      x25519SharedSecretMaterial = new Uint8Array(x25519SharedSecret);

      // Combine both shared secrets via BLAKE3 with domain separation
      return this.combineSecrets(kyberSharedSecretMaterial, x25519SharedSecretMaterial);
    } finally {
      // SECURITY: Zero all intermediate key material immediately
      this.secureZero(kyberSharedSecretMaterial);
      this.secureZero(x25519SharedSecretMaterial);
    }
  }

  /**
   * Combine two shared secrets using BLAKE3 derive_key mode
   *
   * SECURITY: Uses BLAKE3 KDF (not HKDF-SHA-256) per Tallow crypto policy.
   * Domain separation via the canonical "tallow-v3-hybrid-kex" context string
   * from the HKDF Domain Separation Registry.
   */
  private combineSecrets(
    kyberSecret: Uint8Array,
    x25519Secret: Uint8Array
  ): Uint8Array {
    // Concatenate secrets as input key material
    const ikm = new Uint8Array(kyberSecret.length + x25519Secret.length);
    ikm.set(kyberSecret, 0);
    ikm.set(x25519Secret, kyberSecret.length);

    // BLAKE3 derive_key with canonical domain separation context
    const result = deriveBlake3Key(HYBRID_KEX_DOMAIN, ikm);

    // Zero intermediate buffer to prevent key material leakage.
    zeroMemory(ikm);

    return result;
  }

  // ==========================================================================
  // Session Key Derivation
  // ==========================================================================

  /**
   * Derive session keys from shared secret using BLAKE3 derive_key
   *
   * Derives three separate keys with distinct domain separation contexts:
   *   - encryptionKey: AES-256-GCM encryption (32 bytes)
   *   - authKey: BLAKE3 keyed hash / MAC (32 bytes)
   *   - sessionId: unique session identifier (16 bytes)
   *
   * SECURITY: Each key uses a unique derive_key context to ensure
   * cryptographic independence even if the shared secret is reused.
   */
  deriveSessionKeys(sharedSecret: Uint8Array): SessionKeys {
    if (sharedSecret.length !== MLKEM768_SS_BYTES) {
      throw new Error(`Shared secret must be ${MLKEM768_SS_BYTES} bytes`);
    }

    // Derive each key with an explicit BLAKE3 domain separator
    const encryptionKey = deriveBlake3Key(PQC_DOMAIN_SESSION_ENCRYPTION_KEY, sharedSecret);
    const authKey = deriveBlake3Key(PQC_DOMAIN_SESSION_AUTH_KEY, sharedSecret);
    const sessionMaterial = deriveBlake3Key(PQC_DOMAIN_SESSION_ID, sharedSecret);
    const sessionId = sessionMaterial.slice(0, 16);
    this.secureZero(sessionMaterial);

    return {
      encryptionKey,
      authKey,
      sessionId,
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
   * Compute BLAKE3 hash (32-byte digest)
   *
   * SECURITY: BLAKE3 is the mandated hash function for Tallow.
   * SHA-256 must not be used except where BLAKE3 is unavailable.
   */
  hash(data: Uint8Array): Uint8Array {
    return blake3Hash(data);
  }

  /**
   * Compute BLAKE3 keyed hash (MAC)
   *
   * SECURITY: Uses BLAKE3 keyed mode instead of HMAC-SHA-256.
   * Key must be exactly 32 bytes. Returns 32-byte tag.
   */
  mac(key: Uint8Array, data: Uint8Array): Uint8Array {
    if (key.length !== 32) {
      throw new Error('BLAKE3 keyed hash requires a 32-byte key');
    }
    return blake3KeyedHash(key, data);
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
   * Uses crypto.getRandomValues (CSPRNG) -- never Math.random()
   */
  randomBytes(length: number): Uint8Array {
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('Length must be a positive integer');
    }
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
      throw new Error('Invalid ML-KEM-768 public key for serialization');
    }
    if (!publicKey.x25519PublicKey || !(publicKey.x25519PublicKey instanceof Uint8Array) || publicKey.x25519PublicKey.length !== X25519_KEY_BYTES) {
      throw new Error(`Invalid X25519 public key for serialization: must be ${X25519_KEY_BYTES} bytes`);
    }

    const kyberLen = publicKey.kyberPublicKey.length;
    const totalLen = 2 + kyberLen + X25519_KEY_BYTES;

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
    if (serialized.length < 2 + X25519_KEY_BYTES) {
      throw new Error('Invalid serialized public key: too short');
    }

    const view = new DataView(serialized.buffer, serialized.byteOffset);
    const kyberLen = view.getUint16(0, false);

    // Validate ML-KEM-768 key length (exactly 1184 bytes per FIPS 203)
    if (kyberLen !== MLKEM768_PK_BYTES) {
      throw new Error('Invalid ML-KEM-768 public key length: ' + kyberLen + ' (expected ' + MLKEM768_PK_BYTES + ')');
    }

    if (serialized.length !== 2 + kyberLen + X25519_KEY_BYTES) {
      throw new Error('Invalid serialized public key: length mismatch');
    }

    return {
      kyberPublicKey: serialized.slice(2, 2 + kyberLen),
      x25519PublicKey: serialized.slice(2 + kyberLen, 2 + kyberLen + X25519_KEY_BYTES),
    };
  }

  /**
   * Serialize hybrid ciphertext for transmission
   * Format: [kyberCtLen:2][kyberCt][x25519Eph:32]
   */
  serializeCiphertext(ciphertext: HybridCiphertext): Uint8Array {
    const kyberCtLen = ciphertext.kyberCiphertext.length;
    const totalLen = 2 + kyberCtLen + X25519_KEY_BYTES;

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
    if (serialized.length < 2 + X25519_KEY_BYTES) {
      throw new Error('Invalid serialized ciphertext: too short');
    }

    const view = new DataView(serialized.buffer, serialized.byteOffset);
    const kyberCtLen = view.getUint16(0, false);

    // Validate ML-KEM-768 ciphertext length (exactly 1088 bytes per FIPS 203)
    if (kyberCtLen !== MLKEM768_CT_BYTES) {
      throw new Error('Invalid ML-KEM-768 ciphertext length: ' + kyberCtLen + ' (expected ' + MLKEM768_CT_BYTES + ')');
    }

    if (serialized.length !== 2 + kyberCtLen + X25519_KEY_BYTES) {
      throw new Error('Invalid serialized ciphertext: length mismatch');
    }

    return {
      kyberCiphertext: serialized.slice(2, 2 + kyberCtLen),
      x25519EphemeralPublic: serialized.slice(2 + kyberCtLen, 2 + kyberCtLen + X25519_KEY_BYTES),
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
