'use client';

/**
 * SYMMETRIC-SENTINEL (Agent 008) -- Authenticated Encryption Module
 *
 * Provides AEAD encrypt/decrypt for the Tallow chunk pipeline with three ciphers:
 *
 *   1. AEGIS-256   -- fastest on AES-NI hardware (32-byte nonce, 32-byte key, 16-byte tag)
 *   2. AES-256-GCM -- universal WebCrypto baseline (12-byte nonce, 32-byte key, 16-byte tag)
 *   3. ChaCha20-Poly1305 -- constant-time software (12-byte nonce, 32-byte key, 16-byte tag)
 *
 * Nonce management:
 *   AES-256-GCM and ChaCha20-Poly1305 use 96-bit counter nonces:
 *     [32-bit direction flag][64-bit counter]
 *   AEGIS-256 uses 256-bit nonces derived via HKDF-SHA-256 from the same 96-bit counter nonce.
 *   This ensures structurally impossible nonce reuse regardless of cipher.
 *
 * Auth tag is ALWAYS verified BEFORE any plaintext is returned -- zero exceptions.
 */

import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { decrypt as aegisDecryptRaw, encrypt as aegisEncryptRaw } from './aegis256';
import {
  CIPHER_NONCE_SIZES,
  selectSymmetricCipher,
  type SymmetricCipherAlgorithm,
} from './cipher-selection';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export type NonceDirection = 'sender' | 'receiver';

/** Nonce size for AES-256-GCM and ChaCha20-Poly1305 (96-bit). */
export const SYMMETRIC_NONCE_BYTES = 12;

/** Nonce size for AEGIS-256 (256-bit). */
export const AEGIS_NONCE_BYTES = 32;

/** Auth tag size for all supported ciphers (128-bit). */
export const SYMMETRIC_AUTH_TAG_BYTES = 16;

/** Direction flag: sender encodes 0x00000000 in the nonce prefix. */
export const SYMMETRIC_DIRECTION_SENDER = 0x00000000;

/** Direction flag: receiver encodes 0x00000001 in the nonce prefix. */
export const SYMMETRIC_DIRECTION_RECEIVER = 0x00000001;

/** Maximum value of the 64-bit counter portion of a nonce. */
export const SYMMETRIC_COUNTER_MAX = 2n ** 64n - 1n;

/**
 * HKDF domain-separation label used when expanding a 96-bit counter nonce
 * to a 256-bit AEGIS-256 nonce.
 */
const AEGIS_NONCE_HKDF_INFO = new TextEncoder().encode('tallow.symmetric.aegis256-nonce.v1');

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SymmetricEncryptedChunk {
  cipher: SymmetricCipherAlgorithm;
  /** The nonce used for encryption (12 bytes for AES/ChaCha, 12 bytes stored for AEGIS). */
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  authTag: Uint8Array;
}

export interface EncryptChunkOptions {
  cipher?: SymmetricCipherAlgorithm;
  direction?: NonceDirection;
  associatedData?: Uint8Array;
  /** Provide a specific nonce instead of auto-generating one from the counter. */
  nonce?: Uint8Array;
}

export interface DecryptChunkOptions {
  cipher?: SymmetricCipherAlgorithm;
  associatedData?: Uint8Array;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateKey(key: Uint8Array): void {
  if (key.length !== 32) {
    throw new Error('Symmetric key must be 32 bytes');
  }
}

function validateNonce(nonce: Uint8Array): void {
  if (nonce.length !== SYMMETRIC_NONCE_BYTES) {
    throw new Error(`Nonce must be ${SYMMETRIC_NONCE_BYTES} bytes (96-bit)`);
  }
}

// AEGIS nonce validation is handled inline in encrypt/decrypt functions

function validateAuthTag(authTag: Uint8Array): void {
  if (authTag.length !== SYMMETRIC_AUTH_TAG_BYTES) {
    throw new Error(`Auth tag must be ${SYMMETRIC_AUTH_TAG_BYTES} bytes`);
  }
}

// ---------------------------------------------------------------------------
// Low-level utilities
// ---------------------------------------------------------------------------

function nonceFingerprint(nonce: Uint8Array): string {
  return Array.from(nonce, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function asArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

function resolveDirectionFlag(direction: NonceDirection): number {
  return direction === 'sender' ? SYMMETRIC_DIRECTION_SENDER : SYMMETRIC_DIRECTION_RECEIVER;
}

/** Zero out a Uint8Array (best-effort key material cleanup). */
function zeroize(buf: Uint8Array): void {
  buf.fill(0);
}

// ---------------------------------------------------------------------------
// Nonce construction
// ---------------------------------------------------------------------------

/**
 * Build a 96-bit (12-byte) directional nonce from a direction flag and counter.
 *
 * Layout: [4 bytes: direction flag (big-endian)][8 bytes: counter (big-endian)]
 *
 * This structure is used for AES-256-GCM and ChaCha20-Poly1305.
 * For AEGIS-256, this 96-bit nonce is further expanded to 256 bits via HKDF.
 */
export function buildDirectionalNonce(direction: NonceDirection, counter: bigint): Uint8Array {
  if (counter < 0n || counter > SYMMETRIC_COUNTER_MAX) {
    throw new Error('Nonce counter out of range');
  }

  const nonce = new Uint8Array(SYMMETRIC_NONCE_BYTES);
  const view = new DataView(nonce.buffer);
  view.setUint32(0, resolveDirectionFlag(direction), false);
  view.setBigUint64(4, counter, false);
  return nonce;
}

/**
 * Expand a 96-bit counter nonce to a 256-bit AEGIS-256 nonce using HKDF-SHA-256.
 *
 * HKDF Extract: PRK = HMAC-SHA-256(salt=0x00...00, IKM=nonce96)
 * HKDF Expand:  OKM = HMAC-SHA-256(PRK, info || 0x01) truncated to 32 bytes
 *
 * This is a proper cryptographic key derivation that provides domain separation
 * and stretches the 96-bit counter nonce to the 256-bit nonce AEGIS-256 requires.
 * The counter-based input ensures uniqueness is preserved through the expansion.
 */
async function expandAegisNonce(nonce96: Uint8Array): Promise<Uint8Array> {
  // HKDF-Extract: use an all-zero salt (32 bytes for SHA-256 block size)
  const salt = new Uint8Array(32);
  const extractKey = await crypto.subtle.importKey(
    'raw', asArrayBuffer(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign('HMAC', extractKey, asArrayBuffer(nonce96))
  );

  // HKDF-Expand: PRK is 32 bytes, info is our domain label, counter byte = 0x01
  // OKM = HMAC-SHA-256(PRK, info || 0x01) -- exactly 32 bytes (one block, no iteration needed)
  const expandInput = new Uint8Array(AEGIS_NONCE_HKDF_INFO.length + 1);
  expandInput.set(AEGIS_NONCE_HKDF_INFO, 0);
  expandInput[AEGIS_NONCE_HKDF_INFO.length] = 0x01;

  const expandKey = await crypto.subtle.importKey(
    'raw', asArrayBuffer(prk), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const okm = new Uint8Array(
    await crypto.subtle.sign('HMAC', expandKey, asArrayBuffer(expandInput))
  );

  // Cleanup intermediate material
  zeroize(prk);
  zeroize(expandInput);

  return okm;
}

// ---------------------------------------------------------------------------
// Nonce counter (session-scoped)
// ---------------------------------------------------------------------------

/**
 * Counter-based nonce manager with separate counters per direction.
 *
 * Sender and receiver use independent counters to prevent nonce collision
 * when both peers encrypt with the same session key. The direction flag
 * in the nonce prefix provides a second layer of domain separation.
 *
 * This class tracks recently used nonces to detect programming errors.
 * The tracking window is bounded to prevent memory growth on long sessions.
 */
export class SymmetricNonceCounter {
  private senderCounter = 0n;
  private receiverCounter = 0n;
  private readonly usedNonces = new Set<string>();

  /** Maximum number of nonce fingerprints to retain for reuse detection. */
  private static readonly MAX_TRACKED_NONCES = 100_000;

  reserveNonce(nonce: Uint8Array): void {
    validateNonce(nonce);
    const fingerprint = nonceFingerprint(nonce);
    if (this.usedNonces.has(fingerprint)) {
      throw new Error('Nonce reuse detected');
    }
    this.usedNonces.add(fingerprint);

    // Prune old entries when the set grows too large.
    // Counter-based nonces are already monotonic so reuse is structurally
    // impossible; this set is a defense-in-depth check, not the primary
    // uniqueness guarantee. Clearing it when oversized is safe.
    if (this.usedNonces.size > SymmetricNonceCounter.MAX_TRACKED_NONCES) {
      this.usedNonces.clear();
    }
  }

  getNextNonce(direction: NonceDirection): Uint8Array {
    const counter = direction === 'sender' ? this.senderCounter : this.receiverCounter;
    if (counter > SYMMETRIC_COUNTER_MAX) {
      throw new Error('Nonce counter exhausted for this direction');
    }

    const nonce = buildDirectionalNonce(direction, counter);
    this.reserveNonce(nonce);

    if (direction === 'sender') {
      this.senderCounter = counter + 1n;
    } else {
      this.receiverCounter = counter + 1n;
    }

    return nonce;
  }

  getCounter(direction: NonceDirection): bigint {
    return direction === 'sender' ? this.senderCounter : this.receiverCounter;
  }

  reset(): void {
    this.senderCounter = 0n;
    this.receiverCounter = 0n;
    this.usedNonces.clear();
  }
}

// ---------------------------------------------------------------------------
// AES-256-GCM (WebCrypto)
// ---------------------------------------------------------------------------

async function encryptAes256Gcm(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  associatedData?: Uint8Array
): Promise<SymmetricEncryptedChunk> {
  validateKey(key);
  validateNonce(nonce);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', asArrayBuffer(key), { name: 'AES-GCM' }, false, ['encrypt']
  );

  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv: asArrayBuffer(nonce),
    tagLength: 128,
  };
  if (associatedData && associatedData.length > 0) {
    params.additionalData = asArrayBuffer(associatedData);
  }

  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(params, cryptoKey, asArrayBuffer(plaintext))
  );

  // WebCrypto appends the 16-byte auth tag to the ciphertext.
  const authTag = sealed.slice(-SYMMETRIC_AUTH_TAG_BYTES);
  const ciphertext = sealed.slice(0, -SYMMETRIC_AUTH_TAG_BYTES);

  return {
    cipher: 'AES-256-GCM',
    nonce: new Uint8Array(nonce),
    ciphertext,
    authTag,
  };
}

async function decryptAes256Gcm(
  encrypted: SymmetricEncryptedChunk,
  key: Uint8Array,
  associatedData?: Uint8Array
): Promise<Uint8Array> {
  validateKey(key);
  validateNonce(encrypted.nonce);
  validateAuthTag(encrypted.authTag);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', asArrayBuffer(key), { name: 'AES-GCM' }, false, ['decrypt']
  );

  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv: asArrayBuffer(encrypted.nonce),
    tagLength: 128,
  };
  if (associatedData && associatedData.length > 0) {
    params.additionalData = asArrayBuffer(associatedData);
  }

  // WebCrypto expects ciphertext || tag as a single buffer.
  const sealed = new Uint8Array(encrypted.ciphertext.length + encrypted.authTag.length);
  sealed.set(encrypted.ciphertext, 0);
  sealed.set(encrypted.authTag, encrypted.ciphertext.length);

  try {
    // WebCrypto returns plaintext ONLY after authentication succeeds.
    const plaintext = new Uint8Array(
      await crypto.subtle.decrypt(params, cryptoKey, asArrayBuffer(sealed))
    );
    return plaintext;
  } catch {
    throw new Error('Authentication tag verification failed before plaintext release');
  } finally {
    zeroize(sealed);
  }
}

// ---------------------------------------------------------------------------
// ChaCha20-Poly1305 (@noble/ciphers -- pure JS, constant-time)
// ---------------------------------------------------------------------------

function encryptChaCha20Poly1305(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  associatedData?: Uint8Array
): SymmetricEncryptedChunk {
  validateKey(key);
  validateNonce(nonce);

  const cipher = chacha20poly1305(key, nonce, associatedData);
  const sealed = cipher.encrypt(plaintext);

  return {
    cipher: 'CHACHA20-POLY1305',
    nonce: new Uint8Array(nonce),
    ciphertext: sealed.slice(0, -SYMMETRIC_AUTH_TAG_BYTES),
    authTag: sealed.slice(-SYMMETRIC_AUTH_TAG_BYTES),
  };
}

function decryptChaCha20Poly1305(
  encrypted: SymmetricEncryptedChunk,
  key: Uint8Array,
  associatedData?: Uint8Array
): Uint8Array {
  validateKey(key);
  validateNonce(encrypted.nonce);
  validateAuthTag(encrypted.authTag);

  const sealed = new Uint8Array(encrypted.ciphertext.length + encrypted.authTag.length);
  sealed.set(encrypted.ciphertext, 0);
  sealed.set(encrypted.authTag, encrypted.ciphertext.length);

  try {
    // @noble/ciphers verifies the Poly1305 tag internally before returning.
    const cipher = chacha20poly1305(key, encrypted.nonce, associatedData);
    return cipher.decrypt(sealed);
  } catch {
    throw new Error('Authentication tag verification failed before plaintext release');
  } finally {
    zeroize(sealed);
  }
}

// ---------------------------------------------------------------------------
// AEGIS-256 (pure JS implementation via lib/crypto/aegis256.ts)
//
// AEGIS-256 is specified in RFC 9312 with a 256-bit nonce. Our chunk pipeline
// uses 96-bit counter nonces for uniformity across ciphers. We bridge this gap
// by expanding the 96-bit counter nonce to 256 bits via HKDF-SHA-256.
//
// The expanded nonce inherits the uniqueness guarantees of the counter.
// The HKDF expansion is collision-resistant so two distinct 96-bit inputs
// will never produce the same 256-bit output.
//
// NOTE: @noble/ciphers v2.1.1 does not include AEGIS-256. We use our own
// pure-JS implementation in aegis256.ts. This implementation is NOT audited
// by a third party. When a production-grade AEGIS-256 library becomes available
// (e.g., a future @noble/ciphers release or a dedicated WASM module),
// swap the import here.
// ---------------------------------------------------------------------------

async function encryptAegis256Chunk(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  associatedData?: Uint8Array
): Promise<SymmetricEncryptedChunk> {
  validateKey(key);
  validateNonce(nonce);

  const expandedNonce = await expandAegisNonce(nonce);
  try {
    const result = aegisEncryptRaw(key, expandedNonce, plaintext, associatedData);
    return {
      cipher: 'AEGIS-256',
      nonce: new Uint8Array(nonce),
      ciphertext: result.ciphertext,
      authTag: result.tag,
    };
  } finally {
    zeroize(expandedNonce);
  }
}

async function decryptAegis256Chunk(
  encrypted: SymmetricEncryptedChunk,
  key: Uint8Array,
  associatedData?: Uint8Array
): Promise<Uint8Array> {
  validateKey(key);
  validateNonce(encrypted.nonce);
  validateAuthTag(encrypted.authTag);

  const expandedNonce = await expandAegisNonce(encrypted.nonce);
  try {
    // AEGIS-256 decrypt returns null on auth failure -- no partial plaintext.
    const plaintext = aegisDecryptRaw(
      key,
      expandedNonce,
      encrypted.ciphertext,
      encrypted.authTag,
      associatedData
    );
    if (!plaintext) {
      throw new Error('Authentication tag verification failed before plaintext release');
    }
    return plaintext;
  } finally {
    zeroize(expandedNonce);
  }
}

// ---------------------------------------------------------------------------
// SymmetricSentinel -- high-level AEAD interface
// ---------------------------------------------------------------------------

/**
 * SymmetricSentinel manages authenticated encryption for the Tallow chunk pipeline.
 *
 * It handles cipher selection, nonce generation, and dispatching to the correct
 * AEAD implementation. All three ciphers share the same 96-bit counter nonce
 * scheme; AEGIS-256 nonces are transparently expanded to 256 bits.
 *
 * Usage:
 *   const sentinel = new SymmetricSentinel('AES-256-GCM');
 *   const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender', associatedData: aad });
 *   const decrypted = await sentinel.decryptChunk(encrypted, key, { associatedData: aad });
 */
export class SymmetricSentinel {
  private readonly nonceCounter: SymmetricNonceCounter;
  private defaultCipher: SymmetricCipherAlgorithm;

  constructor(defaultCipher: SymmetricCipherAlgorithm = selectSymmetricCipher()) {
    this.defaultCipher = defaultCipher;
    this.nonceCounter = new SymmetricNonceCounter();
  }

  getDefaultCipher(): SymmetricCipherAlgorithm {
    return this.defaultCipher;
  }

  setDefaultCipher(cipher: SymmetricCipherAlgorithm): void {
    this.defaultCipher = cipher;
  }

  /** Return the native nonce size for a given cipher. */
  static nonceSizeForCipher(cipher: SymmetricCipherAlgorithm): number {
    return CIPHER_NONCE_SIZES[cipher];
  }

  getNonceCounter(direction: NonceDirection): bigint {
    return this.nonceCounter.getCounter(direction);
  }

  resetNonceState(): void {
    this.nonceCounter.reset();
  }

  /**
   * Encrypt a chunk of plaintext.
   *
   * The nonce is auto-generated from the internal counter unless explicitly provided.
   * The stored nonce in the returned chunk is ALWAYS the 96-bit counter nonce,
   * regardless of cipher. AEGIS-256 nonce expansion happens internally.
   */
  async encryptChunk(
    plaintext: Uint8Array,
    key: Uint8Array,
    options: EncryptChunkOptions = {}
  ): Promise<SymmetricEncryptedChunk> {
    const cipher = options.cipher ?? this.defaultCipher;
    const direction = options.direction ?? 'sender';
    const nonce = options.nonce
      ? new Uint8Array(options.nonce)
      : this.nonceCounter.getNextNonce(direction);

    if (options.nonce) {
      this.nonceCounter.reserveNonce(nonce);
    }

    switch (cipher) {
      case 'AES-256-GCM':
        return encryptAes256Gcm(plaintext, key, nonce, options.associatedData);
      case 'CHACHA20-POLY1305':
        return encryptChaCha20Poly1305(plaintext, key, nonce, options.associatedData);
      case 'AEGIS-256':
        return encryptAegis256Chunk(plaintext, key, nonce, options.associatedData);
      default:
        throw new Error(`Unsupported symmetric cipher: ${cipher as string}`);
    }
  }

  /**
   * Decrypt an encrypted chunk.
   *
   * CRITICAL: Auth tag is verified BEFORE any plaintext is returned.
   * On auth failure, an error is thrown and no plaintext bytes are exposed.
   */
  async decryptChunk(
    encrypted: SymmetricEncryptedChunk,
    key: Uint8Array,
    options: DecryptChunkOptions = {}
  ): Promise<Uint8Array> {
    const cipher = options.cipher ?? encrypted.cipher;

    switch (cipher) {
      case 'AES-256-GCM':
        return decryptAes256Gcm(encrypted, key, options.associatedData);
      case 'CHACHA20-POLY1305':
        return decryptChaCha20Poly1305(encrypted, key, options.associatedData);
      case 'AEGIS-256':
        return decryptAegis256Chunk(encrypted, key, options.associatedData);
      default:
        throw new Error(`Unsupported symmetric cipher: ${cipher as string}`);
    }
  }
}

/** Default module-level sentinel instance. */
export const symmetricSentinel = new SymmetricSentinel();
