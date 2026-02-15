/**
 * BLAKE3 Hash Function Unit Tests
 *
 * Tests the BLAKE3 cryptographic hash implementation including:
 * - Basic hashing with consistent output
 * - Keyed hashing for MAC operations
 * - Key derivation with context
 * - Streaming hasher updates
 * - Hex encoding
 */

import { describe, it, expect } from 'vitest';
import {
  createHasher,
  createKeyedHasher,
  createDeriveKeyHasher,
  hash,
  blake3Hex,
  deriveKey,
  keyedHash,
  constantTimeEqual,
  Blake3Service,
} from '@/lib/crypto/blake3';

const OFFICIAL_BLAKE3_VECTORS: ReadonlyArray<{
  input: string;
  expectedHex: string;
}> = [
  {
    input: '',
    expectedHex: 'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
  },
  {
    input: 'abc',
    expectedHex: '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85',
  },
  {
    input: 'hello world',
    expectedHex: 'd74981efa70a0c880b8d8c1985d075dbcbf679b99a5f9914e5aaf96b831a9e24',
  },
];

describe('BLAKE3 Hash Function', () => {
  const testData = new TextEncoder().encode('Hello, BLAKE3!');
  const testKey = new Uint8Array(32).fill(0x42);

  describe('basic hashing', () => {
    it('hashes data consistently', () => {
      const hash1 = hash(testData);
      const hash2 = hash(testData);

      expect(hash1).toEqual(hash2);
      expect(hash1).toBeInstanceOf(Uint8Array);
      expect(hash1.length).toBe(32); // 256 bits
    });

    it('produces different hashes for different data', () => {
      const data1 = new TextEncoder().encode('data1');
      const data2 = new TextEncoder().encode('data2');

      const hash1 = hash(data1);
      const hash2 = hash(data2);

      expect(hash1).not.toEqual(hash2);
    });

    it('hashes empty data', () => {
      const empty = new Uint8Array(0);
      const result = hash(empty);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('hashes large data', () => {
      const large = new Uint8Array(10000).fill(0xAA);
      const result = hash(large);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('matches official BLAKE3 test vectors', () => {
      for (const vector of OFFICIAL_BLAKE3_VECTORS) {
        expect(blake3Hex(vector.input)).toBe(vector.expectedHex);
      }
    });
  });

  describe('hex encoding', () => {
    it('encodes hash as hex string', () => {
      const hex = blake3Hex(testData);

      expect(hex).toMatch(/^[0-9a-f]{64}$/);
      expect(hex.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('handles string input', () => {
      const hex = blake3Hex('test string');

      expect(hex).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces consistent hex output', () => {
      const hex1 = blake3Hex('test');
      const hex2 = blake3Hex('test');

      expect(hex1).toBe(hex2);
    });

    it('produces different hex for different inputs', () => {
      const hex1 = blake3Hex('input1');
      const hex2 = blake3Hex('input2');

      expect(hex1).not.toBe(hex2);
    });
  });

  describe('keyed hashing', () => {
    it('creates keyed hash (MAC)', () => {
      const mac = keyedHash(testKey, testData);

      expect(mac).toBeInstanceOf(Uint8Array);
      expect(mac.length).toBe(32);
    });

    it('produces different MACs with different keys', () => {
      const key1 = new Uint8Array(32).fill(0x01);
      const key2 = new Uint8Array(32).fill(0x02);

      const mac1 = keyedHash(key1, testData);
      const mac2 = keyedHash(key2, testData);

      expect(mac1).not.toEqual(mac2);
    });

    it('produces different MACs with different data', () => {
      const data1 = new TextEncoder().encode('data1');
      const data2 = new TextEncoder().encode('data2');

      const mac1 = keyedHash(testKey, data1);
      const mac2 = keyedHash(testKey, data2);

      expect(mac1).not.toEqual(mac2);
    });

    it('produces consistent MACs', () => {
      const mac1 = keyedHash(testKey, testData);
      const mac2 = keyedHash(testKey, testData);

      expect(mac1).toEqual(mac2);
    });
  });

  describe('key derivation', () => {
    it('derives key from material with context', () => {
      const material = new Uint8Array(32).fill(0xAB);
      const context = 'test-context-v1';

      const derived = deriveKey(context, material);

      expect(derived).toBeInstanceOf(Uint8Array);
      expect(derived.length).toBe(32);
    });

    it('produces different keys for different contexts', () => {
      const material = new Uint8Array(32).fill(0xAB);

      const key1 = deriveKey('context-a', material);
      const key2 = deriveKey('context-b', material);

      expect(key1).not.toEqual(key2);
    });

    it('produces different keys for different material', () => {
      const material1 = new Uint8Array(32).fill(0x01);
      const material2 = new Uint8Array(32).fill(0x02);
      const context = 'same-context';

      const key1 = deriveKey(context, material1);
      const key2 = deriveKey(context, material2);

      expect(key1).not.toEqual(key2);
    });

    it('produces consistent derived keys', () => {
      const material = new Uint8Array(32).fill(0xAB);
      const context = 'test-context';

      const key1 = deriveKey(context, material);
      const key2 = deriveKey(context, material);

      expect(key1).toEqual(key2);
    });
  });

  describe('streaming hasher', () => {
    it('creates streaming hasher', () => {
      const hasher = createHasher();
      expect(hasher).toBeDefined();
      expect(hasher.update).toBeInstanceOf(Function);
      expect(hasher.finalize).toBeInstanceOf(Function);
    });

    it('updates hasher with data chunks', () => {
      const hasher = createHasher();
      const chunk1 = new TextEncoder().encode('Hello, ');
      const chunk2 = new TextEncoder().encode('World!');

      hasher.update(chunk1);
      hasher.update(chunk2);
      const result = hasher.finalize();

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('produces same hash as one-shot', () => {
      const data = new TextEncoder().encode('Test data');

      const oneShot = hash(data);

      const hasher = createHasher();
      hasher.update(data);
      const streaming = hasher.finalize();

      expect(streaming).toEqual(oneShot);
    });

    it('chains update calls', () => {
      const hasher = createHasher();
      const data1 = new TextEncoder().encode('part1');
      const data2 = new TextEncoder().encode('part2');

      const result = hasher.update(data1).update(data2).finalize();

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('finalizes as hex', () => {
      const hasher = createHasher();
      hasher.update(testData);
      const hex = hasher.finalizeHex();

      expect(hex).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('keyed hasher', () => {
    it('creates keyed hasher', () => {
      const hasher = createKeyedHasher(testKey);
      expect(hasher).toBeDefined();
    });

    it('produces consistent keyed hash', () => {
      const hasher1 = createKeyedHasher(testKey);
      hasher1.update(testData);
      const mac1 = hasher1.finalize();

      const hasher2 = createKeyedHasher(testKey);
      hasher2.update(testData);
      const mac2 = hasher2.finalize();

      expect(mac1).toEqual(mac2);
    });
  });

  describe('derive-key hasher', () => {
    it('creates derive-key hasher', () => {
      const context = 'test-context';
      const hasher = createDeriveKeyHasher(context);
      expect(hasher).toBeDefined();
    });

    it('derives consistent key', () => {
      const context = 'test-context';
      const material = new Uint8Array(32).fill(0xCD);

      const hasher1 = createDeriveKeyHasher(context);
      hasher1.update(material);
      const key1 = hasher1.finalize();

      const hasher2 = createDeriveKeyHasher(context);
      hasher2.update(material);
      const key2 = hasher2.finalize();

      expect(key1).toEqual(key2);
    });
  });

  describe('constant-time comparison', () => {
    it('returns true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(constantTimeEqual(a, b)).toBe(true);
    });

    it('returns false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);

      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('returns false for different lengths', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('handles empty arrays', () => {
      const a = new Uint8Array(0);
      const b = new Uint8Array(0);

      expect(constantTimeEqual(a, b)).toBe(true);
    });
  });

  describe('BLAKE3 Service singleton', () => {
    it('provides singleton instance', () => {
      const service1 = Blake3Service.getInstance();
      const service2 = Blake3Service.getInstance();

      expect(service1).toBe(service2);
    });

    it('exposes hash method', () => {
      const service = Blake3Service.getInstance();
      const result = service.hash(testData);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('exposes hashHex method', () => {
      const service = Blake3Service.getInstance();
      const hex = service.hashHex(testData);

      expect(hex).toMatch(/^[0-9a-f]{64}$/);
    });

    it('exposes deriveKey method', () => {
      const service = Blake3Service.getInstance();
      const key = service.deriveKey('context', testData);

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('exposes keyedHash method', () => {
      const service = Blake3Service.getInstance();
      const mac = service.keyedHash(testKey, testData);

      expect(mac).toBeInstanceOf(Uint8Array);
      expect(mac.length).toBe(32);
    });

    it('exposes createHasher method', () => {
      const service = Blake3Service.getInstance();
      const hasher = service.createHasher();

      expect(hasher).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles single byte input', () => {
      const single = new Uint8Array([0x42]);
      const result = hash(single);

      expect(result.length).toBe(32);
    });

    it('handles all zeros', () => {
      const zeros = new Uint8Array(1024);
      const result = hash(zeros);

      expect(result.length).toBe(32);
    });

    it('handles all ones', () => {
      const ones = new Uint8Array(1024).fill(0xFF);
      const result = hash(ones);

      expect(result.length).toBe(32);
    });
  });
});
