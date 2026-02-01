/**
 * Post-Quantum File Encryption Tests
 * Tests file encryption/decryption with PQC enhancements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptFile,
  decryptFile,
  type EncryptedFile,
  type EncryptedFileMetadata,
} from '@/lib/crypto/file-encryption-pqc';

// Mock Sentry
vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('PQC File Encryption', () => {
  let encryptionKey: Uint8Array;

  beforeEach(() => {
    encryptionKey = crypto.getRandomValues(new Uint8Array(32));
  });

  describe('File Encryption', () => {
    it('should encrypt file and produce valid structure', async () => {
      const content = 'Test file content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted).toBeDefined();
      expect(encrypted.metadata).toBeDefined();
      expect(encrypted.chunks).toBeDefined();
      expect(encrypted.chunks.length).toBeGreaterThan(0);
    });

    it('should encrypt filename for privacy', async () => {
      const file = new File(['content'], 'sensitive-name.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      // Encrypted name should be base64-encoded and not contain original name
      expect(encrypted.metadata.encryptedName).toBeDefined();
      expect(encrypted.metadata.encryptedName).not.toContain('sensitive-name');
      expect(encrypted.metadata.originalName).toBe(''); // Should be empty in transmission
    });

    it('should categorize MIME type to reduce fingerprinting', async () => {
      const files = [
        { file: new File([''], 'test.jpg', { type: 'image/jpeg' }), category: 'image' },
        { file: new File([''], 'test.mp4', { type: 'video/mp4' }), category: 'video' },
        { file: new File([''], 'test.mp3', { type: 'audio/mp3' }), category: 'audio' },
        { file: new File([''], 'test.txt', { type: 'text/plain' }), category: 'text' },
        { file: new File([''], 'test.pdf', { type: 'application/pdf' }), category: 'document' },
      ];

      for (const { file, category } of files) {
        const encrypted = await encryptFile(file, encryptionKey);
        expect(encrypted.metadata.mimeCategory).toBe(category);
      }
    });

    it('should store original file size', async () => {
      const content = 'x'.repeat(1000);
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.originalSize).toBe(1000);
    });

    it('should compute file hash', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.fileHash).toBeInstanceOf(Uint8Array);
      expect(encrypted.metadata.fileHash.length).toBe(32); // SHA-256
    });

    it('should chunk large files', async () => {
      const size = 200 * 1024; // 200KB (should create multiple 64KB chunks)
      const content = 'x'.repeat(size);
      const file = new File([content], 'large.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.chunks.length).toBeGreaterThan(1);
      expect(encrypted.metadata.totalChunks).toBe(encrypted.chunks.length);
    });

    it('should throw error for empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      await expect(encryptFile(file, encryptionKey)).rejects.toThrow(
        'Cannot encrypt empty file'
      );
    });

    it('should assign sequential indices to chunks', async () => {
      const content = 'x'.repeat(200 * 1024);
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      encrypted.chunks.forEach((chunk, i) => {
        expect(chunk.index).toBe(i);
      });
    });

    it('should compute hash for each chunk', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      encrypted.chunks.forEach(chunk => {
        expect(chunk.hash).toBeInstanceOf(Uint8Array);
        expect(chunk.hash.length).toBe(32);
      });
    });

    it('should include nonce with each chunk', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      encrypted.chunks.forEach(chunk => {
        expect(chunk.nonce).toBeInstanceOf(Uint8Array);
        expect(chunk.nonce.length).toBe(12); // AES-GCM nonce
      });
    });

    it('should use unique nonces for each chunk', async () => {
      const content = 'x'.repeat(200 * 1024);
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      const nonces = new Set<string>();
      encrypted.chunks.forEach(chunk => {
        const nonceStr = Array.from(chunk.nonce).join(',');
        nonces.add(nonceStr);
      });

      expect(nonces.size).toBe(encrypted.chunks.length);
    });
  });

  describe('File Decryption', () => {
    it('should decrypt file correctly', async () => {
      const content = 'Test file content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);

      expect(decrypted).toBeInstanceOf(Blob);
      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should decrypt filename', async () => {
      const originalName = 'sensitive-file.txt';
      const file = new File(['content'], originalName, { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);
      const decryptedName = await decryptFile(encrypted, encryptionKey, true);

      // Decrypted filename should match original
      expect(typeof decryptedName).toBe('string');
      expect(decryptedName).toBe(originalName);
    });

    it('should fail with wrong key', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const wrongKey = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await encryptFile(file, encryptionKey);

      await expect(decryptFile(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should fail with tampered chunks', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      // Tamper with a chunk
      encrypted.chunks[0].data[0] ^= 0xff;

      await expect(decryptFile(encrypted, encryptionKey)).rejects.toThrow();
    });

    it('should verify chunk hashes', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      // Corrupt chunk hash
      encrypted.chunks[0].hash[0] ^= 0xff;

      await expect(decryptFile(encrypted, encryptionKey)).rejects.toThrow();
    });

    it('should handle missing chunks', async () => {
      const content = 'x'.repeat(200 * 1024);
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      // Remove a chunk
      encrypted.chunks.pop();

      await expect(decryptFile(encrypted, encryptionKey)).rejects.toThrow();
    });

    it('should handle out-of-order chunks', async () => {
      const content = 'x'.repeat(200 * 1024);
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      // Shuffle chunks
      const [chunk0, chunk1] = encrypted.chunks;
      encrypted.chunks[0] = chunk1;
      encrypted.chunks[1] = chunk0;

      await expect(decryptFile(encrypted, encryptionKey)).rejects.toThrow();
    });
  });

  describe('Round-Trip Encryption', () => {
    it('should preserve text file content', async () => {
      const content = 'Hello, World!\nThis is a test file.';
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);

      const decryptedText = await decrypted.text();
      expect(decryptedText).toBe(content);
    });

    it('should preserve binary file content', async () => {
      const content = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const file = new File([content], 'test.png', { type: 'image/png' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);

      const decryptedBuffer = await decrypted.arrayBuffer();
      const decryptedBytes = new Uint8Array(decryptedBuffer);

      expect(decryptedBytes).toEqual(content);
    });

    it('should preserve large files', async () => {
      const size = 500 * 1024; // 500KB
      const content = crypto.getRandomValues(new Uint8Array(size));
      const file = new File([content], 'large.bin', {
        type: 'application/octet-stream',
      });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);

      const decryptedBuffer = await decrypted.arrayBuffer();
      const decryptedBytes = new Uint8Array(decryptedBuffer);

      expect(decryptedBytes).toEqual(content);
    }, 30000);

    it('should preserve Unicode filenames', async () => {
      const filename = '测试文件.txt';
      const file = new File(['content'], filename, { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decryptedName = await decryptFile(encrypted, encryptionKey, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle special characters in filename', async () => {
      const filename = 'file (copy) [1].txt';
      const file = new File(['content'], filename, { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decryptedName = await decryptFile(encrypted, encryptionKey, true);

      expect(decryptedName).toBe(filename);
    });
  });

  describe('Metadata Handling', () => {
    it('should include timestamp', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const beforeEncryption = Date.now();

      const encrypted = await encryptFile(file, encryptionKey);

      const afterEncryption = Date.now();

      expect(encrypted.metadata.encryptedAt).toBeGreaterThanOrEqual(
        beforeEncryption
      );
      expect(encrypted.metadata.encryptedAt).toBeLessThanOrEqual(
        afterEncryption
      );
    });

    it('should not expose original MIME type', async () => {
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      // Should only expose category, not full MIME type
      expect(encrypted.metadata.mimeCategory).toBe('document');
    });

    it('should handle unknown MIME types', async () => {
      const file = new File(['content'], 'test.xyz', {
        type: 'application/x-unknown',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.metadata.mimeCategory).toBe('unknown');
    });
  });

  describe('Performance', () => {
    it('should encrypt small files quickly', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const start = Date.now();
      await encryptFile(file, encryptionKey);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should decrypt small files quickly', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      const start = Date.now();
      await decryptFile(encrypted, encryptionKey);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle moderate-size files efficiently', async () => {
      const size = 1024 * 1024; // 1MB
      const content = new Uint8Array(size);
      const file = new File([content], 'test.bin', {
        type: 'application/octet-stream',
      });

      const start = Date.now();
      const encrypted = await encryptFile(file, encryptionKey);
      await decryptFile(encrypted, encryptionKey);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    }, 30000);
  });

  describe('Edge Cases', () => {
    it('should handle file with 1 byte', async () => {
      const file = new File(['x'], 'tiny.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);

      const text = await decrypted.text();
      expect(text).toBe('x');
    });

    it('should handle file exactly at chunk boundary', async () => {
      const size = 64 * 1024; // Exactly 1 chunk
      const content = 'x'.repeat(size);
      const file = new File([content], 'exact.txt', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);

      expect(encrypted.chunks.length).toBe(1);
      expect(encrypted.metadata.totalChunks).toBe(1);

      const decrypted = await decryptFile(encrypted, encryptionKey);
      const text = await decrypted.text();
      expect(text).toBe(content);
    });

    it('should handle filename with no extension', async () => {
      const file = new File(['content'], 'README', { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decryptedName = await decryptFile(encrypted, encryptionKey, true);

      expect(decryptedName).toBe('README');
    });

    it('should handle very long filename', async () => {
      const filename = 'a'.repeat(255) + '.txt';
      const file = new File(['content'], filename, { type: 'text/plain' });

      const encrypted = await encryptFile(file, encryptionKey);
      const decryptedName = await decryptFile(encrypted, encryptionKey, true);

      expect(decryptedName).toBe(filename);
    });

    it('should handle file with null bytes', async () => {
      const content = new Uint8Array([0x00, 0x01, 0x00, 0x02]);
      const file = new File([content], 'binary.bin', {
        type: 'application/octet-stream',
      });

      const encrypted = await encryptFile(file, encryptionKey);
      const decrypted = await decryptFile(encrypted, encryptionKey);

      const buffer = await decrypted.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      expect(bytes).toEqual(content);
    });
  });

  describe('Security Properties', () => {
    it('should produce different ciphertexts for same file', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const encrypted1 = await encryptFile(file, encryptionKey);
      const encrypted2 = await encryptFile(file, encryptionKey);

      // Encrypted names should be different (different nonces)
      expect(encrypted1.metadata.encryptedName).not.toBe(
        encrypted2.metadata.encryptedName
      );

      // Chunk data should be different
      expect(encrypted1.chunks[0].data).not.toEqual(
        encrypted2.chunks[0].data
      );
    });

    it('should not leak filename in metadata', async () => {
      const sensitiveFilename = 'social-security-123-45-6789.pdf';
      const file = new File(['content'], sensitiveFilename, {
        type: 'application/pdf',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      // Verify filename is not present in any metadata field
      const metadataStr = JSON.stringify(encrypted.metadata);
      expect(metadataStr.toLowerCase()).not.toContain('social');
      expect(metadataStr.toLowerCase()).not.toContain('security');
    });

    it('should not leak file content in metadata', async () => {
      const sensitiveContent = 'API_KEY=sk_live_abc123';
      const file = new File([sensitiveContent], 'config.txt', {
        type: 'text/plain',
      });

      const encrypted = await encryptFile(file, encryptionKey);

      const metadataStr = JSON.stringify(encrypted.metadata);
      expect(metadataStr).not.toContain('API_KEY');
      expect(metadataStr).not.toContain('abc123');
    });
  });
});
