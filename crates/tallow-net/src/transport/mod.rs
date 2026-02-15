//! Transport layer implementations

pub mod quic;
pub mod tcp_tls;
pub mod negotiation;
pub mod bandwidth;

use crate::Result;
use std::net::SocketAddr;

/// Transport layer abstraction
#[allow(async_fn_in_trait)]
pub trait Transport: Send + Sync {
    /// Connect to a remote peer
    async fn connect(&mut self, addr: SocketAddr) -> Result<()>;

    /// Send data
    async fn send(&mut self, data: &[u8]) -> Result<usize>;

    /// Receive data
    async fn receive(&mut self, buf: &mut [u8]) -> Result<usize>;
}
