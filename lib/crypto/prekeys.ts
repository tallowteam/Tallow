'use client';

/**
 * AGENT 011 - SIGNATURE-AUTHORITY
 *
 * Prekey Bundle Generation, Rotation, and Revocation
 *
 * Provides the full prekey lifecycle required for asynchronous session initiation:
 * - Identity key (long-term) signed with ML-DSA-65 for quantum resistance
 * - Signed prekeys (7-day rotation) signed with Ed25519 identity key
 * - One-time prekeys (single use, consumed on first use)
 * - Signed revocation certificates for old prekeys
 * - Optional SLH-DSA emergency identity for hash-based PQ backup
 *
 * Operational Rules:
 * 1. All prekeys MUST be signed with identity key -- unsigned prekeys rejected.
 * 2. Prekeys rotate every 7 days -- no extension.
 * 3. One-time prekeys consumed once -- reuse is protocol error.
 * 4. Old prekeys revocable via signed revocation certificates.
 * 5. Prekey bundles carry dual signatures (Ed25519 + ML-DSA-65) for hybrid security.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { slh_dsa_sha2_128s } from '@noble/post-quantum/slh-dsa.js';
import secureLog from '../utils/secure-logger';
import {
  constantTimeEqual,
  type Ed25519KeyPair,
  type MLDSAKeyPair,
  type SLHDSAKeyPair,
  SIGNATURE_ALGORITHM_ED25519,
  SIGNATURE_ALGORITHM_ML_DSA_65,
  SIGNATURE_ALGORITHM_SLH_DSA,
  asEd25519PublicKey,
  asEd25519PrivateKey,
  asMLDSAPublicKey,
  asMLDSASecretKey,
  asSLHDSAPublicKey,
  asSLHDSASecretKey,
} from './signatures';

// ============================================================================
// Constants
// ============================================================================

/** Prekey rotation interval: exactly 7 days, no extension */
export const PREKEY_ROTATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** Maximum one-time prekeys in pool */
export const MAX_ONE_TIME_PREKEYS = 100;

/** Replenishment threshold */
export const ONE_TIME_PREKEY_REPLENISH_THRESHOLD = 20;

/** Domain separation prefix for prekey signing payloads */
const PREKEY_DOMAIN_PREFIX = new TextEncoder().encode('tallow-prekey-v1:');

/** Domain separation prefix for revocation payloads */
const REVOCATION_DOMAIN_PREFIX = new TextEncoder().encode('tallow-revoke-v1:');

/** Revocation reason codes */
export const REVOCATION_REASON_ROTATED = 'ROTATED' as const;
export const REVOCATION_REASON_COMPROMISED = 'COMPROMISED' as const;
export const REVOCATION_REASON_SUPERSEDED = 'SUPERSEDED' as const;

export type RevocationReason =
  | typeof REVOCATION_REASON_ROTATED
  | typeof REVOCATION_REASON_COMPROMISED
  | typeof REVOCATION_REASON_SUPERSEDED;

// ============================================================================
// Types
// ============================================================================

export interface PrekeyIdentity {
  /** Ed25519 identity keypair for real-time prekey signing */
  ed25519: Ed25519KeyPair;
  /** ML-DSA-65 identity keypair for long-term quantum-resistant identity */
  mldsa: MLDSAKeyPair;
  /** SLH-DSA identity keypair for emergency hash-based PQ backup (optional) */
  slhdsa: SLHDSAKeyPair | null;
}

export interface SignedPrekeyRecord {
  /** Unique prekey identifier */
  keyId: number;
  /** Ed25519 public key material for the prekey */
  publicKey: Uint8Array;
  /** Ed25519 private key material (kept secret) */
  privateKey: Uint8Array;
  /** Ed25519 signature over (domain || keyId || publicKey) by identity key */
  signature: Uint8Array;
  /** ML-DSA-65 signature over (domain || keyId || publicKey) for quantum-resistant binding */
  mldsaSignature: Uint8Array;
  /** Creation timestamp */
  createdAt: number;
  /** Whether this prekey has been revoked */
  revoked: boolean;
}

export interface OneTimePrekeyRecord {
  /** Unique prekey identifier */
  keyId: number;
  /** Public key */
  publicKey: Uint8Array;
  /** Private key (kept secret) */
  privateKey: Uint8Array;
  /** Ed25519 signature over (domain || keyId || publicKey) by identity key */
  signature: Uint8Array;
  /** Whether this prekey has been consumed */
  consumed: boolean;
}

export interface RevocationCertificate {
  /** The key ID being revoked */
  revokedKeyId: number;
  /** Hash of the revoked public key */
  revokedKeyHash: Uint8Array;
  /** Reason for revocation */
  reason: RevocationReason;
  /** Timestamp of revocation */
  revokedAt: number;
  /** Ed25519 signature over the revocation payload */
  signature: Uint8Array;
  /** ML-DSA-65 signature over the revocation payload for PQ assurance */
  mldsaSignature: Uint8Array;
}

export interface PrekeyBundle {
  /** Identity public key (Ed25519) */
  identityKey: Uint8Array;
  /** Identity public key (ML-DSA-65) for quantum-resistant verification */
  mldsaIdentityKey: Uint8Array;
  /** Identity public key (SLH-DSA) for emergency PQ verification (optional) */
  slhdsaIdentityKey: Uint8Array | null;
  /** Current signed prekey */
  signedPrekey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
    mldsaSignature: Uint8Array;
    createdAt: number;
  };
  /** Optional one-time prekey */
  oneTimePrekey?: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  /** Bundle creation timestamp */
  bundleTimestamp: number;
}

export interface PrekeyStoreState {
  /** Identity keys */
  identity: PrekeyIdentity;
  /** Current signed prekey */
  currentSignedPrekey: SignedPrekeyRecord;
  /** Previous signed prekey (kept during transition) */
  previousSignedPrekey: SignedPrekeyRecord | null;
  /** One-time prekey pool */
  oneTimePrekeys: OneTimePrekeyRecord[];
  /** Revocation certificates issued */
  revocationCertificates: RevocationCertificate[];
  /** Next key ID counter */
  nextKeyId: number;
}

// ============================================================================
// Identity Key Generation
// ============================================================================

/**
 * Generate a dual identity: Ed25519 for real-time + ML-DSA-65 for PQ long-term.
 * Optionally includes SLH-DSA for emergency hash-based PQ backup.
 */
export function generatePrekeyIdentity(options?: {
  includeSlhdsa?: boolean;
}): PrekeyIdentity {
  const ed25519PrivateKey = ed25519.utils.randomSecretKey();
  const ed25519PublicKey = ed25519.getPublicKey(ed25519PrivateKey);

  const { publicKey: mldsaPub, secretKey: mldsaSec } = ml_dsa65.keygen();

  let slhdsa: SLHDSAKeyPair | null = null;
  if (options?.includeSlhdsa) {
    const { publicKey: slhPub, secretKey: slhSec } = slh_dsa_sha2_128s.keygen();
    slhdsa = {
      algorithm: SIGNATURE_ALGORITHM_SLH_DSA,
      publicKey: asSLHDSAPublicKey(slhPub),
      secretKey: asSLHDSASecretKey(slhSec),
      created: Date.now(),
    };
  }

  return {
    ed25519: {
      algorithm: SIGNATURE_ALGORITHM_ED25519,
      publicKey: asEd25519PublicKey(ed25519PublicKey),
      privateKey: asEd25519PrivateKey(ed25519PrivateKey),
      created: Date.now(),
    },
    mldsa: {
      algorithm: SIGNATURE_ALGORITHM_ML_DSA_65,
      publicKey: asMLDSAPublicKey(mldsaPub),
      secretKey: asMLDSASecretKey(mldsaSec),
      created: Date.now(),
    },
    slhdsa,
  };
}

// ============================================================================
// Prekey Signing Helpers
// ============================================================================

/**
 * Serialize (domain || keyId || publicKey) for signing.
 * Domain separation prevents cross-protocol attacks where a signature from
 * one context (e.g., revocation) is replayed as a prekey signature.
 */
function serializePrekeyPayload(keyId: number, publicKey: Uint8Array): Uint8Array {
  const idBytes = new Uint8Array(4);
  new DataView(idBytes.buffer).setUint32(0, keyId, false);
  const payload = new Uint8Array(PREKEY_DOMAIN_PREFIX.length + 4 + publicKey.length);
  let offset = 0;
  payload.set(PREKEY_DOMAIN_PREFIX, offset);
  offset += PREKEY_DOMAIN_PREFIX.length;
  payload.set(idBytes, offset);
  offset += 4;
  payload.set(publicKey, offset);
  return payload;
}

/**
 * Serialize revocation payload for signing with domain separation.
 */
function serializeRevocationPayload(
  keyId: number,
  keyHash: Uint8Array,
  reason: RevocationReason,
  revokedAt: number
): Uint8Array {
  const encoder = new TextEncoder();
  const reasonBytes = encoder.encode(reason);
  const idBytes = new Uint8Array(4);
  new DataView(idBytes.buffer).setUint32(0, keyId, false);
  const timeBytes = new Uint8Array(8);
  new DataView(timeBytes.buffer).setBigUint64(0, BigInt(revokedAt), false);

  const total = REVOCATION_DOMAIN_PREFIX.length + 4 + keyHash.length + reasonBytes.length + 8;
  const payload = new Uint8Array(total);
  let offset = 0;
  payload.set(REVOCATION_DOMAIN_PREFIX, offset); offset += REVOCATION_DOMAIN_PREFIX.length;
  payload.set(idBytes, offset); offset += 4;
  payload.set(keyHash, offset); offset += keyHash.length;
  payload.set(reasonBytes, offset); offset += reasonBytes.length;
  payload.set(timeBytes, offset);
  return payload;
}

// ============================================================================
// Signed Prekey Generation
// ============================================================================

/**
 * Generate a new signed prekey, signed by both Ed25519 and ML-DSA-65 identity keys.
 * All prekeys MUST be signed -- unsigned prekeys are rejected.
 */
export function generateSignedPrekey(
  identity: PrekeyIdentity,
  keyId: number
): SignedPrekeyRecord {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);

  const payload = serializePrekeyPayload(keyId, publicKey);

  // Ed25519 signature (real-time verification)
  const signature = ed25519.sign(payload, identity.ed25519.privateKey);

  // ML-DSA-65 signature (quantum-resistant verification)
  const mldsaSignature = ml_dsa65.sign(payload, identity.mldsa.secretKey);

  return {
    keyId,
    publicKey,
    privateKey,
    signature,
    mldsaSignature,
    createdAt: Date.now(),
    revoked: false,
  };
}

// ============================================================================
// Prekey Verification
// ============================================================================

/**
 * Verify a signed prekey against the identity public key (Ed25519).
 * Rejects unsigned or tampered prekeys.
 */
export function verifySignedPrekeyEd25519(
  keyId: number,
  publicKey: Uint8Array,
  signature: Uint8Array,
  identityPublicKey: Uint8Array
): boolean {
  try {
    const payload = serializePrekeyPayload(keyId, publicKey);
    return ed25519.verify(signature, payload, identityPublicKey);
  } catch {
    return false;
  }
}

/**
 * Verify a signed prekey against the ML-DSA-65 identity public key.
 * Post-quantum assurance that the prekey is bound to this identity.
 */
export function verifySignedPrekeyMLDSA(
  keyId: number,
  publicKey: Uint8Array,
  mldsaSignature: Uint8Array,
  mldsaIdentityPublicKey: Uint8Array
): boolean {
  try {
    const payload = serializePrekeyPayload(keyId, publicKey);
    return ml_dsa65.verify(mldsaSignature, payload, mldsaIdentityPublicKey);
  } catch {
    return false;
  }
}

/**
 * Verify a signed prekey using hybrid verification (both Ed25519 + ML-DSA-65).
 * Both must pass for the verification to succeed.
 */
export function verifySignedPrekeyHybrid(
  keyId: number,
  publicKey: Uint8Array,
  ed25519Signature: Uint8Array,
  mldsaSignature: Uint8Array,
  ed25519IdentityPublicKey: Uint8Array,
  mldsaIdentityPublicKey: Uint8Array
): boolean {
  // Verify both without short-circuiting to maintain constant-time behavior
  const ed25519Valid = verifySignedPrekeyEd25519(
    keyId, publicKey, ed25519Signature, ed25519IdentityPublicKey
  );
  const mldsaValid = verifySignedPrekeyMLDSA(
    keyId, publicKey, mldsaSignature, mldsaIdentityPublicKey
  );
  return ed25519Valid && mldsaValid;
}

// ============================================================================
// Prekey Rotation
// ============================================================================

/**
 * Check if a signed prekey needs rotation (older than 7 days).
 */
export function shouldRotatePrekey(signedPrekey: SignedPrekeyRecord): boolean {
  const ageMs = Date.now() - signedPrekey.createdAt;
  return ageMs >= PREKEY_ROTATION_INTERVAL_MS;
}

/**
 * Rotate the signed prekey. Issues a revocation certificate for the old prekey.
 * Returns the updated store state.
 */
export function rotateSignedPrekey(state: PrekeyStoreState): PrekeyStoreState {
  const oldPrekey = state.currentSignedPrekey;

  // Issue revocation certificate for the old prekey
  const revocationCert = issueRevocationCertificate(
    state.identity,
    oldPrekey.keyId,
    oldPrekey.publicKey,
    REVOCATION_REASON_ROTATED
  );

  // Mark old prekey as revoked
  const revokedOld: SignedPrekeyRecord = { ...oldPrekey, revoked: true };

  // Generate new signed prekey
  const newPrekey = generateSignedPrekey(state.identity, state.nextKeyId);

  return {
    ...state,
    currentSignedPrekey: newPrekey,
    previousSignedPrekey: revokedOld,
    revocationCertificates: [...state.revocationCertificates, revocationCert],
    nextKeyId: state.nextKeyId + 1,
  };
}

// ============================================================================
// One-Time Prekey Management
// ============================================================================

/**
 * Generate a batch of one-time prekeys, each signed by the identity key.
 */
export function generateOneTimePrekeys(
  identity: PrekeyIdentity,
  startKeyId: number,
  count: number
): OneTimePrekeyRecord[] {
  const prekeys: OneTimePrekeyRecord[] = [];

  for (let i = 0; i < count; i++) {
    const keyId = startKeyId + i;
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);

    const payload = serializePrekeyPayload(keyId, publicKey);
    const signature = ed25519.sign(payload, identity.ed25519.privateKey);

    prekeys.push({
      keyId,
      publicKey,
      privateKey,
      signature,
      consumed: false,
    });
  }

  return prekeys;
}

/**
 * Consume a one-time prekey. Marks it consumed and returns the private key.
 * Reuse of a consumed prekey is a protocol error and returns null.
 */
export function consumeOneTimePrekey(
  state: PrekeyStoreState,
  keyId: number
): { privateKey: Uint8Array; updatedState: PrekeyStoreState } | null {
  const index = state.oneTimePrekeys.findIndex(
    (pk) => pk.keyId === keyId && !pk.consumed
  );
  if (index === -1) {
    secureLog.warn(`[prekeys] One-time prekey ${keyId} not found or already consumed -- protocol error`);
    return null;
  }

  const prekey = state.oneTimePrekeys[index]!;
  const updatedPrekeys = [...state.oneTimePrekeys];
  updatedPrekeys[index] = { ...prekey, consumed: true };

  return {
    privateKey: prekey.privateKey,
    updatedState: {
      ...state,
      oneTimePrekeys: updatedPrekeys,
    },
  };
}

/**
 * Replenish one-time prekeys if pool is below threshold.
 */
export function replenishOneTimePrekeys(state: PrekeyStoreState): PrekeyStoreState {
  const available = state.oneTimePrekeys.filter((pk) => !pk.consumed);
  if (available.length >= ONE_TIME_PREKEY_REPLENISH_THRESHOLD) {
    return state;
  }

  const needed = MAX_ONE_TIME_PREKEYS - available.length;
  const newPrekeys = generateOneTimePrekeys(state.identity, state.nextKeyId, needed);

  return {
    ...state,
    oneTimePrekeys: [...state.oneTimePrekeys.filter((pk) => !pk.consumed), ...newPrekeys],
    nextKeyId: state.nextKeyId + needed,
  };
}

// ============================================================================
// Revocation Certificates
// ============================================================================

/**
 * Issue a signed revocation certificate for a prekey.
 * Signed by both Ed25519 and ML-DSA-65 for dual assurance.
 */
export function issueRevocationCertificate(
  identity: PrekeyIdentity,
  keyId: number,
  publicKey: Uint8Array,
  reason: RevocationReason
): RevocationCertificate {
  const revokedAt = Date.now();
  const revokedKeyHash = sha256(publicKey);

  const payload = serializeRevocationPayload(keyId, revokedKeyHash, reason, revokedAt);

  const signature = ed25519.sign(payload, identity.ed25519.privateKey);
  const mldsaSignature = ml_dsa65.sign(payload, identity.mldsa.secretKey);

  return {
    revokedKeyId: keyId,
    revokedKeyHash,
    reason,
    revokedAt,
    signature,
    mldsaSignature,
  };
}

/**
 * Verify a revocation certificate against both identity public keys.
 */
export function verifyRevocationCertificate(
  cert: RevocationCertificate,
  identityPublicKey: Uint8Array,
  mldsaIdentityPublicKey: Uint8Array
): boolean {
  try {
    const payload = serializeRevocationPayload(
      cert.revokedKeyId,
      cert.revokedKeyHash,
      cert.reason,
      cert.revokedAt
    );

    // Verify both without short-circuiting for constant-time behavior
    const ed25519Valid = ed25519.verify(cert.signature, payload, identityPublicKey);
    const mldsaValid = ml_dsa65.verify(cert.mldsaSignature, payload, mldsaIdentityPublicKey);

    return ed25519Valid && mldsaValid;
  } catch {
    return false;
  }
}

/**
 * Check whether a key ID has been revoked.
 */
export function isKeyRevoked(state: PrekeyStoreState, keyId: number): boolean {
  return state.revocationCertificates.some((cert) => cert.revokedKeyId === keyId);
}

// ============================================================================
// Prekey Bundle Construction
// ============================================================================

/**
 * Build a publishable prekey bundle for the signaling server.
 * Includes identity keys, signed prekey, and optionally a one-time prekey.
 */
export function buildPrekeyBundle(state: PrekeyStoreState): PrekeyBundle {
  const currentPrekey = state.currentSignedPrekey;

  // Reject if current prekey is revoked (should not happen, but defense-in-depth)
  if (currentPrekey.revoked) {
    throw new Error('[prekeys] Cannot build bundle with revoked prekey -- rotate first');
  }

  // Find first available (unconsumed) one-time prekey
  const availableOTP = state.oneTimePrekeys.find((pk) => !pk.consumed);

  const bundle: PrekeyBundle = {
    identityKey: state.identity.ed25519.publicKey,
    mldsaIdentityKey: state.identity.mldsa.publicKey,
    slhdsaIdentityKey: state.identity.slhdsa ? state.identity.slhdsa.publicKey : null,
    signedPrekey: {
      keyId: currentPrekey.keyId,
      publicKey: currentPrekey.publicKey,
      signature: currentPrekey.signature,
      mldsaSignature: currentPrekey.mldsaSignature,
      createdAt: currentPrekey.createdAt,
    },
    bundleTimestamp: Date.now(),
  };

  if (availableOTP) {
    bundle.oneTimePrekey = {
      keyId: availableOTP.keyId,
      publicKey: availableOTP.publicKey,
      signature: availableOTP.signature,
    };
  }

  return bundle;
}

/**
 * Verify a received prekey bundle.
 * All prekeys MUST be signed -- unsigned prekeys are rejected.
 * Uses hybrid verification (Ed25519 + ML-DSA-65) on the signed prekey.
 */
export function verifyPrekeyBundle(bundle: PrekeyBundle): boolean {
  // Verify signed prekey with BOTH Ed25519 and ML-DSA-65 (hybrid)
  const spkHybridValid = verifySignedPrekeyHybrid(
    bundle.signedPrekey.keyId,
    bundle.signedPrekey.publicKey,
    bundle.signedPrekey.signature,
    bundle.signedPrekey.mldsaSignature,
    bundle.identityKey,
    bundle.mldsaIdentityKey
  );
  if (!spkHybridValid) {
    secureLog.warn('[prekeys] Signed prekey hybrid signature verification failed');
    return false;
  }

  // Verify signed prekey age (reject if older than rotation interval + grace)
  const prekeyAge = Date.now() - bundle.signedPrekey.createdAt;
  const gracePeriodMs = PREKEY_ROTATION_INTERVAL_MS + (24 * 60 * 60 * 1000); // 7 days + 1 day grace
  if (prekeyAge > gracePeriodMs) {
    secureLog.warn('[prekeys] Signed prekey is older than rotation interval + grace period');
    return false;
  }

  // Verify one-time prekey if present
  if (bundle.oneTimePrekey) {
    const otpValid = verifySignedPrekeyEd25519(
      bundle.oneTimePrekey.keyId,
      bundle.oneTimePrekey.publicKey,
      bundle.oneTimePrekey.signature,
      bundle.identityKey
    );
    if (!otpValid) {
      secureLog.warn('[prekeys] One-time prekey signature verification failed');
      return false;
    }
  }

  return true;
}

// ============================================================================
// Prekey Store Initialization
// ============================================================================

/**
 * Initialize a fresh prekey store with identity, signed prekey, and one-time prekeys.
 */
export function initializePrekeyStoreState(options?: {
  includeSlhdsa?: boolean;
}): PrekeyStoreState {
  const identity = generatePrekeyIdentity(options);
  const signedPrekey = generateSignedPrekey(identity, 1);
  const oneTimePrekeys = generateOneTimePrekeys(identity, 2, MAX_ONE_TIME_PREKEYS);

  return {
    identity,
    currentSignedPrekey: signedPrekey,
    previousSignedPrekey: null,
    oneTimePrekeys,
    revocationCertificates: [],
    nextKeyId: MAX_ONE_TIME_PREKEYS + 2,
  };
}

// ============================================================================
// Emergency SLH-DSA Operations
// ============================================================================

/**
 * Sign a prekey bundle with SLH-DSA for emergency backup verification.
 * This is used when ML-DSA-65 may be compromised by a quantum adversary
 * and the hash-based SLH-DSA provides an independent trust anchor.
 *
 * Returns the SLH-DSA signature over the bundle's signed prekey payload,
 * or null if no SLH-DSA identity key is configured.
 */
export function signPrekeyWithSLHDSA(
  identity: PrekeyIdentity,
  keyId: number,
  publicKey: Uint8Array
): Uint8Array | null {
  if (!identity.slhdsa) {
    return null;
  }
  const payload = serializePrekeyPayload(keyId, publicKey);
  return slh_dsa_sha2_128s.sign(payload, identity.slhdsa.secretKey);
}

/**
 * Verify a prekey using SLH-DSA emergency identity key.
 */
export function verifySignedPrekeySLHDSA(
  keyId: number,
  publicKey: Uint8Array,
  slhdsaSignature: Uint8Array,
  slhdsaIdentityPublicKey: Uint8Array
): boolean {
  try {
    const payload = serializePrekeyPayload(keyId, publicKey);
    return slh_dsa_sha2_128s.verify(slhdsaSignature, payload, slhdsaIdentityPublicKey);
  } catch {
    return false;
  }
}

// ============================================================================
// Export
// ============================================================================

export const prekeys = {
  generatePrekeyIdentity,
  generateSignedPrekey,
  verifySignedPrekeyEd25519,
  verifySignedPrekeyMLDSA,
  verifySignedPrekeyHybrid,
  verifySignedPrekeySLHDSA,
  signPrekeyWithSLHDSA,
  shouldRotatePrekey,
  rotateSignedPrekey,
  generateOneTimePrekeys,
  consumeOneTimePrekey,
  replenishOneTimePrekeys,
  issueRevocationCertificate,
  verifyRevocationCertificate,
  isKeyRevoked,
  buildPrekeyBundle,
  verifyPrekeyBundle,
  initializePrekeyStoreState,
  PREKEY_ROTATION_INTERVAL_MS,
  MAX_ONE_TIME_PREKEYS,
  ONE_TIME_PREKEY_REPLENISH_THRESHOLD,
  constantTimeEqual,
};

export default prekeys;
