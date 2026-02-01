/**
 * Chat Encryption
 * End-to-end encryption for chat messages
 * Uses AES-256-GCM with derived session keys
 */

import { secureLog } from '../utils/secure-logger';
import { secureWipeBuffer } from '../security/memory-wiper';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Generate random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive session key from shared secret
 */
export async function deriveSessionKey(
  sharedSecret: Uint8Array,
  salt: Uint8Array
): Promise<CryptoKey> {
  try {
    // Import shared secret as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    const sessionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );

    return sessionKey;
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to derive session key:', error);
    throw new Error('Failed to derive session key');
  }
}

/**
 * Encrypt message content
 */
export async function encryptMessage(
  plaintext: string,
  sessionKey: CryptoKey
): Promise<{
  ciphertext: string;
  nonce: string;
}> {
  try {
    const iv = generateIV();
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH * 8,
      },
      sessionKey,
      plaintextBytes
    );

    // Wipe plaintext from memory
    secureWipeBuffer(plaintextBytes);

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer))),
      nonce: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to encrypt message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt message content
 */
export async function decryptMessage(
  ciphertext: string,
  nonce: string,
  sessionKey: CryptoKey
): Promise<string> {
  try {
    const iv = Uint8Array.from(atob(nonce), c => c.charCodeAt(0));
    const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH * 8,
      },
      sessionKey,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(plaintextBuffer);

    // Wipe decrypted buffer from memory
    secureWipeBuffer(new Uint8Array(plaintextBuffer));

    return plaintext;
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to decrypt message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt file attachment
 */
export async function encryptAttachment(
  fileData: ArrayBuffer,
  sessionKey: CryptoKey
): Promise<{
  encryptedData: ArrayBuffer;
  nonce: string;
}> {
  try {
    const iv = generateIV();

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH * 8,
      },
      sessionKey,
      fileData
    );

    return {
      encryptedData,
      nonce: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to encrypt attachment:', error);
    throw new Error('Failed to encrypt attachment');
  }
}

/**
 * Decrypt file attachment
 */
export async function decryptAttachment(
  encryptedData: ArrayBuffer,
  nonce: string,
  sessionKey: CryptoKey
): Promise<ArrayBuffer> {
  try {
    const iv = Uint8Array.from(atob(nonce), c => c.charCodeAt(0));

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH * 8,
      },
      sessionKey,
      encryptedData
    );

    return decryptedData;
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to decrypt attachment:', error);
    throw new Error('Failed to decrypt attachment');
  }
}

/**
 * Generate salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Calculate checksum for integrity verification
 */
export async function calculateChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify message authenticity using HMAC
 */
export async function signMessage(
  message: string,
  sessionKey: CryptoKey
): Promise<string> {
  try {
    // Export session key for HMAC
    const keyData = await crypto.subtle.exportKey('raw', sessionKey);

    // Import as HMAC key
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);

    const signature = await crypto.subtle.sign('HMAC', hmacKey, messageBytes);

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to sign message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Verify message signature
 */
export async function verifyMessage(
  message: string,
  signature: string,
  sessionKey: CryptoKey
): Promise<boolean> {
  try {
    // Export session key for HMAC
    const keyData = await crypto.subtle.exportKey('raw', sessionKey);

    // Import as HMAC key
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    return await crypto.subtle.verify('HMAC', hmacKey, signatureBytes, messageBytes);
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to verify message:', error);
    return false;
  }
}

/**
 * Generate SAS (Short Authentication String) for verification
 */
export async function generateSAS(
  localPublicKey: Uint8Array,
  remotePublicKey: Uint8Array
): Promise<string> {
  try {
    // Concatenate public keys
    const combined = new Uint8Array(localPublicKey.length + remotePublicKey.length);
    combined.set(localPublicKey, 0);
    combined.set(remotePublicKey, localPublicKey.length);

    // Hash combined keys
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = new Uint8Array(hashBuffer);

    // Take first 6 bytes and convert to 6-digit code
    const code = (
      ((hashArray[0] || 0) << 24) |
      ((hashArray[1] || 0) << 16) |
      ((hashArray[2] || 0) << 8) |
      (hashArray[3] || 0)
    ) % 1000000;

    return code.toString().padStart(6, '0');
  } catch (error) {
    secureLog.error('[ChatEncryption] Failed to generate SAS:', error);
    throw new Error('Failed to generate SAS');
  }
}

/**
 * Compress data before encryption (for large attachments)
 */
export async function compressData(data: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    // Use CompressionStream API if available
    if ('CompressionStream' in window) {
      const stream = new Response(data).body!
        .pipeThrough(new CompressionStream('gzip'));

      const compressedResponse = await new Response(stream).arrayBuffer();
      return compressedResponse;
    }

    // Fallback: return uncompressed
    return data;
  } catch (error) {
    secureLog.warn('[ChatEncryption] Compression failed, using uncompressed data:', error);
    return data;
  }
}

/**
 * Decompress data after decryption
 */
export async function decompressData(data: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    // Use DecompressionStream API if available
    if ('DecompressionStream' in window) {
      const stream = new Response(data).body!
        .pipeThrough(new DecompressionStream('gzip'));

      const decompressedResponse = await new Response(stream).arrayBuffer();
      return decompressedResponse;
    }

    // Fallback: return as-is
    return data;
  } catch (error) {
    secureLog.warn('[ChatEncryption] Decompression failed, assuming uncompressed:', error);
    return data;
  }
}

export default {
  deriveSessionKey,
  encryptMessage,
  decryptMessage,
  encryptAttachment,
  decryptAttachment,
  generateSalt,
  calculateChecksum,
  signMessage,
  verifyMessage,
  generateSAS,
  compressData,
  decompressData,
};
