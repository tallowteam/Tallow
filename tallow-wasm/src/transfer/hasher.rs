//! Parallel hash verification for file transfers
//!
//! Provides high-speed hashing with parallel processing

use crate::crypto::blake3;
use wasm_bindgen::prelude::*;

/// Hash multiple chunks in parallel
///
/// Returns a combined hash of all chunks
#[wasm_bindgen]
pub fn hash_chunks_parallel(chunks: Vec<js_sys::Uint8Array>) -> Vec<u8> {
    blake3::blake3_hash_chunks(chunks)
}

/// Verify a chunk hash
///
/// Returns true if the hash matches
#[wasm_bindgen]
pub fn verify_chunk_hash(chunk: &[u8], expected_hash: &[u8]) -> bool {
    if expected_hash.len() != 32 {
        return false;
    }

    let computed_hash = blake3::blake3_hash(chunk);
    blake3::blake3_compare_hashes(&computed_hash, expected_hash)
}

/// Generate hashes for all chunks
///
/// Returns an array of 32-byte hashes
#[wasm_bindgen]
pub fn generate_chunk_hashes(chunks: Vec<js_sys::Uint8Array>) -> Vec<js_sys::Uint8Array> {
    chunks
        .into_iter()
        .map(|chunk| {
            let data = chunk.to_vec();
            let hash = blake3::blake3_hash(&data);
            js_sys::Uint8Array::from(&hash[..])
        })
        .collect()
}

/// Create a Merkle tree root hash from chunk hashes
///
/// Provides integrity verification for the entire file
#[wasm_bindgen]
pub fn merkle_root(hashes: Vec<js_sys::Uint8Array>) -> Vec<u8> {
    if hashes.is_empty() {
        return vec![0u8; 32];
    }

    if hashes.len() == 1 {
        return hashes[0].to_vec();
    }

    let mut current_level: Vec<Vec<u8>> = hashes.iter().map(|h| h.to_vec()).collect();

    while current_level.len() > 1 {
        let mut next_level = Vec::new();

        for pair in current_level.chunks(2) {
            let hash = if pair.len() == 2 {
                // Combine two hashes
                let mut combined = Vec::with_capacity(64);
                combined.extend_from_slice(&pair[0]);
                combined.extend_from_slice(&pair[1]);
                blake3::blake3_hash(&combined)
            } else {
                // Odd one out, just hash it alone
                blake3::blake3_hash(&pair[0])
            };

            next_level.push(hash);
        }

        current_level = next_level;
    }

    current_level[0].clone()
}

/// Verify a chunk against a Merkle proof
///
/// Returns true if the chunk is valid according to the Merkle tree
#[wasm_bindgen]
pub fn verify_merkle_proof(
    chunk_hash: &[u8],
    proof: Vec<js_sys::Uint8Array>,
    root: &[u8],
    index: usize,
) -> bool {
    if chunk_hash.len() != 32 || root.len() != 32 {
        return false;
    }

    let mut current_hash = chunk_hash.to_vec();
    let mut current_index = index;

    for sibling_hash in proof {
        let sibling = sibling_hash.to_vec();
        if sibling.len() != 32 {
            return false;
        }

        let mut combined = Vec::with_capacity(64);

        // Combine in order based on index
        if current_index % 2 == 0 {
            combined.extend_from_slice(&current_hash);
            combined.extend_from_slice(&sibling);
        } else {
            combined.extend_from_slice(&sibling);
            combined.extend_from_slice(&current_hash);
        }

        current_hash = blake3::blake3_hash(&combined);
        current_index /= 2;
    }

    blake3::blake3_compare_hashes(&current_hash, root)
}

/// Hash a file chunk with metadata
///
/// Includes chunk index and offset in the hash for additional integrity
#[wasm_bindgen]
pub fn hash_chunk_with_metadata(
    chunk: &[u8],
    chunk_index: usize,
    offset: usize,
) -> Vec<u8> {
    let mut hasher = blake3::Blake3Hasher::new();

    // Hash metadata first
    hasher.update(&chunk_index.to_le_bytes());
    hasher.update(&offset.to_le_bytes());
    hasher.update(&chunk.len().to_le_bytes());

    // Hash chunk data
    hasher.update(chunk);

    hasher.finalize()
}

/// Verify chunk integrity with metadata
#[wasm_bindgen]
pub fn verify_chunk_with_metadata(
    chunk: &[u8],
    chunk_index: usize,
    offset: usize,
    expected_hash: &[u8],
) -> bool {
    let computed = hash_chunk_with_metadata(chunk, chunk_index, offset);
    blake3::blake3_compare_hashes(&computed, expected_hash)
}

/// Generate a rolling hash for deduplication
///
/// Uses BLAKE3 keyed hash for fast comparison
#[wasm_bindgen]
pub fn rolling_hash(data: &[u8], key: &[u8]) -> Result<Vec<u8>, JsValue> {
    blake3::blake3_keyed_hash(key, data)
}

/// Fast hash comparison for deduplication
#[wasm_bindgen]
pub fn compare_hashes(hash1: &[u8], hash2: &[u8]) -> bool {
    blake3::blake3_compare_hashes(hash1, hash2)
}

/// Parallel hash verification for multiple chunks
///
/// Returns array of booleans indicating which chunks are valid
#[wasm_bindgen]
pub fn verify_chunks_parallel(
    chunks: Vec<js_sys::Uint8Array>,
    expected_hashes: Vec<js_sys::Uint8Array>,
) -> Vec<bool> {
    if chunks.len() != expected_hashes.len() {
        return vec![false; chunks.len()];
    }

    chunks
        .into_iter()
        .zip(expected_hashes.into_iter())
        .map(|(chunk, expected)| {
            let data = chunk.to_vec();
            let expected_vec = expected.to_vec();
            verify_chunk_hash(&data, &expected_vec)
        })
        .collect()
}

/// Generate file integrity manifest
///
/// Returns JSON with all chunk hashes and Merkle root
#[wasm_bindgen]
pub fn generate_integrity_manifest(chunks: Vec<js_sys::Uint8Array>) -> JsValue {
    let chunk_hashes: Vec<Vec<u8>> = chunks
        .iter()
        .map(|chunk| {
            let data = chunk.to_vec();
            blake3::blake3_hash(&data)
        })
        .collect();

    let merkle_root_hash = merkle_root(
        chunk_hashes
            .iter()
            .map(|h| js_sys::Uint8Array::from(&h[..]))
            .collect(),
    );

    let manifest = serde_json::json!({
        "version": 1,
        "chunkCount": chunks.len(),
        "chunkHashes": chunk_hashes.iter().map(|h| hex::encode(h)).collect::<Vec<_>>(),
        "merkleRoot": hex::encode(&merkle_root_hash),
        "hashAlgorithm": "BLAKE3",
    });

    serde_wasm_bindgen::to_value(&manifest).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_chunks() {
        let data1 = vec![1u8; 1024];
        let data2 = vec![2u8; 1024];

        let chunks = vec![
            js_sys::Uint8Array::from(&data1[..]),
            js_sys::Uint8Array::from(&data2[..]),
        ];

        let hash = hash_chunks_parallel(chunks);
        assert_eq!(hash.len(), 32);
    }

    #[test]
    fn test_verify_chunk_hash() {
        let data = b"test data";
        let hash = blake3::blake3_hash(data);

        assert!(verify_chunk_hash(data, &hash));
        assert!(!verify_chunk_hash(b"wrong data", &hash));
    }

    #[test]
    fn test_merkle_root_single() {
        let data = b"test";
        let hash = blake3::blake3_hash(data);
        let hashes = vec![js_sys::Uint8Array::from(&hash[..])];

        let root = merkle_root(hashes);
        assert_eq!(root, hash);
    }

    #[test]
    fn test_merkle_root_multiple() {
        let hash1 = blake3::blake3_hash(b"chunk1");
        let hash2 = blake3::blake3_hash(b"chunk2");
        let hash3 = blake3::blake3_hash(b"chunk3");

        let hashes = vec![
            js_sys::Uint8Array::from(&hash1[..]),
            js_sys::Uint8Array::from(&hash2[..]),
            js_sys::Uint8Array::from(&hash3[..]),
        ];

        let root = merkle_root(hashes);
        assert_eq!(root.len(), 32);
    }

    #[test]
    fn test_hash_with_metadata() {
        let data = b"test chunk";
        let hash1 = hash_chunk_with_metadata(data, 0, 0);
        let hash2 = hash_chunk_with_metadata(data, 0, 0);

        // Same metadata should produce same hash
        assert_eq!(hash1, hash2);

        // Different index should produce different hash
        let hash3 = hash_chunk_with_metadata(data, 1, 0);
        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_verify_chunks_parallel() {
        let chunk1 = vec![1u8; 100];
        let chunk2 = vec![2u8; 100];

        let chunks = vec![
            js_sys::Uint8Array::from(&chunk1[..]),
            js_sys::Uint8Array::from(&chunk2[..]),
        ];

        let hashes = generate_chunk_hashes(chunks.clone());
        let results = verify_chunks_parallel(chunks, hashes);

        assert_eq!(results, vec![true, true]);
    }
}
