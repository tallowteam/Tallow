import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getOrGenerateSigningKey,
  signFile,
  verifyFileSignature,
  getPublicKeyFingerprint,
  serializeSignature,
  deserializeSignature,
  clearSigningKey,
} from '../../../lib/crypto/digital-signatures';

describe('Digital Signatures', () => {
  beforeEach(async () => {
    // Clear any existing signing key before each test
    await clearSigningKey();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearSigningKey();
  });

  describe('getOrGenerateSigningKey', () => {
    it('should generate a signing keypair', async () => {
      const keypair = await getOrGenerateSigningKey();

      expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keypair.publicKey.length).toBe(32); // Ed25519 public key
      expect(keypair.privateKey.length).toBe(32); // Ed25519 private key
    });

    it('should return same keypair on subsequent calls', async () => {
      const keypair1 = await getOrGenerateSigningKey();
      const keypair2 = await getOrGenerateSigningKey();

      expect(keypair1.publicKey).toEqual(keypair2.publicKey);
      expect(keypair1.privateKey).toEqual(keypair2.privateKey);
    });

    it('should generate new keypair after clearing', async () => {
      const keypair1 = await getOrGenerateSigningKey();
      await clearSigningKey();
      const keypair2 = await getOrGenerateSigningKey();

      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
    });
  });

  describe('signFile', () => {
    it('should sign file data', async () => {
      const fileData = new TextEncoder().encode('Test file content');
      const signature = await signFile(fileData);

      expect(signature.signature).toBeInstanceOf(Uint8Array);
      expect(signature.publicKey).toBeInstanceOf(Uint8Array);
      expect(signature.fileHash).toBeInstanceOf(Uint8Array);
      expect(signature.timestamp).toBeGreaterThan(0);
    });

    it('should produce different signatures for different files', async () => {
      const file1 = new TextEncoder().encode('File 1');
      const file2 = new TextEncoder().encode('File 2');

      const sig1 = await signFile(file1);
      const sig2 = await signFile(file2);

      expect(sig1.signature).not.toEqual(sig2.signature);
      expect(sig1.fileHash).not.toEqual(sig2.fileHash);
    });

    it('should include timestamp in signature', async () => {
      const fileData = new TextEncoder().encode('Test');
      const before = Date.now();
      const signature = await signFile(fileData);
      const after = Date.now();

      expect(signature.timestamp).toBeGreaterThanOrEqual(before);
      expect(signature.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('verifyFileSignature', () => {
    it('should verify valid signature', async () => {
      const fileData = new TextEncoder().encode('Test file content');
      const signature = await signFile(fileData);

      const isValid = verifyFileSignature(fileData, signature);
      expect(isValid).toBe(true);
    });

    it('should reject tampered file data', async () => {
      const fileData = new TextEncoder().encode('Test file content');
      const signature = await signFile(fileData);

      const tamperedData = new TextEncoder().encode('Tampered content');
      const isValid = verifyFileSignature(tamperedData, signature);

      expect(isValid).toBe(false);
    });

    it('should reject tampered signature', async () => {
      const fileData = new TextEncoder().encode('Test file content');
      const signature = await signFile(fileData);

      // Tamper with signature
      const tamperedSignature = { ...signature };
      tamperedSignature.signature = new Uint8Array(signature.signature);
      tamperedSignature.signature[0]! ^= 1; // Flip one bit

      const isValid = verifyFileSignature(fileData, tamperedSignature);
      expect(isValid).toBe(false);
    });

    it('should reject signature from different key', async () => {
      const fileData = new TextEncoder().encode('Test file content');
      const signature1 = await signFile(fileData);

      // Generate new key and sign again
      await clearSigningKey();
      const signature2 = await signFile(fileData);

      // Verify first signature with second public key (should fail)
      const mixedSignature = {
        ...signature1,
        publicKey: signature2.publicKey,
      };

      const isValid = verifyFileSignature(fileData, mixedSignature);
      expect(isValid).toBe(false);
    });
  });

  describe('getPublicKeyFingerprint', () => {
    it('should generate fingerprint from public key', async () => {
      const keypair = await getOrGenerateSigningKey();
      const fingerprint = getPublicKeyFingerprint(keypair.publicKey);

      expect(typeof fingerprint).toBe('string');
      expect(fingerprint).toMatch(/^[0-9A-F:]+$/); // Hex format with colons
    });

    it('should generate same fingerprint for same key', async () => {
      const keypair = await getOrGenerateSigningKey();
      const fp1 = getPublicKeyFingerprint(keypair.publicKey);
      const fp2 = getPublicKeyFingerprint(keypair.publicKey);

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different keys', async () => {
      const keypair1 = await getOrGenerateSigningKey();
      await clearSigningKey();
      const keypair2 = await getOrGenerateSigningKey();

      const fp1 = getPublicKeyFingerprint(keypair1.publicKey);
      const fp2 = getPublicKeyFingerprint(keypair2.publicKey);

      expect(fp1).not.toBe(fp2);
    });
  });

  describe('serialize/deserialize signature', () => {
    it('should serialize and deserialize signature', async () => {
      const fileData = new TextEncoder().encode('Test content');
      const original = await signFile(fileData);

      const serialized = serializeSignature(original);
      const deserialized = deserializeSignature(serialized);

      expect(deserialized.signature).toEqual(original.signature);
      expect(deserialized.publicKey).toEqual(original.publicKey);
      expect(deserialized.timestamp).toBe(original.timestamp);
      expect(deserialized.fileHash).toEqual(original.fileHash);
    });

    it('should preserve signature validity after serialization', async () => {
      const fileData = new TextEncoder().encode('Test content');
      const original = await signFile(fileData);

      const serialized = serializeSignature(original);
      const deserialized = deserializeSignature(serialized);

      const isValid = verifyFileSignature(fileData, deserialized);
      expect(isValid).toBe(true);
    });
  });
});
