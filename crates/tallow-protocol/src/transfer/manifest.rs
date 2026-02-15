//! File manifest for transfer metadata

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// File entry in manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    /// File path
    pub path: PathBuf,
    /// File size in bytes
    pub size: u64,
    /// BLAKE3 hash
    pub hash: Vec<u8>,
}

/// File manifest containing transfer metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileManifest {
    /// List of files
    pub files: Vec<FileEntry>,
    /// Total size of all files
    pub total_size: u64,
    /// Manifest signature
    pub signature: Option<Vec<u8>>,
}

impl FileManifest {
    /// Create a new manifest
    pub fn new() -> Self {
        Self {
            files: Vec::new(),
            total_size: 0,
            signature: None,
        }
    }

    /// Add a file to the manifest
    pub fn add_file(&mut self, path: PathBuf, size: u64, hash: Vec<u8>) {
        self.total_size += size;
        self.files.push(FileEntry { path, size, hash });
    }

    /// Sign the manifest
    pub fn sign(&mut self, _signing_key: &[u8]) {
        todo!("Implement manifest signing")
    }

    /// Verify manifest signature
    pub fn verify(&self, _public_key: &[u8]) -> bool {
        todo!("Implement manifest verification")
    }
}

impl Default for FileManifest {
    fn default() -> Self {
        Self::new()
    }
}
