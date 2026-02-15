/**
 * Unit Tests for Post-Quantum Cryptography Module
 * Tests ML-KEM-768 (Kyber) + X25519 hybrid encryption,
 * key generation, encapsulation/decapsulation, and AES-GCM encryption.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  pqCrypto,
  HybridKeyPair,
  HybridPublicKey,
} from '@/lib/crypto/pqc-crypto';

describe('PQCryptoService', () => {
  describe('Key Generation', () => {
    it('should generate hybrid keypair with correct structure', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();

      expect(keyPair).toBeDefined();
      expect(keyPair.kyber).toBeDefined();
      expect(keyPair.x25519).toBeDefined();

      // Verify Kyber key sizes (ML-KEM-768)
      expect(keyPair.kyber.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.kyber.publicKey.length).toBe(1184);
      expect(keyPair.kyber.secretKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.kyber.secretKey.length).toBe(2400);

      // Verify X25519 key sizes
      expect(keyPair.x25519.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.x25519.publicKey.length).toBe(32);
      expect(keyPair.x25519.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.x25519.privateKey.length).toBe(32);
    });

    it('should generate unique keypairs', async () => {
      const keyPair1 = await pqCrypto.generateHybridKeypair();
      const keyPair2 = await pqCrypto.generateHybridKeypair();

      // Public keys should be different
      expect(keyPair1.kyber.publicKey).not.toEqual(keyPair2.kyber.publicKey);
      expect(keyPair1.x25519.publicKey).not.toEqual(keyPair2.x25519.publicKey);

      // Secret keys should be different
      expect(keyPair1.kyber.secretKey).not.toEqual(keyPair2.kyber.secretKey);
      expect(keyPair1.x25519.privateKey).not.toEqual(keyPair2.x25519.privateKey);
    });

    it('should extract public key from keypair', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();
      const publicKey = pqCrypto.getPublicKey(keyPair);

      expect(publicKey.kyberPublicKey).toEqual(keyPair.kyber.publicKey);
      expect(publicKey.x25519PublicKey).toEqual(keyPair.x25519.publicKey);
    });
  });

  describe('Key Encapsulation/Decapsulation', () => {
    let aliceKeyPair: HybridKeyPair;
    let bobKeyPair: HybridKeyPair;
    let bobPublicKey: HybridPublicKey;

    beforeEach(async () => {
      aliceKeyPair = await pqCrypto.generateHybridKeypair();
      bobKeyPair = await pqCrypto.generateHybridKeypair();
      bobPublicKey = pqCrypto.getPublicKey(bobKeyPair);
    });

    it('should encapsulate shared secret', async () => {
      const result = await pqCrypto.encapsulate(bobPublicKey);

      expect(result).toBeDefined();
      expect(result.ciphertext).toBeDefined();
      expect(result.sharedSecret).toBeDefined();

      // Verify ciphertext structure
      expect(result.ciphertext.kyberCiphertext).toBeInstanceOf(Uint8Array);
      expect(result.ciphertext.kyberCiphertext.length).toBe(1088); // ML-KEM-768
      expect(result.ciphertext.x25519EphemeralPublic).toBeInstanceOf(Uint8Array);
      expect(result.ciphertext.x25519EphemeralPublic.length).toBe(32);

      // Verify shared secret
      expect(result.sharedSecret).toBeInstanceOf(Uint8Array);
      expect(result.sharedSecret.length).toBe(32);
    });

    it('should decapsulate to same shared secret', async () => {
      // Alice encapsulates for Bob
      const { ciphertext, sharedSecret: aliceSecret } = await pqCrypto.encapsulate(bobPublicKey);

      // Bob decapsulates
      const bobSecret = await pqCrypto.decapsulate(ciphertext, bobKeyPair);

      // Shared secrets should match
      expect(bobSecret).toEqual(aliceSecret);
    });

    it('should produce different shared secrets for different encapsulations', async () => {
      const result1 = await pqCrypto.encapsulate(bobPublicKey);
      const result2 = await pqCrypto.encapsulate(bobPublicKey);

      // Each encapsulation should produce different ciphertext and shared secret
      expect(result1.ciphertext.kyberCiphertext).not.toEqual(result2.ciphertext.kyberCiphertext);
      expect(result1.sharedSecret).not.toEqual(result2.sharedSecret);
    });

    it('should fail decapsulation with wrong keypair', async () => {
      // Alice encapsulates for Bob
      const { ciphertext } = await pqCrypto.encapsulate(bobPublicKey);

      // Alice tries to decapsulate with her own keys (should fail)
      await expect(pqCrypto.decapsulate(ciphertext, aliceKeyPair))
        .rejects.toThrow(/decapsulation failed|ciphertext may not match/i);
    });

    it('should validate Kyber public key length', async () => {
      const invalidPublicKey: HybridPublicKey = {
        kyberPublicKey: new Uint8Array(100), // Wrong length
        x25519PublicKey: new Uint8Array(32),
      };

      await expect(pqCrypto.encapsulate(invalidPublicKey))
        .rejects.toThrow('Invalid Kyber public key: must be 1184 bytes');
    });

    it('should validate X25519 public key length', async () => {
      const invalidPublicKey: HybridPublicKey = {
        kyberPublicKey: new Uint8Array(1184),
        x25519PublicKey: new Uint8Array(16), // Wrong length
      };

      await expect(pqCrypto.encapsulate(invalidPublicKey))
        .rejects.toThrow('Invalid X25519 public key: must be 32 bytes');
    });
  });

  describe('Session Key Derivation', () => {
    it('should derive session keys from shared secret', () => {
      const sharedSecret = pqCrypto.randomBytes(32);
      const sessionKeys = pqCrypto.deriveSessionKeys(sharedSecret);

      expect(sessionKeys).toBeDefined();
      expect(sessionKeys.encryptionKey).toBeInstanceOf(Uint8Array);
      expect(sessionKeys.encryptionKey.length).toBe(32);
      expect(sessionKeys.authKey).toBeInstanceOf(Uint8Array);
      expect(sessionKeys.authKey.length).toBe(32);
      expect(sessionKeys.sessionId).toBeInstanceOf(Uint8Array);
      expect(sessionKeys.sessionId.length).toBe(16);
    });

    it('should derive different keys for different shared secrets', () => {
      const secret1 = pqCrypto.randomBytes(32);
      const secret2 = pqCrypto.randomBytes(32);

      const keys1 = pqCrypto.deriveSessionKeys(secret1);
      const keys2 = pqCrypto.deriveSessionKeys(secret2);

      expect(keys1.encryptionKey).not.toEqual(keys2.encryptionKey);
      expect(keys1.authKey).not.toEqual(keys2.authKey);
      expect(keys1.sessionId).not.toEqual(keys2.sessionId);
    });

    it('should derive same keys for same shared secret', () => {
      const sharedSecret = pqCrypto.randomBytes(32);

      const keys1 = pqCrypto.deriveSessionKeys(sharedSecret);
      const keys2 = pqCrypto.deriveSessionKeys(sharedSecret);

      expect(keys1.encryptionKey).toEqual(keys2.encryptionKey);
      expect(keys1.authKey).toEqual(keys2.authKey);
      expect(keys1.sessionId).toEqual(keys2.sessionId);
    });

    it('should derive different encryption and auth keys', () => {
      const sharedSecret = pqCrypto.randomBytes(32);
      const keys = pqCrypto.deriveSessionKeys(sharedSecret);

      // All derived keys should be different
      expect(keys.encryptionKey).not.toEqual(keys.authKey);
      expect(keys.encryptionKey).not.toEqual(keys.sessionId);
      expect(keys.authKey).not.toEqual(keys.sessionId);
    });
  });

  describe('Password Key Derivation', () => {
    it('should derive key from password using Argon2id', async () => {
      const password = 'my-secure-password';
      const salt = pqCrypto.randomBytes(32);

      const key = await pqCrypto.deriveKeyFromPassword(password, salt);

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should derive different keys for different passwords', async () => {
      const salt = pqCrypto.randomBytes(32);

      const key1 = await pqCrypto.deriveKeyFromPassword('password1', salt);
      const key2 = await pqCrypto.deriveKeyFromPassword('password2', salt);

      expect(key1).not.toEqual(key2);
    });

    it('should derive different keys with different salts', async () => {
      const password = 'same-password';
      const salt1 = pqCrypto.randomBytes(32);
      const salt2 = pqCrypto.randomBytes(32);

      const key1 = await pqCrypto.deriveKeyFromPassword(password, salt1);
      const key2 = await pqCrypto.deriveKeyFromPassword(password, salt2);

      expect(key1).not.toEqual(key2);
    });

    it('should derive same key for same password and salt', async () => {
      const password = 'test-password';
      const salt = pqCrypto.randomBytes(32);

      const key1 = await pqCrypto.deriveKeyFromPassword(password, salt);
      const key2 = await pqCrypto.deriveKeyFromPassword(password, salt);

      expect(key1).toEqual(key2);
    });
  });

  describe('AES-GCM Encryption/Decryption', () => {
    let key: Uint8Array;

    beforeEach(() => {
      key = pqCrypto.randomBytes(32);
      pqCrypto.resetNonceManager(); // Reset for each test
    });

    it('should encrypt and decrypt data', async () => {
      const plaintext = new TextEncoder().encode('Hello, secure world!');

      const encrypted = await pqCrypto.encrypt(plaintext, key);
      const decrypted = await pqCrypto.decrypt(encrypted, key);

      expect(new TextDecoder().decode(decrypted)).toBe('Hello, secure world!');
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = new TextEncoder().encode('test message');

      pqCrypto.resetNonceManager(); // Reset to ensure fresh nonces
      const encrypted1 = await pqCrypto.encrypt(plaintext, key);

      pqCrypto.resetNonceManager();
      const encrypted2 = await pqCrypto.encrypt(plaintext, key);

      // Different nonces should produce different ciphertexts
      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
      expect(encrypted1.nonce).not.toEqual(encrypted2.nonce);
    });

    it('should include nonce in encrypted data', async () => {
      const plaintext = new TextEncoder().encode('test');

      const encrypted = await pqCrypto.encrypt(plaintext, key);

      expect(encrypted.nonce).toBeDefined();
      expect(encrypted.nonce).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce.length).toBe(12); // GCM nonce size
    });

    it('should fail decryption with wrong key', async () => {
      const plaintext = new TextEncoder().encode('secret');
      const wrongKey = pqCrypto.randomBytes(32);

      const encrypted = await pqCrypto.encrypt(plaintext, key);

      await expect(pqCrypto.decrypt(encrypted, wrongKey))
        .rejects.toThrow();
    });

    it('should support authenticated encryption with associated data', async () => {
      const plaintext = new TextEncoder().encode('message');
      const associatedData = new TextEncoder().encode('metadata');

      const encrypted = await pqCrypto.encrypt(plaintext, key, associatedData);
      const decrypted = await pqCrypto.decrypt(encrypted, key, associatedData);

      expect(new TextDecoder().decode(decrypted)).toBe('message');
    });

    it('should fail decryption with wrong associated data', async () => {
      const plaintext = new TextEncoder().encode('message');
      const associatedData1 = new TextEncoder().encode('metadata1');
      const associatedData2 = new TextEncoder().encode('metadata2');

      const encrypted = await pqCrypto.encrypt(plaintext, key, associatedData1);

      await expect(pqCrypto.decrypt(encrypted, key, associatedData2))
        .rejects.toThrow();
    });

    it('should validate key length for encryption', async () => {
      const plaintext = new TextEncoder().encode('test');
      const shortKey = new Uint8Array(16);

      await expect(pqCrypto.encrypt(plaintext, shortKey))
        .rejects.toThrow('Encryption key must be 32 bytes');
    });

    it('should validate key length for decryption', async () => {
      const plaintext = new TextEncoder().encode('test');
      const encrypted = await pqCrypto.encrypt(plaintext, key);

      const shortKey = new Uint8Array(16);

      await expect(pqCrypto.decrypt(encrypted, shortKey))
        .rejects.toThrow('Decryption key must be 32 bytes');
    });

    it('should reject empty plaintext', async () => {
      const emptyPlaintext = new Uint8Array(0);

      await expect(pqCrypto.encrypt(emptyPlaintext, key))
        .rejects.toThrow('Plaintext must not be empty');
    });

    it('should handle binary data', async () => {
      const binaryData = new Uint8Array([0, 1, 2, 255, 254, 253]);

      const encrypted = await pqCrypto.encrypt(binaryData, key);
      const decrypted = await pqCrypto.decrypt(encrypted, key);

      expect(decrypted).toEqual(binaryData);
    });
  });

  describe('Nonce Management', () => {
    let key: Uint8Array;

    beforeEach(() => {
      key = pqCrypto.randomBytes(32);
      pqCrypto.resetNonceManager();
    });

    it('should generate unique nonces', async () => {
      const plaintext = new TextEncoder().encode('test');
      const nonces = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const encrypted = await pqCrypto.encrypt(plaintext, key);
        const nonceStr = Array.from(encrypted.nonce).join(',');
        expect(nonces.has(nonceStr)).toBe(false);
        nonces.add(nonceStr);
      }
    });

    it('should track nonce counter', async () => {
      const plaintext = new TextEncoder().encode('test');

      const status1 = pqCrypto.getNonceStatus();
      expect(status1.counter).toBe(0n);

      await pqCrypto.encrypt(plaintext, key);

      const status2 = pqCrypto.getNonceStatus();
      expect(status2.counter).toBe(1n);

      await pqCrypto.encrypt(plaintext, key);

      const status3 = pqCrypto.getNonceStatus();
      expect(status3.counter).toBe(2n);
    });

    it('should reset nonce manager', async () => {
      const plaintext = new TextEncoder().encode('test');

      await pqCrypto.encrypt(plaintext, key);
      const status1 = pqCrypto.getNonceStatus();
      expect(status1.counter).toBeGreaterThan(0n);

      pqCrypto.resetNonceManager();

      const status2 = pqCrypto.getNonceStatus();
      expect(status2.counter).toBe(0n);
    });

    it('should report near capacity status', () => {
      const status = pqCrypto.getNonceStatus();
      expect(typeof status.isNearCapacity).toBe('boolean');
      expect(status.isNearCapacity).toBe(false); // Should be false for new manager
    });
  });

  describe('Hashing', () => {
    it('should compute SHA-256 hash', () => {
      const data = new TextEncoder().encode('test data');
      const hash = pqCrypto.hash(data);

      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32); // SHA-256 output
    });

    it('should produce same hash for same data', () => {
      const data = new TextEncoder().encode('test');

      const hash1 = pqCrypto.hash(data);
      const hash2 = pqCrypto.hash(data);

      expect(hash1).toEqual(hash2);
    });

    it('should produce different hashes for different data', () => {
      const data1 = new TextEncoder().encode('data1');
      const data2 = new TextEncoder().encode('data2');

      const hash1 = pqCrypto.hash(data1);
      const hash2 = pqCrypto.hash(data2);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('BLAKE3 Keyed Hash (MAC)', () => {
    it('should compute BLAKE3 keyed hash', async () => {
      const key = pqCrypto.randomBytes(32);
      const data = new TextEncoder().encode('message');

      const mac = await pqCrypto.mac(key, data);

      expect(mac).toBeInstanceOf(Uint8Array);
      expect(mac.length).toBe(32); // BLAKE3 keyed hash output
    });

    it('should produce same MAC for same key and data', async () => {
      const key = pqCrypto.randomBytes(32);
      const data = new TextEncoder().encode('message');

      const mac1 = await pqCrypto.mac(key, data);
      const mac2 = await pqCrypto.mac(key, data);

      expect(mac1).toEqual(mac2);
    });

    it('should produce different MACs for different keys', async () => {
      const key1 = pqCrypto.randomBytes(32);
      const key2 = pqCrypto.randomBytes(32);
      const data = new TextEncoder().encode('message');

      const mac1 = await pqCrypto.mac(key1, data);
      const mac2 = await pqCrypto.mac(key2, data);

      expect(mac1).not.toEqual(mac2);
    });

    it('should produce different MACs for different data', async () => {
      const key = pqCrypto.randomBytes(32);
      const data1 = new TextEncoder().encode('message1');
      const data2 = new TextEncoder().encode('message2');

      const mac1 = await pqCrypto.mac(key, data1);
      const mac2 = await pqCrypto.mac(key, data2);

      expect(mac1).not.toEqual(mac2);
    });
  });

  describe('Constant-Time Comparison', () => {
    it('should return true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(pqCrypto.constantTimeEqual(a, b)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);

      expect(pqCrypto.constantTimeEqual(a, b)).toBe(false);
    });

    it('should return false for different lengths', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(pqCrypto.constantTimeEqual(a, b)).toBe(false);
    });

    it('should handle empty arrays', () => {
      const a = new Uint8Array([]);
      const b = new Uint8Array([]);

      expect(pqCrypto.constantTimeEqual(a, b)).toBe(true);
    });
  });

  describe('Random Bytes Generation', () => {
    it('should generate random bytes of specified length', () => {
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
      const lengths = [1, 16, 32, 64, 128, 256];

      for (const length of lengths) {
        const bytes = pqCrypto.randomBytes(length);
        expect(bytes.length).toBe(length);
      }
    });
  });

  describe('Serialization', () => {
    it('should serialize public key', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();
      const publicKey = pqCrypto.getPublicKey(keyPair);

      const serialized = pqCrypto.serializePublicKey(publicKey);

      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(serialized.length).toBe(2 + 1184 + 32); // length prefix + Kyber + X25519
    });

    it('should deserialize public key', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();
      const publicKey = pqCrypto.getPublicKey(keyPair);

      const serialized = pqCrypto.serializePublicKey(publicKey);
      const deserialized = pqCrypto.deserializePublicKey(serialized);

      expect(deserialized.kyberPublicKey).toEqual(publicKey.kyberPublicKey);
      expect(deserialized.x25519PublicKey).toEqual(publicKey.x25519PublicKey);
    });

    it('should serialize ciphertext', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();
      const publicKey = pqCrypto.getPublicKey(keyPair);

      const { ciphertext } = await pqCrypto.encapsulate(publicKey);
      const serialized = pqCrypto.serializeCiphertext(ciphertext);

      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(serialized.length).toBe(2 + 1088 + 32); // length prefix + Kyber CT + X25519
    });

    it('should deserialize ciphertext', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();
      const publicKey = pqCrypto.getPublicKey(keyPair);

      const { ciphertext } = await pqCrypto.encapsulate(publicKey);
      const serialized = pqCrypto.serializeCiphertext(ciphertext);
      const deserialized = pqCrypto.deserializeCiphertext(serialized);

      expect(deserialized.kyberCiphertext).toEqual(ciphertext.kyberCiphertext);
      expect(deserialized.x25519EphemeralPublic).toEqual(ciphertext.x25519EphemeralPublic);
    });

    it('should reject invalid serialized public key length', () => {
      const invalidSerialized = new Uint8Array(10);

      expect(() => pqCrypto.deserializePublicKey(invalidSerialized))
        .toThrow('Invalid serialized public key');
    });

    it('should reject invalid Kyber public key length', () => {
      const invalidSerialized = new Uint8Array(2 + 100 + 32);
      const view = new DataView(invalidSerialized.buffer);
      view.setUint16(0, 100, false); // Wrong Kyber length

      expect(() => pqCrypto.deserializePublicKey(invalidSerialized))
        .toThrow('Invalid Kyber public key length');
    });

    it('should serialize keypair public portion', async () => {
      const keyPair = await pqCrypto.generateHybridKeypair();
      const serialized = pqCrypto.serializeKeypairPublic(keyPair);

      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(serialized.length).toBe(2 + 1184 + 32);
    });
  });
});
