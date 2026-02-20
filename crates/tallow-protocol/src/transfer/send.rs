//! File sending pipeline
//!
//! Reads files, builds manifest, chunks, compresses, encrypts,
//! and sends via the wire protocol.

use crate::compression::{self, CompressionAlgorithm};
use crate::transfer::chunking::{self, ChunkConfig};
use crate::transfer::exclusion::ExclusionConfig;
use crate::transfer::manifest::{FileManifest, TransferType};
use crate::transfer::progress::TransferProgress;
use crate::wire::Message;
use crate::{ProtocolError, Result};
use std::path::{Path, PathBuf};

/// Send pipeline for file transfers
pub struct SendPipeline {
    /// Unique transfer ID
    transfer_id: [u8; 16],
    /// Chunk configuration
    chunk_config: ChunkConfig,
    /// Compression algorithm
    compression: CompressionAlgorithm,
    /// File manifest
    manifest: FileManifest,
    /// Progress tracker
    progress: Option<TransferProgress>,
    /// Session encryption key (32 bytes, AES-256-GCM)
    session_key: [u8; 32],
    /// File exclusion configuration for directory scanning
    exclusion: ExclusionConfig,
}

impl Drop for SendPipeline {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.session_key.zeroize();
    }
}

impl std::fmt::Debug for SendPipeline {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SendPipeline")
            .field("transfer_id", &hex::encode(self.transfer_id))
            .field("chunk_config", &self.chunk_config)
            .field("compression", &self.compression)
            .finish()
    }
}

// Minimal hex encoding for debug display
mod hex {
    pub fn encode(bytes: impl AsRef<[u8]>) -> String {
        bytes
            .as_ref()
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect()
    }
}

impl SendPipeline {
    /// Create a new send pipeline
    pub fn new(transfer_id: [u8; 16], session_key: [u8; 32]) -> Self {
        Self {
            transfer_id,
            chunk_config: ChunkConfig::new(),
            compression: CompressionAlgorithm::Zstd,
            manifest: FileManifest::new(chunking::DEFAULT_CHUNK_SIZE),
            progress: None,
            session_key,
            exclusion: ExclusionConfig::default(),
        }
    }

    /// Set chunk configuration
    pub fn with_chunk_config(mut self, config: ChunkConfig) -> Self {
        self.chunk_config = config;
        self
    }

    /// Set compression algorithm
    pub fn with_compression(mut self, algo: CompressionAlgorithm) -> Self {
        self.compression = algo;
        self
    }

    /// Set file exclusion configuration for directory scanning
    pub fn with_exclusion(mut self, config: ExclusionConfig) -> Self {
        self.exclusion = config;
        self
    }

    /// Prepare files for transfer — scan, hash, build manifest
    ///
    /// # Arguments
    ///
    /// * `paths` - Files or directories to send
    ///
    /// # Returns
    ///
    /// The file manifest and a list of FileOffer messages
    pub async fn prepare(&mut self, paths: &[PathBuf]) -> Result<Vec<Message>> {
        let mut messages = Vec::new();

        for path in paths {
            self.scan_path(path).await?;
        }

        self.manifest.finalize()?;
        self.manifest.compression = Some(match self.compression {
            CompressionAlgorithm::Zstd => "zstd".to_string(),
            CompressionAlgorithm::Lz4 => "lz4".to_string(),
            CompressionAlgorithm::Brotli => "brotli".to_string(),
            CompressionAlgorithm::Lzma => "lzma".to_string(),
            CompressionAlgorithm::None => "none".to_string(),
        });
        self.progress = Some(TransferProgress::new(self.manifest.total_size));

        // Create FileOffer message
        let manifest_bytes = self.manifest.to_bytes()?;
        messages.push(Message::FileOffer {
            transfer_id: self.transfer_id,
            manifest: manifest_bytes,
        });

        Ok(messages)
    }

    /// Scan a path and add it to the manifest
    async fn scan_path(&mut self, path: &Path) -> Result<()> {
        let metadata = tokio::fs::metadata(path).await.map_err(|e| {
            ProtocolError::TransferFailed(format!("cannot read {}: {}", path.display(), e))
        })?;

        if metadata.is_file() {
            let data = tokio::fs::read(path).await.map_err(|e| {
                ProtocolError::TransferFailed(format!("read failed {}: {}", path.display(), e))
            })?;

            let hash: [u8; 32] = blake3::hash(&data).into();
            let relative_path = path
                .file_name()
                .map(PathBuf::from)
                .unwrap_or_else(|| PathBuf::from("unnamed"));

            self.manifest.add_file(relative_path, metadata.len(), hash);
        } else if metadata.is_dir() {
            self.scan_directory(path, path).await?;
        }

        Ok(())
    }

    /// Recursively scan a directory, respecting exclusion rules if configured
    async fn scan_directory(&mut self, base: &Path, dir: &Path) -> Result<()> {
        // Use exclusion-aware walker for the root directory scan
        if self.exclusion.is_active() && dir == base {
            let files = self.exclusion.walk_directory(base)?;
            for file_path in files {
                let data = tokio::fs::read(&file_path).await.map_err(|e| {
                    ProtocolError::TransferFailed(format!(
                        "read {}: {}",
                        file_path.display(),
                        e
                    ))
                })?;
                let hash: [u8; 32] = blake3::hash(&data).into();
                let relative = file_path
                    .strip_prefix(base)
                    .unwrap_or(&file_path)
                    .to_path_buf();
                self.manifest.add_file(relative, data.len() as u64, hash);
            }
            return Ok(());
        }

        // Fallback: standard recursive directory walk (no exclusion)
        let mut entries = tokio::fs::read_dir(dir).await.map_err(|e| {
            ProtocolError::TransferFailed(format!("readdir {}: {}", dir.display(), e))
        })?;

        while let Some(entry) = entries
            .next_entry()
            .await
            .map_err(|e| ProtocolError::TransferFailed(format!("readdir entry: {}", e)))?
        {
            let path = entry.path();
            let file_type = entry
                .file_type()
                .await
                .map_err(|e| ProtocolError::TransferFailed(format!("file_type: {}", e)))?;

            if file_type.is_file() {
                let data = tokio::fs::read(&path).await.map_err(|e| {
                    ProtocolError::TransferFailed(format!("read {}: {}", path.display(), e))
                })?;

                let hash: [u8; 32] = blake3::hash(&data).into();
                let relative = path.strip_prefix(base).unwrap_or(&path).to_path_buf();

                self.manifest.add_file(relative, data.len() as u64, hash);
            } else if file_type.is_dir() {
                Box::pin(self.scan_directory(base, &path)).await?;
            }
        }

        Ok(())
    }

    /// Generate chunk messages for a specific file
    ///
    /// Reads the file, compresses, encrypts each chunk, and returns
    /// a sequence of Chunk messages ready for sending.
    pub async fn chunk_file(
        &self,
        file_path: &Path,
        start_chunk_index: u64,
    ) -> Result<Vec<Message>> {
        let data = tokio::fs::read(file_path).await.map_err(|e| {
            ProtocolError::TransferFailed(format!("read {}: {}", file_path.display(), e))
        })?;

        // Compress
        let compressed = compression::pipeline::compress(&data, self.compression)?;

        // Split into chunks
        let chunks = chunking::split_into_chunks(&compressed, self.chunk_config.size);
        let num_chunks = chunks.len() as u64;
        let total = start_chunk_index + num_chunks;

        let mut messages = Vec::with_capacity(chunks.len());

        for chunk in chunks {
            let global_index = start_chunk_index + chunk.index;

            // Build AAD and nonce for this chunk
            let aad = chunking::build_chunk_aad(&self.transfer_id, global_index);
            let nonce = chunking::build_chunk_nonce(global_index);

            // Encrypt with AES-256-GCM
            let encrypted =
                tallow_crypto::symmetric::aes_encrypt(&self.session_key, &nonce, &chunk.data, &aad)
                    .map_err(|e| {
                        ProtocolError::TransferFailed(format!("chunk encryption failed: {}", e))
                    })?;

            messages.push(Message::Chunk {
                transfer_id: self.transfer_id,
                index: global_index,
                total: if chunk.index + 1 == num_chunks {
                    Some(total)
                } else {
                    None
                },
                data: encrypted,
            });
        }

        Ok(messages)
    }

    /// Get the manifest
    pub fn manifest(&self) -> &FileManifest {
        &self.manifest
    }

    /// Get the transfer ID
    pub fn transfer_id(&self) -> &[u8; 16] {
        &self.transfer_id
    }

    /// Prepare a text payload for transfer as a virtual file.
    ///
    /// The text is treated as a single file named `_tallow_text_` in the manifest.
    /// The receiver detects this special name and prints to stdout instead of disk.
    pub async fn prepare_text(&mut self, text: &[u8]) -> Result<Vec<Message>> {
        let hash: [u8; 32] = blake3::hash(text).into();

        self.manifest.transfer_type = TransferType::Text;
        self.manifest.add_file(
            PathBuf::from("_tallow_text_"),
            text.len() as u64,
            hash,
        );

        self.manifest.finalize()?;
        self.manifest.compression = Some(match self.compression {
            CompressionAlgorithm::Zstd => "zstd".to_string(),
            CompressionAlgorithm::Lz4 => "lz4".to_string(),
            CompressionAlgorithm::Brotli => "brotli".to_string(),
            CompressionAlgorithm::Lzma => "lzma".to_string(),
            CompressionAlgorithm::None => "none".to_string(),
        });
        self.progress = Some(TransferProgress::new(self.manifest.total_size));

        let manifest_bytes = self.manifest.to_bytes()?;
        Ok(vec![Message::FileOffer {
            transfer_id: self.transfer_id,
            manifest: manifest_bytes,
        }])
    }

    /// Generate chunk messages for in-memory data (text or stdin).
    ///
    /// Works identically to `chunk_file` but operates on a byte slice
    /// rather than reading from disk.
    pub async fn chunk_data(
        &self,
        data: &[u8],
        start_chunk_index: u64,
    ) -> Result<Vec<Message>> {
        // Compress
        let compressed = compression::pipeline::compress(data, self.compression)?;

        // Split into chunks
        let chunks = chunking::split_into_chunks(&compressed, self.chunk_config.size);
        let num_chunks = chunks.len() as u64;
        let total = start_chunk_index + num_chunks;

        let mut messages = Vec::with_capacity(chunks.len());

        for chunk in chunks {
            let global_index = start_chunk_index + chunk.index;
            let aad = chunking::build_chunk_aad(&self.transfer_id, global_index);
            let nonce = chunking::build_chunk_nonce(global_index);

            let encrypted =
                tallow_crypto::symmetric::aes_encrypt(&self.session_key, &nonce, &chunk.data, &aad)
                    .map_err(|e| {
                        ProtocolError::TransferFailed(format!("chunk encryption failed: {}", e))
                    })?;

            messages.push(Message::Chunk {
                transfer_id: self.transfer_id,
                index: global_index,
                total: if chunk.index + 1 == num_chunks {
                    Some(total)
                } else {
                    None
                },
                data: encrypted,
            });
        }

        Ok(messages)
    }

    /// Update progress and return current state
    pub fn update_progress(&mut self, bytes: u64) -> Option<&TransferProgress> {
        if let Some(ref mut progress) = self.progress {
            progress.update(bytes);
        }
        self.progress.as_ref()
    }
}
