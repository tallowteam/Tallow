//! Trust On First Use (TOFU) implementation with file persistence

use super::TrustLevel;
use crate::persistence::paths;
use crate::Result;
use crate::StoreError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Serializable TOFU record
#[derive(Debug, Clone, Serialize, Deserialize)]
struct TofuRecord {
    public_key: Vec<u8>,
    trust_level: TrustLevel,
    first_seen: u64,
}

/// TOFU database with optional file persistence
#[derive(Debug)]
pub struct TofuStore {
    /// Peer ID -> TOFU record
    records: HashMap<String, TofuRecord>,
    /// Path for persistence
    path: Option<PathBuf>,
}

impl TofuStore {
    /// Create a new in-memory TOFU store
    pub fn new() -> Self {
        Self {
            records: HashMap::new(),
            path: None,
        }
    }

    /// Open a persistent TOFU store at the default path
    pub fn open() -> Result<Self> {
        Self::open_at(paths::trust_file())
    }

    /// Open a persistent TOFU store at a custom path
    pub fn open_at(path: PathBuf) -> Result<Self> {
        let mut store = Self {
            records: HashMap::new(),
            path: Some(path),
        };

        if let Some(ref p) = store.path {
            if p.exists() {
                let data = std::fs::read_to_string(p)?;
                store.records = serde_json::from_str(&data).map_err(|e| {
                    StoreError::TrustError(format!("Failed to parse trust store: {}", e))
                })?;
            }
        }

        Ok(store)
    }

    /// Record first contact with a peer
    pub fn record_first_contact(&mut self, peer_id: String, public_key: Vec<u8>) -> Result<()> {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        self.records.insert(
            peer_id,
            TofuRecord {
                public_key,
                trust_level: TrustLevel::Seen,
                first_seen: timestamp,
            },
        );
        self.save()
    }

    /// Check if peer's key has changed (returns None if peer not seen before)
    pub fn check_key_change(&self, peer_id: &str, current_key: &[u8]) -> Option<bool> {
        self.records
            .get(peer_id)
            .map(|record| record.public_key.as_slice() != current_key)
    }

    /// Update trust level for a peer
    pub fn update_trust(&mut self, peer_id: &str, level: TrustLevel) -> Result<()> {
        if let Some(record) = self.records.get_mut(peer_id) {
            record.trust_level = level;
            self.save()?;
        }
        Ok(())
    }

    /// Get trust level for a peer
    pub fn get_trust(&self, peer_id: &str) -> TrustLevel {
        self.records
            .get(peer_id)
            .map(|record| record.trust_level)
            .unwrap_or(TrustLevel::Unknown)
    }

    /// List all known peers
    pub fn list_peers(&self) -> Vec<(&str, TrustLevel)> {
        self.records
            .iter()
            .map(|(id, record)| (id.as_str(), record.trust_level))
            .collect()
    }

    /// Remove a peer from the trust store
    pub fn remove_peer(&mut self, peer_id: &str) -> Result<()> {
        self.records.remove(peer_id);
        self.save()
    }

    /// Save to disk if persistent
    fn save(&self) -> Result<()> {
        if let Some(ref path) = self.path {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let data = serde_json::to_string_pretty(&self.records).map_err(|e| {
                StoreError::SerializationError(format!("Failed to serialize trust store: {}", e))
            })?;
            std::fs::write(path, data)?;
        }
        Ok(())
    }
}

impl Default for TofuStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_record_first_contact() {
        let mut store = TofuStore::new();
        store
            .record_first_contact("peer-1".to_string(), vec![1, 2, 3])
            .unwrap();
        assert_eq!(store.get_trust("peer-1"), TrustLevel::Seen);
    }

    #[test]
    fn test_key_change_detection() {
        let mut store = TofuStore::new();
        store
            .record_first_contact("peer-1".to_string(), vec![1, 2, 3])
            .unwrap();

        // Same key
        assert_eq!(store.check_key_change("peer-1", &[1, 2, 3]), Some(false));
        // Changed key
        assert_eq!(store.check_key_change("peer-1", &[4, 5, 6]), Some(true));
        // Unknown peer
        assert_eq!(store.check_key_change("unknown", &[1, 2, 3]), None);
    }

    #[test]
    fn test_trust_levels() {
        let mut store = TofuStore::new();
        store
            .record_first_contact("peer-1".to_string(), vec![1, 2, 3])
            .unwrap();

        store.update_trust("peer-1", TrustLevel::Trusted).unwrap();
        assert_eq!(store.get_trust("peer-1"), TrustLevel::Trusted);
    }

    #[test]
    fn test_persistence() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("trust.json");

        {
            let mut store = TofuStore::open_at(path.clone()).unwrap();
            store
                .record_first_contact("peer-1".to_string(), vec![1, 2, 3])
                .unwrap();
            store.update_trust("peer-1", TrustLevel::Verified).unwrap();
        }

        {
            let store = TofuStore::open_at(path).unwrap();
            assert_eq!(store.get_trust("peer-1"), TrustLevel::Verified);
        }
    }

    #[test]
    fn test_list_peers() {
        let mut store = TofuStore::new();
        store
            .record_first_contact("peer-1".to_string(), vec![1])
            .unwrap();
        store
            .record_first_contact("peer-2".to_string(), vec![2])
            .unwrap();

        let peers = store.list_peers();
        assert_eq!(peers.len(), 2);
    }
}
