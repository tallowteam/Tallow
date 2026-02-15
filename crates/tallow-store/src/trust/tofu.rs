//! Trust On First Use (TOFU) implementation

use super::TrustLevel;
use crate::Result;
use std::collections::HashMap;

/// TOFU database
#[derive(Debug)]
pub struct TofuStore {
    /// Peer ID -> (public key, trust level)
    records: HashMap<String, (Vec<u8>, TrustLevel)>,
}

impl TofuStore {
    /// Create a new TOFU store
    pub fn new() -> Self {
        Self {
            records: HashMap::new(),
        }
    }

    /// Record first contact with a peer
    pub fn record_first_contact(&mut self, peer_id: String, public_key: Vec<u8>) -> Result<()> {
        self.records
            .insert(peer_id, (public_key, TrustLevel::Seen));
        Ok(())
    }

    /// Check if peer's key has changed
    pub fn check_key_change(&self, peer_id: &str, current_key: &[u8]) -> Option<bool> {
        self.records.get(peer_id).map(|(stored_key, _)| {
            stored_key.as_slice() != current_key
        })
    }

    /// Update trust level
    pub fn update_trust(&mut self, peer_id: &str, level: TrustLevel) -> Result<()> {
        if let Some((_, trust)) = self.records.get_mut(peer_id) {
            *trust = level;
        }
        Ok(())
    }

    /// Get trust level
    pub fn get_trust(&self, peer_id: &str) -> TrustLevel {
        self.records
            .get(peer_id)
            .map(|(_, level)| *level)
            .unwrap_or(TrustLevel::Unknown)
    }
}

impl Default for TofuStore {
    fn default() -> Self {
        Self::new()
    }
}
