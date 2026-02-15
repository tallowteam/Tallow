/**
 * Unit Tests for Nonce Manager Module
 * Tests counter-based nonce generation, uniqueness guarantees,
 * overflow protection, and session management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NonceManager,
  getNonceManager,
  resetNonceManager,
  resetAllNonceManagers,
  createScopedNonceManager
} from '@/lib/crypto/nonce-manager';

describe('NonceManager', () => {
  describe('Nonce Generation', () => {
    it('should generate 12-byte nonces', () => {
      const manager = new NonceManager();
      const nonce = manager.getNextNonce();

      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);
    });

    it('should generate unique nonces', () => {
      const manager = new NonceManager();
      const nonces = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const nonce = manager.getNextNonce();
        const nonceStr = Array.from(nonce).join(',');
        expect(nonces.has(nonceStr)).toBe(false);
        nonces.add(nonceStr);
      }

      expect(nonces.size).toBe(100);
    });

    it('should increment counter for each nonce', () => {
      const manager = new NonceManager();

      expect(manager.getCounter()).toBe(0n);

      manager.getNextNonce();
      expect(manager.getCounter()).toBe(1n);

      manager.getNextNonce();
      expect(manager.getCounter()).toBe(2n);

      manager.getNextNonce();
      expect(manager.getCounter()).toBe(3n);
    });

    it('should include random prefix in nonces', () => {
      const manager = new NonceManager();

      const nonce1 = manager.getNextNonce();
      const nonce2 = manager.getNextNonce();

      // First 4 bytes should be the same (same session prefix)
      expect(nonce1.slice(0, 4)).toEqual(nonce2.slice(0, 4));

      // Last 8 bytes should be different (different counter)
      expect(nonce1.slice(4)).not.toEqual(nonce2.slice(4));
    });

    it('should use different prefixes for different managers', () => {
      const manager1 = new NonceManager();
      const manager2 = new NonceManager();

      const nonce1 = manager1.getNextNonce();
      const nonce2 = manager2.getNextNonce();

      // Prefixes should be different (extremely high probability)
      expect(nonce1.slice(0, 4)).not.toEqual(nonce2.slice(0, 4));
    });
  });

  describe('Counter Management', () => {
    it('should start counter at zero', () => {
      const manager = new NonceManager();
      expect(manager.getCounter()).toBe(0n);
    });

    it('should increment counter monotonically', () => {
      const manager = new NonceManager();

      for (let i = 0; i < 100; i++) {
        const expectedCounter = BigInt(i);
        expect(manager.getCounter()).toBe(expectedCounter);
        manager.getNextNonce();
      }

      expect(manager.getCounter()).toBe(100n);
    });

    it('should handle large counter values', () => {
      // Skip to a large counter value
      const largeValue = 2n ** 32n; // 4 billion
      const restoredManager = NonceManager.fromState(
        new Uint8Array([1, 2, 3, 4]),
        largeValue
      );

      expect(restoredManager.getCounter()).toBe(largeValue);

      restoredManager.getNextNonce();
      expect(restoredManager.getCounter()).toBe(largeValue + 1n);
    });

    it('should track remaining capacity', () => {
      const manager = new NonceManager();

      const initialCapacity = manager.getRemainingCapacity();
      expect(initialCapacity).toBe(2n ** 64n - 1n);

      manager.getNextNonce();

      const remainingCapacity = manager.getRemainingCapacity();
      expect(remainingCapacity).toBe(2n ** 64n - 2n);
    });
  });

  describe('Capacity Management', () => {
    it('should not be near capacity initially', () => {
      const manager = new NonceManager();
      expect(manager.isNearCapacity()).toBe(false);
    });

    it('should detect near capacity threshold', () => {
      // Set counter near capacity threshold (2^60)
      const nearCapacityManager = NonceManager.fromState(
        new Uint8Array([1, 2, 3, 4]),
        2n ** 60n
      );

      expect(nearCapacityManager.isNearCapacity()).toBe(true);
    });

    it('should throw error on counter overflow', () => {
      // Create manager at maximum counter
      const maxManager = NonceManager.fromState(
        new Uint8Array([1, 2, 3, 4]),
        2n ** 64n - 1n
      );

      expect(() => maxManager.getNextNonce())
        .toThrow(/counter overflow|maximum nonces exceeded/i);
    });

    it('should allow nonces up to max counter', () => {
      // Create manager just before max
      const almostMaxManager = NonceManager.fromState(
        new Uint8Array([1, 2, 3, 4]),
        2n ** 64n - 2n
      );

      // Should succeed for one more nonce
      expect(() => almostMaxManager.getNextNonce()).not.toThrow();

      // Should fail on next attempt
      expect(() => almostMaxManager.getNextNonce())
        .toThrow(/counter overflow/i);
    });
  });

  describe('State Persistence', () => {
    it('should get current state', () => {
      const manager = new NonceManager();

      manager.getNextNonce();
      manager.getNextNonce();

      const state = manager.getState();

      expect(state.prefix).toBeInstanceOf(Uint8Array);
      expect(state.prefix.length).toBe(4);
      expect(state.counter).toBe(2n);
    });

    it('should restore from state', () => {
      const manager = new NonceManager();
      manager.getNextNonce();
      manager.getNextNonce();

      const state = manager.getState();

      const restoredManager = NonceManager.fromState(state.prefix, state.counter);

      expect(restoredManager.getCounter()).toBe(state.counter);

      // Next nonce should continue from saved counter
      restoredManager.getNextNonce();
      expect(restoredManager.getCounter()).toBe(state.counter + 1n);
    });

    it('should validate prefix length in fromState', () => {
      const invalidPrefix = new Uint8Array(8); // Wrong length

      expect(() => NonceManager.fromState(invalidPrefix, 0n))
        .toThrow('Prefix must be exactly 4 bytes');
    });

    it('should validate counter in fromState', () => {
      const validPrefix = new Uint8Array(4);

      expect(() => NonceManager.fromState(validPrefix, -1n))
        .toThrow('Counter cannot be negative');
    });

    it('should create independent copies of state', () => {
      const manager = new NonceManager();
      const state1 = manager.getState();

      manager.getNextNonce();

      const state2 = manager.getState();

      // States should be independent
      expect(state1.counter).not.toBe(state2.counter);
    });
  });

  describe('Nonce Structure', () => {
    it('should encode counter in big-endian format', () => {
      const manager = new NonceManager();

      // Generate nonce with known counter value
      const nonce = manager.getNextNonce();

      // Extract counter bytes (last 8 bytes)
      const counterBytes = nonce.slice(4);
      const view = new DataView(counterBytes.buffer, counterBytes.byteOffset);
      const counter = view.getBigUint64(0, false); // false = big-endian

      expect(counter).toBe(0n); // First nonce has counter 0
    });

    it('should increment counter bytes correctly', () => {
      const manager = new NonceManager();

      manager.getNextNonce(); // counter = 0
      const nonce2 = manager.getNextNonce(); // counter = 1

      const counterBytes = nonce2.slice(4);
      const view = new DataView(counterBytes.buffer, counterBytes.byteOffset);
      const counter = view.getBigUint64(0, false);

      expect(counter).toBe(1n);
    });

    it('should maintain same prefix across nonces', () => {
      const manager = new NonceManager();

      const nonce1 = manager.getNextNonce();
      const nonce2 = manager.getNextNonce();
      const nonce3 = manager.getNextNonce();

      const prefix1 = nonce1.slice(0, 4);
      const prefix2 = nonce2.slice(0, 4);
      const prefix3 = nonce3.slice(0, 4);

      expect(prefix1).toEqual(prefix2);
      expect(prefix2).toEqual(prefix3);
    });
  });

  describe('Global Nonce Manager Registry', () => {
    beforeEach(() => {
      // Clean up global registry before each test
      resetAllNonceManagers();
    });

    it('should get or create nonce manager for context', () => {
      const manager1 = getNonceManager('aes-gcm');
      const manager2 = getNonceManager('aes-gcm');

      // Same context should return same manager
      expect(manager1).toBe(manager2);
    });

    it('should create different managers for different contexts', () => {
      const aesManager = getNonceManager('aes-gcm');
      const chachaManager = getNonceManager('chacha20');

      expect(aesManager).not.toBe(chachaManager);
    });

    it('should maintain counter state across retrievals', () => {
      const manager1 = getNonceManager('test-context');
      manager1.getNextNonce();
      manager1.getNextNonce();

      expect(manager1.getCounter()).toBe(2n);

      // Retrieve same manager
      const manager2 = getNonceManager('test-context');

      // Counter should be preserved
      expect(manager2.getCounter()).toBe(2n);
    });

    it('should reset specific nonce manager', () => {
      const manager1 = getNonceManager('test-context');
      manager1.getNextNonce();

      expect(manager1.getCounter()).toBe(1n);

      // Reset the manager
      resetNonceManager('test-context');

      // Getting manager again should create new one
      const manager2 = getNonceManager('test-context');

      expect(manager2.getCounter()).toBe(0n);
      expect(manager2).not.toBe(manager1);
    });

    it('should reset all nonce managers', () => {
      const manager1 = getNonceManager('context1');
      const manager2 = getNonceManager('context2');

      manager1.getNextNonce();
      manager2.getNextNonce();

      // Reset all
      resetAllNonceManagers();

      // Get managers again
      const newManager1 = getNonceManager('context1');
      const newManager2 = getNonceManager('context2');

      // Should be new instances with reset counters
      expect(newManager1).not.toBe(manager1);
      expect(newManager2).not.toBe(manager2);
      expect(newManager1.getCounter()).toBe(0n);
      expect(newManager2.getCounter()).toBe(0n);
    });

    it('should create scoped manager independent of global registry', () => {
      const scopedManager = createScopedNonceManager();
      const globalManager = getNonceManager('test-context');

      scopedManager.getNextNonce();
      globalManager.getNextNonce();

      // Counters should be independent
      expect(scopedManager.getCounter()).toBe(1n);
      expect(globalManager.getCounter()).toBe(1n);

      // But managers should be different instances
      expect(scopedManager).not.toBe(globalManager);
    });
  });

  describe('Collision Resistance', () => {
    it('should generate collision-free nonces across multiple managers', () => {
      const manager1 = new NonceManager();
      const manager2 = new NonceManager();
      const manager3 = new NonceManager();

      const allNonces = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const nonce1 = manager1.getNextNonce();
        const nonce2 = manager2.getNextNonce();
        const nonce3 = manager3.getNextNonce();

        const str1 = Array.from(nonce1).join(',');
        const str2 = Array.from(nonce2).join(',');
        const str3 = Array.from(nonce3).join(',');

        expect(allNonces.has(str1)).toBe(false);
        expect(allNonces.has(str2)).toBe(false);
        expect(allNonces.has(str3)).toBe(false);

        allNonces.add(str1);
        allNonces.add(str2);
        allNonces.add(str3);
      }

      expect(allNonces.size).toBe(150);
    });

    it('should guarantee uniqueness within session', () => {
      const manager = new NonceManager();
      const seen = new Set<string>();

      // Generate many nonces
      for (let i = 0; i < 1000; i++) {
        const nonce = manager.getNextNonce();
        const nonceStr = Array.from(nonce).join(',');
        expect(seen.has(nonceStr)).toBe(false);
        seen.add(nonceStr);
      }
    });

    it('should use different prefixes across sessions', () => {
      const prefixes = new Set<string>();

      // Create multiple managers (simulating different sessions)
      for (let i = 0; i < 100; i++) {
        const manager = new NonceManager();
        const nonce = manager.getNextNonce();
        const prefix = Array.from(nonce.slice(0, 4)).join(',');
        prefixes.add(prefix);
      }

      // With high probability, all prefixes should be unique
      // (collision rate with 32-bit random prefix is negligible for 100 samples)
      expect(prefixes.size).toBeGreaterThan(95);
    });
  });

  describe('Security Properties', () => {
    it('should produce unpredictable nonce sequences', () => {
      const manager1 = new NonceManager();
      const manager2 = new NonceManager();

      const nonce1a = manager1.getNextNonce();
      manager1.getNextNonce();

      const nonce2a = manager2.getNextNonce();
      manager2.getNextNonce();

      // Prefixes should be different (session isolation)
      expect(nonce1a.slice(0, 4)).not.toEqual(nonce2a.slice(0, 4));

      // Counters should be same for first nonces of each manager
      expect(nonce1a.slice(4)).toEqual(nonce2a.slice(4));

      // But overall nonces should be different due to different prefixes
      expect(nonce1a).not.toEqual(nonce2a);
    });

    it('should not leak counter state across sessions', () => {
      const manager1 = new NonceManager();

      // Advance counter
      for (let i = 0; i < 10; i++) {
        manager1.getNextNonce();
      }

      // New manager should start fresh
      const manager2 = new NonceManager();
      expect(manager2.getCounter()).toBe(0n);
    });

    it('should handle concurrent nonce generation', () => {
      const manager = new NonceManager();
      const nonces: Uint8Array[] = [];

      // Simulate concurrent requests
      for (let i = 0; i < 100; i++) {
        nonces.push(manager.getNextNonce());
      }

      // All nonces should be unique
      const nonceStrings = nonces.map(n => Array.from(n).join(','));
      const uniqueNonces = new Set(nonceStrings);

      expect(uniqueNonces.size).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid nonce generation', () => {
      const manager = new NonceManager();
      const count = 10000;

      for (let i = 0; i < count; i++) {
        const nonce = manager.getNextNonce();
        expect(nonce.length).toBe(12);
      }

      expect(manager.getCounter()).toBe(BigInt(count));
    });

    it('should handle zero counter correctly', () => {
      const manager = NonceManager.fromState(new Uint8Array([1, 2, 3, 4]), 0n);

      const nonce = manager.getNextNonce();
      const counterBytes = nonce.slice(4);

      // Counter bytes should be all zeros for first nonce
      expect(counterBytes[0]).toBe(0);
      expect(counterBytes[1]).toBe(0);
      expect(counterBytes[2]).toBe(0);
      expect(counterBytes[3]).toBe(0);
      expect(counterBytes[4]).toBe(0);
      expect(counterBytes[5]).toBe(0);
      expect(counterBytes[6]).toBe(0);
      expect(counterBytes[7]).toBe(0);
    });

    it('should handle maximum safe counter value', () => {
      const maxSafe = 2n ** 53n - 1n; // Maximum safe integer in JavaScript
      const manager = NonceManager.fromState(
        new Uint8Array([1, 2, 3, 4]),
        maxSafe
      );

      // Should be able to generate nonce
      expect(() => manager.getNextNonce()).not.toThrow();
    });
  });
});
