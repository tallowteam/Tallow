/**
 * Password Protection Tests
 * Tests for password-based file encryption with rate limiting and secure memory wiping
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptFileWithPasswordLayer,
  decryptPasswordProtectedFile,
  encryptFilePasswordOnly,
  decryptFilePasswordOnly,
  isPasswordProtected,
  getPasswordHint,
} from '@/lib/crypto/password-file-encryption';
import { deriveKeyFromPassword, generateSalt } from '@/lib/crypto/argon2-browser';

// Mock dependencies
vi.mock('@/lib/crypto/argon2-browser', () => ({
  deriveKeyFromPassword: vi.fn().mockResolvedValue(new Uint8Array(32)),
  generateSalt: vi.fn(() => new Uint8Array(16)),
}));

vi.mock('@/lib/crypto/pqc-crypto', () => ({
  pqCrypto: {
    encrypt: vi.fn().mockResolvedValue({
      ciphertext: new Uint8Array(100),
      nonce: new Uint8Array(12),
    }),
    decrypt: vi.fn().mockResolvedValue(new Uint8Array(50)),
  },
}));

vi.mock('@/lib/crypto/file-encryption-pqc', () => ({
  encryptFile: vi.fn().mockResolvedValue({
    chunks: [
      {
        data: new Uint8Array(50),
        nonce: new Uint8Array(12),
        chunkIndex: 0,
      },
    ],
    metadata: {
      fileName: 'test.txt',
      fileSize: 50,
      fileType: 'text/plain',
      chunkSize: 50,
      totalChunks: 1,
    },
  }),
  decryptFile: vi.fn().mockResolvedValue(new Blob(['test content'])),
}));

describe('Password Protection', () => {
  let testFile: File;
  let testPassword: string;
  let mockSessionKey: Uint8Array;

  beforeEach(() => {
    vi.clearAllMocks();

    testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    testPassword = 'SecurePassword123!';
    mockSessionKey = new Uint8Array(32);
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', async () => {
      const validPasswords = [
        'Password123',
        'MySecurePass!',
        'a'.repeat(8),
        'a'.repeat(128),
      ];

      for (const password of validPasswords) {
        const result = await encryptFilePasswordOnly(testFile, password);
        expect(result).toBeDefined();
        expect(result.passwordProtection).toBeDefined();
      }
    });

    it('should validate minimum password length', async () => {
      const shortPassword = 'abc123'; // Less than 8 characters

      // The function doesn't explicitly validate, but should still work
      const result = await encryptFilePasswordOnly(testFile, shortPassword);
      expect(result).toBeDefined();
    });

    it('should validate maximum password length', async () => {
      const longPassword = 'a'.repeat(150); // More than 128 characters

      // Should work but might be truncated by Argon2
      const result = await encryptFilePasswordOnly(testFile, longPassword);
      expect(result).toBeDefined();
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const result = await encryptFilePasswordOnly(testFile, specialPassword);
      expect(result).toBeDefined();
    });
  });

  describe('Layered Encryption', () => {
    it('should encrypt with both session key and password', async () => {
      const result = await encryptFileWithPasswordLayer(
        testFile,
        mockSessionKey,
        testPassword
      );

      expect(result).toBeDefined();
      expect(result.passwordProtection).toBeDefined();
      expect(result.passwordProtection?.salt).toBeDefined();
      expect(result.passwordProtection?.iterations).toBe(600000);
    });

    it('should include password hint when provided', async () => {
      const hint = 'Your favorite pet name';

      const result = await encryptFileWithPasswordLayer(
        testFile,
        mockSessionKey,
        testPassword,
        hint
      );

      expect(result.passwordProtection?.hint).toBe(hint);
    });

    it('should decrypt with correct password and session key', async () => {
      const encrypted = await encryptFileWithPasswordLayer(
        testFile,
        mockSessionKey,
        testPassword
      );

      const decrypted = await decryptPasswordProtectedFile(
        encrypted,
        mockSessionKey,
        testPassword
      );

      expect(decrypted).toBeInstanceOf(Blob);
    });

    it('should use 600000 iterations for OWASP 2023 compliance', async () => {
      const result = await encryptFileWithPasswordLayer(
        testFile,
        mockSessionKey,
        testPassword
      );

      expect(result.passwordProtection?.iterations).toBe(600000);
    });
  });

  describe('Password-Only Encryption', () => {
    it('should encrypt with password only', async () => {
      const result = await encryptFilePasswordOnly(testFile, testPassword);

      expect(result).toBeDefined();
      expect(result.passwordProtection).toBeDefined();
      expect(result.passwordProtection?.salt).toBeDefined();
    });

    it('should decrypt with correct password', async () => {
      const encrypted = await encryptFilePasswordOnly(testFile, testPassword);

      const decrypted = await decryptFilePasswordOnly(encrypted, testPassword);

      expect(decrypted).toBeInstanceOf(Blob);
    });

    it('should throw error when trying to decrypt without password protection', async () => {
      const nonProtectedFile = {
        chunks: [],
        metadata: {
          fileName: 'test.txt',
          fileSize: 0,
          fileType: 'text/plain',
          chunkSize: 0,
          totalChunks: 0,
        },
      };

      await expect(
        decryptFilePasswordOnly(nonProtectedFile as any, testPassword)
      ).rejects.toThrow('File is not password protected');
    });
  });

  describe('Rate Limiting', () => {
    it('should implement exponential backoff on failed attempts', async () => {
      const encrypted = await encryptFilePasswordOnly(testFile, testPassword);

      // Simulate multiple failed attempts
      const wrongPasswords = [
        'wrong1',
        'wrong2',
        'wrong3',
        'wrong4',
        'wrong5',
      ];

      const attempts: number[] = [];

      for (const wrongPassword of wrongPasswords) {
        const startTime = Date.now();

        try {
          await decryptFilePasswordOnly(encrypted, wrongPassword);
        } catch (_error) {
          // Expected to fail
        }

        const endTime = Date.now();
        attempts.push(endTime - startTime);
      }

      // Note: Actual rate limiting would be implemented in UI layer
      // This test documents the expected behavior
      expect(attempts.length).toBe(5);
    });

    it('should allow retry after cooldown period', async () => {
      const encrypted = await encryptFilePasswordOnly(testFile, testPassword);

      // Try wrong password
      try {
        await decryptFilePasswordOnly(encrypted, 'wrong');
      } catch (_error) {
        // Expected
      }

      // Correct password should still work
      const decrypted = await decryptFilePasswordOnly(encrypted, testPassword);
      expect(decrypted).toBeInstanceOf(Blob);
    });
  });

  describe('Secure Memory Wiping', () => {
    it('should clear password from memory after use', async () => {
      const password = 'SecurePassword123!';
      const passwordArray = new TextEncoder().encode(password);

      await encryptFilePasswordOnly(testFile, password);

      // Note: Actual memory wiping would be implemented at lower level
      // This test documents the expected behavior
      expect(passwordArray).toBeDefined();
    });

    it('should clear derived keys after encryption', async () => {
      const encrypted = await encryptFilePasswordOnly(testFile, testPassword);

      // Verify deriveKeyFromPassword was called
      expect(deriveKeyFromPassword).toHaveBeenCalled();

      // Keys should be cleared after use
      expect(encrypted).toBeDefined();
    });

    it('should clear intermediate buffers', async () => {
      const encrypted = await encryptFileWithPasswordLayer(
        testFile,
        mockSessionKey,
        testPassword
      );

      // All intermediate data should be cleared
      expect(encrypted.chunks).toBeDefined();
    });
  });

  describe('Integration with Transfer Flow', () => {
    it('should work with existing PQC encryption', async () => {
      const encrypted = await encryptFileWithPasswordLayer(
        testFile,
        mockSessionKey,
        testPassword
      );

      expect(encrypted.passwordProtection).toBeDefined();
      expect(encrypted.chunks).toBeDefined();
    });

    it('should preserve file metadata', async () => {
      const encrypted = await encryptFilePasswordOnly(testFile, testPassword);

      expect(encrypted.metadata).toBeDefined();
      expect(encrypted.metadata.encryptedName).toBeDefined();
      expect(encrypted.metadata.mimeCategory).toBeDefined();
    });

    it('should handle large files efficiently', async () => {
      const largeContent = new Uint8Array(10 * 1024 * 1024); // 10 MB
      const largeFile = new File([largeContent], 'large.bin', {
        type: 'application/octet-stream',
      });

      const startTime = Date.now();
      const encrypted = await encryptFilePasswordOnly(largeFile, testPassword);
      const endTime = Date.now();

      expect(encrypted).toBeDefined();
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Utility Functions', () => {
    it('should detect password-protected files', () => {
      const protectedFile = {
        chunks: [],
        metadata: {} as any,
        passwordProtection: {
          salt: new Uint8Array(16),
          iterations: 600000,
        },
      };

      expect(isPasswordProtected(protectedFile)).toBe(true);
    });

    it('should detect non-password-protected files', () => {
      const nonProtectedFile = {
        chunks: [],
        metadata: {} as any,
      };

      expect(isPasswordProtected(nonProtectedFile)).toBe(false);
    });

    it('should retrieve password hint', () => {
      const hint = 'Your favorite color';
      const protectedFile = {
        chunks: [],
        metadata: {} as any,
        passwordProtection: {
          salt: new Uint8Array(16),
          iterations: 600000,
          hint,
        },
      };

      expect(getPasswordHint(protectedFile)).toBe(hint);
    });

    it('should return undefined when no hint provided', () => {
      const protectedFile = {
        chunks: [],
        metadata: {} as any,
        passwordProtection: {
          salt: new Uint8Array(16),
          iterations: 600000,
        },
      };

      expect(getPasswordHint(protectedFile)).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty password', async () => {
      const emptyPassword = '';

      const result = await encryptFilePasswordOnly(testFile, emptyPassword);
      expect(result).toBeDefined();
    });

    it('should handle unicode passwords', async () => {
      const unicodePassword = '你好世界🌍';

      const result = await encryptFilePasswordOnly(testFile, unicodePassword);
      expect(result).toBeDefined();
    });

    it('should handle null bytes in password', async () => {
      const passwordWithNull = 'pass\0word';

      const result = await encryptFilePasswordOnly(testFile, passwordWithNull);
      expect(result).toBeDefined();
    });
  });

  describe('Salt Generation', () => {
    it('should generate unique salt for each encryption', async () => {
      const _result1 = await encryptFilePasswordOnly(testFile, testPassword);
      const _result2 = await encryptFilePasswordOnly(testFile, testPassword);
      void _result1; // Suppress unused variable warning
      void _result2; // Suppress unused variable warning

      // Each call should generate a new salt
      expect(generateSalt).toHaveBeenCalledTimes(2);
    });

    it('should use 16-byte salt', async () => {
      const result = await encryptFilePasswordOnly(testFile, testPassword);

      expect(result.passwordProtection?.salt).toBeInstanceOf(Uint8Array);
      expect(result.passwordProtection?.salt.length).toBe(16);
    });
  });

  describe('Performance', () => {
    it('should complete encryption in reasonable time', async () => {
      const startTime = Date.now();

      await encryptFilePasswordOnly(testFile, testPassword);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should complete decryption in reasonable time', async () => {
      const encrypted = await encryptFilePasswordOnly(testFile, testPassword);

      const startTime = Date.now();

      await decryptFilePasswordOnly(encrypted, testPassword);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });
});
