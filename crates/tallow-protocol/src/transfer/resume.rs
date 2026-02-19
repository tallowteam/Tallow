//! Transfer resume state
//!
//! Saves and restores transfer progress for resuming interrupted transfers.

use crate::{ProtocolError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// Resume state for interrupted transfers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResumeState {
    /// Transfer ID
    pub transfer_id: [u8; 16],
    /// Set of chunk indices that have been verified
    pub verified_chunks: HashSet<u64>,
    /// Total expected chunks
    pub total_chunks: u64,
    /// Bytes successfully transferred
    pub bytes_transferred: u64,
    /// BLAKE3 hash of the manifest (to verify same transfer)
    pub manifest_hash: [u8; 32],
}

impl ResumeState {
    /// Create a new resume state for a transfer
    pub fn new(transfer_id: [u8; 16], total_chunks: u64, manifest_hash: [u8; 32]) -> Self {
        Self {
            transfer_id,
            verified_chunks: HashSet::new(),
            total_chunks,
            bytes_transferred: 0,
            manifest_hash,
        }
    }

    /// Mark a chunk as verified
    pub fn mark_verified(&mut self, chunk_index: u64, chunk_size: u64) {
        self.verified_chunks.insert(chunk_index);
        self.bytes_transferred += chunk_size;
    }

    /// Check if a chunk has been verified
    pub fn is_verified(&self, chunk_index: u64) -> bool {
        self.verified_chunks.contains(&chunk_index)
    }

    /// Get the next chunk index that needs to be transferred
    pub fn next_needed_chunk(&self) -> Option<u64> {
        for i in 0..self.total_chunks {
            if !self.verified_chunks.contains(&i) {
                return Some(i);
            }
        }
        None
    }

    /// Get completion percentage
    pub fn completion_percentage(&self) -> f64 {
        if self.total_chunks == 0 {
            return 0.0;
        }
        (self.verified_chunks.len() as f64 / self.total_chunks as f64) * 100.0
    }

    /// Serialize to bytes for checkpoint
    pub fn checkpoint(&self) -> Result<Vec<u8>> {
        postcard::to_stdvec(self)
            .map_err(|e| ProtocolError::EncodingError(format!("checkpoint encode failed: {}", e)))
    }

    /// Restore from checkpoint bytes
    pub fn restore(data: &[u8]) -> Result<Self> {
        postcard::from_bytes(data)
            .map_err(|e| ProtocolError::DecodingError(format!("checkpoint decode failed: {}", e)))
    }

    /// Check if transfer is complete
    pub fn is_complete(&self) -> bool {
        self.verified_chunks.len() as u64 >= self.total_chunks
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resume_state_basic() {
        let mut state = ResumeState::new([1u8; 16], 10, [0u8; 32]);
        assert_eq!(state.completion_percentage(), 0.0);
        assert_eq!(state.next_needed_chunk(), Some(0));

        state.mark_verified(0, 1024);
        assert!(state.is_verified(0));
        assert!(!state.is_verified(1));
        assert_eq!(state.next_needed_chunk(), Some(1));
    }

    #[test]
    fn test_resume_state_complete() {
        let mut state = ResumeState::new([1u8; 16], 3, [0u8; 32]);
        state.mark_verified(0, 100);
        state.mark_verified(1, 100);
        state.mark_verified(2, 100);
        assert!(state.is_complete());
        assert_eq!(state.next_needed_chunk(), None);
    }

    #[test]
    fn test_resume_checkpoint_roundtrip() {
        let mut state = ResumeState::new([1u8; 16], 10, [42u8; 32]);
        state.mark_verified(0, 1024);
        state.mark_verified(3, 1024);

        let bytes = state.checkpoint().unwrap();
        let restored = ResumeState::restore(&bytes).unwrap();

        assert_eq!(restored.transfer_id, state.transfer_id);
        assert!(restored.is_verified(0));
        assert!(restored.is_verified(3));
        assert!(!restored.is_verified(1));
    }
}
