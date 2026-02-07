/**
 * WASM Performance Bridge
 * Routes crypto operations to WASM when available, with automatic performance measurement
 * and intelligent fallback to JavaScript implementations
 *
 * Features:
 * - Automatic performance benchmarking (WASM vs JS)
 * - Smart routing based on performance metrics
 * - Thread-safe operation (can be called from Web Workers)
 * - Performance reporting and monitoring
 * - Auto-select best implementation per operation type
 */

import { getWasmCrypto, isWasmSupported } from './wasm-loader';

// ============================================================================
// Type Definitions
// ============================================================================

export type CryptoOperation = 'hash' | 'encrypt' | 'decrypt' | 'derive-key';

export interface PerformanceMetrics {
  operation: CryptoOperation;
  wasmTime: number;      // Average time in milliseconds
  jsTime: number;        // Average time in milliseconds
  speedup: number;       // Ratio: jsTime / wasmTime
  samples: number;       // Number of benchmark samples
  useWasm: boolean;      // Whether WASM is faster
}

export interface PerformanceReport {
  wasmAvailable: boolean;
  wasmEnabled: boolean;
  operations: Record<CryptoOperation, PerformanceMetrics | null>;
  totalSpeedup: number;  // Average speedup across all operations
}

// ============================================================================
// Performance Tracking
// ============================================================================

class PerformanceTracker {
  private metrics = new Map<CryptoOperation, PerformanceMetrics>();
  private benchmarking = new Set<CryptoOperation>();

  /**
   * Record performance measurement for an operation
   */
  record(operation: CryptoOperation, wasmTime: number, jsTime: number): void {
    const existing = this.metrics.get(operation);

    if (!existing) {
      this.metrics.set(operation, {
        operation,
        wasmTime,
        jsTime,
        speedup: jsTime / wasmTime,
        samples: 1,
        useWasm: wasmTime < jsTime && (jsTime / wasmTime) > 2.0, // Use WASM if >2x faster
      });
    } else {
      // Update running average
      const totalSamples = existing.samples + 1;
      const newWasmTime = (existing.wasmTime * existing.samples + wasmTime) / totalSamples;
      const newJsTime = (existing.jsTime * existing.samples + jsTime) / totalSamples;

      this.metrics.set(operation, {
        operation,
        wasmTime: newWasmTime,
        jsTime: newJsTime,
        speedup: newJsTime / newWasmTime,
        samples: totalSamples,
        useWasm: newWasmTime < newJsTime && (newJsTime / newWasmTime) > 2.0,
      });
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operation: CryptoOperation): PerformanceMetrics | null {
    return this.metrics.get(operation) || null;
  }

  /**
   * Check if should use WASM for an operation
   */
  shouldUseWasm(operation: CryptoOperation): boolean {
    const metrics = this.metrics.get(operation);
    return metrics?.useWasm ?? false;
  }

  /**
   * Mark operation as currently benchmarking
   */
  setBenchmarking(operation: CryptoOperation, value: boolean): void {
    if (value) {
      this.benchmarking.add(operation);
    } else {
      this.benchmarking.delete(operation);
    }
  }

  /**
   * Check if operation is currently being benchmarked
   */
  isBenchmarking(operation: CryptoOperation): boolean {
    return this.benchmarking.has(operation);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<CryptoOperation, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.benchmarking.clear();
  }
}

// ============================================================================
// WASM Performance Bridge
// ============================================================================

export class WasmPerformanceBridge {
  private static instance: WasmPerformanceBridge;
  private tracker = new PerformanceTracker();
  private wasmAvailable: boolean;
  private wasmCrypto = getWasmCrypto();

  private constructor() {
    this.wasmAvailable = isWasmSupported();
  }

  static getInstance(): WasmPerformanceBridge {
    if (!WasmPerformanceBridge.instance) {
      WasmPerformanceBridge.instance = new WasmPerformanceBridge();
    }
    return WasmPerformanceBridge.instance;
  }

  /**
   * Check if WASM is available
   */
  isWasmAvailable(): boolean {
    return this.wasmAvailable;
  }

  // ==========================================================================
  // Hash Operations
  // ==========================================================================

  /**
   * Hash data using optimal implementation
   * Automatically selects WASM or JS based on benchmarks
   */
  async hash(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<Uint8Array> {
    const operation: CryptoOperation = 'hash';

    // If not benchmarked yet, run benchmark on first call
    if (!this.tracker.getMetrics(operation) && !this.tracker.isBenchmarking(operation)) {
      await this.benchmarkHash(algorithm, data);
    }

    // Use WASM if it's faster, otherwise use JS
    if (this.wasmAvailable && this.tracker.shouldUseWasm(operation)) {
      return this.wasmCrypto.hash(algorithm, data);
    } else {
      return this.hashJS(algorithm, data);
    }
  }

  private async hashJS(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<Uint8Array> {
    // Use Web Crypto API for SHA-256
    if (algorithm === 'sha256') {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return new Uint8Array(hashBuffer);
    }

    // Blake3 not natively supported, fall back to SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  private async benchmarkHash(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<void> {
    const operation: CryptoOperation = 'hash';
    this.tracker.setBenchmarking(operation, true);

    try {
      // Benchmark WASM
      const wasmStart = performance.now();
      if (this.wasmAvailable) {
        await this.wasmCrypto.hash(algorithm, data);
      }
      const wasmTime = performance.now() - wasmStart;

      // Benchmark JS
      const jsStart = performance.now();
      await this.hashJS(algorithm, data);
      const jsTime = performance.now() - jsStart;

      // Record results
      this.tracker.record(operation, wasmTime, jsTime);
    } finally {
      this.tracker.setBenchmarking(operation, false);
    }
  }

  // ==========================================================================
  // Encryption Operations
  // ==========================================================================

  /**
   * Encrypt data using optimal implementation
   */
  async encrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    const operation: CryptoOperation = 'encrypt';

    // Benchmark on first call
    if (!this.tracker.getMetrics(operation) && !this.tracker.isBenchmarking(operation)) {
      await this.benchmarkEncrypt(algorithm, key, data, nonce);
    }

    // Use WASM if faster
    if (this.wasmAvailable && this.tracker.shouldUseWasm(operation)) {
      return this.wasmCrypto.encrypt(algorithm, key, data, nonce);
    } else {
      return this.encryptJS(algorithm, key, data, nonce);
    }
  }

  private async encryptJS(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    const iv = nonce || crypto.getRandomValues(new Uint8Array(12));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      cryptoKey,
      data
    );

    return {
      ciphertext: new Uint8Array(encrypted),
      nonce: iv,
    };
  }

  private async benchmarkEncrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce?: Uint8Array
  ): Promise<void> {
    const operation: CryptoOperation = 'encrypt';
    this.tracker.setBenchmarking(operation, true);

    try {
      // Benchmark WASM
      const wasmStart = performance.now();
      if (this.wasmAvailable) {
        await this.wasmCrypto.encrypt(algorithm, key, data, nonce);
      }
      const wasmTime = performance.now() - wasmStart;

      // Benchmark JS
      const jsStart = performance.now();
      await this.encryptJS(algorithm, key, data, nonce);
      const jsTime = performance.now() - jsStart;

      this.tracker.record(operation, wasmTime, jsTime);
    } finally {
      this.tracker.setBenchmarking(operation, false);
    }
  }

  // ==========================================================================
  // Decryption Operations
  // ==========================================================================

  /**
   * Decrypt data using optimal implementation
   */
  async decrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    const operation: CryptoOperation = 'decrypt';

    // Benchmark on first call
    if (!this.tracker.getMetrics(operation) && !this.tracker.isBenchmarking(operation)) {
      await this.benchmarkDecrypt(algorithm, key, data, nonce);
    }

    // Use WASM if faster
    if (this.wasmAvailable && this.tracker.shouldUseWasm(operation)) {
      return this.wasmCrypto.decrypt(algorithm, key, data, nonce);
    } else {
      return this.decryptJS(algorithm, key, data, nonce);
    }
  }

  private async decryptJS(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: 128,
      },
      cryptoKey,
      data
    );

    return new Uint8Array(decrypted);
  }

  private async benchmarkDecrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce: Uint8Array
  ): Promise<void> {
    const operation: CryptoOperation = 'decrypt';
    this.tracker.setBenchmarking(operation, true);

    try {
      // Benchmark WASM
      const wasmStart = performance.now();
      if (this.wasmAvailable) {
        await this.wasmCrypto.decrypt(algorithm, key, data, nonce);
      }
      const wasmTime = performance.now() - wasmStart;

      // Benchmark JS
      const jsStart = performance.now();
      await this.decryptJS(algorithm, key, data, nonce);
      const jsTime = performance.now() - jsStart;

      this.tracker.record(operation, wasmTime, jsTime);
    } finally {
      this.tracker.setBenchmarking(operation, false);
    }
  }

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  /**
   * Derive key from password using optimal implementation
   */
  async deriveKey(
    password: string,
    salt: Uint8Array,
    params?: {
      memory?: number;
      iterations?: number;
      parallelism?: number;
      hashLength?: number;
    }
  ): Promise<Uint8Array> {
    const operation: CryptoOperation = 'derive-key';

    // Benchmark on first call
    if (!this.tracker.getMetrics(operation) && !this.tracker.isBenchmarking(operation)) {
      await this.benchmarkDeriveKey(password, salt, params);
    }

    // Use WASM if faster
    if (this.wasmAvailable && this.tracker.shouldUseWasm(operation)) {
      return this.wasmCrypto.deriveKey(password, salt, params);
    } else {
      return this.deriveKeyJS(password, salt);
    }
  }

  private async deriveKeyJS(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const keyBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt,
        iterations: 600000, // OWASP 2023 recommendation
      },
      passwordKey,
      256
    );

    return new Uint8Array(keyBits);
  }

  private async benchmarkDeriveKey(
    password: string,
    salt: Uint8Array,
    params?: {
      memory?: number;
      iterations?: number;
      parallelism?: number;
      hashLength?: number;
    }
  ): Promise<void> {
    const operation: CryptoOperation = 'derive-key';
    this.tracker.setBenchmarking(operation, true);

    try {
      // Benchmark WASM
      const wasmStart = performance.now();
      if (this.wasmAvailable) {
        await this.wasmCrypto.deriveKey(password, salt, params);
      }
      const wasmTime = performance.now() - wasmStart;

      // Benchmark JS
      const jsStart = performance.now();
      await this.deriveKeyJS(password, salt);
      const jsTime = performance.now() - jsStart;

      this.tracker.record(operation, wasmTime, jsTime);
    } finally {
      this.tracker.setBenchmarking(operation, false);
    }
  }

  // ==========================================================================
  // Performance Reporting
  // ==========================================================================

  /**
   * Get performance report for all operations
   */
  getPerformanceReport(): PerformanceReport {
    const allMetrics = this.tracker.getAllMetrics();
    const operations: Record<CryptoOperation, PerformanceMetrics | null> = {
      'hash': null,
      'encrypt': null,
      'decrypt': null,
      'derive-key': null,
    };

    let totalSpeedup = 0;
    let count = 0;

    for (const [operation, metrics] of allMetrics.entries()) {
      operations[operation] = metrics;
      totalSpeedup += metrics.speedup;
      count++;
    }

    return {
      wasmAvailable: this.wasmAvailable,
      wasmEnabled: count > 0 && totalSpeedup / count > 1,
      operations,
      totalSpeedup: count > 0 ? totalSpeedup / count : 1,
    };
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(operation: CryptoOperation): PerformanceMetrics | null {
    return this.tracker.getMetrics(operation);
  }

  /**
   * Reset all performance metrics
   */
  resetMetrics(): void {
    this.tracker.reset();
  }

  /**
   * Force benchmarking for all operations
   */
  async benchmarkAll(): Promise<void> {
    const testData = crypto.getRandomValues(new Uint8Array(1024 * 1024)); // 1MB test data
    const testKey = crypto.getRandomValues(new Uint8Array(32));
    const testSalt = crypto.getRandomValues(new Uint8Array(16));
    const testNonce = crypto.getRandomValues(new Uint8Array(12));

    // Hash benchmark
    await this.benchmarkHash('sha256', testData);

    // Encryption benchmark
    await this.benchmarkEncrypt('aes-256-gcm', testKey, testData.slice(0, 1024));

    // Decryption benchmark (need to encrypt first)
    const { ciphertext, nonce } = await this.encryptJS('aes-256-gcm', testKey, testData.slice(0, 1024));
    await this.benchmarkDecrypt('aes-256-gcm', testKey, ciphertext, nonce);

    // Key derivation benchmark
    await this.benchmarkDeriveKey('test-password', testSalt);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

let bridgeInstance: WasmPerformanceBridge | null = null;

/**
 * Get the WASM performance bridge instance (singleton)
 */
export function getPerformanceBridge(): WasmPerformanceBridge {
  if (!bridgeInstance) {
    bridgeInstance = WasmPerformanceBridge.getInstance();
  }
  return bridgeInstance;
}
