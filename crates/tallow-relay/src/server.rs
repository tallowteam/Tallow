//! Relay server implementation

use crate::config::RelayConfig;

/// Relay server
#[derive(Debug)]
pub struct RelayServer {
    #[allow(dead_code)]
    config: RelayConfig,
}

impl RelayServer {
    /// Create a new relay server
    pub fn new(config: RelayConfig) -> Self {
        Self { config }
    }

    /// Start the server
    pub async fn start(&mut self) {
        todo!("Implement relay server")
    }
}
