'use client';

/**
 * AGENT 011 - SIGNATURE-AUTHORITY
 *
 * Unified Digital Signature Facade
 * Binds identities to cryptographic keys across Ed25519, ML-DSA-65, and SLH-DSA.
 *
 * Standards:
 * - Ed25519: RFC 8032 -- real-time operations, 64-byte signatures
 * - ML-DSA-65: FIPS 204 -- long-term identity, post-quantum, ~3,309-byte signatures
 * - SLH-DSA-SHA2-128s: FIPS 205 -- emergency backup, hash-based, ~7,856-byte signatures
 *
 * Hybrid Signatures:
 * - Ed25519 + ML-DSA-65: Concatenation of both signatures for quantum resistance
 *   with classical fallback. Both MUST verify for hybrid to pass.
 *
 * Operational Rules:
 * 1. All prekeys MUST be signed with the identity key -- unsigned prekeys rejected.
 * 2. Prekeys rotate every 7 days -- no extension.
 * 3. One-time prekeys consumed once -- reuse is a protocol error.
 * 4. Ed25519 for real-time, ML-DSA-65 for long-term, SLH-DSA for emergency.
 * 5. Signature verification MUST be constant-time.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { slh_dsa_sha2_128s } from '@noble/post-quantum/slh-dsa.js';
import { sha256 } from '@noble/hashes/sha2.js';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Constants
// ============================================================================

export const SIGNATURE_ALGORITHM_ED25519 = 'Ed25519' as const;
export const SIGNATURE_ALGORITHM_ML_DSA_65 = 'ML-DSA-65' as const;
export const SIGNATURE_ALGORITHM_SLH_DSA = 'SLH-DSA-SHA2-128s' as const;
export const SIGNATURE_ALGORITHM_HYBRID = 'Hybrid-Ed25519-ML-DSA-65' as const;

export const ED25519_SIGNATURE_SIZE = 64;
export const ED25519_PUBLIC_KEY_SIZE = 32;
export const ED25519_PRIVATE_KEY_SIZE = 32;

export const ML_DSA_65_SIGNATURE_SIZE = 3309;
export const ML_DSA_65_PUBLIC_KEY_SIZE = 1952;
export const ML_DSA_65_SECRET_KEY_SIZE = 4032;

export const SLH_DSA_SIGNATURE_SIZE = 7856;
export const SLH_DSA_PUBLIC_KEY_SIZE = 32;
export const SLH_DSA_SECRET_KEY_SIZE = 64;

/** Hybrid signature = Ed25519 (64 bytes) || ML-DSA-65 (~3309 bytes) */
export const HYBRID_SIGNATURE_ED25519_OFFSET = 0;
export const HYBRID_SIGNATURE_MLDSA_OFFSET = ED25519_SIGNATURE_SIZE;

export type SignatureAlgorithm =
  | typeof SIGNATURE_ALGORITHM_ED25519
  | typeof SIGNATURE_ALGORITHM_ML_DSA_65
  | typeof SIGNATURE_ALGORITHM_SLH_DSA
  | typeof SIGNATURE_ALGORITHM_HYBRID;

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

declare const signatureKeyBrand: unique symbol;

type SignatureKeyBrand<TAlgo extends string, TRole extends string> = {
  readonly [signatureKeyBrand]: `${TAlgo}:${TRole}`;
};

/** Ed25519 public key (32 bytes) */
export type Ed25519PublicKey = Uint8Array & SignatureKeyBrand<'Ed25519', 'public'>;
/** Ed25519 private key (32 bytes) */
export type Ed25519PrivateKey = Uint8Array & SignatureKeyBrand<'Ed25519', 'private'>;
/** ML-DSA-65 public key (1952 bytes) */
export type MLDSAPublicKey = Uint8Array & SignatureKeyBrand<'ML-DSA-65', 'public'>;
/** ML-DSA-65 secret key (4032 bytes) */
export type MLDSASecretKey = Uint8Array & SignatureKeyBrand<'ML-DSA-65', 'secret'>;
/** SLH-DSA-SHA2-128s public key (32 bytes) */
export type SLHDSAPublicKey = Uint8Array & SignatureKeyBrand<'SLH-DSA', 'public'>;
/** SLH-DSA-SHA2-128s secret key (64 bytes) */
export type SLHDSASecretKey = Uint8Array & SignatureKeyBrand<'SLH-DSA', 'secret'>;

// Brand casting helpers (no runtime cost -- these are purely compile-time assertions)
export function asEd25519PublicKey(k: Uint8Array): Ed25519PublicKey { return k as Ed25519PublicKey; }
export function asEd25519PrivateKey(k: Uint8Array): Ed25519PrivateKey { return k as Ed25519PrivateKey; }
export function asMLDSAPublicKey(k: Uint8Array): MLDSAPublicKey { return k as MLDSAPublicKey; }
export function asMLDSASecretKey(k: Uint8Array): MLDSASecretKey { return k as MLDSASecretKey; }
export function asSLHDSAPublicKey(k: Uint8Array): SLHDSAPublicKey { return k as SLHDSAPublicKey; }
export function asSLHDSASecretKey(k: Uint8Array): SLHDSASecretKey { return k as SLHDSASecretKey; }

// ============================================================================
// Key Pair Types
// ============================================================================

export interface Ed25519KeyPair {
  algorithm: typeof SIGNATURE_ALGORITHM_ED25519;
  publicKey: Ed25519PublicKey;
  privateKey: Ed25519PrivateKey;
  created: number;
}

export interface MLDSAKeyPair {
  algorithm: typeof SIGNATURE_ALGORITHM_ML_DSA_65;
  publicKey: MLDSAPublicKey;
  secretKey: MLDSASecretKey;
  created: number;
}

export interface SLHDSAKeyPair {
  algorithm: typeof SIGNATURE_ALGORITHM_SLH_DSA;
  publicKey: SLHDSAPublicKey;
  secretKey: SLHDSASecretKey;
  created: number;
}

/**
 * Hybrid identity key pair: Ed25519 (classical) + ML-DSA-65 (post-quantum).
 * Verification requires BOTH signatures to pass.
 */
export interface HybridKeyPair {
  algorithm: typeof SIGNATURE_ALGORITHM_HYBRID;
  ed25519: Ed25519KeyPair;
  mldsa: MLDSAKeyPair;
  created: number;
}

// ============================================================================
// Signature Types
// ============================================================================

export interface UnifiedSignature {
  algorithm: SignatureAlgorithm;
  signature: Uint8Array;
  signerPublicKey: Uint8Array;
  timestamp: number;
}

/**
 * Hybrid signature contains both Ed25519 and ML-DSA-65 components.
 * The raw `signature` field is their concatenation: Ed25519 (64B) || ML-DSA-65 (~3309B).
 * Both must verify for the hybrid to be considered valid.
 */
export interface HybridSignature extends UnifiedSignature {
  algorithm: typeof SIGNATURE_ALGORITHM_HYBRID;
  /** Concatenated: Ed25519 (64 bytes) || ML-DSA-65 (~3309 bytes) */
  signature: Uint8Array;
  /** Ed25519 public key used for the classical component */
  ed25519PublicKey: Ed25519PublicKey;
  /** ML-DSA-65 public key used for the post-quantum component */
  mldsaPublicKey: MLDSAPublicKey;
}

// ============================================================================
// Ed25519 Operations (RFC 8032 - Real-Time)
// ============================================================================

/**
 * Generate Ed25519 keypair for real-time signing operations.
 */
export function generateEd25519KeyPair(): Ed25519KeyPair {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return {
    algorithm: SIGNATURE_ALGORITHM_ED25519,
    publicKey: asEd25519PublicKey(publicKey),
    privateKey: asEd25519PrivateKey(privateKey),
    created: Date.now(),
  };
}

/**
 * Sign data with Ed25519.
 * Used for real-time operations: prekey signing, session authentication.
 */
export function ed25519Sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}

/**
 * Verify Ed25519 signature (constant-time via noble/curves).
 */
export function ed25519Verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

// ============================================================================
// ML-DSA-65 Operations (FIPS 204 - Long-Term / Post-Quantum)
// ============================================================================

/**
 * Generate ML-DSA-65 keypair for long-term identity signing.
 * Post-quantum resistant. Security level 3 (comparable to AES-192).
 */
export function generateMLDSAKeyPair(): MLDSAKeyPair {
  const { publicKey, secretKey } = ml_dsa65.keygen();
  return {
    algorithm: SIGNATURE_ALGORITHM_ML_DSA_65,
    publicKey: asMLDSAPublicKey(publicKey),
    secretKey: asMLDSASecretKey(secretKey),
    created: Date.now(),
  };
}

/**
 * Sign data with ML-DSA-65.
 * Used for long-term identity binding and quantum-resistant signatures.
 */
export function mldsaSign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return ml_dsa65.sign(message, secretKey);
}

/**
 * Verify ML-DSA-65 signature (constant-time via noble/post-quantum).
 */
export function mldsaVerify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    return ml_dsa65.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

// ============================================================================
// SLH-DSA-SHA2-128s Operations (FIPS 205 - Emergency Backup)
// ============================================================================

/**
 * Generate SLH-DSA-SHA2-128s keypair for emergency backup signing.
 * Hash-based, stateless, conservative security assumptions.
 * Security level 1 (comparable to AES-128).
 *
 * Trade-offs vs ML-DSA-65:
 * - Pro: Simpler security proof (hash-only), stateless
 * - Con: Larger signatures (~7.9 KB), slower operations
 */
export function generateSLHDSAKeyPair(): SLHDSAKeyPair {
  const { publicKey, secretKey } = slh_dsa_sha2_128s.keygen();
  return {
    algorithm: SIGNATURE_ALGORITHM_SLH_DSA,
    publicKey: asSLHDSAPublicKey(publicKey),
    secretKey: asSLHDSASecretKey(secretKey),
    created: Date.now(),
  };
}

/**
 * Sign data with SLH-DSA-SHA2-128s.
 * Used as emergency backup when ML-DSA is unavailable or for conservative long-term use.
 */
export function slhdsaSign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return slh_dsa_sha2_128s.sign(message, secretKey);
}

/**
 * Verify SLH-DSA-SHA2-128s signature (constant-time via noble/post-quantum).
 */
export function slhdsaVerify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    return slh_dsa_sha2_128s.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

// ============================================================================
// Hybrid Signature Operations (Ed25519 + ML-DSA-65)
// ============================================================================

/**
 * Generate a hybrid identity key pair (Ed25519 + ML-DSA-65).
 * This is the recommended approach for quantum resistance with classical fallback.
 */
export function generateHybridKeyPair(): HybridKeyPair {
  const ed25519KP = generateEd25519KeyPair();
  const mldsaKP = generateMLDSAKeyPair();
  return {
    algorithm: SIGNATURE_ALGORITHM_HYBRID,
    ed25519: ed25519KP,
    mldsa: mldsaKP,
    created: Date.now(),
  };
}

/**
 * Create a hybrid signature by signing with both Ed25519 and ML-DSA-65.
 * The result is a concatenation: Ed25519 signature (64B) || ML-DSA-65 signature (~3309B).
 *
 * Both components sign the SAME message. Verification requires BOTH to pass.
 * This ensures security even if one algorithm is broken.
 */
export function hybridSign(
  message: Uint8Array,
  ed25519PrivateKey: Uint8Array,
  mldsaSecretKey: Uint8Array
): Uint8Array {
  const ed25519Sig = ed25519.sign(message, ed25519PrivateKey);
  const mldsaSig = ml_dsa65.sign(message, mldsaSecretKey);

  // Concatenate: Ed25519 (64B) || ML-DSA-65 (~3309B)
  const combined = new Uint8Array(ed25519Sig.length + mldsaSig.length);
  combined.set(ed25519Sig, HYBRID_SIGNATURE_ED25519_OFFSET);
  combined.set(mldsaSig, HYBRID_SIGNATURE_MLDSA_OFFSET);
  return combined;
}

/**
 * Verify a hybrid signature. BOTH Ed25519 and ML-DSA-65 components MUST verify.
 * If either fails, the entire verification fails.
 *
 * This is a defense-in-depth strategy: the signature is secure as long as at
 * least one of the two algorithms remains unbroken, but we require both to
 * prevent downgrade attacks where an attacker strips one component.
 */
export function hybridVerify(
  signature: Uint8Array,
  message: Uint8Array,
  ed25519PublicKey: Uint8Array,
  mldsaPublicKey: Uint8Array
): boolean {
  try {
    // Validate minimum length: Ed25519 (64B) + at least 1 byte of ML-DSA
    if (signature.length <= ED25519_SIGNATURE_SIZE) {
      secureLog.warn('[signatures] Hybrid signature too short');
      return false;
    }

    // Split components
    const ed25519Sig = signature.slice(
      HYBRID_SIGNATURE_ED25519_OFFSET,
      HYBRID_SIGNATURE_MLDSA_OFFSET
    );
    const mldsaSig = signature.slice(HYBRID_SIGNATURE_MLDSA_OFFSET);

    // Verify BOTH -- do not short-circuit to maintain constant-time behavior.
    // We verify both before checking results to prevent timing leaks about
    // which algorithm failed.
    const ed25519Valid = ed25519Verify(ed25519Sig, message, ed25519PublicKey);
    const mldsaValid = mldsaVerify(mldsaSig, message, mldsaPublicKey);

    return ed25519Valid && mldsaValid;
  } catch {
    return false;
  }
}

// ============================================================================
// Unified Signing Interface
// ============================================================================

/**
 * Sign data with the specified algorithm and return a UnifiedSignature.
 */
export function signData(
  message: Uint8Array,
  privateOrSecretKey: Uint8Array,
  signerPublicKey: Uint8Array,
  algorithm: SignatureAlgorithm
): UnifiedSignature {
  let signature: Uint8Array;

  switch (algorithm) {
    case SIGNATURE_ALGORITHM_ED25519:
      signature = ed25519Sign(message, privateOrSecretKey);
      break;
    case SIGNATURE_ALGORITHM_ML_DSA_65:
      signature = mldsaSign(message, privateOrSecretKey);
      break;
    case SIGNATURE_ALGORITHM_SLH_DSA:
      signature = slhdsaSign(message, privateOrSecretKey);
      break;
    case SIGNATURE_ALGORITHM_HYBRID:
      throw new Error(
        'Use signDataHybrid() for hybrid signatures -- hybrid requires two separate keys'
      );
    default: {
      const _exhaustive: never = algorithm;
      throw new Error(`Unsupported signing algorithm: ${_exhaustive}`);
    }
  }

  return {
    algorithm,
    signature,
    signerPublicKey,
    timestamp: Date.now(),
  };
}

/**
 * Sign data with the hybrid Ed25519 + ML-DSA-65 scheme.
 * Returns a HybridSignature containing both components.
 */
export function signDataHybrid(
  message: Uint8Array,
  hybridKeys: HybridKeyPair
): HybridSignature {
  const signature = hybridSign(
    message,
    hybridKeys.ed25519.privateKey,
    hybridKeys.mldsa.secretKey
  );

  return {
    algorithm: SIGNATURE_ALGORITHM_HYBRID,
    signature,
    signerPublicKey: hybridKeys.ed25519.publicKey,
    ed25519PublicKey: hybridKeys.ed25519.publicKey,
    mldsaPublicKey: hybridKeys.mldsa.publicKey,
    timestamp: Date.now(),
  };
}

/**
 * Verify a UnifiedSignature.
 */
export function verifyData(
  message: Uint8Array,
  unifiedSignature: UnifiedSignature
): boolean {
  switch (unifiedSignature.algorithm) {
    case SIGNATURE_ALGORITHM_ED25519:
      return ed25519Verify(
        unifiedSignature.signature,
        message,
        unifiedSignature.signerPublicKey
      );
    case SIGNATURE_ALGORITHM_ML_DSA_65:
      return mldsaVerify(
        unifiedSignature.signature,
        message,
        unifiedSignature.signerPublicKey
      );
    case SIGNATURE_ALGORITHM_SLH_DSA:
      return slhdsaVerify(
        unifiedSignature.signature,
        message,
        unifiedSignature.signerPublicKey
      );
    case SIGNATURE_ALGORITHM_HYBRID: {
      // For hybrid verification we need both public keys.
      // If the caller used HybridSignature, we can extract them.
      const hybrid = unifiedSignature as HybridSignature;
      if (!hybrid.ed25519PublicKey || !hybrid.mldsaPublicKey) {
        secureLog.warn('[signatures] Hybrid signature missing public key components');
        return false;
      }
      return hybridVerify(
        hybrid.signature,
        message,
        hybrid.ed25519PublicKey,
        hybrid.mldsaPublicKey
      );
    }
    default:
      secureLog.warn(`[signatures] Unknown algorithm: ${unifiedSignature.algorithm}`);
      return false;
  }
}

// ============================================================================
// Constant-Time Comparison Helper
// ============================================================================

/**
 * Timing-safe byte comparison to prevent side-channel attacks.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

// ============================================================================
// Public Key Fingerprinting
// ============================================================================

/**
 * Compute a display-friendly fingerprint for any public key.
 * Format: 8 groups of 4 hex characters, e.g. "A1B2 C3D4 E5F6 7890 ..."
 */
export function computeFingerprint(publicKey: Uint8Array): string {
  const hash = sha256(publicKey);
  return Array.from(hash.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .match(/.{4}/g)!
    .join(' ')
    .toUpperCase();
}

/**
 * Compute a fingerprint for a hybrid key pair.
 * Hashes both public keys together for a single identifier.
 */
export function computeHybridFingerprint(hybridKeys: HybridKeyPair): string {
  const combined = new Uint8Array(
    hybridKeys.ed25519.publicKey.length + hybridKeys.mldsa.publicKey.length
  );
  combined.set(hybridKeys.ed25519.publicKey, 0);
  combined.set(hybridKeys.mldsa.publicKey, hybridKeys.ed25519.publicKey.length);
  return computeFingerprint(combined);
}

// ============================================================================
// Algorithm Selection Utility
// ============================================================================

/**
 * Determine which signature algorithm to use based on context.
 *
 * - Real-time operations (session auth, chat): Ed25519
 * - Long-term identity binding: ML-DSA-65 or Hybrid
 * - Emergency / conservative backup: SLH-DSA
 */
export function selectAlgorithm(
  context: 'realtime' | 'long-term' | 'emergency' | 'hybrid'
): SignatureAlgorithm {
  switch (context) {
    case 'realtime':
      return SIGNATURE_ALGORITHM_ED25519;
    case 'long-term':
      return SIGNATURE_ALGORITHM_ML_DSA_65;
    case 'emergency':
      return SIGNATURE_ALGORITHM_SLH_DSA;
    case 'hybrid':
      return SIGNATURE_ALGORITHM_HYBRID;
  }
}

// ============================================================================
// Export
// ============================================================================

export const signatures = {
  // Key generation
  generateEd25519KeyPair,
  generateMLDSAKeyPair,
  generateSLHDSAKeyPair,
  generateHybridKeyPair,

  // Ed25519
  ed25519Sign,
  ed25519Verify,

  // ML-DSA-65
  mldsaSign,
  mldsaVerify,

  // SLH-DSA
  slhdsaSign,
  slhdsaVerify,

  // Hybrid
  hybridSign,
  hybridVerify,

  // Unified
  signData,
  signDataHybrid,
  verifyData,

  // Utilities
  constantTimeEqual,
  computeFingerprint,
  computeHybridFingerprint,
  selectAlgorithm,

  // Constants
  ED25519_SIGNATURE_SIZE,
  ED25519_PUBLIC_KEY_SIZE,
  ED25519_PRIVATE_KEY_SIZE,
  ML_DSA_65_SIGNATURE_SIZE,
  ML_DSA_65_PUBLIC_KEY_SIZE,
  ML_DSA_65_SECRET_KEY_SIZE,
  SLH_DSA_SIGNATURE_SIZE,
  SLH_DSA_PUBLIC_KEY_SIZE,
  SLH_DSA_SECRET_KEY_SIZE,
};

export default signatures;
