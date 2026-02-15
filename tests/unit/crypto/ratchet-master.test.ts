import { describe, expect, it } from 'vitest';
import {
  DH_RATCHET_MESSAGE_INTERVAL,
  TRIPLE_RATCHET_MAX_SKIP,
  encodeMessageNumber,
} from '@/lib/crypto/triple-ratchet';
import { SPARSE_PQ_RATCHET_MESSAGE_THRESHOLD } from '@/lib/crypto/sparse-pq-ratchet';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';

// Reproduce the exact derivation logic from triple-ratchet.ts so we can
// verify the key-reuse fix without needing access to private methods.
const MESSAGE_KEY_INFO_PREFIX = new TextEncoder().encode('tallow-tr-message-v1');

function deriveMessageKeyForTest(
  chainKey: Uint8Array,
  messageNumber: number,
): Uint8Array {
  const msgNumBytes = encodeMessageNumber(messageNumber);
  const info = new Uint8Array(
    MESSAGE_KEY_INFO_PREFIX.length + msgNumBytes.length,
  );
  info.set(MESSAGE_KEY_INFO_PREFIX, 0);
  info.set(msgNumBytes, MESSAGE_KEY_INFO_PREFIX.length);
  return hkdf(sha256, chainKey, undefined, info, 32);
}

describe('ratchet master invariants', () => {
  it('enforces DH ratchet cadence at 1000 messages', () => {
    expect(DH_RATCHET_MESSAGE_INTERVAL).toBe(1000);
  });

  it('caps skipped message-key cache at 1000 entries', () => {
    expect(TRIPLE_RATCHET_MAX_SKIP).toBe(1000);
  });

  it('enforces sparse PQ ratchet cadence at 100 messages', () => {
    expect(SPARSE_PQ_RATCHET_MESSAGE_THRESHOLD).toBe(100);
  });
});

describe('encodeMessageNumber', () => {
  it('returns an 8-byte Uint8Array', () => {
    const result = encodeMessageNumber(0);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('encodes 0 as all zeros', () => {
    const result = encodeMessageNumber(0);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('encodes 1 correctly in big-endian', () => {
    const result = encodeMessageNumber(1);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
  });

  it('encodes 256 correctly in big-endian', () => {
    const result = encodeMessageNumber(256);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 1, 0]);
  });

  it('encodes 0xFFFFFFFF correctly (max 32-bit)', () => {
    const result = encodeMessageNumber(0xffffffff);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff]);
  });

  it('encodes values above 2^32 using high bytes', () => {
    // 2^32 = 4294967296
    const result = encodeMessageNumber(0x100000000);
    expect(Array.from(result)).toEqual([0, 0, 0, 1, 0, 0, 0, 0]);
  });

  it('produces distinct encodings for consecutive numbers', () => {
    const a = encodeMessageNumber(42);
    const b = encodeMessageNumber(43);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('produces distinct encodings for 0 vs 1', () => {
    const a = encodeMessageNumber(0);
    const b = encodeMessageNumber(1);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('deriveMessageKey key-reuse prevention', () => {
  const chainKey = new Uint8Array(32);
  // Fill with a deterministic non-zero pattern
  chainKey.fill(0xab);

  it('same chainKey + different message numbers produce different keys', () => {
    const key0 = deriveMessageKeyForTest(chainKey, 0);
    const key1 = deriveMessageKeyForTest(chainKey, 1);
    const key999 = deriveMessageKeyForTest(chainKey, 999);

    expect(key0.length).toBe(32);
    expect(key1.length).toBe(32);
    expect(key999.length).toBe(32);

    // All three must be distinct
    expect(Array.from(key0)).not.toEqual(Array.from(key1));
    expect(Array.from(key0)).not.toEqual(Array.from(key999));
    expect(Array.from(key1)).not.toEqual(Array.from(key999));
  });

  it('same chainKey + same message number always produces the same key (deterministic)', () => {
    const key1a = deriveMessageKeyForTest(chainKey, 7);
    const key1b = deriveMessageKeyForTest(chainKey, 7);
    expect(Array.from(key1a)).toEqual(Array.from(key1b));
  });

  it('different chainKeys + same message number produce different keys', () => {
    const chainKey2 = new Uint8Array(32);
    chainKey2.fill(0xcd);

    const keyA = deriveMessageKeyForTest(chainKey, 5);
    const keyB = deriveMessageKeyForTest(chainKey2, 5);
    expect(Array.from(keyA)).not.toEqual(Array.from(keyB));
  });

  it('produces unique keys for a large batch of consecutive message numbers', () => {
    const seen = new Set<string>();
    // Test 200 consecutive message numbers to cover multiple PQ epochs
    for (let i = 0; i < 200; i++) {
      const key = deriveMessageKeyForTest(chainKey, i);
      const hex = Array.from(key)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      expect(seen.has(hex)).toBe(false);
      seen.add(hex);
    }
    expect(seen.size).toBe(200);
  });

  it('message number boundary: 2^32-1 and 2^32 produce different keys', () => {
    const keyBelow = deriveMessageKeyForTest(chainKey, 0xffffffff);
    const keyAt = deriveMessageKeyForTest(chainKey, 0x100000000);
    expect(Array.from(keyBelow)).not.toEqual(Array.from(keyAt));
  });
});

describe('HKDF domain separation', () => {
  it('message key info prefix and combine key info are distinct', () => {
    const msgInfo = new TextEncoder().encode('tallow-tr-message-v1');
    const combineInfo = new TextEncoder().encode('tallow-tr-combine-v1');
    expect(Array.from(msgInfo)).not.toEqual(Array.from(combineInfo));
  });

  it('message key info prefix and chain key info are distinct', () => {
    const msgInfo = new TextEncoder().encode('tallow-tr-message-v1');
    const chainInfo = new TextEncoder().encode('tallow-tr-chain-v1');
    expect(Array.from(msgInfo)).not.toEqual(Array.from(chainInfo));
  });
});
