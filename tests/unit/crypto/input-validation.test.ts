/**
 * Input Validation Tests
 * VALID-01 through VALID-03: Validates security hardening input checks
 */
import { describe, it, expect } from 'vitest';
import { PQCryptoService } from '@/lib/crypto/pqc-crypto';

const crypto = PQCryptoService.getInstance();

// Dynamic import for file encryption
async function getFileEncryption() {
  return await import('@/lib/crypto/file-encryption-pqc');
}

function createMockFile(content: Uint8Array, name: string): File {
  const buffer = new ArrayBuffer(content.byteLength);
  new Uint8Array(buffer).set(content);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  return new File([blob], name);
}

describe('Input Validation', () => {
  // VALID-01: Encryption rejects invalid inputs
  describe('VALID-01: Encryption Input Validation', () => {
    it('rejects non-32-byte encryption key', async () => {
      const plaintext = new TextEncoder().encode('test');
      const shortKey = crypto.randomBytes(16);

      await expect(crypto.encrypt(plaintext, shortKey)).rejects.toThrow('32 bytes');
    });

    it('rejects non-32-byte decryption key', async () => {
      const plaintext = new TextEncoder().encode('test');
      const key = crypto.randomBytes(32);
      const encrypted = await crypto.encrypt(plaintext, key);

      const wrongSizeKey = crypto.randomBytes(16);
      await expect(crypto.decrypt(encrypted, wrongSizeKey)).rejects.toThrow('32 bytes');
    });

    it('rejects empty plaintext', async () => {
      const emptyPlaintext = new Uint8Array(0);
      const key = crypto.randomBytes(32);

      await expect(crypto.encrypt(emptyPlaintext, key)).rejects.toThrow('empty');
    });
  });

  // VALID-02: Encapsulation rejects invalid keys
  describe('VALID-02: Encapsulation Input Validation', () => {
    it('rejects Kyber public key with wrong length', async () => {
      const invalidPublicKey = {
        kyberPublicKey: crypto.randomBytes(100), // Should be 1184
        x25519PublicKey: crypto.randomBytes(32),
      };

      await expect(crypto.encapsulate(invalidPublicKey)).rejects.toThrow('1184 bytes');
    });

    it('rejects X25519 public key with wrong length', async () => {
      const keyPair = await crypto.generateHybridKeypair();
      const invalidPublicKey = {
        kyberPublicKey: keyPair.kyber.publicKey,
        x25519PublicKey: crypto.randomBytes(16), // Should be 32
      };

      await expect(crypto.encapsulate(invalidPublicKey)).rejects.toThrow('32 bytes');
    });
  });

  // VALID-03: File size limits
  describe('VALID-03: File Size Limits', () => {
    it('rejects empty files', async () => {
      const { encryptFile } = await getFileEncryption();
      const emptyFile = createMockFile(new Uint8Array(0), 'empty.txt');
      const key = crypto.randomBytes(32);

      await expect(encryptFile(emptyFile, key)).rejects.toThrow('empty file');
    });

    it('accepts files of any size (no size limit)', async () => {
      const { encryptFile } = await getFileEncryption();
      const key = crypto.randomBytes(32);

      // A file with content should encrypt regardless of reported size
      const content = new Uint8Array(1);
      const file = createMockFile(content, 'huge.bin');
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 * 1024 });

      const result = await encryptFile(file, key);
      expect(result.metadata.originalSize).toBe(5 * 1024 * 1024 * 1024);
    });
  });

  // Additional: Serialization validation
  describe('Serialization Input Validation', () => {
    it('rejects empty Kyber key for serialization', () => {
      const invalidKey = {
        kyberPublicKey: new Uint8Array(0),
        x25519PublicKey: crypto.randomBytes(32),
      };

      expect(() => crypto.serializePublicKey(invalidKey)).toThrow('Invalid Kyber');
    });

    it('rejects wrong-size X25519 key for serialization', () => {
      const invalidKey = {
        kyberPublicKey: crypto.randomBytes(1184),
        x25519PublicKey: crypto.randomBytes(16), // Should be 32
      };

      expect(() => crypto.serializePublicKey(invalidKey)).toThrow('32 bytes');
    });
  });
});
