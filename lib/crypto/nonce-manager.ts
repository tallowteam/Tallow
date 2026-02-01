'use client';

/**
 * Counter-Based Nonce Manager for AES-GCM and ChaCha20-Poly1305
 *
 * Security Rationale:
 * -------------------
 * Random nonces have a birthday paradox risk: with 96-bit nonces and 2^48 messages
 * encrypted with the same key, there is approximately a 50% chance of collision.
 * Nonce reuse in AES-GCM or ChaCha20-Poly1305 is catastrophic as it allows key recovery.
 *
 * This implementation uses counter-based nonces with a random prefix to ensure:
 * 1. No nonce collision within a session (counter guarantees uniqueness)
 * 2. No collision across sessions (random prefix provides session uniqueness)
 * 3. Safe for up to 2^64 messages per session (counter capacity)
 *
 * Nonce Structure (12 bytes / 96 bits):
 * [4 bytes: random session prefix][8 bytes: big-endian counter]
 *
 * The random prefix ensures different sessions never produce the same nonce sequence,
 * while the counter ensures monotonic uniqueness within each session.
 */

/**
 * NonceManager provides cryptographically safe counter-based nonces
 * for AEAD encryption (AES-GCM, ChaCha20-Poly1305).
 *
 * Each instance should be associated with a single encryption key.
 * Creating a new NonceManager for a new key is safe and recommended.
 */
export class NonceManager {
  private counter: bigint = 0n;
  private readonly prefix: Uint8Array;
  private readonly maxCounter: bigint = 2n ** 64n - 1n;

  /**
   * Create a new NonceManager with a random session prefix
   */
  constructor() {
    // Generate 4-byte random prefix for session uniqueness
    this.prefix = crypto.getRandomValues(new Uint8Array(4));
  }

  /**
   * Get the next unique nonce (12 bytes / 96 bits)
   *
   * @returns A unique 12-byte nonce
   * @throws Error if counter overflow (after 2^64 nonces - practically impossible)
   */
  getNextNonce(): Uint8Array {
    if (this.counter >= this.maxCounter) {
      throw new Error(
        'NonceManager counter overflow: maximum nonces exceeded for this session. ' +
        'Create a new session with a new key.'
      );
    }

    const nonce = new Uint8Array(12);

    // Set the 4-byte random prefix (bytes 0-3)
    nonce.set(this.prefix, 0);

    // Set the 8-byte counter in big-endian format (bytes 4-11)
    const view = new DataView(nonce.buffer);
    view.setBigUint64(4, this.counter, false); // false = big-endian

    this.counter++;

    return nonce;
  }

  /**
   * Get the current counter value (for debugging/monitoring)
   */
  getCounter(): bigint {
    return this.counter;
  }

  /**
   * Get remaining nonce capacity (for monitoring)
   */
  getRemainingCapacity(): bigint {
    return this.maxCounter - this.counter;
  }

  /**
   * Check if the manager is near capacity (warning threshold: 2^60 nonces used)
   */
  isNearCapacity(): boolean {
    return this.counter >= 2n ** 60n;
  }

  /**
   * Create a NonceManager from a specific prefix (for testing or persistence)
   *
   * WARNING: Only use this for testing or when restoring a persisted state.
   * For normal operation, use the default constructor.
   *
   * @param prefix 4-byte prefix
   * @param startCounter Starting counter value
   */
  static fromState(prefix: Uint8Array, startCounter: bigint): NonceManager {
    if (prefix.length !== 4) {
      throw new Error('Prefix must be exactly 4 bytes');
    }
    if (startCounter < 0n) {
      throw new Error('Counter cannot be negative');
    }

    const manager = new NonceManager();
    // Override the generated prefix with the provided one
    manager.prefix.set(prefix, 0);
    // Use Object.defineProperty to set the private counter
    Object.defineProperty(manager, 'counter', { value: startCounter, writable: true });

    return manager;
  }

  /**
   * Get the current state for persistence
   *
   * SECURITY NOTE: When persisting, increment the counter by a safety margin
   * to account for any nonces that may have been used but not persisted.
   */
  getState(): { prefix: Uint8Array; counter: bigint } {
    return {
      prefix: new Uint8Array(this.prefix),
      counter: this.counter,
    };
  }
}

/**
 * Global nonce managers for different encryption contexts
 *
 * IMPORTANT: Each manager is associated with a specific key type/context.
 * When keys are rotated, these managers should be reset.
 */
const nonceManagers = new Map<string, NonceManager>();

/**
 * Get or create a NonceManager for a specific context
 *
 * @param context Identifier for the encryption context (e.g., 'aes-gcm', 'chacha20')
 */
export function getNonceManager(context: string): NonceManager {
  let manager = nonceManagers.get(context);
  if (!manager) {
    manager = new NonceManager();
    nonceManagers.set(context, manager);
  }
  return manager;
}

/**
 * Reset a NonceManager for a context (call when key is rotated)
 *
 * @param context Identifier for the encryption context
 */
export function resetNonceManager(context: string): void {
  nonceManagers.delete(context);
}

/**
 * Reset all NonceManagers (call during key rotation or session reset)
 */
export function resetAllNonceManagers(): void {
  nonceManagers.clear();
}

/**
 * Create a scoped NonceManager for a specific key/session
 *
 * Use this when you need a dedicated nonce manager that won't be
 * shared with other encryption operations.
 */
export function createScopedNonceManager(): NonceManager {
  return new NonceManager();
}

export default NonceManager;
