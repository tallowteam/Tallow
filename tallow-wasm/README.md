# Tallow WASM

High-performance cryptographic WASM module for Tallow secure file transfer.

## Features

### Post-Quantum Cryptography
- **ML-KEM-768** (Kyber768) - NIST standardized post-quantum KEM
- **X25519** - Classic elliptic curve Diffie-Hellman
- **Hybrid Mode** - Combined ML-KEM + X25519 for maximum security

### Encryption
- **AES-256-GCM** - Authenticated encryption with >500 MB/s throughput
- **ChaCha20-Poly1305** - Alternative AEAD cipher
- **Streaming** - Memory-efficient encryption for large files

### Hashing
- **BLAKE3** - Parallel hashing with >1 GB/s throughput
- **Argon2id** - Memory-hard password hashing

### Transfer Features
- **Fast Chunking** - Efficient file splitting for parallel processing
- **Merkle Trees** - Integrity verification for file chunks
- **Encrypted Sessions** - End-to-end encrypted transfer sessions

## Installation

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Or use make
make install
```

## Building

### Development Build
```bash
make dev
```

### Production Build
```bash
make build
```

### Optimized Build (with SIMD)
```bash
make optimize
```

### All Targets
```bash
make build          # Web (default)
make build-node     # Node.js
make build-bundler  # Webpack/Rollup
```

## Usage

### JavaScript/TypeScript

```javascript
import init, {
  mlkem_keypair,
  hybrid_keypair,
  hybrid_encapsulate,
  hybrid_decapsulate,
  TransferSession,
  blake3_hash,
  argon2_hash_password,
} from './pkg/tallow_wasm.js';

// Initialize WASM module
await init();

// ML-KEM-768 Key Generation (<10ms)
const mlkem = mlkem_keypair();
console.log('ML-KEM Public:', mlkem.public_key);

// Hybrid Key Exchange
const responder = hybrid_keypair();
const initiator_result = hybrid_encapsulate(
  responder.mlkem_public_key,
  responder.x25519_public_key,
  "my-context"
);

const session_key = hybrid_decapsulate(
  responder.mlkem_secret_key,
  initiator_result.mlkemCiphertext,
  responder.x25519_secret_key,
  initiator_result.x25519Public,
  "my-context"
);

// Transfer Session
const session = new TransferSession(session_key, "session-123");

const plaintext = new Uint8Array([1, 2, 3, 4]);
const encrypted = session.encrypt_chunk(plaintext);
const decrypted = session.decrypt_chunk(encrypted);

// BLAKE3 Hashing (>1 GB/s)
const data = new Uint8Array(1024 * 1024); // 1 MB
const hash = blake3_hash(data);

// Argon2 Password Hashing
const password = "my-secure-password";
const hash_str = argon2_hash_password(password);
```

## Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| ML-KEM Keygen | <10ms | ~5ms |
| X25519 Keygen | <1ms | ~0.3ms |
| AES-256-GCM | >500 MB/s | ~600 MB/s |
| BLAKE3 | >1 GB/s | ~1.2 GB/s |
| Argon2id | ~100ms | ~150ms |

## Testing

```bash
# Run all tests
make test

# Run benchmarks
make bench

# Check code quality
make check
```

## Integration with Tallow

### 1. Install Package

```bash
npm install ./tallow-wasm/pkg
```

### 2. Import in TypeScript

```typescript
import init, * as wasm from 'tallow-wasm';

// Initialize once at app startup
await init();

// Use in crypto operations
export class PQCrypto {
  async generateKeypair() {
    return wasm.hybrid_keypair();
  }

  async encryptFile(file: Uint8Array, sessionKey: Uint8Array) {
    const session = new wasm.TransferSession(sessionKey, 'file-transfer');
    return session.encrypt_chunk(file);
  }
}
```

### 3. Replace Existing Crypto

The WASM module can replace existing crypto implementations in:
- `lib/crypto/pqc-crypto.ts` - Use `hybrid_keypair()`, `hybrid_encapsulate()`
- `lib/crypto/file-encryption.ts` - Use `TransferSession` for streaming
- `lib/crypto/key-management.ts` - Use `blake3_derive_key()`

## Architecture

```
tallow-wasm/
├── src/
│   ├── lib.rs           # Main WASM entry, exports all functions
│   ├── crypto/          # Cryptographic primitives
│   │   ├── mlkem.rs     # ML-KEM-768 implementation
│   │   ├── x25519.rs    # X25519 ECDH
│   │   ├── hybrid.rs    # Hybrid key exchange
│   │   ├── aes_gcm.rs   # AES-256-GCM encryption
│   │   ├── blake3.rs    # BLAKE3 hashing
│   │   └── argon2.rs    # Argon2id password hashing
│   ├── transfer/        # Transfer operations
│   │   ├── chunker.rs   # File chunking
│   │   ├── hasher.rs    # Chunk hashing & Merkle trees
│   │   └── session.rs   # Encrypted transfer sessions
│   └── utils/           # Utilities
│       └── memory.rs    # Secure memory handling
├── tests/               # Integration tests
├── benches/             # Performance benchmarks
└── pkg/                 # Generated WASM output
```

## Security

### Memory Safety
- All sensitive data is zeroized after use
- Constant-time operations for sensitive comparisons
- No unsafe code in crypto operations

### Cryptographic Guarantees
- **ML-KEM-768**: IND-CCA2 secure post-quantum KEM
- **X25519**: Standard ECDH with clamping
- **Hybrid**: Security if either algorithm is secure
- **AES-GCM**: NIST approved AEAD cipher
- **BLAKE3**: Collision-resistant hash function

## Benchmarking

```bash
# Run criterion benchmarks
make bench

# Profile WASM
make profile
```

## Size Optimization

```bash
# Check WASM binary size
make size

# Output:
# pkg/tallow_wasm_bg.wasm: ~800 KB (optimized)
```

## Browser Compatibility

- Chrome/Edge: ✅ (v89+)
- Firefox: ✅ (v92+)
- Safari: ✅ (v16+)
- Node.js: ✅ (v16+)

Requires WebAssembly support with:
- SIMD (optional, for better performance)
- Bulk memory operations

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `make test`
4. Run checks: `make check`
5. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: https://github.com/tallow/tallow-wasm
- Documentation: https://docs.tallow.app/wasm
