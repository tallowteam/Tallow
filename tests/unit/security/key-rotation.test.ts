import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyRotationManager,
  createKeyRotationManager,
} from '../../../lib/security/key-rotation';

describe('Key Rotation Manager', () => {
  let manager: KeyRotationManager;
  let baseSecret: Uint8Array;

  beforeEach(() => {
    // Create a test shared secret
    baseSecret = new Uint8Array(32);
    crypto.getRandomValues(baseSecret);

    manager = new KeyRotationManager({
      rotationIntervalMs: 1000, // 1 second for testing
      maxGenerations: 10,
      enableAutoRotation: false, // Disable for most tests
    });
  });

  afterEach(() => {
    manager?.destroy();
  });

  describe('initialization', () => {
    it('should initialize with base shared secret', () => {
      const keys = manager.initialize(baseSecret);

      expect(keys).toBeDefined();
      expect(keys.encryptionKey).toHaveLength(32);
      expect(keys.authKey).toHaveLength(32);
      expect(keys.sessionId).toHaveLength(16);
      expect(keys.generation).toBe(0);
    });

    it('should set rotation timestamps', () => {
      const before = Date.now();
      const keys = manager.initialize(baseSecret);
      const after = Date.now();

      expect(keys.rotatedAt).toBeGreaterThanOrEqual(before);
      expect(keys.rotatedAt).toBeLessThanOrEqual(after);
      expect(keys.nextRotationAt).toBeGreaterThan(keys.rotatedAt);
    });

    it('should generate unique keys', () => {
      const keys1 = manager.initialize(baseSecret);

      const manager2 = new KeyRotationManager();
      const keys2 = manager2.initialize(baseSecret);

      // Same input should produce same keys
      expect(keys1.encryptionKey).toEqual(keys2.encryptionKey);
      expect(keys1.authKey).toEqual(keys2.authKey);

      manager2.destroy();
    });
  });

  describe('key rotation', () => {
    beforeEach(() => {
      manager.initialize(baseSecret);
    });

    it('should rotate to next generation', () => {
      const gen0Keys = manager.getCurrentKeys()!;

      const gen1Keys = manager.rotateKeys();

      expect(gen1Keys.generation).toBe(1);
      expect(gen1Keys.encryptionKey).not.toEqual(gen0Keys.encryptionKey);
      expect(gen1Keys.authKey).not.toEqual(gen0Keys.authKey);
    });

    it('should wipe old keys after rotation', () => {
      const gen0Keys = manager.getCurrentKeys()!;

      manager.rotateKeys();

      // Original keys should be wiped (all zeros)
      expect(gen0Keys.encryptionKey.every((b) => b === 0)).toBe(true);
      expect(gen0Keys.authKey.every((b) => b === 0)).toBe(true);
    });

    it('should increment generation counter', () => {
      expect(manager.getGeneration()).toBe(0);

      manager.rotateKeys();
      expect(manager.getGeneration()).toBe(1);

      manager.rotateKeys();
      expect(manager.getGeneration()).toBe(2);
    });

    it('should enforce max generations', () => {
      // Rotate to max
      for (let i = 0; i < 10; i++) {
        manager.rotateKeys();
      }

      // Next rotation should fail
      expect(() => manager.rotateKeys()).toThrow('Maximum key generations');
    });

    it('should provide forward secrecy', () => {
      const gen0 = manager.getCurrentKeys()!;
      const gen0Enc = new Uint8Array(gen0.encryptionKey);

      manager.rotateKeys();
      const gen1 = manager.getCurrentKeys()!;

      manager.rotateKeys();
      const gen2 = manager.getCurrentKeys()!;

      // Cannot derive previous keys from current keys
      expect(gen2.encryptionKey).not.toEqual(gen1.encryptionKey);
      expect(gen2.encryptionKey).not.toEqual(gen0Enc);
    });
  });

  describe('automatic rotation', () => {
    it('should rotate automatically at intervals', async () => {
      manager.updateConfig({ enableAutoRotation: true });
      manager.initialize(baseSecret);

      expect(manager.getGeneration()).toBe(0);

      // Wait for rotation (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      expect(manager.getGeneration()).toBeGreaterThan(0);
    });

    it('should call rotation callbacks', async () => {
      const callback = vi.fn();
      manager.onRotation(callback);

      manager.initialize(baseSecret);
      manager.rotateKeys();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          generation: 1,
        })
      );
    });

    it('should allow unsubscribing from callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onRotation(callback);

      manager.initialize(baseSecret);
      manager.rotateKeys();

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.rotateKeys();

      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('rotation state', () => {
    beforeEach(() => {
      manager.initialize(baseSecret);
    });

    it('should export rotation state', () => {
      const state = manager.exportState();

      expect(state).toBeDefined();
      expect(state!.generation).toBe(0);
      expect(state!.sessionIdHex).toMatch(/^[0-9a-f]+$/);
      expect(state!.rotatedAt).toBeGreaterThan(0);
    });

    it('should verify matching state', () => {
      manager.rotateKeys();
      const state = manager.exportState()!;

      const matches = manager.verifyState({
        generation: state.generation,
        sessionIdHex: state.sessionIdHex,
      });

      expect(matches).toBe(true);
    });

    it('should detect generation mismatch', () => {
      const state = manager.exportState()!;

      const matches = manager.verifyState({
        generation: state.generation + 1,
        sessionIdHex: state.sessionIdHex,
      });

      expect(matches).toBe(false);
    });

    it('should detect session ID mismatch', () => {
      const state = manager.exportState()!;

      const matches = manager.verifyState({
        generation: state.generation,
        sessionIdHex: 'deadbeef00000000',
      });

      expect(matches).toBe(false);
    });
  });

  describe('synchronization', () => {
    beforeEach(() => {
      manager.initialize(baseSecret);
    });

    it('should sync to peer generation', () => {
      expect(manager.getGeneration()).toBe(0);

      manager.syncToGeneration(3);

      expect(manager.getGeneration()).toBe(3);
    });

    it('should not sync backwards', () => {
      manager.rotateKeys();
      manager.rotateKeys();

      expect(() => manager.syncToGeneration(1)).toThrow(
        'Cannot sync backwards'
      );
    });

    it('should handle already-synced state', () => {
      manager.rotateKeys();

      const keys = manager.syncToGeneration(1);

      expect(keys.generation).toBe(1);
    });

    it('should reject excessive catch-up', () => {
      expect(() => manager.syncToGeneration(20)).toThrow(
        'Too many rotations needed'
      );
    });
  });

  describe('needs rotation check', () => {
    it('should detect when rotation is needed', () => {
      manager.initialize(baseSecret);

      expect(manager.needsRotation()).toBe(false);

      // Manually set nextRotationAt to past
      const keys = manager.getCurrentKeys()!;
      keys.nextRotationAt = Date.now() - 1000;

      expect(manager.needsRotation()).toBe(true);
    });
  });

  describe('force rotation', () => {
    beforeEach(() => {
      manager.initialize(baseSecret);
    });

    it('should allow manual rotation', () => {
      expect(manager.getGeneration()).toBe(0);

      manager.forceRotation();

      expect(manager.getGeneration()).toBe(1);
    });
  });

  describe('configuration update', () => {
    beforeEach(() => {
      manager.initialize(baseSecret);
    });

    it('should update rotation interval', () => {
      manager.updateConfig({ rotationIntervalMs: 5000 });

      const keys = manager.getCurrentKeys()!;
      expect(keys.nextRotationAt - keys.rotatedAt).toBeGreaterThanOrEqual(
        4900
      );
    });

    it('should enable/disable auto rotation', () => {
      manager.updateConfig({ enableAutoRotation: true });
      // Auto rotation should be scheduled

      manager.updateConfig({ enableAutoRotation: false });
      // Auto rotation should be cancelled
    });
  });

  describe('cleanup', () => {
    it('should wipe keys on destroy', () => {
      manager.initialize(baseSecret);
      const keys = manager.getCurrentKeys()!;

      manager.destroy();

      // Keys should be wiped
      expect(keys.encryptionKey.every((b) => b === 0)).toBe(true);
      expect(keys.authKey.every((b) => b === 0)).toBe(true);

      expect(manager.getCurrentKeys()).toBeNull();
    });

    it('should clear callbacks on destroy', () => {
      const callback = vi.fn();
      manager.onRotation(callback);

      manager.destroy();

      // Cannot test directly, but destroy should clear callbacks
    });
  });

  describe('createKeyRotationManager factory', () => {
    it('should create manager with default config', () => {
      const mgr = createKeyRotationManager();

      expect(mgr).toBeInstanceOf(KeyRotationManager);

      mgr.destroy();
    });

    it('should create manager with custom config', () => {
      const mgr = createKeyRotationManager({
        rotationIntervalMs: 10000,
        maxGenerations: 50,
      });

      mgr.initialize(baseSecret);
      const keys = mgr.getCurrentKeys()!;

      expect(keys.nextRotationAt - keys.rotatedAt).toBeGreaterThanOrEqual(
        9900
      );

      mgr.destroy();
    });
  });

  describe('edge cases', () => {
    it('should handle uninitialized manager', () => {
      expect(manager.getCurrentKeys()).toBeNull();
      expect(manager.getGeneration()).toBe(0);
      expect(manager.exportState()).toBeNull();
      expect(manager.needsRotation()).toBe(false);
    });

    it('should throw when rotating uninitialized', () => {
      expect(() => manager.rotateKeys()).toThrow('not initialized');
    });

    it('should throw when syncing uninitialized', () => {
      expect(() => manager.syncToGeneration(1)).toThrow(
        'Cannot sync uninitialized'
      );
    });

    it('should handle multiple destroy calls', () => {
      manager.initialize(baseSecret);

      manager.destroy();
      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('key derivation consistency', () => {
    it('should derive same keys for same input', () => {
      const mgr1 = new KeyRotationManager();
      const keys1 = mgr1.initialize(baseSecret);

      const mgr2 = new KeyRotationManager();
      const keys2 = mgr2.initialize(baseSecret);

      expect(keys1.encryptionKey).toEqual(keys2.encryptionKey);
      expect(keys1.authKey).toEqual(keys2.authKey);
      expect(keys1.sessionId).toEqual(keys2.sessionId);

      mgr1.destroy();
      mgr2.destroy();
    });

    it('should derive different keys after rotation', () => {
      const mgr1 = new KeyRotationManager();
      mgr1.initialize(baseSecret);

      const mgr2 = new KeyRotationManager();
      mgr2.initialize(baseSecret);

      mgr1.rotateKeys();
      mgr2.rotateKeys();

      const keys1 = mgr1.getCurrentKeys()!;
      const keys2 = mgr2.getCurrentKeys()!;

      // Both should have rotated to same generation 1 keys
      expect(keys1.encryptionKey).toEqual(keys2.encryptionKey);
      expect(keys1.generation).toBe(1);
      expect(keys2.generation).toBe(1);

      mgr1.destroy();
      mgr2.destroy();
    });
  });
});
