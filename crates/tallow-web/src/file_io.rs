//! Browser file I/O helpers for WASM
//!
//! Provides manifest construction and parsing compatible with the CLI's
//! `FileManifest` type. Since `tallow-protocol::transfer::manifest` is
//! behind the `full` feature gate (not available in WASM), this module
//! defines a lightweight WASM-compatible manifest that serializes
//! identically via postcard.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Default chunk size (256 KiB) — matches CLI's DEFAULT_CHUNK_SIZE in chunking.rs
const DEFAULT_CHUNK_SIZE: usize = 256 * 1024;

/// Transfer content type — mirrors `tallow_protocol::transfer::manifest::TransferType`
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub enum TransferType {
    /// Regular file transfer
    #[default]
    Files,
    /// Text-only transfer
    Text,
    /// Clipboard text content
    Clipboard,
    /// Clipboard image data
    ClipboardImage,
    /// URL/link sharing
    Url,
}

/// File entry — mirrors `tallow_protocol::transfer::manifest::FileEntry`
///
/// The path is stored as a `String` instead of `PathBuf` for WASM compatibility,
/// but serializes identically via postcard (both are just string bytes).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmFileEntry {
    /// Relative file path
    pub path: String,
    /// File size in bytes
    pub size: u64,
    /// BLAKE3 hash of file contents (zero-filled initially, computed during transfer)
    pub hash: [u8; 32],
    /// Number of chunks for this file
    pub chunk_count: u64,
}

/// File manifest — mirrors `tallow_protocol::transfer::manifest::FileManifest`
///
/// MUST serialize identically to the CLI's `FileManifest` via postcard.
/// All fields, order, and types match exactly.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmFileManifest {
    /// List of files
    pub files: Vec<WasmFileEntry>,
    /// Total size of all files in bytes
    pub total_size: u64,
    /// Total number of chunks across all files
    pub total_chunks: u64,
    /// Chunk size used for splitting
    pub chunk_size: usize,
    /// Compression algorithm (as string identifier)
    pub compression: Option<String>,
    /// BLAKE3 hash of the serialized manifest
    pub manifest_hash: Option<[u8; 32]>,
    /// Type of transfer
    #[serde(default)]
    pub transfer_type: TransferType,
    /// Whether compression is applied per-chunk
    #[serde(default)]
    pub per_chunk_compression: bool,
}

/// Description of a file from the browser's File API (input from JavaScript).
#[derive(Debug, Deserialize)]
struct JsFileDescription {
    /// File name (or relative path for folder uploads)
    name: String,
    /// File size in bytes
    size: u64,
    /// Relative path (from webkitdirectory, if available)
    #[serde(default)]
    path: Option<String>,
}

/// Compute a file manifest from a JSON array of file descriptions.
///
/// Input: JSON string like `[{"name":"photo.jpg","size":1024,"path":"photos/photo.jpg"}]`
///
/// Returns postcard-encoded manifest bytes compatible with the CLI's FileManifest.
/// The BLAKE3 hashes are zero-filled initially — the browser computes them
/// during the actual file reading phase.
#[wasm_bindgen(js_name = "computeFileManifest")]
pub fn compute_file_manifest(files_json: &str) -> Result<Vec<u8>, JsValue> {
    let file_descs: Vec<JsFileDescription> = serde_json::from_str(files_json)
        .map_err(|e| JsValue::from_str(&format!("parse file descriptions: {}", e)))?;

    if file_descs.is_empty() {
        return Err(JsValue::from_str("no files provided"));
    }

    let mut entries = Vec::with_capacity(file_descs.len());
    let mut total_size: u64 = 0;
    let mut total_chunks: u64 = 0;

    for desc in &file_descs {
        let chunk_count = if desc.size == 0 {
            1 // Empty files still get one chunk
        } else {
            (desc.size + DEFAULT_CHUNK_SIZE as u64 - 1) / DEFAULT_CHUNK_SIZE as u64
        };

        let path = desc
            .path
            .as_deref()
            .unwrap_or(&desc.name)
            .to_string();

        entries.push(WasmFileEntry {
            path,
            size: desc.size,
            hash: [0u8; 32], // Computed during transfer
            chunk_count,
        });

        total_size = total_size.saturating_add(desc.size);
        total_chunks = total_chunks.saturating_add(chunk_count);
    }

    let manifest = WasmFileManifest {
        files: entries,
        total_size,
        total_chunks,
        chunk_size: DEFAULT_CHUNK_SIZE,
        compression: None,
        manifest_hash: None,
        transfer_type: TransferType::Files,
        per_chunk_compression: false,
    };

    postcard::to_allocvec(&manifest)
        .map_err(|e| JsValue::from_str(&format!("encode manifest: {}", e)))
}

/// Parse a postcard-encoded file manifest into a JavaScript-friendly object.
///
/// Returns a JsValue with structure:
/// ```json
/// {
///   "files": [{"path": "photo.jpg", "size": 1024, "chunk_count": 1}],
///   "total_size": 1024,
///   "total_chunks": 1,
///   "chunk_size": 65536,
///   "compression": null
/// }
/// ```
#[wasm_bindgen(js_name = "parseFileManifest")]
pub fn parse_file_manifest(manifest_bytes: &[u8]) -> Result<JsValue, JsValue> {
    let manifest: WasmFileManifest = postcard::from_bytes(manifest_bytes)
        .map_err(|e| JsValue::from_str(&format!("decode manifest: {}", e)))?;

    serde_wasm_bindgen::to_value(&manifest)
        .map_err(|e| JsValue::from_str(&format!("serialize manifest to JsValue: {}", e)))
}
