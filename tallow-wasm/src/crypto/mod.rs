//! Cryptographic primitives module
//!
//! Provides high-performance implementations of:
//! - ML-KEM-768 (post-quantum KEM)
//! - X25519 (classic ECDH)
//! - Hybrid key exchange
//! - AES-256-GCM encryption
//! - BLAKE3 hashing
//! - Argon2id password hashing

pub mod aes_gcm;
pub mod argon2;
pub mod blake3;
pub mod hybrid;
pub mod mlkem;
pub mod x25519;

// Re-export commonly used functions
pub use aes_gcm::*;
pub use argon2::*;
pub use blake3::*;
pub use hybrid::*;
pub use mlkem::*;
pub use x25519::*;

use thiserror::Error;

/// Cryptographic errors
#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Invalid key length: expected {expected}, got {got}")]
    InvalidKeyLength { expected: usize, got: usize },

    #[error("Invalid nonce length: expected {expected}, got {got}")]
    InvalidNonceLength { expected: usize, got: usize },

    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),

    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("WASM conversion error: {0}")]
    WasmError(String),
}

impl From<CryptoError> for wasm_bindgen::JsValue {
    fn from(err: CryptoError) -> Self {
        wasm_bindgen::JsValue::from_str(&err.to_string())
    }
}

/// Result type for cryptographic operations
pub type CryptoResult<T> = Result<T, CryptoError>;
