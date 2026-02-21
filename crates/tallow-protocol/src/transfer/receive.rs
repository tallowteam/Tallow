//! File receiving pipeline
//!
//! Receives encrypted chunks, decrypts, decompresses, verifies integrity,
//! and writes files to disk.

use crate::compression::{self, CompressionAlgorithm};
use crate::transfer::chunking;
use crate::transfer::manifest::FileManifest;
use crate::transfer::progress::TransferProgress;
use crate::transfer::resume::ResumeState;
use crate::wire::Message;
use crate::{ProtocolError, Result};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

/// Maximum number of chunks to buffer in memory (prevents OOM)
const MAX_BUFFERED_CHUNKS: usize = 65_536;

/// Receive pipeline for file transfers
pub struct ReceivePipeline {
    /// Transfer ID
    transfer_id: [u8; 16],
    /// Output directory
    output_dir: PathBuf,
    /// Session encryption key
    session_key: [u8; 32],
    /// File manifest (received from sender)
    manifest: Option<FileManifest>,
    /// Received chunks (index → decrypted data)
    received_chunks: BTreeMap<u64, Vec<u8>>,
    /// Progress tracker
    progress: Option<TransferProgress>,
    /// Resume state
    resume: Option<ResumeState>,
    /// Compression algorithm used by sender
    compression: CompressionAlgorithm,
    /// Expected total chunks (from manifest, validated on each chunk)
    expected_total_chunks: Option<u64>,
}

impl Drop for ReceivePipeline {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.session_key.zeroize();
    }
}

impl std::fmt::Debug for ReceivePipeline {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ReceivePipeline")
            .field("output_dir", &self.output_dir)
            .field("chunks_received", &self.received_chunks.len())
            .finish()
    }
}

impl ReceivePipeline {
    /// Create a new receive pipeline
    pub fn new(transfer_id: [u8; 16], output_dir: impl AsRef<Path>, session_key: [u8; 32]) -> Self {
        Self {
            transfer_id,
            output_dir: output_dir.as_ref().to_path_buf(),
            session_key,
            manifest: None,
            received_chunks: BTreeMap::new(),
            progress: None,
            resume: None,
            compression: CompressionAlgorithm::Zstd,
            expected_total_chunks: None,
        }
    }

    /// Set a resume state for continuing an interrupted transfer
    pub fn with_resume(mut self, resume: ResumeState) -> Self {
        self.resume = Some(resume);
        self
    }

    /// Process a FileOffer message — parse manifest and prepare for reception
    ///
    /// Returns the manifest for user confirmation before accepting.
    pub fn process_offer(&mut self, manifest_bytes: &[u8]) -> Result<&FileManifest> {
        let mut manifest = FileManifest::from_bytes(manifest_bytes)?;
        manifest.sanitize_paths();

        self.progress = Some(TransferProgress::new(manifest.total_size));

        if self.resume.is_none() {
            self.resume = Some(ResumeState::new(
                self.transfer_id,
                manifest.total_chunks,
                manifest.manifest_hash.unwrap_or([0u8; 32]),
            ));
        }

        if let Some(ref comp) = manifest.compression {
            self.compression = match comp.as_str() {
                "zstd" => CompressionAlgorithm::Zstd,
                "lz4" => CompressionAlgorithm::Lz4,
                "brotli" => CompressionAlgorithm::Brotli,
                "lzma" => CompressionAlgorithm::Lzma,
                _ => CompressionAlgorithm::None,
            };
        }

        self.expected_total_chunks = Some(manifest.total_chunks);
        self.manifest = Some(manifest);
        self.manifest
            .as_ref()
            .ok_or_else(|| ProtocolError::TransferFailed("manifest not set".to_string()))
    }

    /// Process a Chunk message — decrypt, verify, store
    pub fn process_chunk(
        &mut self,
        index: u64,
        data: &[u8],
        total: Option<u64>,
    ) -> Result<Option<Message>> {
        // Validate total chunk count matches manifest
        if let (Some(expected), Some(claimed)) = (self.expected_total_chunks, total) {
            if claimed != expected {
                return Err(ProtocolError::TransferFailed(format!(
                    "chunk total mismatch: manifest says {}, chunk header says {}",
                    expected, claimed
                )));
            }
        }

        // Validate chunk index is within expected range
        if let Some(expected_total) = self.expected_total_chunks {
            if index >= expected_total {
                return Err(ProtocolError::TransferFailed(format!(
                    "chunk index {} exceeds expected total {}",
                    index, expected_total
                )));
            }
        }

        // Reject if too many chunks buffered (OOM protection)
        if self.received_chunks.len() >= MAX_BUFFERED_CHUNKS {
            return Err(ProtocolError::TransferFailed(format!(
                "too many buffered chunks ({} max)",
                MAX_BUFFERED_CHUNKS
            )));
        }

        // Check if already received (resume scenario)
        if let Some(ref resume) = self.resume {
            if resume.is_verified(index) {
                // Already have this chunk, send ack
                return Ok(Some(Message::Ack {
                    transfer_id: self.transfer_id,
                    index,
                }));
            }
        }

        // Build AAD and nonce
        let aad = chunking::build_chunk_aad(&self.transfer_id, index);
        let nonce = chunking::build_chunk_nonce(index);

        // Decrypt
        let decrypted = tallow_crypto::symmetric::aes_decrypt(
            &self.session_key,
            &nonce,
            data,
            &aad,
        )
        .map_err(|e| {
            ProtocolError::TransferFailed(format!("chunk {} decryption failed: {}", index, e))
        })?;

        let chunk_size = decrypted.len() as u64;
        self.received_chunks.insert(index, decrypted);

        // Update resume state
        if let Some(ref mut resume) = self.resume {
            resume.mark_verified(index, chunk_size);
        }

        // Update progress
        if let Some(ref mut progress) = self.progress {
            let bytes_so_far = self
                .resume
                .as_ref()
                .map(|r| r.bytes_transferred)
                .unwrap_or(0);
            progress.update(bytes_so_far);
        }

        // Send ack
        Ok(Some(Message::Ack {
            transfer_id: self.transfer_id,
            index,
        }))
    }

    /// Check if all chunks have been received
    pub fn is_complete(&self) -> bool {
        self.resume
            .as_ref()
            .map(|r| r.is_complete())
            .unwrap_or(false)
    }

    /// Assemble and write received files to disk
    ///
    /// Decompresses the reassembled data and writes each file
    /// to the output directory, verifying BLAKE3 hashes.
    pub async fn finalize(&mut self) -> Result<Vec<PathBuf>> {
        let manifest = self
            .manifest
            .as_ref()
            .ok_or_else(|| ProtocolError::TransferFailed("no manifest".to_string()))?;

        // Reassemble all chunks in order
        let mut all_data = Vec::new();
        for i in 0..manifest.total_chunks {
            let chunk = self
                .received_chunks
                .get(&i)
                .ok_or_else(|| ProtocolError::TransferFailed(format!("missing chunk {}", i)))?;
            all_data.extend_from_slice(chunk);
        }

        // Decompress
        let decompressed = compression::pipeline::decompress(&all_data, self.compression)?;

        // Write files according to manifest
        let mut written_paths = Vec::new();
        let mut offset = 0usize;

        for entry in &manifest.files {
            let end = offset + entry.size as usize;
            if end > decompressed.len() {
                return Err(ProtocolError::TransferFailed(format!(
                    "data too short for file {}",
                    entry.path.display()
                )));
            }

            let file_data = &decompressed[offset..end];

            // Verify BLAKE3 hash using constant-time comparison
            let actual_hash: [u8; 32] = blake3::hash(file_data).into();
            if !tallow_crypto::mem::constant_time::ct_eq(&actual_hash, &entry.hash) {
                return Err(ProtocolError::TransferFailed(format!(
                    "hash mismatch for {}",
                    entry.path.display()
                )));
            }

            // Write to output directory (sanitized path prevents traversal attacks)
            let output_path = crate::transfer::sanitize::sanitize_filename(
                &entry.path.to_string_lossy(),
                &self.output_dir,
            )
            .map_err(|e| {
                ProtocolError::TransferFailed(format!(
                    "filename sanitization failed for {}: {}",
                    entry.path.display(),
                    e
                ))
            })?;
            if let Some(parent) = output_path.parent() {
                tokio::fs::create_dir_all(parent)
                    .await
                    .map_err(|e| ProtocolError::TransferFailed(format!("mkdir failed: {}", e)))?;
            }

            tokio::fs::write(&output_path, file_data)
                .await
                .map_err(|e| {
                    ProtocolError::TransferFailed(format!(
                        "write {} failed: {}",
                        output_path.display(),
                        e
                    ))
                })?;

            written_paths.push(output_path);
            offset = end;
        }

        Ok(written_paths)
    }

    /// Get the manifest
    pub fn manifest(&self) -> Option<&FileManifest> {
        self.manifest.as_ref()
    }

    /// Get progress tracker
    pub fn progress(&self) -> Option<&TransferProgress> {
        self.progress.as_ref()
    }

    /// Get resume state for checkpointing
    pub fn resume_state(&self) -> Option<&ResumeState> {
        self.resume.as_ref()
    }

    /// Generate a TransferComplete message
    pub fn complete_message(&self) -> Result<Message> {
        let manifest = self
            .manifest
            .as_ref()
            .ok_or_else(|| ProtocolError::TransferFailed("no manifest".to_string()))?;

        Ok(Message::TransferComplete {
            transfer_id: self.transfer_id,
            hash: manifest.manifest_hash.unwrap_or([0u8; 32]),
        })
    }
}
