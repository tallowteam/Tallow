'use client';

/**
 * Session Key Rotation with Forward Secrecy
 * Implements automatic key rotation using a ratcheting protocol
 *
 * SECURITY: Provides forward secrecy - even if current key is compromised,
 * past communications remain secure
 */

import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { memoryWiper } from './memory-wiper';
import secureLog from '@/lib/utils/secure-logger';

/**
 * Session keys with rotation metadata
 */
export interface RotatingSessionKeys {
  encryptionKey: Uint8Array;  // Current encryption key
  authKey: Uint8Array;        // Current authentication key
  sessionId: Uint8Array;      // Session identifier
  generation: number;         // Key generation number (increments on rotation)
  rotatedAt: number;          // Timestamp of last rotation
  nextRotationAt: number;     // Timestamp of next scheduled rotation
}

/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
  rotationIntervalMs: number;  // How often to rotate (default: 5 minutes)
  maxGenerations: number;      // Maximum generations before rekeying (default: 100)
  enableAutoRotation: boolean; // Enable automatic time-based rotation
}

/**
 * Default rotation configuration
 */
const DEFAULT_ROTATION_CONFIG: KeyRotationConfig = {
  rotationIntervalMs: 5 * 60 * 1000, // 5 minutes
  maxGenerations: 100,
  enableAutoRotation: true,
};

/**
 * Key Rotation Manager
 * Manages automatic session key rotation with forward secrecy
 */
export class KeyRotationManager {
  private currentKeys: RotatingSessionKeys | null = null;
  private config: KeyRotationConfig;
  private rotationTimer: ReturnType<typeof setTimeout> | null = null;
  private rotationCallbacks: Array<(keys: RotatingSessionKeys) => void> = [];

  constructor(config: Partial<KeyRotationConfig> = {}) {
    this.config = { ...DEFAULT_ROTATION_CONFIG, ...config };
  }

  /**
   * Initialize session with base keys
   * @param baseSharedSecret - Initial shared secret from key exchange
   */
  initialize(baseSharedSecret: Uint8Array): RotatingSessionKeys {
    const now = Date.now();

    // Derive initial session keys using HKDF
    const keys = this.deriveSessionKeys(baseSharedSecret, 0);

    this.currentKeys = {
      ...keys,
      generation: 0,
      rotatedAt: now,
      nextRotationAt: now + this.config.rotationIntervalMs,
    };

    // Start automatic rotation if enabled
    if (this.config.enableAutoRotation) {
      this.scheduleNextRotation();
    }

    return this.currentKeys;
  }

  /**
   * Derive session keys from a secret using HKDF
   * @param secret - Input key material
   * @param generation - Key generation number
   */
  private deriveSessionKeys(
    secret: Uint8Array,
    generation: number
  ): Pick<RotatingSessionKeys, 'encryptionKey' | 'authKey' | 'sessionId'> {
    // Include generation in derivation for domain separation
    const info = new TextEncoder().encode(
      `tallow-session-keys-v2-gen-${generation}`
    );
    const salt = new TextEncoder().encode('tallow-key-rotation-v1-2024');

    // Derive 80 bytes: 32 (encryption) + 32 (auth) + 16 (session ID)
    const keyMaterial = hkdf(sha256, secret, salt, info, 80);

    return {
      encryptionKey: keyMaterial.slice(0, 32),
      authKey: keyMaterial.slice(32, 64),
      sessionId: keyMaterial.slice(64, 80),
    };
  }

  /**
   * Perform key rotation using ratcheting
   * Creates new keys from current keys using one-way function (HKDF)
   *
   * This provides forward secrecy: old keys cannot be derived from new keys
   */
  rotateKeys(): RotatingSessionKeys {
    if (!this.currentKeys) {
      throw new Error('KeyRotationManager not initialized');
    }

    const currentGeneration = this.currentKeys.generation;

    // Check if we've exceeded max generations
    if (currentGeneration >= this.config.maxGenerations) {
      throw new Error(
        `Maximum key generations (${this.config.maxGenerations}) reached. ` +
        'Perform full key exchange to establish new session.'
      );
    }

    // Create ratchet input: combine current keys
    const ratchetInput = new Uint8Array(64);
    ratchetInput.set(this.currentKeys.encryptionKey, 0);
    ratchetInput.set(this.currentKeys.authKey, 32);

    // Derive next generation keys using one-way function
    const newGeneration = currentGeneration + 1;
    const newKeys = this.deriveSessionKeys(ratchetInput, newGeneration);

    // Securely wipe old keys from memory
    memoryWiper.wipeBuffer(this.currentKeys.encryptionKey);
    memoryWiper.wipeBuffer(this.currentKeys.authKey);
    memoryWiper.wipeBuffer(ratchetInput);

    const now = Date.now();
    this.currentKeys = {
      ...newKeys,
      generation: newGeneration,
      rotatedAt: now,
      nextRotationAt: now + this.config.rotationIntervalMs,
    };

    // Notify callbacks
    this.notifyRotation(this.currentKeys);

    // Schedule next rotation
    if (this.config.enableAutoRotation) {
      this.scheduleNextRotation();
    }

    return this.currentKeys;
  }

  /**
   * Schedule next automatic rotation
   */
  private scheduleNextRotation(): void {
    // Clear existing timer
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = null;
    }

    if (!this.currentKeys || !this.config.enableAutoRotation) {
      return;
    }

    const timeUntilRotation = Math.max(
      0,
      this.currentKeys.nextRotationAt - Date.now()
    );

    this.rotationTimer = setTimeout(() => {
      try {
        this.rotateKeys();
      } catch (err) {
        secureLog.error('Automatic key rotation failed:', err);
      }
    }, timeUntilRotation);
  }

  /**
   * Check if keys need rotation
   */
  needsRotation(): boolean {
    if (!this.currentKeys) {return false;}
    return Date.now() >= this.currentKeys.nextRotationAt;
  }

  /**
   * Get current session keys
   */
  getCurrentKeys(): RotatingSessionKeys | null {
    return this.currentKeys;
  }

  /**
   * Get current key generation
   */
  getGeneration(): number {
    return this.currentKeys?.generation ?? 0;
  }

  /**
   * Register callback for rotation events
   */
  onRotation(callback: (keys: RotatingSessionKeys) => void): () => void {
    this.rotationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.rotationCallbacks.indexOf(callback);
      if (index > -1) {
        this.rotationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks of rotation
   */
  private notifyRotation(keys: RotatingSessionKeys): void {
    for (const callback of this.rotationCallbacks) {
      try {
        callback(keys);
      } catch (err) {
        secureLog.error('Key rotation callback error:', err);
      }
    }
  }

  /**
   * Manually trigger key rotation
   * Useful for rotating on specific events (e.g., before sending sensitive data)
   */
  forceRotation(): RotatingSessionKeys {
    return this.rotateKeys();
  }

  /**
   * Update rotation configuration
   */
  updateConfig(config: Partial<KeyRotationConfig>): void {
    this.config = { ...this.config, ...config };

    // Update nextRotationAt if interval changed
    if (config.rotationIntervalMs !== undefined && this.currentKeys) {
      const elapsed = Date.now() - this.currentKeys.rotatedAt;
      const newRemaining = Math.max(0, config.rotationIntervalMs - elapsed);

      // Recalculate nextRotationAt based on new interval
      this.currentKeys.nextRotationAt = Date.now() + newRemaining;
    }

    // Restart rotation timer with new config
    if (this.config.enableAutoRotation && this.currentKeys) {
      this.scheduleNextRotation();
    }
  }

  /**
   * Destroy session and wipe all keys
   */
  destroy(): void {
    // Clear rotation timer
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = null;
    }

    // Wipe current keys
    if (this.currentKeys) {
      memoryWiper.wipeBuffer(this.currentKeys.encryptionKey);
      memoryWiper.wipeBuffer(this.currentKeys.authKey);
      memoryWiper.wipeBuffer(this.currentKeys.sessionId);
      this.currentKeys = null;
    }

    // Clear callbacks
    this.rotationCallbacks = [];
  }

  /**
   * Export rotation state for synchronization
   * Used to sync rotation state between sender and receiver
   */
  exportState(): {
    generation: number;
    rotatedAt: number;
    sessionIdHex: string;
  } | null {
    if (!this.currentKeys) {return null;}

    return {
      generation: this.currentKeys.generation,
      rotatedAt: this.currentKeys.rotatedAt,
      sessionIdHex: Array.from(this.currentKeys.sessionId)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
  }

  /**
   * Verify rotation state matches peer
   * Ensures both peers are using the same key generation
   */
  verifyState(peerState: {
    generation: number;
    sessionIdHex: string;
  }): boolean {
    if (!this.currentKeys) {return false;}

    if (peerState.generation !== this.currentKeys.generation) {
      return false;
    }

    const ownSessionIdHex = Array.from(this.currentKeys.sessionId)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return ownSessionIdHex === peerState.sessionIdHex;
  }

  /**
   * Sync to a specific generation
   * Catches up to peer's generation if we're behind
   */
  syncToGeneration(targetGeneration: number): RotatingSessionKeys {
    if (!this.currentKeys) {
      throw new Error('Cannot sync uninitialized session');
    }

    if (targetGeneration < this.currentKeys.generation) {
      throw new Error('Cannot sync backwards - target generation is older');
    }

    if (targetGeneration === this.currentKeys.generation) {
      return this.currentKeys;
    }

    // Rotate multiple times to catch up
    const rotationsNeeded = targetGeneration - this.currentKeys.generation;
    if (rotationsNeeded > 10) {
      throw new Error(
        `Too many rotations needed (${rotationsNeeded}). ` +
        'Perform full key exchange instead.'
      );
    }

    for (let i = 0; i < rotationsNeeded; i++) {
      this.rotateKeys();
    }

    return this.currentKeys!;
  }
}

/**
 * Create a key rotation manager instance
 */
export function createKeyRotationManager(
  config?: Partial<KeyRotationConfig>
): KeyRotationManager {
  return new KeyRotationManager(config);
}

/**
 * Default export
 */
export default {
  KeyRotationManager,
  createKeyRotationManager,
};
