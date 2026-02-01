//! Secure memory handling utilities
//!
//! Provides memory zeroing and secure cleanup

use wasm_bindgen::prelude::*;
use zeroize::Zeroize;

/// Securely zero memory
///
/// Ensures the compiler doesn't optimize away the zeroing
#[wasm_bindgen]
pub fn secure_zero(data: &mut [u8]) {
    data.zeroize();
}

/// Create a zeroed buffer
#[wasm_bindgen]
pub fn create_zeroed_buffer(size: usize) -> Vec<u8> {
    vec![0u8; size]
}

/// Check if buffer is all zeros
#[wasm_bindgen]
pub fn is_zeroed(data: &[u8]) -> bool {
    data.iter().all(|&b| b == 0)
}

/// Constant-time memory comparison
///
/// Prevents timing attacks by ensuring comparison takes the same time
/// regardless of where the difference occurs
#[wasm_bindgen]
pub fn constant_time_compare(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }

    use subtle::ConstantTimeEq;
    a.ct_eq(b).into()
}

/// Get current memory usage (if available)
#[wasm_bindgen]
pub fn memory_usage() -> JsValue {
    let memory = wasm_bindgen::memory();

    let info = serde_json::json!({
        "available": true,
        "buffer": memory.buffer().byte_length(),
    });

    serde_wasm_bindgen::to_value(&info).unwrap()
}

/// Secure random bytes generation
#[wasm_bindgen]
pub fn secure_random_bytes(length: usize) -> Vec<u8> {
    use rand::Rng;
    let mut bytes = vec![0u8; length];
    rand::thread_rng().fill(&mut bytes[..]);
    bytes
}

/// Generate a random session ID
#[wasm_bindgen]
pub fn generate_session_id() -> String {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const LENGTH: usize = 32;

    let mut rng = rand::thread_rng();
    let id: String = (0..LENGTH)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();

    id
}

/// Timing-safe string comparison
#[wasm_bindgen]
pub fn constant_time_string_compare(a: &str, b: &str) -> bool {
    constant_time_compare(a.as_bytes(), b.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_secure_zero() {
        let mut data = vec![1, 2, 3, 4, 5];
        secure_zero(&mut data);
        assert!(is_zeroed(&data));
    }

    #[test]
    fn test_constant_time_compare() {
        let a = b"hello";
        let b = b"hello";
        let c = b"world";

        assert!(constant_time_compare(a, b));
        assert!(!constant_time_compare(a, c));
        assert!(!constant_time_compare(a, &[]));
    }

    #[test]
    fn test_secure_random_bytes() {
        let bytes1 = secure_random_bytes(32);
        let bytes2 = secure_random_bytes(32);

        assert_eq!(bytes1.len(), 32);
        assert_eq!(bytes2.len(), 32);
        assert_ne!(bytes1, bytes2); // Should be different
    }

    #[test]
    fn test_generate_session_id() {
        let id1 = generate_session_id();
        let id2 = generate_session_id();

        assert_eq!(id1.len(), 32);
        assert_eq!(id2.len(), 32);
        assert_ne!(id1, id2);

        // Should only contain alphanumeric characters
        assert!(id1.chars().all(|c| c.is_alphanumeric()));
    }
}
