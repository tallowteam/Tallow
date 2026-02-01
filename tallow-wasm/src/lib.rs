//! Tallow WASM - High-performance cryptographic module
//!
//! This module provides post-quantum cryptography and high-speed encryption
//! for the Tallow secure file transfer application.
//!
//! # Features
//! - ML-KEM-768 post-quantum key encapsulation
//! - X25519 classic key exchange
//! - Hybrid ML-KEM + X25519 sessions
//! - AES-256-GCM streaming encryption (>500 MB/s)
//! - BLAKE3 parallel hashing (>1 GB/s)
//! - Argon2id password hashing
//! - Secure memory handling with zeroization

use wasm_bindgen::prelude::*;

mod crypto;
mod transfer;
mod utils;

// Re-export main interfaces
pub use crypto::*;
pub use transfer::*;
pub use utils::*;

/// Initialize the WASM module
/// Sets up panic hooks and logging for better debugging
#[wasm_bindgen(start)]
pub fn init() {
    // Set panic hook for better error messages
    console_error_panic_hook::set_once();
}

/// Get version information
#[wasm_bindgen]
pub fn version() -> String {
    format!(
        "tallow-wasm v{} (Rust {})",
        env!("CARGO_PKG_VERSION"),
        env!("CARGO_PKG_RUST_VERSION")
    )
}

/// Get capabilities of this WASM module
#[wasm_bindgen]
pub fn capabilities() -> JsValue {
    let caps = serde_json::json!({
        "mlkem768": true,
        "x25519": true,
        "hybrid": true,
        "aes256gcm": true,
        "chacha20poly1305": true,
        "blake3": true,
        "argon2id": true,
        "streaming": true,
        "parallel": true,
        "simd": cfg!(target_feature = "simd128"),
    });

    serde_wasm_bindgen::to_value(&caps).unwrap()
}

/// Benchmark the crypto operations
#[wasm_bindgen]
pub async fn benchmark() -> JsValue {
    let start = js_sys::Date::now();

    // ML-KEM keygen benchmark
    let mlkem_start = js_sys::Date::now();
    let _ = crypto::mlkem_keypair();
    let mlkem_time = js_sys::Date::now() - mlkem_start;

    // X25519 keygen benchmark
    let x25519_start = js_sys::Date::now();
    let _ = crypto::x25519_keypair();
    let x25519_time = js_sys::Date::now() - x25519_start;

    // BLAKE3 benchmark (1 MB)
    let data = vec![0u8; 1024 * 1024];
    let blake3_start = js_sys::Date::now();
    let _ = crypto::blake3_hash(&data);
    let blake3_time = js_sys::Date::now() - blake3_start;
    let blake3_throughput = 1.0 / (blake3_time / 1000.0); // MB/s

    // AES-GCM benchmark (1 MB)
    let key = vec![0u8; 32];
    let aes_start = js_sys::Date::now();
    let _ = crypto::aes_encrypt(&key, &data).unwrap();
    let aes_time = js_sys::Date::now() - aes_start;
    let aes_throughput = 1.0 / (aes_time / 1000.0); // MB/s

    let total_time = js_sys::Date::now() - start;

    let results = serde_json::json!({
        "mlkem_keygen_ms": mlkem_time,
        "x25519_keygen_ms": x25519_time,
        "blake3_1mb_ms": blake3_time,
        "blake3_throughput_mbps": blake3_throughput,
        "aes_gcm_1mb_ms": aes_time,
        "aes_gcm_throughput_mbps": aes_throughput,
        "total_ms": total_time,
    });

    serde_wasm_bindgen::to_value(&results).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        let v = version();
        assert!(v.contains("tallow-wasm"));
    }
}
