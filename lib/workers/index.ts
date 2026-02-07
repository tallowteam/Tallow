/**
 * Web Worker IPC System
 * Type-safe inter-process communication for Web Workers
 *
 * @module lib/workers
 */

// IPC Protocol
export {
  IPCProtocol,
  createIPCProtocol,
  createTypedSender,
  type IPCChannel,
  type IPCMessage,
  type IPCMessageType,
  type IPCResponse,
  type IPCProgressMessage,
  type IPCProtocolConfig,
} from './ipc-protocol';

// Worker Pool
export {
  WorkerPool,
  createWorkerPool,
} from './worker-pool';

// Worker Bridge (High-level API)
export {
  WorkerBridge,
  cryptoWorker,
  fileWorker,
  networkWorker,
  compressionWorker,
  type ConnectivityResult,
  type HashResult,
  type ChunkMetadata,
  type FileTypeResult,
  type FileMetadata,
  type EncryptionResult,
  type CompressionOptions,
} from './worker-bridge';

// Shared State
export {
  SharedProgress,
  SharedCancellation,
  SharedCounter,
  SharedFlag,
  MessageChannelSync,
  isSharedArrayBufferAvailable,
  getSharedStateCapabilities,
  createProgressTracker,
  createCancellationToken,
} from './shared-state';

// Crypto Fallback (for main thread operations)
export {
  encrypt,
  decrypt,
  hash,
  deriveKey,
} from './crypto-fallback';

/**
 * Quick Start Example
 *
 * ```typescript
 * import { WorkerBridge } from '@/lib/workers';
 *
 * // Encrypt a file
 * const encrypted = await WorkerBridge.crypto.encryptFile(
 *   fileData,
 *   encryptionKey,
 *   nonce,
 *   {
 *     onProgress: (progress) => {
 *       console.log(`Progress: ${progress.progress}%`);
 *     }
 *   }
 * );
 *
 * // Hash a file
 * const hash = await WorkerBridge.crypto.hashFile(fileData);
 *
 * // Test connectivity
 * const results = await WorkerBridge.network.testConnectivity([
 *   'https://api.example.com',
 *   'https://backup.example.com'
 * ]);
 *
 * // Compress data
 * const compressed = await WorkerBridge.compression.compressData(
 *   data,
 *   { algorithm: 'gzip', level: 6 }
 * );
 * ```
 */
