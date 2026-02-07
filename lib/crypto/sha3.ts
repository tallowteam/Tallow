'use client';

/**
 * SHA3-256 and SHAKE Quantum-Resistant Hash Functions
 * Implementation: FIPS 202 (Keccak-based SHA-3)
 *
 * This module provides pure TypeScript implementations of:
 * - SHA3-256: Fixed-length 256-bit hash (quantum-resistant)
 * - SHAKE-128: Extendable output function (XOF) with 128-bit security
 * - SHAKE-256: Extendable output function (XOF) with 256-bit security
 *
 * SECURITY:
 * - SHA3 is quantum-resistant (unlike SHA-2 which could be broken by Grover's algorithm)
 * - Uses Keccak-f[1600] permutation with 24 rounds
 * - No length-extension attacks (unlike SHA-2)
 * - Domain separation via padding suffix (0x06 for SHA3, 0x1f for SHAKE)
 *
 * PERFORMANCE:
 * - Pure TypeScript using BigInt for 64-bit operations
 * - Streaming API for large data without memory overhead
 * - Optimized for modern JavaScript engines
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * SHA3 hash context for streaming operations
 */
export interface Sha3Context {
  /** Current state (25 x 64-bit lanes = 1600 bits) */
  state: BigUint64Array;
  /** Input buffer for incomplete blocks */
  buffer: Uint8Array;
  /** Number of bytes in buffer */
  bufferLength: number;
  /** Rate in bytes (how many bytes absorbed per permutation) */
  rate: number;
  /** Domain separation byte (0x06 for SHA3, 0x1f for SHAKE) */
  delimiter: number;
}

/**
 * Streaming SHA3-256 hash interface
 */
export interface Sha3Stream {
  /** Add more data to hash */
  update(data: Uint8Array | string): Sha3Stream;
  /** Finalize and return the hash */
  finalize(): Uint8Array;
}

/**
 * SHAKE extendable output function interface
 */
export interface ShakeStream {
  /** Add more data to absorb */
  update(data: Uint8Array | string): ShakeStream;
  /** Finalize and squeeze out specified number of bytes */
  finalize(outputLength: number): Uint8Array;
}

// ============================================================================
// Keccak Constants
// ============================================================================

/**
 * Keccak round constants (RC) for iota step
 * These are derived from a Linear Feedback Shift Register (LFSR)
 */
const KECCAK_RC: readonly bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

/**
 * Rotation offsets for rho step
 * Indexed as [x][y] where x, y ∈ {0, 1, 2, 3, 4}
 */
const ROTATION_OFFSETS: readonly number[][] = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

/**
 * SHA3-256 parameters
 */
const SHA3_256_RATE = 136; // (1600 - 2*256) / 8 = 136 bytes
const SHA3_256_OUTPUT = 32; // 256 bits = 32 bytes
const SHA3_DELIMITER = 0x06; // Domain separation for SHA3

/**
 * SHAKE-128 parameters
 */
const SHAKE128_RATE = 168; // (1600 - 2*128) / 8 = 168 bytes
const SHAKE_DELIMITER = 0x1f; // Domain separation for SHAKE

/**
 * SHAKE-256 parameters
 */
const SHAKE256_RATE = 136; // (1600 - 2*256) / 8 = 136 bytes

// ============================================================================
// Keccak-f[1600] Permutation
// ============================================================================

/**
 * Keccak-f[1600] permutation: The core of SHA3
 *
 * Operates on a 5x5 array of 64-bit lanes (1600 bits total)
 * Applies 24 rounds of 5 transformations: θ, ρ, π, χ, ι
 *
 * @param state - 25 x 64-bit lanes (modified in-place)
 */
function keccakF1600(state: BigUint64Array): void {
  // Temporary arrays
  const B = new BigUint64Array(25);
  const C = new BigUint64Array(5);

  // Apply 24 rounds
  for (let round = 0; round < 24; round++) {
    // θ (theta) step
    for (let x = 0; x < 5; x++) {
      C[x] = state[index(x, 0)]! ^ state[index(x, 1)]! ^ state[index(x, 2)]! ^
             state[index(x, 3)]! ^ state[index(x, 4)]!;
    }

    for (let x = 0; x < 5; x++) {
      const d = C[(x + 4) % 5]! ^ rotateLeft(C[(x + 1) % 5]!, 1n);
      for (let y = 0; y < 5; y++) {
        const idx = index(x, y);
        state[idx] = state[idx]! ^ d;
      }
    }

    // ρ (rho) and π (pi) steps
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        B[index(y, (2 * x + 3 * y) % 5)] = rotateLeft(
          state[index(x, y)]!,
          BigInt(ROTATION_OFFSETS[x]![y]!)
        );
      }
    }

    // χ (chi) step
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[index(x, y)] = B[index(x, y)]! ^
          ((~B[index((x + 1) % 5, y)]!) & B[index((x + 2) % 5, y)]!);
      }
    }

    // ι (iota) step
    state[0] = state[0]! ^ KECCAK_RC[round]!;
  }
}

/**
 * Convert (x, y) coordinates to state array index
 */
function index(x: number, y: number): number {
  return x + 5 * y;
}

/**
 * Rotate a 64-bit value left by n bits
 */
function rotateLeft(value: bigint, shift: bigint): bigint {
  const normalized = shift & 63n; // Modulo 64
  return ((value << normalized) | (value >> (64n - normalized))) & 0xffffffffffffffffn;
}

// ============================================================================
// Sponge Construction
// ============================================================================

/**
 * Initialize a new Keccak sponge context
 */
function initSponge(rate: number, delimiter: number): Sha3Context {
  return {
    state: new BigUint64Array(25), // 25 x 64-bit lanes = 1600 bits
    buffer: new Uint8Array(rate),
    bufferLength: 0,
    rate,
    delimiter,
  };
}

/**
 * Absorb data into the sponge (mixing phase)
 */
function absorb(ctx: Sha3Context, data: Uint8Array): void {
  let offset = 0;
  const remaining = data.length;

  // Fill buffer first if partially filled
  if (ctx.bufferLength > 0) {
    const toFill = Math.min(ctx.rate - ctx.bufferLength, remaining);
    ctx.buffer.set(data.subarray(0, toFill), ctx.bufferLength);
    ctx.bufferLength += toFill;
    offset += toFill;

    // If buffer full, absorb it
    if (ctx.bufferLength === ctx.rate) {
      absorbBlock(ctx, ctx.buffer);
      ctx.bufferLength = 0;
    }
  }

  // Process complete blocks
  while (offset + ctx.rate <= remaining) {
    absorbBlock(ctx, data.subarray(offset, offset + ctx.rate));
    offset += ctx.rate;
  }

  // Store remaining data in buffer
  if (offset < remaining) {
    const leftover = remaining - offset;
    ctx.buffer.set(data.subarray(offset, offset + leftover), 0);
    ctx.bufferLength = leftover;
  }
}

/**
 * Absorb a single block into the state
 */
function absorbBlock(ctx: Sha3Context, block: Uint8Array): void {
  // XOR block into state (little-endian 64-bit words)
  const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
  const lanes = Math.floor(block.length / 8);

  for (let i = 0; i < lanes; i++) {
    ctx.state[i] = ctx.state[i]! ^ view.getBigUint64(i * 8, true);
  }

  // Handle remaining bytes (if block length not multiple of 8)
  const remainingBytes = block.length % 8;
  if (remainingBytes > 0) {
    let lastLane = 0n;
    for (let i = 0; i < remainingBytes; i++) {
      lastLane |= BigInt(block[lanes * 8 + i]!) << BigInt(i * 8);
    }
    ctx.state[lanes] = ctx.state[lanes]! ^ lastLane;
  }

  // Apply Keccak-f permutation
  keccakF1600(ctx.state);
}

/**
 * Finalize absorption with padding
 */
function finalizeSponge(ctx: Sha3Context): void {
  // Apply padding: delimiter || 0* || 1
  ctx.buffer[ctx.bufferLength] = ctx.delimiter;

  // Zero remaining bytes
  for (let i = ctx.bufferLength + 1; i < ctx.rate; i++) {
    ctx.buffer[i] = 0;
  }

  // Set final bit
  ctx.buffer[ctx.rate - 1] = ctx.buffer[ctx.rate - 1]! | 0x80;

  // Absorb final block
  absorbBlock(ctx, ctx.buffer);
}

/**
 * Squeeze output from the sponge (extraction phase)
 */
function squeeze(ctx: Sha3Context, outputLength: number): Uint8Array {
  const output = new Uint8Array(outputLength);
  let offset = 0;

  while (offset < outputLength) {
    // Extract bytes from current state
    const blockSize = Math.min(ctx.rate, outputLength - offset);

    // Convert state to bytes (little-endian)
    const stateBytes = new Uint8Array(ctx.state.buffer, 0, ctx.rate);
    output.set(stateBytes.subarray(0, blockSize), offset);
    offset += blockSize;

    // If more output needed, permute and continue
    if (offset < outputLength) {
      keccakF1600(ctx.state);
    }
  }

  return output;
}

// ============================================================================
// SHA3-256 Implementation
// ============================================================================

/**
 * Compute SHA3-256 hash of data
 *
 * @param data - Input data to hash
 * @returns 32-byte SHA3-256 hash
 *
 * @example
 * const hash = sha3_256(new TextEncoder().encode('Hello, World!'));
 * console.log(Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''));
 */
export function sha3_256(data: Uint8Array): Uint8Array {
  const ctx = initSponge(SHA3_256_RATE, SHA3_DELIMITER);
  absorb(ctx, data);
  finalizeSponge(ctx);
  return squeeze(ctx, SHA3_256_OUTPUT);
}

/**
 * Create a streaming SHA3-256 hash context
 *
 * @returns Streaming hash interface
 *
 * @example
 * const hash = createSha3_256()
 *   .update('Hello, ')
 *   .update('World!')
 *   .finalize();
 */
export function createSha3_256(): Sha3Stream {
  const ctx = initSponge(SHA3_256_RATE, SHA3_DELIMITER);
  let finalized = false;

  return {
    update(data: Uint8Array | string): Sha3Stream {
      if (finalized) {
        throw new Error('Cannot update finalized hash');
      }

      const bytes = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

      absorb(ctx, bytes);
      return this;
    },

    finalize(): Uint8Array {
      if (finalized) {
        throw new Error('Hash already finalized');
      }
      finalized = true;

      finalizeSponge(ctx);
      return squeeze(ctx, SHA3_256_OUTPUT);
    },
  };
}

/**
 * Compute SHA3-256 hash and return as hex string
 *
 * @param data - Input string to hash
 * @returns Hex-encoded hash
 *
 * @example
 * const hexHash = sha3Hex('Hello, World!');
 * console.log(hexHash); // "1af17a664e3fa8e419b8ba05c2a173169df76162a5a286e0c405b460d478f7ef"
 */
export function sha3Hex(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const hash = sha3_256(bytes);
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// SHAKE-128 Implementation
// ============================================================================

/**
 * Compute SHAKE-128 extendable output
 *
 * SHAKE-128 provides 128-bit security and can produce arbitrary-length output
 *
 * @param data - Input data
 * @param outputLength - Desired output length in bytes
 * @returns Hash of specified length
 *
 * @example
 * const hash = shake128(new TextEncoder().encode('data'), 64);
 */
export function shake128(data: Uint8Array, outputLength: number): Uint8Array {
  const ctx = initSponge(SHAKE128_RATE, SHAKE_DELIMITER);
  absorb(ctx, data);
  finalizeSponge(ctx);
  return squeeze(ctx, outputLength);
}

/**
 * Create a streaming SHAKE-128 context
 *
 * @returns Streaming SHAKE interface
 *
 * @example
 * const hash = createShake128()
 *   .update('Hello')
 *   .update('World')
 *   .finalize(64);
 */
export function createShake128(): ShakeStream {
  const ctx = initSponge(SHAKE128_RATE, SHAKE_DELIMITER);
  let finalized = false;

  return {
    update(data: Uint8Array | string): ShakeStream {
      if (finalized) {
        throw new Error('Cannot update finalized SHAKE');
      }

      const bytes = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

      absorb(ctx, bytes);
      return this;
    },

    finalize(outputLength: number): Uint8Array {
      if (finalized) {
        throw new Error('SHAKE already finalized');
      }
      finalized = true;

      finalizeSponge(ctx);
      return squeeze(ctx, outputLength);
    },
  };
}

// ============================================================================
// SHAKE-256 Implementation
// ============================================================================

/**
 * Compute SHAKE-256 extendable output
 *
 * SHAKE-256 provides 256-bit security and can produce arbitrary-length output
 *
 * @param data - Input data
 * @param outputLength - Desired output length in bytes
 * @returns Hash of specified length
 *
 * @example
 * const hash = shake256(new TextEncoder().encode('data'), 64);
 */
export function shake256(data: Uint8Array, outputLength: number): Uint8Array {
  const ctx = initSponge(SHAKE256_RATE, SHAKE_DELIMITER);
  absorb(ctx, data);
  finalizeSponge(ctx);
  return squeeze(ctx, outputLength);
}

/**
 * Create a streaming SHAKE-256 context
 *
 * @returns Streaming SHAKE interface
 *
 * @example
 * const hash = createShake256()
 *   .update('Hello')
 *   .update('World')
 *   .finalize(64);
 */
export function createShake256(): ShakeStream {
  const ctx = initSponge(SHAKE256_RATE, SHAKE_DELIMITER);
  let finalized = false;

  return {
    update(data: Uint8Array | string): ShakeStream {
      if (finalized) {
        throw new Error('Cannot update finalized SHAKE');
      }

      const bytes = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

      absorb(ctx, bytes);
      return this;
    },

    finalize(outputLength: number): Uint8Array {
      if (finalized) {
        throw new Error('SHAKE already finalized');
      }
      finalized = true;

      finalizeSponge(ctx);
      return squeeze(ctx, outputLength);
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // SHA3-256
  sha3_256,
  createSha3_256,
  sha3Hex,

  // SHAKE
  shake128,
  shake256,
  createShake128,
  createShake256,

  // Utilities
  bytesToHex,
  hexToBytes,
};
