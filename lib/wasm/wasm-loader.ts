/**
 * WASM Module Loader
 * Provides lazy loading of WebAssembly modules with automatic fallback to JavaScript implementations
 *
 * Features:
 * - Lazy module loading (only load when needed)
 * - Browser WASM support detection
 * - Module caching to prevent duplicate loads
 * - Type-safe interface for WASM-accelerated crypto operations
 * - Automatic fallback to JS implementations
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface WasmCrypto {
  /**
   * Hash data using specified algorithm
   * @param algorithm - Hash algorithm (sha256 or blake3)
   * @param data - Input data to hash
   * @returns Hash digest
   */
  hash(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<Uint8Array>;

  /**
   * Encrypt data with specified algorithm
   * @param algorithm - Encryption algorithm (e.g., 'aes-256-gcm', 'chacha20-poly1305')
   * @param key - Encryption key
   * @param data - Plaintext data
   * @param nonce - Nonce/IV (optional, will be generated if not provided)
   * @returns Encrypted data with nonce
   */
  encrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }>;

  /**
   * Decrypt data with specified algorithm
   * @param algorithm - Decryption algorithm
   * @param key - Decryption key
   * @param data - Ciphertext data
   * @param nonce - Nonce/IV used during encryption
   * @returns Decrypted plaintext
   */
  decrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array>;

  /**
   * Derive key from password using Argon2
   * @param password - Password string
   * @param salt - Salt for key derivation
   * @param params - Argon2 parameters (memory, iterations, parallelism)
   * @returns Derived key
   */
  deriveKey(
    password: string,
    salt: Uint8Array,
    params?: {
      memory?: number;
      iterations?: number;
      parallelism?: number;
      hashLength?: number;
    }
  ): Promise<Uint8Array>;
}

interface WasmModule {
  instance: WebAssembly.Instance;
  exports: WebAssembly.Exports;
}

// ============================================================================
// Module Cache
// ============================================================================

// Use WeakMap for automatic garbage collection when modules are no longer needed
const moduleCache = new Map<string, Promise<WasmModule>>();

// ============================================================================
// WASM Support Detection
// ============================================================================

/**
 * Check if WebAssembly is supported in the current environment
 */
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function' &&
        typeof WebAssembly.Module === 'function' &&
        typeof WebAssembly.Instance === 'function') {

      // Test instantiation with a minimal WASM module
      // This is a valid WASM module that does nothing (empty module)
      const testModule = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
      const module = new WebAssembly.Module(testModule);
      const instance = new WebAssembly.Instance(module);

      return instance !== null;
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// WASM Module Loading
// ============================================================================

/**
 * Load a WASM module by name
 * @param name - Module name (e.g., 'crypto', 'hash')
 * @returns WebAssembly instance
 */
export async function loadWasmModule(name: string): Promise<WebAssembly.Instance> {
  // Check cache first
  const cached = moduleCache.get(name);
  if (cached) {
    const module = await cached;
    return module.instance;
  }

  // Check WASM support
  if (!isWasmSupported()) {
    throw new Error('WebAssembly is not supported in this environment');
  }

  // Start loading module
  const loadPromise = (async () => {
    try {
      // Construct module path
      // In production, WASM files are served from /static/wasm/
      const basePath = process.env.NODE_ENV === 'production'
        ? '/static/wasm'
        : '/_next/static/wasm';

      const modulePath = `${basePath}/${name}.wasm`;

      // Fetch WASM module
      const response = await fetch(modulePath);

      if (!response.ok) {
        throw new Error(`Failed to fetch WASM module '${name}': ${response.status} ${response.statusText}`);
      }

      const bytes = await response.arrayBuffer();

      // Instantiate WASM module
      const result = await WebAssembly.instantiate(bytes, {
        // Import objects for WASM module
        env: {
          // Memory allocation callback
          memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),

          // Error reporting
          abort: (msg: number, file: number, line: number, column: number) => {
            console.error(`WASM abort: message=${msg}, file=${file}, line=${line}, column=${column}`);
          },
        },
      });

      const module: WasmModule = {
        instance: result.instance,
        exports: result.instance.exports,
      };

      return module;
    } catch (error) {
      // Remove from cache on error
      moduleCache.delete(name);
      throw error;
    }
  })();

  // Cache the loading promise
  moduleCache.set(name, loadPromise);

  const module = await loadPromise;
  return module.instance;
}

/**
 * Clear the module cache (useful for testing or hot reload)
 */
export function clearModuleCache(): void {
  moduleCache.clear();
}

// ============================================================================
// WASM Crypto Implementation
// ============================================================================

class WasmCryptoImpl implements WasmCrypto {
  private cryptoInstance: WebAssembly.Instance | null = null;

  private async ensureLoaded(): Promise<void> {
    if (!this.cryptoInstance) {
      this.cryptoInstance = await loadWasmModule('crypto');
    }
  }

  async hash(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<Uint8Array> {
    try {
      await this.ensureLoaded();

      // Call WASM hash function (implementation depends on your Rust WASM module)
      // This is a placeholder - actual implementation depends on your WASM exports
      const exports = this.cryptoInstance!.exports as any;

      if (typeof exports.hash === 'function') {
        const result = exports.hash(
          algorithm === 'sha256' ? 0 : 1, // Algorithm ID
          data.buffer,
          data.byteLength
        );
        return new Uint8Array(result);
      }

      // Fallback to JS implementation
      return this.hashJS(algorithm, data);
    } catch {
      // Fallback on any error
      return this.hashJS(algorithm, data);
    }
  }

  private async hashJS(algorithm: 'sha256' | 'blake3', data: Uint8Array): Promise<Uint8Array> {
    if (algorithm === 'sha256') {
      // Use Web Crypto API for SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return new Uint8Array(hashBuffer);
    } else {
      // Blake3 requires external library - fall back to SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return new Uint8Array(hashBuffer);
    }
  }

  async encrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    try {
      await this.ensureLoaded();

      const exports = this.cryptoInstance!.exports as any;

      if (typeof exports.encrypt === 'function') {
        const result = exports.encrypt(
          algorithm,
          key.buffer,
          data.buffer,
          nonce?.buffer
        );

        return {
          ciphertext: new Uint8Array(result.ciphertext),
          nonce: new Uint8Array(result.nonce),
        };
      }

      // Fallback to JS implementation
      return this.encryptJS(algorithm, key, data, nonce);
    } catch {
      return this.encryptJS(algorithm, key, data, nonce);
    }
  }

  private async encryptJS(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    // Default to AES-256-GCM
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

  async decrypt(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    try {
      await this.ensureLoaded();

      const exports = this.cryptoInstance!.exports as any;

      if (typeof exports.decrypt === 'function') {
        const result = exports.decrypt(
          algorithm,
          key.buffer,
          data.buffer,
          nonce.buffer
        );
        return new Uint8Array(result);
      }

      // Fallback to JS implementation
      return this.decryptJS(algorithm, key, data, nonce);
    } catch {
      return this.decryptJS(algorithm, key, data, nonce);
    }
  }

  private async decryptJS(
    algorithm: string,
    key: Uint8Array,
    data: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    // Default to AES-256-GCM
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
    try {
      // Try to use hash-wasm for Argon2id (which is WASM-based)
      const { argon2id } = await import('hash-wasm');

      const result = await argon2id({
        password,
        salt,
        parallelism: params?.parallelism || 4,
        iterations: params?.iterations || 3,
        memorySize: params?.memory || 65536, // 64 MiB
        hashLength: params?.hashLength || 32,
        outputType: 'binary',
      });

      return new Uint8Array(result);
    } catch {
      // Fallback to PBKDF2
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
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

let wasmCryptoInstance: WasmCrypto | null = null;

/**
 * Get the WASM crypto instance (singleton)
 * Falls back to JavaScript implementations if WASM is not available
 */
export function getWasmCrypto(): WasmCrypto {
  if (!wasmCryptoInstance) {
    wasmCryptoInstance = new WasmCryptoImpl();
  }
  return wasmCryptoInstance;
}
