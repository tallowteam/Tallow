# Web Worker IPC System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│                                                                       │
│  React Components / Business Logic                                   │
│  - File upload handlers                                              │
│  - Transfer managers                                                 │
│  - UI components                                                     │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      WorkerBridge (High-Level API)                   │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │   Crypto    │  │    File     │  │   Network   │  │Compression ││
│  │   Bridge    │  │   Bridge    │  │   Bridge    │  │   Bridge   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘│
│                                                                       │
│  Features:                                                           │
│  - Singleton pattern                                                 │
│  - Auto fallback to main thread                                      │
│  - Type-safe methods                                                 │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        IPC Protocol Layer                            │
│                                                                       │
│  IPCProtocol                                                         │
│  - Message creation & validation                                     │
│  - Request/response tracking                                         │
│  - Timeout management                                                │
│  - Progress updates                                                  │
│  - Cancellation support                                              │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Worker Pool Layer                              │
│                                                                       │
│  WorkerPool                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  │ Worker N │           │
│  │  idle    │  │  busy    │  │  idle    │  │  busy    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                       │
│  Features:                                                           │
│  - Load balancing (round-robin / least-busy)                         │
│  - Health monitoring                                                 │
│  - Auto restart on failure                                           │
│  - Task queueing                                                     │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Worker Threads         │    │   Main Thread Fallback   │
│                          │    │                          │
│  crypto.worker.ts        │    │  crypto-fallback.ts      │
│  file.worker.ts          │    │  - Direct crypto.subtle  │
│  network.worker.ts       │    │  - Browser APIs          │
│  compression.worker.ts   │    │  - Synchronous ops       │
└──────────────────────────┘    └──────────────────────────┘
```

## Message Flow

### Request/Response Pattern

```
Main Thread                                Worker Thread
────────────                               ─────────────

1. Create Message
   ┌──────────────────┐
   │ IPCMessage       │
   │ - id: "abc-123"  │
   │ - type: "hash"   │
   │ - channel: "file"│
   │ - payload: {...} │
   └──────────────────┘
          │
          │ postMessage()
          ├─────────────────────────────────────►
          │                                      │
          │                                2. Receive & Process
          │                                   ┌──────────────┐
          │                                   │ hash(data)   │
          │                                   └──────────────┘
          │                                      │
          │                                3. Send Progress (optional)
          │◄─────────────────────────────────────┤
          │                                      │
   ┌──────────────────┐                          │
   │ IPCProgress      │                          │
   │ - id: "abc-123"  │                          │
   │ - progress: 50   │                          │
   └──────────────────┘                          │
          │                                      │
          │                                4. Send Response
          │◄─────────────────────────────────────┤
          │                                      │
5. Resolve Promise                               │
   ┌──────────────────┐
   │ IPCResponse      │
   │ - id: "abc-123"  │
   │ - success: true  │
   │ - data: {...}    │
   └──────────────────┘
```

## Shared State Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  SharedArrayBuffer Memory                   │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │ SharedProgress│  │SharedCancellat│  │ SharedCounter │ │
│  │               │  │     ion       │  │               │ │
│  │ [current: 75] │  │ [cancelled:0] │  │ [value: 100]  │ │
│  │ [total: 100]  │  │               │  │               │ │
│  │ [percent:7500]│  │               │  │               │ │
│  └───────────────┘  └───────────────┘  └───────────────┘ │
└────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │         │          │         │          │         │
┌───┴───┐ ┌───┴───┐  ┌───┴───┐ ┌───┴───┐  ┌───┴───┐ ┌───┴───┐
│Worker1│ │Worker2│  │Worker3│ │ Main  │  │Worker5│ │Worker6│
└───────┘ └───────┘  └───────┘ └───────┘  └───────┘ └───────┘

All threads can atomically read/write shared state
```

## Worker Pool Load Balancing

### Round-Robin Strategy

```
Tasks: [A, B, C, D, E, F, G, H]

Workers: [W1, W2, W3, W4]

Distribution:
  W1: [A, E]
  W2: [B, F]
  W3: [C, G]
  W4: [D, H]

Simple, fair distribution
Good for uniform task sizes
```

### Least-Busy Strategy

```
Tasks: [A(10s), B(2s), C(5s), D(1s)]

Workers: [W1(idle), W2(busy), W3(idle), W4(idle)]

Distribution:
  W1: A(10s)
  W2: (already busy)
  W3: B(2s), D(1s)  ← least busy after A assigned
  W4: C(5s)

Optimal for varying task sizes
Maximizes throughput
```

## Component Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Usage Example                   │
└─────────────────────────────────────────────────────────────┘

import { WorkerBridge, createProgressTracker, createCancellationToken }
from '@/lib/workers';

// Setup progress tracking
const { progress, cleanup } = createProgressTracker(1000);

// Setup cancellation
const { cancellation, cancel } = createCancellationToken();

// Use worker bridge
const result = await WorkerBridge.crypto.encryptFile(
  fileData,
  key,
  nonce,
  {
    onProgress: (p) => {
      console.log(`${p.progress}%`);
      // Update UI
      updateProgressBar(p.progress);
    },
    signal: cancellation.toAbortSignal()
  }
);

// Cleanup
cleanup();
```

## Data Flow - File Encryption Example

```
┌──────────────┐
│   Browser    │
│  File Input  │
└──────┬───────┘
       │
       │ File object
       ▼
┌──────────────────────────────┐
│  React Component             │
│  - Convert to ArrayBuffer    │
│  - Generate key & nonce      │
└──────┬───────────────────────┘
       │
       │ ArrayBuffer
       ▼
┌──────────────────────────────┐
│  WorkerBridge.crypto         │
│  - encryptFile()             │
└──────┬───────────────────────┘
       │
       │ IPC Message
       ▼
┌──────────────────────────────┐
│  IPCProtocol                 │
│  - Create message            │
│  - Track request             │
│  - Set timeout               │
└──────┬───────────────────────┘
       │
       │ postMessage()
       ▼
┌──────────────────────────────┐
│  WorkerPool                  │
│  - Select worker             │
│  - Queue if busy             │
└──────┬───────────────────────┘
       │
       │ Forward to worker
       ▼
┌──────────────────────────────┐
│  crypto.worker.ts            │
│  - Import AES-GCM key        │
│  - Encrypt data              │
│  - Send progress updates     │
└──────┬───────────────────────┘
       │
       │ Response message
       ▼
┌──────────────────────────────┐
│  IPCProtocol                 │
│  - Match response to request │
│  - Resolve Promise           │
└──────┬───────────────────────┘
       │
       │ Result
       ▼
┌──────────────────────────────┐
│  React Component             │
│  - Update UI                 │
│  - Store encrypted data      │
└──────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Error Scenarios                         │
└─────────────────────────────────────────────────────────────┘

1. Worker Crash
   Worker → (crashes) → onerror event → Pool restarts worker
   Task → Rejected → Retry (if enabled) → Success/Fail

2. Operation Timeout
   Request → Timer started → No response → Timer fires
   → Promise rejected with TimeoutError

3. Cancellation
   User action → cancellation.cancel() → AbortSignal fires
   → Worker checks signal → Throws abort error
   → Promise rejected with AbortError

4. Worker Unavailable
   WorkerBridge → Detects no Worker support
   → Falls back to main thread
   → Executes synchronously
   → Returns result

5. Invalid Input
   Worker → Validates input → Throws error
   → Sends error response
   → Promise rejected with validation error
```

## Memory Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Transferable Objects                      │
└─────────────────────────────────────────────────────────────┘

Main Thread                          Worker Thread
─────────────                        ─────────────

ArrayBuffer (10 MB)
     │
     │ postMessage([buffer], [buffer])  ← Transfer ownership
     ├─────────────────────────►
     │                                  ArrayBuffer (10 MB)
     ✗ (neutered)                       (now owns memory)
                                             │
                                        Process...
                                             │
                                        postMessage([result], [result])
     ◄─────────────────────────┤
ArrayBuffer (result)                    ✗ (neutered)
(now owns memory)

Benefits:
- Zero-copy transfer
- No serialization overhead
- Reduced memory usage
- Faster performance
```

## Lifecycle Management

```
┌─────────────────────────────────────────────────────────────┐
│              Worker Pool Lifecycle                           │
└─────────────────────────────────────────────────────────────┘

1. Initialization
   ┌─────────────────┐
   │ createWorkerPool│
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Create N workers│
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Setup listeners │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Wait for 'ready'│
   └────────┬────────┘
            │
            ▼
        [READY]

2. Operation
   ┌─────────────────┐
   │  Task arrives   │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Worker available?│
   └────────┬────────┘
            │
      Yes   │   No
   ┌────────┴────────┐
   │                 │
   ▼                 ▼
[Execute]      [Queue Task]
   │                 │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Process & return│
   └─────────────────┘

3. Error Handling
   ┌─────────────────┐
   │  Worker error   │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Increment errors│
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Errors > limit? │
   └────────┬────────┘
            │
      Yes   │   No
   ┌────────┴────────┐
   │                 │
   ▼                 ▼
[Restart]      [Continue]
   │                 │
   └────────┬────────┘
            │
            ▼
   [Operational]

4. Shutdown
   ┌─────────────────┐
   │  pool.terminate │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Reject pending  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Clear queue     │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Terminate workers│
   └────────┬────────┘
            │
            ▼
   [TERMINATED]
```

## Performance Optimization Strategies

```
┌─────────────────────────────────────────────────────────────┐
│                  Optimization Layers                         │
└─────────────────────────────────────────────────────────────┘

1. Worker Pool
   - Reuse workers (avoid spawn cost)
   - Load balancing (maximize utilization)
   - Health monitoring (detect issues early)

2. Message Passing
   - Transferable objects (zero-copy)
   - Batch small operations (reduce overhead)
   - Compress large payloads (reduce transfer time)

3. Shared State
   - Atomic operations (lock-free)
   - Minimal synchronization (reduce contention)
   - Local caching (reduce reads)

4. Task Scheduling
   - Priority queues (important tasks first)
   - Deadline scheduling (time-sensitive tasks)
   - Affinity (cache-friendly assignment)

5. Fallback Strategy
   - Feature detection (avoid unnecessary attempts)
   - Graceful degradation (always functional)
   - Performance hints (guide optimization)
```

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Model                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│      Same Origin         │
│  ┌────────────────────┐ │
│  │   Main Thread      │ │
│  │   - Full DOM       │ │
│  │   - Cookies        │ │
│  │   - localStorage   │ │
│  └──────────┬─────────┘ │
│             │            │
│             │ Message    │
│             │ Passing    │
│             ▼            │
│  ┌────────────────────┐ │
│  │   Worker Thread    │ │
│  │   - No DOM         │ │
│  │   - No cookies     │ │
│  │   - Isolated scope │ │
│  └────────────────────┘ │
└──────────────────────────┘

Security Features:
- Worker isolation (no direct DOM access)
- Message validation (type checking)
- Timeout enforcement (prevent hangs)
- Error sanitization (no data leakage)
- Nonce enforcement (prevent crypto attacks)
```

## Deployment Considerations

```
┌─────────────────────────────────────────────────────────────┐
│              Production Requirements                         │
└─────────────────────────────────────────────────────────────┘

1. CORS Headers (for Worker scripts)
   Access-Control-Allow-Origin: *
   or serve from same origin

2. COOP/COEP Headers (for SharedArrayBuffer)
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp

3. Content-Type Header (for Workers)
   Content-Type: application/javascript
   or text/javascript

4. Worker Path Configuration
   - Absolute paths: /workers/crypto.worker.js
   - Relative paths: ./workers/crypto.worker.js
   - CDN paths: https://cdn.example.com/workers/

5. Build Configuration
   - Bundle workers separately
   - Minify worker code
   - Source maps for debugging
   - Tree shaking for size
```
