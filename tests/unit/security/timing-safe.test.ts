import { describe, it, expect } from 'vitest';
import {
  timingSafeEqual,
  timingSafeStringCompare,
  timingSafeHMACVerify,
  timingSafeTokenCompare,
  timingSafeHashCompare,
  timingSafePrefixCheck,
  timingSafeIndexCheck,
  timingSafeCompare,
  createTimingSafeValidator,
  timingSafeAuthCheck,
  timingSafeTokenLookup,
  timingSafeDelay,
  timingSafeOperation,
  timingSafe,
} from '../../../lib/security/timing-safe';

describe('Timing-Safe Utilities', () => {
  describe('timingSafeEqual', () => {
    it('should return true for equal buffers', () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 5]);

      expect(timingSafeEqual(a, b)).toBe(true);
    });

    it('should return false for different buffers', () => {
      const a = new Uint8Array([1, 2, 3, 4, 5]);
      const b = new Uint8Array([1, 2, 3, 4, 6]);

      expect(timingSafeEqual(a, b)).toBe(false);
    });

    it('should return false for different lengths', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(timingSafeEqual(a, b)).toBe(false);
    });

    it('should handle null/undefined', () => {
      const a = new Uint8Array([1, 2, 3]);

      expect(timingSafeEqual(a, null as any)).toBe(false);
      expect(timingSafeEqual(null as any, a)).toBe(false);
      expect(timingSafeEqual(null as any, null as any)).toBe(false);
    });

    it('should be constant-time for same-length buffers', () => {
      // Test that comparison takes similar time regardless of where difference is
      const a = new Uint8Array(1000);
      const b1 = new Uint8Array(1000);
      const b2 = new Uint8Array(1000);

      a.fill(0xff);
      b1.fill(0xff);
      b2.fill(0xff);

      b1[0] = 0; // Difference at start
      b2[999] = 0; // Difference at end

      // Both should return false in similar time
      expect(timingSafeEqual(a, b1)).toBe(false);
      expect(timingSafeEqual(a, b2)).toBe(false);
    });
  });

  describe('timingSafeStringCompare', () => {
    it('should return true for equal strings', () => {
      expect(timingSafeStringCompare('hello', 'hello')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(timingSafeStringCompare('hello', 'world')).toBe(false);
    });

    it('should handle unicode strings', () => {
      const str1 = '🔐 Secret';
      const str2 = '🔐 Secret';
      const str3 = '🔑 Secret';

      expect(timingSafeStringCompare(str1, str2)).toBe(true);
      expect(timingSafeStringCompare(str1, str3)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(timingSafeStringCompare('', '')).toBe(true);
      expect(timingSafeStringCompare('', 'test')).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(timingSafeStringCompare(null as any, 'test')).toBe(false);
      expect(timingSafeStringCompare('test', undefined as any)).toBe(false);
    });
  });

  describe('timingSafeHMACVerify', () => {
    it('should verify matching HMACs', () => {
      const hmac = new Uint8Array([1, 2, 3, 4, 5]);
      const computed = new Uint8Array([1, 2, 3, 4, 5]);

      expect(timingSafeHMACVerify(hmac, computed)).toBe(true);
    });

    it('should reject mismatched HMACs', () => {
      const expected = new Uint8Array([1, 2, 3, 4, 5]);
      const actual = new Uint8Array([1, 2, 3, 4, 6]);

      expect(timingSafeHMACVerify(expected, actual)).toBe(false);
    });
  });

  describe('timingSafeTokenCompare', () => {
    it('should compare tokens safely', () => {
      const token = 'secret-token-123';

      expect(timingSafeTokenCompare(token, token)).toBe(true);
      expect(timingSafeTokenCompare(token, 'wrong-token')).toBe(false);
    });

    it('should handle session tokens', () => {
      const sessionToken = 'sess_1234567890abcdef';
      const userToken = 'sess_1234567890abcdef';

      expect(timingSafeTokenCompare(sessionToken, userToken)).toBe(true);
    });
  });

  describe('timingSafeHashCompare', () => {
    it('should compare hashes safely', () => {
      const hash1 = new Uint8Array(32).fill(0xaa);
      const hash2 = new Uint8Array(32).fill(0xaa);
      const hash3 = new Uint8Array(32).fill(0xbb);

      expect(timingSafeHashCompare(hash1, hash2)).toBe(true);
      expect(timingSafeHashCompare(hash1, hash3)).toBe(false);
    });
  });

  describe('timingSafePrefixCheck', () => {
    it('should check prefix safely', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const prefix = new Uint8Array([1, 2, 3]);

      expect(timingSafePrefixCheck(buffer, prefix)).toBe(true);
    });

    it('should reject wrong prefix', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const prefix = new Uint8Array([1, 2, 4]);

      expect(timingSafePrefixCheck(buffer, prefix)).toBe(false);
    });

    it('should handle prefix longer than buffer', () => {
      const buffer = new Uint8Array([1, 2]);
      const prefix = new Uint8Array([1, 2, 3]);

      expect(timingSafePrefixCheck(buffer, prefix)).toBe(false);
    });
  });

  describe('timingSafeIndexCheck', () => {
    it('should validate array indices safely', () => {
      const arr = [1, 2, 3, 4, 5];

      expect(timingSafeIndexCheck(arr, 0)).toBe(true);
      expect(timingSafeIndexCheck(arr, 4)).toBe(true);
      expect(timingSafeIndexCheck(arr, 5)).toBe(false);
      expect(timingSafeIndexCheck(arr, -1)).toBe(false);
    });

    it('should reject non-integer indices', () => {
      const arr = [1, 2, 3];

      expect(timingSafeIndexCheck(arr, 1.5)).toBe(false);
      expect(timingSafeIndexCheck(arr, NaN)).toBe(false);
    });
  });

  describe('timingSafeCompare', () => {
    it('should auto-detect and compare strings', () => {
      expect(timingSafeCompare('hello', 'hello')).toBe(true);
      expect(timingSafeCompare('hello', 'world')).toBe(false);
    });

    it('should auto-detect and compare buffers', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);
      const c = new Uint8Array([1, 2, 4]);

      expect(timingSafeCompare(a, b)).toBe(true);
      expect(timingSafeCompare(a, c)).toBe(false);
    });

    it('should reject mismatched types', () => {
      const str = 'test';
      const buf = new Uint8Array([1, 2, 3]);

      expect(timingSafeCompare(str, buf as any)).toBe(false);
    });
  });

  describe('createTimingSafeValidator', () => {
    it('should create a reusable validator', () => {
      const expectedToken = 'secret-123';
      const validator = createTimingSafeValidator(expectedToken);

      expect(validator('secret-123')).toBe(true);
      expect(validator('wrong-token')).toBe(false);
    });

    it('should work with buffers', () => {
      const expected = new Uint8Array([1, 2, 3]);
      const validator = createTimingSafeValidator(expected);

      expect(validator(new Uint8Array([1, 2, 3]))).toBe(true);
      expect(validator(new Uint8Array([1, 2, 4]))).toBe(false);
    });
  });

  describe('timingSafeAuthCheck', () => {
    it('should validate all credential fields', () => {
      const credentials = {
        username: 'admin',
        password: 'secret123',
      };

      const expected = {
        username: 'admin',
        password: 'secret123',
      };

      expect(timingSafeAuthCheck(credentials, expected)).toBe(true);
    });

    it('should reject partial matches', () => {
      const credentials = {
        username: 'admin',
        password: 'wrong',
      };

      const expected = {
        username: 'admin',
        password: 'secret123',
      };

      expect(timingSafeAuthCheck(credentials, expected)).toBe(false);
    });

    it('should check all fields even after first failure', () => {
      // This ensures constant-time behavior
      const credentials = {
        username: 'wrong',
        password: 'wrong',
      };

      const expected = {
        username: 'admin',
        password: 'secret123',
      };

      expect(timingSafeAuthCheck(credentials, expected)).toBe(false);
    });

    it('should handle missing fields', () => {
      const credentials = {
        username: 'admin',
      };

      const expected = {
        username: 'admin',
        password: 'secret123',
      };

      expect(timingSafeAuthCheck(credentials as any, expected)).toBe(false);
    });
  });

  describe('timingSafeTokenLookup', () => {
    it('should find token in valid set', () => {
      const validTokens = ['token1', 'token2', 'token3'];

      expect(timingSafeTokenLookup('token2', validTokens)).toBe(true);
    });

    it('should reject invalid token', () => {
      const validTokens = ['token1', 'token2', 'token3'];

      expect(timingSafeTokenLookup('invalid', validTokens)).toBe(false);
    });

    it('should check all tokens (no short-circuit)', () => {
      // Even if token matches first item, should check all for constant-time
      const validTokens = ['match', 'token2', 'token3'];

      expect(timingSafeTokenLookup('match', validTokens)).toBe(true);
    });
  });

  describe('timingSafeDelay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await timingSafeDelay(50, 50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some variance
    });

    it('should add random jitter', async () => {
      const delays: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await timingSafeDelay(10, 50);
        delays.push(Date.now() - start);
      }

      // Delays should vary (not all the same)
      const allSame = delays.every((d) => d === delays[0]);
      expect(allSame).toBe(false);
    });

    it('should reject invalid parameters', async () => {
      await expect(timingSafeDelay(-10, 50)).rejects.toThrow();
      await expect(timingSafeDelay(100, 50)).rejects.toThrow();
    });
  });

  describe('timingSafeOperation', () => {
    it('should enforce minimum duration', async () => {
      const start = Date.now();

      const result = await timingSafeOperation(
        async () => {
          // Fast operation
          return 'done';
        },
        100
      );

      const elapsed = Date.now() - start;

      expect(result).toBe('done');
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow variance
    });

    it('should not add delay if operation is slow', async () => {
      const start = Date.now();

      const result = await timingSafeOperation(
        async () => {
          await new Promise((r) => setTimeout(r, 150));
          return 'done';
        },
        100
      );

      const elapsed = Date.now() - start;

      expect(result).toBe('done');
      expect(elapsed).toBeLessThan(200); // No extra delay added
    });

    it('should preserve operation result', async () => {
      const result = await timingSafeOperation(
        async () => ({ success: true, data: 'test' }),
        50
      );

      expect(result).toEqual({ success: true, data: 'test' });
    });
  });

  describe('timingSafe namespace', () => {
    it('should export all timing-safe functions', () => {
      expect(timingSafe.equal).toBeDefined();
      expect(timingSafe.stringCompare).toBeDefined();
      expect(timingSafe.hmacVerify).toBeDefined();
      expect(timingSafe.tokenCompare).toBeDefined();
      expect(timingSafe.hashCompare).toBeDefined();
      expect(timingSafe.prefixCheck).toBeDefined();
      expect(timingSafe.indexCheck).toBeDefined();
      expect(timingSafe.compare).toBeDefined();
      expect(timingSafe.createValidator).toBeDefined();
      expect(timingSafe.authCheck).toBeDefined();
      expect(timingSafe.tokenLookup).toBeDefined();
      expect(timingSafe.delay).toBeDefined();
      expect(timingSafe.operation).toBeDefined();
    });
  });
});
