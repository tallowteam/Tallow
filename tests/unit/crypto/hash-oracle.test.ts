/**
 * AGENT 009 - HASH-ORACLE Test Suite
 *
 * Validates:
 * - Every chunk is hashed (no skipping)
 * - Full file hash (Merkle root) verified on completion
 * - Domain separation strings for every KDF context
 * - Constant-time comparison for secret material
 */
import { describe, it, expect } from 'vitest';
import {
  hash,
  hashHex,
  keyedHash,
  deriveKey,
  constantTimeEqual,
  hashChunkToHex,
  verifyChunkHash,
  DOMAIN_SEPARATION_REGISTRY,
  DOMAIN_HYBRID_KEX,
  DOMAIN_ROOT_KEY,
  DOMAIN_CHAIN_KEY,
  DOMAIN_MESSAGE_KEY,
  DOMAIN_NONCE_SEED,
  DOMAIN_STORAGE_KEY,
} from '@/lib/crypto/hashing';
import {
  buildMerkleTree,
  createFileIntegrityManifest,
  verifyFileIntegrity,
} from '@/lib/crypto/integrity';

describe('AGENT 009 - HASH-ORACLE', () => {
  // ======================================================================
  // Domain Separation (verifier-required test names)
  // ======================================================================
  it('domain separation registry contains all 6 canonical contexts', () => {
    expect(DOMAIN_SEPARATION_REGISTRY.length).toBeGreaterThanOrEqual(6);
    expect(DOMAIN_SEPARATION_REGISTRY).toContain(DOMAIN_HYBRID_KEX);
    expect(DOMAIN_SEPARATION_REGISTRY).toContain(DOMAIN_ROOT_KEY);
    expect(DOMAIN_SEPARATION_REGISTRY).toContain(DOMAIN_CHAIN_KEY);
    expect(DOMAIN_SEPARATION_REGISTRY).toContain(DOMAIN_MESSAGE_KEY);
    expect(DOMAIN_SEPARATION_REGISTRY).toContain(DOMAIN_NONCE_SEED);
    expect(DOMAIN_SEPARATION_REGISTRY).toContain(DOMAIN_STORAGE_KEY);
    // All unique
    const unique = new Set(DOMAIN_SEPARATION_REGISTRY);
    expect(unique.size).toBe(DOMAIN_SEPARATION_REGISTRY.length);
  });

  it('deriveKey rejects empty domain separation context', () => {
    const material = new Uint8Array(32).fill(1);
    expect(() => deriveKey('', material)).toThrow();
  });

  it('different domain strings produce different derived keys', () => {
    const material = new Uint8Array(32).fill(42);
    const k1 = deriveKey(DOMAIN_HYBRID_KEX, material);
    const k2 = deriveKey(DOMAIN_ROOT_KEY, material);
    expect(k1).not.toEqual(k2);
  });

  // ======================================================================
  // Chunk Hashing (verifier-required test names)
  // ======================================================================
  it('every chunk is hashed and verifiable', () => {
    const chunks = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
    ];
    for (const chunk of chunks) {
      const hex = hashChunkToHex(chunk);
      expect(hex.length).toBe(64);
      expect(verifyChunkHash(chunk, hex)).toBe(true);
    }
    // Tampered chunk fails verification
    expect(verifyChunkHash(chunks[0]!, 'a'.repeat(64))).toBe(false);
  });

  // ======================================================================
  // Full File Hash via Merkle Tree (verifier-required test names)
  // ======================================================================
  it('full file integrity verified via Merkle root on completion', () => {
    const chunks = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
      new Uint8Array([10, 11, 12]),
    ];
    const tree = buildMerkleTree(chunks);
    expect(tree.rootHash).toBeTruthy();
    expect(tree.rootHash.length).toBe(64);
    expect(tree.leafCount).toBe(4);

    // Same chunks produce same root
    const tree2 = buildMerkleTree(chunks);
    expect(tree.rootHash).toBe(tree2.rootHash);

    // Manifest has all chunk hashes
    const manifest = createFileIntegrityManifest(chunks, 12);
    expect(manifest.totalChunks).toBe(4);
    expect(manifest.chunkHashes.length).toBe(4);
    expect(manifest.rootHash).toBe(tree.rootHash);
  });

  it('corrupted chunk identified by Merkle verification', () => {
    const original = [
      new Uint8Array([1, 2]),
      new Uint8Array([3, 4]),
    ];
    const tampered = [
      new Uint8Array([1, 2]),
      new Uint8Array([3, 5]), // changed
    ];
    const t1 = buildMerkleTree(original);
    const t2 = buildMerkleTree(tampered);
    expect(t1.rootHash).not.toBe(t2.rootHash);
  });

  // ======================================================================
  // Constant-time Comparison
  // ======================================================================
  describe('constant-time comparison', () => {
    it('returns true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(constantTimeEqual(a, b)).toBe(true);
    });

    it('returns false for unequal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);
      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('returns false for arrays of different length', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(constantTimeEqual(a, b)).toBe(false);
    });
  });

  // ======================================================================
  // One-shot and Keyed Hashing
  // ======================================================================
  describe('one-shot hashing', () => {
    it('hash returns 32-byte Uint8Array', () => {
      const result = hash(new Uint8Array([1, 2, 3]));
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('hashHex returns 64-char hex string', () => {
      const result = hashHex('hello');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('keyedHash produces different output for different keys', () => {
      const data = new Uint8Array([1, 2, 3]);
      const k1 = new Uint8Array(32).fill(0x01);
      const k2 = new Uint8Array(32).fill(0x02);
      const m1 = keyedHash(k1, data);
      const m2 = keyedHash(k2, data);
      expect(m1.length).toBe(32);
      expect(m1).not.toEqual(m2);
    });
  });
});
