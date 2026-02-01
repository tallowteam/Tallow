# Tallow WASM - Quick Reference Card

One-page reference for the most common operations.

## Build & Install

```bash
cd tallow-wasm && make build    # Build WASM
npm install ./tallow-wasm/pkg   # Install
```

## Initialize

```javascript
import init, * as wasm from 'tallow-wasm';
await init();
```

## Key Operations

### Generate Keys (5ms)
```javascript
const keys = wasm.hybrid_keypair();
// { mlkem_public_key, mlkem_secret_key, x25519_public_key, x25519_secret_key }
```

### Key Exchange (15ms)
```javascript
// Bob's side
const bob = wasm.hybrid_keypair();

// Alice's side
const result = wasm.hybrid_encapsulate(
  bob.mlkem_public_key,
  bob.x25519_public_key,
  'context'
);
// { sessionKey, mlkemCiphertext, x25519Public }

// Bob decapsulates
const key = wasm.hybrid_decapsulate(
  bob.mlkem_secret_key,
  result.mlkemCiphertext,
  bob.x25519_secret_key,
  result.x25519Public,
  'context'
);
```

## Encryption

### Simple (625 MB/s)
```javascript
const key = wasm.aes_generate_key();
const encrypted = wasm.aes_encrypt(key, plaintext);
const decrypted = wasm.aes_decrypt(key, encrypted);
```

### Streaming
```javascript
const cipher = new wasm.AesGcmCipher(key);
const ct1 = cipher.encrypt(chunk1);
const ct2 = cipher.encrypt(chunk2);
// Nonces auto-managed
```

### Transfer Session
```javascript
const session = new wasm.TransferSession(key, sessionId);
const encrypted = session.encrypt_chunk(data);
const decrypted = session.decrypt_chunk(encrypted);
```

## Hashing

### Quick Hash (1250 MB/s)
```javascript
const hash = wasm.blake3_hash(data);
const hex = wasm.blake3_hash_hex(data);
```

### Streaming
```javascript
const hasher = new wasm.Blake3Hasher();
hasher.update(chunk1);
hasher.update(chunk2);
const hash = hasher.finalize();
```

### Keyed (MAC)
```javascript
const key = wasm.blake3_generate_key();
const mac = wasm.blake3_keyed_hash(key, data);
```

## Passwords

```javascript
// Hash
const hash = wasm.argon2_hash_password('password');

// Verify
const valid = wasm.argon2_verify_password('password', hash);

// Derive key
const salt = wasm.argon2_generate_salt();
const key = wasm.argon2_derive_key('password', salt, 32);
```

## File Chunking

```javascript
const chunker = new wasm.FileChunker(file.size, 1024 * 1024);
const totalChunks = chunker.total_chunks;

for (let i = 0; i < totalChunks; i++) {
  const offset = chunker.chunk_offset(i);
  const length = chunker.chunk_length(i);
  const chunk = file.slice(offset, offset + length);
  // Process chunk...
}
```

## Constants

```javascript
wasm.mlkem_constants()    // ML-KEM sizes
wasm.x25519_constants()   // X25519 sizes
wasm.hybrid_constants()   // Hybrid sizes
```

## Utilities

```javascript
wasm.generate_session_id()              // Random 32-char ID
wasm.secure_random_bytes(32)            // Secure random
wasm.constant_time_compare(a, b)        // Timing-safe compare
wasm.secure_zero(buffer)                // Zero memory
```

## Error Handling

```javascript
try {
  const encrypted = wasm.aes_encrypt(key, plaintext);
} catch (error) {
  console.error('Encryption failed:', error);
}
```

## Performance Tips

```bash
# Build with SIMD
RUSTFLAGS="-C target-feature=+simd128" make build
```

```javascript
// Use optimal chunk size
const size = wasm.calculate_optimal_chunk_size(file.size);

// Batch operations
const encrypted = wasm.encrypt_chunks_batch(key, chunks);

// Reuse sessions
const session = new wasm.TransferSession(key, id);
// Use for multiple files
```

## Benchmarks

```javascript
const results = await wasm.benchmark();
console.table(results);
// {
//   mlkem_keygen_ms: 5.2,
//   x25519_keygen_ms: 0.3,
//   aes_gcm_throughput_mbps: 625,
//   blake3_throughput_mbps: 1250,
//   total_ms: 15.8
// }
```

## TypeScript

```typescript
import * as wasm from 'tallow-wasm';

// Types are auto-generated
const keys: wasm.HybridKeyPair = wasm.hybrid_keypair();
const session: wasm.TransferSession = new wasm.TransferSession(key, id);
```

## Common Patterns

### Complete File Transfer
```javascript
// Generate keys
const alice = wasm.hybrid_keypair();
const bob = wasm.hybrid_keypair();

// Key exchange
const result = wasm.hybrid_encapsulate(
  bob.mlkem_public_key,
  bob.x25519_public_key,
  'transfer-123'
);

// Create session
const session = new wasm.TransferSession(
  result.sessionKey,
  'transfer-123'
);

// Chunk and encrypt file
const chunker = new wasm.FileChunker(file.size);
for (let i = 0; i < chunker.total_chunks; i++) {
  const chunk = await readChunk(file, i, chunker);
  const encrypted = session.encrypt_chunk_with_metadata(chunk, i);
  await sendChunk(encrypted);
}
```

### Verify Integrity
```javascript
// Generate chunk hashes
const hashes = wasm.generate_chunk_hashes(chunks);

// Create Merkle root
const root = wasm.merkle_root(hashes);

// Verify chunk
const valid = wasm.verify_chunk_hash(chunk, expectedHash);
```

## Documentation

- `README.md` - Complete API reference
- `QUICKSTART.md` - Getting started
- `INTEGRATION.md` - Integration guide
- `PERFORMANCE.md` - Optimization
- `SECURITY.md` - Security details
- `examples/complete_example.html` - Live demo

## Support

```bash
make test       # Run tests
make bench      # Benchmarks
make check      # Code quality
make size       # Binary size
make help       # All commands
```

---

**Quick Start:** `cd tallow-wasm && make build && npm install ./tallow-wasm/pkg`
