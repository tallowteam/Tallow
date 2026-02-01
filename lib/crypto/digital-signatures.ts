'use client';

/**
 * Digital Signatures using Ed25519
 * Provides file signing and verification for authenticity
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import secureStorage from '../storage/secure-storage';
import { secureLog } from '../utils/secure-logger';

const SIGNING_KEY_STORAGE = 'tallow_signing_keypair';

export interface SigningKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface FileSignature {
  signature: Uint8Array;
  publicKey: Uint8Array;
  timestamp: number;
  fileHash: Uint8Array;
}

/**
 * Generate or retrieve Ed25519 signing keypair
 */
export async function getOrGenerateSigningKey(): Promise<SigningKeyPair> {
  try {
    // Try to load existing keypair
    const stored = await secureStorage.getItem(SIGNING_KEY_STORAGE);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        publicKey: new Uint8Array(parsed.publicKey),
        privateKey: new Uint8Array(parsed.privateKey),
      };
    }
  } catch (error) {
    secureLog.warn('Failed to load signing key, generating new one:', error);
  }

  // Generate new keypair
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  const publicKey = ed25519.getPublicKey(privateKey);

  const keypair: SigningKeyPair = {
    publicKey,
    privateKey,
  };

  // Store keypair securely
  try {
    await secureStorage.setItem(
      SIGNING_KEY_STORAGE,
      JSON.stringify({
        publicKey: Array.from(publicKey),
        privateKey: Array.from(privateKey),
      })
    );
  } catch (error) {
    secureLog.error('Failed to store signing key:', error);
  }

  return keypair;
}

/**
 * Sign a file
 */
export async function signFile(fileData: Uint8Array): Promise<FileSignature> {
  const keypair = await getOrGenerateSigningKey();

  // Hash the file
  const fileHash = sha256(fileData);

  // Create message to sign (hash + timestamp)
  const timestamp = Date.now();
  const timestampBytes = new Uint8Array(8);
  new DataView(timestampBytes.buffer).setBigUint64(0, BigInt(timestamp), false);

  const message = new Uint8Array(fileHash.length + timestampBytes.length);
  message.set(fileHash, 0);
  message.set(timestampBytes, fileHash.length);

  // Sign the message
  const signature = ed25519.sign(message, keypair.privateKey);

  // Secure cleanup of intermediate sensitive data
  message.fill(0);

  return {
    signature,
    publicKey: keypair.publicKey,
    timestamp,
    fileHash,
  };
}

/**
 * Verify a file signature
 */
export function verifyFileSignature(
  fileData: Uint8Array,
  signature: FileSignature
): boolean {
  try {
    // Hash the file
    const fileHash = sha256(fileData);

    // Verify file hash matches using timing-safe comparison
    if (fileHash.length !== signature.fileHash.length) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    let hashMatch = 0;
    for (let i = 0; i < fileHash.length; i++) {
      const a = fileHash[i];
      const b = signature.fileHash[i];
      if (a !== undefined && b !== undefined) {
        hashMatch |= a ^ b;
      }
    }
    if (hashMatch !== 0) {
      return false;
    }

    // Recreate signed message
    const timestampBytes = new Uint8Array(8);
    new DataView(timestampBytes.buffer).setBigUint64(0, BigInt(signature.timestamp), false);

    const message = new Uint8Array(fileHash.length + timestampBytes.length);
    message.set(fileHash, 0);
    message.set(timestampBytes, fileHash.length);

    // Verify signature
    const verified = ed25519.verify(signature.signature, message, signature.publicKey);

    // Secure cleanup
    message.fill(0);

    return verified;
  } catch (error) {
    secureLog.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Get public key fingerprint for display
 */
export function getPublicKeyFingerprint(publicKey: Uint8Array): string {
  const hash = sha256(publicKey);
  return Array.from(hash.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

/**
 * Serialize signature for transmission
 */
export function serializeSignature(signature: FileSignature): string {
  const data = {
    signature: Array.from(signature.signature),
    publicKey: Array.from(signature.publicKey),
    timestamp: signature.timestamp,
    fileHash: Array.from(signature.fileHash),
  };
  return JSON.stringify(data);
}

/**
 * Deserialize signature from transmission
 */
export function deserializeSignature(serialized: string): FileSignature {
  const data = JSON.parse(serialized);
  return {
    signature: new Uint8Array(data.signature),
    publicKey: new Uint8Array(data.publicKey),
    timestamp: data.timestamp,
    fileHash: new Uint8Array(data.fileHash),
  };
}

/**
 * Clear signing keypair (for security/privacy)
 */
export async function clearSigningKey(): Promise<void> {
  secureStorage.removeItem(SIGNING_KEY_STORAGE);
}

export default {
  getOrGenerateSigningKey,
  signFile,
  verifyFileSignature,
  getPublicKeyFingerprint,
  serializeSignature,
  deserializeSignature,
  clearSigningKey,
};
