import { describe, it, expect } from 'vitest';
import {
  secureWipeBuffer,
  secureWipeString,
  secureWipeBuffers,
  secureWipeObject,
  SecureWrapper,
  secureWipeChunk,
  compareAndWipe,
  memoryWiper,
} from '../../../lib/security/memory-wiper';

describe('Memory Wiper', () => {
  describe('secureWipeBuffer', () => {
    it('should wipe a buffer with zeros', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      secureWipeBuffer(buffer);

      expect(buffer.every((byte) => byte === 0)).toBe(true);
    });

    it('should handle empty buffer', () => {
      const buffer = new Uint8Array(0);
      expect(() => secureWipeBuffer(buffer)).not.toThrow();
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => secureWipeBuffer(null as any)).not.toThrow();
      expect(() => secureWipeBuffer(undefined as any)).not.toThrow();
    });

    it('should wipe large buffers', () => {
      const buffer = new Uint8Array(1024 * 1024); // 1MB
      buffer.fill(0xff);

      secureWipeBuffer(buffer);

      expect(buffer.every((byte) => byte === 0)).toBe(true);
    });

    it('should perform multiple passes', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      secureWipeBuffer(buffer, 5);

      expect(buffer.every((byte) => byte === 0)).toBe(true);
    });
  });

  describe('secureWipeString', () => {
    it('should wipe string representation', () => {
      const str = 'sensitive-password-123';
      const buffer = secureWipeString(str);

      expect(buffer.every((byte) => byte === 0)).toBe(true);
    });

    it('should handle empty string', () => {
      const buffer = secureWipeString('');
      expect(buffer.length).toBe(0);
    });

    it('should handle unicode strings', () => {
      const str = '🔐 Secret Key 🔑';
      const buffer = secureWipeString(str);

      expect(buffer.every((byte) => byte === 0)).toBe(true);
    });
  });

  describe('secureWipeBuffers', () => {
    it('should wipe multiple buffers', () => {
      const buffers = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9]),
      ];

      secureWipeBuffers(buffers);

      for (const buffer of buffers) {
        expect(buffer.every((byte) => byte === 0)).toBe(true);
      }
    });

    it('should handle empty array', () => {
      expect(() => secureWipeBuffers([])).not.toThrow();
    });

    it('should handle mixed types gracefully', () => {
      const buffers = [
        new Uint8Array([1, 2, 3]),
        null as any,
        new Uint8Array([4, 5, 6]),
      ];

      expect(() => secureWipeBuffers(buffers)).not.toThrow();
    });
  });

  describe('secureWipeObject', () => {
    it('should wipe all Uint8Array properties', () => {
      const obj = {
        key1: new Uint8Array([1, 2, 3]),
        key2: new Uint8Array([4, 5, 6]),
        nonSensitive: 'public data',
      };

      secureWipeObject(obj);

      expect(obj.key1.every((byte) => byte === 0)).toBe(true);
      expect(obj.key2.every((byte) => byte === 0)).toBe(true);
      expect(obj.nonSensitive).toBe('public data');
    });

    it('should handle nested objects', () => {
      const obj = {
        level1: {
          level2: {
            secret: new Uint8Array([1, 2, 3]),
          },
        },
      };

      secureWipeObject(obj);

      expect(obj.level1.level2.secret.every((byte) => byte === 0)).toBe(true);
    });

    it('should handle arrays of buffers', () => {
      const obj = {
        keys: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
      };

      secureWipeObject(obj);

      for (const key of obj.keys) {
        expect(key.every((byte) => byte === 0)).toBe(true);
      }
    });
  });

  describe('SecureWrapper', () => {
    it('should provide access to wrapped data', () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = new SecureWrapper(data);

      expect(wrapper.data).toBe(data);
      expect(wrapper.isDisposed).toBe(false);
    });

    it('should wipe data on dispose', () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = new SecureWrapper(data);

      wrapper.dispose();

      expect(data.every((byte) => byte === 0)).toBe(true);
      expect(wrapper.isDisposed).toBe(true);
    });

    it('should throw when accessing disposed data', () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = new SecureWrapper(data);

      wrapper.dispose();

      expect(() => wrapper.data).toThrow('Data has been disposed');
    });

    it('should auto-dispose with use()', async () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = new SecureWrapper(data);

      const sum = await wrapper.use(async (d) => {
        return d.reduce((acc, val) => acc + val, 0);
      });

      expect(sum).toBe(6);
      expect(data.every((byte) => byte === 0)).toBe(true);
      expect(wrapper.isDisposed).toBe(true);
    });

    it('should auto-dispose with useSync()', () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = new SecureWrapper(data);

      const sum = wrapper.useSync((d) => {
        return d.reduce((acc, val) => acc + val, 0);
      });

      expect(sum).toBe(6);
      expect(data.every((byte) => byte === 0)).toBe(true);
      expect(wrapper.isDisposed).toBe(true);
    });

    it('should handle exceptions in use()', async () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = new SecureWrapper(data);

      await expect(
        wrapper.use(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      // Data should still be wiped
      expect(wrapper.isDisposed).toBe(true);
    });
  });

  describe('secureWipeChunk', () => {
    it('should wipe chunk data, nonce, and hash', () => {
      const chunk = {
        data: new Uint8Array([1, 2, 3]),
        nonce: new Uint8Array([4, 5, 6]),
        hash: new Uint8Array([7, 8, 9]),
        index: 0,
      };

      secureWipeChunk(chunk);

      expect(chunk.data.every((byte) => byte === 0)).toBe(true);
      expect(chunk.nonce.every((byte) => byte === 0)).toBe(true);
      expect(chunk.hash.every((byte) => byte === 0)).toBe(true);
    });

    it('should handle partial chunk data', () => {
      const chunk = {
        data: new Uint8Array([1, 2, 3]),
      };

      expect(() => secureWipeChunk(chunk)).not.toThrow();
    });
  });

  describe('compareAndWipe', () => {
    it('should compare buffers and wipe them', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);

      const result = compareAndWipe(a, b);

      expect(result).toBe(true);
      expect(a.every((byte) => byte === 0)).toBe(true);
      expect(b.every((byte) => byte === 0)).toBe(true);
    });

    it('should detect differences', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 4]);

      const result = compareAndWipe(a, b);

      expect(result).toBe(false);
      expect(a.every((byte) => byte === 0)).toBe(true);
      expect(b.every((byte) => byte === 0)).toBe(true);
    });

    it('should not wipe if wipeAfter is false', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);

      const result = compareAndWipe(a, b, false);

      expect(result).toBe(true);
      expect(a[0]).toBe(1);
      expect(b[0]).toBe(1);
    });
  });

  describe('memoryWiper namespace', () => {
    it('should export all wiper functions', () => {
      expect(memoryWiper.wipeBuffer).toBeDefined();
      expect(memoryWiper.wipeString).toBeDefined();
      expect(memoryWiper.wipeBuffers).toBeDefined();
      expect(memoryWiper.wipeObject).toBeDefined();
      expect(memoryWiper.wipeChunk).toBeDefined();
      expect(memoryWiper.createWrapper).toBeDefined();
      expect(memoryWiper.createCleanup).toBeDefined();
      expect(memoryWiper.compareAndWipe).toBeDefined();
    });
  });
});
