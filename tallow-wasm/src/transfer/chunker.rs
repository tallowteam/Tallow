//! High-speed file chunking
//!
//! Efficiently splits files into chunks for parallel processing and streaming

use wasm_bindgen::prelude::*;

/// Default chunk size: 1 MB
pub const DEFAULT_CHUNK_SIZE: usize = 1024 * 1024;

/// Maximum chunk size: 16 MB
pub const MAX_CHUNK_SIZE: usize = 16 * 1024 * 1024;

/// Minimum chunk size: 64 KB
pub const MIN_CHUNK_SIZE: usize = 64 * 1024;

/// File chunker for streaming large files
#[wasm_bindgen]
pub struct FileChunker {
    chunk_size: usize,
    total_chunks: usize,
    file_size: usize,
}

#[wasm_bindgen]
impl FileChunker {
    /// Create a new file chunker
    ///
    /// # Arguments
    /// * `file_size` - Total size of the file in bytes
    /// * `chunk_size` - Size of each chunk (will be clamped to MIN/MAX)
    #[wasm_bindgen(constructor)]
    pub fn new(file_size: usize, chunk_size: Option<usize>) -> FileChunker {
        let chunk_size = chunk_size
            .unwrap_or(DEFAULT_CHUNK_SIZE)
            .clamp(MIN_CHUNK_SIZE, MAX_CHUNK_SIZE);

        let total_chunks = (file_size + chunk_size - 1) / chunk_size;

        FileChunker {
            chunk_size,
            total_chunks,
            file_size,
        }
    }

    /// Get the total number of chunks
    #[wasm_bindgen(getter)]
    pub fn total_chunks(&self) -> usize {
        self.total_chunks
    }

    /// Get the chunk size
    #[wasm_bindgen(getter)]
    pub fn chunk_size(&self) -> usize {
        self.chunk_size
    }

    /// Get the file size
    #[wasm_bindgen(getter)]
    pub fn file_size(&self) -> usize {
        self.file_size
    }

    /// Get the offset for a specific chunk
    pub fn chunk_offset(&self, chunk_index: usize) -> usize {
        chunk_index * self.chunk_size
    }

    /// Get the size of a specific chunk
    pub fn chunk_length(&self, chunk_index: usize) -> usize {
        if chunk_index >= self.total_chunks {
            return 0;
        }

        let offset = self.chunk_offset(chunk_index);
        let remaining = self.file_size - offset;

        remaining.min(self.chunk_size)
    }

    /// Get chunk info as JSON
    pub fn chunk_info(&self, chunk_index: usize) -> JsValue {
        let info = serde_json::json!({
            "index": chunk_index,
            "offset": self.chunk_offset(chunk_index),
            "length": self.chunk_length(chunk_index),
            "total": self.total_chunks,
        });

        serde_wasm_bindgen::to_value(&info).unwrap()
    }
}

/// Calculate optimal chunk size based on file size
///
/// Returns a chunk size between MIN and MAX that provides good parallelism
#[wasm_bindgen]
pub fn calculate_optimal_chunk_size(file_size: usize) -> usize {
    // For small files (<10 MB), use smaller chunks
    if file_size < 10 * 1024 * 1024 {
        return MIN_CHUNK_SIZE;
    }

    // For medium files (10-100 MB), use 512 KB chunks
    if file_size < 100 * 1024 * 1024 {
        return 512 * 1024;
    }

    // For large files (100 MB - 1 GB), use 1 MB chunks
    if file_size < 1024 * 1024 * 1024 {
        return DEFAULT_CHUNK_SIZE;
    }

    // For very large files (>1 GB), use 4 MB chunks
    if file_size < 10 * 1024 * 1024 * 1024 {
        return 4 * 1024 * 1024;
    }

    // For huge files (>10 GB), use maximum chunk size
    MAX_CHUNK_SIZE
}

/// Chunk a data buffer into fixed-size pieces
///
/// Returns an array of chunks
#[wasm_bindgen]
pub fn chunk_data(data: &[u8], chunk_size: usize) -> Vec<js_sys::Uint8Array> {
    let chunk_size = chunk_size.clamp(MIN_CHUNK_SIZE, MAX_CHUNK_SIZE);
    let mut chunks = Vec::new();

    for chunk in data.chunks(chunk_size) {
        chunks.push(js_sys::Uint8Array::from(chunk));
    }

    chunks
}

/// Get chunk boundaries for a file
///
/// Returns array of [offset, length] pairs
#[wasm_bindgen]
pub fn get_chunk_boundaries(file_size: usize, chunk_size: usize) -> JsValue {
    let chunker = FileChunker::new(file_size, Some(chunk_size));
    let mut boundaries = Vec::new();

    for i in 0..chunker.total_chunks {
        boundaries.push(serde_json::json!({
            "offset": chunker.chunk_offset(i),
            "length": chunker.chunk_length(i),
        }));
    }

    serde_wasm_bindgen::to_value(&boundaries).unwrap()
}

/// Calculate the number of chunks for a given file and chunk size
#[wasm_bindgen]
pub fn calculate_chunk_count(file_size: usize, chunk_size: usize) -> usize {
    if chunk_size == 0 {
        return 0;
    }
    (file_size + chunk_size - 1) / chunk_size
}

/// Validate chunk parameters
#[wasm_bindgen]
pub fn validate_chunk_params(file_size: usize, chunk_size: usize) -> Result<(), JsValue> {
    if chunk_size < MIN_CHUNK_SIZE {
        return Err(JsValue::from_str(&format!(
            "Chunk size too small: {} (min: {})",
            chunk_size, MIN_CHUNK_SIZE
        )));
    }

    if chunk_size > MAX_CHUNK_SIZE {
        return Err(JsValue::from_str(&format!(
            "Chunk size too large: {} (max: {})",
            chunk_size, MAX_CHUNK_SIZE
        )));
    }

    if file_size == 0 {
        return Err(JsValue::from_str("File size cannot be zero"));
    }

    Ok(())
}

/// Get chunking statistics
#[wasm_bindgen]
pub fn get_chunking_stats(file_size: usize, chunk_size: usize) -> JsValue {
    let chunker = FileChunker::new(file_size, Some(chunk_size));

    let overhead = (chunker.total_chunks * 32) as f64; // Assume 32 bytes overhead per chunk
    let overhead_percent = (overhead / file_size as f64) * 100.0;

    let stats = serde_json::json!({
        "fileSize": file_size,
        "chunkSize": chunk_size,
        "totalChunks": chunker.total_chunks,
        "lastChunkSize": chunker.chunk_length(chunker.total_chunks - 1),
        "overheadBytes": overhead,
        "overheadPercent": overhead_percent,
    });

    serde_wasm_bindgen::to_value(&stats).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunker_basic() {
        let file_size = 10 * 1024 * 1024; // 10 MB
        let chunk_size = 1024 * 1024; // 1 MB
        let chunker = FileChunker::new(file_size, Some(chunk_size));

        assert_eq!(chunker.total_chunks(), 10);
        assert_eq!(chunker.chunk_size(), chunk_size);
        assert_eq!(chunker.file_size(), file_size);
    }

    #[test]
    fn test_chunker_uneven() {
        let file_size = 10 * 1024 * 1024 + 512 * 1024; // 10.5 MB
        let chunk_size = 1024 * 1024; // 1 MB
        let chunker = FileChunker::new(file_size, Some(chunk_size));

        assert_eq!(chunker.total_chunks(), 11);
        assert_eq!(chunker.chunk_length(10), 512 * 1024); // Last chunk
    }

    #[test]
    fn test_chunk_offset() {
        let chunker = FileChunker::new(10 * 1024 * 1024, Some(1024 * 1024));

        assert_eq!(chunker.chunk_offset(0), 0);
        assert_eq!(chunker.chunk_offset(1), 1024 * 1024);
        assert_eq!(chunker.chunk_offset(5), 5 * 1024 * 1024);
    }

    #[test]
    fn test_optimal_chunk_size() {
        assert_eq!(calculate_optimal_chunk_size(1024 * 1024), MIN_CHUNK_SIZE); // 1 MB
        assert_eq!(calculate_optimal_chunk_size(50 * 1024 * 1024), 512 * 1024); // 50 MB
        assert_eq!(
            calculate_optimal_chunk_size(500 * 1024 * 1024),
            DEFAULT_CHUNK_SIZE
        ); // 500 MB
    }

    #[test]
    fn test_chunk_count() {
        assert_eq!(calculate_chunk_count(10 * 1024 * 1024, 1024 * 1024), 10);
        assert_eq!(calculate_chunk_count(10 * 1024 * 1024 + 1, 1024 * 1024), 11);
        assert_eq!(calculate_chunk_count(1024 * 1024 - 1, 1024 * 1024), 1);
    }

    #[test]
    fn test_validate_chunk_params() {
        assert!(validate_chunk_params(1024 * 1024, DEFAULT_CHUNK_SIZE).is_ok());
        assert!(validate_chunk_params(1024 * 1024, MIN_CHUNK_SIZE - 1).is_err());
        assert!(validate_chunk_params(1024 * 1024, MAX_CHUNK_SIZE + 1).is_err());
        assert!(validate_chunk_params(0, DEFAULT_CHUNK_SIZE).is_err());
    }
}
