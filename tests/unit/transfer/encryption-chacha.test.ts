import { describe, it, expect } from 'vitest';
import {
  encryptChaCha,
  decryptChaCha,
  generateChaChaKey,
} from '@/lib/transfer/encryption';

describe('ChaCha20-Poly1305 Encryption', () => {
  describe('Key Generation', () => {
    it('should generate 32-byte key', () => {
      const key = generateChaChaKey();

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const key1 = generateChaChaKey();
      const key2 = generateChaChaKey();

      expect(key1).not.toEqual(key2);
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const key = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Hello, ChaCha20!');

      // Encrypt
      const { ciphertext, nonce } = await encryptChaCha(plaintext.buffer, key);

      expect(ciphertext).toBeInstanceOf(Uint8Array);
      expect(ciphertext.length).toBeGreaterThan(plaintext.length); // Includes auth tag
      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);

      // Decrypt
      const decrypted = await decryptChaCha(ciphertext, key, nonce);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBe('Hello, ChaCha20!');
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const key = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Same message');

      const result1 = await encryptChaCha(plaintext.buffer, key);
      const result2 = await encryptChaCha(plaintext.buffer, key);

      // Different nonces = different ciphertexts
      expect(result1.nonce).not.toEqual(result2.nonce);
      expect(result1.ciphertext).not.toEqual(result2.ciphertext);
    });

    it('should handle empty data', async () => {
      const key = generateChaChaKey();
      const plaintext = new Uint8Array(0);

      const { ciphertext, nonce } = await encryptChaCha(plaintext.buffer, key);
      const decrypted = await decryptChaCha(ciphertext, key, nonce);

      expect(decrypted.length).toBe(0);
    });

    it('should handle large data', async () => {
      const key = generateChaChaKey();
      const plaintext = new Uint8Array(1024 * 1024); // 1MB
      // Fill in chunks due to 65KB limit on crypto.getRandomValues
      const chunkSize = 65536;
      for (let offset = 0; offset < plaintext.length; offset += chunkSize) {
        const chunk = plaintext.subarray(offset, Math.min(offset + chunkSize, plaintext.length));
        crypto.getRandomValues(chunk);
      }

      const { ciphertext, nonce } = await encryptChaCha(plaintext.buffer, key);
      const decrypted = await decryptChaCha(ciphertext, key, nonce);

      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('Authentication', () => {
    it('should fail on tampered ciphertext', async () => {
      const key = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Secure message');

      const { ciphertext, nonce } = await encryptChaCha(plaintext.buffer, key);

      // Tamper with ciphertext
      ciphertext[0] = ciphertext[0]! ^ 0xFF;

      await expect(decryptChaCha(ciphertext, key, nonce)).rejects.toThrow(
        'authentication tag mismatch'
      );
    });

    it('should fail with wrong key', async () => {
      const key1 = generateChaChaKey();
      const key2 = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Secret');

      const { ciphertext, nonce } = await encryptChaCha(plaintext.buffer, key1);

      await expect(decryptChaCha(ciphertext, key2, nonce)).rejects.toThrow(
        'authentication tag mismatch'
      );
    });

    it('should fail with wrong nonce', async () => {
      const key = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Message');

      const { ciphertext } = await encryptChaCha(plaintext.buffer, key);
      const wrongNonce = new Uint8Array(12);
      crypto.getRandomValues(wrongNonce);

      await expect(decryptChaCha(ciphertext, key, wrongNonce)).rejects.toThrow(
        'authentication tag mismatch'
      );
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid key length for encryption', async () => {
      const invalidKey = new Uint8Array(16); // Wrong size
      const plaintext = new TextEncoder().encode('Test');

      await expect(encryptChaCha(plaintext.buffer, invalidKey)).rejects.toThrow(
        'ChaCha20 key must be 32 bytes'
      );
    });

    it('should reject invalid key length for decryption', async () => {
      const invalidKey = new Uint8Array(16);
      const ciphertext = new Uint8Array(32);
      const nonce = new Uint8Array(12);

      await expect(decryptChaCha(ciphertext, invalidKey, nonce)).rejects.toThrow(
        'ChaCha20 key must be 32 bytes'
      );
    });

    it('should reject invalid nonce length', async () => {
      const key = generateChaChaKey();
      const ciphertext = new Uint8Array(32);
      const invalidNonce = new Uint8Array(16); // Wrong size

      await expect(decryptChaCha(ciphertext, key, invalidNonce)).rejects.toThrow(
        'ChaCha20 nonce must be 12 bytes'
      );
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt in reasonable time', async () => {
      const key = generateChaChaKey();
      const plaintext = new Uint8Array(1024 * 100); // 100KB
      // Fill in chunks due to 65KB limit
      const chunkSize = 65536;
      for (let offset = 0; offset < plaintext.length; offset += chunkSize) {
        const chunk = plaintext.subarray(offset, Math.min(offset + chunkSize, plaintext.length));
        crypto.getRandomValues(chunk);
      }

      const startEncrypt = performance.now();
      const { ciphertext, nonce } = await encryptChaCha(plaintext.buffer, key);
      const encryptTime = performance.now() - startEncrypt;

      const startDecrypt = performance.now();
      await decryptChaCha(ciphertext, key, nonce);
      const decryptTime = performance.now() - startDecrypt;

      // Should complete within 100ms for 100KB
      expect(encryptTime).toBeLessThan(100);
      expect(decryptTime).toBeLessThan(100);
    });
  });

  describe('Interoperability', () => {
    it('should produce ciphertext with proper structure', async () => {
      const key = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Test message');

      const { ciphertext } = await encryptChaCha(plaintext.buffer, key);

      // ChaCha20-Poly1305 adds 16-byte Poly1305 tag
      expect(ciphertext.length).toBe(plaintext.length + 16);
    });

    it('should use 96-bit nonces', async () => {
      const key = generateChaChaKey();
      const plaintext = new TextEncoder().encode('Test');

      const { nonce } = await encryptChaCha(plaintext.buffer, key);

      expect(nonce.length).toBe(12); // 96 bits
    });
  });
});
