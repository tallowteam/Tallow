//! Transport layer implementations
//!
//! QUIC (primary), TCP+TLS (fallback), and the FallbackTransport that
//! tries QUIC first and falls back to TCP+TLS automatically.

pub mod bandwidth;
pub mod fallback;
pub mod negotiation;
pub mod quic;
pub mod tcp_tls;
pub mod tls_config;

use crate::Result;
use std::net::SocketAddr;

pub use fallback::{ActiveTransport, FallbackTransport};
#[cfg(feature = "quic")]
pub use quic::QuicTransport;
pub use tcp_tls::TcpTlsTransport;

/// Transport layer abstraction
///
/// All transports use the same length-prefixed framing:
/// `[4-byte BE length][payload]`
#[allow(async_fn_in_trait)]
pub trait Transport: Send + Sync {
    /// Connect to a remote peer
    async fn connect(&mut self, addr: SocketAddr) -> Result<()>;

    /// Send data (framed with length prefix)
    async fn send(&mut self, data: &[u8]) -> Result<usize>;

    /// Receive data into buffer, returns number of bytes read
    async fn receive(&mut self, buf: &mut [u8]) -> Result<usize>;
}
