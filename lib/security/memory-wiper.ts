'use client';

/**
 * Memory Wiping Utilities
 * Securely clears sensitive data from memory to prevent leakage
 *
 * SECURITY: Defense-in-depth against memory dumps, cold boot attacks, and debugging
 */

/**
 * Securely wipe a Uint8Array by overwriting with random data
 * Prevents sensitive data from remaining in memory after use
 *
 * @param buffer - The buffer to wipe
 * @param passes - Number of overwrite passes (default: 3)
 */
export function secureWipeBuffer(buffer: Uint8Array, passes: number = 3): void {
  if (!buffer || !(buffer instanceof Uint8Array)) {
    return;
  }

  const length = buffer.length;
  if (length === 0) {return;}

  // crypto.getRandomValues has a 65,536 byte limit
  const CHUNK_SIZE = 65536;

  // Multiple passes with different patterns for paranoid security
  for (let pass = 0; pass < passes; pass++) {
    if (pass === 0) {
      // Pass 1: Random data (in chunks for large buffers)
      for (let offset = 0; offset < length; offset += CHUNK_SIZE) {
        const chunkEnd = Math.min(offset + CHUNK_SIZE, length);
        const chunk = buffer.subarray(offset, chunkEnd);
        crypto.getRandomValues(chunk);
      }
    } else if (pass === 1) {
      // Pass 2: All zeros
      buffer.fill(0);
    } else {
      // Pass 3+: Alternating pattern
      buffer.fill(pass % 2 === 0 ? 0xAA : 0x55);
    }
  }

  // Final pass: zeros
  buffer.fill(0);
}

/**
 * Securely wipe a string from memory
 * Note: JavaScript strings are immutable, so we can't truly wipe them.
 * This function creates a mutable representation and wipes it.
 *
 * @param str - The string to wipe (creates a buffer copy)
 * @returns A wiped buffer representation
 */
export function secureWipeString(str: string): Uint8Array {
  if (!str || typeof str !== 'string') {
    return new Uint8Array(0);
  }

  const encoder = new TextEncoder();
  const buffer = encoder.encode(str);
  secureWipeBuffer(buffer);
  return buffer;
}

/**
 * Securely clear an array of buffers
 * Useful for wiping multiple keys at once
 *
 * @param buffers - Array of buffers to wipe
 */
export function secureWipeBuffers(buffers: Uint8Array[]): void {
  if (!Array.isArray(buffers)) {return;}

  for (const buffer of buffers) {
    if (buffer instanceof Uint8Array) {
      secureWipeBuffer(buffer);
    }
  }
}

/**
 * Securely wipe an object containing sensitive Uint8Array fields
 * Automatically detects and wipes all Uint8Array properties
 *
 * @param obj - Object containing sensitive data
 */
export function secureWipeObject(obj: Record<string, unknown>): void {
  if (!obj || typeof obj !== 'object') {return;}

  for (const key in obj) {
    const value = obj[key];

    if (value instanceof Uint8Array) {
      secureWipeBuffer(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively wipe nested objects
      secureWipeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      // Wipe arrays of buffers
      for (const item of value) {
        if (item instanceof Uint8Array) {
          secureWipeBuffer(item);
        }
      }
    }
  }
}

/**
 * Create a self-wiping wrapper for sensitive data
 * Automatically wipes data when the wrapper is disposed
 *
 * Usage:
 * ```ts
 * const wrapper = createSecureWrapper(sensitiveKey);
 * try {
 *   // Use wrapper.data
 * } finally {
 *   wrapper.dispose();
 * }
 * ```
 */
export class SecureWrapper<T extends Uint8Array | Record<string, unknown>> {
  private _data: T | null;
  private _disposed: boolean = false;

  constructor(data: T) {
    this._data = data;
  }

  get data(): T {
    if (this._disposed) {
      throw new Error('SecureWrapper: Data has been disposed');
    }
    if (!this._data) {
      throw new Error('SecureWrapper: Data is null');
    }
    return this._data;
  }

  /**
   * Check if wrapper has been disposed
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Securely wipe and dispose of the data
   */
  dispose(): void {
    if (this._disposed) {return;}

    if (this._data) {
      if (this._data instanceof Uint8Array) {
        secureWipeBuffer(this._data);
      } else if (typeof this._data === 'object') {
        secureWipeObject(this._data as Record<string, unknown>);
      }
    }

    this._data = null;
    this._disposed = true;
  }

  /**
   * Execute a function with the data and auto-dispose afterwards
   */
  async use<R>(fn: (data: T) => Promise<R>): Promise<R> {
    try {
      return await fn(this.data);
    } finally {
      this.dispose();
    }
  }

  /**
   * Execute a synchronous function with the data and auto-dispose afterwards
   */
  useSync<R>(fn: (data: T) => R): R {
    try {
      return fn(this.data);
    } finally {
      this.dispose();
    }
  }
}

/**
 * Create a secure wrapper for sensitive data
 */
export function createSecureWrapper<T extends Uint8Array | Record<string, unknown>>(
  data: T
): SecureWrapper<T> {
  return new SecureWrapper(data);
}

/**
 * Wipe a file chunk after processing
 * Special handling for encrypted chunks to ensure complete cleanup
 *
 * @param chunk - Chunk data to wipe
 */
export interface ChunkData {
  data: Uint8Array;
  nonce?: Uint8Array;
  hash?: Uint8Array;
  [key: string]: unknown;
}

export function secureWipeChunk(chunk: ChunkData): void {
  if (!chunk || typeof chunk !== 'object') {return;}

  if (chunk.data instanceof Uint8Array) {
    secureWipeBuffer(chunk.data);
  }
  if (chunk.nonce instanceof Uint8Array) {
    secureWipeBuffer(chunk.nonce);
  }
  if (chunk.hash instanceof Uint8Array) {
    secureWipeBuffer(chunk.hash);
  }
}

/**
 * Auto-wipe hook for React components
 * Wipes data when component unmounts
 *
 * Usage:
 * ```ts
 * const cleanup = useAutoWipe(sensitiveData);
 * // cleanup() will be called on unmount
 * ```
 */
export function createAutoWipeCleanup(
  data: Uint8Array | Uint8Array[] | Record<string, unknown>
): () => void {
  return () => {
    if (data instanceof Uint8Array) {
      secureWipeBuffer(data);
    } else if (Array.isArray(data)) {
      secureWipeBuffers(data);
    } else if (typeof data === 'object') {
      secureWipeObject(data);
    }
  };
}

/**
 * Securely compare two buffers and wipe them afterwards
 * Combines timing-safe comparison with automatic cleanup
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @param wipeAfter - Whether to wipe buffers after comparison (default: true)
 * @returns true if buffers are equal
 */
export function compareAndWipe(
  a: Uint8Array,
  b: Uint8Array,
  wipeAfter: boolean = true
): boolean {
  if (!a || !b) {return false;}
  if (a.length !== b.length) {return false;}

  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    if (aVal !== undefined && bVal !== undefined) {
      result |= aVal ^ bVal;
    }
  }

  if (wipeAfter) {
    secureWipeBuffer(a);
    secureWipeBuffer(b);
  }

  return result === 0;
}

/**
 * Memory wiping utilities for session cleanup
 */
export const memoryWiper = {
  wipeBuffer: secureWipeBuffer,
  wipeString: secureWipeString,
  wipeBuffers: secureWipeBuffers,
  wipeObject: secureWipeObject,
  wipeChunk: secureWipeChunk,
  createWrapper: createSecureWrapper,
  createCleanup: createAutoWipeCleanup,
  compareAndWipe,
};

export default memoryWiper;
