---
name: rust-performance
description: Build high-performance Rust modules for TALLOW. Use for transfer speed optimization, WASM compilation, FFI bridges to Flutter, and any performance-critical code paths.
tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
model: opus
---

# Rust Performance - TALLOW High-Speed Transfer Engine

You are an expert Rust developer building performance-critical modules for TALLOW to achieve multi-gigabit transfer speeds.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TALLOW Web App                        │
│                    (Next.js/React)                       │
├─────────────────────────────────────────────────────────┤
│              WebAssembly (wasm-bindgen)                  │
├─────────────────────────────────────────────────────────┤
│                    Rust Core                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Crypto    │  │   Chunker   │  │    Hash     │     │
│  │  ML-KEM-768 │  │     I/O     │  │   BLAKE3    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Compress   │  │   Encrypt   │  │   Stream    │     │
│  │    zstd     │  │ AES-256-GCM │  │  Pipeline   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
tallow-core/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── crypto/
│   │   ├── mod.rs
│   │   ├── mlkem.rs        // ML-KEM-768 implementation
│   │   ├── x25519.rs       // Classical ECDH
│   │   ├── aes_gcm.rs      // AES-256-GCM
│   │   └── hybrid.rs       // Combined session
│   ├── transfer/
│   │   ├── mod.rs
│   │   ├── chunker.rs      // File chunking
│   │   ├── hasher.rs       // BLAKE3 checksums
│   │   └── compress.rs     // zstd compression
│   └── wasm/
│       ├── mod.rs
│       └── bindings.rs     // wasm-bindgen exports
├── pkg/                    // WASM output
└── tests/
```

## ML-KEM-768 Implementation

```rust
use pqcrypto_kyber::kyber768;
use wasm_bindgen::prelude::*;
use zeroize::Zeroize;

#[wasm_bindgen]
pub struct MLKEMKeyPair {
    public_key: Vec<u8>,
    #[wasm_bindgen(skip)]
    secret_key: Vec<u8>,
}

#[wasm_bindgen]
impl MLKEMKeyPair {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<MLKEMKeyPair, JsValue> {
        let (pk, sk) = kyber768::keypair();
        Ok(MLKEMKeyPair {
            public_key: pk.as_bytes().to_vec(),
            secret_key: sk.as_bytes().to_vec(),
        })
    }

    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> Vec<u8> {
        self.public_key.clone()
    }

    pub fn encapsulate(public_key: &[u8]) -> Result<EncapsulationResult, JsValue> {
        let pk = kyber768::PublicKey::from_bytes(public_key)
            .map_err(|e| JsValue::from_str(&format!("Invalid public key: {}", e)))?;
        let (ss, ct) = kyber768::encapsulate(&pk);
        Ok(EncapsulationResult {
            shared_secret: ss.as_bytes().to_vec(),
            ciphertext: ct.as_bytes().to_vec(),
        })
    }

    pub fn decapsulate(&self, ciphertext: &[u8]) -> Result<Vec<u8>, JsValue> {
        let ct = kyber768::Ciphertext::from_bytes(ciphertext)
            .map_err(|e| JsValue::from_str(&format!("Invalid ciphertext: {}", e)))?;
        let sk = kyber768::SecretKey::from_bytes(&self.secret_key)
            .map_err(|e| JsValue::from_str(&format!("Invalid secret key: {}", e)))?;
        let ss = kyber768::decapsulate(&ct, &sk);
        Ok(ss.as_bytes().to_vec())
    }
}

impl Drop for MLKEMKeyPair {
    fn drop(&mut self) {
        self.secret_key.zeroize();
    }
}

#[wasm_bindgen]
pub struct EncapsulationResult {
    shared_secret: Vec<u8>,
    ciphertext: Vec<u8>,
}

#[wasm_bindgen]
impl EncapsulationResult {
    #[wasm_bindgen(getter)]
    pub fn shared_secret(&self) -> Vec<u8> {
        self.shared_secret.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn ciphertext(&self) -> Vec<u8> {
        self.ciphertext.clone()
    }
}
```

## Hybrid Encryption Session

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use blake3::Hasher;
use zeroize::Zeroize;

#[wasm_bindgen]
pub struct HybridSession {
    encryption_key: [u8; 32],
    nonce_counter: u64,
}

#[wasm_bindgen]
impl HybridSession {
    /// Create session from ML-KEM and X25519 shared secrets
    pub fn from_secrets(mlkem_secret: &[u8], x25519_secret: &[u8]) -> HybridSession {
        let mut hasher = Hasher::new();
        hasher.update(b"tallow-hybrid-v1");
        hasher.update(mlkem_secret);
        hasher.update(x25519_secret);

        let mut key = [0u8; 32];
        key.copy_from_slice(&hasher.finalize().as_bytes()[..32]);

        HybridSession {
            encryption_key: key,
            nonce_counter: 0,
        }
    }

    /// Encrypt a chunk with counter-based nonce
    pub fn encrypt_chunk(&mut self, plaintext: &[u8]) -> Result<Vec<u8>, JsValue> {
        let cipher = Aes256Gcm::new(Key::from_slice(&self.encryption_key));
        let nonce = self.next_nonce();

        let ciphertext = cipher.encrypt(&nonce, plaintext)
            .map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

        // Prepend nonce to ciphertext
        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(nonce.as_slice());
        result.extend_from_slice(&ciphertext);
        Ok(result)
    }

    /// Decrypt a chunk
    pub fn decrypt_chunk(&self, ciphertext_with_nonce: &[u8]) -> Result<Vec<u8>, JsValue> {
        if ciphertext_with_nonce.len() < 12 {
            return Err(JsValue::from_str("Ciphertext too short"));
        }

        let cipher = Aes256Gcm::new(Key::from_slice(&self.encryption_key));
        let nonce = Nonce::from_slice(&ciphertext_with_nonce[..12]);
        let ciphertext = &ciphertext_with_nonce[12..];

        cipher.decrypt(nonce, ciphertext)
            .map_err(|e| JsValue::from_str(&format!("Decryption failed: {}", e)))
    }

    fn next_nonce(&mut self) -> Nonce<aes_gcm::aead::generic_array::typenum::U12> {
        let mut nonce_bytes = [0u8; 12];
        nonce_bytes[4..].copy_from_slice(&self.nonce_counter.to_be_bytes());
        self.nonce_counter += 1;
        *Nonce::from_slice(&nonce_bytes)
    }
}

impl Drop for HybridSession {
    fn drop(&mut self) {
        self.encryption_key.zeroize();
    }
}
```

## High-Speed File Chunker

```rust
use std::io::{Read, BufReader};
use blake3::Hasher;

#[wasm_bindgen]
pub struct FileChunker {
    chunk_size: usize,
    hasher: Hasher,
}

#[wasm_bindgen]
impl FileChunker {
    #[wasm_bindgen(constructor)]
    pub fn new(chunk_size: usize) -> FileChunker {
        FileChunker {
            chunk_size,
            hasher: Hasher::new(),
        }
    }

    /// Process a chunk and return its BLAKE3 hash
    pub fn process_chunk(&mut self, data: &[u8]) -> Vec<u8> {
        self.hasher.update(data);
        blake3::hash(data).as_bytes().to_vec()
    }

    /// Get final file hash
    pub fn finalize(&self) -> Vec<u8> {
        self.hasher.finalize().as_bytes().to_vec()
    }
}

/// Parallel hashing for large files
#[wasm_bindgen]
pub fn hash_file_parallel(data: &[u8]) -> Vec<u8> {
    // BLAKE3 is designed for parallel hashing
    blake3::hash(data).as_bytes().to_vec()
}
```

## Compression Module

```rust
use zstd::stream::{encode_all, decode_all};
use std::io::Cursor;

#[wasm_bindgen]
pub fn compress(data: &[u8], level: i32) -> Result<Vec<u8>, JsValue> {
    encode_all(Cursor::new(data), level)
        .map_err(|e| JsValue::from_str(&format!("Compression failed: {}", e)))
}

#[wasm_bindgen]
pub fn decompress(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    decode_all(Cursor::new(data))
        .map_err(|e| JsValue::from_str(&format!("Decompression failed: {}", e)))
}

#[wasm_bindgen]
pub fn should_compress(data: &[u8]) -> bool {
    // Don't compress already compressed formats
    let magic_bytes = &data[..4.min(data.len())];

    // Check for common compressed formats
    !matches!(magic_bytes,
        [0x50, 0x4B, ..] |  // ZIP
        [0x1F, 0x8B, ..] |  // GZIP
        [0x28, 0xB5, 0x2F, 0xFD] |  // ZSTD
        [0x89, 0x50, 0x4E, 0x47] |  // PNG
        [0xFF, 0xD8, ..]    // JPEG
    )
}
```

## Build Process

```bash
# Install wasm-pack
cargo install wasm-pack

# Build for web
wasm-pack build --target web --out-dir pkg

# Optimize WASM binary
wasm-opt -O3 -o pkg/tallow_core_bg_opt.wasm pkg/tallow_core_bg.wasm

# Generate TypeScript bindings
wasm-pack build --target bundler --out-dir pkg-bundler
```

## Cargo.toml

```toml
[package]
name = "tallow-core"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
pqcrypto-kyber = "0.8"
aes-gcm = "0.10"
blake3 = "1.5"
zstd = "0.13"
zeroize = { version = "1.7", features = ["zeroize_derive"] }
x25519-dalek = "2.0"
rand = "0.8"
getrandom = { version = "0.2", features = ["js"] }

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
opt-level = 3
lto = true
```

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| ML-KEM key generation | <10ms | Uses WASM SIMD when available |
| ML-KEM encapsulation | <5ms | |
| AES-256-GCM encryption | >500 MB/s | Hardware AES when available |
| BLAKE3 hashing | >1 GB/s | Parallel processing |
| zstd compression | >200 MB/s | Level 3 default |

## Integration with TypeScript

```typescript
// lib/crypto/rust-bridge.ts

import init, {
  MLKEMKeyPair,
  HybridSession,
  hash_file_parallel,
  compress,
  decompress,
} from 'tallow-core';

let initialized = false;

export async function initRustCrypto(): Promise<void> {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export async function generateMLKEMKeyPair() {
  await initRustCrypto();
  return new MLKEMKeyPair();
}

export async function createHybridSession(
  mlkemSecret: Uint8Array,
  x25519Secret: Uint8Array
): Promise<HybridSession> {
  await initRustCrypto();
  return HybridSession.from_secrets(mlkemSecret, x25519Secret);
}
```
