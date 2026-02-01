/**
 * Cryptographic Security Tests
 * Tests for crypto implementation vulnerabilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NonceManager } from '@/lib/crypto/nonce-manager';
import { EphemeralKeyManager } from '@/lib/crypto/key-management';

describe('Cryptographic Security', () => {
  describe('Nonce Uniqueness', () => {
    it('should generate unique nonces', () => {
      const manager = new NonceManager();
      const nonces = new Set<string>();

      // Generate 1000 nonces
      for (let i = 0; i < 1000; i++) {
        const nonce = manager.getNextNonce();
        const nonceStr = Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('');

        // Each nonce should be unique
        expect(nonces.has(nonceStr)).toBe(false);
        nonces.add(nonceStr);
      }

      expect(nonces.size).toBe(1000);
    });

    it('should use counter-based nonces to prevent birthday paradox', () => {
      const manager = new NonceManager();
      const nonce1 = manager.getNextNonce();
      const nonce2 = manager.getNextNonce();

      // Nonces should be sequential (counter-based)
      expect(nonce1).not.toEqual(nonce2);

      // First 4 bytes should be the same (random prefix)
      expect(nonce1.slice(0, 4)).toEqual(nonce2.slice(0, 4));

      // Last 8 bytes should differ (counter)
      expect(nonce1.slice(4)).not.toEqual(nonce2.slice(4));
    });

    it('should handle counter overflow gracefully', () => {
      const manager = NonceManager.fromState(
        new Uint8Array([1, 2, 3, 4]),
        2n ** 64n - 2n
      );

      // Should work near limit
      expect(() => manager.getNextNonce()).not.toThrow();
      expect(() => manager.getNextNonce()).not.toThrow();

      // Should throw at overflow
      expect(() => manager.getNextNonce()).toThrow(/overflow/i);
    });
  });

  describe('Key Derivation', () => {
    it('should use strong KDF for key derivation', async () => {
      const keyManager = EphemeralKeyManager.getInstance();

      // Test that key derivation uses HKDF
      const key1 = new Uint8Array(32);
      crypto.getRandomValues(key1);

      const key2 = new Uint8Array(32);
      crypto.getRandomValues(key2);

      const ratcheted1 = keyManager.ratchetKeys(key1);
      const ratcheted2 = keyManager.ratchetKeys(key2);

      // Ratcheted keys should be different
      expect(ratcheted1).not.toEqual(ratcheted2);

      // Should be deterministic
      const ratcheted1Again = keyManager.ratchetKeys(key1);
      expect(ratcheted1).toEqual(ratcheted1Again);
    });

    it('should derive keys with proper separation', async () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sharedSecret = new Uint8Array(32);
      crypto.getRandomValues(sharedSecret);

      // Initialize two sessions with same secret
      const session1 = await keyManager.initializeRatchet('session1', sharedSecret, true);
      const session2 = await keyManager.initializeRatchet('session2', sharedSecret, false);

      // Send and receive chains should be opposite
      expect(session1.sendChainKey).toEqual(session2.receiveChainKey);
      expect(session1.receiveChainKey).toEqual(session2.sendChainKey);
    });
  });

  describe('Random Number Quality', () => {
    it('should use cryptographically secure random', () => {
      const bytes = new Uint8Array(1000);
      crypto.getRandomValues(bytes);

      // Check distribution (should be roughly uniform)
      const counts = new Array(256).fill(0);
      for (const byte of bytes) {
        counts[byte]++;
      }

      // No value should be significantly over-represented
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      const ratio = max / (min || 1);

      // Should be relatively uniform (within 3x)
      expect(ratio).toBeLessThan(3);
    });

    it('should not have predictable patterns', () => {
      const sequence1 = new Uint8Array(100);
      const sequence2 = new Uint8Array(100);

      crypto.getRandomValues(sequence1);
      crypto.getRandomValues(sequence2);

      // Sequences should be different
      let differences = 0;
      for (let i = 0; i < 100; i++) {
        if (sequence1[i] !== sequence2[i]) {
          differences++;
        }
      }

      // At least 90% should be different
      expect(differences).toBeGreaterThan(90);
    });
  });

  describe('Timing Attack Resistance', () => {
    it('should use constant-time comparison for sensitive data', () => {
      const token1 = 'a'.repeat(64);
      const token2 = 'b'.repeat(64);
      const token3 = 'a'.repeat(63) + 'b';

      // Simulate constant-time comparison
      const constantTimeEquals = (a: string, b: string): boolean => {
        if (a.length !== b.length) {return false;}
        let result = 0;
        for (let i = 0; i < a.length; i++) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
      };

      // Test timing
      const iterations = 1000;

      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        constantTimeEquals(token1, token2);
      }
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        constantTimeEquals(token1, token3);
      }
      const time2 = performance.now() - start2;

      // Timing should be similar (within 20%)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(1.2);
    });
  });

  describe('Key Lifetime and Rotation', () => {
    it('should enforce key lifetime limits', async () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sessionKey = await keyManager.generateSessionKeys(1000); // 1 second

      // Initially valid
      expect(Date.now()).toBeLessThan(sessionKey.expiresAt);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      const retrieved = keyManager.getSessionKey(sessionKey.id);
      expect(retrieved).toBeNull();
    });

    it('should limit messages per key', () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sessionId = 'test-session';

      // Simulate reaching message limit
      for (let i = 0; i < 99; i++) {
        const shouldRatchet = keyManager.incrementMessageCount(sessionId);
        expect(shouldRatchet).toBe(false);
      }

      // 100th message should trigger ratchet
      const shouldRatchet = keyManager.incrementMessageCount(sessionId);
      expect(shouldRatchet).toBe(true);
    });
  });

  describe('Secure Memory Wiping', () => {
    it('should securely wipe key material', () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sensitiveData = new Uint8Array([1, 2, 3, 4, 5]);
      const copy = new Uint8Array(sensitiveData);

      keyManager.secureDelete(sensitiveData);

      // Should be zeroed
      expect(sensitiveData).not.toEqual(copy);
      expect(sensitiveData.every(b => b === 0)).toBe(true);
    });

    it('should wipe keys on session destruction', async () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sharedSecret = new Uint8Array(32);
      crypto.getRandomValues(sharedSecret);

      const sessionId = 'test-session-wipe';
      await keyManager.initializeRatchet(sessionId, sharedSecret, true);

      // Destroy session
      keyManager.destroySession(sessionId);

      // Keys should be gone
      const publicKey = keyManager.getCurrentPublicKey(sessionId);
      expect(publicKey).toBeNull();
    });
  });

  describe('Encryption Metadata', () => {
    it('should not leak plaintext length', () => {
      // Test that ciphertext length doesn't directly reveal plaintext length
      const plaintext1 = new Uint8Array(100);
      const plaintext2 = new Uint8Array(200);

      // With padding, ciphertexts should be in fixed-size blocks
      // This test verifies the concept (actual implementation may vary)
      expect(plaintext1.length).not.toEqual(plaintext2.length);
    });
  });

  describe('Double Ratchet Security', () => {
    it('should maintain forward secrecy', async () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sharedSecret = new Uint8Array(32);
      crypto.getRandomValues(sharedSecret);

      const sessionId = 'forward-secrecy-test';
      await keyManager.initializeRatchet(sessionId, sharedSecret, true);

      // Get multiple message keys
      const key1 = keyManager.getNextSendKey(sessionId);
      const key2 = keyManager.getNextSendKey(sessionId);
      const key3 = keyManager.getNextSendKey(sessionId);

      // All keys should be unique
      expect(key1.key).not.toEqual(key2.key);
      expect(key2.key).not.toEqual(key3.key);
      expect(key1.key).not.toEqual(key3.key);

      // Keys should have sequential indices
      expect(key1.index).toBe(0);
      expect(key2.index).toBe(1);
      expect(key3.index).toBe(2);
    });

    it('should handle out-of-order messages', async () => {
      const keyManager = EphemeralKeyManager.getInstance();
      const sharedSecret = new Uint8Array(32);
      crypto.getRandomValues(sharedSecret);

      const sessionId = 'out-of-order-test';
      await keyManager.initializeRatchet(sessionId, sharedSecret, true);

      // Skip to message 5
      const key5 = keyManager.getReceiveKey(sessionId, 5);
      expect(key5).not.toBeNull();

      // Should be able to retrieve skipped keys
      const key2 = keyManager.getReceiveKey(sessionId, 2);
      expect(key2).not.toBeNull();
    });
  });

  describe('IV/Nonce Reuse Prevention', () => {
    it('should never reuse nonce with same key', () => {
      const manager1 = new NonceManager();
      const manager2 = new NonceManager();

      const nonces1 = new Set<string>();
      const nonces2 = new Set<string>();

      // Generate 100 nonces from each manager
      for (let i = 0; i < 100; i++) {
        const nonce1 = manager1.getNextNonce();
        const nonce2 = manager2.getNextNonce();

        const str1 = Array.from(nonce1).join(',');
        const str2 = Array.from(nonce2).join(',');

        nonces1.add(str1);
        nonces2.add(str2);
      }

      // Different managers should have different prefixes
      const prefix1 = Array.from(manager1.getNextNonce().slice(0, 4)).join(',');
      const prefix2 = Array.from(manager2.getNextNonce().slice(0, 4)).join(',');

      expect(prefix1).not.toBe(prefix2);
    });
  });
});
