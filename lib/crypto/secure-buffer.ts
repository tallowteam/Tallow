/**
 * SecureBuffer -- Agent 017 (MEMORY-WARDEN) Core Module
 *
 * Provides a managed wrapper around Uint8Array for all cryptographic key material.
 * Every key, every shared secret, every password derivative MUST use SecureBuffer
 * so that material is zeroed the moment it is no longer needed.
 *
 * Security properties:
 * 1. Double-overwrite pattern (random then zero) prevents optimizer from eliding the wipe.
 * 2. FinalizationRegistry provides automatic cleanup when GC reclaims the SecureBuffer.
 * 3. Global registry tracks every live SecureBuffer for emergency session teardown.
 * 4. IndexedDB encryption helper ensures keys are encrypted at rest with a session key.
 * 5. TypedArrays exclusively -- never strings (immutable, cannot be zeroed).
 *
 * IMPORTANT: FinalizationRegistry is a safety net, NOT the primary mechanism.
 * Callers MUST explicitly call .zero() in a finally block.
 */

// ============================================================================
// zeroMemory -- the foundational wipe primitive
// ============================================================================

/**
 * Securely wipe a Uint8Array using the double-overwrite pattern.
 *
 * Step 1: Overwrite with cryptographically random bytes.
 *         This forces the runtime to actually write to the memory region,
 *         preventing the optimizer from recognizing a "dead store" and
 *         eliding it. The random overwrite also destroys the original data
 *         even if step 2 is somehow interrupted.
 *
 * Step 2: Overwrite with zeros.
 *         The final state is deterministic (all zeros), making it easy to
 *         verify in heap snapshots that no key material persists.
 *
 * crypto.getRandomValues has a 65,536-byte limit per call, so we chunk.
 */
export function zeroMemory(buffer: Uint8Array): void {
  if (!buffer || buffer.length === 0) {
    return;
  }

  const length = buffer.length;
  const CHUNK_LIMIT = 65536;

  // Step 1: Overwrite with random data (prevents optimizer elision)
  for (let offset = 0; offset < length; offset += CHUNK_LIMIT) {
    const end = Math.min(offset + CHUNK_LIMIT, length);
    const chunk = buffer.subarray(offset, end);
    try {
      crypto.getRandomValues(chunk);
    } catch {
      // Fallback: write non-zero pattern if crypto.getRandomValues is unavailable
      // (e.g. in a detached worker context). This still prevents optimizer elision
      // because the written values are data-dependent (loop index).
      for (let i = offset; i < end; i++) {
        buffer[i] = (i & 0xff) ^ 0xa5;
      }
    }
  }

  // Step 2: Overwrite with zeros
  buffer.fill(0);
}

/**
 * Wipe multiple Uint8Arrays in one call.
 */
export function zeroMemoryAll(...buffers: (Uint8Array | null | undefined)[]): void {
  for (const buffer of buffers) {
    if (buffer) {
      zeroMemory(buffer);
    }
  }
}

// ============================================================================
// Global Key Registry
// ============================================================================

/**
 * WeakRef-based set of all live SecureBuffer instances.
 * This allows emergency wipe without preventing GC.
 *
 * We use a Set<WeakRef<SecureBuffer>> rather than a WeakSet because
 * WeakSet does not allow iteration -- we need to iterate for destroyAllKeys().
 */
const liveBuffers: Set<WeakRef<SecureBuffer>> = new Set();

/**
 * Periodically prune dead WeakRefs to prevent unbounded growth.
 * We piggyback on createSecureBuffer / destroyAllKeys rather than a timer.
 */
let pruneCounter = 0;
const PRUNE_INTERVAL = 64; // prune every 64th allocation

function pruneDeadRefs(): void {
  for (const ref of liveBuffers) {
    if (ref.deref() === undefined) {
      liveBuffers.delete(ref);
    }
  }
}

// ============================================================================
// FinalizationRegistry
// ============================================================================

/**
 * FinalizationRegistry auto-zeros the backing buffer when a SecureBuffer
 * is garbage-collected without an explicit .zero() call.
 *
 * SAFETY NET ONLY. Callers MUST call .zero() explicitly.
 * The GC callback is non-deterministic and may run late (or never, on shutdown).
 *
 * The held value is the raw Uint8Array (not the SecureBuffer itself),
 * because the SecureBuffer is being finalized -- we cannot reference it.
 */
let finalizationRegistry: FinalizationRegistry<Uint8Array> | null = null;

function getRegistry(): FinalizationRegistry<Uint8Array> | null {
  if (finalizationRegistry) {
    return finalizationRegistry;
  }
  if (typeof FinalizationRegistry !== 'undefined') {
    finalizationRegistry = new FinalizationRegistry<Uint8Array>((heldBuffer) => {
      // The SecureBuffer was GC'd without .zero() being called.
      // This is the safety net -- wipe the backing array.
      zeroMemory(heldBuffer);
    });
  }
  return finalizationRegistry;
}

// ============================================================================
// SecureBuffer Class
// ============================================================================

/**
 * SecureBuffer wraps a Uint8Array containing cryptographic key material.
 *
 * It guarantees:
 * - Explicit zeroing via .zero() (MUST be called in a finally block)
 * - Automatic zeroing via FinalizationRegistry if .zero() was forgotten
 * - Global tracking for emergency destroyAllKeys()
 * - Read-after-zero throws to prevent use of wiped material
 * - Length and content validation at construction time
 */
export class SecureBuffer {
  /**
   * The backing TypedArray. Set to null after zeroing to release the reference
   * and allow GC of the zeroed buffer.
   */
  private _buffer: Uint8Array | null;

  /**
   * Tracks whether .zero() has been called.
   */
  private _zeroed: boolean = false;

  /**
   * Original length, preserved after zeroing for diagnostics.
   */
  public readonly length: number;

  /**
   * A label for debugging/logging (NEVER include key material in labels).
   */
  public readonly label: string;

  /**
   * Monotonic creation timestamp for auditing lifetime.
   */
  public readonly createdAt: number;

  /**
   * WeakRef stored in the global registry so we can remove it on zero().
   */
  private _weakRef: WeakRef<SecureBuffer> | null = null;

  /**
   * Unregister token for the FinalizationRegistry.
   */
  private _unregisterToken: object;

  // --------------------------------------------------------------------------
  // Construction
  // --------------------------------------------------------------------------

  private constructor(buffer: Uint8Array, label: string) {
    if (!(buffer instanceof Uint8Array)) {
      throw new TypeError('SecureBuffer requires a Uint8Array');
    }
    if (buffer.length === 0) {
      throw new RangeError('SecureBuffer cannot wrap an empty buffer');
    }

    this._buffer = buffer;
    this.length = buffer.length;
    this.label = label;
    this.createdAt = Date.now();
    this._unregisterToken = {};

    // Register with FinalizationRegistry (safety net)
    const registry = getRegistry();
    if (registry) {
      registry.register(this, buffer, this._unregisterToken);
    }

    // Register in global live set
    this._weakRef = new WeakRef(this);
    liveBuffers.add(this._weakRef);

    // Periodic prune
    pruneCounter++;
    if (pruneCounter >= PRUNE_INTERVAL) {
      pruneCounter = 0;
      pruneDeadRefs();
    }
  }

  // --------------------------------------------------------------------------
  // Factory Methods
  // --------------------------------------------------------------------------

  /**
   * Create a SecureBuffer by copying data from an existing Uint8Array.
   * The original is NOT zeroed by this method -- the caller retains ownership
   * and should zero it separately if needed.
   */
  static from(data: Uint8Array, label: string = 'unnamed'): SecureBuffer {
    const copy = new Uint8Array(data.length);
    copy.set(data);
    return new SecureBuffer(copy, label);
  }

  /**
   * Create a SecureBuffer by taking ownership of an existing Uint8Array.
   * After this call the caller MUST NOT use the original array -- the
   * SecureBuffer now owns it.
   */
  static own(data: Uint8Array, label: string = 'unnamed'): SecureBuffer {
    return new SecureBuffer(data, label);
  }

  /**
   * Create a SecureBuffer filled with cryptographically random bytes.
   */
  static random(length: number, label: string = 'random'): SecureBuffer {
    if (length <= 0) {
      throw new RangeError('SecureBuffer.random requires a positive length');
    }
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return new SecureBuffer(buffer, label);
  }

  /**
   * Create an uninitialized SecureBuffer of a given length (all zeros).
   * Useful when the caller will immediately write into it.
   */
  static alloc(length: number, label: string = 'alloc'): SecureBuffer {
    if (length <= 0) {
      throw new RangeError('SecureBuffer.alloc requires a positive length');
    }
    return new SecureBuffer(new Uint8Array(length), label);
  }

  // --------------------------------------------------------------------------
  // Data Access
  // --------------------------------------------------------------------------

  /**
   * Access the underlying Uint8Array.
   * Throws if the buffer has been zeroed.
   */
  get data(): Uint8Array {
    if (this._zeroed || this._buffer === null) {
      throw new Error(
        `SecureBuffer[${this.label}]: access after zero -- key material has been wiped`
      );
    }
    return this._buffer;
  }

  /**
   * Whether this buffer has been zeroed.
   */
  get isZeroed(): boolean {
    return this._zeroed;
  }

  // --------------------------------------------------------------------------
  // Zeroing
  // --------------------------------------------------------------------------

  /**
   * Securely wipe the buffer contents using the double-overwrite pattern.
   *
   * This is the PRIMARY cleanup mechanism. Always call in a finally block:
   *
   * ```ts
   * const key = SecureBuffer.random(32, 'session-key');
   * try {
   *   // use key.data ...
   * } finally {
   *   key.zero();
   * }
   * ```
   *
   * Calling zero() multiple times is safe (idempotent).
   */
  zero(): void {
    if (this._zeroed) {
      return;
    }

    // Wipe the backing buffer
    if (this._buffer) {
      zeroMemory(this._buffer);
    }

    // Mark as zeroed
    this._zeroed = true;

    // Release the buffer reference
    this._buffer = null;

    // Unregister from FinalizationRegistry (no longer needed)
    const registry = getRegistry();
    if (registry) {
      registry.unregister(this._unregisterToken);
    }

    // Remove from global live set
    if (this._weakRef) {
      liveBuffers.delete(this._weakRef);
      this._weakRef = null;
    }
  }

  // --------------------------------------------------------------------------
  // Convenience: use-and-zero pattern
  // --------------------------------------------------------------------------

  /**
   * Execute an async callback with the buffer, then zero regardless of outcome.
   */
  async useAsync<R>(fn: (data: Uint8Array) => Promise<R>): Promise<R> {
    try {
      return await fn(this.data);
    } finally {
      this.zero();
    }
  }

  /**
   * Execute a sync callback with the buffer, then zero regardless of outcome.
   */
  use<R>(fn: (data: Uint8Array) => R): R {
    try {
      return fn(this.data);
    } finally {
      this.zero();
    }
  }

  // --------------------------------------------------------------------------
  // Utility
  // --------------------------------------------------------------------------

  /**
   * Create a copy of this SecureBuffer (the copy is a new SecureBuffer).
   * Throws if the original is already zeroed.
   */
  clone(label?: string): SecureBuffer {
    return SecureBuffer.from(this.data, label ?? `${this.label}-clone`);
  }

  /**
   * Constant-time equality comparison.
   * Both buffers remain live after comparison (neither is zeroed).
   */
  equals(other: SecureBuffer | Uint8Array): boolean {
    const a = this.data;
    const b = other instanceof SecureBuffer ? other.data : other;

    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= (a[i] ?? 0) ^ (b[i] ?? 0);
    }
    return result === 0;
  }
}

// ============================================================================
// Emergency Session Teardown
// ============================================================================

/**
 * Immediately zero every live SecureBuffer in the application.
 *
 * Call this during:
 * - Emergency session teardown
 * - Debugger/heap inspection detection
 * - Page unload (best-effort)
 * - Breach response
 *
 * After this call, all SecureBuffers will be zeroed and their .data
 * accessors will throw.
 *
 * Returns the count of buffers that were wiped.
 */
export function destroyAllKeys(): number {
  let count = 0;

  for (const ref of liveBuffers) {
    const sb = ref.deref();
    if (sb && !sb.isZeroed) {
      sb.zero();
      count++;
    }
  }

  // Clear the registry
  liveBuffers.clear();
  pruneCounter = 0;

  return count;
}

/**
 * Get a snapshot of live (non-zeroed) SecureBuffer count and total bytes.
 * For monitoring and audit only -- no key material is exposed.
 */
export function getSecureBufferStats(): {
  liveCount: number;
  totalBytes: number;
  labels: string[];
} {
  let liveCount = 0;
  let totalBytes = 0;
  const labels: string[] = [];

  for (const ref of liveBuffers) {
    const sb = ref.deref();
    if (sb && !sb.isZeroed) {
      liveCount++;
      totalBytes += sb.length;
      labels.push(sb.label);
    }
  }

  return { liveCount, totalBytes, labels };
}

// ============================================================================
// IndexedDB Encrypted Key Storage
// ============================================================================

/**
 * Encrypt key material for storage in IndexedDB using a session-derived key.
 *
 * Keys MUST NOT be stored in plaintext. This function uses AES-256-GCM
 * with a unique IV for each entry.
 *
 * @param keyMaterial - The raw key bytes to encrypt (will NOT be zeroed by this function)
 * @param sessionKey  - The session-derived encryption key (CryptoKey from WebCrypto)
 * @returns An object containing the IV and ciphertext for storage
 */
export async function encryptForStorage(
  keyMaterial: Uint8Array,
  sessionKey: CryptoKey
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      sessionKey,
      keyMaterial
    )
  );

  return { iv, ciphertext };
}

/**
 * Decrypt key material from IndexedDB storage.
 *
 * @param iv         - The IV used during encryption
 * @param ciphertext - The encrypted key bytes
 * @param sessionKey - The session-derived decryption key (CryptoKey from WebCrypto)
 * @returns A SecureBuffer wrapping the decrypted key material
 */
export async function decryptFromStorage(
  iv: Uint8Array,
  ciphertext: Uint8Array,
  sessionKey: CryptoKey,
  label: string = 'stored-key'
): Promise<SecureBuffer> {
  const plaintext = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      sessionKey,
      ciphertext
    )
  );

  return SecureBuffer.own(plaintext, label);
}

/**
 * Derive a session-local CryptoKey for encrypting keys in IndexedDB.
 *
 * Uses HKDF with a random salt and a caller-provided secret.
 * The salt should be stored alongside the database (it is not secret).
 *
 * @param secret - Raw secret material (e.g., from a master password KDF)
 * @param salt   - Random salt (stored alongside the DB; 32 bytes recommended)
 * @returns A non-extractable AES-256-GCM CryptoKey
 */
export async function deriveStorageKey(
  secret: Uint8Array,
  salt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    secret,
    'HKDF',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: new TextEncoder().encode('tallow.memory-warden.storage-key.v1'),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,  // non-extractable: the key cannot be exported from WebCrypto
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Convenience re-export for use across crypto modules
// ============================================================================

/**
 * Create a SecureBuffer -- shorthand for the most common factory.
 */
export function createSecureBuffer(
  data: Uint8Array,
  label?: string
): SecureBuffer {
  return SecureBuffer.own(data, label);
}
