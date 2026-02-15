//! QUIC transport implementation

use crate::{Result, Transport};
use std::net::SocketAddr;

/// QUIC transport (requires `quic` feature)
#[cfg(feature = "quic")]
#[derive(Debug)]
pub struct QuicTransport {
    #[allow(dead_code)]
    endpoint: Option<SocketAddr>,
}

#[cfg(feature = "quic")]
impl QuicTransport {
    /// Create a new QUIC transport
    pub fn new() -> Self {
        Self { endpoint: None }
    }
}

#[cfg(feature = "quic")]
impl Default for QuicTransport {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(feature = "quic")]
impl Transport for QuicTransport {
    async fn connect(&mut self, _addr: SocketAddr) -> Result<()> {
        todo!("Implement QUIC connect")
    }

    async fn send(&mut self, _data: &[u8]) -> Result<usize> {
        todo!("Implement QUIC send")
    }

    async fn receive(&mut self, _buf: &mut [u8]) -> Result<usize> {
        todo!("Implement QUIC receive")
    }
}
