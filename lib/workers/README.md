# Web Worker IPC System

Comprehensive Inter-Process Communication (IPC) protocol for Web Workers with type-safe message passing, worker pooling, and shared state management.

## Features

- **Type-Safe IPC Protocol**: Structured message passing with request-response pattern
- **Worker Pooling**: Efficient parallel processing with automatic load balancing
- **Worker Bridge**: High-level API with automatic fallback to main thread
- **Shared State**: SharedArrayBuffer-based atomic state sharing (with fallback)
- **Progress Tracking**: Real-time progress updates across threads
- **Cancellation**: Cooperative cancellation signals
- **Error Handling**: Automatic retries and graceful degradation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            WorkerBridge (High-Level API)             │   │
│  │  - cryptoWorker.encryptFile()                        │   │
│  │  - fileWorker.hashFile()                             │   │
│  │  - networkWorker.testConnectivity()                  │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │          IPCProtocol (Message Protocol)              │   │
│  │  - createMessage(), request(), handleMessage()       │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │          WorkerPool (Load Balancing)                 │   │
│  │  - Round-robin / Least-busy distribution             │   │
│  │  - Health monitoring, auto-restart                   │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Worker 1 │ │ Worker 2 │ │ Worker N │
    └──────────┘ └──────────┘ └──────────┘
```

## Quick Start

### 1. Using WorkerBridge (Recommended)

The simplest way to use workers with automatic fallback:

```typescript
import { WorkerBridge } from '@/lib/workers/worker-bridge';

// Encrypt a file
const encrypted = await WorkerBridge.crypto.encryptFile(
  fileData,        // ArrayBuffer
  encryptionKey,   // Uint8Array
  nonce,           // Uint8Array
  {
    onProgress: (progress) => {
      console.log(`Encryption: ${progress.progress}%`);
    }
  }
);

// Hash a file
const hash = await WorkerBridge.crypto.hashFile(fileData);

// Test connectivity
const results = await WorkerBridge.network.testConnectivity([
  'https://api.example.com',
  'https://backup.example.com'
]);

// Compress data
const compressed = await WorkerBridge.compression.compressData(
  data,
  { algorithm: 'gzip', level: 6 }
);
```

### 2. Using IPC Protocol Directly

For custom worker implementations:

```typescript
import { createIPCProtocol } from '@/lib/workers/ipc-protocol';

const protocol = createIPCProtocol({
  defaultTimeout: 30000,
  debug: true,
  enableRetries: true
});

const worker = new Worker('/workers/custom.worker.ts');

// Send request and wait for response
const result = await protocol.request(
  worker,
  'process-data',
  'custom',
  { data: largeDataset },
  {
    timeout: 60000,
    onProgress: (progress) => {
      console.log(`Progress: ${progress.progress}%`);
    }
  }
);

// Handle messages in worker
worker.onmessage = (event) => {
  protocol.handleMessage(event);
};

// Cleanup
protocol.destroy();
worker.terminate();
```

### 3. Using Worker Pool

For managing multiple workers:

```typescript
import { createWorkerPool } from '@/lib/workers/worker-pool';

const pool = createWorkerPool(
  '/workers/crypto.worker.ts',
  4, // 4 workers
  {
    strategy: 'least-busy',
    taskTimeout: 60000
  }
);

// Execute tasks in parallel
const tasks = files.map(file =>
  pool.execute({
    type: 'hash-file',
    id: crypto.randomUUID(),
    payload: { file: file.arrayBuffer() }
  })
);

const results = await Promise.all(tasks);

// Get statistics
const stats = pool.getStats();
console.log('Pool stats:', stats);

// Cleanup
pool.terminate();
```

### 4. Using Shared State

For progress tracking and cancellation:

```typescript
import {
  SharedProgress,
  SharedCancellation,
  isSharedArrayBufferAvailable
} from '@/lib/workers/shared-state';

// Check if SharedArrayBuffer is available
if (isSharedArrayBufferAvailable()) {
  // Create shared progress tracker
  const progress = new SharedProgress(1000);

  // Transfer to worker
  worker.postMessage({
    type: 'init',
    progressBuffer: progress.getBuffer()
  }, [progress.getBuffer()!]);

  // Monitor progress from main thread
  const interval = setInterval(() => {
    console.log(`Progress: ${progress.getPercent()}%`);
    if (progress.get() >= progress.getTotal()) {
      clearInterval(interval);
    }
  }, 100);

  // In worker:
  // const progress = SharedProgress.fromBuffer(progressBuffer);
  // for (let i = 0; i < items.length; i++) {
  //   processItem(items[i]);
  //   progress.increment();
  // }
}

// Cancellation
const cancellation = new SharedCancellation();

// Cancel from main thread
cancelButton.onclick = () => {
  cancellation.cancel();
};

// Check in worker
function processLargeDataset(data: any[]) {
  for (let i = 0; i < data.length; i++) {
    if (cancellation.isCancelled()) {
      throw new Error('Operation cancelled');
    }
    processItem(data[i]);
  }
}

// Convert to AbortSignal
const signal = cancellation.toAbortSignal();
await fetch('/api/data', { signal });
```

## API Reference

### WorkerBridge

#### Crypto Operations

```typescript
interface CryptoWorker {
  // Encrypt file with AES-256-GCM
  encryptFile(
    data: ArrayBuffer,
    key: Uint8Array,
    nonce?: Uint8Array,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<{ ciphertext: ArrayBuffer; nonce: ArrayBuffer }>;

  // Decrypt file
  decryptFile(
    ciphertext: ArrayBuffer,
    key: Uint8Array,
    nonce: Uint8Array,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<ArrayBuffer>;

  // Hash file (SHA-256)
  hashFile(
    data: ArrayBuffer,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<string>;

  // Derive key from password
  deriveKey(
    password: string,
    salt: Uint8Array,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<ArrayBuffer>;
}
```

#### File Operations

```typescript
interface FileWorker {
  // Hash a file
  hashFile(
    file: ArrayBuffer,
    algorithm?: 'SHA-256' | 'SHA-512',
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<{ hash: string; algorithm: string }>;

  // Split file into chunks
  chunkFile(
    file: ArrayBuffer,
    chunkSize: number,
    fileName: string,
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<{ chunks: ArrayBuffer[]; metadata: ChunkMetadata }>;

  // Merge chunks
  mergeChunks(
    chunks: ArrayBuffer[],
    options?: { onProgress?: (progress: IPCProgressMessage) => void }
  ): Promise<ArrayBuffer>;

  // Detect file type
  detectType(
    file: ArrayBuffer,
    fileName?: string
  ): Promise<{ type: string; mimeType: string; confidence: 'high' | 'low' }>;

  // Read file metadata
  readMetadata(
    file: ArrayBuffer,
    fileName: string
  ): Promise<FileMetadata>;
}
```

#### Network Operations

```typescript
interface NetworkWorker {
  // Test connectivity to URLs
  testConnectivity(
    urls: string[],
    timeout?: number
  ): Promise<ConnectivityResult[]>;

  // Resolve ICE candidates
  resolveIce(
    stunServers: string[]
  ): Promise<{ candidates: RTCIceCandidate[]; success: boolean }>;

  // Test bandwidth
  bandwidthTest(
    url: string,
    payloadSize?: number
  ): Promise<{
    bandwidthMbps: number;
    transferTime: number;
    bytesTransferred: number;
  }>;

  // Check latency
  latencyCheck(
    url: string,
    samples?: number
  ): Promise<{
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    samples: number[];
  }>;
}
```

#### Compression Operations

```typescript
interface CompressionWorker {
  // Compress data
  compressData(
    data: ArrayBuffer,
    options?: {
      algorithm: 'gzip' | 'deflate' | 'brotli';
      level?: number;
    }
  ): Promise<ArrayBuffer>;

  // Decompress data
  decompressData(
    data: ArrayBuffer,
    algorithm?: 'gzip' | 'deflate' | 'brotli'
  ): Promise<ArrayBuffer>;
}
```

### IPCProtocol

```typescript
class IPCProtocol {
  constructor(config?: IPCProtocolConfig);

  // Generate unique message ID
  generateMessageId(): string;

  // Create IPC message
  createMessage<T>(
    type: IPCMessageType,
    channel: IPCChannel,
    payload: T,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      timeout?: number;
      correlationId?: string;
    }
  ): IPCMessage<T>;

  // Send request and wait for response
  request<TRequest, TResponse>(
    worker: Worker,
    type: IPCMessageType,
    channel: IPCChannel,
    payload: TRequest,
    options?: {
      timeout?: number;
      priority?: 'low' | 'normal' | 'high';
      onProgress?: (progress: IPCProgressMessage) => void;
      signal?: AbortSignal;
    }
  ): Promise<TResponse>;

  // Handle incoming message
  handleMessage(event: MessageEvent): void;

  // Cancel a request
  cancelRequest(messageId: string): boolean;

  // Cancel all requests
  cancelAll(): void;

  // Get statistics
  getStats(): {
    pendingRequests: number;
    averageResponseTime: number;
    oldestRequestAge: number;
  };

  // Cleanup
  destroy(): void;
}
```

### WorkerPool

```typescript
class WorkerPool {
  constructor(
    workerUrl: string,
    poolSize: number,
    options?: {
      maxRetries?: number;
      taskTimeout?: number;
      strategy?: 'round-robin' | 'least-busy';
    }
  );

  // Execute task
  execute<T>(message: unknown): Promise<T>;

  // Get statistics
  getStats(): {
    poolSize: number;
    busyWorkers: number;
    queuedTasks: number;
    totalTasksProcessed: number;
    totalErrors: number;
  };

  // Terminate pool
  terminate(): void;
}
```

### Shared State

```typescript
// Progress tracking
class SharedProgress {
  constructor(total?: number);
  static fromBuffer(buffer: SharedArrayBuffer): SharedProgress;

  getBuffer(): SharedArrayBuffer | null;
  setTotal(total: number): void;
  getTotal(): number;
  increment(delta?: number): number;
  set(value: number): void;
  get(): number;
  getPercent(): number;
  reset(): void;
  subscribe(handler: (progress: number) => void): () => void;
}

// Cancellation
class SharedCancellation {
  constructor();
  static fromBuffer(buffer: SharedArrayBuffer): SharedCancellation;

  getBuffer(): SharedArrayBuffer | null;
  cancel(): void;
  isCancelled(): boolean;
  reset(): void;
  wait(timeout?: number): boolean;
  subscribe(handler: () => void): () => void;
  toAbortSignal(): AbortSignal;
}

// Counter
class SharedCounter {
  constructor(initialValue?: number);
  static fromBuffer(buffer: SharedArrayBuffer): SharedCounter;

  increment(delta?: number): number;
  decrement(delta?: number): number;
  get(): number;
  set(value: number): void;
  compareAndSwap(expected: number, newValue: number): boolean;
}

// Flag
class SharedFlag {
  constructor(initialValue?: boolean);
  static fromBuffer(buffer: SharedArrayBuffer): SharedFlag;

  set(): void;
  clear(): void;
  isSet(): boolean;
  toggle(): boolean;
  wait(timeout?: number): boolean;
}
```

## Examples

### Example 1: File Encryption with Progress

```typescript
import { WorkerBridge } from '@/lib/workers/worker-bridge';

async function encryptLargeFile(file: File) {
  const data = await file.arrayBuffer();
  const key = crypto.getRandomValues(new Uint8Array(32));
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  let progressValue = 0;

  const result = await WorkerBridge.crypto.encryptFile(
    data,
    key,
    nonce,
    {
      onProgress: (progress) => {
        progressValue = progress.progress;
        updateProgressBar(progressValue);
      }
    }
  );

  return {
    ciphertext: result.ciphertext,
    nonce: result.nonce,
    key
  };
}
```

### Example 2: Parallel File Processing

```typescript
import { createWorkerPool } from '@/lib/workers/worker-pool';

async function processMultipleFiles(files: File[]) {
  const pool = createWorkerPool(
    '/workers/file.worker.ts',
    navigator.hardwareConcurrency || 4
  );

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const data = await file.arrayBuffer();
        return pool.execute({
          id: crypto.randomUUID(),
          type: 'hash-file',
          channel: 'file',
          payload: { file: data, algorithm: 'SHA-256' },
          timestamp: Date.now()
        });
      })
    );

    return results;
  } finally {
    pool.terminate();
  }
}
```

### Example 3: Cancellable Operation

```typescript
import { SharedCancellation } from '@/lib/workers/shared-state';
import { WorkerBridge } from '@/lib/workers/worker-bridge';

async function processWithCancellation(data: ArrayBuffer) {
  const cancellation = new SharedCancellation();
  const signal = cancellation.toAbortSignal();

  // Wire up cancel button
  cancelButton.onclick = () => cancellation.cancel();

  try {
    const result = await WorkerBridge.crypto.hashFile(data, {
      signal
    });
    return result;
  } catch (error) {
    if (signal.aborted) {
      console.log('Operation cancelled by user');
    }
    throw error;
  }
}
```

### Example 4: Custom Worker with IPC

```typescript
// custom.worker.ts
import { IPCProtocol, IPCMessage } from '@/lib/workers/ipc-protocol';

const protocol = new IPCProtocol();
const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (event: MessageEvent) => {
  const message = event.data as IPCMessage;

  try {
    let result: unknown;

    switch (message.type) {
      case 'custom-operation':
        result = await performCustomOperation(message.payload);
        break;
      default:
        throw new Error(`Unknown operation: ${message.type}`);
    }

    ctx.postMessage(protocol.createSuccessResponse(message.id, result));
  } catch (error) {
    ctx.postMessage(
      protocol.createErrorResponse(
        message.id,
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};

// Send progress updates
function sendProgress(messageId: string, progress: number) {
  ctx.postMessage({
    id: messageId,
    type: 'progress',
    progress
  });
}

ctx.postMessage({ type: 'ready' });
```

## Performance Considerations

### Worker Pool Sizing

```typescript
// Auto-size based on CPU cores
const poolSize = navigator.hardwareConcurrency || 4;

// For I/O-bound tasks, can use more workers
const ioPoolSize = (navigator.hardwareConcurrency || 4) * 2;

// For CPU-bound tasks, match core count
const cpuPoolSize = navigator.hardwareConcurrency || 4;

// For mixed workloads, use 50% more than cores
const mixedPoolSize = Math.ceil((navigator.hardwareConcurrency || 4) * 1.5);
```

### Optimal Chunk Size

```typescript
// For file chunking, use 1-16 MB chunks
const CHUNK_SIZE = 1024 * 1024 * 4; // 4 MB

// Smaller chunks for better progress granularity
const FINE_GRAINED_CHUNK = 1024 * 1024; // 1 MB

// Larger chunks for maximum throughput
const HIGH_THROUGHPUT_CHUNK = 1024 * 1024 * 16; // 16 MB
```

### Timeout Guidelines

```typescript
// Quick operations (< 1 second expected)
const QUICK_TIMEOUT = 5000; // 5 seconds

// Normal operations (1-10 seconds expected)
const NORMAL_TIMEOUT = 30000; // 30 seconds

// Long operations (10-60 seconds expected)
const LONG_TIMEOUT = 120000; // 2 minutes

// Very long operations (> 1 minute expected)
const VERY_LONG_TIMEOUT = 300000; // 5 minutes
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Workers | ✅ 4+ | ✅ 3.5+ | ✅ 4+ | ✅ 12+ |
| SharedArrayBuffer | ✅ 68+ | ✅ 79+ | ✅ 15.2+ | ✅ 79+ |
| Atomics | ✅ 68+ | ✅ 78+ | ✅ 15.2+ | ✅ 79+ |
| CompressionStream | ✅ 80+ | ✅ 113+ | ✅ 16.4+ | ✅ 80+ |

**Note**: SharedArrayBuffer requires Cross-Origin Isolation (COOP/COEP headers).

## Troubleshooting

### SharedArrayBuffer not available

Add these headers to your server configuration:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Worker fails to load

Ensure worker files are served with correct MIME type:

```
Content-Type: application/javascript
```

### Memory leaks

Always clean up workers and protocols:

```typescript
// Cleanup worker bridge
WorkerBridge.destroyAll();

// Cleanup individual pools
pool.terminate();

// Cleanup protocols
protocol.destroy();
```

## License

MIT
