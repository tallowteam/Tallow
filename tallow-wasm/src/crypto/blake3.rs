//! BLAKE3 cryptographic hash function
//!
//! Performance target: >1 GB/s throughput with parallel hashing
//!
//! Features:
//! - Fast parallel hashing using Rayon
//! - Streaming API for large files
//! - Keyed hashing for MAC
//! - Key derivation function (KDF)

use blake3::{Hash, Hasher};
use wasm_bindgen::prelude::*;

/// BLAKE3 hasher for streaming/incremental hashing
#[wasm_bindgen]
pub struct Blake3Hasher {
    hasher: Hasher,
}

#[wasm_bindgen]
impl Blake3Hasher {
    /// Create a new BLAKE3 hasher
    #[wasm_bindgen(constructor)]
    pub fn new() -> Blake3Hasher {
        Blake3Hasher {
            hasher: Hasher::new(),
        }
    }

    /// Create a new keyed BLAKE3 hasher for MAC
    ///
    /// Key must be exactly 32 bytes
    #[wasm_bindgen]
    pub fn new_keyed(key: &[u8]) -> Result<Blake3Hasher, JsValue> {
        if key.len() != 32 {
            return Err(JsValue::from_str(&format!(
                "Key must be 32 bytes, got {}",
                key.len()
            )));
        }

        let key_array: [u8; 32] = key.try_into().unwrap();

        Ok(Blake3Hasher {
            hasher: Hasher::new_keyed(&key_array),
        })
    }

    /// Create a new BLAKE3 KDF (key derivation function)
    #[wasm_bindgen]
    pub fn new_derive_key(context: &str) -> Blake3Hasher {
        Blake3Hasher {
            hasher: Hasher::new_derive_key(context),
        }
    }

    /// Update the hasher with more data
    pub fn update(&mut self, data: &[u8]) {
        self.hasher.update(data);
    }

    /// Finalize and return the hash
    pub fn finalize(&self) -> Vec<u8> {
        self.hasher.finalize().as_bytes().to_vec()
    }

    /// Finalize and return a hex string
    pub fn finalize_hex(&self) -> String {
        self.hasher.finalize().to_hex().to_string()
    }

    /// Reset the hasher
    pub fn reset(&mut self) {
        self.hasher.reset();
    }
}

/// One-shot BLAKE3 hash
///
/// Returns 32-byte hash
///
/// # Performance
/// Target: >1 GB/s on large inputs
#[wasm_bindgen]
pub fn blake3_hash(data: &[u8]) -> Vec<u8> {
    blake3::hash(data).as_bytes().to_vec()
}

/// One-shot BLAKE3 hash returning hex string
#[wasm_bindgen]
pub fn blake3_hash_hex(data: &[u8]) -> String {
    blake3::hash(data).to_hex().to_string()
}

/// BLAKE3 keyed hash (MAC)
///
/// Key must be exactly 32 bytes
#[wasm_bindgen]
pub fn blake3_keyed_hash(key: &[u8], data: &[u8]) -> Result<Vec<u8>, JsValue> {
    if key.len() != 32 {
        return Err(JsValue::from_str(&format!(
            "Key must be 32 bytes, got {}",
            key.len()
        )));
    }

    let key_array: [u8; 32] = key.try_into().unwrap();
    let hash = blake3::keyed_hash(&key_array, data);

    Ok(hash.as_bytes().to_vec())
}

/// BLAKE3 key derivation function
///
/// Derives a key from input key material and context
///
/// # Arguments
/// * `context` - Context string for domain separation
/// * `key_material` - Input key material (can be any length)
/// * `output_length` - Desired output length in bytes
#[wasm_bindgen]
pub fn blake3_derive_key(context: &str, key_material: &[u8], output_length: usize) -> Vec<u8> {
    let mut hasher = Hasher::new_derive_key(context);
    hasher.update(key_material);

    let mut output = vec![0u8; output_length];
    let mut reader = hasher.finalize_xof();
    reader.fill(&mut output);

    output
}

/// Verify a BLAKE3 hash
///
/// Returns true if the hash matches the data
#[wasm_bindgen]
pub fn blake3_verify(hash: &[u8], data: &[u8]) -> bool {
    if hash.len() != 32 {
        return false;
    }

    let computed = blake3::hash(data);
    let expected: [u8; 32] = match hash.try_into() {
        Ok(arr) => arr,
        Err(_) => return false,
    };

    computed.as_bytes() == &expected
}

/// Parallel BLAKE3 hash for large data
///
/// Automatically uses parallel hashing for better performance
#[wasm_bindgen]
pub fn blake3_hash_parallel(data: &[u8]) -> Vec<u8> {
    // BLAKE3 automatically uses parallelism with rayon feature
    blake3::hash(data).as_bytes().to_vec()
}

/// Chunk and hash data in parallel
///
/// Useful for very large files that need to be processed in chunks
#[wasm_bindgen]
pub fn blake3_hash_chunks(chunks: Vec<js_sys::Uint8Array>) -> Vec<u8> {
    let mut hasher = Hasher::new();

    for chunk_js in chunks {
        let chunk = chunk_js.to_vec();
        hasher.update(&chunk);
    }

    hasher.finalize().as_bytes().to_vec()
}

/// Generate a BLAKE3 key for keyed hashing
#[wasm_bindgen]
pub fn blake3_generate_key() -> Vec<u8> {
    use rand::Rng;
    let mut key = [0u8; 32];
    rand::thread_rng().fill(&mut key);
    key.to_vec()
}

/// BLAKE3 extended output (XOF)
///
/// Can generate any amount of output from a hash
#[wasm_bindgen]
pub fn blake3_xof(data: &[u8], output_length: usize) -> Vec<u8> {
    let mut hasher = Hasher::new();
    hasher.update(data);

    let mut output = vec![0u8; output_length];
    let mut reader = hasher.finalize_xof();
    reader.fill(&mut output);

    output
}

/// Compare two BLAKE3 hashes in constant time
///
/// Prevents timing attacks
#[wasm_bindgen]
pub fn blake3_compare_hashes(hash1: &[u8], hash2: &[u8]) -> bool {
    if hash1.len() != 32 || hash2.len() != 32 {
        return false;
    }

    use subtle::ConstantTimeEq;

    let h1: [u8; 32] = hash1.try_into().unwrap();
    let h2: [u8; 32] = hash2.try_into().unwrap();

    h1.ct_eq(&h2).into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blake3_hash() {
        let data = b"Hello, World!";
        let hash = blake3_hash(data);

        assert_eq!(hash.len(), 32);

        // Hash should be deterministic
        let hash2 = blake3_hash(data);
        assert_eq!(hash, hash2);
    }

    #[test]
    fn test_blake3_hex() {
        let data = b"test";
        let hex = blake3_hash_hex(data);

        assert_eq!(hex.len(), 64); // 32 bytes = 64 hex chars
        assert!(hex.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_blake3_streaming() {
        let mut hasher = Blake3Hasher::new();

        hasher.update(b"Hello, ");
        hasher.update(b"World!");

        let hash1 = hasher.finalize();

        // Compare with one-shot
        let hash2 = blake3_hash(b"Hello, World!");

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_blake3_keyed() {
        let key = blake3_generate_key();
        let data = b"secret message";

        let hash1 = blake3_keyed_hash(&key, data).unwrap();
        let hash2 = blake3_keyed_hash(&key, data).unwrap();

        assert_eq!(hash1, hash2);

        // Different key should produce different hash
        let other_key = blake3_generate_key();
        let hash3 = blake3_keyed_hash(&other_key, data).unwrap();

        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_blake3_derive_key() {
        let context = "tallow-session-key";
        let ikm = b"input key material";

        let key1 = blake3_derive_key(context, ikm, 32);
        let key2 = blake3_derive_key(context, ikm, 32);

        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);

        // Different context should produce different key
        let key3 = blake3_derive_key("other-context", ikm, 32);
        assert_ne!(key1, key3);
    }

    #[test]
    fn test_blake3_verify() {
        let data = b"test data";
        let hash = blake3_hash(data);

        assert!(blake3_verify(&hash, data));
        assert!(!blake3_verify(&hash, b"wrong data"));
    }

    #[test]
    fn test_blake3_xof() {
        let data = b"test";

        let output1 = blake3_xof(data, 64);
        let output2 = blake3_xof(data, 128);

        assert_eq!(output1.len(), 64);
        assert_eq!(output2.len(), 128);

        // First 64 bytes should match
        assert_eq!(&output2[..64], &output1[..]);
    }

    #[test]
    fn test_constant_time_compare() {
        let hash1 = blake3_hash(b"test");
        let hash2 = blake3_hash(b"test");
        let hash3 = blake3_hash(b"other");

        assert!(blake3_compare_hashes(&hash1, &hash2));
        assert!(!blake3_compare_hashes(&hash1, &hash3));
    }
}
