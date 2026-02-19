//! LZ4 compression (fastest algorithm)

use crate::{ProtocolError, Result};

/// Compress data with LZ4
pub fn compress(data: &[u8]) -> Result<Vec<u8>> {
    Ok(lz4_flex::compress_prepend_size(data))
}

/// Decompress LZ4 data
pub fn decompress(data: &[u8]) -> Result<Vec<u8>> {
    lz4_flex::decompress_size_prepended(data)
        .map_err(|e| ProtocolError::CompressionError(format!("lz4 decompress failed: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lz4_roundtrip() {
        let data = b"hello world! This is some compressible text data.";
        let compressed = compress(data).unwrap();
        let decompressed = decompress(&compressed).unwrap();
        assert_eq!(&decompressed, data);
    }
}
