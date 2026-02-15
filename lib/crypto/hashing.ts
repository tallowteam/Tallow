'use client';

/**
 * BLAKE3 Streaming Hash, Keyed Hash, and KDF Module
 * Agent 009 -- HASH-ORACLE
 *
 * Central hashing facade. Every hash in Tallow goes through this module so
 * the algorithm can be swapped or audited in a single place.
 *
 * Capabilities:
 * - One-shot hash (bytes -> 32-byte digest)
 * - Streaming / incremental hash
 * - Keyed hash (MAC)
 * - Key derivation with mandatory domain separation (HKDF-BLAKE3)
 * - Constant-time comparison
 */

import {
  hash as blake3Hash,
  blake3Hex,
  deriveKey as blake3DeriveKey,
  keyedHash as blake3KeyedHash,
  createHasher as blake3CreateHasher,
  createKeyedHasher as blake3CreateKeyedHasher,
  createDeriveKeyHasher as blake3CreateDeriveKeyHasher,
  constantTimeEqual as blake3ConstantTimeEqual,
  type Blake3Hasher,
} from './blake3';

// ============================================================================
// Canonical HKDF Domain Separation Registry
// ============================================================================

/**
 * Every KDF call MUST use one of these domain strings (or a derived
 * per-session variant built from one of these prefixes). No bare
 * deriveKey calls without domain separation are allowed.
 */
export const DOMAIN_HYBRID_KEX     = 'tallow-v3-hybrid-kex';
export const DOMAIN_ROOT_KEY       = 'tallow-v3-root-key';
export const DOMAIN_CHAIN_KEY      = 'tallow-v3-chain-key';
export const DOMAIN_MESSAGE_KEY    = 'tallow-v3-message-key';
export const DOMAIN_NONCE_SEED     = 'tallow-v3-nonce-seed';
export const DOMAIN_STORAGE_KEY    = 'tallow-v3-storage-key';

/**
 * Full registry as a frozen array for static analysis / verification
 * scripts to reference.
 */
export const DOMAIN_SEPARATION_REGISTRY = Object.freeze([
  DOMAIN_HYBRID_KEX,
  DOMAIN_ROOT_KEY,
  DOMAIN_CHAIN_KEY,
  DOMAIN_MESSAGE_KEY,
  DOMAIN_NONCE_SEED,
  DOMAIN_STORAGE_KEY,
] as const);

export type DomainSeparationContext = (typeof DOMAIN_SEPARATION_REGISTRY)[number];

// ============================================================================
// One-shot helpers (re-exported for convenience)
// ============================================================================

/** BLAKE3 hash -- returns 32-byte Uint8Array. */
export function hash(data: Uint8Array): Uint8Array {
  return blake3Hash(data);
}

/** BLAKE3 hash -- returns lowercase hex string. */
export function hashHex(data: string | Uint8Array): string {
  return blake3Hex(data);
}

/** Keyed BLAKE3 (MAC). Key must be exactly 32 bytes. */
export function keyedHash(key: Uint8Array, data: Uint8Array): Uint8Array {
  return blake3KeyedHash(key, data);
}

/** Constant-time comparison of two byte arrays. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  return blake3ConstantTimeEqual(a, b);
}

// ============================================================================
// Key Derivation with Domain Separation
// ============================================================================

/**
 * Derive a 32-byte key using BLAKE3 derive_key mode.
 *
 * @param context - MUST be a unique domain-separation string.
 * @param material - Input keying material (shared secret, root key, etc.).
 * @returns 32-byte derived key.
 *
 * Callers SHOULD use one of the DOMAIN_* constants exported above.
 */
export function deriveKey(context: string, material: Uint8Array): Uint8Array {
  if (!context || context.length === 0) {
    throw new Error('HASH-ORACLE: deriveKey requires a non-empty domain separation context');
  }
  return blake3DeriveKey(context, material);
}

// ============================================================================
// Streaming / Incremental Hashers
// ============================================================================

export { type Blake3Hasher };

/** Create a streaming BLAKE3 hasher. */
export function createHasher(): Blake3Hasher {
  return blake3CreateHasher();
}

/** Create a streaming keyed BLAKE3 hasher (MAC). */
export function createKeyedHasher(key: Uint8Array): Blake3Hasher {
  return blake3CreateKeyedHasher(key);
}

/** Create a streaming derive-key BLAKE3 hasher. */
export function createDeriveKeyHasher(context: string): Blake3Hasher {
  return blake3CreateDeriveKeyHasher(context);
}

// ============================================================================
// Convenience: hash an entire file-chunk and return hex
// ============================================================================

export function hashChunkToHex(chunk: Uint8Array): string {
  return blake3Hex(chunk);
}

// ============================================================================
// Convenience: verify a chunk against expected hex hash
// ============================================================================

export function verifyChunkHash(chunk: Uint8Array, expectedHex: string): boolean {
  const actualHex = blake3Hex(chunk);
  // Use constant-time comparison on the hex strings
  const enc = new TextEncoder();
  return blake3ConstantTimeEqual(enc.encode(actualHex), enc.encode(expectedHex));
}
