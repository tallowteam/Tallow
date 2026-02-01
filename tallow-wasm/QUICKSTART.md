# Tallow WASM Quick Start

Get up and running with high-performance cryptography in 5 minutes.

## Prerequisites

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Reload shell
source $HOME/.cargo/env
```

## Build & Test

```bash
cd tallow-wasm

# Install dependencies
make install

# Build WASM module
make build

# Run tests
make test

# Check output
ls -lh pkg/*.wasm
```

Expected output:
```
✓ Installation complete
✓ Production build complete
✓ Tests complete
pkg/tallow_wasm_bg.wasm: ~800 KB
```

## Quick Examples

### 1. Initialize WASM

```javascript
import init, * as wasm from './pkg/tallow_wasm.js';

await init();
console.log(wasm.version()); // "tallow-wasm v0.1.0"
```

### 2. Generate Keys (5ms)

```javascript
const keypair = wasm.hybrid_keypair();

console.log('ML-KEM Public:', keypair.mlkem_public_key.length); // 1184 bytes
console.log('X25519 Public:', keypair.x25519_public_key.length); // 32 bytes
```

### 3. Hybrid Key Exchange (15ms)

```javascript
// Bob generates keypair
const bob = wasm.hybrid_keypair();

// Alice encapsulates
const result = wasm.hybrid_encapsulate(
  bob.mlkem_public_key,
  bob.x25519_public_key,
  'session-context'
);

// Bob decapsulates
const sharedSecret = wasm.hybrid_decapsulate(
  bob.mlkem_secret_key,
  result.mlkemCiphertext,
  bob.x25519_secret_key,
  result.x25519Public,
  'session-context'
);

// Both have same 32-byte key
console.log('Keys match:',
  sharedSecret.every((v, i) => v === result.sessionKey[i])
); // true
```

### 4. Encrypt File (500+ MB/s)

```javascript
const key = wasm.aes_generate_key();
const file = new Uint8Array(await document.querySelector('input[type=file]').files[0].arrayBuffer());

const encrypted = wasm.aes_encrypt(key, file);
const decrypted = wasm.aes_decrypt(key, encrypted);

console.log('Match:', file.every((v, i) => v === decrypted[i])); // true
```

### 5. Hash Data (1+ GB/s)

```javascript
const data = new Uint8Array(1024 * 1024); // 1 MB
const hash = wasm.blake3_hash(data);

console.log('BLAKE3 Hash:', Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''));
```

### 6. Transfer Session

```javascript
const session = new wasm.TransferSession(
  wasm.aes_generate_key(),
  wasm.generate_session_id()
);

const chunk = new Uint8Array([1, 2, 3, 4]);
const encrypted = session.encrypt_chunk(chunk);
const decrypted = session.decrypt_chunk(encrypted);
```

## Integration with Tallow

### Step 1: Install

```bash
# From Tallow root directory
npm install ./tallow-wasm/pkg
```

### Step 2: Import

```typescript
// lib/crypto/wasm.ts
import init, * as wasm from 'tallow-wasm';

let initialized = false;

export async function initWasm() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export { wasm };
```

### Step 3: Use

```typescript
// components/FileTransfer.tsx
import { useEffect } from 'react';
import { initWasm, wasm } from '@/lib/crypto/wasm';

export function FileTransfer() {
  useEffect(() => {
    initWasm();
  }, []);

  async function encryptFile(file: File) {
    const key = wasm.aes_generate_key();
    const data = new Uint8Array(await file.arrayBuffer());
    return wasm.aes_encrypt(key, data);
  }

  // ...
}
```

## Performance Targets

| Operation | Target | Typical | Status |
|-----------|--------|---------|--------|
| ML-KEM Keygen | <10ms | ~5ms | ✓ |
| X25519 Keygen | <1ms | ~0.3ms | ✓ |
| AES-GCM | >500 MB/s | ~625 MB/s | ✓ |
| BLAKE3 | >1 GB/s | ~1250 MB/s | ✓ |

## Testing

```bash
# Unit tests
cargo test

# WASM tests
wasm-pack test --headless --firefox

# Benchmarks
cargo bench

# Integration test (browser)
python -m http.server 8000
# Open: http://localhost:8000/examples/complete_example.html
```

## Common Issues

### Issue: "Cannot find module 'tallow-wasm'"

**Solution:**
```bash
cd tallow-wasm
make build
cd ..
npm install ./tallow-wasm/pkg
```

### Issue: "WASM binary not found"

**Solution:**
```javascript
// Explicit path
await init('/path/to/tallow_wasm_bg.wasm');
```

### Issue: "Performance slower than expected"

**Solution:**
```bash
# Build with SIMD
RUSTFLAGS="-C target-feature=+simd128" make build
```

## Next Steps

- 📖 Read [README.md](./README.md) for full documentation
- 🔧 Check [INTEGRATION.md](./INTEGRATION.md) for integration guide
- 🚀 Review [PERFORMANCE.md](./PERFORMANCE.md) for optimization tips
- 🔒 See [SECURITY.md](./SECURITY.md) for security details
- 🧪 Run [complete_example.html](./examples/complete_example.html) for live demo

## Support

- **Issues**: https://github.com/tallow/tallow-wasm/issues
- **Docs**: https://docs.tallow.app/wasm
- **Email**: support@tallow.app

## Benchmark Your Setup

```bash
make bench

# Or in browser
await wasm.benchmark();
```

Expected results:
```json
{
  "mlkem_keygen_ms": 5.2,
  "x25519_keygen_ms": 0.3,
  "aes_gcm_throughput_mbps": 625,
  "blake3_throughput_mbps": 1250,
  "total_ms": 15.8
}
```

All targets met? You're ready! 🎉
