//! File transfer state machine for WASM
//!
//! Handles chunk encryption/decryption with AES-256-GCM using the SAME
//! AAD and nonce construction as the CLI (see `tallow-protocol/src/transfer/chunking.rs`).
//!
//! AAD = transfer_id (16 bytes) || chunk_index (8 bytes BE)
//! Nonce = [0u8; 4] || chunk_index.to_be_bytes() (12 bytes total)

use tallow_protocol::wire::Message;
use wasm_bindgen::prelude::*;

/// File transfer session with chunk encryption/decryption.
///
/// Owns the session key and transfer ID. Provides methods to prepare
/// encrypted chunks for sending and decrypt received chunks.
///
/// CRITICAL: The AAD and nonce construction here MUST match the CLI exactly.
/// See `crates/tallow-protocol/src/transfer/chunking.rs`:
/// - `build_chunk_aad(transfer_id, chunk_index)` = transfer_id || index.to_be_bytes()
/// - `build_chunk_nonce(chunk_index)` = [0u8; 4] || index.to_be_bytes()
#[wasm_bindgen]
pub struct TransferSession {
    session_key: [u8; 32],
    transfer_id: [u8; 16],
    chunk_index: u64,
}

#[wasm_bindgen]
impl TransferSession {
    /// Create a new transfer session.
    ///
    /// * `session_key` - 32-byte session key derived from KEM handshake
    /// * `transfer_id` - 16-byte random transfer identifier
    #[wasm_bindgen(constructor)]
    pub fn new(session_key: &[u8], transfer_id: &[u8]) -> Result<TransferSession, JsValue> {
        let key: [u8; 32] = session_key
            .try_into()
            .map_err(|_| JsValue::from_str("session_key must be exactly 32 bytes"))?;
        let tid: [u8; 16] = transfer_id
            .try_into()
            .map_err(|_| JsValue::from_str("transfer_id must be exactly 16 bytes"))?;
        Ok(TransferSession {
            session_key: key,
            transfer_id: tid,
            chunk_index: 0,
        })
    }

    /// Prepare a FileOffer message.
    ///
    /// * `manifest_bytes` - Postcard-encoded manifest (from `compute_file_manifest`)
    ///
    /// Returns postcard-encoded FileOffer message bytes.
    #[wasm_bindgen(js_name = "prepareFileOffer")]
    pub fn prepare_file_offer(&self, manifest_bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
        let msg = Message::FileOffer {
            transfer_id: self.transfer_id,
            manifest: manifest_bytes.to_vec(),
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode FileOffer: {}", e)))
    }

    /// Encrypt a chunk and encode it as a Chunk wire message.
    ///
    /// * `index` - 0-based chunk index (global across all files)
    /// * `total` - Total chunk count (set on final chunk, None otherwise)
    /// * `plaintext` - Raw chunk data (up to 64KB)
    ///
    /// The AAD binds transfer_id + chunk_index to prevent reordering attacks.
    /// The nonce is counter-based: [0u8; 4] || index.to_be_bytes().
    ///
    /// Returns postcard-encoded Chunk message with encrypted data.
    #[wasm_bindgen(js_name = "prepareChunk")]
    pub fn prepare_chunk(
        &mut self,
        index: u64,
        total: Option<u64>,
        plaintext: &[u8],
    ) -> Result<Vec<u8>, JsValue> {
        // Build AAD: transfer_id || chunk_index (matches CLI exactly)
        let aad = build_chunk_aad(&self.transfer_id, index);
        // Build nonce: [0u8; 4] || index.to_be_bytes() (matches CLI exactly)
        let nonce = build_chunk_nonce(index);

        // Encrypt with AES-256-GCM
        let encrypted =
            tallow_crypto::symmetric::aes_encrypt(&self.session_key, &nonce, plaintext, &aad)
                .map_err(|e| JsValue::from_str(&format!("chunk encryption failed: {}", e)))?;

        // Update internal index tracker
        self.chunk_index = index + 1;

        // Encode as Chunk message
        let msg = Message::Chunk {
            transfer_id: self.transfer_id,
            index,
            total,
            data: encrypted,
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode Chunk: {}", e)))
    }

    /// Decrypt a chunk from a received Chunk message.
    ///
    /// * `index` - The chunk index from the Chunk message
    /// * `encrypted_data` - The `data` field from the Chunk message
    ///
    /// Returns decrypted plaintext bytes.
    #[wasm_bindgen(js_name = "decryptChunk")]
    pub fn decrypt_chunk(
        &mut self,
        index: u64,
        encrypted_data: &[u8],
    ) -> Result<Vec<u8>, JsValue> {
        // Build AAD and nonce identically to encryption
        let aad = build_chunk_aad(&self.transfer_id, index);
        let nonce = build_chunk_nonce(index);

        // Decrypt with AES-256-GCM
        let plaintext =
            tallow_crypto::symmetric::aes_decrypt(&self.session_key, &nonce, encrypted_data, &aad)
                .map_err(|e| JsValue::from_str(&format!("chunk decryption failed: {}", e)))?;

        // Update internal index tracker
        self.chunk_index = index + 1;

        Ok(plaintext)
    }

    /// Prepare an Ack message for a received chunk.
    ///
    /// * `index` - The chunk index to acknowledge
    #[wasm_bindgen(js_name = "prepareAck")]
    pub fn prepare_ack(&self, index: u64) -> Result<Vec<u8>, JsValue> {
        let msg = Message::Ack {
            transfer_id: self.transfer_id,
            index,
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode Ack: {}", e)))
    }

    /// Prepare a TransferComplete message.
    ///
    /// * `hash` - 32-byte BLAKE3 hash of the complete transfer
    /// * `merkle_root` - Optional 32-byte Merkle root of chunk hashes
    #[wasm_bindgen(js_name = "prepareTransferComplete")]
    pub fn prepare_transfer_complete(
        &self,
        hash: &[u8],
        merkle_root: Option<Vec<u8>>,
    ) -> Result<Vec<u8>, JsValue> {
        let h: [u8; 32] = hash
            .try_into()
            .map_err(|_| JsValue::from_str("hash must be exactly 32 bytes"))?;
        let mr = match merkle_root {
            Some(ref bytes) => {
                let arr: [u8; 32] = bytes
                    .as_slice()
                    .try_into()
                    .map_err(|_| JsValue::from_str("merkle_root must be exactly 32 bytes"))?;
                Some(arr)
            }
            None => None,
        };
        let msg = Message::TransferComplete {
            transfer_id: self.transfer_id,
            hash: h,
            merkle_root: mr,
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode TransferComplete: {}", e)))
    }

    /// Prepare a FileAccept message.
    #[wasm_bindgen(js_name = "prepareFileAccept")]
    pub fn prepare_file_accept(&self) -> Result<Vec<u8>, JsValue> {
        let msg = Message::FileAccept {
            transfer_id: self.transfer_id,
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode FileAccept: {}", e)))
    }

    /// Prepare a FileReject message.
    ///
    /// * `reason` - Reason for rejection
    #[wasm_bindgen(js_name = "prepareFileReject")]
    pub fn prepare_file_reject(&self, reason: &str) -> Result<Vec<u8>, JsValue> {
        let msg = Message::FileReject {
            transfer_id: self.transfer_id,
            reason: reason.to_string(),
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode FileReject: {}", e)))
    }

    /// Get the current chunk index (for progress tracking).
    #[wasm_bindgen(js_name = "currentChunkIndex")]
    pub fn current_chunk_index(&self) -> u64 {
        self.chunk_index
    }

    /// Get the transfer ID.
    #[wasm_bindgen(js_name = "transferId")]
    pub fn transfer_id(&self) -> Vec<u8> {
        self.transfer_id.to_vec()
    }
}

// ---------------------------------------------------------------------------
// AAD and nonce construction — MUST match CLI exactly
// See: crates/tallow-protocol/src/transfer/chunking.rs
// ---------------------------------------------------------------------------

/// Build AAD (Additional Authenticated Data) for a chunk.
///
/// Format: transfer_id (16 bytes) || chunk_index (8 bytes big-endian)
///
/// This binds the chunk to a specific transfer and position,
/// preventing reordering attacks.
fn build_chunk_aad(transfer_id: &[u8; 16], chunk_index: u64) -> Vec<u8> {
    let mut aad = Vec::with_capacity(24);
    aad.extend_from_slice(transfer_id);
    aad.extend_from_slice(&chunk_index.to_be_bytes());
    aad
}

/// Build a counter-based nonce for AES-256-GCM.
///
/// Format: [0u8; 4] || chunk_index.to_be_bytes() (12 bytes total)
///
/// Guarantees uniqueness: each chunk gets a different nonce.
fn build_chunk_nonce(chunk_index: u64) -> [u8; 12] {
    let mut nonce = [0u8; 12];
    nonce[4..12].copy_from_slice(&chunk_index.to_be_bytes());
    nonce
}
