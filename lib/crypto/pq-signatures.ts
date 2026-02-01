'use client';

/**
 * Post-Quantum Digital Signatures
 * ML-DSA (Dilithium) implementation using @noble/post-quantum
 *
 * Standards:
 * - NIST FIPS 204 (ML-DSA)
 * - Security Level: 3 (comparable to AES-192)
 * - Algorithm: ML-DSA-65 (Dilithium3)
 *
 * Use Cases:
 * - Message authentication
 * - Non-repudiation
 * - Identity verification
 * - Secure channel establishment
 * - API request signing
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import secureLog from '../utils/secure-logger';
import { secureWipeBuffer } from '../security/memory-wiper';

/**
 * ML-DSA-65 (Dilithium3) Parameters
 * - Public key: 1,952 bytes
 * - Secret key: 4,032 bytes
 * - Signature: ~3,309 bytes
 * - Security level: 3 (192-bit)
 */

export interface PQSignatureKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  algorithm: 'ML-DSA-65';
  created: number;
}

export interface PQSignature {
  signature: Uint8Array;
  algorithm: 'ML-DSA-65';
  timestamp: number;
}

export interface SignedMessage {
  message: Uint8Array;
  signature: PQSignature;
  publicKey: Uint8Array;
}

/**
 * Generate ML-DSA-65 key pair
 * Security level: 3 (comparable to AES-192)
 *
 * @returns Key pair with public and secret keys
 */
export function generatePQSignatureKeyPair(): PQSignatureKeyPair {
  try {
    const startTime = performance.now();

    // Generate ML-DSA-65 key pair
    const { publicKey, secretKey } = ml_dsa65.keygen();

    const endTime = performance.now();

    secureLog.log(
      `[PQSignatures] Generated ML-DSA-65 key pair (${endTime - startTime}ms)`,
      `Public key: ${publicKey.length} bytes, Secret key: ${secretKey.length} bytes`
    );

    return {
      publicKey,
      secretKey,
      algorithm: 'ML-DSA-65',
      created: Date.now(),
    };
  } catch (error) {
    secureLog.error('[PQSignatures] Failed to generate key pair:', error);
    throw new Error('Failed to generate PQ signature key pair');
  }
}

/**
 * Sign a message using ML-DSA-65
 *
 * @param message - Message to sign
 * @param secretKey - Secret signing key
 * @returns Signature
 */
export function signMessage(message: Uint8Array, secretKey: Uint8Array): PQSignature {
  try {
    const startTime = performance.now();

    // Sign message with ML-DSA-65
    const signature = ml_dsa65.sign(message, secretKey);

    const endTime = performance.now();

    secureLog.log(
      `[PQSignatures] Signed message (${endTime - startTime}ms)`,
      `Message: ${message.length} bytes, Signature: ${signature.length} bytes`
    );

    return {
      signature,
      algorithm: 'ML-DSA-65',
      timestamp: Date.now(),
    };
  } catch (error) {
    secureLog.error('[PQSignatures] Failed to sign message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Verify a signature using ML-DSA-65
 *
 * @param message - Original message
 * @param signature - Signature to verify
 * @param publicKey - Public verification key
 * @returns true if signature is valid
 */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    const startTime = performance.now();

    // Verify signature with ML-DSA-65
    const isValid = ml_dsa65.verify(signature, message, publicKey);

    const endTime = performance.now();

    secureLog.log(
      `[PQSignatures] Verified signature (${endTime - startTime}ms)`,
      `Valid: ${isValid}`
    );

    return isValid;
  } catch (error) {
    secureLog.error('[PQSignatures] Failed to verify signature:', error);
    return false;
  }
}

/**
 * Sign a message and create a signed message bundle
 *
 * @param message - Message to sign
 * @param secretKey - Secret signing key
 * @param publicKey - Public key to include
 * @returns Signed message bundle
 */
export function createSignedMessage(
  message: Uint8Array,
  secretKey: Uint8Array,
  publicKey: Uint8Array
): SignedMessage {
  const signature = signMessage(message, secretKey);

  return {
    message,
    signature,
    publicKey,
  };
}

/**
 * Verify a signed message bundle
 *
 * @param signedMessage - Signed message bundle
 * @returns true if signature is valid
 */
export function verifySignedMessage(signedMessage: SignedMessage): boolean {
  return verifySignature(
    signedMessage.message,
    signedMessage.signature.signature,
    signedMessage.publicKey
  );
}

/**
 * Sign text (UTF-8 string)
 *
 * @param text - Text to sign
 * @param secretKey - Secret signing key
 * @returns Signature
 */
export function signText(text: string, secretKey: Uint8Array): PQSignature {
  const encoder = new TextEncoder();
  const message = encoder.encode(text);
  return signMessage(message, secretKey);
}

/**
 * Verify text signature
 *
 * @param text - Original text
 * @param signature - Signature to verify
 * @param publicKey - Public verification key
 * @returns true if signature is valid
 */
export function verifyTextSignature(
  text: string,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  const encoder = new TextEncoder();
  const message = encoder.encode(text);
  return verifySignature(message, signature, publicKey);
}

/**
 * Sign JSON data
 *
 * @param data - Data to sign
 * @param secretKey - Secret signing key
 * @returns Signature
 */
export function signJSON<T>(data: T, secretKey: Uint8Array): PQSignature {
  const json = JSON.stringify(data);
  return signText(json, secretKey);
}

/**
 * Verify JSON signature
 *
 * @param data - Original data
 * @param signature - Signature to verify
 * @param publicKey - Public verification key
 * @returns true if signature is valid
 */
export function verifyJSONSignature<T>(
  data: T,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  const json = JSON.stringify(data);
  return verifyTextSignature(json, signature, publicKey);
}

/**
 * Serialize signature to base64
 *
 * @param signature - Signature to serialize
 * @returns Base64 encoded signature
 */
export function serializeSignature(signature: PQSignature): string {
  return btoa(
    JSON.stringify({
      signature: Array.from(signature.signature),
      algorithm: signature.algorithm,
      timestamp: signature.timestamp,
    })
  );
}

/**
 * Deserialize signature from base64
 *
 * @param serialized - Base64 encoded signature
 * @returns Signature object
 */
export function deserializeSignature(serialized: string): PQSignature {
  const parsed = JSON.parse(atob(serialized));

  return {
    signature: new Uint8Array(parsed.signature),
    algorithm: parsed.algorithm,
    timestamp: parsed.timestamp,
  };
}

/**
 * Serialize key pair to base64
 *
 * @param keyPair - Key pair to serialize
 * @returns Serialized key pair
 */
export function serializeKeyPair(keyPair: PQSignatureKeyPair): {
  publicKey: string;
  secretKey: string;
  algorithm: string;
  created: number;
} {
  return {
    publicKey: btoa(String.fromCharCode(...keyPair.publicKey)),
    secretKey: btoa(String.fromCharCode(...keyPair.secretKey)),
    algorithm: keyPair.algorithm,
    created: keyPair.created,
  };
}

/**
 * Deserialize key pair from base64
 *
 * @param serialized - Serialized key pair
 * @returns Key pair object
 */
export function deserializeKeyPair(serialized: {
  publicKey: string;
  secretKey: string;
  algorithm: string;
  created: number;
}): PQSignatureKeyPair {
  return {
    publicKey: new Uint8Array(
      atob(serialized.publicKey)
        .split('')
        .map(c => c.charCodeAt(0))
    ),
    secretKey: new Uint8Array(
      atob(serialized.secretKey)
        .split('')
        .map(c => c.charCodeAt(0))
    ),
    algorithm: serialized.algorithm as 'ML-DSA-65',
    created: serialized.created,
  };
}

/**
 * Securely wipe key pair from memory
 *
 * @param keyPair - Key pair to wipe
 */
export function wipeKeyPair(keyPair: PQSignatureKeyPair): void {
  secureWipeBuffer(keyPair.secretKey);
  secureWipeBuffer(keyPair.publicKey);
}

/**
 * Securely wipe signature from memory
 *
 * @param signature - Signature to wipe
 */
export function wipeSignature(signature: PQSignature): void {
  secureWipeBuffer(signature.signature);
}

/**
 * Get signature size estimate
 *
 * @returns Size estimate in bytes
 */
export function getSignatureSize(): number {
  return 3309; // ML-DSA-65 signature size
}

/**
 * Get public key size
 *
 * @returns Size in bytes
 */
export function getPublicKeySize(): number {
  return 1952; // ML-DSA-65 public key size
}

/**
 * Get secret key size
 *
 * @returns Size in bytes
 */
export function getSecretKeySize(): number {
  return 4032; // ML-DSA-65 secret key size
}

/**
 * Signature utilities
 */
export const pqSignatures = {
  generateKeyPair: generatePQSignatureKeyPair,
  sign: signMessage,
  verify: verifySignature,
  createSignedMessage,
  verifySignedMessage,
  signText,
  verifyTextSignature,
  signJSON,
  verifyJSONSignature,
  serialize: serializeSignature,
  deserialize: deserializeSignature,
  serializeKeyPair,
  deserializeKeyPair,
  wipeKeyPair,
  wipeSignature,
  getSignatureSize,
  getPublicKeySize,
  getSecretKeySize,
};

export default pqSignatures;
