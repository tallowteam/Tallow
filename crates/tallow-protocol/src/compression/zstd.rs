//! Zstandard compression

use crate::Result;

/// Compress data with Zstandard
pub fn compress(_data: &[u8], _level: i32) -> Result<Vec<u8>> {
    todo!("Implement Zstd compression")
}

/// Decompress Zstandard data
pub fn decompress(_data: &[u8]) -> Result<Vec<u8>> {
    todo!("Implement Zstd decompression")
}
