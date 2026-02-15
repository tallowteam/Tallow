//! TURN client for relay connections

use crate::Result;
use std::net::SocketAddr;

/// TURN client for relayed connections
#[derive(Debug)]
pub struct TurnClient {
    #[allow(dead_code)]
    server: SocketAddr,
    #[allow(dead_code)]
    username: String,
    #[allow(dead_code)]
    password: String,
}

impl TurnClient {
    /// Create a new TURN client
    pub fn new(server: SocketAddr, username: String, password: String) -> Self {
        Self {
            server,
            username,
            password,
        }
    }

    /// Allocate a relay address
    pub async fn allocate(&self) -> Result<SocketAddr> {
        todo!("Implement TURN allocation")
    }

    /// Send data through relay
    pub async fn send(&self, _data: &[u8], _to: SocketAddr) -> Result<()> {
        todo!("Implement TURN send")
    }
}
