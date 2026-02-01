import { describe, it, expect } from 'vitest';
import {
  generatePQCSignalingKeypair,
  derivePQCSignalingKeyAsInitiator,
  derivePQCSignalingKeyAsResponder,
  deriveLegacySignalingKey,
  encryptPQCSignalingPayload,
  decryptPQCSignalingPayload,
  negotiateProtocolVersion,
  serializePublicKey,
  deserializePublicKey,
  isTimestampFresh,
} from '@/lib/signaling/pqc-signaling';

describe('PQC Signaling', () => {
  describe('generatePQCSignalingKeypair', () => {
    it('should generate a valid PQC keypair', async () => {
      const keypair = await generatePQCSignalingKeypair();

      expect(keypair).toBeDefined();
      expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
      expect(keypair.version).toBe(2);
      expect(keypair.publicKey.length).toBeGreaterThan(0);
      expect(keypair.secretKey.length).toBeGreaterThan(0);
    });

    it('should generate unique keypairs', async () => {
      const keypair1 = await generatePQCSignalingKeypair();
      const keypair2 = await generatePQCSignalingKeypair();

      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
      expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
    });
  });

  describe('Key Encapsulation', () => {
    it('should derive matching session keys using PQC', async () => {
      // Step 1: Peer A generates keypair
      const initiatorKeypair = await generatePQCSignalingKeypair();

      // Step 2: Peer B encapsulates secret using A's public key
      const { session: responderSession, encapsulatedSecret } =
        await derivePQCSignalingKeyAsResponder(initiatorKeypair.publicKey);

      // Step 3: Peer A decapsulates secret
      const initiatorSession = await derivePQCSignalingKeyAsInitiator(
        initiatorKeypair,
        encapsulatedSecret
      );

      // Step 4: Verify both derived same session key
      expect(initiatorSession.version).toBe(responderSession.version);
      expect(initiatorSession.algorithm).toBe('PQC-ML-KEM-768');
      expect(responderSession.algorithm).toBe('PQC-ML-KEM-768');

      // Step 5: Test encryption/decryption with derived keys
      const testPayload = { test: 'data', number: 42 };

      const encrypted = await encryptPQCSignalingPayload(initiatorSession, testPayload);
      const decrypted = await decryptPQCSignalingPayload(responderSession, encrypted);

      expect(decrypted).toEqual(testPayload);
    });

    it('should fail with wrong secret key', async () => {
      const keypair1 = await generatePQCSignalingKeypair();
      const keypair2 = await generatePQCSignalingKeypair();

      const { encapsulatedSecret } = await derivePQCSignalingKeyAsResponder(
        keypair1.publicKey
      );

      // Try to decapsulate with wrong secret key
      await expect(
        derivePQCSignalingKeyAsInitiator(keypair2, encapsulatedSecret)
      ).rejects.toThrow();
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt messages correctly', async () => {
      const keypair = await generatePQCSignalingKeypair();
      const { session } = await derivePQCSignalingKeyAsResponder(keypair.publicKey);

      const testData = {
        type: 'offer',
        sdp: 'test-sdp-data',
        timestamp: Date.now(),
      };

      const encrypted = await encryptPQCSignalingPayload(session, testData);

      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.ct).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.ts).toBeDefined();
      expect(encrypted.v).toBe(2);

      const decrypted = await decryptPQCSignalingPayload(session, encrypted);

      expect(decrypted).toEqual(testData);
    });

    it('should handle different data types', async () => {
      const keypair = await generatePQCSignalingKeypair();
      const { session } = await derivePQCSignalingKeyAsResponder(keypair.publicKey);

      const testCases = [
        { type: 'string', data: 'hello world' },
        { type: 'number', data: 12345 },
        { type: 'boolean', data: true },
        { type: 'array', data: [1, 2, 3] },
        { type: 'object', data: { nested: { value: 'test' } } },
        { type: 'null', data: null },
      ];

      for (const testCase of testCases) {
        const encrypted = await encryptPQCSignalingPayload(session, testCase);
        const decrypted = await decryptPQCSignalingPayload(session, encrypted);
        expect(decrypted).toEqual(testCase);
      }
    });

    it('should reject tampered ciphertext', async () => {
      const keypair = await generatePQCSignalingKeypair();
      const { session } = await derivePQCSignalingKeyAsResponder(keypair.publicKey);

      const testData = { test: 'data' };
      const encrypted = await encryptPQCSignalingPayload(session, testData);

      // Tamper with ciphertext
      const tamperedCt = encrypted.ct.split('').reverse().join('');
      const tampered = { ...encrypted, ct: tamperedCt };

      await expect(
        decryptPQCSignalingPayload(session, tampered)
      ).rejects.toThrow();
    });

    it('should reject wrong IV', async () => {
      const keypair = await generatePQCSignalingKeypair();
      const { session } = await derivePQCSignalingKeyAsResponder(keypair.publicKey);

      const testData = { test: 'data' };
      const encrypted = await encryptPQCSignalingPayload(session, testData);

      // Use different IV
      const wrongIv = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))));
      const tampered = { ...encrypted, iv: wrongIv };

      await expect(
        decryptPQCSignalingPayload(session, tampered)
      ).rejects.toThrow();
    });
  });

  describe('Replay Protection', () => {
    it('should accept fresh timestamps', () => {
      const now = Date.now();
      expect(isTimestampFresh(now)).toBe(true);
      expect(isTimestampFresh(now - 1000)).toBe(true); // 1s ago
      expect(isTimestampFresh(now - 15000)).toBe(true); // 15s ago
    });

    it('should reject old timestamps', () => {
      const now = Date.now();
      expect(isTimestampFresh(now - 31000)).toBe(false); // 31s ago
      expect(isTimestampFresh(now - 60000)).toBe(false); // 1min ago
    });

    it('should reject future timestamps beyond clock skew', () => {
      const now = Date.now();
      expect(isTimestampFresh(now + 10000)).toBe(false); // 10s in future
    });

    it('should accept timestamps within clock skew', () => {
      const now = Date.now();
      expect(isTimestampFresh(now + 2000)).toBe(true); // 2s in future
    });

    it('should reject messages with expired timestamps', async () => {
      const keypair = await generatePQCSignalingKeypair();
      const { session } = await derivePQCSignalingKeyAsResponder(keypair.publicKey);

      const testData = { test: 'data' };
      const encrypted = await encryptPQCSignalingPayload(session, testData);

      // Set timestamp to 31 seconds ago
      const expired = { ...encrypted, ts: Date.now() - 31000 };

      await expect(
        decryptPQCSignalingPayload(session, expired)
      ).rejects.toThrow(/expired/i);
    });
  });

  describe('Legacy Signaling Key Derivation', () => {
    it('should derive legacy key from connection code', async () => {
      const connectionCode = 'test-connection-code-123';
      const session = await deriveLegacySignalingKey(connectionCode);

      expect(session.key).toBeDefined();
      expect(session.version).toBe(1);
      expect(session.algorithm).toBe('HKDF-AES-256');
    });

    it('should derive same key for same connection code', async () => {
      const connectionCode = 'same-code-123';

      const session1 = await deriveLegacySignalingKey(connectionCode);
      const session2 = await deriveLegacySignalingKey(connectionCode);

      // Test that both can decrypt messages encrypted with the other
      const testData = { test: 'data' };
      const encrypted = await encryptPQCSignalingPayload(session1, testData);
      const decrypted = await decryptPQCSignalingPayload(session2, encrypted);

      expect(decrypted).toEqual(testData);
    });

    it('should be case-insensitive', async () => {
      const session1 = await deriveLegacySignalingKey('TEST-CODE');
      const session2 = await deriveLegacySignalingKey('test-code');

      const testData = { test: 'data' };
      const encrypted = await encryptPQCSignalingPayload(session1, testData);
      const decrypted = await decryptPQCSignalingPayload(session2, encrypted);

      expect(decrypted).toEqual(testData);
    });
  });

  describe('Protocol Version Negotiation', () => {
    it('should negotiate to highest common version', () => {
      expect(negotiateProtocolVersion(2, 2)).toEqual({ version: 2, usePQC: true });
      expect(negotiateProtocolVersion(2, 1)).toEqual({ version: 1, usePQC: false });
      expect(negotiateProtocolVersion(1, 2)).toEqual({ version: 1, usePQC: false });
      expect(negotiateProtocolVersion(1, 1)).toEqual({ version: 1, usePQC: false });
    });

    it('should enable PQC only for version 2+', () => {
      expect(negotiateProtocolVersion(3, 2).usePQC).toBe(true);
      expect(negotiateProtocolVersion(2, 3).usePQC).toBe(true);
      expect(negotiateProtocolVersion(2, 1).usePQC).toBe(false);
      expect(negotiateProtocolVersion(1, 1).usePQC).toBe(false);
    });
  });

  describe('Public Key Serialization', () => {
    it('should serialize and deserialize public keys', async () => {
      const keypair = await generatePQCSignalingKeypair();

      const serialized = serializePublicKey(keypair.publicKey);
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);

      const deserialized = deserializePublicKey(serialized);
      expect(deserialized).toEqual(keypair.publicKey);
    });

    it('should handle round-trip serialization', async () => {
      const keypair = await generatePQCSignalingKeypair();

      const serialized = serializePublicKey(keypair.publicKey);
      const deserialized = deserializePublicKey(serialized);

      // Test that deserialized key works for encapsulation
      const { session } = await derivePQCSignalingKeyAsResponder(deserialized);
      expect(session.algorithm).toBe('PQC-ML-KEM-768');
    });
  });

  describe('End-to-End PQC Flow', () => {
    it('should complete full PQC handshake', async () => {
      // Simulate complete handshake between two peers

      // Peer A generates keypair
      const peerAKeypair = await generatePQCSignalingKeypair();
      const peerAPublicKey = serializePublicKey(peerAKeypair.publicKey);

      // Peer B receives public key and encapsulates secret
      const peerBPublicKey = deserializePublicKey(peerAPublicKey);
      const { session: peerBSession, encapsulatedSecret } =
        await derivePQCSignalingKeyAsResponder(peerBPublicKey);

      // Peer A receives encapsulated secret and derives session
      const peerASession = await derivePQCSignalingKeyAsInitiator(
        peerAKeypair,
        encapsulatedSecret
      );

      // Test bidirectional communication
      const messageFromA = { from: 'A', data: 'hello B' };
      const encryptedA = await encryptPQCSignalingPayload(peerASession, messageFromA);
      const decryptedAtB = await decryptPQCSignalingPayload(peerBSession, encryptedA);
      expect(decryptedAtB).toEqual(messageFromA);

      const messageFromB = { from: 'B', data: 'hello A' };
      const encryptedB = await encryptPQCSignalingPayload(peerBSession, messageFromB);
      const decryptedAtA = await decryptPQCSignalingPayload(peerASession, encryptedB);
      expect(decryptedAtA).toEqual(messageFromB);
    });
  });
});
