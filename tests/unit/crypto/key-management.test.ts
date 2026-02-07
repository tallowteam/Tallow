/**
 * Unit Tests for Key Management Module
 * Tests ephemeral key generation, rotation, Double Ratchet implementation,
 * and secure memory wiping.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EphemeralKeyManager, {
  SessionKeyPair,
  RatchetState,
  MessageKey
} from '@/lib/crypto/key-management';
import { pqCrypto, HybridPublicKey } from '@/lib/crypto/pqc-crypto';

describe('EphemeralKeyManager', () => {
  let keyManager: EphemeralKeyManager;

  beforeEach(() => {
    // Get fresh instance for each test
    keyManager = EphemeralKeyManager.getInstance();
  });

  afterEach(() => {
    // Clean up all keys after each test
    keyManager.destroyAll();
  });

  describe('Session Key Generation', () => {
    it('should generate session keys with valid structure', async () => {
      const sessionKey = await keyManager.generateSessionKeys();

      expect(sessionKey).toBeDefined();
      expect(sessionKey.id).toBeDefined();
      expect(typeof sessionKey.id).toBe('string');
      expect(sessionKey.id.length).toBe(32); // 16 bytes * 2 hex chars

      expect(sessionKey.keyPair).toBeDefined();
      expect(sessionKey.keyPair.kyber).toBeDefined();
      expect(sessionKey.keyPair.x25519).toBeDefined();

      // Verify Kyber key sizes
      expect(sessionKey.keyPair.kyber.publicKey.length).toBe(1184);
      expect(sessionKey.keyPair.kyber.secretKey.length).toBe(2400);

      // Verify X25519 key sizes
      expect(sessionKey.keyPair.x25519.publicKey.length).toBe(32);
      expect(sessionKey.keyPair.x25519.privateKey.length).toBe(32);

      // Verify timestamps
      expect(sessionKey.createdAt).toBeGreaterThan(0);
      expect(sessionKey.expiresAt).toBeGreaterThan(sessionKey.createdAt);
      expect(sessionKey.messageCount).toBe(0);
    });

    it('should generate unique key IDs for different sessions', async () => {
      const key1 = await keyManager.generateSessionKeys();
      const key2 = await keyManager.generateSessionKeys();

      expect(key1.id).not.toBe(key2.id);
    });

    it('should respect custom lifetime parameter', async () => {
      const customLifetime = 60000; // 1 minute
      const sessionKey = await keyManager.generateSessionKeys(customLifetime);

      const expectedExpiry = sessionKey.createdAt + customLifetime;
      expect(sessionKey.expiresAt).toBe(expectedExpiry);
    });

    it('should retrieve session key by ID', async () => {
      const sessionKey = await keyManager.generateSessionKeys();
      const retrieved = keyManager.getSessionKey(sessionKey.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(sessionKey.id);
    });

    it('should return null for non-existent session key', () => {
      const retrieved = keyManager.getSessionKey('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired session key', async () => {
      const shortLifetime = 1; // 1ms - will expire immediately
      const sessionKey = await keyManager.generateSessionKeys(shortLifetime);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const retrieved = keyManager.getSessionKey(sessionKey.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Message Counter', () => {
    it('should increment message count', async () => {
      const sessionKey = await keyManager.generateSessionKeys();

      expect(sessionKey.messageCount).toBe(0);

      const shouldRatchet1 = keyManager.incrementMessageCount(sessionKey.id);
      expect(shouldRatchet1).toBe(false);

      const retrieved = keyManager.getSessionKey(sessionKey.id);
      expect(retrieved?.messageCount).toBe(1);
    });

    it('should signal ratchet needed after max messages', async () => {
      const sessionKey = await keyManager.generateSessionKeys();
      const MAX_MESSAGES = 100;

      // Increment to max
      for (let i = 0; i < MAX_MESSAGES - 1; i++) {
        const shouldRatchet = keyManager.incrementMessageCount(sessionKey.id);
        expect(shouldRatchet).toBe(false);
      }

      // Max message should trigger ratchet
      const shouldRatchet = keyManager.incrementMessageCount(sessionKey.id);
      expect(shouldRatchet).toBe(true);
    });

    it('should return true for non-existent key', () => {
      const shouldRatchet = keyManager.incrementMessageCount('non-existent');
      expect(shouldRatchet).toBe(true);
    });
  });

  describe('Key Deletion', () => {
    it('should delete a session key', async () => {
      const sessionKey = await keyManager.generateSessionKeys();

      const deleted = keyManager.deleteKey(sessionKey.id);
      expect(deleted).toBe(true);

      const retrieved = keyManager.getSessionKey(sessionKey.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = keyManager.deleteKey('non-existent');
      expect(deleted).toBe(false);
    });

    it('should securely wipe key material', async () => {
      const sessionKey = await keyManager.generateSessionKeys();

      // Store references to key arrays
      const kyberSecret = sessionKey.keyPair.kyber.secretKey;
      const kyberPublic = sessionKey.keyPair.kyber.publicKey;
      const x25519Private = sessionKey.keyPair.x25519.privateKey;
      const x25519Public = sessionKey.keyPair.x25519.publicKey;

      // Delete key
      keyManager.deleteKey(sessionKey.id);

      // Verify arrays are zeroed (best effort - JavaScript doesn't guarantee)
      const isZeroed = (arr: Uint8Array) => arr.every(byte => byte === 0);

      expect(isZeroed(kyberSecret)).toBe(true);
      expect(isZeroed(kyberPublic)).toBe(true);
      expect(isZeroed(x25519Private)).toBe(true);
      expect(isZeroed(x25519Public)).toBe(true);
    });
  });

  describe('Double Ratchet Protocol', () => {
    describe('Ratchet Initialization', () => {
      it('should initialize ratchet state for initiator', async () => {
        const sessionId = 'test-session-1';
        const sharedSecret = pqCrypto.randomBytes(32);

        const state = await keyManager.initializeRatchet(
          sessionId,
          sharedSecret,
          true // isInitiator
        );

        expect(state).toBeDefined();
        expect(state.rootKey).toBeDefined();
        expect(state.rootKey.length).toBe(32);
        expect(state.sendChainKey.length).toBe(32);
        expect(state.receiveChainKey.length).toBe(32);
        expect(state.sendMessageNumber).toBe(0);
        expect(state.receiveMessageNumber).toBe(0);
        expect(state.dhRatchetKeyPair).toBeDefined();
        expect(state.peerPublicKey).toBeNull();
      });

      it('should initialize ratchet state for responder', async () => {
        const sessionId = 'test-session-2';
        const sharedSecret = pqCrypto.randomBytes(32);
        const peerKeyPair = await pqCrypto.generateHybridKeypair();
        const peerPublicKey = pqCrypto.getPublicKey(peerKeyPair);

        const state = await keyManager.initializeRatchet(
          sessionId,
          sharedSecret,
          false, // isInitiator
          peerPublicKey
        );

        expect(state).toBeDefined();
        expect(state.peerPublicKey).toEqual(peerPublicKey);
      });

      it('should derive different chain keys for initiator and responder', async () => {
        const sessionId1 = 'initiator-session';
        const sessionId2 = 'responder-session';
        const sharedSecret = pqCrypto.randomBytes(32);

        const initiatorState = await keyManager.initializeRatchet(
          sessionId1,
          sharedSecret,
          true
        );

        const responderState = await keyManager.initializeRatchet(
          sessionId2,
          sharedSecret,
          false
        );

        // Initiator's send chain should equal responder's receive chain
        expect(initiatorState.sendChainKey).toEqual(responderState.receiveChainKey);
        expect(initiatorState.receiveChainKey).toEqual(responderState.sendChainKey);
      });
    });

    describe('Message Key Derivation', () => {
      it('should derive unique message keys', async () => {
        const sessionId = 'test-session';
        const sharedSecret = pqCrypto.randomBytes(32);

        await keyManager.initializeRatchet(sessionId, sharedSecret, true);

        const key1 = keyManager.getNextSendKey(sessionId);
        const key2 = keyManager.getNextSendKey(sessionId);
        const key3 = keyManager.getNextSendKey(sessionId);

        expect(key1.key).toBeDefined();
        expect(key2.key).toBeDefined();
        expect(key3.key).toBeDefined();

        // All keys should be different
        expect(key1.key).not.toEqual(key2.key);
        expect(key2.key).not.toEqual(key3.key);
        expect(key1.key).not.toEqual(key3.key);

        // Indices should increment
        expect(key1.index).toBe(0);
        expect(key2.index).toBe(1);
        expect(key3.index).toBe(2);
      });

      it('should throw error when getting send key for non-existent session', () => {
        expect(() => {
          keyManager.getNextSendKey('non-existent');
        }).toThrow('Ratchet state not found');
      });

      it('should retrieve receive keys in order', async () => {
        const sessionId = 'test-session';
        const sharedSecret = pqCrypto.randomBytes(32);

        await keyManager.initializeRatchet(sessionId, sharedSecret, false);

        const key0 = keyManager.getReceiveKey(sessionId, 0);
        const key1 = keyManager.getReceiveKey(sessionId, 1);
        const key2 = keyManager.getReceiveKey(sessionId, 2);

        expect(key0?.index).toBe(0);
        expect(key1?.index).toBe(1);
        expect(key2?.index).toBe(2);

        // Keys should be unique
        expect(key0?.key).not.toEqual(key1?.key);
        expect(key1?.key).not.toEqual(key2?.key);
      });

      it('should handle out-of-order message keys', async () => {
        const sessionId = 'test-session';
        const sharedSecret = pqCrypto.randomBytes(32);

        await keyManager.initializeRatchet(sessionId, sharedSecret, false);

        // Skip to message 5
        const key5 = keyManager.getReceiveKey(sessionId, 5);
        expect(key5?.index).toBe(5);

        // Now try to get skipped message 2
        const key2 = keyManager.getReceiveKey(sessionId, 2);
        expect(key2?.index).toBe(2);
        expect(key2?.key).toBeDefined();
      });

      it('should return null for already-processed messages', async () => {
        const sessionId = 'test-session';
        const sharedSecret = pqCrypto.randomBytes(32);

        await keyManager.initializeRatchet(sessionId, sharedSecret, false);

        // Process message 0
        const key0 = keyManager.getReceiveKey(sessionId, 0);
        expect(key0).toBeDefined();

        // Try to process message 0 again
        const key0Again = keyManager.getReceiveKey(sessionId, 0);
        expect(key0Again).toBeNull();
      });
    });

    describe('DH Ratchet Step', () => {
      it('should perform DH ratchet step', async () => {
        const sessionId = 'test-session';
        const sharedSecret = pqCrypto.randomBytes(32);

        // Initialize ratchet
        const initialState = await keyManager.initializeRatchet(
          sessionId,
          sharedSecret,
          true
        );

        // Generate new peer public key
        const newPeerKeyPair = await pqCrypto.generateHybridKeypair();
        const newPeerPublicKey = pqCrypto.getPublicKey(newPeerKeyPair);

        // Store old state values
        const oldRootKey = new Uint8Array(initialState.rootKey);
        const oldSendChainKey = new Uint8Array(initialState.sendChainKey);

        // Perform ratchet step
        await keyManager.dhRatchetStep(sessionId, newPeerPublicKey);

        // Get updated state
        const currentPublicKey = keyManager.getCurrentPublicKey(sessionId);
        expect(currentPublicKey).toBeDefined();

        // Verify state changed
        const state = (keyManager as any).ratchetStates.get(sessionId) as RatchetState;
        expect(state.rootKey).not.toEqual(oldRootKey);
        expect(state.sendChainKey).not.toEqual(oldSendChainKey);
        expect(state.peerPublicKey).toEqual(newPeerPublicKey);
      });

      it('should throw error for non-existent session', async () => {
        const keyPair = await pqCrypto.generateHybridKeypair();
        const publicKey = pqCrypto.getPublicKey(keyPair);

        await expect(
          keyManager.dhRatchetStep('non-existent', publicKey)
        ).rejects.toThrow('Ratchet state not found');
      });
    });

    describe('Chain Key Ratcheting', () => {
      it('should ratchet chain keys forward', () => {
        const key1 = pqCrypto.randomBytes(32);
        const key2 = keyManager.ratchetKeys(key1);
        const key3 = keyManager.ratchetKeys(key2);

        // All keys should be different
        expect(key2).not.toEqual(key1);
        expect(key3).not.toEqual(key2);
        expect(key3).not.toEqual(key1);

        // Keys should be deterministic
        const key2Again = keyManager.ratchetKeys(key1);
        expect(key2Again).toEqual(key2);
      });
    });
  });

  describe('Session Destruction', () => {
    it('should destroy a specific session', async () => {
      const sessionId = 'test-session';
      const sharedSecret = pqCrypto.randomBytes(32);

      // Create session keys
      await keyManager.generateSessionKeys();
      await keyManager.initializeRatchet(sessionId, sharedSecret, true);

      // Destroy session
      keyManager.destroySession(sessionId);

      // Verify ratchet state is gone
      const key = keyManager.getNextSendKey(sessionId);
      expect(() => keyManager.getNextSendKey(sessionId)).toThrow();
    });

    it('should destroy all keys and sessions', async () => {
      // Create multiple sessions
      await keyManager.generateSessionKeys();
      await keyManager.generateSessionKeys();

      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const sharedSecret = pqCrypto.randomBytes(32);

      await keyManager.initializeRatchet(sessionId1, sharedSecret, true);
      await keyManager.initializeRatchet(sessionId2, sharedSecret, false);

      // Verify stats before
      const statsBefore = keyManager.getStats();
      expect(statsBefore.activeKeys).toBeGreaterThan(0);
      expect(statsBefore.ratchetSessions).toBe(2);

      // Destroy all
      keyManager.destroyAll();

      // Verify all cleared
      const statsAfter = keyManager.getStats();
      expect(statsAfter.activeKeys).toBe(0);
      expect(statsAfter.ratchetSessions).toBe(0);
      expect(statsAfter.skippedKeys).toBe(0);
    });
  });

  describe('Secure Memory Wiping', () => {
    it('should securely delete Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      keyManager.secureDelete(data);

      // Verify all bytes are zeroed
      expect(data.every(byte => byte === 0)).toBe(true);
    });

    it('should handle empty arrays gracefully', () => {
      const data = new Uint8Array(0);
      expect(() => keyManager.secureDelete(data)).not.toThrow();
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => keyManager.secureDelete(null as any)).not.toThrow();
      expect(() => keyManager.secureDelete(undefined as any)).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should report accurate statistics', async () => {
      const stats1 = keyManager.getStats();
      expect(stats1.activeKeys).toBe(0);
      expect(stats1.ratchetSessions).toBe(0);

      // Create keys
      await keyManager.generateSessionKeys();
      await keyManager.generateSessionKeys();

      const stats2 = keyManager.getStats();
      expect(stats2.activeKeys).toBe(2);

      // Create ratchet session
      const sessionId = 'test-session';
      const sharedSecret = pqCrypto.randomBytes(32);
      await keyManager.initializeRatchet(sessionId, sharedSecret, true);

      const stats3 = keyManager.getStats();
      expect(stats3.ratchetSessions).toBe(1);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = EphemeralKeyManager.getInstance();
      const instance2 = EphemeralKeyManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
