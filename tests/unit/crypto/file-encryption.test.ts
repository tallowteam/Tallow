/**
 * Unit Tests for Post-Quantum File Encryption Module
 * Tests file encryption/decryption, password protection, chunking,
 * and error handling with various file sizes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptFile,
  decryptFile,
  encryptFileWithPassword,
  decryptFileWithPassword,
  decryptFileName,
  EncryptedFile
} from '@/lib/crypto/file-encryption-pqc';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

describe('File Encryption (PQC)', () => {
  let encryptionKey: Uint8Array;

  beforeEach(() => {
    // Generate fresh encryption key for each test
    encryptionKey = pqCrypto.randomBytes(32);
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt a simple text file', async () => {
      const originalText = 'Hello, secure world!';
      const file = new File([originalText], 'test.txt', { type: 'text/plain' });

      // Encrypt
      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted).toBeDefined();
      expect(encrypted.metadata).toBeDefined();
      expect(encrypted.chunks).toBeDefined();
      expect(encrypted.chunks.length).toBeGreaterThan(0);

      // Decrypt
      const decryptedBlob = await decryptFile(encrypted, encryptionKey);
      const decryptedText = await decryptedBlob.text();

      expect(decryptedText).toBe(originalText);
    });

    it('should preserve file size information', async () => {
      const data = new Uint8Array(1000).fill(42);
      const file = new File([data], 'data.bin', { type: 'application/octet-stream' });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.originalSize).toBe(1000);

      const decrypted = await decryptFile(encrypted, encryptionKey);
      expect(decrypted.size).toBe(1000);
    });

    it('should categorize MIME types for privacy', async () => {
      const testCases = [
        { type: 'image/png', expected: 'image' },
        { type: 'image/jpeg', expected: 'image' },
        { type: 'video/mp4', expected: 'video' },
        { type: 'audio/mpeg', expected: 'audio' },
        { type: 'text/plain', expected: 'text' },
        { type: 'application/pdf', expected: 'document' },
        { type: 'application/json', expected: 'document' },
        { type: 'unknown/type', expected: 'unknown' },
      ];

      for (const { type, expected } of testCases) {
        const file = new File(['test'], 'file', { type });
        const encrypted = await encryptFile(file, encryptionKey);
        expect(encrypted.metadata.mimeCategory).toBe(expected);
      }
    });

    it('should encrypt filename for privacy', async () => {
      const sensitiveFilename = 'my-secret-document.pdf';
      const file = new File(['content'], sensitiveFilename, { type: 'application/pdf' });

      const encrypted = await encryptFile(file, encryptionKey);

      // Filename should be encrypted (base64 encoded)
      expect(encrypted.metadata.encryptedName).toBeDefined();
      expect(encrypted.metadata.encryptedName.length).toBeGreaterThan(0);
      expect(encrypted.metadata.encryptedName).not.toContain(sensitiveFilename);

      // originalName should be empty for transmission
      expect(encrypted.metadata.originalName).toBe('');
    });

    it('should decrypt filename correctly', async () => {
      const originalFilename = 'my-document.pdf';
      const file = new File(['content'], originalFilename, { type: 'application/pdf' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decryptedFilename = await decryptFileName(encrypted, encryptionKey);

      expect(decryptedFilename).toBe(originalFilename);
    });

    it('should return generic filename when decryption fails', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const encrypted = await encryptFile(file, encryptionKey);

      // Try to decrypt with wrong key
      const wrongKey = pqCrypto.randomBytes(32);
      const decryptedFilename = await decryptFileName(encrypted, wrongKey);

      // Should return generic filename based on mime category
      expect(decryptedFilename).toMatch(/file\.\w+/);
    });
  });

  describe('File Size Handling', () => {
    it('should handle empty file rejection', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });

      await expect(encryptFile(emptyFile, encryptionKey))
        .rejects.toThrow('Cannot encrypt empty file');
    });

    it('should handle small files (< chunk size)', async () => {
      const smallData = new Uint8Array(100).fill(1);
      const file = new File([smallData], 'small.bin');

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.totalChunks).toBe(1);
      expect(encrypted.chunks.length).toBe(1);

      const decrypted = await decryptFile(encrypted, encryptionKey);
      const decryptedData = new Uint8Array(await decrypted.arrayBuffer());

      expect(decryptedData).toEqual(smallData);
    });

    it('should handle medium files (1 chunk)', async () => {
      const mediumSize = 32 * 1024; // 32KB
      const mediumData = new Uint8Array(mediumSize);
      for (let i = 0; i < mediumSize; i++) {
        mediumData[i] = i % 256;
      }
      const file = new File([mediumData], 'medium.bin');

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.totalChunks).toBe(1);
      expect(encrypted.chunks.length).toBe(1);

      const decrypted = await decryptFile(encrypted, encryptionKey);
      const decryptedData = new Uint8Array(await decrypted.arrayBuffer());

      expect(decryptedData).toEqual(mediumData);
    });

    it('should handle large files (multiple chunks)', async () => {
      const largeSize = 200 * 1024; // 200KB (multiple chunks)
      const largeData = new Uint8Array(largeSize);
      for (let i = 0; i < largeSize; i++) {
        largeData[i] = (i * 7) % 256;
      }
      const file = new File([largeData], 'large.bin');

      const encrypted = await encryptFile(file, encryptionKey);

      // Should be split into multiple chunks (64KB chunks)
      const expectedChunks = Math.ceil(largeSize / (64 * 1024));
      expect(encrypted.metadata.totalChunks).toBe(expectedChunks);
      expect(encrypted.chunks.length).toBe(expectedChunks);

      // Each chunk should have proper metadata
      encrypted.chunks.forEach((chunk, index) => {
        expect(chunk.index).toBe(index);
        expect(chunk.data).toBeDefined();
        expect(chunk.nonce).toBeDefined();
        expect(chunk.hash).toBeDefined();
      });

      const decrypted = await decryptFile(encrypted, encryptionKey);
      const decryptedData = new Uint8Array(await decrypted.arrayBuffer());

      expect(decryptedData).toEqual(largeData);
    });

    it('should handle exact chunk boundary', async () => {
      const chunkSize = 64 * 1024;
      const exactData = new Uint8Array(chunkSize * 2); // Exactly 2 chunks
      for (let i = 0; i < exactData.length; i++) {
        exactData[i] = i % 256;
      }
      const file = new File([exactData], 'exact.bin');

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.totalChunks).toBe(2);
      expect(encrypted.chunks.length).toBe(2);

      const decrypted = await decryptFile(encrypted, encryptionKey);
      const decryptedData = new Uint8Array(await decrypted.arrayBuffer());

      expect(decryptedData).toEqual(exactData);
    });
  });

  describe('Password-Based Encryption', () => {
    it('should encrypt and decrypt with password', async () => {
      const password = 'my-secure-password-123';
      const fileData = 'Sensitive information';
      const file = new File([fileData], 'secret.txt', { type: 'text/plain' });

      // Encrypt with password
      const encrypted = await encryptFileWithPassword(file, password);

      expect(encrypted.metadata.salt).toBeDefined();
      expect(encrypted.metadata.salt?.length).toBe(32);

      // Decrypt with same password
      const decrypted = await decryptFileWithPassword(encrypted, password);
      const decryptedText = await decrypted.text();

      expect(decryptedText).toBe(fileData);
    });

    it('should reject empty password', async () => {
      const file = new File(['data'], 'file.txt');

      await expect(encryptFileWithPassword(file, ''))
        .rejects.toThrow('Password must not be empty');

      const encrypted = await encryptFileWithPassword(file, 'valid-password');

      await expect(decryptFileWithPassword(encrypted, ''))
        .rejects.toThrow('Password must not be empty');
    });

    it('should fail decryption with wrong password', async () => {
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';
      const file = new File(['secret data'], 'file.txt');

      const encrypted = await encryptFileWithPassword(file, correctPassword);

      await expect(decryptFileWithPassword(encrypted, wrongPassword))
        .rejects.toThrow(/incorrect password|hash mismatch/i);
    });

    it('should use different salts for each encryption', async () => {
      const password = 'same-password';
      const file = new File(['data'], 'file.txt');

      const encrypted1 = await encryptFileWithPassword(file, password);
      const encrypted2 = await encryptFileWithPassword(file, password);

      // Salts should be different
      expect(encrypted1.metadata.salt).not.toEqual(encrypted2.metadata.salt);

      // Both should decrypt correctly
      const decrypted1 = await decryptFileWithPassword(encrypted1, password);
      const decrypted2 = await decryptFileWithPassword(encrypted2, password);

      const text1 = await decrypted1.text();
      const text2 = await decrypted2.text();

      expect(text1).toBe('data');
      expect(text2).toBe('data');
    });

    it('should fail when salt is missing', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFileWithPassword(file, 'password');

      // Remove salt
      encrypted.metadata.salt = undefined;

      await expect(decryptFileWithPassword(encrypted, 'password'))
        .rejects.toThrow('Invalid or missing salt');
    });

    it('should fail when salt is invalid', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFileWithPassword(file, 'password');

      // Invalid salt (wrong length)
      encrypted.metadata.salt = new Uint8Array(16);

      await expect(decryptFileWithPassword(encrypted, 'password'))
        .rejects.toThrow('Invalid or missing salt');
    });
  });

  describe('Error Handling', () => {
    it('should fail decryption with wrong key', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      const wrongKey = pqCrypto.randomBytes(32);

      await expect(decryptFile(encrypted, wrongKey))
        .rejects.toThrow();
    });

    it('should detect chunk corruption', async () => {
      const file = new File(['important data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      // Corrupt first chunk data
      encrypted.chunks[0]!.data[0] = encrypted.chunks[0]!.data[0]! ^ 0xFF;

      await expect(decryptFile(encrypted, encryptionKey))
        .rejects.toThrow(/hash mismatch|corrupted/i);
    });

    it('should detect missing metadata', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      // Remove metadata
      (encrypted as any).metadata = null;

      await expect(decryptFile(encrypted, encryptionKey))
        .rejects.toThrow('Invalid encrypted file');
    });

    it('should detect chunk count mismatch', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      // Remove a chunk
      encrypted.chunks.pop();

      await expect(decryptFile(encrypted, encryptionKey))
        .rejects.toThrow(/chunk count mismatch/i);
    });

    it('should detect file hash mismatch', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      // Tamper with file hash
      encrypted.metadata.fileHash[0] = encrypted.metadata.fileHash[0]! ^ 0xFF;

      await expect(decryptFile(encrypted, encryptionKey))
        .rejects.toThrow(/hash mismatch|corrupted/i);
    });

    it('should detect size mismatch', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      // Tamper with size
      encrypted.metadata.originalSize = 9999;

      await expect(decryptFile(encrypted, encryptionKey))
        .rejects.toThrow(/size mismatch/i);
    });

    it('should validate encryption key length', async () => {
      const file = new File(['data'], 'file.txt');
      const shortKey = new Uint8Array(16); // Wrong length

      await expect(encryptFile(file, shortKey))
        .rejects.toThrow('Encryption key must be 32 bytes');
    });

    it('should validate decryption key length', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      const shortKey = new Uint8Array(16); // Wrong length

      await expect(decryptFile(encrypted, shortKey))
        .rejects.toThrow('Decryption key must be 32 bytes');
    });
  });

  describe('Chunk Integrity', () => {
    it('should include chunk hash for integrity', async () => {
      const file = new File(['test data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      for (const chunk of encrypted.chunks) {
        expect(chunk.hash).toBeDefined();
        expect(chunk.hash.length).toBe(32); // SHA-256 hash
      }
    });

    it('should include nonce for each chunk', async () => {
      const file = new File(['test data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      for (const chunk of encrypted.chunks) {
        expect(chunk.nonce).toBeDefined();
        expect(chunk.nonce.length).toBeGreaterThan(0);
      }

      // Nonces should be unique
      if (encrypted.chunks.length > 1) {
        expect(encrypted.chunks[0]!.nonce).not.toEqual(encrypted.chunks[1]!.nonce);
      }
    });

    it('should include chunk index', async () => {
      const largeData = new Uint8Array(200 * 1024).fill(1);
      const file = new File([largeData], 'large.bin');
      const encrypted = await encryptFile(file, encryptionKey);

      encrypted.chunks.forEach((chunk, index) => {
        expect(chunk.index).toBe(index);
      });
    });
  });

  describe('Metadata Security', () => {
    it('should include file hash in metadata', async () => {
      const file = new File(['data'], 'file.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.fileHash).toBeDefined();
      expect(encrypted.metadata.fileHash.length).toBe(32); // SHA-256
    });

    it('should include timestamp', async () => {
      const file = new File(['data'], 'file.txt');
      const before = Date.now();
      const encrypted = await encryptFile(file, encryptionKey);
      const after = Date.now();

      expect(encrypted.metadata.encryptedAt).toBeGreaterThanOrEqual(before);
      expect(encrypted.metadata.encryptedAt).toBeLessThanOrEqual(after);
    });

    it('should clear original filename for transmission', async () => {
      const file = new File(['data'], 'sensitive-filename.txt');
      const encrypted = await encryptFile(file, encryptionKey);

      // originalName should be empty string (not leaked)
      expect(encrypted.metadata.originalName).toBe('');
    });
  });

  describe('Binary Data Handling', () => {
    it('should handle various byte patterns', async () => {
      const testPatterns = [
        new Uint8Array([0, 0, 0, 0]), // All zeros
        new Uint8Array([255, 255, 255, 255]), // All ones
        new Uint8Array([0, 255, 0, 255]), // Alternating
        new Uint8Array([1, 2, 3, 4, 5]), // Sequential
      ];

      for (const pattern of testPatterns) {
        const file = new File([pattern], 'pattern.bin');
        const encrypted = await encryptFile(file, encryptionKey);
        const decrypted = await decryptFile(encrypted, encryptionKey);
        const decryptedData = new Uint8Array(await decrypted.arrayBuffer());

        expect(decryptedData).toEqual(pattern);
      }
    });

    it('should preserve exact binary content', async () => {
      // Create binary data with all possible byte values
      const binaryData = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        binaryData[i] = i;
      }

      const file = new File([binaryData], 'binary.bin');
      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);
      const decryptedData = new Uint8Array(await decrypted.arrayBuffer());

      expect(decryptedData).toEqual(binaryData);
    });
  });
});
