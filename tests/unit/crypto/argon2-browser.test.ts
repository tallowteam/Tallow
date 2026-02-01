/**
 * Argon2id Browser Implementation Tests
 * Tests password hashing and key derivation
 */

import { describe, it, expect } from 'vitest';
import {
  deriveKeyFromPassword,
  generateSalt,
  getCurrentKDFAlgorithm,
  KDF_ALGORITHM,
  ARGON2_DEFAULTS,
} from '@/lib/crypto/argon2-browser';

describe('Argon2 Browser Implementation', () => {
  describe('Salt Generation', () => {
    it('should generate 32-byte salt', () => {
      const salt = generateSalt();

      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      expect(salt1).not.toEqual(salt2);
    });

    it('should generate cryptographically random salts', () => {
      const salts = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const salt = generateSalt();
        salts.add(Array.from(salt).join(','));
      }

      expect(salts.size).toBe(100); // All should be unique
    });
  });

  describe('Key Derivation with Argon2id', () => {
    it('should derive key from password', async () => {
      const password = 'SecurePassword123!';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 65536, // 64 MiB
        iterations: 3,
        parallelism: 4,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32); // 256-bit key
    }, 10000);

    it('should produce consistent keys', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1 as const,
        memory: 65536,
        iterations: 3,
        parallelism: 4,
      };

      const key1 = await deriveKeyFromPassword(password, salt, options);
      const key2 = await deriveKeyFromPassword(password, salt, options);

      expect(key1).toEqual(key2);
    }, 10000);

    it('should produce different keys with different passwords', async () => {
      const salt = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1 as const,
        memory: 65536,
        iterations: 3,
        parallelism: 4,
      };

      const key1 = await deriveKeyFromPassword('password1', salt, options);
      const key2 = await deriveKeyFromPassword('password2', salt, options);

      expect(key1).not.toEqual(key2);
    }, 10000);

    it('should produce different keys with different salts', async () => {
      const password = 'TestPassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1 as const,
        memory: 65536,
        iterations: 3,
        parallelism: 4,
      };

      const key1 = await deriveKeyFromPassword(password, salt1, options);
      const key2 = await deriveKeyFromPassword(password, salt2, options);

      expect(key1).not.toEqual(key2);
    }, 10000);

    it('should use default parameters when not specified', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    }, 10000);

    it('should handle Unicode passwords', async () => {
      const password = '密码🔐test';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 65536,
        iterations: 3,
        parallelism: 4,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    }, 10000);

    it('should respect memory parameter', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      // Lower memory should be faster
      const start1 = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024, // 1 MiB
        iterations: 1,
        parallelism: 1,
      });
      const time1 = Date.now() - start1;

      // Higher memory should be slower
      const start2 = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 65536, // 64 MiB
        iterations: 1,
        parallelism: 1,
      });
      const time2 = Date.now() - start2;

      expect(time2).toBeGreaterThan(time1);
    }, 20000);

    it('should respect iterations parameter', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key1 = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      });

      const key2 = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 3,
        parallelism: 1,
      });

      // Different iterations should produce different keys
      expect(key1).not.toEqual(key2);
    }, 10000);
  });

  describe('PBKDF2 Backward Compatibility', () => {
    it('should support PBKDF2-SHA256 v1', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.PBKDF2_V1,
        iterations: 100000,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should support PBKDF2-SHA256 v2', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.PBKDF2_V2,
        iterations: 600000,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should produce consistent PBKDF2 keys', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.PBKDF2_V2 as const,
        iterations: 100000,
      };

      const key1 = await deriveKeyFromPassword(password, salt, options);
      const key2 = await deriveKeyFromPassword(password, salt, options);

      expect(key1).toEqual(key2);
    });

    it('should produce different keys between PBKDF2 versions', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const keyV1 = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.PBKDF2_V1,
        iterations: 100000,
      });

      const keyV2 = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.PBKDF2_V2,
        iterations: 100000,
      });

      expect(keyV1).not.toEqual(keyV2);
    });
  });

  describe('Algorithm Selection', () => {
    it('should return current default algorithm', () => {
      const algorithm = getCurrentKDFAlgorithm();

      expect(algorithm).toBe(KDF_ALGORITHM.ARGON2ID_V1);
    });

    it('should have valid default parameters', () => {
      expect(ARGON2_DEFAULTS.memory).toBeGreaterThan(0);
      expect(ARGON2_DEFAULTS.iterations).toBeGreaterThan(0);
      expect(ARGON2_DEFAULTS.parallelism).toBeGreaterThan(0);
    });
  });

  describe('Security Properties', () => {
    it('should be resistant to rainbow tables (unique salts)', async () => {
      const password = 'CommonPassword123';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1 as const,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      };

      const key1 = await deriveKeyFromPassword(password, salt1, options);
      const key2 = await deriveKeyFromPassword(password, salt2, options);

      expect(key1).not.toEqual(key2);
    });

    it('should be computationally expensive (time-memory tradeoff)', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const start = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: ARGON2_DEFAULTS.memory,
        iterations: ARGON2_DEFAULTS.iterations,
        parallelism: ARGON2_DEFAULTS.parallelism,
      });
      const duration = Date.now() - start;

      // Should take noticeable time (memory-hard operation)
      expect(duration).toBeGreaterThan(100);
    }, 10000);

    it('should handle empty password securely', async () => {
      const salt = generateSalt();

      const key = await deriveKeyFromPassword('', salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(10000);
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(longPassword, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    }, 10000);

    it('should be case-sensitive', async () => {
      const salt = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1 as const,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      };

      const key1 = await deriveKeyFromPassword('Password', salt, options);
      const key2 = await deriveKeyFromPassword('password', salt, options);

      expect(key1).not.toEqual(key2);
    });

    it('should handle whitespace in passwords', async () => {
      const salt = generateSalt();
      const options = {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1 as const,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      };

      const key1 = await deriveKeyFromPassword('password', salt, options);
      const key2 = await deriveKeyFromPassword(' password ', salt, options);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('Performance', () => {
    it('should complete with minimal parameters quickly', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const start = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('should complete with default parameters in reasonable time', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const start = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10000); // < 10 seconds
    }, 15000);

    it('PBKDF2 should be faster than Argon2id', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const start1 = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.PBKDF2_V2,
        iterations: 100000,
      });
      const pbkdf2Time = Date.now() - start1;

      const start2 = Date.now();
      await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 65536,
        iterations: 3,
        parallelism: 4,
      });
      const argon2Time = Date.now() - start2;

      // Argon2id is memory-hard and should take longer
      expect(argon2Time).toBeGreaterThan(pbkdf2Time);
    }, 20000);
  });

  describe('Edge Cases', () => {
    it('should handle minimum memory parameter', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1, // Minimum
        iterations: 1,
        parallelism: 1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should handle minimum iterations', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1, // Minimum
        parallelism: 1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should handle minimum parallelism', async () => {
      const password = 'TestPassword';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1, // Minimum
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should handle special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should handle null bytes in password', async () => {
      const password = 'pass\0word';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt, {
        algorithm: KDF_ALGORITHM.ARGON2ID_V1,
        memory: 1024,
        iterations: 1,
        parallelism: 1,
      });

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });
  });
});
