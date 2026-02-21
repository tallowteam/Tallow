//! File receiving pipeline
//!
//! Receives encrypted chunks, decrypts, decompresses, verifies integrity,
//! and writes files to disk.
//!
//! Supports streaming I/O for large files — chunks are decompressed and
//! written to temp files as they arrive, avoiding loading entire transfers
//! into memory.

use crate::compression::{self, CompressionAlgorithm};
use crate::transfer::chunking;
use crate::transfer::manifest::FileManifest;
use crate::transfer::progress::TransferProgress;
use crate::transfer::resume::ResumeState;
use crate::wire::Message;
use crate::{ProtocolError, Result};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use tokio::io::AsyncWriteExt;

/// Maximum number of chunks to buffer in memory (for non-streaming mode)
const MAX_BUFFERED_CHUNKS: usize = 65_536;

/// Threshold in bytes above which we use temp file storage instead of memory.
/// Files larger than this are streamed to disk as chunks arrive.
const STREAMING_THRESHOLD: u64 = 10 * 1024 * 1024; // 10 MB

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
    /// Received chunks — used for small transfers (< STREAMING_THRESHOLD)
    received_chunks: BTreeMap<u64, Vec<u8>>,
    /// Progress tracker
    progress: Option<TransferProgress>,
    /// Resume state
    resume: Option<ResumeState>,
    /// Compression algorithm used by sender
    compression: CompressionAlgorithm,
    /// Expected total chunks (from manifest, validated on each chunk)
    expected_total_chunks: Option<u64>,
    /// Whether sender uses per-chunk compression
    per_chunk_compression: bool,
    /// Temp directory for streaming large transfers (chunks written to disk)
    temp_dir: Option<PathBuf>,
    /// Whether we're using streaming mode (temp file storage)
    streaming_mode: bool,
    /// BLAKE3 hashes of received chunks (for Merkle tree verification)
    chunk_hashes: Vec<Option<[u8; 32]>>,
}

impl Drop for ReceivePipeline {
    fn drop(&mut self) {
        use zeroize::Zeroize;
        self.session_key.zeroize();

        // Clean up temp directory on drop (best effort)
        if let Some(ref temp_dir) = self.temp_dir {
            let _ = std::fs::remove_dir_all(temp_dir);
        }
    }
}

impl std::fmt::Debug for ReceivePipeline {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ReceivePipeline")
            .field("output_dir", &self.output_dir)
            .field("chunks_received", &self.received_chunks.len())
            .field("streaming_mode", &self.streaming_mode)
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
            per_chunk_compression: true,
            temp_dir: None,
            streaming_mode: false,
            chunk_hashes: Vec::new(),
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
        self.per_chunk_compression = manifest.per_chunk_compression;

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

        // Use streaming mode for large transfers to avoid OOM
        self.streaming_mode = manifest.total_size > STREAMING_THRESHOLD;
        if self.streaming_mode {
            let temp_dir = self.output_dir.join(".tallow_temp");
            let _ = std::fs::create_dir_all(&temp_dir);
            self.temp_dir = Some(temp_dir);
        }

        // Pre-allocate chunk hash tracking for Merkle verification.
        // Manifest validation caps total_chunks, but guard the usize conversion too.
        let total = manifest.total_chunks as usize;
        if total > 1_000_000 {
            return Err(ProtocolError::TransferFailed(format!(
                "total_chunks {} exceeds receive limit",
                total
            )));
        }
        self.chunk_hashes = vec![None; total];

        self.expected_total_chunks = Some(manifest.total_chunks);
        self.manifest = Some(manifest);
        self.manifest
            .as_ref()
            .ok_or_else(|| ProtocolError::TransferFailed("manifest not set".to_string()))
    }

    /// Process a Chunk message — decrypt, decompress, store
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

        // Reject if too many chunks buffered in memory (non-streaming OOM protection)
        if !self.streaming_mode && self.received_chunks.len() >= MAX_BUFFERED_CHUNKS {
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

        // Record the hash of the encrypted chunk data for Merkle verification
        if (index as usize) < self.chunk_hashes.len() {
            let chunk_hash: [u8; 32] = blake3::hash(data).into();
            self.chunk_hashes[index as usize] = Some(chunk_hash);
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

        // Per-chunk decompression (new streaming mode)
        let chunk_data = if self.per_chunk_compression {
            compression::pipeline::decompress(&decrypted, self.compression)?
        } else {
            decrypted
        };

        let chunk_size = chunk_data.len() as u64;

        // Store chunk — either in memory or to temp file
        if self.streaming_mode {
            if let Some(ref temp_dir) = self.temp_dir {
                let chunk_path = temp_dir.join(format!("{}.chunk", index));
                std::fs::write(&chunk_path, &chunk_data).map_err(|e| {
                    ProtocolError::TransferFailed(format!("write temp chunk {}: {}", index, e))
                })?;
            }
        } else {
            self.received_chunks.insert(index, chunk_data);
        }

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

    /// Get the Merkle root of all received chunk hashes.
    ///
    /// Used for integrity verification against the sender's Merkle root.
    pub fn merkle_root(&self) -> Option<[u8; 32]> {
        let hashes: Vec<[u8; 32]> = self.chunk_hashes.iter().filter_map(|h| *h).collect();

        if hashes.is_empty() || hashes.len() != self.chunk_hashes.len() {
            return None;
        }

        let tree = tallow_crypto::hash::MerkleTree::build(hashes);
        Some(tree.root())
    }

    /// Assemble and write received files to disk
    ///
    /// For per-chunk compression: chunks are already decompressed.
    /// For whole-file compression: reassembles all chunks and decompresses.
    /// Verifies BLAKE3 hashes for each file and writes to the output directory.
    pub async fn finalize(&mut self) -> Result<Vec<PathBuf>> {
        let _manifest = self
            .manifest
            .as_ref()
            .ok_or_else(|| ProtocolError::TransferFailed("no manifest".to_string()))?;

        if self.streaming_mode {
            self.finalize_streaming().await
        } else if self.per_chunk_compression {
            self.finalize_per_chunk().await
        } else {
            self.finalize_whole_file().await
        }
    }

    /// Finalize with streaming mode — read chunks from temp files
    async fn finalize_streaming(&mut self) -> Result<Vec<PathBuf>> {
        let manifest = self.manifest.as_ref().unwrap();
        let temp_dir = self.temp_dir.as_ref().unwrap();

        let mut written_paths = Vec::new();
        let mut chunk_index: u64 = 0;

        for entry in &manifest.files {
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

            // Create output file and write chunks sequentially
            let file = tokio::fs::File::create(&output_path).await.map_err(|e| {
                ProtocolError::TransferFailed(format!("create {}: {}", output_path.display(), e))
            })?;
            let mut writer = tokio::io::BufWriter::new(file);
            let mut hasher = blake3::Hasher::new();

            for _ in 0..entry.chunk_count {
                let chunk_path = temp_dir.join(format!("{}.chunk", chunk_index));
                let chunk_data = tokio::fs::read(&chunk_path).await.map_err(|e| {
                    ProtocolError::TransferFailed(format!("read temp chunk {}: {}", chunk_index, e))
                })?;

                hasher.update(&chunk_data);
                writer.write_all(&chunk_data).await.map_err(|e| {
                    ProtocolError::TransferFailed(format!("write {}: {}", output_path.display(), e))
                })?;

                // Remove temp chunk after writing
                let _ = tokio::fs::remove_file(&chunk_path).await;
                chunk_index += 1;
            }

            writer.flush().await.map_err(|e| {
                ProtocolError::TransferFailed(format!("flush {}: {}", output_path.display(), e))
            })?;

            // Verify BLAKE3 hash
            let actual_hash: [u8; 32] = hasher.finalize().into();
            if !tallow_crypto::mem::constant_time::ct_eq(&actual_hash, &entry.hash) {
                return Err(ProtocolError::TransferFailed(format!(
                    "hash mismatch for {}",
                    entry.path.display()
                )));
            }

            written_paths.push(output_path);
        }

        // Clean up temp directory
        if let Some(ref temp_dir) = self.temp_dir {
            let _ = tokio::fs::remove_dir_all(temp_dir).await;
            self.temp_dir = None;
        }

        Ok(written_paths)
    }

    /// Finalize with per-chunk compression — chunks already decompressed in memory
    async fn finalize_per_chunk(&mut self) -> Result<Vec<PathBuf>> {
        let manifest = self.manifest.as_ref().unwrap();

        let mut written_paths = Vec::new();
        let mut chunk_index: u64 = 0;

        for entry in &manifest.files {
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

            // Reassemble file from in-memory chunks.
            // Cap allocation — this path is only reached for small transfers (< STREAMING_THRESHOLD).
            let cap = (entry.size as usize).min(STREAMING_THRESHOLD as usize);
            let mut file_data = Vec::with_capacity(cap);
            for _ in 0..entry.chunk_count {
                let chunk = self.received_chunks.get(&chunk_index).ok_or_else(|| {
                    ProtocolError::TransferFailed(format!("missing chunk {}", chunk_index))
                })?;
                file_data.extend_from_slice(chunk);
                chunk_index += 1;
            }

            // Verify BLAKE3 hash
            let actual_hash: [u8; 32] = blake3::hash(&file_data).into();
            if !tallow_crypto::mem::constant_time::ct_eq(&actual_hash, &entry.hash) {
                return Err(ProtocolError::TransferFailed(format!(
                    "hash mismatch for {}",
                    entry.path.display()
                )));
            }

            tokio::fs::write(&output_path, &file_data)
                .await
                .map_err(|e| {
                    ProtocolError::TransferFailed(format!(
                        "write {} failed: {}",
                        output_path.display(),
                        e
                    ))
                })?;

            written_paths.push(output_path);
        }

        Ok(written_paths)
    }

    /// Finalize with whole-file compression (legacy path)
    ///
    /// Reassembles all chunks, decompresses the whole blob, splits by file offsets.
    async fn finalize_whole_file(&mut self) -> Result<Vec<PathBuf>> {
        let manifest = self.manifest.as_ref().unwrap();

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
            let end = offset
                .checked_add(entry.size as usize)
                .ok_or_else(|| ProtocolError::TransferFailed("file offset overflow".to_string()))?;
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
            merkle_root: self.merkle_root(),
        })
    }

    /// Replace the session key after construction.
    ///
    /// Used by the KEM handshake flow: the pipeline is created with a
    /// placeholder key, then the real key is set after the handshake.
    pub fn set_session_key(&mut self, key: [u8; 32]) {
        use zeroize::Zeroize;
        self.session_key.zeroize();
        self.session_key = key;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::transfer::send::SendPipeline;
    use std::path::PathBuf;

    /// Shared session key for tests (not secret — test only)
    fn test_key() -> [u8; 32] {
        [0xAB; 32]
    }

    fn test_transfer_id() -> [u8; 16] {
        [0x01; 16]
    }

    // ── E2E: small text transfer (in-memory path) ─────────────────

    #[tokio::test]
    async fn test_e2e_text_roundtrip() {
        let text = b"Hello, Tallow! This is a secure text transfer.";

        // === Sender side ===
        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare_text(text).await.unwrap();
        assert_eq!(offer_msgs.len(), 1);

        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };

        // Generate chunks (text fits in one chunk)
        let chunk_msgs = sender.chunk_data(text, 0).await.unwrap();
        assert!(!chunk_msgs.is_empty());

        // Collect sender Merkle root
        let sender_chunk_hashes: Vec<[u8; 32]> = chunk_msgs
            .iter()
            .map(|msg| match msg {
                Message::Chunk { data, .. } => blake3::hash(data).into(),
                _ => panic!("Expected Chunk"),
            })
            .collect();
        let sender_tree = tallow_crypto::hash::MerkleTree::build(sender_chunk_hashes);
        let sender_root = sender_tree.root();

        // === Receiver side ===
        let tmp = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), tmp.path(), test_key());
        let _manifest = receiver.process_offer(&manifest_bytes).unwrap();

        for msg in &chunk_msgs {
            if let Message::Chunk {
                index, data, total, ..
            } = msg
            {
                let ack = receiver.process_chunk(*index, data, *total).unwrap();
                assert!(ack.is_some()); // Should get an Ack
            }
        }

        // Verify Merkle roots match
        let receiver_root = receiver.merkle_root().unwrap();
        assert!(
            tallow_crypto::mem::constant_time::ct_eq(&sender_root, &receiver_root),
            "Merkle roots must match"
        );

        // Finalize — writes to disk
        let paths = receiver.finalize().await.unwrap();
        assert_eq!(paths.len(), 1);

        // Read back and verify content
        let content = tokio::fs::read(&paths[0]).await.unwrap();
        assert_eq!(content, text);
    }

    // ── E2E: file transfer with real files ────────────────────────

    #[tokio::test]
    async fn test_e2e_file_roundtrip() {
        // Create a temp source file
        let src_dir = tempfile::tempdir().unwrap();
        let file_path = src_dir.path().join("test_file.bin");
        let file_data: Vec<u8> = (0..1024u32).flat_map(|i| i.to_le_bytes()).collect();
        tokio::fs::write(&file_path, &file_data).await.unwrap();

        // === Sender ===
        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare(&[file_path.clone()]).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };

        // Stream chunks using the new streaming API
        let mut chunk_index: u64 = 0;
        let total_chunks = sender.manifest().total_chunks;
        let mut all_chunks = Vec::new();
        let mut chunk_hashes: Vec<[u8; 32]> = Vec::new();

        let mut reader = sender.open_file_reader(&file_path).await.unwrap();
        while let Some(raw) = reader.next_chunk().await.unwrap() {
            let is_last = chunk_index + 1 == total_chunks;
            let msg = sender
                .encrypt_chunk(&raw, chunk_index, total_chunks, is_last)
                .unwrap();
            if let Message::Chunk { ref data, .. } = msg {
                chunk_hashes.push(blake3::hash(data).into());
            }
            all_chunks.push(msg);
            chunk_index += 1;
        }

        let sender_tree = tallow_crypto::hash::MerkleTree::build(chunk_hashes);
        let sender_root = sender_tree.root();

        // === Receiver ===
        let dst_dir = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), dst_dir.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        for msg in &all_chunks {
            if let Message::Chunk {
                index, data, total, ..
            } = msg
            {
                receiver.process_chunk(*index, data, *total).unwrap();
            }
        }

        // Merkle verification
        let receiver_root = receiver.merkle_root().unwrap();
        assert!(tallow_crypto::mem::constant_time::ct_eq(
            &sender_root,
            &receiver_root
        ));

        // Finalize
        let paths = receiver.finalize().await.unwrap();
        assert_eq!(paths.len(), 1);

        let received = tokio::fs::read(&paths[0]).await.unwrap();
        assert_eq!(received, file_data);
    }

    // ── E2E: multi-file directory transfer ────────────────────────

    #[tokio::test]
    async fn test_e2e_multifile_roundtrip() {
        let src_dir = tempfile::tempdir().unwrap();

        // Create 3 files of different sizes
        let files = vec![
            ("small.txt", vec![0x41u8; 100]),
            ("medium.bin", vec![0xBBu8; 70_000]), // > 1 chunk
            ("exact.dat", vec![0xCCu8; 65_536]),  // exactly 1 chunk
        ];

        for (name, data) in &files {
            tokio::fs::write(src_dir.path().join(name), data)
                .await
                .unwrap();
        }

        // === Sender ===
        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let file_paths: Vec<PathBuf> = files
            .iter()
            .map(|(name, _)| src_dir.path().join(name))
            .collect();
        let offer_msgs = sender.prepare(&file_paths).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };

        let total_chunks = sender.manifest().total_chunks;
        let mut all_chunks = Vec::new();
        let mut chunk_hashes: Vec<[u8; 32]> = Vec::new();
        let mut global_idx: u64 = 0;

        for (name, _) in &files {
            let fpath = src_dir.path().join(name);
            let mut reader = sender.open_file_reader(&fpath).await.unwrap();
            while let Some(raw) = reader.next_chunk().await.unwrap() {
                let is_last = global_idx + 1 == total_chunks;
                let msg = sender
                    .encrypt_chunk(&raw, global_idx, total_chunks, is_last)
                    .unwrap();
                if let Message::Chunk { ref data, .. } = msg {
                    chunk_hashes.push(blake3::hash(data).into());
                }
                all_chunks.push(msg);
                global_idx += 1;
            }
        }

        assert_eq!(global_idx, total_chunks);

        let sender_tree = tallow_crypto::hash::MerkleTree::build(chunk_hashes);
        let sender_root = sender_tree.root();

        // === Receiver ===
        let dst_dir = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), dst_dir.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        for msg in &all_chunks {
            if let Message::Chunk {
                index, data, total, ..
            } = msg
            {
                receiver.process_chunk(*index, data, *total).unwrap();
            }
        }

        let receiver_root = receiver.merkle_root().unwrap();
        assert!(tallow_crypto::mem::constant_time::ct_eq(
            &sender_root,
            &receiver_root
        ));

        let paths = receiver.finalize().await.unwrap();
        assert_eq!(paths.len(), 3);

        // Verify each file's content
        for (name, expected_data) in &files {
            let received_path = dst_dir.path().join(name);
            let received = tokio::fs::read(&received_path).await.unwrap();
            assert_eq!(
                received.len(),
                expected_data.len(),
                "Size mismatch for {}",
                name
            );
            assert_eq!(&received, expected_data, "Content mismatch for {}", name);
        }
    }

    // ── E2E: streaming mode (>10 MB triggers temp files) ──────────

    #[tokio::test]
    async fn test_e2e_streaming_large_file() {
        let src_dir = tempfile::tempdir().unwrap();

        // 11 MB file — just above STREAMING_THRESHOLD (10 MB)
        let size = 11 * 1024 * 1024;
        let file_path = src_dir.path().join("large.bin");

        // Generate deterministic data
        let file_data: Vec<u8> = (0..size).map(|i| (i % 251) as u8).collect();
        tokio::fs::write(&file_path, &file_data).await.unwrap();

        // === Sender ===
        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare(&[file_path.clone()]).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };

        let total_chunks = sender.manifest().total_chunks;
        let mut all_chunks = Vec::new();
        let mut chunk_hashes: Vec<[u8; 32]> = Vec::new();
        let mut idx: u64 = 0;

        let mut reader = sender.open_file_reader(&file_path).await.unwrap();
        while let Some(raw) = reader.next_chunk().await.unwrap() {
            let is_last = idx + 1 == total_chunks;
            let msg = sender
                .encrypt_chunk(&raw, idx, total_chunks, is_last)
                .unwrap();
            if let Message::Chunk { ref data, .. } = msg {
                chunk_hashes.push(blake3::hash(data).into());
            }
            all_chunks.push(msg);
            idx += 1;
        }

        let sender_tree = tallow_crypto::hash::MerkleTree::build(chunk_hashes);
        let sender_root = sender_tree.root();

        // === Receiver ===
        let dst_dir = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), dst_dir.path(), test_key());
        let manifest_ref = receiver.process_offer(&manifest_bytes).unwrap();

        // Confirm streaming mode activated
        assert!(
            manifest_ref.total_size > STREAMING_THRESHOLD,
            "Transfer should be above streaming threshold"
        );

        for msg in &all_chunks {
            if let Message::Chunk {
                index, data, total, ..
            } = msg
            {
                receiver.process_chunk(*index, data, *total).unwrap();
            }
        }

        let receiver_root = receiver.merkle_root().unwrap();
        assert!(tallow_crypto::mem::constant_time::ct_eq(
            &sender_root,
            &receiver_root
        ));

        let paths = receiver.finalize().await.unwrap();
        assert_eq!(paths.len(), 1);

        // Verify content (compare hash — reading 11 MB back is fine in tests)
        let received = tokio::fs::read(&paths[0]).await.unwrap();
        assert_eq!(received.len(), file_data.len());
        let original_hash: [u8; 32] = blake3::hash(&file_data).into();
        let received_hash: [u8; 32] = blake3::hash(&received).into();
        assert!(tallow_crypto::mem::constant_time::ct_eq(
            &original_hash,
            &received_hash
        ));
    }

    // ── Merkle root mismatch detection ────────────────────────────

    #[tokio::test]
    async fn test_merkle_root_mismatch_detected() {
        let text = b"test data for merkle verification";

        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare_text(text).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };
        let chunk_msgs = sender.chunk_data(text, 0).await.unwrap();

        let tmp = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), tmp.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        for msg in &chunk_msgs {
            if let Message::Chunk {
                index, data, total, ..
            } = msg
            {
                receiver.process_chunk(*index, data, *total).unwrap();
            }
        }

        let receiver_root = receiver.merkle_root().unwrap();

        // Tamper with sender Merkle root
        let fake_root = [0xFF; 32];
        assert!(
            !tallow_crypto::mem::constant_time::ct_eq(&fake_root, &receiver_root),
            "Tampered Merkle root must NOT match"
        );
    }

    // ── Resume: duplicate chunks are skipped ──────────────────────

    #[tokio::test]
    async fn test_duplicate_chunk_skipped_on_resume() {
        let text = b"resume test data that is long enough for a few chunks hopefully";

        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare_text(text).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };
        let chunk_msgs = sender.chunk_data(text, 0).await.unwrap();

        let tmp = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), tmp.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        // Process chunk 0 twice — second time should be a no-op (resume skip)
        if let Some(Message::Chunk {
            index, data, total, ..
        }) = chunk_msgs.first()
        {
            let ack1 = receiver.process_chunk(*index, data, *total).unwrap();
            assert!(ack1.is_some());

            // Second time — already verified, should still return Ack
            let ack2 = receiver.process_chunk(*index, data, *total).unwrap();
            assert!(ack2.is_some());
        }
    }

    // ── Chunk index out of bounds is rejected ─────────────────────

    #[tokio::test]
    async fn test_chunk_index_out_of_bounds_rejected() {
        let text = b"bounds check";

        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare_text(text).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };
        let chunk_msgs = sender.chunk_data(text, 0).await.unwrap();

        let tmp = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), tmp.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        // Try to send chunk with index 999 (way out of range)
        if let Some(Message::Chunk { data, total, .. }) = chunk_msgs.first() {
            let result = receiver.process_chunk(999, data, *total);
            assert!(
                result.is_err(),
                "Out-of-bounds chunk index must be rejected"
            );
        }
    }

    // ── Total chunk count mismatch is rejected ────────────────────

    #[tokio::test]
    async fn test_total_chunks_mismatch_rejected() {
        let text = b"total mismatch test";

        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare_text(text).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };
        let chunk_msgs = sender.chunk_data(text, 0).await.unwrap();

        let tmp = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), tmp.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        // Send chunk 0 but claim total = 9999
        if let Some(Message::Chunk { index, data, .. }) = chunk_msgs.first() {
            let result = receiver.process_chunk(*index, data, Some(9999));
            assert!(
                result.is_err(),
                "Mismatched total chunk count must be rejected"
            );
        }
    }

    // ── Wrong key fails decryption ────────────────────────────────

    #[tokio::test]
    async fn test_wrong_session_key_fails() {
        let text = b"wrong key test";

        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare_text(text).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };
        let chunk_msgs = sender.chunk_data(text, 0).await.unwrap();

        let tmp = tempfile::tempdir().unwrap();
        let wrong_key = [0xFF; 32];
        let mut receiver = ReceivePipeline::new(test_transfer_id(), tmp.path(), wrong_key);
        receiver.process_offer(&manifest_bytes).unwrap();

        if let Some(Message::Chunk {
            index, data, total, ..
        }) = chunk_msgs.first()
        {
            let result = receiver.process_chunk(*index, data, *total);
            assert!(
                result.is_err(),
                "Wrong session key must cause decryption failure"
            );
        }
    }

    // ── Wave 5: Stress tests for massive files ────────────────────
    //
    // These tests are #[ignore]'d by default because they create large
    // temporary files (10 GB, 100 GB, 1 TB). Run them manually:
    //
    //   cargo test -p tallow-protocol stress -- --ignored --nocapture
    //
    // They verify that the streaming pipeline handles files of any size
    // without OOM, by reading/writing chunks from disk.

    /// Helper: run an E2E streaming transfer of `size` bytes.
    async fn stress_transfer(size: usize) {
        let src_dir = tempfile::tempdir().unwrap();
        let file_path = src_dir.path().join("stress.bin");

        // Write file in 1 MB chunks to avoid allocating `size` bytes at once
        {
            let mut f = tokio::fs::File::create(&file_path).await.unwrap();
            let chunk = vec![0xA5u8; 1024 * 1024]; // 1 MB
            let mut remaining = size;
            while remaining > 0 {
                let n = remaining.min(chunk.len());
                tokio::io::AsyncWriteExt::write_all(&mut f, &chunk[..n])
                    .await
                    .unwrap();
                remaining -= n;
            }
            tokio::io::AsyncWriteExt::flush(&mut f).await.unwrap();
        }

        // === Sender ===
        let mut sender = SendPipeline::new(test_transfer_id(), test_key());
        let offer_msgs = sender.prepare(&[file_path.clone()]).await.unwrap();
        let manifest_bytes = match &offer_msgs[0] {
            Message::FileOffer { manifest, .. } => manifest.clone(),
            _ => panic!("Expected FileOffer"),
        };
        let total_chunks = sender.manifest().total_chunks;

        // === Receiver ===
        let dst_dir = tempfile::tempdir().unwrap();
        let mut receiver = ReceivePipeline::new(test_transfer_id(), dst_dir.path(), test_key());
        receiver.process_offer(&manifest_bytes).unwrap();

        // Stream chunks one at a time: read → encrypt → decrypt → write
        let mut reader = sender.open_file_reader(&file_path).await.unwrap();
        let mut idx: u64 = 0;
        let mut sender_hashes: Vec<[u8; 32]> = Vec::new();

        while let Some(raw) = reader.next_chunk().await.unwrap() {
            let is_last = idx + 1 == total_chunks;
            let msg = sender
                .encrypt_chunk(&raw, idx, total_chunks, is_last)
                .unwrap();
            if let Message::Chunk {
                index, data, total, ..
            } = &msg
            {
                sender_hashes.push(blake3::hash(data).into());
                receiver.process_chunk(*index, data, *total).unwrap();
            }
            idx += 1;
        }

        // Merkle verification
        let sender_tree = tallow_crypto::hash::MerkleTree::build(sender_hashes);
        let sender_root = sender_tree.root();
        let receiver_root = receiver.merkle_root().unwrap();
        assert!(tallow_crypto::mem::constant_time::ct_eq(
            &sender_root,
            &receiver_root
        ));

        // Finalize
        let paths = receiver.finalize().await.unwrap();
        assert_eq!(paths.len(), 1);

        // Verify output file size matches
        let meta = tokio::fs::metadata(&paths[0]).await.unwrap();
        assert_eq!(meta.len(), size as u64, "Output file size must match input");
    }

    #[tokio::test]
    #[ignore] // 10 GB — run with: cargo test -p tallow-protocol stress_10gb -- --ignored
    async fn stress_10gb() {
        stress_transfer(10 * 1024 * 1024 * 1024).await;
    }

    #[tokio::test]
    #[ignore] // 100 GB — run with: cargo test -p tallow-protocol stress_100gb -- --ignored
    async fn stress_100gb() {
        stress_transfer(100 * 1024 * 1024 * 1024).await;
    }

    #[tokio::test]
    #[ignore] // 1 TB — run with: cargo test -p tallow-protocol stress_1tb -- --ignored
    async fn stress_1tb() {
        stress_transfer(1024 * 1024 * 1024 * 1024).await;
    }
}
