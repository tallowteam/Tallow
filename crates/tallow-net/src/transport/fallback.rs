//! Fallback transport: QUIC-first with TCP+TLS fallback
//!
//! Tries to connect via QUIC. If that fails (e.g., corporate firewall
//! blocking UDP), falls back to TCP+TLS automatically.

use crate::{NetworkError, Result, Transport};
use std::net::SocketAddr;
use tracing::{info, warn};

/// Active transport type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActiveTransport {
    /// Connected via QUIC
    Quic,
    /// Connected via TCP+TLS
    TcpTls,
    /// Not yet connected
    None,
}

/// Transport that tries QUIC first, falls back to TCP+TLS
pub struct FallbackTransport {
    #[cfg(feature = "quic")]
    quic: super::quic::QuicTransport,
    tcp_tls: super::tcp_tls::TcpTlsTransport,
    active: ActiveTransport,
}

impl std::fmt::Debug for FallbackTransport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("FallbackTransport")
            .field("active", &self.active)
            .finish()
    }
}

impl FallbackTransport {
    /// Create a new fallback transport
    pub fn new() -> Self {
        Self {
            #[cfg(feature = "quic")]
            quic: super::quic::QuicTransport::new(),
            tcp_tls: super::tcp_tls::TcpTlsTransport::new(),
            active: ActiveTransport::None,
        }
    }

    /// Get the currently active transport type
    pub fn active_transport(&self) -> ActiveTransport {
        self.active
    }
}

impl Default for FallbackTransport {
    fn default() -> Self {
        Self::new()
    }
}

impl Transport for FallbackTransport {
    async fn connect(&mut self, addr: SocketAddr) -> Result<()> {
        // Try QUIC first
        #[cfg(feature = "quic")]
        {
            info!("attempting QUIC connection to {}", addr);
            match self.quic.connect(addr).await {
                Ok(()) => {
                    info!("QUIC connection established");
                    self.active = ActiveTransport::Quic;
                    return Ok(());
                }
                Err(e) => {
                    warn!("QUIC connection failed, falling back to TCP+TLS: {}", e);
                }
            }
        }

        // Fall back to TCP+TLS
        info!("attempting TCP+TLS connection to {}", addr);
        self.tcp_tls.connect(addr).await?;
        info!("TCP+TLS connection established");
        self.active = ActiveTransport::TcpTls;
        Ok(())
    }

    async fn send(&mut self, data: &[u8]) -> Result<usize> {
        match self.active {
            #[cfg(feature = "quic")]
            ActiveTransport::Quic => self.quic.send(data).await,
            ActiveTransport::TcpTls => self.tcp_tls.send(data).await,
            _ => Err(NetworkError::ConnectionFailed("not connected".to_string())),
        }
    }

    async fn receive(&mut self, buf: &mut [u8]) -> Result<usize> {
        match self.active {
            #[cfg(feature = "quic")]
            ActiveTransport::Quic => self.quic.receive(buf).await,
            ActiveTransport::TcpTls => self.tcp_tls.receive(buf).await,
            _ => Err(NetworkError::ConnectionFailed("not connected".to_string())),
        }
    }
}
