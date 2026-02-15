/**
 * AGENT 016 - METADATA-ERASER (Filename Encryption)
 *
 * Encrypts original filenames so receivers see only random hex.
 * The actual filename is encrypted and transmitted as metadata only
 * the intended recipient can decrypt.
 *
 * Algorithm: AES-256-GCM
 * IV: 12 bytes (96 bits) from CSPRNG
 * Key: 256-bit AES-GCM key (either raw or derived via HKDF)
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

// ============================================================================
// Constants
// ============================================================================

/** Length of the random hex filename (excluding extension) -- 32 hex chars = 16 bytes */
export const RANDOM_FILENAME_HEX_LENGTH = 32;

/** AES-GCM IV length in bytes (NIST recommended for GCM) */
export const IV_LENGTH = 12;

/** Maximum filename length in bytes before encryption (prevents DoS on encrypt) */
const MAX_FILENAME_BYTES = 4096;

// ============================================================================
// Types
// ============================================================================

export interface EncryptedFilename {
  /** Random hex filename used for transfer */
  transferName: string;
  /** AES-GCM encrypted original filename (base64) */
  encryptedOriginal: string;
  /** AES-GCM IV (base64) */
  iv: string;
}

// ============================================================================
// Filename Encryption
// ============================================================================

/**
 * Generate a random hex filename for transfer.
 * The original filename is never exposed in transit.
 *
 * Returns a 32-character lowercase hexadecimal string generated from
 * 16 bytes of CSPRNG output.
 */
export function generateTransferFilename(): string {
  const bytes = new Uint8Array(RANDOM_FILENAME_HEX_LENGTH / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypt an original filename using AES-256-GCM with the session key.
 *
 * The encrypted blob travels alongside the file data so the recipient
 * can recover the original filename. The transfer name is an independent
 * random hex string that reveals nothing about the original.
 *
 * @param originalName - The original filename to encrypt
 * @param key - A CryptoKey with 'encrypt' usage and AES-GCM algorithm
 * @returns EncryptedFilename with transfer name, ciphertext, and IV
 * @throws If the filename exceeds MAX_FILENAME_BYTES or encryption fails
 */
export async function encryptFilename(
  originalName: string,
  key: CryptoKey,
): Promise<EncryptedFilename> {
  // Validate input
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(originalName);

  if (plaintext.length > MAX_FILENAME_BYTES) {
    throw new Error(
      `Filename exceeds maximum length (${plaintext.length} bytes > ${MAX_FILENAME_BYTES})`,
    );
  }

  if (plaintext.length === 0) {
    throw new Error('Filename must not be empty');
  }

  // Generate a fresh 12-byte IV for every encryption operation
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  // Encrypt with AES-256-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  );

  return {
    transferName: generateTransferFilename(),
    encryptedOriginal: uint8ArrayToBase64(new Uint8Array(ciphertext)),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Decrypt an original filename from the encrypted blob.
 *
 * @param encrypted - The EncryptedFilename received from the sender
 * @param key - A CryptoKey with 'decrypt' usage and AES-GCM algorithm
 * @returns The decrypted original filename
 * @throws If decryption fails (wrong key, tampered data, etc.)
 */
export async function decryptFilename(
  encrypted: EncryptedFilename,
  key: CryptoKey,
): Promise<string> {
  if (!encrypted.encryptedOriginal || !encrypted.iv) {
    throw new Error('Missing encrypted filename data or IV');
  }

  const ciphertext = base64ToUint8Array(encrypted.encryptedOriginal);
  const iv = base64ToUint8Array(encrypted.iv);

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

/**
 * Derive a filename encryption key from a shared secret using HKDF.
 *
 * This is useful when the session key is derived from a key agreement
 * (e.g., ECDH or ML-KEM) and you want a dedicated sub-key for filename
 * encryption rather than reusing the main transport key.
 *
 * @param sharedSecret - Raw key material from key agreement
 * @param salt - Optional salt (if not provided, uses a zero-filled buffer)
 * @param info - Context string for domain separation (default: 'tallow-filename-encryption')
 * @returns A CryptoKey suitable for AES-256-GCM filename encryption
 */
export async function deriveFilenameKey(
  sharedSecret: Uint8Array,
  salt?: Uint8Array,
  info: string = 'tallow-filename-encryption',
): Promise<CryptoKey> {
  // Import the shared secret as HKDF key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey'],
  );

  const encoder = new TextEncoder();
  const infoBytes = encoder.encode(info);
  const hkdfSalt = salt ?? new Uint8Array(32);

  // Derive AES-256-GCM key via HKDF-SHA-256
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: hkdfSalt,
      info: infoBytes,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable for security
    ['encrypt', 'decrypt'],
  );
}

/**
 * Verify that a transfer filename reveals nothing about the original.
 * Returns true if the name is a valid 32-character lowercase hex string.
 */
export function isValidTransferFilename(name: string): boolean {
  return /^[0-9a-f]{32}$/.test(name);
}

// ============================================================================
// Base64 Utilities
// ============================================================================

/**
 * Convert Uint8Array to base64 string.
 *
 * Uses a loop-based approach to avoid call stack limits that can occur
 * with String.fromCharCode(...spread) on large arrays.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default {
  RANDOM_FILENAME_HEX_LENGTH,
  IV_LENGTH,
  generateTransferFilename,
  encryptFilename,
  decryptFilename,
  deriveFilenameKey,
  isValidTransferFilename,
};
