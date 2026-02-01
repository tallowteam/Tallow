import { describe, it, expect } from 'vitest';
import {
  generatePQSignatureKeyPair,
  signMessage,
  verifySignature,
  createSignedMessage,
  verifySignedMessage,
  signText,
  verifyTextSignature,
  signJSON,
  verifyJSONSignature,
  serializeSignature,
  deserializeSignature,
  serializeKeyPair,
  deserializeKeyPair,
  wipeKeyPair,
  wipeSignature,
  getSignatureSize,
  getPublicKeySize,
  getSecretKeySize,
} from '@/lib/crypto/pq-signatures';

describe('Post-Quantum Digital Signatures', () => {
  describe('Key Generation', () => {
    it('should generate ML-DSA-65 key pair', () => {
      const keyPair = generatePQSignatureKeyPair();

      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.algorithm).toBe('ML-DSA-65');
      expect(keyPair.created).toBeGreaterThan(0);
    });

    it('should generate keys with correct sizes', () => {
      const keyPair = generatePQSignatureKeyPair();

      expect(keyPair.publicKey.length).toBe(1952); // ML-DSA-65 public key size
      expect(keyPair.secretKey.length).toBe(4032); // ML-DSA-65 secret key size
    });

    it('should generate different key pairs', () => {
      const keyPair1 = generatePQSignatureKeyPair();
      const keyPair2 = generatePQSignatureKeyPair();

      // Public keys should be different
      expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
      expect(keyPair1.secretKey).not.toEqual(keyPair2.secretKey);
    });

    it('should report key sizes correctly', () => {
      expect(getPublicKeySize()).toBe(1952);
      expect(getSecretKeySize()).toBe(4032);
      expect(getSignatureSize()).toBe(3309);
    });
  });

  describe('Message Signing', () => {
    it('should sign a message', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair.secretKey);

      expect(signature.signature).toBeInstanceOf(Uint8Array);
      expect(signature.signature.length).toBeGreaterThan(0);
      expect(signature.algorithm).toBe('ML-DSA-65');
      expect(signature.timestamp).toBeGreaterThan(0);
    });

    it('should create signatures of expected size', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array(100);

      const signature = signMessage(message, keyPair.secretKey);

      // ML-DSA-65 signatures are ~3,309 bytes
      expect(signature.signature.length).toBeGreaterThan(3000);
      expect(signature.signature.length).toBeLessThan(3500);
    });

    it('should create different signatures for different messages', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message1 = new Uint8Array([1, 2, 3]);
      const message2 = new Uint8Array([4, 5, 6]);

      const signature1 = signMessage(message1, keyPair.secretKey);
      const signature2 = signMessage(message2, keyPair.secretKey);

      expect(signature1.signature).not.toEqual(signature2.signature);
    });

    it('should create different signatures with different keys', () => {
      const keyPair1 = generatePQSignatureKeyPair();
      const keyPair2 = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature1 = signMessage(message, keyPair1.secretKey);
      const signature2 = signMessage(message, keyPair2.secretKey);

      expect(signature1.signature).not.toEqual(signature2.signature);
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signature', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair.secretKey);
      const isValid = verifySignature(message, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair.secretKey);

      // Modify signature
      const firstByte = signature.signature[0];
      if (firstByte !== undefined) {
        signature.signature[0] = firstByte ^ 0xFF;
      }

      const isValid = verifySignature(message, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature for wrong message', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message1 = new Uint8Array([1, 2, 3, 4, 5]);
      const message2 = new Uint8Array([5, 4, 3, 2, 1]);

      const signature = signMessage(message1, keyPair.secretKey);
      const isValid = verifySignature(message2, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', () => {
      const keyPair1 = generatePQSignatureKeyPair();
      const keyPair2 = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair1.secretKey);
      const isValid = verifySignature(message, signature.signature, keyPair2.publicKey);

      expect(isValid).toBe(false);
    });
  });

  describe('Signed Message Bundle', () => {
    it('should create and verify signed message bundle', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signedMessage = createSignedMessage(message, keyPair.secretKey, keyPair.publicKey);
      const isValid = verifySignedMessage(signedMessage);

      expect(isValid).toBe(true);
      expect(signedMessage.message).toEqual(message);
      expect(signedMessage.publicKey).toEqual(keyPair.publicKey);
    });

    it('should reject tampered signed message', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signedMessage = createSignedMessage(message, keyPair.secretKey, keyPair.publicKey);

      // Tamper with message
      const firstMessageByte = signedMessage.message[0];
      if (firstMessageByte !== undefined) {
        signedMessage.message[0] = firstMessageByte ^ 0xFF;
      }

      const isValid = verifySignedMessage(signedMessage);

      expect(isValid).toBe(false);
    });
  });

  describe('Text Signing', () => {
    it('should sign and verify text', () => {
      const keyPair = generatePQSignatureKeyPair();
      const text = 'Hello, post-quantum world!';

      const signature = signText(text, keyPair.secretKey);
      const isValid = verifyTextSignature(text, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject signature for modified text', () => {
      const keyPair = generatePQSignatureKeyPair();
      const originalText = 'Hello, post-quantum world!';
      const modifiedText = 'Hello, post-quantum world?';

      const signature = signText(originalText, keyPair.secretKey);
      const isValid = verifyTextSignature(modifiedText, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should sign empty string', () => {
      const keyPair = generatePQSignatureKeyPair();
      const text = '';

      const signature = signText(text, keyPair.secretKey);
      const isValid = verifyTextSignature(text, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should sign unicode text', () => {
      const keyPair = generatePQSignatureKeyPair();
      const text = '🔒 Secure 中文 العربية עברית';

      const signature = signText(text, keyPair.secretKey);
      const isValid = verifyTextSignature(text, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });
  });

  describe('JSON Signing', () => {
    it('should sign and verify JSON object', () => {
      const keyPair = generatePQSignatureKeyPair();
      const data = {
        userId: '12345',
        action: 'transfer',
        amount: 1000,
        timestamp: Date.now(),
      };

      const signature = signJSON(data, keyPair.secretKey);
      const isValid = verifyJSONSignature(data, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject signature for modified JSON', () => {
      const keyPair = generatePQSignatureKeyPair();
      const originalData = { userId: '12345', amount: 1000 };
      const modifiedData = { userId: '12345', amount: 2000 };

      const signature = signJSON(originalData, keyPair.secretKey);
      const isValid = verifyJSONSignature(modifiedData, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should sign complex nested JSON', () => {
      const keyPair = generatePQSignatureKeyPair();
      const data = {
        user: {
          id: '123',
          profile: {
            name: 'Alice',
            settings: {
              privacy: 'high',
              notifications: true,
            },
          },
        },
        actions: ['read', 'write', 'delete'],
      };

      const signature = signJSON(data, keyPair.secretKey);
      const isValid = verifyJSONSignature(data, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize signature', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair.secretKey);
      const serialized = serializeSignature(signature);
      const deserialized = deserializeSignature(serialized);

      expect(deserialized.signature).toEqual(signature.signature);
      expect(deserialized.algorithm).toBe(signature.algorithm);
      expect(deserialized.timestamp).toBe(signature.timestamp);
    });

    it('should verify deserialized signature', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair.secretKey);
      const serialized = serializeSignature(signature);
      const deserialized = deserializeSignature(serialized);

      const isValid = verifySignature(message, deserialized.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should serialize and deserialize key pair', () => {
      const keyPair = generatePQSignatureKeyPair();

      const serialized = serializeKeyPair(keyPair);
      const deserialized = deserializeKeyPair(serialized);

      expect(deserialized.publicKey).toEqual(keyPair.publicKey);
      expect(deserialized.secretKey).toEqual(keyPair.secretKey);
      expect(deserialized.algorithm).toBe(keyPair.algorithm);
      expect(deserialized.created).toBe(keyPair.created);
    });

    it('should sign with deserialized key pair', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const serialized = serializeKeyPair(keyPair);
      const deserialized = deserializeKeyPair(serialized);

      const signature = signMessage(message, deserialized.secretKey);
      const isValid = verifySignature(message, signature.signature, deserialized.publicKey);

      expect(isValid).toBe(true);
    });
  });

  describe('Memory Wiping', () => {
    it('should wipe key pair from memory', () => {
      const keyPair = generatePQSignatureKeyPair();

      // Store original values
      const publicKeyCopy = new Uint8Array(keyPair.publicKey);
      const secretKeyCopy = new Uint8Array(keyPair.secretKey);

      wipeKeyPair(keyPair);

      // Keys should be wiped (all zeros)
      expect(keyPair.publicKey.every(b => b === 0)).toBe(true);
      expect(keyPair.secretKey.every(b => b === 0)).toBe(true);

      // Copies should still have original values
      expect(publicKeyCopy).not.toEqual(keyPair.publicKey);
      expect(secretKeyCopy).not.toEqual(keyPair.secretKey);
    });

    it('should wipe signature from memory', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const signature = signMessage(message, keyPair.secretKey);
      const signatureCopy = new Uint8Array(signature.signature);

      wipeSignature(signature);

      // Signature should be wiped (all zeros)
      expect(signature.signature.every(b => b === 0)).toBe(true);

      // Copy should still have original value
      expect(signatureCopy).not.toEqual(signature.signature);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array(0);

      const signature = signMessage(message, keyPair.secretKey);
      const isValid = verifySignature(message, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should handle large message', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array(1024 * 1024); // 1MB

      // Fill in chunks (crypto.getRandomValues has 65KB limit)
      const chunkSize = 65536;
      for (let offset = 0; offset < message.length; offset += chunkSize) {
        const chunk = message.subarray(offset, Math.min(offset + chunkSize, message.length));
        crypto.getRandomValues(chunk);
      }

      const signature = signMessage(message, keyPair.secretKey);
      const isValid = verifySignature(message, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should handle very long text', () => {
      const keyPair = generatePQSignatureKeyPair();
      const text = 'a'.repeat(100000); // 100KB text

      const signature = signText(text, keyPair.secretKey);
      const isValid = verifyTextSignature(text, signature.signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should generate keys in reasonable time', () => {
      const startTime = performance.now();

      generatePQSignatureKeyPair();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 100ms (typical: 5-20ms)
      expect(duration).toBeLessThan(100);
    });

    it('should sign in reasonable time', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array(10000); // 10KB

      const startTime = performance.now();

      signMessage(message, keyPair.secretKey);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 50ms (typical: 5-15ms)
      expect(duration).toBeLessThan(50);
    });

    it('should verify in reasonable time', () => {
      const keyPair = generatePQSignatureKeyPair();
      const message = new Uint8Array(10000); // 10KB
      const signature = signMessage(message, keyPair.secretKey);

      const startTime = performance.now();

      verifySignature(message, signature.signature, keyPair.publicKey);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 50ms (typical: 5-15ms)
      expect(duration).toBeLessThan(50);
    });
  });
});
