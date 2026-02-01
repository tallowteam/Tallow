/**
 * Serialization Tests
 * SERIAL-01 through SERIAL-04: Key and ciphertext serialization roundtrips
 */
import { describe, it, expect } from 'vitest';
import { PQCryptoService } from '@/lib/crypto/pqc-crypto';

const crypto = PQCryptoService.getInstance();

describe('Serialization', () => {
  // SERIAL-01: Public key serialize/deserialize roundtrip
  describe('SERIAL-01: Public Key Roundtrip', () => {
    it('serializes and deserializes a public key', async () => {
      const keyPair = await crypto.generateHybridKeypair();
      const publicKey = crypto.getPublicKey(keyPair);

      const serialized = crypto.serializePublicKey(publicKey);
      const deserialized = crypto.deserializePublicKey(serialized);

      expect(deserialized.kyberPublicKey).toEqual(publicKey.kyberPublicKey);
      expect(deserialized.x25519PublicKey).toEqual(publicKey.x25519PublicKey);
    });

    it('produces expected serialized length', async () => {
      const keyPair = await crypto.generateHybridKeypair();
      const publicKey = crypto.getPublicKey(keyPair);

      const serialized = crypto.serializePublicKey(publicKey);

      // 2 bytes length prefix + 1184 Kyber + 32 X25519
      expect(serialized.length).toBe(2 + 1184 + 32);
    });
  });

  // SERIAL-02: Ciphertext serialize/deserialize roundtrip
  describe('SERIAL-02: Ciphertext Roundtrip', () => {
    it('serializes and deserializes a ciphertext', async () => {
      const keyPair = await crypto.generateHybridKeypair();
      const publicKey = crypto.getPublicKey(keyPair);

      const { ciphertext } = await crypto.encapsulate(publicKey);

      const serialized = crypto.serializeCiphertext(ciphertext);
      const deserialized = crypto.deserializeCiphertext(serialized);

      expect(deserialized.kyberCiphertext).toEqual(ciphertext.kyberCiphertext);
      expect(deserialized.x25519EphemeralPublic).toEqual(ciphertext.x25519EphemeralPublic);
    });

    it('produces expected serialized ciphertext length', async () => {
      const keyPair = await crypto.generateHybridKeypair();
      const { ciphertext } = await crypto.encapsulate(crypto.getPublicKey(keyPair));

      const serialized = crypto.serializeCiphertext(ciphertext);

      // 2 bytes length prefix + 1088 Kyber ciphertext + 32 X25519 ephemeral
      expect(serialized.length).toBe(2 + 1088 + 32);
    });
  });

  // SERIAL-03: Deserialization rejects invalid data
  describe('SERIAL-03: Invalid Deserialization', () => {
    it('rejects too-short public key data', () => {
      const tooShort = new Uint8Array(10);

      expect(() => crypto.deserializePublicKey(tooShort)).toThrow('too short');
    });

    it('rejects public key with length mismatch', () => {
      // Create a buffer that claims Kyber key is 100 bytes but total is wrong
      const bad = new Uint8Array(2 + 100 + 32);
      const view = new DataView(bad.buffer);
      view.setUint16(0, 100, false);
      // Trim to wrong length
      const truncated = bad.slice(0, 50);

      expect(() => crypto.deserializePublicKey(truncated)).toThrow();
    });

    it('rejects too-short ciphertext data', () => {
      const tooShort = new Uint8Array(10);

      expect(() => crypto.deserializeCiphertext(tooShort)).toThrow('too short');
    });

    it('rejects ciphertext with length mismatch', () => {
      const bad = new Uint8Array(2 + 50 + 32);
      const view = new DataView(bad.buffer);
      view.setUint16(0, 50, false);
      const truncated = bad.slice(0, 40);

      expect(() => crypto.deserializeCiphertext(truncated)).toThrow();
    });
  });

  // SERIAL-04: serializeKeypairPublic convenience method
  describe('SERIAL-04: serializeKeypairPublic', () => {
    it('produces same result as serializePublicKey(getPublicKey())', async () => {
      const keyPair = await crypto.generateHybridKeypair();

      const fromConvenience = crypto.serializeKeypairPublic(keyPair);
      const fromManual = crypto.serializePublicKey(crypto.getPublicKey(keyPair));

      expect(fromConvenience).toEqual(fromManual);
    });

    it('can be deserialized back to valid public key', async () => {
      const keyPair = await crypto.generateHybridKeypair();

      const serialized = crypto.serializeKeypairPublic(keyPair);
      const deserialized = crypto.deserializePublicKey(serialized);

      // Use deserialized key for encapsulation
      const { ciphertext, sharedSecret: senderSecret } = await crypto.encapsulate(deserialized);
      const receiverSecret = await crypto.decapsulate(ciphertext, keyPair);

      expect(senderSecret).toEqual(receiverSecret);
    });
  });
});
