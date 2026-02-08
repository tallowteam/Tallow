/**
 * Worker Bridge
 * High-level API for using Web Workers from the main thread.
 * Provides singleton instances per worker type with automatic fallback to main thread.
 *
 * Features:
 * - Singleton pattern for worker instances
 * - Type-safe method interfaces
 * - Automatic fallback to main thread if Workers not supported
 * - Built-in error handling and retries
 * - Progress tracking support
 */

import { IPCProtocol, IPCProgressMessage, createIPCProtocol } from './ipc-protocol';
import { WorkerPool, createWorkerPool } from './worker-pool';

/**
 * Worker types and their URLs
 */
const WORKER_URLS = {
  crypto: '/lib/workers/crypto.worker.ts',
  file: '/lib/workers/file.worker.ts',
  network: '/lib/workers/network.worker.ts',
  compression: '/lib/workers/compression.worker.ts',
} as const;

type WorkerType = keyof typeof WORKER_URLS;

/**
 * Check if Web Workers are supported
 */
function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Connectivity test result
 */
export interface ConnectivityResult {
  url: string;
  reachable: boolean;
  statusCode?: number;
  responseTime: number;
}

/**
 * Hash result
 */
export interface HashResult {
  hash: string;
  algorithm: string;
}

/**
 * File chunk metadata
 */
export interface ChunkMetadata {
  fileName: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  chunks: {
    index: number;
    size: number;
    offset: number;
  }[];
}

/**
 * File type detection result
 */
export interface FileTypeResult {
  type: string;
  mimeType: string;
  confidence: 'high' | 'low';
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  mimeType: string;
  hash: string;
  lastModified: number;
}

/**
 * Encryption result
 */
export interface EncryptionResult {
  ciphertext: ArrayBuffer;
  nonce: ArrayBuffer;
}

/**
 * Compression options
 */
export interface CompressionOptions {
  algorithm: 'gzip' | 'deflate' | 'brotli';
  level?: number; // 1-9 for gzip/deflate, 0-11 for brotli
}

/**
 * Worker Bridge base class
 */
abstract class BaseWorkerBridge {
  protected protocol: IPCProtocol;
  protected pool: WorkerPool | null = null;
  protected workerType: WorkerType;
  private static instances = new Map<WorkerType, BaseWorkerBridge>();

  constructor(workerType: WorkerType) {
    this.workerType = workerType;
    this.protocol = createIPCProtocol({
      defaultTimeout: 60000, // 60 seconds for heavy operations
      debug: process.env.NODE_ENV === 'development',
      enableRetries: true,
      maxRetries: 2,
    });

    if (isWorkerSupported()) {
      this.initializePool();
    }
  }

  /**
   * Initialize worker pool
   */
  private initializePool(): void {
    try {
      const poolSize = Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2));
      this.pool = createWorkerPool(WORKER_URLS[this.workerType], poolSize, {
        taskTimeout: 120000, // 2 minutes
        strategy: 'least-busy',
      });
    } catch (error) {
      console.warn(`Failed to initialize ${this.workerType} worker pool:`, error);
      this.pool = null;
    }
  }

  /**
   * Get singleton instance
   */
  protected static getInstance<T extends BaseWorkerBridge>(
    this: new (workerType: WorkerType) => T,
    workerType: WorkerType
  ): T {
    if (!BaseWorkerBridge.instances.has(workerType)) {
      BaseWorkerBridge.instances.set(workerType, new this(workerType));
    }
    return BaseWorkerBridge.instances.get(workerType) as T;
  }

  /**
   * Execute operation in worker or fallback to main thread
   */
  protected async execute<TRequest, TResponse>(
    type: string,
    payload: TRequest,
    fallback: () => Promise<TResponse>,
    options?: {
      timeout?: number;
      onProgress?: (progress: IPCProgressMessage) => void;
      signal?: AbortSignal;
    }
  ): Promise<TResponse> {
    // Use worker pool if available
    if (this.pool) {
      try {
        const message = this.protocol.createMessage(
          type,
          this.workerType,
          payload,
          { timeout: options?.timeout }
        );

        // Execute via worker pool
        const result = await this.pool.execute<{ id: string; success: boolean; result?: TResponse; error?: string }>(message);

        if (!result.success) {
          throw new Error(result.error || 'Worker operation failed');
        }

        return result.result as TResponse;
      } catch (error) {
        console.warn(`Worker execution failed, falling back to main thread:`, error);
        // Fall through to main thread fallback
      }
    }

    // Fallback to main thread
    return fallback();
  }

  /**
   * Destroy worker pool
   */
  public destroy(): void {
    if (this.pool) {
      this.pool.terminate();
      this.pool = null;
    }
    this.protocol.destroy();
  }

  /**
   * Get worker pool statistics
   */
  public getStats() {
    return this.pool?.getStats() || null;
  }
}

/**
 * Crypto Worker Bridge
 */
class CryptoWorkerBridge extends BaseWorkerBridge {
  private constructor() {
    super('crypto');
  }

  public static getInstance(): CryptoWorkerBridge {
    return super.getInstance.call(this, 'crypto');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  public async encryptFile(
    data: ArrayBuffer,
    key: Uint8Array,
    nonce?: Uint8Array,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<EncryptionResult> {
    return this.execute(
      'encrypt',
      { data, key: key.buffer, nonce: nonce?.buffer },
      async () => {
        // Main thread fallback
        const { encrypt } = await import('./crypto-fallback');
        return encrypt(data, key, nonce);
      },
      options
    );
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  public async decryptFile(
    ciphertext: ArrayBuffer,
    key: Uint8Array,
    nonce: Uint8Array,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<ArrayBuffer> {
    return this.execute(
      'decrypt',
      { ciphertext, key: key.buffer, nonce: nonce.buffer },
      async () => {
        // Main thread fallback
        const { decrypt } = await import('./crypto-fallback');
        return decrypt(ciphertext, key, nonce);
      },
      options
    );
  }

  /**
   * Hash data using SHA-256
   */
  public async hashFile(
    data: ArrayBuffer,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<string> {
    const result = await this.execute<{ data: ArrayBuffer }, ArrayBuffer>(
      'hash',
      { data },
      async () => {
        // Main thread fallback
        return crypto.subtle.digest('SHA-256', data);
      },
      options
    );

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(result));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive key from password using Argon2id or PBKDF2
   */
  public async deriveKey(
    password: string,
    salt: Uint8Array,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<ArrayBuffer> {
    return this.execute(
      'derive-key',
      { password, salt: salt.buffer },
      async () => {
        // Main thread fallback - use PBKDF2
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
          'raw',
          encoder.encode(password),
          'PBKDF2',
          false,
          ['deriveBits']
        );

        return crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: salt.buffer,
            iterations: 600000,
          },
          passwordKey,
          256
        );
      },
      options
    );
  }
}

/**
 * File Worker Bridge
 */
class FileWorkerBridge extends BaseWorkerBridge {
  private constructor() {
    super('file');
  }

  public static getInstance(): FileWorkerBridge {
    return super.getInstance.call(this, 'file');
  }

  /**
   * Hash a file
   */
  public async hashFile(
    file: ArrayBuffer,
    algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256',
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<HashResult> {
    return this.execute(
      'hash-file',
      { file, algorithm },
      async () => {
        // Main thread fallback
        const hashBuffer = await crypto.subtle.digest(algorithm, file);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return { hash, algorithm };
      },
      options
    );
  }

  /**
   * Split file into chunks
   */
  public async chunkFile(
    file: ArrayBuffer,
    chunkSize: number,
    fileName: string,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<{ chunks: ArrayBuffer[]; metadata: ChunkMetadata }> {
    return this.execute(
      'chunk-file',
      { file, chunkSize, fileName },
      async () => {
        // Main thread fallback
        const totalSize = file.byteLength;
        const totalChunks = Math.ceil(totalSize / chunkSize);
        const chunks: ArrayBuffer[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, totalSize);
          chunks.push(file.slice(start, end));

          // Emit progress
          if (options?.onProgress) {
            options.onProgress({
              id: 'chunk-file',
              type: 'progress',
              progress: ((i + 1) / totalChunks) * 100,
              status: `Chunking: ${i + 1}/${totalChunks}`,
            });
          }
        }

        const metadata: ChunkMetadata = {
          fileName,
          totalSize,
          chunkSize,
          totalChunks,
          chunks: chunks.map((chunk, index) => ({
            index,
            size: chunk.byteLength,
            offset: index * chunkSize,
          })),
        };

        return { chunks, metadata };
      },
      options
    );
  }

  /**
   * Merge chunks back into a file
   */
  public async mergeChunks(
    chunks: ArrayBuffer[],
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<ArrayBuffer> {
    return this.execute(
      'merge-chunks',
      { chunks },
      async () => {
        // Main thread fallback
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const merged = new Uint8Array(totalSize);

        let offset = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = new Uint8Array(chunks[i]);
          merged.set(chunk, offset);
          offset += chunk.byteLength;

          // Emit progress
          if (options?.onProgress) {
            options.onProgress({
              id: 'merge-chunks',
              type: 'progress',
              progress: ((i + 1) / chunks.length) * 100,
              status: `Merging: ${i + 1}/${chunks.length}`,
            });
          }
        }

        return merged.buffer;
      },
      options
    );
  }

  /**
   * Detect file type from magic bytes
   */
  public async detectType(
    file: ArrayBuffer,
    fileName?: string
  ): Promise<FileTypeResult> {
    return this.execute(
      'detect-type',
      { file, fileName },
      async () => {
        // Main thread fallback - basic implementation
        return {
          type: 'unknown',
          mimeType: 'application/octet-stream',
          confidence: 'low',
        };
      }
    );
  }

  /**
   * Read file metadata
   */
  public async readMetadata(
    file: ArrayBuffer,
    fileName: string
  ): Promise<FileMetadata> {
    return this.execute(
      'read-metadata',
      { file, fileName },
      async () => {
        // Main thread fallback
        const typeInfo = await this.detectType(file, fileName);
        const hashInfo = await this.hashFile(file);

        return {
          name: fileName,
          size: file.byteLength,
          type: typeInfo.type,
          mimeType: typeInfo.mimeType,
          hash: hashInfo.hash,
          lastModified: Date.now(),
        };
      }
    );
  }
}

/**
 * Network Worker Bridge
 */
class NetworkWorkerBridge extends BaseWorkerBridge {
  private constructor() {
    super('network');
  }

  public static getInstance(): NetworkWorkerBridge {
    return super.getInstance.call(this, 'network');
  }

  /**
   * Test connectivity to URLs
   */
  public async testConnectivity(
    urls: string[],
    timeout: number = 5000
  ): Promise<ConnectivityResult[]> {
    const results = await Promise.all(
      urls.map(url =>
        this.execute<{ url: string; timeout: number }, ConnectivityResult>(
          'check-connectivity',
          { url, timeout },
          async () => {
            // Main thread fallback
            const startTime = performance.now();
            try {
              const response = await fetch(url, {
                method: 'HEAD',
                signal: AbortSignal.timeout(timeout),
              });
              return {
                url,
                reachable: true,
                statusCode: response.status,
                responseTime: performance.now() - startTime,
              };
            } catch {
              return {
                url,
                reachable: false,
                responseTime: performance.now() - startTime,
              };
            }
          }
        )
      )
    );

    return results;
  }

  /**
   * Resolve ICE candidates
   */
  public async resolveIce(
    stunServers: string[]
  ): Promise<{ candidates: RTCIceCandidate[]; success: boolean }> {
    return this.execute(
      'resolve-ice',
      { stunServers },
      async () => {
        // Main thread fallback - would need RTCPeerConnection
        return { candidates: [], success: false };
      }
    );
  }

  /**
   * Test bandwidth
   */
  public async bandwidthTest(
    url: string,
    payloadSize: number = 1024 * 1024 // 1 MB default
  ): Promise<{ bandwidthMbps: number; transferTime: number; bytesTransferred: number }> {
    return this.execute(
      'bandwidth-test',
      { url, payloadSize },
      async () => {
        // Main thread fallback
        const startTime = performance.now();
        const response = await fetch(url);
        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error('No response body');
        }

        let bytesTransferred = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done || bytesTransferred >= payloadSize) {
            break;
          }
          bytesTransferred += value.length;
        }

        const transferTime = performance.now() - startTime;
        const bandwidthBps = (bytesTransferred * 8) / (transferTime / 1000);
        const bandwidthMbps = bandwidthBps / 1_000_000;

        return { bandwidthMbps, transferTime, bytesTransferred };
      }
    );
  }

  /**
   * Check latency
   */
  public async latencyCheck(
    url: string,
    samples: number = 5
  ): Promise<{ averageLatency: number; minLatency: number; maxLatency: number; samples: number[] }> {
    return this.execute(
      'latency-check',
      { url, samples },
      async () => {
        // Main thread fallback
        const latencies: number[] = [];

        for (let i = 0; i < samples; i++) {
          const startTime = performance.now();
          try {
            await fetch(url, { method: 'HEAD', cache: 'no-store' });
            latencies.push(performance.now() - startTime);
          } catch {
            // Skip failed samples
          }
          if (i < samples - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        if (latencies.length === 0) {
          throw new Error('All latency samples failed');
        }

        return {
          averageLatency: latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
          minLatency: Math.min(...latencies),
          maxLatency: Math.max(...latencies),
          samples: latencies,
        };
      }
    );
  }
}

/**
 * Compression Worker Bridge
 */
class CompressionWorkerBridge extends BaseWorkerBridge {
  private constructor() {
    super('compression');
  }

  public static getInstance(): CompressionWorkerBridge {
    return super.getInstance.call(this, 'compression');
  }

  /**
   * Compress data
   */
  public async compressData(
    data: ArrayBuffer,
    options: CompressionOptions = { algorithm: 'gzip' }
  ): Promise<ArrayBuffer> {
    return this.execute(
      'compress',
      { data, algorithm: options.algorithm, level: options.level },
      async () => {
        // Main thread fallback using Compression Streams API
        if ('CompressionStream' in window) {
          const stream = new CompressionStream(options.algorithm as CompressionFormat);
          const writer = stream.writable.getWriter();
          await writer.write(new Uint8Array(data));
          await writer.close();

          const reader = stream.readable.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) {break;}
            chunks.push(value);
          }

          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }

          return result.buffer;
        }

        // If CompressionStream not available, return uncompressed
        console.warn('CompressionStream not available, returning uncompressed data');
        return data;
      }
    );
  }

  /**
   * Decompress data
   */
  public async decompressData(
    data: ArrayBuffer,
    algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip'
  ): Promise<ArrayBuffer> {
    return this.execute(
      'decompress',
      { data, algorithm },
      async () => {
        // Main thread fallback using Decompression Streams API
        if ('DecompressionStream' in window) {
          const stream = new DecompressionStream(algorithm as CompressionFormat);
          const writer = stream.writable.getWriter();
          await writer.write(new Uint8Array(data));
          await writer.close();

          const reader = stream.readable.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) {break;}
            chunks.push(value);
          }

          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }

          return result.buffer;
        }

        throw new Error('DecompressionStream not available');
      }
    );
  }
}

/**
 * Unified Worker Bridge
 * Provides access to all worker bridges
 */
export class WorkerBridge {
  private static _crypto: CryptoWorkerBridge | null = null;
  private static _file: FileWorkerBridge | null = null;
  private static _network: NetworkWorkerBridge | null = null;
  private static _compression: CompressionWorkerBridge | null = null;

  public static get crypto(): CryptoWorkerBridge {
    if (!this._crypto) {
      this._crypto = CryptoWorkerBridge.getInstance();
    }
    return this._crypto;
  }

  public static get file(): FileWorkerBridge {
    if (!this._file) {
      this._file = FileWorkerBridge.getInstance();
    }
    return this._file;
  }

  public static get network(): NetworkWorkerBridge {
    if (!this._network) {
      this._network = NetworkWorkerBridge.getInstance();
    }
    return this._network;
  }

  public static get compression(): CompressionWorkerBridge {
    if (!this._compression) {
      this._compression = CompressionWorkerBridge.getInstance();
    }
    return this._compression;
  }

  /**
   * Destroy all worker pools
   */
  public static destroyAll(): void {
    WorkerBridge.crypto.destroy();
    WorkerBridge.file.destroy();
    WorkerBridge.network.destroy();
    WorkerBridge.compression.destroy();
  }

  /**
   * Get stats from all worker pools
   */
  public static getAllStats() {
    return {
      crypto: WorkerBridge.crypto.getStats(),
      file: WorkerBridge.file.getStats(),
      network: WorkerBridge.network.getStats(),
      compression: WorkerBridge.compression.getStats(),
    };
  }
}

// Export individual bridges for direct access (lazy getters)
export const getCryptoWorker = () => WorkerBridge.crypto;
export const getFileWorker = () => WorkerBridge.file;
export const getNetworkWorker = () => WorkerBridge.network;
export const getCompressionWorker = () => WorkerBridge.compression;
