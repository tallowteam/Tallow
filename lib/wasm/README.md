# WASM Integration Module

Complete WebAssembly integration for Rust-based crypto performance acceleration in Tallow.

## Overview

This module provides automatic WASM acceleration for cryptographic operations with intelligent fallback to JavaScript implementations. It includes performance benchmarking, smart routing, and comprehensive monitoring.

## Features

- **Lazy Loading**: WASM modules are loaded on-demand to minimize initial bundle size
- **Automatic Fallback**: Gracefully falls back to JavaScript when WASM is unavailable
- **Performance Benchmarking**: Automatically measures WASM vs JS performance on first use
- **Smart Routing**: Routes operations to fastest implementation (WASM if >2x faster)
- **Thread-Safe**: Can be called from Web Workers
- **Caching**: Loaded WASM modules are cached to prevent duplicate loads
- **Monitoring**: Comprehensive performance reporting and metrics

## Architecture

### Module Structure

```
lib/wasm/
├── wasm-loader.ts          # WASM module loading and caching
├── performance-bridge.ts   # Performance measurement and routing
├── index.ts                # Public API exports
└── README.md               # This file
```

### Components

1. **WASM Loader** (`wasm-loader.ts`)
   - Detects WASM support
   - Loads WASM modules with caching
   - Provides type-safe crypto interface
   - Falls back to JS implementations

2. **Performance Bridge** (`performance-bridge.ts`)
   - Benchmarks WASM vs JS on first call
   - Routes to fastest implementation
   - Tracks performance metrics
   - Provides performance reports

3. **Public API** (`index.ts`)
   - High-level crypto functions
   - Performance utilities
   - Convenience exports

## Usage

### Basic Usage

```typescript
import { hash, encrypt, decrypt, deriveKey } from '@/lib/wasm';

// Hash data (auto-selects WASM or JS)
const digest = await hash('sha256', data);

// Encrypt data
const { ciphertext, nonce } = await encrypt('aes-256-gcm', key, plaintext);

// Decrypt data
const plaintext = await decrypt('aes-256-gcm', key, ciphertext, nonce);

// Derive key from password
const derivedKey = await deriveKey('password', salt, {
  memory: 65536,      // 64 MiB
  iterations: 3,
  parallelism: 4,
  hashLength: 32,
});
```

### Performance Monitoring

```typescript
import {
  isWasmAccelerated,
  getPerformanceReport,
  runBenchmarks
} from '@/lib/wasm';

// Check if WASM is providing acceleration
if (isWasmAccelerated()) {
  console.log('WASM acceleration is active');
}

// Get performance report
const report = getPerformanceReport();
console.log(`WASM speedup: ${report.speedup.toFixed(2)}x`);
console.log('Operations:', report.operations);

// Run comprehensive benchmarks
await runBenchmarks();
const newReport = getPerformanceReport();
```

### Advanced Usage

```typescript
import { getPerformanceBridge, getWasmCrypto } from '@/lib/wasm';

// Direct access to performance bridge
const bridge = getPerformanceBridge();

// Get metrics for specific operation
const hashMetrics = bridge.getOperationMetrics('hash');
console.log(`Hash speedup: ${hashMetrics?.speedup.toFixed(2)}x`);

// Direct WASM crypto access (always uses WASM, no fallback)
const wasmCrypto = getWasmCrypto();
const result = await wasmCrypto.hash('sha256', data);
```

### Web Worker Integration

```typescript
// In crypto.worker.ts
import { hash, encrypt, decrypt } from '@/lib/wasm';

ctx.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'hash': {
      const result = await hash('sha256', payload.data);
      ctx.postMessage({ result });
      break;
    }
    case 'encrypt': {
      const result = await encrypt('aes-256-gcm', payload.key, payload.data);
      ctx.postMessage({ result });
      break;
    }
  }
};
```

## Performance Benchmarking

### Benchmark Strategy

On first call to each operation type (hash, encrypt, decrypt, derive-key):

1. Execute operation using WASM
2. Execute operation using JavaScript
3. Compare execution times
4. Calculate speedup ratio
5. Select fastest implementation for future calls

### Benchmark Criteria

WASM is used if:
- WASM is supported in the environment
- WASM execution time < JavaScript execution time
- Speedup ratio > 2.0x (WASM must be at least 2x faster)

### Re-benchmarking

```typescript
import { resetPerformanceMetrics, runBenchmarks } from '@/lib/wasm';

// Reset metrics
resetPerformanceMetrics();

// Run fresh benchmarks
await runBenchmarks();
```

## Integration with Existing Crypto

### Updating crypto.worker.ts

```typescript
// Before
import { sha256 } from '@noble/hashes/sha2.js';

async function hash(data: ArrayBuffer): Promise<ArrayBuffer> {
  const digest = sha256(new Uint8Array(data));
  return digest.buffer;
}

// After
import { hash as wasmHash } from '@/lib/wasm';

async function hash(data: ArrayBuffer): Promise<ArrayBuffer> {
  const digest = await wasmHash('sha256', new Uint8Array(data));
  return digest.buffer;
}
```

### Updating pqc-crypto.ts

```typescript
// Before
import { sha256 } from '@noble/hashes/sha2.js';

hash(data: Uint8Array): Uint8Array {
  return sha256(data);
}

// After
import { hash as wasmHash } from '@/lib/wasm';

async hash(data: Uint8Array): Promise<Uint8Array> {
  return wasmHash('sha256', data);
}
```

## Next.js Configuration

WASM support is already configured in `next.config.ts`:

```typescript
webpack: (config, { isServer }) => {
  // Enable WASM support
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
    layers: true,
  };

  // WASM file output path
  if (config.output) {
    config.output.webassemblyModuleFilename =
      isServer ? './../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';
  }

  // Handle WASM files
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'webassembly/async',
  });

  return config;
}
```

## WASM Module Development

### Creating Rust WASM Modules

To create actual WASM modules for crypto operations:

```bash
# Create Rust WASM project
cargo new --lib tallow-crypto-wasm
cd tallow-crypto-wasm

# Add dependencies to Cargo.toml
[dependencies]
wasm-bindgen = "0.2"
sha2 = "0.10"
aes-gcm = "0.10"
argon2 = "0.5"

[lib]
crate-type = ["cdylib"]

# Build WASM
wasm-pack build --target web --out-dir ../public/static/wasm
```

### Example Rust Implementation

```rust
use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};

#[wasm_bindgen]
pub fn hash_sha256(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}
```

## Performance Expectations

### Expected Speedups (approximate)

| Operation     | WASM Speedup | Notes                              |
|---------------|--------------|-------------------------------------|
| SHA-256       | 2-4x         | SIMD optimizations in Rust         |
| AES-256-GCM   | 1.5-3x       | Hardware AES instructions          |
| ChaCha20      | 2-5x         | SIMD optimizations                 |
| Argon2id      | 3-8x         | Memory-hard operations benefit most|
| Blake3        | 3-6x         | Highly parallelizable              |

### Benchmark Results

Run benchmarks and view results:

```typescript
import { runBenchmarks, getPerformanceReport } from '@/lib/wasm';

await runBenchmarks();
const report = getPerformanceReport();

console.table({
  Hash: report.operations.hash,
  Encrypt: report.operations.encrypt,
  Decrypt: report.operations.decrypt,
  DeriveKey: report.operations['derive-key'],
});
```

## Browser Compatibility

WASM is supported in:
- Chrome/Edge 57+
- Firefox 52+
- Safari 11+
- Opera 44+

Fallback to JavaScript works in all browsers.

## Security Considerations

1. **Same Security Level**: WASM and JS implementations provide identical cryptographic security
2. **No Key Material in WASM Memory**: Keys are passed as parameters, not stored
3. **Constant-Time Operations**: Both implementations use constant-time algorithms
4. **Memory Cleanup**: Sensitive data is zeroed after use

## Troubleshooting

### WASM Module Not Loading

```typescript
import { isWasmSupported } from '@/lib/wasm';

if (!isWasmSupported()) {
  console.warn('WASM not supported, using JavaScript fallback');
}
```

### Performance Degradation

```typescript
// Check if WASM is actually being used
const report = getPerformanceReport();
if (!report.wasmAvailable) {
  console.warn('WASM unavailable');
} else if (report.speedup < 1.5) {
  console.warn('WASM not providing significant speedup');
}
```

### Force Re-benchmark

```typescript
import { resetPerformanceMetrics, runBenchmarks } from '@/lib/wasm';

// Reset and re-run benchmarks
resetPerformanceMetrics();
await runBenchmarks();
```

## API Reference

### Functions

#### `isWasmSupported(): boolean`
Check if WebAssembly is supported in the current environment.

#### `isWasmAccelerated(): boolean`
Check if WASM is providing performance benefits (>1.5x speedup).

#### `getPerformanceReport(): PerformanceReport`
Get comprehensive performance metrics for all operations.

#### `runBenchmarks(): Promise<void>`
Run benchmarks for all crypto operations.

#### `resetPerformanceMetrics(): void`
Reset all performance metrics (useful for re-benchmarking).

#### `hash(algorithm, data): Promise<Uint8Array>`
Hash data using fastest implementation.

#### `encrypt(algorithm, key, data, nonce?): Promise<{ciphertext, nonce}>`
Encrypt data using fastest implementation.

#### `decrypt(algorithm, key, data, nonce): Promise<Uint8Array>`
Decrypt data using fastest implementation.

#### `deriveKey(password, salt, params?): Promise<Uint8Array>`
Derive key from password using fastest implementation.

### Types

```typescript
type CryptoOperation = 'hash' | 'encrypt' | 'decrypt' | 'derive-key';

interface PerformanceMetrics {
  operation: CryptoOperation;
  wasmTime: number;      // Average time in ms
  jsTime: number;        // Average time in ms
  speedup: number;       // Ratio: jsTime / wasmTime
  samples: number;       // Number of benchmark samples
  useWasm: boolean;      // Whether WASM is faster
}

interface PerformanceReport {
  wasmAvailable: boolean;
  wasmEnabled: boolean;
  operations: Record<CryptoOperation, PerformanceMetrics | null>;
  totalSpeedup: number;  // Average speedup across all operations
}
```

## Future Enhancements

1. **Pre-compiled WASM Modules**: Ship pre-built WASM modules for common crypto operations
2. **Parallel Processing**: Use WASM threads for multi-core crypto operations
3. **Streaming APIs**: Support streaming encryption/decryption for large files
4. **Hardware Acceleration**: Detect and use WebGPU for crypto when available
5. **Custom Benchmarking**: Allow users to define custom benchmark scenarios

## License

Same as Tallow project.
