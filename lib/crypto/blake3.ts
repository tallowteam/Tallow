'use client';

import { blake3 as nobleBlake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const OUT_LEN = 32;

export interface Blake3Hasher {
  update(data: Uint8Array): Blake3Hasher;
  finalize(): Uint8Array;
  finalizeHex(): string;
}

class NobleBlake3Hasher implements Blake3Hasher {
  private readonly inner: ReturnType<typeof nobleBlake3.create>;
  private finalized = false;

  constructor(inner: ReturnType<typeof nobleBlake3.create>) {
    this.inner = inner;
  }

  update(data: Uint8Array): Blake3Hasher {
    if (this.finalized) {
      throw new Error('BLAKE3 hasher already finalized');
    }
    this.inner.update(data);
    return this;
  }

  finalize(): Uint8Array {
    if (this.finalized) {
      throw new Error('BLAKE3 hasher already finalized');
    }
    this.finalized = true;
    return this.inner.digest();
  }

  finalizeHex(): string {
    return bytesToHex(this.finalize());
  }
}

function encode(input: string | Uint8Array): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

function createInternalHasher(options?: {
  key?: Uint8Array;
  context?: string;
}): Blake3Hasher {
  if (options?.key && options.key.length !== 32) {
    throw new Error('BLAKE3 key must be 32 bytes');
  }

  const nobleOptions: {
    dkLen: number;
    key?: Uint8Array;
    context?: Uint8Array;
  } = { dkLen: OUT_LEN };

  if (options?.key) {
    nobleOptions.key = options.key;
  }

  if (options?.context !== undefined) {
    nobleOptions.context = new TextEncoder().encode(options.context);
  }

  return new NobleBlake3Hasher(nobleBlake3.create(nobleOptions));
}

export function createHasher(): Blake3Hasher {
  return createInternalHasher();
}

export function createKeyedHasher(key: Uint8Array): Blake3Hasher {
  return createInternalHasher({ key });
}

export function createDeriveKeyHasher(context: string): Blake3Hasher {
  return createInternalHasher({ context });
}

export function hash(data: Uint8Array): Uint8Array {
  const hasher = createHasher();
  hasher.update(data);
  return hasher.finalize();
}

export function blake3Hex(data: string | Uint8Array): string {
  const hasher = createHasher();
  hasher.update(encode(data));
  return hasher.finalizeHex();
}

export function deriveKey(context: string, material: Uint8Array): Uint8Array {
  const hasher = createDeriveKeyHasher(context);
  hasher.update(material);
  return hasher.finalize();
}

export function keyedHash(key: Uint8Array, data: Uint8Array): Uint8Array {
  const hasher = createKeyedHasher(key);
  hasher.update(data);
  return hasher.finalize();
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  // SECURITY: Do NOT early-return on length mismatch -- that leaks length
  // information via timing. Instead, pad to max length and XOR the length
  // difference into the accumulator.
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length; // non-zero if lengths differ

  for (let i = 0; i < maxLen; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }

  return diff === 0;
}

export class Blake3Service {
  private static instance: Blake3Service;

  private constructor() {}

  static getInstance(): Blake3Service {
    if (!Blake3Service.instance) {
      Blake3Service.instance = new Blake3Service();
    }
    return Blake3Service.instance;
  }

  hash(data: Uint8Array): Uint8Array {
    return hash(data);
  }

  hashHex(data: string | Uint8Array): string {
    return blake3Hex(data);
  }

  deriveKey(context: string, material: Uint8Array): Uint8Array {
    return deriveKey(context, material);
  }

  keyedHash(key: Uint8Array, data: Uint8Array): Uint8Array {
    return keyedHash(key, data);
  }

  createHasher(): Blake3Hasher {
    return createHasher();
  }

  createKeyedHasher(key: Uint8Array): Blake3Hasher {
    return createKeyedHasher(key);
  }

  createDeriveKeyHasher(context: string): Blake3Hasher {
    return createDeriveKeyHasher(context);
  }

  constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    return constantTimeEqual(a, b);
  }
}

export const blake3 = Blake3Service.getInstance();

export default Blake3Service;
