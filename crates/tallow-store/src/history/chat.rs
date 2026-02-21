//! Chat session history with file persistence

use crate::persistence::paths;
use crate::Result;
use crate::StoreError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// A stored chat session record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatHistoryEntry {
    /// Session identifier (hex-encoded random bytes)
    pub session_id: String,
    /// Messages exchanged in this session
    pub messages: Vec<StoredChatMessage>,
    /// Unix timestamp when chat started
    pub started_at: u64,
    /// Unix timestamp when chat ended
    pub ended_at: u64,
}

/// A single stored chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredChatMessage {
    /// "local" or "peer"
    pub sender: String,
    /// Plaintext message content
    pub text: String,
    /// Unix timestamp
    pub timestamp: u64,
}

/// Chat history log with optional file persistence
#[derive(Debug)]
pub struct ChatLog {
    entries: Vec<ChatHistoryEntry>,
    path: Option<PathBuf>,
}

impl ChatLog {
    /// Create a new in-memory chat log
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            path: None,
        }
    }

    /// Open a persistent chat log at the default path
    pub fn open() -> Result<Self> {
        Self::open_at(paths::chat_history_file())
    }

    /// Open a persistent chat log at a custom path
    pub fn open_at(path: PathBuf) -> Result<Self> {
        let mut log = Self {
            entries: Vec::new(),
            path: Some(path),
        };

        if let Some(ref p) = log.path {
            if p.exists() {
                let data = std::fs::read_to_string(p)?;
                log.entries = serde_json::from_str(&data).map_err(|e| {
                    StoreError::SerializationError(format!("Failed to parse chat history: {}", e))
                })?;
            }
        }

        Ok(log)
    }

    /// Append an entry and persist
    pub fn append(&mut self, entry: ChatHistoryEntry) -> Result<()> {
        self.entries.push(entry);
        self.save()
    }

    /// Query all entries
    pub fn query(&self) -> &[ChatHistoryEntry] {
        &self.entries
    }

    /// Get the most recent N entries
    pub fn recent(&self, count: usize) -> &[ChatHistoryEntry] {
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
                StoreError::SerializationError(format!("Failed to serialize chat history: {}", e))
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

impl Default for ChatLog {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn test_entry() -> ChatHistoryEntry {
        ChatHistoryEntry {
            session_id: "abc123".to_string(),
            messages: vec![
                StoredChatMessage {
                    sender: "local".to_string(),
                    text: "hello".to_string(),
                    timestamp: 1708300000,
                },
                StoredChatMessage {
                    sender: "peer".to_string(),
                    text: "hi there".to_string(),
                    timestamp: 1708300005,
                },
            ],
            started_at: 1708300000,
            ended_at: 1708300060,
        }
    }

    #[test]
    fn test_append_and_query() {
        let mut log = ChatLog::new();
        log.append(test_entry()).unwrap();
        assert_eq!(log.query().len(), 1);
        assert_eq!(log.query()[0].messages.len(), 2);
    }

    #[test]
    fn test_persistence() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("chat_history.json");

        {
            let mut log = ChatLog::open_at(path.clone()).unwrap();
            log.append(test_entry()).unwrap();
        }

        {
            let log = ChatLog::open_at(path).unwrap();
            assert_eq!(log.query().len(), 1);
            assert_eq!(log.query()[0].session_id, "abc123");
            assert_eq!(log.query()[0].messages[0].text, "hello");
        }
    }

    #[test]
    fn test_recent() {
        let mut log = ChatLog::new();
        for i in 0..5 {
            let mut entry = test_entry();
            entry.session_id = format!("session-{}", i);
            log.append(entry).unwrap();
        }

        let recent = log.recent(2);
        assert_eq!(recent.len(), 2);
        assert_eq!(recent[0].session_id, "session-3");
        assert_eq!(recent[1].session_id, "session-4");
    }

    #[test]
    fn test_clear() {
        let mut log = ChatLog::new();
        log.append(test_entry()).unwrap();
        log.clear().unwrap();
        assert!(log.query().is_empty());
    }
}
