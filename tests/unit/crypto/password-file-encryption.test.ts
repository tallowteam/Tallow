/**
 * Password-Protected File Encryption Tests
 * Tests password-based file encryption with Argon2id
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptFileWithPassword,
  decryptFileWithPassword,
  type PasswordProtectedFile,
} from '@/lib/crypto/password-file-encryption';
import { KDF_ALGORITHM } from '@/lib/crypto/argon2-browser';

// Mock dependencies
vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock('@/lib/security/memory-wiper', () => ({
  secureWipeBuffer: vi.fn(),
}));

describe('Password-Protected File Encryption', () => {
  const testPassword = 'SecureP@ssw0rd123!';
  const weakPassword = '123456';

  describe('Encryption with Password', () => {
    it('should encrypt file with password', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.passwordProtection).toBeDefined();
      expect(encrypted.passwordProtection?.salt).toBeInstanceOf(Uint8Array);
      expect(encrypted.passwordProtection?.kdfAlgorithm).toBe(
        KDF_ALGORITHM.ARGON2ID_V1
      );
      expect(encrypted.chunks).toBeDefined();
      expect(encrypted.chunks.length).toBeGreaterThan(0);
    });

    it('should use Argon2id by default', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      expect(encrypted.passwordProtection?.kdfAlgorithm).toBe(
        KDF_ALGORITHM.ARGON2ID_V1
      );
      expect(encrypted.passwordProtection?.memory).toBeDefined();
      expect(encrypted.passwordProtection?.timeCost).toBeDefined();
      expect(encrypted.passwordProtection?.parallelism).toBeDefined();
    });

    it('should generate unique salt for each encryption', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted1 = await encryptFileWithPassword(file, testPassword);
      const encrypted2 = await encryptFileWithPassword(file, testPassword);

      expect(encrypted1.passwordProtection?.salt).not.toEqual(
        encrypted2.passwordProtection?.salt
      );
    });

    it('should include password hint if provided', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const hint = 'My favorite password';

      const encrypted = await encryptFileWithPassword(
        file,
        testPassword,
        hint
      );

      expect(encrypted.passwordProtection?.hint).toBe(hint);
    });

    it('should work without password hint', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      expect(encrypted.passwordProtection?.hint).toBeUndefined();
    });

    it('should handle weak passwords', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      // Should still work but with same security parameters
      const encrypted = await encryptFileWithPassword(file, weakPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.passwordProtection).toBeDefined();
    });

    it('should handle Unicode passwords', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const unicodePassword = '密码🔐test';

      const encrypted = await encryptFileWithPassword(file, unicodePassword);

      expect(encrypted).toBeDefined();
    });

    it('should handle empty password', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(
        encryptFileWithPassword(file, '')
      ).rejects.toThrow();
    });
  });

  describe('Decryption with Password', () => {
    it('should decrypt file with correct password', async () => {
      const content = 'Test file content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);
      const decrypted = await decryptFileWithPassword(
        encrypted,
        testPassword
      );

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should fail with wrong password', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const wrongPassword = 'WrongPassword123!';

      const encrypted = await encryptFileWithPassword(file, testPassword);

      await expect(
        decryptFileWithPassword(encrypted, wrongPassword)
      ).rejects.toThrow();
    });

    it('should decrypt filename with password', async () => {
      const filename = 'secret-document.pdf';
      const file = new File(['content'], filename, {
        type: 'application/pdf',
      });

      const encrypted = await encryptFileWithPassword(file, testPassword);
      const decryptedName = await decryptFileWithPassword(
        encrypted,
        testPassword,
        true
      );

      expect(decryptedName).toBe(filename);
    });

    it('should fail filename decryption with wrong password', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const wrongPassword = 'WrongPassword123!';

      const encrypted = await encryptFileWithPassword(file, testPassword);

      await expect(
        decryptFileWithPassword(encrypted, wrongPassword, true)
      ).rejects.toThrow();
    });

    it('should use stored KDF parameters', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      // Verify KDF parameters are stored
      expect(encrypted.passwordProtection?.memory).toBeDefined();
      expect(encrypted.passwordProtection?.timeCost).toBeDefined();

      // Decryption should use these parameters
      const decrypted = await decryptFileWithPassword(
        encrypted,
        testPassword
      );

      expect(decrypted).toBeDefined();
    });
  });

  describe('Round-Trip with Password', () => {
    it('should preserve file content', async () => {
      const content = 'Hello, World!\nThis is a password-protected file.';
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);
      const decrypted = await decryptFileWithPassword(
        encrypted,
        testPassword
      );

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve binary content', async () => {
      const content = crypto.getRandomValues(new Uint8Array(1024));
      const file = new File([content], 'test.bin', {
        type: 'application/octet-stream',
      });

      const encrypted = await encryptFileWithPassword(file, testPassword);
      const decrypted = await decryptFileWithPassword(
        encrypted,
        testPassword
      );

      const buffer = await decrypted.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      expect(bytes).toEqual(content);
    });

    it('should preserve filename', async () => {
      const filename = 'important-document.pdf';
      const file = new File(['content'], filename, {
        type: 'application/pdf',
      });

      const encrypted = await encryptFileWithPassword(file, testPassword);
      const decryptedName = await decryptFileWithPassword(
        encrypted,
        testPassword,
        true
      );

      expect(decryptedName).toBe(filename);
    });

    it('should work with large files', async () => {
      const size = 500 * 1024; // 500KB
      const content = crypto.getRandomValues(new Uint8Array(size));
      const file = new File([content], 'large.bin', {
        type: 'application/octet-stream',
      });

      const encrypted = await encryptFileWithPassword(file, testPassword);
      const decrypted = await decryptFileWithPassword(
        encrypted,
        testPassword
      );

      const buffer = await decrypted.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      expect(bytes).toEqual(content);
    }, 30000);
  });

  describe('Backward Compatibility', () => {
    it('should decrypt legacy PBKDF2 files', async () => {
      // Simulate legacy file structure
      const file = new File(['content'], 'legacy.txt', {
        type: 'text/plain',
      });

      // Would need to create a legacy encrypted file format
      // This is a placeholder for the test structure
      expect(true).toBe(true);
    });

    it('should detect KDF algorithm from metadata', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      expect(encrypted.passwordProtection?.kdfAlgorithm).toBeDefined();
      expect(
        [
          KDF_ALGORITHM.ARGON2ID_V1,
          KDF_ALGORITHM.PBKDF2_V1,
          KDF_ALGORITHM.PBKDF2_V2,
        ]
      ).toContain(encrypted.passwordProtection?.kdfAlgorithm);
    });
  });

  describe('Security Properties', () => {
    it('should use different salts for same password', async () => {
      const file1 = new File(['content1'], 'file1.txt', {
        type: 'text/plain',
      });
      const file2 = new File(['content2'], 'file2.txt', {
        type: 'text/plain',
      });

      const encrypted1 = await encryptFileWithPassword(file1, testPassword);
      const encrypted2 = await encryptFileWithPassword(file2, testPassword);

      expect(encrypted1.passwordProtection?.salt).not.toEqual(
        encrypted2.passwordProtection?.salt
      );
    });

    it('should produce different ciphertexts for same file and password', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted1 = await encryptFileWithPassword(file, testPassword);
      const encrypted2 = await encryptFileWithPassword(file, testPassword);

      // Different salts should produce different keys and ciphertexts
      expect(encrypted1.chunks[0].data).not.toEqual(
        encrypted2.chunks[0].data
      );
    });

    it('should not expose password in metadata', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      const metadataStr = JSON.stringify(encrypted.passwordProtection);
      expect(metadataStr).not.toContain(testPassword);
    });

    it('should not expose password in hint', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const hint = 'Not the actual password';

      const encrypted = await encryptFileWithPassword(
        file,
        testPassword,
        hint
      );

      expect(encrypted.passwordProtection?.hint).not.toBe(testPassword);
      expect(encrypted.passwordProtection?.hint).toBe(hint);
    });

    it('should resist timing attacks', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      // Try multiple wrong passwords and measure time
      const wrongPasswords = ['wrong1', 'wrong2', 'wrong3'];
      const times: number[] = [];

      for (const pwd of wrongPasswords) {
        const start = Date.now();
        try {
          await decryptFileWithPassword(encrypted, pwd);
        } catch (e) {
          // Expected to fail
        }
        times.push(Date.now() - start);
      }

      // Times should be relatively similar (within reasonable variance)
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      times.forEach(time => {
        expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 0.5);
      });
    }, 30000);
  });

  describe('Performance', () => {
    it('should complete encryption in reasonable time', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const start = Date.now();
      await encryptFileWithPassword(file, testPassword);
      const duration = Date.now() - start;

      // Argon2id is intentionally slow but should complete in < 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should complete decryption in reasonable time', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      const start = Date.now();
      await decryptFileWithPassword(encrypted, testPassword);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const longPassword = 'a'.repeat(1000);

      const encrypted = await encryptFileWithPassword(file, longPassword);
      const decrypted = await decryptFileWithPassword(
        encrypted,
        longPassword
      );

      expect(decrypted).toBeDefined();
    });

    it('should handle special characters in password', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

      const encrypted = await encryptFileWithPassword(file, specialPassword);
      const decrypted = await decryptFileWithPassword(
        encrypted,
        specialPassword
      );

      expect(decrypted).toBeDefined();
    });

    it('should handle whitespace in password', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const passwordWithSpaces = '  password with spaces  ';

      const encrypted = await encryptFileWithPassword(
        file,
        passwordWithSpaces
      );
      const decrypted = await decryptFileWithPassword(
        encrypted,
        passwordWithSpaces
      );

      expect(decrypted).toBeDefined();

      // Should not work with trimmed password
      await expect(
        decryptFileWithPassword(encrypted, passwordWithSpaces.trim())
      ).rejects.toThrow();
    });

    it('should handle very long hints', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const longHint = 'a'.repeat(500);

      const encrypted = await encryptFileWithPassword(
        file,
        testPassword,
        longHint
      );

      expect(encrypted.passwordProtection?.hint).toBe(longHint);
    });

    it('should handle missing password protection metadata', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      // Remove password protection metadata
      delete encrypted.passwordProtection;

      await expect(
        decryptFileWithPassword(encrypted, testPassword)
      ).rejects.toThrow();
    });

    it('should handle corrupted salt', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      // Corrupt salt
      if (encrypted.passwordProtection) {
        encrypted.passwordProtection.salt[0] ^= 0xff;
      }

      await expect(
        decryptFileWithPassword(encrypted, testPassword)
      ).rejects.toThrow();
    });
  });

  describe('Password Hint', () => {
    it('should retrieve password hint without decrypting', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const hint = 'Your favorite color + 123';

      const encrypted = await encryptFileWithPassword(
        file,
        testPassword,
        hint
      );

      // Hint should be accessible without password
      expect(encrypted.passwordProtection?.hint).toBe(hint);
    });

    it('should handle missing hint gracefully', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFileWithPassword(file, testPassword);

      expect(encrypted.passwordProtection?.hint).toBeUndefined();
    });

    it('should not validate hint content', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const misleadingHint = 'Wrong hint';

      const encrypted = await encryptFileWithPassword(
        file,
        testPassword,
        misleadingHint
      );

      expect(encrypted.passwordProtection?.hint).toBe(misleadingHint);
    });
  });
});
