/**
 * AGENT 011 - SIGNATURE-AUTHORITY Test Suite
 *
 * Tests for:
 * - Ed25519 (RFC 8032): key generation, sign, verify
 * - ML-DSA-65 (FIPS 204): key generation, sign, verify
 * - SLH-DSA-SHA2-128s (FIPS 205): key generation, sign, verify
 * - Hybrid signatures (Ed25519 + ML-DSA-65): sign, verify, rejection on tamper
 * - Prekey bundles: generation, signing, verification, rotation, revocation
 * - One-time prekeys: consumption, reuse rejection
 * - Constant-time comparison
 */

import { describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Signatures module
// ---------------------------------------------------------------------------
import {
  generateEd25519KeyPair,
  ed25519Sign,
  ed25519Verify,
  generateMLDSAKeyPair,
  mldsaSign,
  mldsaVerify,
  generateSLHDSAKeyPair,
  slhdsaSign,
  slhdsaVerify,
  generateHybridKeyPair,
  hybridSign,
  hybridVerify,
  signData,
  signDataHybrid,
  verifyData,
  constantTimeEqual,
  computeFingerprint,
  computeHybridFingerprint,
  selectAlgorithm,
  SIGNATURE_ALGORITHM_ED25519,
  SIGNATURE_ALGORITHM_ML_DSA_65,
  SIGNATURE_ALGORITHM_SLH_DSA,
  SIGNATURE_ALGORITHM_HYBRID,
  ED25519_SIGNATURE_SIZE,
  ML_DSA_65_SIGNATURE_SIZE,
  SLH_DSA_SIGNATURE_SIZE,
} from '@/lib/crypto/signatures';

// ---------------------------------------------------------------------------
// Prekeys module
// ---------------------------------------------------------------------------
import {
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
  REVOCATION_REASON_ROTATED,
  REVOCATION_REASON_COMPROMISED,
} from '@/lib/crypto/prekeys';

// Shared test message
const TEST_MESSAGE = new TextEncoder().encode('The quick brown fox jumps over the lazy dog');

// ============================================================================
// Ed25519 (RFC 8032)
// ============================================================================

describe('Ed25519 (RFC 8032)', () => {
  it('generates a key pair with correct sizes', () => {
    const kp = generateEd25519KeyPair();
    expect(kp.algorithm).toBe(SIGNATURE_ALGORITHM_ED25519);
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.privateKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(32);
    expect(kp.privateKey.length).toBe(32);
    expect(kp.created).toBeGreaterThan(0);
  });

  it('signs and verifies a message', () => {
    const kp = generateEd25519KeyPair();
    const sig = ed25519Sign(TEST_MESSAGE, kp.privateKey);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBe(ED25519_SIGNATURE_SIZE);

    const valid = ed25519Verify(sig, TEST_MESSAGE, kp.publicKey);
    expect(valid).toBe(true);
  });

  it('rejects a tampered message', () => {
    const kp = generateEd25519KeyPair();
    const sig = ed25519Sign(TEST_MESSAGE, kp.privateKey);

    const tampered = new Uint8Array(TEST_MESSAGE);
    tampered[0] ^= 0xff;
    expect(ed25519Verify(sig, tampered, kp.publicKey)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const kp = generateEd25519KeyPair();
    const sig = ed25519Sign(TEST_MESSAGE, kp.privateKey);

    const badSig = new Uint8Array(sig);
    badSig[0] ^= 0xff;
    expect(ed25519Verify(badSig, TEST_MESSAGE, kp.publicKey)).toBe(false);
  });

  it('rejects verification with wrong public key', () => {
    const kp1 = generateEd25519KeyPair();
    const kp2 = generateEd25519KeyPair();
    const sig = ed25519Sign(TEST_MESSAGE, kp1.privateKey);
    expect(ed25519Verify(sig, TEST_MESSAGE, kp2.publicKey)).toBe(false);
  });
});

// ============================================================================
// ML-DSA-65 (FIPS 204)
// ============================================================================

describe('ML-DSA-65 (FIPS 204)', () => {
  it('generates a key pair with correct sizes', () => {
    const kp = generateMLDSAKeyPair();
    expect(kp.algorithm).toBe(SIGNATURE_ALGORITHM_ML_DSA_65);
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.secretKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(1952);
    expect(kp.secretKey.length).toBe(4032);
  });

  it('signs and verifies a message', () => {
    const kp = generateMLDSAKeyPair();
    const sig = mldsaSign(TEST_MESSAGE, kp.secretKey);
    expect(sig).toBeInstanceOf(Uint8Array);
    // ML-DSA-65 signatures are approximately 3309 bytes
    expect(sig.length).toBeGreaterThan(3000);

    const valid = mldsaVerify(sig, TEST_MESSAGE, kp.publicKey);
    expect(valid).toBe(true);
  });

  it('rejects a tampered message', () => {
    const kp = generateMLDSAKeyPair();
    const sig = mldsaSign(TEST_MESSAGE, kp.secretKey);

    const tampered = new Uint8Array(TEST_MESSAGE);
    tampered[0] ^= 0xff;
    expect(mldsaVerify(sig, tampered, kp.publicKey)).toBe(false);
  });

  it('rejects verification with wrong public key', () => {
    const kp1 = generateMLDSAKeyPair();
    const kp2 = generateMLDSAKeyPair();
    const sig = mldsaSign(TEST_MESSAGE, kp1.secretKey);
    expect(mldsaVerify(sig, TEST_MESSAGE, kp2.publicKey)).toBe(false);
  });
});

// ============================================================================
// SLH-DSA-SHA2-128s (FIPS 205)
// ============================================================================

describe('SLH-DSA-SHA2-128s (FIPS 205)', () => {
  it('generates a key pair with correct sizes', () => {
    const kp = generateSLHDSAKeyPair();
    expect(kp.algorithm).toBe(SIGNATURE_ALGORITHM_SLH_DSA);
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.secretKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(32);
    expect(kp.secretKey.length).toBe(64);
  });

  it('signs and verifies a message', () => {
    const kp = generateSLHDSAKeyPair();
    const sig = slhdsaSign(TEST_MESSAGE, kp.secretKey);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBe(SLH_DSA_SIGNATURE_SIZE);

    const valid = slhdsaVerify(sig, TEST_MESSAGE, kp.publicKey);
    expect(valid).toBe(true);
  });

  it('rejects a tampered message', () => {
    const kp = generateSLHDSAKeyPair();
    const sig = slhdsaSign(TEST_MESSAGE, kp.secretKey);

    const tampered = new Uint8Array(TEST_MESSAGE);
    tampered[0] ^= 0xff;
    expect(slhdsaVerify(sig, tampered, kp.publicKey)).toBe(false);
  });

  it('rejects verification with wrong public key', () => {
    const kp1 = generateSLHDSAKeyPair();
    const kp2 = generateSLHDSAKeyPair();
    const sig = slhdsaSign(TEST_MESSAGE, kp1.secretKey);
    expect(slhdsaVerify(sig, TEST_MESSAGE, kp2.publicKey)).toBe(false);
  });
});

// ============================================================================
// Hybrid Signatures (Ed25519 + ML-DSA-65)
// ============================================================================

describe('Hybrid Signatures (Ed25519 + ML-DSA-65)', () => {
  it('generates a hybrid key pair', () => {
    const hk = generateHybridKeyPair();
    expect(hk.algorithm).toBe(SIGNATURE_ALGORITHM_HYBRID);
    expect(hk.ed25519.publicKey.length).toBe(32);
    expect(hk.mldsa.publicKey.length).toBe(1952);
  });

  it('signs and verifies a hybrid signature', () => {
    const hk = generateHybridKeyPair();
    const sig = hybridSign(TEST_MESSAGE, hk.ed25519.privateKey, hk.mldsa.secretKey);

    expect(sig.length).toBeGreaterThan(ED25519_SIGNATURE_SIZE);

    const valid = hybridVerify(sig, TEST_MESSAGE, hk.ed25519.publicKey, hk.mldsa.publicKey);
    expect(valid).toBe(true);
  });

  it('rejects if Ed25519 component is corrupted', () => {
    const hk = generateHybridKeyPair();
    const sig = hybridSign(TEST_MESSAGE, hk.ed25519.privateKey, hk.mldsa.secretKey);

    // Corrupt the Ed25519 portion (first 64 bytes)
    const corrupted = new Uint8Array(sig);
    corrupted[0] ^= 0xff;
    expect(hybridVerify(corrupted, TEST_MESSAGE, hk.ed25519.publicKey, hk.mldsa.publicKey)).toBe(false);
  });

  it('rejects if ML-DSA-65 component is corrupted', () => {
    const hk = generateHybridKeyPair();
    const sig = hybridSign(TEST_MESSAGE, hk.ed25519.privateKey, hk.mldsa.secretKey);

    // Corrupt the ML-DSA portion (after byte 64)
    const corrupted = new Uint8Array(sig);
    corrupted[ED25519_SIGNATURE_SIZE + 10] ^= 0xff;
    expect(hybridVerify(corrupted, TEST_MESSAGE, hk.ed25519.publicKey, hk.mldsa.publicKey)).toBe(false);
  });

  it('rejects a truncated signature', () => {
    const hk = generateHybridKeyPair();
    const sig = hybridSign(TEST_MESSAGE, hk.ed25519.privateKey, hk.mldsa.secretKey);

    // Truncate to only the Ed25519 portion
    const truncated = sig.slice(0, ED25519_SIGNATURE_SIZE);
    expect(hybridVerify(truncated, TEST_MESSAGE, hk.ed25519.publicKey, hk.mldsa.publicKey)).toBe(false);
  });

  it('rejects mixed key pairs', () => {
    const hk1 = generateHybridKeyPair();
    const hk2 = generateHybridKeyPair();
    const sig = hybridSign(TEST_MESSAGE, hk1.ed25519.privateKey, hk1.mldsa.secretKey);

    // hk1 Ed25519 + hk2 ML-DSA: should fail because ML-DSA component wont verify
    expect(hybridVerify(sig, TEST_MESSAGE, hk1.ed25519.publicKey, hk2.mldsa.publicKey)).toBe(false);
    // hk2 Ed25519 + hk1 ML-DSA: should fail because Ed25519 component wont verify
    expect(hybridVerify(sig, TEST_MESSAGE, hk2.ed25519.publicKey, hk1.mldsa.publicKey)).toBe(false);
  });
});

// ============================================================================
// Unified Signing Interface
// ============================================================================

describe('Unified signing interface', () => {
  it('signs and verifies with Ed25519 via signData/verifyData', () => {
    const kp = generateEd25519KeyPair();
    const unified = signData(TEST_MESSAGE, kp.privateKey, kp.publicKey, SIGNATURE_ALGORITHM_ED25519);
    expect(unified.algorithm).toBe(SIGNATURE_ALGORITHM_ED25519);
    expect(verifyData(TEST_MESSAGE, unified)).toBe(true);
  });

  it('signs and verifies with ML-DSA-65 via signData/verifyData', () => {
    const kp = generateMLDSAKeyPair();
    const unified = signData(TEST_MESSAGE, kp.secretKey, kp.publicKey, SIGNATURE_ALGORITHM_ML_DSA_65);
    expect(unified.algorithm).toBe(SIGNATURE_ALGORITHM_ML_DSA_65);
    expect(verifyData(TEST_MESSAGE, unified)).toBe(true);
  });

  it('signs and verifies with SLH-DSA via signData/verifyData', () => {
    const kp = generateSLHDSAKeyPair();
    const unified = signData(TEST_MESSAGE, kp.secretKey, kp.publicKey, SIGNATURE_ALGORITHM_SLH_DSA);
    expect(unified.algorithm).toBe(SIGNATURE_ALGORITHM_SLH_DSA);
    expect(verifyData(TEST_MESSAGE, unified)).toBe(true);
  });

  it('signs and verifies hybrid via signDataHybrid/verifyData', () => {
    const hk = generateHybridKeyPair();
    const hybrid = signDataHybrid(TEST_MESSAGE, hk);
    expect(hybrid.algorithm).toBe(SIGNATURE_ALGORITHM_HYBRID);
    expect(verifyData(TEST_MESSAGE, hybrid)).toBe(true);
  });

  it('throws for hybrid via signData (requires separate keys)', () => {
    const kp = generateEd25519KeyPair();
    expect(() => signData(TEST_MESSAGE, kp.privateKey, kp.publicKey, SIGNATURE_ALGORITHM_HYBRID))
      .toThrow(/signDataHybrid/);
  });
});

// ============================================================================
// Constant-Time Comparison
// ============================================================================

describe('constantTimeEqual', () => {
  it('returns true for identical arrays', () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    expect(constantTimeEqual(a, a)).toBe(true);
    expect(constantTimeEqual(a, new Uint8Array([1, 2, 3, 4]))).toBe(true);
  });

  it('returns false for different arrays', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });
});

// ============================================================================
// Fingerprinting
// ============================================================================

describe('Fingerprinting', () => {
  it('computes deterministic fingerprint', () => {
    const kp = generateEd25519KeyPair();
    const fp1 = computeFingerprint(kp.publicKey);
    const fp2 = computeFingerprint(kp.publicKey);
    expect(fp1).toBe(fp2);
    // Format: 8 groups of 4 hex chars separated by spaces
    expect(fp1).toMatch(/^[0-9A-F]{4}( [0-9A-F]{4}){7}$/);
  });

  it('computes hybrid fingerprint', () => {
    const hk = generateHybridKeyPair();
    const fp = computeHybridFingerprint(hk);
    expect(fp).toMatch(/^[0-9A-F]{4}( [0-9A-F]{4}){7}$/);
  });
});

// ============================================================================
// Algorithm Selection
// ============================================================================

describe('Algorithm selection', () => {
  it('selects Ed25519 for realtime', () => {
    expect(selectAlgorithm('realtime')).toBe(SIGNATURE_ALGORITHM_ED25519);
  });
  it('selects ML-DSA-65 for long-term', () => {
    expect(selectAlgorithm('long-term')).toBe(SIGNATURE_ALGORITHM_ML_DSA_65);
  });
  it('selects SLH-DSA for emergency', () => {
    expect(selectAlgorithm('emergency')).toBe(SIGNATURE_ALGORITHM_SLH_DSA);
  });
  it('selects Hybrid for hybrid', () => {
    expect(selectAlgorithm('hybrid')).toBe(SIGNATURE_ALGORITHM_HYBRID);
  });
});

// ============================================================================
// Prekey Identity Generation
// ============================================================================

describe('Prekey Identity', () => {
  it('generates dual identity (Ed25519 + ML-DSA-65)', () => {
    const id = generatePrekeyIdentity();
    expect(id.ed25519.publicKey.length).toBe(32);
    expect(id.ed25519.privateKey.length).toBe(32);
    expect(id.mldsa.publicKey.length).toBe(1952);
    expect(id.mldsa.secretKey.length).toBe(4032);
    expect(id.slhdsa).toBeNull();
  });

  it('generates triple identity with SLH-DSA when requested', () => {
    const id = generatePrekeyIdentity({ includeSlhdsa: true });
    expect(id.slhdsa).not.toBeNull();
    expect(id.slhdsa!.publicKey.length).toBe(32);
    expect(id.slhdsa!.secretKey.length).toBe(64);
  });
});

// ============================================================================
// Signed Prekey Generation and Verification
// ============================================================================

describe('Signed Prekeys', () => {
  it('generates a signed prekey with dual signatures', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 42);

    expect(spk.keyId).toBe(42);
    expect(spk.publicKey.length).toBe(32);
    expect(spk.privateKey.length).toBe(32);
    expect(spk.signature.length).toBe(ED25519_SIGNATURE_SIZE);
    expect(spk.mldsaSignature.length).toBeGreaterThan(3000);
    expect(spk.revoked).toBe(false);
    expect(spk.createdAt).toBeGreaterThan(0);
  });

  it('verifies signed prekey with Ed25519', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    const valid = verifySignedPrekeyEd25519(
      spk.keyId, spk.publicKey, spk.signature, id.ed25519.publicKey
    );
    expect(valid).toBe(true);
  });

  it('verifies signed prekey with ML-DSA-65', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    const valid = verifySignedPrekeyMLDSA(
      spk.keyId, spk.publicKey, spk.mldsaSignature, id.mldsa.publicKey
    );
    expect(valid).toBe(true);
  });

  it('verifies signed prekey with hybrid verification', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    const valid = verifySignedPrekeyHybrid(
      spk.keyId, spk.publicKey,
      spk.signature, spk.mldsaSignature,
      id.ed25519.publicKey, id.mldsa.publicKey
    );
    expect(valid).toBe(true);
  });

  it('rejects prekey signed by wrong identity', () => {
    const id1 = generatePrekeyIdentity();
    const id2 = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id1, 1);

    expect(verifySignedPrekeyEd25519(
      spk.keyId, spk.publicKey, spk.signature, id2.ed25519.publicKey
    )).toBe(false);

    expect(verifySignedPrekeyMLDSA(
      spk.keyId, spk.publicKey, spk.mldsaSignature, id2.mldsa.publicKey
    )).toBe(false);
  });

  it('rejects tampered prekey public key', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    const tampered = new Uint8Array(spk.publicKey);
    tampered[0] ^= 0xff;
    expect(verifySignedPrekeyEd25519(
      spk.keyId, tampered, spk.signature, id.ed25519.publicKey
    )).toBe(false);
  });

  it('rejects tampered keyId', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    expect(verifySignedPrekeyEd25519(
      999, spk.publicKey, spk.signature, id.ed25519.publicKey
    )).toBe(false);
  });
});

// ============================================================================
// Prekey Rotation
// ============================================================================

describe('Prekey Rotation', () => {
  it('detects prekey needing rotation after 7 days', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    // Fresh prekey should not need rotation
    expect(shouldRotatePrekey(spk)).toBe(false);

    // Simulate aged prekey
    const aged = { ...spk, createdAt: Date.now() - PREKEY_ROTATION_INTERVAL_MS - 1 };
    expect(shouldRotatePrekey(aged)).toBe(true);
  });

  it('enforces exact 7-day rotation interval', () => {
    expect(PREKEY_ROTATION_INTERVAL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(PREKEY_ROTATION_INTERVAL_MS).toBe(604800000);
  });

  it('rotates prekey and issues revocation certificate', () => {
    const state = initializePrekeyStoreState();
    const oldKeyId = state.currentSignedPrekey.keyId;

    const rotated = rotateSignedPrekey(state);

    expect(rotated.currentSignedPrekey.keyId).not.toBe(oldKeyId);
    expect(rotated.previousSignedPrekey).not.toBeNull();
    expect(rotated.previousSignedPrekey!.revoked).toBe(true);
    expect(rotated.revocationCertificates.length).toBe(1);
    expect(rotated.revocationCertificates[0]!.revokedKeyId).toBe(oldKeyId);
  });
});

// ============================================================================
// One-Time Prekeys
// ============================================================================

describe('One-Time Prekeys', () => {
  it('generates signed one-time prekeys', () => {
    const id = generatePrekeyIdentity();
    const otps = generateOneTimePrekeys(id, 100, 5);

    expect(otps.length).toBe(5);
    for (let i = 0; i < otps.length; i++) {
      const otp = otps[i]!;
      expect(otp.keyId).toBe(100 + i);
      expect(otp.consumed).toBe(false);
      // Verify each is properly signed
      const valid = verifySignedPrekeyEd25519(
        otp.keyId, otp.publicKey, otp.signature, id.ed25519.publicKey
      );
      expect(valid).toBe(true);
    }
  });

  it('consumes a one-time prekey exactly once', () => {
    const state = initializePrekeyStoreState();
    const firstOTP = state.oneTimePrekeys[0]!;

    // First consumption should succeed
    const result = consumeOneTimePrekey(state, firstOTP.keyId);
    expect(result).not.toBeNull();
    expect(result!.privateKey).toBe(firstOTP.privateKey);

    // Second consumption (on updated state) should fail -- protocol error
    const result2 = consumeOneTimePrekey(result!.updatedState, firstOTP.keyId);
    expect(result2).toBeNull();
  });

  it('returns null for non-existent prekey', () => {
    const state = initializePrekeyStoreState();
    expect(consumeOneTimePrekey(state, 999999)).toBeNull();
  });

  it('replenishes when below threshold', () => {
    const state = initializePrekeyStoreState();

    // Consume all but a few
    let current = state;
    for (let i = 0; i < MAX_ONE_TIME_PREKEYS - ONE_TIME_PREKEY_REPLENISH_THRESHOLD + 1; i++) {
      const otp = current.oneTimePrekeys.find(pk => !pk.consumed);
      if (!otp) break;
      const result = consumeOneTimePrekey(current, otp.keyId);
      if (result) current = result.updatedState;
    }

    const replenished = replenishOneTimePrekeys(current);
    const available = replenished.oneTimePrekeys.filter(pk => !pk.consumed);
    expect(available.length).toBe(MAX_ONE_TIME_PREKEYS);
  });
});

// ============================================================================
// Revocation Certificates
// ============================================================================

describe('Revocation Certificates', () => {
  it('issues and verifies a revocation certificate', () => {
    const id = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id, 1);

    const cert = issueRevocationCertificate(id, spk.keyId, spk.publicKey, REVOCATION_REASON_ROTATED);

    expect(cert.revokedKeyId).toBe(spk.keyId);
    expect(cert.reason).toBe(REVOCATION_REASON_ROTATED);

    const valid = verifyRevocationCertificate(cert, id.ed25519.publicKey, id.mldsa.publicKey);
    expect(valid).toBe(true);
  });

  it('rejects revocation cert from wrong identity', () => {
    const id1 = generatePrekeyIdentity();
    const id2 = generatePrekeyIdentity();
    const spk = generateSignedPrekey(id1, 1);

    const cert = issueRevocationCertificate(id1, spk.keyId, spk.publicKey, REVOCATION_REASON_COMPROMISED);
    expect(verifyRevocationCertificate(cert, id2.ed25519.publicKey, id2.mldsa.publicKey)).toBe(false);
  });

  it('tracks revoked key IDs in store state', () => {
    const state = initializePrekeyStoreState();
    expect(isKeyRevoked(state, state.currentSignedPrekey.keyId)).toBe(false);

    const rotated = rotateSignedPrekey(state);
    expect(isKeyRevoked(rotated, state.currentSignedPrekey.keyId)).toBe(true);
    expect(isKeyRevoked(rotated, rotated.currentSignedPrekey.keyId)).toBe(false);
  });
});

// ============================================================================
// Prekey Bundle Construction and Verification
// ============================================================================

describe('Prekey Bundle', () => {
  it('builds and verifies a prekey bundle', () => {
    const state = initializePrekeyStoreState();
    const bundle = buildPrekeyBundle(state);

    expect(bundle.identityKey).toBe(state.identity.ed25519.publicKey);
    expect(bundle.mldsaIdentityKey).toBe(state.identity.mldsa.publicKey);
    expect(bundle.slhdsaIdentityKey).toBeNull();
    expect(bundle.signedPrekey.keyId).toBe(state.currentSignedPrekey.keyId);
    expect(bundle.oneTimePrekey).toBeDefined();
    expect(bundle.bundleTimestamp).toBeGreaterThan(0);

    expect(verifyPrekeyBundle(bundle)).toBe(true);
  });

  it('includes SLH-DSA identity key when configured', () => {
    const state = initializePrekeyStoreState({ includeSlhdsa: true });
    const bundle = buildPrekeyBundle(state);

    expect(bundle.slhdsaIdentityKey).not.toBeNull();
    expect(bundle.slhdsaIdentityKey!.length).toBe(32);
  });

  it('rejects bundle with tampered signed prekey', () => {
    const state = initializePrekeyStoreState();
    const bundle = buildPrekeyBundle(state);

    // Tamper with the signed prekey public key
    const tampered = {
      ...bundle,
      signedPrekey: {
        ...bundle.signedPrekey,
        publicKey: new Uint8Array(bundle.signedPrekey.publicKey.length),
      },
    };
    expect(verifyPrekeyBundle(tampered)).toBe(false);
  });

  it('rejects bundle with wrong identity key', () => {
    const state = initializePrekeyStoreState();
    const bundle = buildPrekeyBundle(state);

    const otherIdentity = generatePrekeyIdentity();
    const tampered = {
      ...bundle,
      identityKey: otherIdentity.ed25519.publicKey,
    };
    expect(verifyPrekeyBundle(tampered)).toBe(false);
  });
});

// ============================================================================
// Emergency SLH-DSA Prekey Signing
// ============================================================================

describe('Emergency SLH-DSA Prekey Signing', () => {
  it('returns null when no SLH-DSA identity is configured', () => {
    const id = generatePrekeyIdentity();
    const sig = signPrekeyWithSLHDSA(id, 1, new Uint8Array(32));
    expect(sig).toBeNull();
  });

  it('signs and verifies prekey with SLH-DSA', () => {
    const id = generatePrekeyIdentity({ includeSlhdsa: true });
    const spk = generateSignedPrekey(id, 1);

    const slhSig = signPrekeyWithSLHDSA(id, spk.keyId, spk.publicKey);
    expect(slhSig).not.toBeNull();
    expect(slhSig!.length).toBe(SLH_DSA_SIGNATURE_SIZE);

    const valid = verifySignedPrekeySLHDSA(
      spk.keyId, spk.publicKey, slhSig!, id.slhdsa!.publicKey
    );
    expect(valid).toBe(true);
  });

  it('rejects SLH-DSA prekey signature from wrong identity', () => {
    const id1 = generatePrekeyIdentity({ includeSlhdsa: true });
    const id2 = generatePrekeyIdentity({ includeSlhdsa: true });
    const spk = generateSignedPrekey(id1, 1);

    const slhSig = signPrekeyWithSLHDSA(id1, spk.keyId, spk.publicKey);
    expect(slhSig).not.toBeNull();

    expect(verifySignedPrekeySLHDSA(
      spk.keyId, spk.publicKey, slhSig!, id2.slhdsa!.publicKey
    )).toBe(false);
  });
});

// ============================================================================
// Prekey Store Initialization
// ============================================================================

describe('Prekey Store Initialization', () => {
  it('initializes with correct structure', () => {
    const state = initializePrekeyStoreState();

    expect(state.identity.ed25519).toBeDefined();
    expect(state.identity.mldsa).toBeDefined();
    expect(state.identity.slhdsa).toBeNull();
    expect(state.currentSignedPrekey).toBeDefined();
    expect(state.currentSignedPrekey.keyId).toBe(1);
    expect(state.previousSignedPrekey).toBeNull();
    expect(state.oneTimePrekeys.length).toBe(MAX_ONE_TIME_PREKEYS);
    expect(state.revocationCertificates.length).toBe(0);
    expect(state.nextKeyId).toBe(MAX_ONE_TIME_PREKEYS + 2);
  });

  it('all one-time prekeys are properly signed at initialization', () => {
    const state = initializePrekeyStoreState();

    for (const otp of state.oneTimePrekeys) {
      const valid = verifySignedPrekeyEd25519(
        otp.keyId, otp.publicKey, otp.signature, state.identity.ed25519.publicKey
      );
      expect(valid).toBe(true);
    }
  });
});
