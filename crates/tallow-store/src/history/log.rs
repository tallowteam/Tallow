//! Transfer history log

use crate::Result;
use serde::{Deserialize, Serialize};

/// Transfer log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferEntry {
    /// Transfer ID
    pub id: String,
    /// Peer ID
    pub peer_id: String,
    /// Direction (sent/received)
    pub direction: TransferDirection,
    /// File count
    pub file_count: usize,
    /// Total bytes
    pub total_bytes: u64,
    /// Timestamp
    pub timestamp: u64,
    /// Status
    pub status: TransferStatus,
}

/// Transfer direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TransferDirection {
    /// Sent to peer
    Sent,
    /// Received from peer
    Received,
}

/// Transfer status
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TransferStatus {
    /// Completed successfully
    Completed,
    /// Failed
    Failed,
    /// Cancelled
    Cancelled,
}

/// Transfer history log
#[derive(Debug)]
pub struct TransferLog {
    entries: Vec<TransferEntry>,
}

impl TransferLog {
    /// Create a new transfer log
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    /// Append an entry
    pub fn append(&mut self, entry: TransferEntry) -> Result<()> {
        self.entries.push(entry);
        Ok(())
    }

    /// Query entries
    pub fn query(&self) -> &[TransferEntry] {
        &self.entries
    }
}

impl Default for TransferLog {
    fn default() -> Self {
        Self::new()
    }
}
