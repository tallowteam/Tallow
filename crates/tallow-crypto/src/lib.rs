//! # Tallow Cryptography Library
//!
//! This crate provides all cryptographic primitives for the Tallow secure file transfer system,
//! including post-quantum cryptography, symmetric encryption, key derivation, and ratcheting protocols.
//!
//! ## Features
//!
//! - **Post-Quantum Security**: ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+)
//! - **Hybrid Cryptography**: Combines classical and PQ algorithms for defense-in-depth
//! - **Memory Safety**: Automatic zeroization of sensitive data
//! - **Constant-Time Operations**: Protection against timing side-channels
//! - **Domain Separation**: Cryptographic domain separation for all use cases

#![warn(missing_docs)]
#![forbid(unsafe_code)]

pub mod error;
pub mod file;
pub mod hash;
pub mod kdf;
pub mod kem;
pub mod keys;
pub mod mem;
pub mod pake;
pub mod ratchet;
pub mod sig;
pub mod symmetric;

// Re-export commonly used types
pub use error::{CryptoError, Result};
pub use hash::{blake3, domain};
pub use symmetric::CipherSuite;

/// Library version constant
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Initialize the cryptography library (e.g., prevent core dumps, lock memory)
///
/// This should be called once at application startup for maximum security.
pub fn init() -> Result<()> {
    mem::wipe::prevent_core_dumps()?;
    Ok(())
}
