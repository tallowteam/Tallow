//! Brotli compression

use crate::{ProtocolError, Result};
use std::io::{Read, Write};

/// Default Brotli quality level
const DEFAULT_QUALITY: u32 = 4;

/// Brotli buffer size
const BUFFER_SIZE: usize = 4096;

/// Compress data with Brotli
///
/// # Arguments
///
/// * `data` - Data to compress
/// * `quality` - Compression quality (0-11, default 4)
pub fn compress(data: &[u8], quality: u32) -> Result<Vec<u8>> {
    let mut output = Vec::new();
    let mut encoder = brotli::CompressorWriter::new(&mut output, BUFFER_SIZE, quality, 22);
    encoder
        .write_all(data)
        .map_err(|e| ProtocolError::CompressionError(format!("brotli compress failed: {}", e)))?;
    drop(encoder);
    Ok(output)
}

/// Decompress Brotli data
pub fn decompress(data: &[u8]) -> Result<Vec<u8>> {
    let mut output = Vec::new();
    let mut decoder = brotli::Decompressor::new(data, BUFFER_SIZE);
    decoder
        .read_to_end(&mut output)
        .map_err(|e| ProtocolError::CompressionError(format!("brotli decompress failed: {}", e)))?;
    Ok(output)
}

/// Compress with default quality (4)
pub fn compress_default(data: &[u8]) -> Result<Vec<u8>> {
    compress(data, DEFAULT_QUALITY)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_brotli_roundtrip() {
        let data = b"hello world! This is some compressible text data.";
        let compressed = compress(data, 4).unwrap();
        let decompressed = decompress(&compressed).unwrap();
        assert_eq!(&decompressed, data);
    }
}
