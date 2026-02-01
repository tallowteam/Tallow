'use client';

/**
 * Argon2id Password Hashing for Browser
 * Uses hash-wasm WebAssembly implementation for true Argon2id
 * Falls back to PBKDF2 for backward compatibility and environments without WASM support
 *
 * SECURITY: Argon2id is the winner of the Password Hashing Competition (PHC) and provides:
 * - Memory-hard computation (GPU/ASIC resistant)
 * - Data-dependent memory access (side-channel resistant)
 * - Configurable time, memory, and parallelism parameters
 */

import { argon2id } from 'hash-wasm';

// KDF Algorithm identifiers for version detection
export const KDF_ALGORITHM = {
  PBKDF2_V1: 0x01,      // Legacy PBKDF2 with 100K iterations
  PBKDF2_V2: 0x02,      // PBKDF2 with 600K iterations (OWASP 2023)
  ARGON2ID_V1: 0x10,    // Argon2id with standard parameters
} as const;

export type KDFAlgorithm = typeof KDF_ALGORITHM[keyof typeof KDF_ALGORITHM];

// Default Argon2id parameters (OWASP recommendations)
export const ARGON2_DEFAULTS = {
  memory: 65536,      // 64 MiB memory cost
  iterations: 3,      // Time cost (passes)
  parallelism: 4,     // Parallelism factor
  hashLength: 32,     // 256-bit output
} as const;

// PBKDF2 fallback parameters
export const PBKDF2_DEFAULTS = {
  iterations: 600000, // OWASP 2023 recommendation
  hashLength: 32,
} as const;

export interface Argon2Options {
  memory?: number;      // Memory in KiB (default: 65536 = 64 MiB)
  iterations?: number;  // Time cost (default: 3)
  parallelism?: number; // Parallelism (default: 4)
  hashLength?: number;  // Output length in bytes (default: 32)
}

export interface PBKDF2Options {
  iterations?: number;  // Iteration count (default: 600000)
  keyLength?: number;   // Output length in bytes (default: 32)
}

export interface DeriveKeyOptions extends Argon2Options, PBKDF2Options {
  algorithm?: KDFAlgorithm;  // Force specific algorithm
}

// Track WASM availability
let wasmAvailable: boolean | null = null;

/**
 * Check if WebAssembly is available and Argon2 WASM module can be loaded
 */
async function checkWasmAvailability(): Promise<boolean> {
  if (wasmAvailable !== null) {
    return wasmAvailable;
  }

  try {
    // Quick test to see if WASM Argon2 works
    await argon2id({
      password: 'test',
      salt: new Uint8Array(16),
      parallelism: 1,
      iterations: 1,
      memorySize: 1024,
      hashLength: 32,
      outputType: 'binary',
    });
    wasmAvailable = true;
  } catch {
    wasmAvailable = false;
  }

  return wasmAvailable;
}

/**
 * Derive key using Argon2id (WASM implementation)
 *
 * @param password - Password string
 * @param salt - Salt bytes (should be at least 16 bytes)
 * @param options - Argon2id parameters
 * @returns Derived key bytes
 */
export async function deriveKeyArgon2id(
  password: string,
  salt: Uint8Array,
  options?: Argon2Options
): Promise<Uint8Array> {
  const memory = options?.memory ?? ARGON2_DEFAULTS.memory;
  const iterations = options?.iterations ?? ARGON2_DEFAULTS.iterations;
  const parallelism = options?.parallelism ?? ARGON2_DEFAULTS.parallelism;
  const hashLength = options?.hashLength ?? ARGON2_DEFAULTS.hashLength;

  const result = await argon2id({
    password,
    salt,
    parallelism,
    iterations,
    memorySize: memory,
    hashLength,
    outputType: 'binary',
  });

  return new Uint8Array(result);
}

/**
 * Derive key using PBKDF2 (Web Crypto API fallback)
 *
 * @param password - Password string
 * @param salt - Salt bytes
 * @param options - PBKDF2 parameters
 * @returns Derived key bytes
 */
export async function deriveKeyPBKDF2(
  password: string,
  salt: Uint8Array,
  options?: PBKDF2Options
): Promise<Uint8Array> {
  const iterations = options?.iterations ?? PBKDF2_DEFAULTS.iterations;
  const keyLength = options?.keyLength ?? PBKDF2_DEFAULTS.hashLength;

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    keyLength * 8
  );

  return new Uint8Array(derivedBits);
}

/**
 * Derive key from password with automatic algorithm selection
 *
 * Uses Argon2id when available, falls back to PBKDF2.
 * For backward compatibility, accepts legacy options format.
 *
 * @param password - Password string
 * @param salt - Salt bytes (should be at least 16 bytes, preferably 32)
 * @param options - KDF options
 * @returns Derived key bytes
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  options?: DeriveKeyOptions
): Promise<Uint8Array> {
  // If algorithm is explicitly specified, use it
  if (options?.algorithm !== undefined) {
    switch (options.algorithm) {
      case KDF_ALGORITHM.ARGON2ID_V1:
        return deriveKeyArgon2id(password, salt, options);
      case KDF_ALGORITHM.PBKDF2_V1:
        return deriveKeyPBKDF2(password, salt, { iterations: 100000, keyLength: options.keyLength ?? 32 });
      case KDF_ALGORITHM.PBKDF2_V2:
        return deriveKeyPBKDF2(password, salt, options);
    }
  }

  // Check if WASM is available
  const useArgon2 = await checkWasmAvailability();

  if (useArgon2) {
    return deriveKeyArgon2id(password, salt, options);
  }

  // Fallback to PBKDF2
  return deriveKeyPBKDF2(password, salt, options);
}

/**
 * Get the current KDF algorithm that will be used
 * Useful for determining which version byte to use when encrypting
 */
export async function getCurrentKDFAlgorithm(): Promise<KDFAlgorithm> {
  const useArgon2 = await checkWasmAvailability();
  return useArgon2 ? KDF_ALGORITHM.ARGON2ID_V1 : KDF_ALGORITHM.PBKDF2_V2;
}

/**
 * Calculate password strength score (0-4)
 * 0 = Very Weak, 1 = Weak, 2 = Medium, 3 = Strong, 4 = Very Strong
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) { score++; }
  if (password.length >= 12) { score++; }
  if (password.length >= 16) { score++; }

  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }

  // Complexity checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const complexityCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;

  if (complexityCount >= 3) { score++; }

  if (!hasLowercase) { feedback.push('Add lowercase letters'); }
  if (!hasUppercase) { feedback.push('Add uppercase letters'); }
  if (!hasNumbers) { feedback.push('Add numbers'); }
  if (!hasSpecial) { feedback.push('Add special characters'); }

  // Common pattern checks
  const commonPatterns = [
    /^password/i,
    /^123/,
    /^abc/i,
    /qwerty/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid common patterns');
  }

  // Cap score at 4
  score = Math.min(4, score);

  // Generate overall feedback
  if (score === 0) {
    feedback.unshift('Very weak password');
  } else if (score === 1) {
    feedback.unshift('Weak password');
  } else if (score === 2) {
    feedback.unshift('Medium strength');
  } else if (score === 3) {
    feedback.unshift('Strong password');
  } else {
    feedback.unshift('Very strong password');
  }

  return { score, feedback };
}

/**
 * Generate a random salt for password-based encryption
 * Uses 32 bytes (256 bits) for maximum security
 */
export function generateSalt(length: number = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Hash password for storage hint validation (NOT for encryption)
 * Uses SHA-256 - never use this for password verification in production
 */
export async function hashPasswordHint(hint: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(hint.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify if Argon2id WASM is available
 * Useful for UI to show which KDF will be used
 */
export async function isArgon2Available(): Promise<boolean> {
  return checkWasmAvailability();
}

/**
 * Get KDF algorithm name for display
 */
export function getKDFAlgorithmName(algorithm: KDFAlgorithm): string {
  switch (algorithm) {
    case KDF_ALGORITHM.ARGON2ID_V1:
      return 'Argon2id';
    case KDF_ALGORITHM.PBKDF2_V1:
      return 'PBKDF2 (legacy)';
    case KDF_ALGORITHM.PBKDF2_V2:
      return 'PBKDF2';
    default:
      return 'Unknown';
  }
}

export default {
  deriveKeyFromPassword,
  deriveKeyArgon2id,
  deriveKeyPBKDF2,
  calculatePasswordStrength,
  generateSalt,
  hashPasswordHint,
  isArgon2Available,
  getCurrentKDFAlgorithm,
  getKDFAlgorithmName,
  KDF_ALGORITHM,
  ARGON2_DEFAULTS,
  PBKDF2_DEFAULTS,
};
