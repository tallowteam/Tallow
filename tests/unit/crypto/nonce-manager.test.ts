/**
 * Nonce Manager Tests
 * Tests counter-based nonce generation for AES-GCM and ChaCha20-Poly1305
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  NonceManager,
  getNonceManager,
  resetNonceManager,
  resetAllNonceManagers,
  createScopedNonceManager,
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

      for (let i = 0; i < 1000; i++) {
        const nonce = manager.getNextNonce();
        const nonceStr = Array.from(nonce).join(',');
        nonces.add(nonceStr);
      }

      expect(nonces.size).toBe(1000); // All nonces should be unique
    });

    it('should increment counter for each nonce', () => {
      const manager = new NonceManager();

      const nonce1 = manager.getNextNonce();
      const nonce2 = manager.getNextNonce();

      // Extract counter value (last 8 bytes)
      const counter1 = new DataView(nonce1.buffer, nonce1.byteOffset + 4, 8).getBigUint64(0, false);
      const counter2 = new DataView(nonce2.buffer, nonce2.byteOffset + 4, 8).getBigUint64(0, false);

      expect(counter2).toBe(counter1 + 1n);
    });

    it('should maintain same prefix across nonces', () => {
      const manager = new NonceManager();

      const nonce1 = manager.getNextNonce();
      const nonce2 = manager.getNextNonce();

      // First 4 bytes should be the same (prefix)
      expect(nonce1.slice(0, 4)).toEqual(nonce2.slice(0, 4));
    });

    it('should use different prefixes for different managers', () => {
      const manager1 = new NonceManager();
      const manager2 = new NonceManager();

      const nonce1 = manager1.getNextNonce();
      const nonce2 = manager2.getNextNonce();

      // Prefixes should be different
      expect(nonce1.slice(0, 4)).not.toEqual(nonce2.slice(0, 4));
    });
  });

  describe('Counter Management', () => {
    it('should start counter at 0', () => {
      const manager = new NonceManager();
      expect(manager.getCounter()).toBe(0n);
    });

    it('should increment counter after each nonce', () => {
      const manager = new NonceManager();

      expect(manager.getCounter()).toBe(0n);
      manager.getNextNonce();
      expect(manager.getCounter()).toBe(1n);
      manager.getNextNonce();
      expect(manager.getCounter()).toBe(2n);
    });

    it('should track remaining capacity', () => {
      const manager = new NonceManager();
      const initialCapacity = manager.getRemainingCapacity();

      manager.getNextNonce();
      const afterOneNonce = manager.getRemainingCapacity();

      expect(afterOneNonce).toBe(initialCapacity - 1n);
    });

    it('should detect near capacity', () => {
      const prefix = new Uint8Array(4);
      const nearMaxCounter = 2n ** 60n;
      const manager = NonceManager.fromState(prefix, nearMaxCounter);

      expect(manager.isNearCapacity()).toBe(true);
    });

    it('should not be near capacity initially', () => {
      const manager = new NonceManager();
      expect(manager.isNearCapacity()).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should restore from state', () => {
      const prefix = new Uint8Array([1, 2, 3, 4]);
      const counter = 100n;

      const manager = NonceManager.fromState(prefix, counter);

      expect(manager.getCounter()).toBe(counter);

      const nonce = manager.getNextNonce();
      expect(nonce.slice(0, 4)).toEqual(prefix);
    });

    it('should get current state', () => {
      const manager = new NonceManager();
      manager.getNextNonce();
      manager.getNextNonce();

      const state = manager.getState();

      expect(state.prefix).toBeInstanceOf(Uint8Array);
      expect(state.prefix.length).toBe(4);
      expect(state.counter).toBe(2n);
    });

    it('should reject invalid prefix length', () => {
      const invalidPrefix = new Uint8Array(8); // Wrong size

      expect(() => {
        NonceManager.fromState(invalidPrefix, 0n);
      }).toThrow('Prefix must be exactly 4 bytes');
    });

    it('should reject negative counter', () => {
      const prefix = new Uint8Array(4);

      expect(() => {
        NonceManager.fromState(prefix, -1n);
      }).toThrow('Counter cannot be negative');
    });
  });

  describe('Global Manager Functions', () => {
    afterEach(() => {
      resetAllNonceManagers();
    });

    it('should get or create manager for context', () => {
      const manager1 = getNonceManager('test-context');
      const manager2 = getNonceManager('test-context');

      expect(manager1).toBe(manager2);
    });

    it('should create different managers for different contexts', () => {
      const manager1 = getNonceManager('context-1');
      const manager2 = getNonceManager('context-2');

      expect(manager1).not.toBe(manager2);
    });

    it('should reset manager for context', () => {
      const manager1 = getNonceManager('test-context');
      manager1.getNextNonce(); // Increment counter

      resetNonceManager('test-context');

      const manager2 = getNonceManager('test-context');
      expect(manager2).not.toBe(manager1);
      expect(manager2.getCounter()).toBe(0n);
    });

    it('should reset all managers', () => {
      const manager1 = getNonceManager('context-1');
      const manager2 = getNonceManager('context-2');

      manager1.getNextNonce();
      manager2.getNextNonce();

      resetAllNonceManagers();

      const newManager1 = getNonceManager('context-1');
      const newManager2 = getNonceManager('context-2');

      expect(newManager1).not.toBe(manager1);
      expect(newManager2).not.toBe(manager2);
      expect(newManager1.getCounter()).toBe(0n);
      expect(newManager2.getCounter()).toBe(0n);
    });

    it('should create scoped manager', () => {
      const scoped1 = createScopedNonceManager();
      const scoped2 = createScopedNonceManager();

      expect(scoped1).not.toBe(scoped2);
      expect(scoped1).toBeInstanceOf(NonceManager);
      expect(scoped2).toBeInstanceOf(NonceManager);
    });
  });

  describe('Performance', () => {
    it('should generate nonces quickly', () => {
      const manager = new NonceManager();
      const iterations = 10000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        manager.getNextNonce();
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(0.1); // < 0.1ms per nonce
    });

    it('should handle high-frequency generation', () => {
      const manager = new NonceManager();
      const nonces: Uint8Array[] = [];

      for (let i = 0; i < 1000; i++) {
        nonces.push(manager.getNextNonce());
      }

      // Verify all are unique
      const uniqueNonces = new Set(
        nonces.map(n => Array.from(n).join(','))
      );
      expect(uniqueNonces.size).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should throw on counter overflow', () => {
      const prefix = new Uint8Array(4);
      const maxCounter = 2n ** 64n - 1n;
      const manager = NonceManager.fromState(prefix, maxCounter);

      expect(() => {
        manager.getNextNonce();
      }).toThrow('NonceManager counter overflow');
    });

    it('should handle large counter values', () => {
      const prefix = new Uint8Array(4);
      const largeCounter = 2n ** 50n;
      const manager = NonceManager.fromState(prefix, largeCounter);

      const nonce = manager.getNextNonce();

      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);
      expect(manager.getCounter()).toBe(largeCounter + 1n);
    });

    it('should handle zero counter', () => {
      const prefix = new Uint8Array([1, 2, 3, 4]);
      const manager = NonceManager.fromState(prefix, 0n);

      const nonce = manager.getNextNonce();
      const counter = new DataView(nonce.buffer, nonce.byteOffset + 4, 8).getBigUint64(0, false);

      expect(counter).toBe(0n);
      expect(manager.getCounter()).toBe(1n);
    });
  });

  describe('Nonce Structure', () => {
    it('should have correct byte layout', () => {
      const prefix = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);
      const manager = NonceManager.fromState(prefix, 0x123456789ABCDEFn);

      const nonce = manager.getNextNonce();

      // Check prefix (bytes 0-3)
      expect(nonce[0]).toBe(0xAA);
      expect(nonce[1]).toBe(0xBB);
      expect(nonce[2]).toBe(0xCC);
      expect(nonce[3]).toBe(0xDD);

      // Check counter (bytes 4-11, big-endian)
      const counter = new DataView(nonce.buffer, nonce.byteOffset + 4, 8).getBigUint64(0, false);
      expect(counter).toBe(0x123456789ABCDEFn);
    });

    it('should use big-endian byte order for counter', () => {
      const prefix = new Uint8Array(4);
      const manager = NonceManager.fromState(prefix, 0x0102030405060708n);

      const nonce = manager.getNextNonce();

      // Big-endian: most significant byte first
      expect(nonce[4]).toBe(0x01);
      expect(nonce[5]).toBe(0x02);
      expect(nonce[6]).toBe(0x03);
      expect(nonce[7]).toBe(0x04);
      expect(nonce[8]).toBe(0x05);
      expect(nonce[9]).toBe(0x06);
      expect(nonce[10]).toBe(0x07);
      expect(nonce[11]).toBe(0x08);
    });
  });

  describe('Thread Safety Simulation', () => {
    it('should generate unique nonces in rapid succession', () => {
      const manager = new NonceManager();
      const nonces: Uint8Array[] = [];

      // Simulate rapid concurrent requests
      for (let i = 0; i < 100; i++) {
        nonces.push(manager.getNextNonce());
      }

      const uniqueNonces = new Set(
        nonces.map(n => Array.from(n).join(','))
      );

      expect(uniqueNonces.size).toBe(100);
    });
  });

  describe('Persistence Simulation', () => {
    it('should safely persist and restore state', () => {
      const manager1 = new NonceManager();

      // Generate some nonces
      for (let i = 0; i < 10; i++) {
        manager1.getNextNonce();
      }

      // Get state
      const state = manager1.getState();

      // Restore from state
      const manager2 = NonceManager.fromState(state.prefix, state.counter);

      // Both should generate same sequence now
      const nonce1 = manager1.getNextNonce();
      const nonce2 = manager2.getNextNonce();

      expect(nonce1).toEqual(nonce2);
    });

    it('should handle state serialization', () => {
      const manager = new NonceManager();
      manager.getNextNonce();
      manager.getNextNonce();

      const state = manager.getState();

      // Simulate JSON serialization
      const serialized = {
        prefix: Array.from(state.prefix),
        counter: state.counter.toString(),
      };

      // Deserialize
      const restoredPrefix = new Uint8Array(serialized.prefix);
      const restoredCounter = BigInt(serialized.counter);

      const restoredManager = NonceManager.fromState(restoredPrefix, restoredCounter);

      expect(restoredManager.getCounter()).toBe(state.counter);
    });
  });
});
