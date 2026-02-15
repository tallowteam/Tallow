//! STUN client for NAT discovery

use crate::Result;
use std::net::SocketAddr;

/// STUN client for discovering public address
#[derive(Debug)]
pub struct StunClient {
    #[allow(dead_code)]
    server: SocketAddr,
}

impl StunClient {
    /// Create a new STUN client
    pub fn new(server: SocketAddr) -> Self {
        Self { server }
    }

    /// Discover public address via STUN
    pub async fn discover_public_address(&self) -> Result<SocketAddr> {
        todo!("Implement STUN discovery")
    }
}
