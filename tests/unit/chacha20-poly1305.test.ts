import { describe, it, expect } from 'vitest';
import {
  chaCha20Encrypt,
  chaCha20Decrypt,
  generateChaCha20Key,
  encryptString,
  decryptString,
  serializeChaCha20Data,
  deserializeChaCha20Data,
  chaCha20Service,
} from '@/lib/crypto/chacha20-poly1305';

describe('ChaCha20-Poly1305 Encryption', () => {
  describe('Key Generation', () => {
    it('should generate 256-bit key', () => {
      const key = generateChaCha20Key();
      expect(key.length).toBe(32); // 256 bits = 32 bytes
    });

    it('should generate unique keys', () => {
      const key1 = generateChaCha20Key();
      const key2 = generateChaCha20Key();
      expect(key1).not.toEqual(key2);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('Hello, World!');

      const encrypted = chaCha20Encrypt(plaintext, key);
      const decrypted = chaCha20Decrypt(encrypted, key);

      expect(decrypted).toEqual(plaintext);
      expect(new TextDecoder().decode(decrypted)).toBe('Hello, World!');
    });

    it('should use unique nonces', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('test');

      const encrypted1 = chaCha20Encrypt(plaintext, key);
      const encrypted2 = chaCha20Encrypt(plaintext, key);

      expect(encrypted1.nonce).not.toEqual(encrypted2.nonce);
      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
    });

    it('should include 96-bit nonce and 128-bit tag', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('test');

      const encrypted = chaCha20Encrypt(plaintext, key);

      expect(encrypted.nonce.length).toBe(12); // 96 bits
      expect(encrypted.tag.length).toBe(16); // 128 bits
    });

    it('should handle various data sizes', () => {
      const key = generateChaCha20Key();
      const sizes = [0, 1, 16, 64, 1024, 1024 * 1024]; // 0B to 1MB

      for (const size of sizes) {
        const plaintext = new Uint8Array(size);
        const encrypted = chaCha20Encrypt(plaintext, key);
        const decrypted = chaCha20Decrypt(encrypted, key);
        expect(decrypted).toEqual(plaintext);
      }
    });
  });

  describe('Authenticated Encryption (AEAD)', () => {
    it('should support authenticated associated data', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('secret message');
      const aad = new TextEncoder().encode('metadata');

      const encrypted = chaCha20Encrypt(plaintext, key, aad);
      const decrypted = chaCha20Decrypt(encrypted, key, aad);

      expect(decrypted).toEqual(plaintext);
    });

    it('should reject decryption with wrong AAD', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('secret');
      const aad1 = new TextEncoder().encode('metadata1');
      const aad2 = new TextEncoder().encode('metadata2');

      const encrypted = chaCha20Encrypt(plaintext, key, aad1);

      expect(() => chaCha20Decrypt(encrypted, key, aad2)).toThrow();
    });

    it('should reject tampered ciphertext', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('secret');

      const encrypted = chaCha20Encrypt(plaintext, key);

      // Tamper with ciphertext
      encrypted.ciphertext[0]! ^= 1;

      expect(() => chaCha20Decrypt(encrypted, key)).toThrow(/authentication/i);
    });

    it('should reject tampered tag', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('secret');

      const encrypted = chaCha20Encrypt(plaintext, key);

      // Tamper with tag
      encrypted.tag[0]! ^= 1;

      expect(() => chaCha20Decrypt(encrypted, key)).toThrow(/authentication/i);
    });

    it('should reject tampered nonce', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('secret');

      const encrypted = chaCha20Encrypt(plaintext, key);

      // Tamper with nonce
      encrypted.nonce[0]! ^= 1;

      expect(() => chaCha20Decrypt(encrypted, key)).toThrow(/authentication/i);
    });
  });

  describe('String Convenience Functions', () => {
    it('should encrypt and decrypt strings', () => {
      const key = generateChaCha20Key();
      const text = 'Hello, ChaCha20!';

      const encrypted = encryptString(text, key);
      const decrypted = decryptString(encrypted, key);

      expect(decrypted).toBe(text);
    });

    it('should handle Unicode strings', () => {
      const key = generateChaCha20Key();
      const text = '你好世界 🌍 مرحبا בעולם';

      const encrypted = encryptString(text, key);
      const decrypted = decryptString(encrypted, key);

      expect(decrypted).toBe(text);
    });

    it('should support AAD with strings', () => {
      const key = generateChaCha20Key();
      const text = 'secret';
      const aad = 'metadata';

      const encrypted = encryptString(text, key, aad);
      const decrypted = decryptString(encrypted, key, aad);

      expect(decrypted).toBe(text);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize encrypted data', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('test data');

      const encrypted = chaCha20Encrypt(plaintext, key);
      const serialized = serializeChaCha20Data(encrypted);
      const deserialized = deserializeChaCha20Data(serialized);

      const decrypted = chaCha20Decrypt(deserialized, key);

      expect(decrypted).toEqual(plaintext);
    });

    it('should produce base64 string', () => {
      const key = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('test');

      const encrypted = chaCha20Encrypt(plaintext, key);
      const serialized = serializeChaCha20Data(encrypted);

      expect(typeof serialized).toBe('string');
      expect(serialized).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid key size', () => {
      const badKey = new Uint8Array(16); // 128-bit instead of 256-bit
      const plaintext = new TextEncoder().encode('test');

      expect(() => chaCha20Encrypt(plaintext, badKey)).toThrow(/256-bit/);
    });

    it('should reject decryption with wrong key', () => {
      const key1 = generateChaCha20Key();
      const key2 = generateChaCha20Key();
      const plaintext = new TextEncoder().encode('test');

      const encrypted = chaCha20Encrypt(plaintext, key1);

      expect(() => chaCha20Decrypt(encrypted, key2)).toThrow(/authentication/i);
    });
  });

  describe('ChaCha20Service', () => {
    it('should be a singleton', () => {
      const service1 = chaCha20Service;
      const service2 = chaCha20Service;
      expect(service1).toBe(service2);
    });

    it('should provide same functionality as standalone functions', () => {
      const key = chaCha20Service.generateKey();
      const plaintext = new TextEncoder().encode('test');

      const encrypted = chaCha20Service.encrypt(plaintext, key);
      const decrypted = chaCha20Service.decrypt(encrypted, key);

      expect(decrypted).toEqual(plaintext);
    });

    it('should serialize and deserialize', () => {
      const key = chaCha20Service.generateKey();
      const plaintext = new TextEncoder().encode('test');

      const encrypted = chaCha20Service.encrypt(plaintext, key);
      const serialized = chaCha20Service.serialize(encrypted);
      const deserialized = chaCha20Service.deserialize(serialized);
      const decrypted = chaCha20Service.decrypt(deserialized, key);

      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('Performance', () => {
    it('should handle large data efficiently', () => {
      const key = generateChaCha20Key();
      const size = 10 * 1024 * 1024; // 10MB
      const plaintext = new Uint8Array(size);

      const start = performance.now();
      const encrypted = chaCha20Encrypt(plaintext, key);
      const decrypted = chaCha20Decrypt(encrypted, key);
      const elapsed = performance.now() - start;

      expect(decrypted.length).toBe(size);
      expect(elapsed).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
