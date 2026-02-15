//! Transfer resume state

use serde::{Deserialize, Serialize};
use crate::Result;

/// Resume state for interrupted transfers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResumeState {
    /// Transfer ID
    pub transfer_id: String,
    /// Chunks received
    pub chunks_received: Vec<u64>,
    /// Total chunks
    pub total_chunks: u64,
    /// Bytes transferred
    pub bytes_transferred: u64,
}

impl ResumeState {
    /// Create checkpoint of current transfer state
    pub fn checkpoint(_transfer_id: String) -> Result<Self> {
        todo!("Implement checkpoint creation")
    }

    /// Restore transfer from checkpoint
    pub fn restore(_data: &[u8]) -> Result<Self> {
        todo!("Implement checkpoint restoration")
    }

    /// Get completion percentage
    pub fn completion_percentage(&self) -> f64 {
        if self.total_chunks == 0 {
            return 0.0;
        }
        (self.chunks_received.len() as f64 / self.total_chunks as f64) * 100.0
    }
}
