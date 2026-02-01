/**
 * Empty File Edge Case Tests
 * Tests handling of zero-byte files across all modules
 */

import { describe, it, expect, vi } from 'vitest';
import { encryptFile } from '@/lib/crypto/file-encryption-pqc';
import { encryptFileWithPassword } from '@/lib/crypto/password-file-encryption';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

// Mock Sentry
vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock('@/lib/security/memory-wiper', () => ({
  secureWipeBuffer: vi.fn(),
}));

describe('Empty File Edge Cases', () => {
  describe('File Encryption', () => {
    it('should reject empty file for PQC encryption', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      await expect(encryptFile(emptyFile, key)).rejects.toThrow(
        'Cannot encrypt empty file'
      );
    });

    it('should reject empty file for password encryption', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });

      await expect(
        encryptFileWithPassword(emptyFile, 'password123')
      ).rejects.toThrow();
    });

    it('should reject zero-length ArrayBuffer', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const emptyFile = new File([emptyBuffer], 'empty.bin', {
        type: 'application/octet-stream',
      });
      const key = crypto.getRandomValues(new Uint8Array(32));

      await expect(encryptFile(emptyFile, key)).rejects.toThrow();
    });

    it('should reject file with size property 0', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      expect(file.size).toBe(0);

      const key = crypto.getRandomValues(new Uint8Array(32));

      await expect(encryptFile(file, key)).rejects.toThrow();
    });
  });

  describe('Data Encryption', () => {
    it('should handle empty Uint8Array encryption', async () => {
      const emptyData = new Uint8Array(0);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(emptyData, key);

      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce.length).toBe(12);

      const decrypted = await pqCrypto.decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        key
      );

      expect(decrypted).toEqual(emptyData);
    });

    it('should handle empty string encoding', async () => {
      const emptyString = '';
      const emptyData = new TextEncoder().encode(emptyString);
      const key = crypto.getRandomValues(new Uint8Array(32));

      expect(emptyData.length).toBe(0);

      const encrypted = await pqCrypto.encrypt(emptyData, key);
      const decrypted = await pqCrypto.decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        key
      );

      const decryptedString = new TextDecoder().decode(decrypted);
      expect(decryptedString).toBe(emptyString);
    });
  });

  describe('File Metadata', () => {
    it('should detect empty file from metadata', () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      expect(file.size).toBe(0);
      expect(file.name).toBe('empty.txt');
      expect(file.type).toBe('text/plain');
    });

    it('should handle empty filename', () => {
      const file = new File(['content'], '', { type: 'text/plain' });

      expect(file.name).toBe('');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should handle file with no type', () => {
      const file = new File([], 'file', { type: '' });

      expect(file.type).toBe('');
      expect(file.size).toBe(0);
    });
  });

  describe('Edge Case Variations', () => {
    it('should handle file with only whitespace', async () => {
      const file = new File(['   '], 'whitespace.txt', {
        type: 'text/plain',
      });

      expect(file.size).toBeGreaterThan(0); // Whitespace is content

      const key = crypto.getRandomValues(new Uint8Array(32));
      const encrypted = await encryptFile(file, key);

      expect(encrypted).toBeDefined();
      expect(encrypted.chunks.length).toBeGreaterThan(0);
    });

    it('should handle file with only newlines', async () => {
      const file = new File(['\n\n\n'], 'newlines.txt', {
        type: 'text/plain',
      });

      expect(file.size).toBeGreaterThan(0);

      const key = crypto.getRandomValues(new Uint8Array(32));
      const encrypted = await encryptFile(file, key);

      expect(encrypted).toBeDefined();
    });

    it('should handle file with single null byte', async () => {
      const file = new File([new Uint8Array([0x00])], 'null.bin', {
        type: 'application/octet-stream',
      });

      expect(file.size).toBe(1);

      const key = crypto.getRandomValues(new Uint8Array(32));
      const encrypted = await encryptFile(file, key);

      expect(encrypted.chunks.length).toBe(1);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle 1-byte file', async () => {
      const file = new File(['x'], 'tiny.txt', { type: 'text/plain' });

      expect(file.size).toBe(1);

      const key = crypto.getRandomValues(new Uint8Array(32));
      const encrypted = await encryptFile(file, key);

      expect(encrypted.metadata.originalSize).toBe(1);
      expect(encrypted.chunks.length).toBe(1);
    });

    it('should handle 2-byte file', async () => {
      const file = new File(['ab'], 'small.txt', { type: 'text/plain' });

      expect(file.size).toBe(2);

      const key = crypto.getRandomValues(new Uint8Array(32));
      const encrypted = await encryptFile(file, key);

      expect(encrypted.metadata.originalSize).toBe(2);
    });

    it('should distinguish between 0 and 1 byte', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      const tinyFile = new File(['x'], 'tiny.txt', { type: 'text/plain' });

      expect(emptyFile.size).toBe(0);
      expect(tinyFile.size).toBe(1);

      const key = crypto.getRandomValues(new Uint8Array(32));

      await expect(encryptFile(emptyFile, key)).rejects.toThrow();

      const encrypted = await encryptFile(tinyFile, key);
      expect(encrypted).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error for empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      try {
        await encryptFile(file, key);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Cannot encrypt empty file');
      }
    });

    it('should distinguish empty file from other errors', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      await expect(encryptFile(file, key)).rejects.toThrow(
        'Cannot encrypt empty file'
      );

      // Should not throw other generic errors
      await expect(encryptFile(file, key)).rejects.not.toThrow(
        'Invalid key'
      );
    });
  });

  describe('Consistency Checks', () => {
    it('should consistently reject empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      // Try multiple times
      for (let i = 0; i < 5; i++) {
        await expect(encryptFile(file, key)).rejects.toThrow();
      }
    });

    it('should handle empty file check before other validations', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const invalidKey = new Uint8Array(16); // Wrong size

      // Should fail on empty file, not invalid key
      try {
        await encryptFile(file, invalidKey);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        // Empty file check should come first
        expect(error.message).toContain('empty');
      }
    });
  });

  describe('Performance', () => {
    it('should reject empty file quickly', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const key = crypto.getRandomValues(new Uint8Array(32));

      const start = Date.now();

      try {
        await encryptFile(file, key);
      } catch (error) {
        // Expected
      }

      const duration = Date.now() - start;

      // Should fail immediately, not wait for timeout
      expect(duration).toBeLessThan(100);
    });
  });
});
