//! Trust level definitions

use serde::{Deserialize, Serialize};

/// Trust level for a peer
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrustLevel {
    /// Unknown peer, never seen before
    Unknown,
    /// Peer seen before (TOFU recorded)
    Seen,
    /// Peer manually marked as trusted
    Trusted,
    /// Peer verified out-of-band
    Verified,
}

impl TrustLevel {
    /// Check if auto-accept is allowed
    pub fn auto_accept(&self) -> bool {
        matches!(self, TrustLevel::Trusted | TrustLevel::Verified)
    }

    /// Check if warning should be shown
    pub fn should_warn(&self) -> bool {
        matches!(self, TrustLevel::Unknown)
    }
}
