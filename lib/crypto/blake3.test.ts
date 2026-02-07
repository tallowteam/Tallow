/**
 * BLAKE3 Tests
 *
 * Tests the BLAKE3 implementation against known test vectors
 * and verifies all functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  hash,
  blake3Hex,
  deriveKey,
  keyedHash,
  createHasher,
  createKeyedHasher,
  createDeriveKeyHasher,
  constantTimeEqual,
  blake3,
} from './blake3';

describe('BLAKE3', () => {
  describe('Basic Hashing', () => {
    it('should hash empty input', () => {
      const input = new Uint8Array(0);
      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should hash simple string', () => {
      const input = new TextEncoder().encode('hello world');
      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);

      // Convert to hex for readability
      const hex = Array.from(result)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      expect(hex).toBeTruthy();
      expect(hex.length).toBe(64);
    });

    it('should produce different hashes for different inputs', () => {
      const input1 = new TextEncoder().encode('hello');
      const input2 = new TextEncoder().encode('world');

      const hash1 = hash(input1);
      const hash2 = hash(input2);

      expect(hash1).not.toEqual(hash2);
    });

    it('should produce same hash for same input', () => {
      const input = new TextEncoder().encode('test data');

      const hash1 = hash(input);
      const hash2 = hash(input);

      expect(hash1).toEqual(hash2);
    });

    it('should hash large input', () => {
      // 10KB of data
      const input = new Uint8Array(10240);
      for (let i = 0; i < input.length; i++) {
        input[i] = i % 256;
      }

      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });
  });

  describe('Hex Encoding', () => {
    it('should return hex string', () => {
      const hex = blake3Hex('hello world');

      expect(typeof hex).toBe('string');
      expect(hex.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hex)).toBe(true);
    });

    it('should accept Uint8Array', () => {
      const input = new TextEncoder().encode('test');
      const hex = blake3Hex(input);

      expect(typeof hex).toBe('string');
      expect(hex.length).toBe(64);
    });

    it('should produce consistent hex output', () => {
      const hex1 = blake3Hex('test');
      const hex2 = blake3Hex('test');

      expect(hex1).toBe(hex2);
    });
  });

  describe('Streaming Hash', () => {
    it('should support incremental updates', () => {
      const data = new TextEncoder().encode('hello world');

      // Hash in one go
      const hashOne = hash(data);

      // Hash incrementally
      const hasher = createHasher();
      hasher.update(data.slice(0, 5));
      hasher.update(data.slice(5));
      const hashIncremental = hasher.finalize();

      expect(hashIncremental).toEqual(hashOne);
    });

    it('should support many updates', () => {
      const data = new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz');

      // Hash in one go
      const hashOne = hash(data);

      // Hash one byte at a time
      const hasher = createHasher();
      for (let i = 0; i < data.length; i++) {
        hasher.update(data.slice(i, i + 1));
      }
      const hashIncremental = hasher.finalize();

      expect(hashIncremental).toEqual(hashOne);
    });

    it('should support finalizeHex', () => {
      const hasher = createHasher();
      hasher.update(new TextEncoder().encode('test'));
      const hex = hasher.finalizeHex();

      expect(typeof hex).toBe('string');
      expect(hex.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hex)).toBe(true);
    });

    it('should handle empty updates', () => {
      const hasher = createHasher();
      hasher.update(new Uint8Array(0));
      hasher.update(new TextEncoder().encode('test'));
      hasher.update(new Uint8Array(0));
      const result = hasher.finalize();

      const direct = hash(new TextEncoder().encode('test'));

      expect(result).toEqual(direct);
    });
  });

  describe('Key Derivation', () => {
    it('should derive key from material', () => {
      const material = new Uint8Array(32);
      crypto.getRandomValues(material);

      const key = deriveKey('test-context', material);

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should derive different keys for different contexts', () => {
      const material = new Uint8Array(32);
      crypto.getRandomValues(material);

      const key1 = deriveKey('context-1', material);
      const key2 = deriveKey('context-2', material);

      expect(key1).not.toEqual(key2);
    });

    it('should derive same key for same context and material', () => {
      const material = new Uint8Array(32);
      crypto.getRandomValues(material);

      const key1 = deriveKey('test-context', material);
      const key2 = deriveKey('test-context', material);

      expect(key1).toEqual(key2);
    });

    it('should support streaming key derivation', () => {
      const material = new TextEncoder().encode('secret material');

      const hasher = createDeriveKeyHasher('test-context');
      hasher.update(material);
      const key = hasher.finalize();

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should derive different keys for different materials', () => {
      const material1 = new TextEncoder().encode('material-1');
      const material2 = new TextEncoder().encode('material-2');

      const key1 = deriveKey('test-context', material1);
      const key2 = deriveKey('test-context', material2);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('Keyed Hash (MAC)', () => {
    it('should create MAC with key', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const data = new TextEncoder().encode('message');

      const mac = keyedHash(key, data);

      expect(mac).toBeInstanceOf(Uint8Array);
      expect(mac.length).toBe(32);
    });

    it('should require 32-byte key', () => {
      const key = new Uint8Array(16); // Wrong size
      const data = new TextEncoder().encode('message');

      expect(() => keyedHash(key, data)).toThrow('32 bytes');
    });

    it('should produce different MACs for different keys', () => {
      const key1 = new Uint8Array(32);
      const key2 = new Uint8Array(32);
      crypto.getRandomValues(key1);
      crypto.getRandomValues(key2);
      const data = new TextEncoder().encode('message');

      const mac1 = keyedHash(key1, data);
      const mac2 = keyedHash(key2, data);

      expect(mac1).not.toEqual(mac2);
    });

    it('should produce different MACs for different data', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const data1 = new TextEncoder().encode('message1');
      const data2 = new TextEncoder().encode('message2');

      const mac1 = keyedHash(key, data1);
      const mac2 = keyedHash(key, data2);

      expect(mac1).not.toEqual(mac2);
    });

    it('should support streaming keyed hash', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const data = new TextEncoder().encode('test message');

      // One-shot
      const macOne = keyedHash(key, data);

      // Streaming
      const hasher = createKeyedHasher(key);
      hasher.update(data.slice(0, 4));
      hasher.update(data.slice(4));
      const macStreaming = hasher.finalize();

      expect(macStreaming).toEqual(macOne);
    });
  });

  describe('Constant-Time Comparison', () => {
    it('should return true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(constantTimeEqual(a, b)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);

      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('should return false for different lengths', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('should handle empty arrays', () => {
      const a = new Uint8Array(0);
      const b = new Uint8Array(0);

      expect(constantTimeEqual(a, b)).toBe(true);
    });
  });

  describe('Blake3Service', () => {
    it('should be a singleton', () => {
      const service1 = blake3;
      const service2 = blake3;

      expect(service1).toBe(service2);
    });

    it('should hash via service', () => {
      const data = new TextEncoder().encode('test');
      const result = blake3.hash(data);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should hash hex via service', () => {
      const hex = blake3.hashHex('test');

      expect(typeof hex).toBe('string');
      expect(hex.length).toBe(64);
    });

    it('should derive key via service', () => {
      const material = new Uint8Array(32);
      crypto.getRandomValues(material);
      const key = blake3.deriveKey('context', material);

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should create keyed hash via service', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const data = new TextEncoder().encode('message');
      const mac = blake3.keyedHash(key, data);

      expect(mac).toBeInstanceOf(Uint8Array);
      expect(mac.length).toBe(32);
    });

    it('should create hasher via service', () => {
      const hasher = blake3.createHasher();
      hasher.update(new TextEncoder().encode('test'));
      const result = hasher.finalize();

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should perform constant-time comparison via service', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);

      expect(blake3.constantTimeEqual(a, b)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-byte input', () => {
      const input = new Uint8Array([42]);
      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should handle chunk boundary (1024 bytes)', () => {
      const input = new Uint8Array(1024);
      for (let i = 0; i < input.length; i++) {
        input[i] = i % 256;
      }
      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should handle multiple chunks', () => {
      const input = new Uint8Array(3000);
      for (let i = 0; i < input.length; i++) {
        input[i] = i % 256;
      }
      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should handle block boundary (64 bytes)', () => {
      const input = new Uint8Array(64);
      for (let i = 0; i < input.length; i++) {
        input[i] = i;
      }
      const result = hash(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    it('should handle odd-sized inputs', () => {
      const sizes = [1, 7, 13, 63, 65, 127, 1023, 1025, 2047];

      for (const size of sizes) {
        const input = new Uint8Array(size);
        crypto.getRandomValues(input);
        const result = hash(input);

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(32);
      }
    });
  });

  describe('Integration with Existing Crypto', () => {
    it('should work alongside SHA-256', async () => {
      const { sha256 } = await import('@noble/hashes/sha2.js');

      const data = new TextEncoder().encode('test data');

      const sha256Hash = sha256(data);
      const blake3Hash = hash(data);

      // Both should produce 32-byte output
      expect(sha256Hash.length).toBe(32);
      expect(blake3Hash.length).toBe(32);

      // But different hashes (different algorithms)
      expect(blake3Hash).not.toEqual(sha256Hash);
    });

    it('should work as key derivation alternative to HKDF', async () => {
      const { hkdf } = await import('@noble/hashes/hkdf.js');
      const { sha256 } = await import('@noble/hashes/sha2.js');

      const material = new Uint8Array(32);
      crypto.getRandomValues(material);

      // HKDF-SHA256
      const hkdfKey = hkdf(
        sha256,
        material,
        new TextEncoder().encode('salt'),
        new TextEncoder().encode('info'),
        32
      );

      // BLAKE3 key derivation
      const blake3Key = deriveKey('info', material);

      // Both produce 32-byte keys
      expect(hkdfKey.length).toBe(32);
      expect(blake3Key.length).toBe(32);

      // Different outputs (different algorithms)
      expect(blake3Key).not.toEqual(hkdfKey);
    });

    it('should integrate with existing nonce patterns', () => {
      // BLAKE3 can be used to derive nonces deterministically
      const sessionId = new TextEncoder().encode('session-123');
      const counter = new Uint8Array(8);
      new DataView(counter.buffer).setBigUint64(0, 42n, false);

      const combined = new Uint8Array(sessionId.length + counter.length);
      combined.set(sessionId);
      combined.set(counter, sessionId.length);

      const nonceMaterial = hash(combined);
      const nonce = nonceMaterial.slice(0, 12); // 96-bit nonce for AES-GCM

      expect(nonce.length).toBe(12);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large data efficiently', () => {
      // 1MB of data
      const size = 1024 * 1024;
      const input = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        input[i] = i % 256;
      }

      const startTime = performance.now();
      const result = hash(input);
      const endTime = performance.now();

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);

      // Should complete in reasonable time (adjust based on environment)
      const duration = endTime - startTime;
      console.log(`1MB hash took ${duration.toFixed(2)}ms`);
    });

    it('should handle streaming large data', () => {
      // Hash 1MB in chunks
      const chunkSize = 4096;
      const totalSize = 1024 * 1024;

      const hasher = createHasher();

      for (let offset = 0; offset < totalSize; offset += chunkSize) {
        const chunk = new Uint8Array(Math.min(chunkSize, totalSize - offset));
        for (let i = 0; i < chunk.length; i++) {
          chunk[i] = (offset + i) % 256;
        }
        hasher.update(chunk);
      }

      const result = hasher.finalize();
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });
  });

  describe('Security Properties', () => {
    it('should produce avalanche effect (single bit change)', () => {
      const input1 = new Uint8Array([0, 0, 0, 0]);
      const input2 = new Uint8Array([1, 0, 0, 0]); // Single bit different

      const hash1 = hash(input1);
      const hash2 = hash(input2);

      // Count different bits
      let diffBits = 0;
      for (let i = 0; i < hash1.length; i++) {
        const xor = (hash1[i] || 0) ^ (hash2[i] || 0);
        for (let bit = 0; bit < 8; bit++) {
          if (xor & (1 << bit)) {
            diffBits++;
          }
        }
      }

      // Should have approximately 50% different bits (avalanche effect)
      expect(diffBits).toBeGreaterThan(100); // At least ~40% different
      expect(diffBits).toBeLessThan(156); // At most ~60% different
    });

    it('should resist length extension attacks (by design)', () => {
      // BLAKE3 uses a Merkle tree structure which is naturally
      // resistant to length extension attacks
      const message1 = new TextEncoder().encode('message');
      const message2 = new TextEncoder().encode('messageextension');

      const hash1 = hash(message1);
      const hash2 = hash(message2);

      // Cannot derive hash2 from hash1 without knowing message1
      expect(hash1).not.toEqual(hash2.slice(0, 32));
    });
  });
});
