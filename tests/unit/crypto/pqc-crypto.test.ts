/**
 * Post-Quantum Cryptography Tests
 * Tests ML-KEM-768 (Kyber) + X25519 hybrid encryption
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PQCryptoService } from '@/lib/crypto/pqc-crypto';

describe('PQCryptoService', () => {
  let pqCrypto: PQCryptoService;

  beforeEach(() => {
    pqCrypto = PQCryptoService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PQCryptoService.getInstance();
      const instance2 = PQCryptoService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Key Generation', () => {
    it('should generate hybrid keypair with correct structure', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();

      expect(keyPair).toBeDefined();
      expect(keyPair.kyber).toBeDefined();
      expect(keyPair.x25519).toBeDefined();

      // ML-KEM-768 key sizes
      expect(keyPair.kyber.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.kyber.publicKey.length).toBe(1184);
      expect(keyPair.kyber.secretKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.kyber.secretKey.length).toBe(2400);

      // X25519 key sizes
      expect(keyPair.x25519.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.x25519.publicKey.length).toBe(32);
      expect(keyPair.x25519.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.x25519.privateKey.length).toBe(32);
    });

    it('should generate unique keypairs', async () => {
      const keyPair1 = await pqCrypto.generateHybridKeypair();
      const keyPair2 = await pqCrypto.generateHybridKeypair();

      // Keys should be different
      expect(keyPair1.kyber.publicKey).not.toEqual(keyPair2.kyber.publicKey);
      expect(keyPair1.x25519.publicKey).not.toEqual(keyPair2.x25519.publicKey);
    });
  });

  describe('Hybrid Key Encapsulation', () => {
    it('should encapsulate shared secret with hybrid approach', async () => {
      const receiverKeyPair = await pqCrypto.generateHybridKeypair();

      const result = await pqCrypto.hybridEncapsulate({
        kyberPublicKey: receiverKeyPair.kyber.publicKey,
        x25519PublicKey: receiverKeyPair.x25519.publicKey,
      });

      expect(result).toBeDefined();
      expect(result.sharedSecret).toBeInstanceOf(Uint8Array);
      expect(result.sharedSecret.length).toBe(32); // 256-bit key

      expect(result.ciphertext).toBeDefined();
      expect(result.ciphertext.kyberCiphertext).toBeInstanceOf(Uint8Array);
      expect(result.ciphertext.kyberCiphertext.length).toBe(1088);
      expect(result.ciphertext.x25519EphemeralPublic).toBeInstanceOf(Uint8Array);
      expect(result.ciphertext.x25519EphemeralPublic.length).toBe(32);
    });

    it('should derive consistent session keys from shared secret', async () => {
      const receiverKeyPair = await pqCrypto.generateHybridKeypair();

      const result = await pqCrypto.hybridEncapsulate({
        kyberPublicKey: receiverKeyPair.kyber.publicKey,
        x25519PublicKey: receiverKeyPair.x25519.publicKey,
      });

      const sessionKeys = result.sessionKeys;
      expect(sessionKeys).toBeDefined();
      expect(sessionKeys.encryptionKey).toBeInstanceOf(Uint8Array);
      expect(sessionKeys.encryptionKey.length).toBe(32);
      expect(sessionKeys.authKey).toBeInstanceOf(Uint8Array);
      expect(sessionKeys.authKey.length).toBe(32);
      expect(sessionKeys.sessionId).toBeInstanceOf(Uint8Array);
      expect(sessionKeys.sessionId.length).toBe(16);
    });

    it('should throw on invalid public key', async () => {
      const invalidKey = new Uint8Array(100); // Wrong size

      await expect(
        pqCrypto.hybridEncapsulate({
          kyberPublicKey: invalidKey,
          x25519PublicKey: new Uint8Array(32),
        })
      ).rejects.toThrow();
    });
  });

  describe('Hybrid Key Decapsulation', () => {
    it('should decapsulate shared secret correctly', async () => {
      const receiverKeyPair = await pqCrypto.generateHybridKeypair();

      const encapResult = await pqCrypto.hybridEncapsulate({
        kyberPublicKey: receiverKeyPair.kyber.publicKey,
        x25519PublicKey: receiverKeyPair.x25519.publicKey,
      });

      const decapResult = await pqCrypto.hybridDecapsulate(
        encapResult.ciphertext,
        receiverKeyPair
      );

      expect(decapResult).toBeDefined();
      expect(decapResult.sharedSecret).toEqual(encapResult.sharedSecret);
      expect(decapResult.sessionKeys.encryptionKey).toEqual(
        encapResult.sessionKeys.encryptionKey
      );
      expect(decapResult.sessionKeys.authKey).toEqual(
        encapResult.sessionKeys.authKey
      );
    });

    it('should fail decapsulation with wrong secret key', async () => {
      const receiverKeyPair = await pqCrypto.generateHybridKeypair();
      const wrongKeyPair = await pqCrypto.generateHybridKeypair();

      const encapResult = await pqCrypto.hybridEncapsulate({
        kyberPublicKey: receiverKeyPair.kyber.publicKey,
        x25519PublicKey: receiverKeyPair.x25519.publicKey,
      });

      await expect(
        pqCrypto.hybridDecapsulate(encapResult.ciphertext, wrongKeyPair)
      ).rejects.toThrow();
    });

    it('should fail decapsulation with tampered ciphertext', async () => {
      const receiverKeyPair = await pqCrypto.generateHybridKeypair();

      const encapResult = await pqCrypto.hybridEncapsulate({
        kyberPublicKey: receiverKeyPair.kyber.publicKey,
        x25519PublicKey: receiverKeyPair.x25519.publicKey,
      });

      // Tamper with ciphertext
      const tamperedCiphertext = {
        ...encapResult.ciphertext,
        kyberCiphertext: new Uint8Array(
          encapResult.ciphertext.kyberCiphertext
        ),
      };
      tamperedCiphertext.kyberCiphertext[0] ^= 0xff;

      await expect(
        pqCrypto.hybridDecapsulate(tamperedCiphertext, receiverKeyPair)
      ).rejects.toThrow();
    });
  });

  describe('Data Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = new TextEncoder().encode('Secret message');
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(plaintext, key);
      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce.length).toBe(12);

      const decrypted = await pqCrypto.decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        key
      );
      expect(decrypted).toEqual(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = new TextEncoder().encode('Secret message');
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted1 = await pqCrypto.encrypt(plaintext, key);
      const encrypted2 = await pqCrypto.encrypt(plaintext, key);

      // Different nonces should produce different ciphertexts
      expect(encrypted1.nonce).not.toEqual(encrypted2.nonce);
      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
    });

    it('should fail decryption with wrong key', async () => {
      const plaintext = new TextEncoder().encode('Secret message');
      const key = crypto.getRandomValues(new Uint8Array(32));
      const wrongKey = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(plaintext, key);

      await expect(
        pqCrypto.decrypt(encrypted.ciphertext, encrypted.nonce, wrongKey)
      ).rejects.toThrow();
    });

    it('should fail decryption with tampered ciphertext', async () => {
      const plaintext = new TextEncoder().encode('Secret message');
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(plaintext, key);
      const tamperedCiphertext = new Uint8Array(encrypted.ciphertext);
      tamperedCiphertext[0] ^= 0xff;

      await expect(
        pqCrypto.decrypt(tamperedCiphertext, encrypted.nonce, key)
      ).rejects.toThrow();
    });

    it('should handle empty data', async () => {
      const plaintext = new Uint8Array(0);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(plaintext, key);
      const decrypted = await pqCrypto.decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        key
      );

      expect(decrypted.length).toBe(0);
    });

    it('should handle large data', async () => {
      const plaintext = crypto.getRandomValues(new Uint8Array(1024 * 1024)); // 1MB
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(plaintext, key);
      const decrypted = await pqCrypto.decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        key
      );

      expect(decrypted).toEqual(plaintext);
    }, 30000);
  });

  describe('Hashing', () => {
    it('should produce consistent hashes', () => {
      const data = new TextEncoder().encode('test data');

      const hash1 = pqCrypto.hash(data);
      const hash2 = pqCrypto.hash(data);

      expect(hash1).toEqual(hash2);
      expect(hash1.length).toBe(32); // SHA-256
    });

    it('should produce different hashes for different data', () => {
      const data1 = new TextEncoder().encode('test data 1');
      const data2 = new TextEncoder().encode('test data 2');

      const hash1 = pqCrypto.hash(data1);
      const hash2 = pqCrypto.hash(data2);

      expect(hash1).not.toEqual(hash2);
    });

    it('should handle empty data', () => {
      const data = new Uint8Array(0);
      const hash = pqCrypto.hash(data);

      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32);
    });
  });

  describe('Key Derivation (HKDF)', () => {
    it('should derive consistent keys', async () => {
      const ikm = crypto.getRandomValues(new Uint8Array(32));
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const info = new TextEncoder().encode('test context');

      const key1 = await pqCrypto.deriveKey(ikm, salt, info, 32);
      const key2 = await pqCrypto.deriveKey(ikm, salt, info, 32);

      expect(key1).toEqual(key2);
      expect(key1.length).toBe(32);
    });

    it('should derive different keys with different info', async () => {
      const ikm = crypto.getRandomValues(new Uint8Array(32));
      const salt = crypto.getRandomValues(new Uint8Array(32));

      const key1 = await pqCrypto.deriveKey(
        ikm,
        salt,
        new TextEncoder().encode('context1'),
        32
      );
      const key2 = await pqCrypto.deriveKey(
        ikm,
        salt,
        new TextEncoder().encode('context2'),
        32
      );

      expect(key1).not.toEqual(key2);
    });

    it('should derive keys of different lengths', async () => {
      const ikm = crypto.getRandomValues(new Uint8Array(32));
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const info = new TextEncoder().encode('test');

      const key16 = await pqCrypto.deriveKey(ikm, salt, info, 16);
      const key32 = await pqCrypto.deriveKey(ikm, salt, info, 32);
      const key64 = await pqCrypto.deriveKey(ikm, salt, info, 64);

      expect(key16.length).toBe(16);
      expect(key32.length).toBe(32);
      expect(key64.length).toBe(64);
    });
  });

  describe('Random Bytes', () => {
    it('should generate random bytes of requested length', () => {
      const bytes = pqCrypto.randomBytes(32);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should generate different random bytes each time', () => {
      const bytes1 = pqCrypto.randomBytes(32);
      const bytes2 = pqCrypto.randomBytes(32);

      expect(bytes1).not.toEqual(bytes2);
    });

    it('should handle various lengths', () => {
      expect(pqCrypto.randomBytes(1).length).toBe(1);
      expect(pqCrypto.randomBytes(16).length).toBe(16);
      expect(pqCrypto.randomBytes(32).length).toBe(32);
      expect(pqCrypto.randomBytes(64).length).toBe(64);
      expect(pqCrypto.randomBytes(128).length).toBe(128);
    });
  });

  describe('Performance', () => {
    it('should complete key generation in reasonable time', async () => {
      const start = Date.now();
      await pqCrypto.generateHybridKeypair();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should complete encapsulation in reasonable time', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();

      const start = Date.now();
      await pqCrypto.hybridEncapsulate({
        kyberPublicKey: keyPair.kyber.publicKey,
        x25519PublicKey: keyPair.x25519.publicKey,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple operations efficiently', async () => {
      const iterations = 10;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        const keyPair = await pqCrypto.generateHybridKeypair();
        await pqCrypto.hybridEncapsulate({
          kyberPublicKey: keyPair.kyber.publicKey,
          x25519PublicKey: keyPair.x25519.publicKey,
        });
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1000);
    }, 30000);
  });

  describe('Edge Cases', () => {
    it('should handle maximum size encryption key', async () => {
      const plaintext = new TextEncoder().encode('test');
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await pqCrypto.encrypt(plaintext, key);
      const decrypted = await pqCrypto.decrypt(
        encrypted.ciphertext,
        encrypted.nonce,
        key
      );

      expect(decrypted).toEqual(plaintext);
    });

    it('should reject invalid nonce size', async () => {
      const plaintext = new TextEncoder().encode('test');
      const key = crypto.getRandomValues(new Uint8Array(32));
      const encrypted = await pqCrypto.encrypt(plaintext, key);

      const invalidNonce = new Uint8Array(16); // Wrong size (should be 12)

      await expect(
        pqCrypto.decrypt(encrypted.ciphertext, invalidNonce, key)
      ).rejects.toThrow();
    });

    it('should reject invalid key size', async () => {
      const plaintext = new TextEncoder().encode('test');
      const invalidKey = new Uint8Array(16); // Wrong size (should be 32)

      await expect(pqCrypto.encrypt(plaintext, invalidKey)).rejects.toThrow();
    });
  });
});
