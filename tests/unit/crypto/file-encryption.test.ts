/**
 * File Encryption Tests
 * FILE-01 through FILE-04: PQC file encryption operations
 */
import { describe, it, expect } from 'vitest';
import { randomBytes as nodeRandomBytes } from 'crypto';
import { PQCryptoService } from '@/lib/crypto/pqc-crypto';

// We need to mock the File API since we're in node environment
function createMockFile(content: Uint8Array, name: string, type: string = 'application/octet-stream'): File {
  const buffer = new ArrayBuffer(content.byteLength);
  new Uint8Array(buffer).set(content);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

// Dynamic import to handle 'use client' directive
async function getFileEncryption() {
  const mod = await import('@/lib/crypto/file-encryption-pqc');
  return mod;
}

const crypto = PQCryptoService.getInstance();

describe('PQC File Encryption', () => {
  // FILE-01: Encrypt/decrypt roundtrip preserves file content
  describe('FILE-01: Encrypt/Decrypt Roundtrip', () => {
    it('preserves file content through encryption/decryption', async () => {
      const { encryptFile, decryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('Hello, encrypted world!');
      const file = createMockFile(content, 'test.txt', 'text/plain');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);
      const decryptedBlob = await decryptFile(encrypted, key);
      const decryptedData = new Uint8Array(await decryptedBlob.arrayBuffer());

      expect(decryptedData).toEqual(content);
    });

    it('preserves large file content (multi-chunk)', async () => {
      const { encryptFile, decryptFile } = await getFileEncryption();
      // Create a file larger than CHUNK_SIZE (64KB)
      // Use Node's randomBytes since Web Crypto limits to 65536 per call
      const content = new Uint8Array(nodeRandomBytes(200_000));
      const file = createMockFile(content, 'large-file.bin');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);

      expect(encrypted.chunks.length).toBeGreaterThan(1);

      const decryptedBlob = await decryptFile(encrypted, key);
      const decryptedData = new Uint8Array(await decryptedBlob.arrayBuffer());

      expect(decryptedData).toEqual(content);
    });
  });

  // FILE-02: Chunk integrity verification
  describe('FILE-02: Chunk Integrity', () => {
    it('detects tampered chunk data', async () => {
      const { encryptFile, decryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('integrity test data');
      const file = createMockFile(content, 'test.txt');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);

      // Tamper with the first chunk's hash
      encrypted.chunks[0]!.hash = crypto.randomBytes(32);

      await expect(decryptFile(encrypted, key)).rejects.toThrow('hash mismatch');
    });

    it('detects tampered file hash', async () => {
      const { encryptFile, decryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('file hash test');
      const file = createMockFile(content, 'test.txt');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);

      // Tamper with file-level hash
      encrypted.metadata.fileHash = crypto.randomBytes(32);

      // Should fail during decryption (AAD mismatch or file hash check)
      await expect(decryptFile(encrypted, key)).rejects.toThrow();
    });
  });

  // FILE-03: Filename encryption/decryption
  describe('FILE-03: Filename Privacy', () => {
    it('encrypts and decrypts filename', async () => {
      const { encryptFile, decryptFileName } = await getFileEncryption();
      const content = new TextEncoder().encode('test');
      const file = createMockFile(content, 'secret-document.pdf', 'application/pdf');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);

      // Original name should be empty (not leaked)
      expect(encrypted.metadata.originalName).toBe('');

      // Encrypted name should be present
      expect(encrypted.metadata.encryptedName).toBeTruthy();

      // Decrypt the name
      const decryptedName = await decryptFileName(encrypted, key);
      expect(decryptedName).toBe('secret-document.pdf');
    });

    it('returns generic name on decryption failure', async () => {
      const { encryptFile, decryptFileName } = await getFileEncryption();
      const content = new TextEncoder().encode('test');
      const file = createMockFile(content, 'test.txt', 'text/plain');
      const key = crypto.randomBytes(32);
      const wrongKey = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);
      const name = await decryptFileName(encrypted, wrongKey);

      // Should return generic name based on mime category
      expect(name).toMatch(/^file\./);
    });
  });

  // FILE-04: MIME type categorization
  describe('FILE-04: MIME Categorization', () => {
    it('categorizes image types', async () => {
      const { encryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('fake image');
      const file = createMockFile(content, 'photo.jpg', 'image/jpeg');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);
      expect(encrypted.metadata.mimeCategory).toBe('image');
    });

    it('categorizes video types', async () => {
      const { encryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('fake video');
      const file = createMockFile(content, 'video.mp4', 'video/mp4');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);
      expect(encrypted.metadata.mimeCategory).toBe('video');
    });

    it('categorizes application as document', async () => {
      const { encryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('fake pdf');
      const file = createMockFile(content, 'doc.pdf', 'application/pdf');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);
      expect(encrypted.metadata.mimeCategory).toBe('document');
    });

    it('handles unknown MIME types', async () => {
      const { encryptFile } = await getFileEncryption();
      const content = new TextEncoder().encode('unknown');
      const file = createMockFile(content, 'file.xyz', '');
      const key = crypto.randomBytes(32);

      const encrypted = await encryptFile(file, key);
      expect(encrypted.metadata.mimeCategory).toBe('unknown');
    });
  });
});
