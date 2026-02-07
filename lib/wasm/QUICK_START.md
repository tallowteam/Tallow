# WASM Integration - Quick Start Guide

## Installation

No additional dependencies needed - WASM integration is built into Tallow.

## Basic Usage

### 1. Import the module

```typescript
import { hash, encrypt, decrypt, deriveKey } from '@/lib/wasm';
```

### 2. Use crypto operations

```typescript
// Hash
const digest = await hash('sha256', data);

// Encrypt
const { ciphertext, nonce } = await encrypt('aes-256-gcm', key, plaintext);

// Decrypt
const plaintext = await decrypt('aes-256-gcm', key, ciphertext, nonce);

// Derive key
const key = await deriveKey('password', salt);
```

## Performance Monitoring

```typescript
import { isWasmAccelerated, getPerformanceReport } from '@/lib/wasm';

// Check if WASM is active
if (isWasmAccelerated()) {
  console.log('🚀 WASM acceleration enabled');
}

// Get performance report
const report = getPerformanceReport();
console.log(`Speedup: ${report.speedup.toFixed(2)}x`);
```

## How It Works

1. **First call**: Benchmarks WASM vs JS
2. **Selection**: Uses WASM if >2x faster
3. **Future calls**: Routes to fastest implementation
4. **Automatic**: No configuration needed

## Common Patterns

### In Components

```typescript
'use client';
import { hash } from '@/lib/wasm';

export function FileHasher({ file }: { file: File }) {
  const computeHash = async () => {
    const buffer = await file.arrayBuffer();
    const digest = await hash('sha256', new Uint8Array(buffer));
    return digest;
  };
}
```

### In Workers

```typescript
// crypto.worker.ts
import { encrypt, decrypt } from '@/lib/wasm';

ctx.onmessage = async (event) => {
  const { ciphertext, nonce } = await encrypt(
    'aes-256-gcm',
    event.data.key,
    event.data.data
  );
  ctx.postMessage({ ciphertext, nonce });
};
```

### In Server Actions

```typescript
'use server';
import { deriveKey } from '@/lib/wasm';

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, {
    memory: 65536,
    iterations: 3,
    parallelism: 4,
  });
  return { key, salt };
}
```

## Troubleshooting

### WASM not loading?

```typescript
import { isWasmSupported } from '@/lib/wasm';

if (!isWasmSupported()) {
  console.warn('WASM not supported - using JS fallback');
}
// ✅ Operations still work via JavaScript
```

### Want to re-benchmark?

```typescript
import { resetPerformanceMetrics, runBenchmarks } from '@/lib/wasm';

resetPerformanceMetrics();
await runBenchmarks();
```

### Check which implementation is being used

```typescript
import { getPerformanceReport } from '@/lib/wasm';

const report = getPerformanceReport();
console.log('Hash using WASM:', report.operations.hash?.useWasm);
console.log('Encrypt using WASM:', report.operations.encrypt?.useWasm);
```

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- See `wasm-loader.ts` for WASM loading internals
- See `performance-bridge.ts` for benchmarking logic
