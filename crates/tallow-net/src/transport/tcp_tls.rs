//! TCP+TLS transport implementation

use crate::{Result, Transport};
use std::net::SocketAddr;

/// TCP with TLS transport
#[derive(Debug)]
pub struct TcpTlsTransport {
    #[allow(dead_code)]
    remote: Option<SocketAddr>,
}

impl TcpTlsTransport {
    /// Create a new TCP+TLS transport
    pub fn new() -> Self {
        Self { remote: None }
    }
}

impl Default for TcpTlsTransport {
    fn default() -> Self {
        Self::new()
    }
}

impl Transport for TcpTlsTransport {
    async fn connect(&mut self, _addr: SocketAddr) -> Result<()> {
        todo!("Implement TCP+TLS connect")
    }

    async fn send(&mut self, _data: &[u8]) -> Result<usize> {
        todo!("Implement TCP+TLS send")
    }

    async fn receive(&mut self, _buf: &mut [u8]) -> Result<usize> {
        todo!("Implement TCP+TLS receive")
    }
}
