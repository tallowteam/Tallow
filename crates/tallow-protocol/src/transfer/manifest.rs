//! File manifest for transfer metadata
//!
//! Contains the list of files, their sizes and hashes.
//! Signed by the sender before transfer begins.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Transfer content type
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub enum TransferType {
    /// Regular file transfer
    #[default]
    Files,
    /// Text-only transfer (no files written to disk on receive)
    Text,
}

/// File entry in manifest
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileEntry {
    /// Relative file path (sanitized, no parent traversal)
    pub path: PathBuf,
    /// File size in bytes
    pub size: u64,
    /// BLAKE3 hash of file contents
    pub hash: [u8; 32],
    /// Number of chunks for this file
    pub chunk_count: u64,
}

/// File manifest containing transfer metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileManifest {
    /// List of files
    pub files: Vec<FileEntry>,
    /// Total size of all files in bytes
    pub total_size: u64,
    /// Total number of chunks across all files
    pub total_chunks: u64,
    /// Chunk size used for splitting
    pub chunk_size: usize,
    /// Compression algorithm used (as string identifier)
    pub compression: Option<String>,
    /// BLAKE3 hash of the serialized manifest (before signing)
    pub manifest_hash: Option<[u8; 32]>,
    /// Type of transfer (files or text)
    #[serde(default)]
    pub transfer_type: TransferType,
}

impl FileManifest {
    /// Create a new empty manifest
    pub fn new(chunk_size: usize) -> Self {
        Self {
            files: Vec::new(),
            total_size: 0,
            total_chunks: 0,
            chunk_size,
            compression: None,
            manifest_hash: None,
            transfer_type: TransferType::default(),
        }
    }

    /// Add a file to the manifest
    pub fn add_file(&mut self, path: PathBuf, size: u64, hash: [u8; 32]) {
        let chunk_count = size.div_ceil(self.chunk_size as u64);
        self.total_size += size;
        self.total_chunks += chunk_count;
        self.files.push(FileEntry {
            path,
            size,
            hash,
            chunk_count,
        });
    }

    /// Compute and store the manifest hash
    pub fn finalize(&mut self) -> crate::Result<()> {
        let bytes = postcard::to_stdvec(&self.files).map_err(|e| {
            crate::ProtocolError::EncodingError(format!("manifest finalize failed: {}", e))
        })?;
        self.manifest_hash = Some(blake3::hash(&bytes).into());
        Ok(())
    }

    /// Serialize the manifest to bytes
    pub fn to_bytes(&self) -> crate::Result<Vec<u8>> {
        postcard::to_stdvec(self).map_err(|e| {
            crate::ProtocolError::EncodingError(format!("manifest serialize failed: {}", e))
        })
    }

    /// Deserialize a manifest from bytes
    pub fn from_bytes(data: &[u8]) -> crate::Result<Self> {
        postcard::from_bytes(data).map_err(|e| {
            crate::ProtocolError::DecodingError(format!("manifest decode failed: {}", e))
        })
    }

    /// Get total number of files
    pub fn file_count(&self) -> usize {
        self.files.len()
    }

    /// Sanitize file paths to prevent directory traversal
    ///
    /// Removes parent directory components (`..`), root prefixes (`/`, `C:\`),
    /// and prefix components to ensure paths are strictly relative.
    pub fn sanitize_paths(&mut self) {
        for entry in &mut self.files {
            let sanitized: PathBuf = entry
                .path
                .components()
                .filter(|c| {
                    matches!(
                        c,
                        std::path::Component::Normal(_) | std::path::Component::CurDir
                    )
                })
                .collect();
            // If sanitization results in an empty path, use a safe fallback
            entry.path = if sanitized.as_os_str().is_empty() {
                PathBuf::from("unnamed")
            } else {
                sanitized
            };
        }
    }
}

impl Default for FileManifest {
    fn default() -> Self {
        Self::new(64 * 1024)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_manifest_add_file() {
        let mut manifest = FileManifest::new(64 * 1024);
        manifest.add_file(PathBuf::from("test.txt"), 1024, [0u8; 32]);
        assert_eq!(manifest.file_count(), 1);
        assert_eq!(manifest.total_size, 1024);
        assert_eq!(manifest.total_chunks, 1);
    }

    #[test]
    fn test_manifest_chunk_count() {
        let mut manifest = FileManifest::new(64 * 1024);
        // File larger than one chunk
        manifest.add_file(
            PathBuf::from("big.bin"),
            200_000, // ~3 chunks at 64KB
            [0u8; 32],
        );
        assert_eq!(manifest.files[0].chunk_count, 4); // ceil(200000/65536)
    }

    #[test]
    fn test_manifest_roundtrip() {
        let mut manifest = FileManifest::new(64 * 1024);
        manifest.add_file(PathBuf::from("a.txt"), 100, [1u8; 32]);
        manifest.add_file(PathBuf::from("b.txt"), 200, [2u8; 32]);
        manifest.finalize().unwrap();

        let bytes = manifest.to_bytes().unwrap();
        let decoded = FileManifest::from_bytes(&bytes).unwrap();
        assert_eq!(decoded.file_count(), 2);
        assert_eq!(decoded.total_size, 300);
    }

    #[test]
    fn test_sanitize_paths() {
        let mut manifest = FileManifest::new(64 * 1024);
        manifest.add_file(PathBuf::from("../../../etc/passwd"), 100, [0u8; 32]);
        manifest.sanitize_paths();
        assert!(!manifest.files[0].path.to_string_lossy().contains(".."));
        // Should keep only the filename component
        assert_eq!(manifest.files[0].path, PathBuf::from("etc/passwd"));
    }

    #[test]
    fn test_sanitize_absolute_paths() {
        let mut manifest = FileManifest::new(64 * 1024);
        manifest.add_file(PathBuf::from("/etc/passwd"), 100, [0u8; 32]);
        manifest.sanitize_paths();
        // Root component should be stripped
        assert!(!manifest.files[0].path.is_absolute());
        assert_eq!(manifest.files[0].path, PathBuf::from("etc/passwd"));
    }

    #[test]
    fn test_sanitize_empty_path() {
        let mut manifest = FileManifest::new(64 * 1024);
        manifest.add_file(PathBuf::from(".."), 100, [0u8; 32]);
        manifest.sanitize_paths();
        // Should fall back to "unnamed"
        assert_eq!(manifest.files[0].path, PathBuf::from("unnamed"));
    }
}
