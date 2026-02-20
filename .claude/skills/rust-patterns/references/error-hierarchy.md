# Error Hierarchy Patterns

## Per-Crate Error Enums (thiserror)

Each crate has its own `error.rs` with typed error enums:

```rust
// crates/tallow-crypto/src/error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("key generation failed")]
    KeyGenFailed,
    #[error("encapsulation failed")]
    EncapsFailed,
    #[error("decapsulation failed")]
    DecapsFailed,
    #[error("encryption failed")]
    EncryptionFailed,
    #[error("decryption failed: authentication tag mismatch")]
    DecryptionFailed,
    #[error("key derivation failed")]
    KeyDerivationFailed,
    #[error("invalid shared secret")]
    InvalidSharedSecret,
    #[error("nonce space exhausted")]
    NonceExhausted,
}
```

## Rules
- Never include key/secret values in error messages
- Single "decryption failed" for all crypto failures (no oracle attacks)
- Use `anyhow` only in the binary crate's main.rs
- Each crate's errors convert via `From` impls for composition
