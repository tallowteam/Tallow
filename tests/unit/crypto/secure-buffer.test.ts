import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  SecureBuffer,
  zeroMemory,
  zeroMemoryAll,
  destroyAllKeys,
  getSecureBufferStats,
  createSecureBuffer,
  encryptForStorage,
  decryptFromStorage,
  deriveStorageKey,
} from '@/lib/crypto/secure-buffer';

// ============================================================================
// zeroMemory
// ============================================================================

describe('zeroMemory', () => {
  it('zeroes all bytes of a buffer', () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    zeroMemory(buf);
    expect(Array.from(buf).every((b) => b === 0)).toBe(true);
  });

  it('handles empty buffer without throwing', () => {
    const buf = new Uint8Array(0);
    expect(() => zeroMemory(buf)).not.toThrow();
  });

  it('handles null/undefined gracefully', () => {
    expect(() => zeroMemory(null as unknown as Uint8Array)).not.toThrow();
    expect(() => zeroMemory(undefined as unknown as Uint8Array)).not.toThrow();
  });

  it('handles large buffers beyond crypto.getRandomValues chunk limit', () => {
    // 65536 is the getRandomValues limit; use a buffer exceeding it
    const buf = new Uint8Array(70000);
    buf.fill(0xff);
    zeroMemory(buf);
    expect(Array.from(buf).every((b) => b === 0)).toBe(true);
  });

  it('calls crypto.getRandomValues to prevent optimizer elision', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    const buf = new Uint8Array([10, 20, 30]);
    zeroMemory(buf);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('zeroMemoryAll', () => {
  it('zeroes multiple buffers in one call', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5, 6]);
    zeroMemoryAll(a, b);
    expect(Array.from(a).every((x) => x === 0)).toBe(true);
    expect(Array.from(b).every((x) => x === 0)).toBe(true);
  });

  it('skips null and undefined entries', () => {
    const a = new Uint8Array([1, 2, 3]);
    expect(() => zeroMemoryAll(a, null, undefined)).not.toThrow();
    expect(Array.from(a).every((x) => x === 0)).toBe(true);
  });
});

// ============================================================================
// SecureBuffer construction
// ============================================================================

describe('SecureBuffer construction', () => {
  afterEach(() => {
    destroyAllKeys();
  });

  it('SecureBuffer.from copies the data', () => {
    const original = new Uint8Array([10, 20, 30]);
    const sb = SecureBuffer.from(original, 'test-from');
    // Modifying original should not affect SecureBuffer
    original[0] = 99;
    expect(sb.data[0]).toBe(10);
    sb.zero();
  });

  it('SecureBuffer.own takes ownership', () => {
    const data = new Uint8Array([1, 2, 3]);
    const sb = SecureBuffer.own(data, 'test-own');
    expect(sb.data).toBe(data); // same reference
    sb.zero();
  });

  it('SecureBuffer.random creates random bytes', () => {
    const sb = SecureBuffer.random(32, 'random-key');
    expect(sb.length).toBe(32);
    // Extremely unlikely all zeros from random
    const allZero = Array.from(sb.data).every((b) => b === 0);
    expect(allZero).toBe(false);
    sb.zero();
  });

  it('SecureBuffer.alloc creates zero-filled buffer', () => {
    const sb = SecureBuffer.alloc(16, 'alloc-test');
    expect(sb.length).toBe(16);
    expect(Array.from(sb.data).every((b) => b === 0)).toBe(true);
    sb.zero();
  });

  it('rejects empty buffers', () => {
    expect(() => SecureBuffer.own(new Uint8Array(0))).toThrow(RangeError);
  });

  it('rejects non-Uint8Array', () => {
    expect(() => SecureBuffer.own('not a buffer' as unknown as Uint8Array)).toThrow(TypeError);
  });

  it('rejects zero-length in random()', () => {
    expect(() => SecureBuffer.random(0)).toThrow(RangeError);
  });

  it('rejects negative-length in alloc()', () => {
    expect(() => SecureBuffer.alloc(-1)).toThrow(RangeError);
  });
});

// ============================================================================
// SecureBuffer zeroing
// ============================================================================

describe('SecureBuffer zeroing', () => {
  afterEach(() => {
    destroyAllKeys();
  });

  it('zero() wipes the backing buffer', () => {
    const data = new Uint8Array([42, 43, 44, 45]);
    const sb = SecureBuffer.own(data, 'zero-test');
    sb.zero();
    // After zeroing, the original buffer should be zeroed
    expect(Array.from(data).every((b) => b === 0)).toBe(true);
  });

  it('isZeroed is true after zero()', () => {
    const sb = SecureBuffer.random(8, 'zeroed-flag');
    expect(sb.isZeroed).toBe(false);
    sb.zero();
    expect(sb.isZeroed).toBe(true);
  });

  it('zero() is idempotent', () => {
    const sb = SecureBuffer.random(8, 'idempotent');
    sb.zero();
    expect(() => sb.zero()).not.toThrow();
    expect(sb.isZeroed).toBe(true);
  });

  it('accessing data after zero() throws', () => {
    const sb = SecureBuffer.random(8, 'access-after-zero');
    sb.zero();
    expect(() => sb.data).toThrow(/access after zero/);
  });

  it('clone() after zero() throws', () => {
    const sb = SecureBuffer.random(8, 'clone-after-zero');
    sb.zero();
    expect(() => sb.clone()).toThrow(/access after zero/);
  });
});

// ============================================================================
// SecureBuffer use patterns
// ============================================================================

describe('SecureBuffer use patterns', () => {
  afterEach(() => {
    destroyAllKeys();
  });

  it('use() zeros after sync callback', () => {
    const sb = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'use-sync');
    const result = sb.use((data) => data.length);
    expect(result).toBe(3);
    expect(sb.isZeroed).toBe(true);
  });

  it('use() zeros even if callback throws', () => {
    const sb = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'use-throw');
    expect(() =>
      sb.use(() => {
        throw new Error('test error');
      })
    ).toThrow('test error');
    expect(sb.isZeroed).toBe(true);
  });

  it('useAsync() zeros after async callback', async () => {
    const sb = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'use-async');
    const result = await sb.useAsync(async (data) => data.length);
    expect(result).toBe(3);
    expect(sb.isZeroed).toBe(true);
  });

  it('useAsync() zeros even if async callback rejects', async () => {
    const sb = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'use-async-throw');
    await expect(
      sb.useAsync(async () => {
        throw new Error('async error');
      })
    ).rejects.toThrow('async error');
    expect(sb.isZeroed).toBe(true);
  });
});

// ============================================================================
// SecureBuffer clone and equals
// ============================================================================

describe('SecureBuffer clone and equals', () => {
  afterEach(() => {
    destroyAllKeys();
  });

  it('clone() creates an independent copy', () => {
    const sb = SecureBuffer.from(new Uint8Array([10, 20, 30]), 'original');
    const clone = sb.clone('cloned');
    expect(clone.data).not.toBe(sb.data);
    expect(Array.from(clone.data)).toEqual([10, 20, 30]);
    // Zeroing original does not affect clone
    sb.zero();
    expect(clone.data[0]).toBe(10);
    clone.zero();
  });

  it('equals() performs constant-time comparison', () => {
    const sb1 = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'eq1');
    const sb2 = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'eq2');
    const sb3 = SecureBuffer.from(new Uint8Array([4, 5, 6]), 'eq3');

    expect(sb1.equals(sb2)).toBe(true);
    expect(sb1.equals(sb3)).toBe(false);

    // Also works with raw Uint8Array
    expect(sb1.equals(new Uint8Array([1, 2, 3]))).toBe(true);

    sb1.zero();
    sb2.zero();
    sb3.zero();
  });

  it('equals() returns false for different lengths', () => {
    const sb1 = SecureBuffer.from(new Uint8Array([1, 2]), 'short');
    const sb2 = SecureBuffer.from(new Uint8Array([1, 2, 3]), 'long');
    expect(sb1.equals(sb2)).toBe(false);
    sb1.zero();
    sb2.zero();
  });
});

// ============================================================================
// Global registry and destroyAllKeys
// ============================================================================

describe('destroyAllKeys', () => {
  beforeEach(() => {
    destroyAllKeys(); // clean slate
  });

  it('zeros all live SecureBuffers', () => {
    const data1 = new Uint8Array([1, 2, 3]);
    const data2 = new Uint8Array([4, 5, 6]);
    const sb1 = SecureBuffer.own(data1, 'key1');
    const sb2 = SecureBuffer.own(data2, 'key2');

    const count = destroyAllKeys();
    expect(count).toBe(2);
    expect(sb1.isZeroed).toBe(true);
    expect(sb2.isZeroed).toBe(true);
    expect(Array.from(data1).every((b) => b === 0)).toBe(true);
    expect(Array.from(data2).every((b) => b === 0)).toBe(true);
  });

  it('skips already-zeroed buffers', () => {
    const sb = SecureBuffer.random(8, 'already-zeroed');
    sb.zero();
    const count = destroyAllKeys();
    expect(count).toBe(0);
  });

  it('returns 0 when no buffers exist', () => {
    const count = destroyAllKeys();
    expect(count).toBe(0);
  });
});

// ============================================================================
// getSecureBufferStats
// ============================================================================

describe('getSecureBufferStats', () => {
  beforeEach(() => {
    destroyAllKeys();
  });

  it('reports live buffer count and total bytes', () => {
    const sb1 = SecureBuffer.random(32, 'stat-key-1');
    const sb2 = SecureBuffer.random(64, 'stat-key-2');

    const stats = getSecureBufferStats();
    expect(stats.liveCount).toBe(2);
    expect(stats.totalBytes).toBe(96);
    expect(stats.labels).toContain('stat-key-1');
    expect(stats.labels).toContain('stat-key-2');

    sb1.zero();
    sb2.zero();
  });

  it('excludes zeroed buffers from stats', () => {
    const sb = SecureBuffer.random(16, 'zeroed-stat');
    sb.zero();

    const stats = getSecureBufferStats();
    expect(stats.liveCount).toBe(0);
    expect(stats.totalBytes).toBe(0);
  });
});

// ============================================================================
// createSecureBuffer convenience
// ============================================================================

describe('createSecureBuffer', () => {
  afterEach(() => {
    destroyAllKeys();
  });

  it('creates a SecureBuffer via the convenience function', () => {
    const data = new Uint8Array([7, 8, 9]);
    const sb = createSecureBuffer(data, 'convenience');
    expect(sb.data).toBe(data);
    expect(sb.label).toBe('convenience');
    sb.zero();
  });
});

// ============================================================================
// IndexedDB encrypted storage helpers
// ============================================================================

describe('IndexedDB encrypted storage', () => {
  it('encrypt-then-decrypt round-trips correctly', async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const storageKey = await deriveStorageKey(secret, salt);

    const keyMaterial = new Uint8Array([10, 20, 30, 40, 50]);
    const { iv, ciphertext } = await encryptForStorage(keyMaterial, storageKey);

    // Ciphertext should differ from plaintext
    expect(ciphertext.length).toBeGreaterThan(keyMaterial.length); // includes auth tag

    const recovered = await decryptFromStorage(iv, ciphertext, storageKey, 'recovered');
    expect(Array.from(recovered.data)).toEqual([10, 20, 30, 40, 50]);
    recovered.zero();
  });

  it('decryption fails with wrong key', async () => {
    const secret1 = crypto.getRandomValues(new Uint8Array(32));
    const secret2 = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(32));

    const key1 = await deriveStorageKey(secret1, salt);
    const key2 = await deriveStorageKey(secret2, salt);

    const keyMaterial = new Uint8Array([1, 2, 3]);
    const { iv, ciphertext } = await encryptForStorage(keyMaterial, key1);

    await expect(decryptFromStorage(iv, ciphertext, key2, 'wrong-key')).rejects.toThrow();
  });

  it('deriveStorageKey produces non-extractable key', async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const key = await deriveStorageKey(secret, salt);

    // Non-extractable means exportKey should fail
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });
});

// ============================================================================
// SecureBuffer preserves label and length after zeroing
// ============================================================================

describe('SecureBuffer metadata after zeroing', () => {
  afterEach(() => {
    destroyAllKeys();
  });

  it('preserves length and label after zero()', () => {
    const sb = SecureBuffer.random(32, 'metadata-test');
    sb.zero();
    expect(sb.length).toBe(32);
    expect(sb.label).toBe('metadata-test');
  });

  it('createdAt is a reasonable timestamp', () => {
    const before = Date.now();
    const sb = SecureBuffer.random(8, 'timestamp');
    const after = Date.now();
    expect(sb.createdAt).toBeGreaterThanOrEqual(before);
    expect(sb.createdAt).toBeLessThanOrEqual(after);
    sb.zero();
  });
});
