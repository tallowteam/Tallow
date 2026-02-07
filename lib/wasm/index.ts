/**
 * WASM Integration Module
 * Central export point for WASM-accelerated cryptographic operations
 *
 * This module provides:
 * - WASM module loading with automatic fallback to JS
 * - Performance benchmarking and smart routing
 * - Thread-safe operations for Web Workers
 * - Comprehensive performance reporting
 */

// ============================================================================
// Re-export from wasm-loader
// ============================================================================

export {
  isWasmSupported,
  loadWasmModule,
  clearModuleCache,
  getWasmCrypto,
} from './wasm-loader';

export type {
  WasmCrypto,
} from './wasm-loader';

// ============================================================================
// Re-export from performance-bridge
// ============================================================================

export {
  getPerformanceBridge,
  WasmPerformanceBridge,
} from './performance-bridge';

export type {
  CryptoOperation,
  PerformanceMetrics,
  PerformanceReport,
} from './performance-bridge';

// ============================================================================
// Convenience Functions
// ============================================================================

import { isWasmSupported } from './wasm-loader';
import { getPerformanceBridge } from './performance-bridge';

/**
 * Check if WASM acceleration is enabled and providing performance benefits
 * @returns true if WASM is available and faster than JS for crypto operations
 */
export function isWasmAccelerated(): boolean {
  if (!isWasmSupported()) {
    return false;
  }

  const bridge = getPerformanceBridge();
  const report = bridge.getPerformanceReport();

  // WASM is accelerated if it's available and provides speedup
  return report.wasmAvailable && report.totalSpeedup > 1.5;
}

/**
 * Get comprehensive performance report for all crypto operations
 * @returns Performance report with WASM availability and speedup metrics
 */
export function getPerformanceReport(): {
  wasmAvailable: boolean;
  speedup: number;
  operations: Record<string, {
    wasmTime: number;
    jsTime: number;
    speedup: number;
    samples: number;
    useWasm: boolean;
  } | null>;
} {
  const bridge = getPerformanceBridge();
  const report = bridge.getPerformanceReport();

  return {
    wasmAvailable: report.wasmAvailable,
    speedup: report.totalSpeedup,
    operations: report.operations,
  };
}

/**
 * Run comprehensive benchmarks for all crypto operations
 * This will measure WASM vs JS performance and update routing decisions
 */
export async function runBenchmarks(): Promise<void> {
  const bridge = getPerformanceBridge();
  await bridge.benchmarkAll();
}

/**
 * Reset all performance metrics
 * Useful for re-benchmarking in different conditions
 */
export function resetPerformanceMetrics(): void {
  const bridge = getPerformanceBridge();
  bridge.resetMetrics();
}

// ============================================================================
// High-Level Crypto API
// ============================================================================

/**
 * Hash data using the fastest available implementation (WASM or JS)
 * @param algorithm - Hash algorithm ('sha256' or 'blake3')
 * @param data - Data to hash
 * @returns Hash digest
 */
export async function hash(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<Uint8Array> {
  const bridge = getPerformanceBridge();
  return bridge.hash(algorithm, data);
}

/**
 * Encrypt data using the fastest available implementation
 * @param algorithm - Encryption algorithm (default: 'aes-256-gcm')
 * @param key - Encryption key (must be 32 bytes)
 * @param data - Plaintext data
 * @param nonce - Optional nonce (will be generated if not provided)
 * @returns Encrypted data with nonce
 */
export async function encrypt(
  algorithm: string,
  key: Uint8Array,
  data: Uint8Array,
  nonce?: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const bridge = getPerformanceBridge();
  return bridge.encrypt(algorithm, key, data, nonce);
}

/**
 * Decrypt data using the fastest available implementation
 * @param algorithm - Decryption algorithm
 * @param key - Decryption key
 * @param data - Ciphertext data
 * @param nonce - Nonce used during encryption
 * @returns Decrypted plaintext
 */
export async function decrypt(
  algorithm: string,
  key: Uint8Array,
  data: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const bridge = getPerformanceBridge();
  return bridge.decrypt(algorithm, key, data, nonce);
}

/**
 * Derive key from password using the fastest available implementation
 * @param password - Password string
 * @param salt - Salt for key derivation (must be at least 16 bytes)
 * @param params - Optional Argon2 parameters
 * @returns Derived key (32 bytes)
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  params?: {
    memory?: number;
    iterations?: number;
    parallelism?: number;
    hashLength?: number;
  }
): Promise<Uint8Array> {
  const bridge = getPerformanceBridge();
  return bridge.deriveKey(password, salt, params);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Detection
  isWasmSupported,
  isWasmAccelerated,

  // Performance
  getPerformanceReport,
  runBenchmarks,
  resetPerformanceMetrics,

  // Crypto Operations
  hash,
  encrypt,
  decrypt,
  deriveKey,

  // Advanced
  getPerformanceBridge,
  getWasmCrypto,
};
