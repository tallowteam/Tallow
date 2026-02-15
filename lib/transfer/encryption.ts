'use client';

/**
 * Encryption Module
 * Provides end-to-end encryption using Web Crypto API and ChaCha20-Poly1305
 *
 * Supports three AEAD ciphers (via SymmetricSentinel):
 * - AES-256-GCM (Web Crypto API, hardware accelerated)
 * - ChaCha20-Poly1305 (Noble library, constant-time)
 * - AEGIS-256 (pure JS, fastest on AES-NI hardware)
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 * Random nonces have birthday paradox risk; counter-based nonces guarantee uniqueness.
 *
 * The Sentinel-based API (encryptFileChunksWithSentinel / decryptFileChunksWithSentinel)
 * is the recommended path for new code. It automatically negotiates the cipher and
 * binds each chunk's index as associated data to prevent reordering attacks.
 */

import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { NonceManager } from '@/lib/crypto/nonce-manager';
import {
  SymmetricSentinel,
  type SymmetricEncryptedChunk,
  type NonceDirection,
} from '@/lib/crypto/symmetric';
import {
  selectSymmetricCipher,
  type SymmetricCipherAlgorithm,
} from '@/lib/crypto/cipher-selection';

// Encryption algorithm types
export type EncryptionAlgorithm = 'AES-GCM' | 'ChaCha20-Poly1305';

// Encryption algorithm configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const CHACHA_NONCE_LENGTH = 12; // 96 bits for XChaCha20
const CHACHA_KEY_LENGTH = 32; // 256 bits
const FIPS_MODE_ENABLED = process.env.NEXT_PUBLIC_TALLOW_FIPS_MODE === 'true';

// Counter-based nonce managers for each encryption algorithm
// These prevent nonce reuse attacks that random nonces are vulnerable to
let aesGcmNonceManager: NonceManager = new NonceManager();
let chaCha20NonceManager: NonceManager = new NonceManager();

function assertChaChaAllowed(): void {
    if (!FIPS_MODE_ENABLED) {
        return;
    }

    throw new Error('ChaCha20-Poly1305 is disabled when FIPS mode is enabled. Use AES-GCM.');
}

export function isFipsModeEnabled(): boolean {
    return FIPS_MODE_ENABLED;
}

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );
}

/**
 * Generate a key pair for key exchange (ECDH)
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Export a public key to JWK format for transmission
 */
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
    return await crypto.subtle.exportKey('jwk', key);
}

/**
 * Import a public key from JWK format
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        []
    );
}

/**
 * Derive a shared encryption key from ECDH key pair
 */
export async function deriveSharedKey(
    privateKey: CryptoKey,
    publicKey: CryptoKey
): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey,
        },
        privateKey,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Export a symmetric key to raw format
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey('raw', key);
}

/**
 * Import a symmetric key from raw format
 */
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Reset the AES-GCM nonce manager (call when key is rotated)
 *
 * SECURITY: Must be called whenever the encryption key changes
 * to ensure a fresh nonce sequence for the new key.
 */
export function resetAesGcmNonceManager(): void {
    aesGcmNonceManager = new NonceManager();
}

/**
 * Reset the ChaCha20 nonce manager (call when key is rotated)
 *
 * SECURITY: Must be called whenever the encryption key changes
 * to ensure a fresh nonce sequence for the new key.
 */
export function resetChaCha20NonceManager(): void {
    chaCha20NonceManager = new NonceManager();
}

/**
 * Reset all nonce managers (call during key rotation or session reset)
 */
export function resetAllNonceManagers(): void {
    aesGcmNonceManager = new NonceManager();
    chaCha20NonceManager = new NonceManager();
}

/**
 * Get nonce manager status for monitoring/debugging
 */
export function getNonceStatus(): {
    aesGcm: { counter: bigint; isNearCapacity: boolean };
    chaCha20: { counter: bigint; isNearCapacity: boolean };
} {
    return {
        aesGcm: {
            counter: aesGcmNonceManager.getCounter(),
            isNearCapacity: aesGcmNonceManager.isNearCapacity(),
        },
        chaCha20: {
            counter: chaCha20NonceManager.getCounter(),
            isNearCapacity: chaCha20NonceManager.isNearCapacity(),
        },
    };
}

/**
 * Encrypt data with AES-GCM
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 * Random nonces have birthday paradox risk after 2^48 messages with the same key.
 * Counter-based nonces guarantee uniqueness up to 2^64 messages per session.
 */
export async function encrypt(
    data: ArrayBuffer,
    key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    // Get counter-based IV (nonce) to prevent collision attacks
    const iv = aesGcmNonceManager.getNextNonce();

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv: iv,
        },
        key,
        data
    );

    return { ciphertext, iv };
}

/**
 * Decrypt data with AES-GCM
 */
export async function decrypt(
    ciphertext: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
        {
            name: ALGORITHM,
            iv: iv,
        },
        key,
        ciphertext
    );
}

/**
 * Encrypt data with ChaCha20-Poly1305
 *
 * ChaCha20-Poly1305 is an AEAD cipher that provides:
 * - Constant-time operation (timing attack resistant)
 * - Fast performance on systems without AES hardware
 * - 256-bit security
 *
 * SECURITY: Uses counter-based nonces to prevent nonce reuse attacks.
 * Random nonces have birthday paradox risk after 2^48 messages with the same key.
 * Counter-based nonces guarantee uniqueness up to 2^64 messages per session.
 */
export async function encryptChaCha(
    data: ArrayBuffer,
    key: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    assertChaChaAllowed();

    if (key.length !== CHACHA_KEY_LENGTH) {
        throw new Error(`ChaCha20 key must be ${CHACHA_KEY_LENGTH} bytes`);
    }

    // Get counter-based nonce to prevent collision attacks
    const nonce = chaCha20NonceManager.getNextNonce();

    // Create cipher instance
    const cipher = chacha20poly1305(key, nonce);

    // Encrypt data (includes authentication tag)
    const plaintext = new Uint8Array(data);
    const ciphertext = cipher.encrypt(plaintext);

    return { ciphertext, nonce };
}

/**
 * Decrypt data with ChaCha20-Poly1305
 */
export async function decryptChaCha(
    ciphertext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array
): Promise<Uint8Array> {
    assertChaChaAllowed();

    if (key.length !== CHACHA_KEY_LENGTH) {
        throw new Error(`ChaCha20 key must be ${CHACHA_KEY_LENGTH} bytes`);
    }

    if (nonce.length !== CHACHA_NONCE_LENGTH) {
        throw new Error(`ChaCha20 nonce must be ${CHACHA_NONCE_LENGTH} bytes`);
    }

    // Create cipher instance
    const cipher = chacha20poly1305(key, nonce);

    // Decrypt and verify authentication tag
    try {
        const plaintext = cipher.decrypt(ciphertext);
        return plaintext;
    } catch (_error) {
        throw new Error('ChaCha20-Poly1305 decryption failed: authentication tag mismatch');
    }
}

/**
 * Generate a random ChaCha20 key
 */
export function generateChaChaKey(): Uint8Array {
    assertChaChaAllowed();

    const key = new Uint8Array(CHACHA_KEY_LENGTH);
    crypto.getRandomValues(key);
    return key;
}

/**
 * Encrypt a file in chunks
 */
export async function encryptFile(
    file: File,
    key: CryptoKey,
    chunkSize: number = 64 * 1024,
    onProgress?: (progress: number) => void
): Promise<{ encryptedChunks: ArrayBuffer[]; ivs: Uint8Array[] }> {
    const encryptedChunks: ArrayBuffer[] = [];
    const ivs: Uint8Array[] = [];
    const totalChunks = Math.ceil(file.size / chunkSize);
    let processedChunks = 0;

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const data = await chunk.arrayBuffer();

        const { ciphertext, iv } = await encrypt(data, key);
        encryptedChunks.push(ciphertext);
        ivs.push(iv);

        processedChunks++;
        onProgress?.((processedChunks / totalChunks) * 100);
    }

    return { encryptedChunks, ivs };
}

/**
 * Decrypt file chunks
 */
export async function decryptChunks(
    chunks: ArrayBuffer[],
    ivs: Uint8Array[],
    key: CryptoKey,
    onProgress?: (progress: number) => void
): Promise<ArrayBuffer[]> {
    const decryptedChunks: ArrayBuffer[] = [];
    const totalChunks = chunks.length;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const iv = ivs[i];
        if (chunk && iv) {
            const decrypted = await decrypt(chunk, key, iv);
            decryptedChunks.push(decrypted);

            processedChunks++;
            onProgress?.((processedChunks / totalChunks) * 100);
        }
    }

    return decryptedChunks;
}

/**
 * Hash data using SHA-256
 */
export async function hash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a file for integrity verification
 */
export async function hashFile(
    file: File,
    chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<string> {
    // For small files, hash directly
    if (file.size <= chunkSize) {
        const data = await file.arrayBuffer();
        return hash(data);
    }

    // For large files, we need to use incremental hashing
    // Since Web Crypto API doesn't support streaming, we'll hash chunks and combine
    const hashes: string[] = [];

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const data = await chunk.arrayBuffer();
        const chunkHash = await hash(data);
        hashes.push(chunkHash);
    }

    // Combine chunk hashes
    const encoder = new TextEncoder();
    const encodedHashes = encoder.encode(hashes.join(''));
    const combinedHash = await hash(encodedHashes.buffer.slice(0) as ArrayBuffer);
    return combinedHash;
}

/**
 * Generate a secure password/PIN
 */
export function generateSecureCode(length: number = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(byte => chars[byte % chars.length])
        .join('');
}

/**
 * Derive a key from a password using Argon2id (or PBKDF2 fallback)
 *
 * SECURITY: Uses Argon2id when available for memory-hard key derivation
 */
export async function deriveKeyFromPassword(
    password: string,
    salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    // Import Argon2 module dynamically to avoid issues in non-browser environments
    const { deriveKeyFromPassword: deriveArgon2Key, generateSalt } = await import('@/lib/crypto/argon2-browser');

    // Generate salt if not provided (32 bytes for better security)
    const saltBuffer = salt ?? generateSalt(32);

    // Derive key bytes using Argon2id (with PBKDF2 fallback)
    const keyBytes = await deriveArgon2Key(password, saltBuffer);

    // Import the derived bytes as a CryptoKey for AES-GCM
    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
    );

    return { key, salt: saltBuffer };
}

// ---------------------------------------------------------------------------
// Sentinel-based chunk encryption (recommended for new code)
//
// These functions use the SymmetricSentinel which supports all three ciphers
// (AES-256-GCM, ChaCha20-Poly1305, AEGIS-256), manages directional counter
// nonces, and binds each chunk's index as associated data to prevent
// reordering/splicing attacks.
// ---------------------------------------------------------------------------

/** Options for sentinel-based file chunk encryption. */
export interface SentinelEncryptOptions {
  /** Override the auto-selected cipher. */
  cipher?: SymmetricCipherAlgorithm;
  /** Direction for nonce counter ('sender' or 'receiver'). Default: 'sender'. */
  direction?: NonceDirection;
  /** Progress callback (0-100). */
  onProgress?: (progress: number) => void;
  /** Chunk size in bytes. Default: 64KB. */
  chunkSize?: number;
}

/**
 * Encrypt a file using SymmetricSentinel with chunk-index AAD.
 *
 * Each chunk's zero-based index is encoded as big-endian uint32 and passed as
 * associated data, binding the chunk to its position in the file. This prevents
 * an attacker from reordering, duplicating, or dropping chunks.
 *
 * @param file    The file to encrypt.
 * @param rawKey  A 32-byte raw symmetric key (Uint8Array).
 * @param options Cipher, direction, progress callback, chunk size.
 * @returns       Array of encrypted chunks (each carries its own nonce and tag).
 */
export async function encryptFileChunksWithSentinel(
  file: File,
  rawKey: Uint8Array,
  options: SentinelEncryptOptions = {}
): Promise<SymmetricEncryptedChunk[]> {
  const chunkSize = options.chunkSize ?? 64 * 1024;
  const direction = options.direction ?? 'sender';
  const cipher = options.cipher ?? selectSymmetricCipher();
  const sentinel = new SymmetricSentinel(cipher);

  const totalChunks = Math.ceil(file.size / chunkSize);
  const results: SymmetricEncryptedChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const offset = i * chunkSize;
    const blob = file.slice(offset, offset + chunkSize);
    const plaintext = new Uint8Array(await blob.arrayBuffer());

    // Encode chunk index as 4-byte big-endian associated data.
    const aad = new Uint8Array(4);
    new DataView(aad.buffer).setUint32(0, i, false);

    const encrypted = await sentinel.encryptChunk(plaintext, rawKey, {
      direction,
      associatedData: aad,
    });

    results.push(encrypted);
    options.onProgress?.(((i + 1) / totalChunks) * 100);
  }

  return results;
}

/**
 * Decrypt an array of sentinel-encrypted chunks back to plaintext buffers.
 *
 * Verifies the chunk-index AAD for each chunk. If any chunk fails authentication
 * (wrong tag, wrong index, tampered data), the function throws immediately.
 *
 * @param chunks  Array of encrypted chunks from encryptFileChunksWithSentinel.
 * @param rawKey  The same 32-byte raw symmetric key used for encryption.
 * @param options Progress callback.
 * @returns       Array of decrypted ArrayBuffers in order.
 */
export async function decryptFileChunksWithSentinel(
  chunks: SymmetricEncryptedChunk[],
  rawKey: Uint8Array,
  options: { onProgress?: (progress: number) => void } = {}
): Promise<ArrayBuffer[]> {
  const results: ArrayBuffer[] = [];
  const total = chunks.length;

  for (let i = 0; i < total; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    // Reconstruct the chunk-index AAD.
    const aad = new Uint8Array(4);
    new DataView(aad.buffer).setUint32(0, i, false);

    // Create a fresh sentinel per chunk for decryption (stateless for decrypt).
    const sentinel = new SymmetricSentinel(chunk.cipher);
    const plaintext = await sentinel.decryptChunk(chunk, rawKey, {
      associatedData: aad,
    });

    results.push(plaintext.buffer.slice(
      plaintext.byteOffset,
      plaintext.byteOffset + plaintext.byteLength
    ) as ArrayBuffer);

    options.onProgress?.(((i + 1) / total) * 100);
  }

  return results;
}

// Re-export sentinel types for convenience.
export type {
  SymmetricEncryptedChunk,
  SymmetricCipherAlgorithm,
  NonceDirection,
};

export default {
    generateKey,
    generateKeyPair,
    exportPublicKey,
    importPublicKey,
    deriveSharedKey,
    encrypt,
    decrypt,
    encryptChaCha,
    decryptChaCha,
    generateChaChaKey,
    encryptFile,
    decryptChunks,
    hash,
    hashFile,
    generateSecureCode,
    deriveKeyFromPassword,
    // Nonce management functions for key rotation
    isFipsModeEnabled,
    resetAesGcmNonceManager,
    resetChaCha20NonceManager,
    resetAllNonceManagers,
    getNonceStatus,
    // Sentinel-based chunk API
    encryptFileChunksWithSentinel,
    decryptFileChunksWithSentinel,
};
