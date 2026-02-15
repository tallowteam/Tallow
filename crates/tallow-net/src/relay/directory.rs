//! Relay server directory and discovery

use crate::Result;
use std::net::SocketAddr;
use std::time::Duration;

/// Relay server information
#[derive(Debug, Clone)]
pub struct RelayInfo {
    /// Server address
    pub addr: SocketAddr,
    /// Geographic region
    pub region: String,
    /// Latency probe result
    pub latency: Option<Duration>,
}

/// Directory of available relay servers
#[derive(Debug)]
pub struct RelayDirectory {
    #[allow(dead_code)]
    relays: Vec<RelayInfo>,
}

impl RelayDirectory {
    /// Create a new relay directory
    pub fn new() -> Self {
        Self { relays: Vec::new() }
    }

    /// Fetch relay list from directory service
    pub async fn fetch_relays(&mut self) -> Result<()> {
        todo!("Implement relay directory fetch")
    }

    /// Probe latency to all relays
    pub async fn probe_latency(&mut self) -> Result<()> {
        todo!("Implement relay latency probing")
    }

    /// Get best relay by latency
    pub fn best_relay(&self) -> Option<&RelayInfo> {
        self.relays.first()
    }
}

impl Default for RelayDirectory {
    fn default() -> Self {
        Self::new()
    }
}
