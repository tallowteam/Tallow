//! Transfer history log with file persistence

use crate::persistence::paths;
use crate::Result;
use crate::StoreError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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
    /// Timestamp (seconds since epoch)
    pub timestamp: u64,
    /// Status
    pub status: TransferStatus,
    /// File names transferred
    pub filenames: Vec<String>,
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

/// Transfer history log with optional file persistence
#[derive(Debug)]
pub struct TransferLog {
    entries: Vec<TransferEntry>,
    path: Option<PathBuf>,
}

impl TransferLog {
    /// Create a new in-memory transfer log
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            path: None,
        }
    }

    /// Open a persistent transfer log at the default path
    pub fn open() -> Result<Self> {
        Self::open_at(paths::history_file())
    }

    /// Open a persistent transfer log at a custom path
    pub fn open_at(path: PathBuf) -> Result<Self> {
        let mut log = Self {
            entries: Vec::new(),
            path: Some(path),
        };

        if let Some(ref p) = log.path {
            if p.exists() {
                let data = std::fs::read_to_string(p)?;
                log.entries = serde_json::from_str(&data).map_err(|e| {
                    StoreError::SerializationError(format!("Failed to parse history: {}", e))
                })?;
            }
        }

        Ok(log)
    }

    /// Append an entry and persist
    pub fn append(&mut self, entry: TransferEntry) -> Result<()> {
        self.entries.push(entry);
        self.save()
    }

    /// Query all entries
    pub fn query(&self) -> &[TransferEntry] {
        &self.entries
    }

    /// Query entries by direction
    pub fn query_by_direction(&self, direction: TransferDirection) -> Vec<&TransferEntry> {
        self.entries
            .iter()
            .filter(|e| {
                matches!(
                    (&e.direction, &direction),
                    (TransferDirection::Sent, TransferDirection::Sent)
                        | (TransferDirection::Received, TransferDirection::Received)
                )
            })
            .collect()
    }

    /// Get the most recent N entries
    pub fn recent(&self, count: usize) -> &[TransferEntry] {
        let start = self.entries.len().saturating_sub(count);
        &self.entries[start..]
    }

    /// Clear all history and persist
    pub fn clear(&mut self) -> Result<()> {
        self.entries.clear();
        self.save()
    }

    /// Save to disk if persistent
    fn save(&self) -> Result<()> {
        if let Some(ref path) = self.path {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let data = serde_json::to_string_pretty(&self.entries).map_err(|e| {
                StoreError::SerializationError(format!("Failed to serialize history: {}", e))
            })?;
            std::fs::write(path, &data)?;

            // Restrict file permissions to owner-only on Unix (0o600)
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let perms = std::fs::Permissions::from_mode(0o600);
                let _ = std::fs::set_permissions(path, perms);
            }
        }
        Ok(())
    }
}

impl Default for TransferLog {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn test_entry() -> TransferEntry {
        TransferEntry {
            id: "test-001".to_string(),
            peer_id: "peer-abc".to_string(),
            direction: TransferDirection::Sent,
            file_count: 1,
            total_bytes: 1024,
            timestamp: 1708300000,
            status: TransferStatus::Completed,
            filenames: vec!["test.txt".to_string()],
        }
    }

    #[test]
    fn test_append_and_query() {
        let mut log = TransferLog::new();
        log.append(test_entry()).unwrap();
        assert_eq!(log.query().len(), 1);
    }

    #[test]
    fn test_persistence() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("history.json");

        {
            let mut log = TransferLog::open_at(path.clone()).unwrap();
            log.append(test_entry()).unwrap();
        }

        {
            let log = TransferLog::open_at(path).unwrap();
            assert_eq!(log.query().len(), 1);
            assert_eq!(log.query()[0].id, "test-001");
        }
    }

    #[test]
    fn test_recent() {
        let mut log = TransferLog::new();
        for i in 0..10 {
            let mut entry = test_entry();
            entry.id = format!("test-{:03}", i);
            log.append(entry).unwrap();
        }

        let recent = log.recent(3);
        assert_eq!(recent.len(), 3);
        assert_eq!(recent[0].id, "test-007");
    }

    #[test]
    fn test_clear() {
        let mut log = TransferLog::new();
        log.append(test_entry()).unwrap();
        log.clear().unwrap();
        assert!(log.query().is_empty());
    }
}
