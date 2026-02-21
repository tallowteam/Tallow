//! Proxied TCP+TLS transport for SOCKS5/Tor connections
//!
//! Connects through a SOCKS5 proxy, then wraps the tunnel in TLS.
//! Used when `--proxy` or `--tor` flags are active. QUIC cannot
//! traverse SOCKS5, so this TCP+TLS transport is the only option
//! when a proxy is configured.

use crate::privacy::{ProxyConfig, Socks5Connector};
use crate::{NetworkError, Result, Transport};
use std::net::SocketAddr;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio_rustls::client::TlsStream;
use tracing::info;

/// TCP+TLS transport that routes through a SOCKS5 proxy
pub struct ProxiedTcpTlsTransport {
    /// SOCKS5 connector for tunneling
    connector: Socks5Connector,
    /// TLS-wrapped TCP stream (after connection)
    stream: Option<TlsStream<TcpStream>>,
    /// Relay hostname for Tor mode (send to proxy for DNS resolution)
    relay_host: Option<String>,
    /// Relay port
    relay_port: u16,
    /// Whether to send hostname to proxy instead of resolved IP (Tor mode)
    use_hostname: bool,
}

impl std::fmt::Debug for ProxiedTcpTlsTransport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ProxiedTcpTlsTransport")
            .field("connected", &self.stream.is_some())
            .field("relay_host", &self.relay_host)
            .field("relay_port", &self.relay_port)
            .field("use_hostname", &self.use_hostname)
            .finish()
    }
}

impl ProxiedTcpTlsTransport {
    /// Create a new proxied transport
    ///
    /// # Arguments
    ///
    /// * `proxy_config` - SOCKS5 proxy configuration
    /// * `relay_host` - Optional relay hostname (for Tor DNS-via-proxy)
    /// * `relay_port` - Relay port
    pub fn new(proxy_config: &ProxyConfig, relay_host: Option<String>, relay_port: u16) -> Self {
        Self {
            connector: proxy_config.to_connector(),
            stream: None,
            relay_host,
            relay_port,
            use_hostname: proxy_config.tor_mode,
        }
    }

    /// Connect to the relay through the SOCKS5 proxy
    ///
    /// For Tor mode: sends hostname to proxy (DNS resolved inside Tor network).
    /// For generic SOCKS5: connects via pre-resolved IP address.
    pub async fn connect_proxied(&mut self, addr: SocketAddr) -> Result<()> {
        // 10-second timeout — Tor connections can be slow
        let tcp_stream = tokio::time::timeout(
            std::time::Duration::from_secs(10),
            self.connect_socks5(addr),
        )
        .await
        .map_err(|_| {
            NetworkError::ConnectionFailed(
                "SOCKS5 connection timed out (10s) — is the proxy running?".to_string(),
            )
        })??;

        // Wrap in TLS
        let tls_config = super::tls_config::rustls_client_config()?;
        let tls_connector = tokio_rustls::TlsConnector::from(tls_config);

        // SNI: use relay hostname when available, fall back to "localhost"
        let sni = self.relay_host.as_deref().unwrap_or("localhost");
        let server_name = rustls::pki_types::ServerName::try_from(sni)
            .map_err(|e| NetworkError::TlsError(format!("invalid server name '{}': {}", sni, e)))?
            .to_owned();

        let tls_stream = tls_connector
            .connect(server_name, tcp_stream)
            .await
            .map_err(|e| {
                NetworkError::TlsError(format!("TLS handshake via proxy failed: {}", e))
            })?;

        info!(
            "connected to relay via SOCKS5 proxy (tor_mode={})",
            self.use_hostname
        );

        self.stream = Some(tls_stream);
        Ok(())
    }

    /// Establish the SOCKS5 tunnel (hostname or IP mode)
    async fn connect_socks5(&self, addr: SocketAddr) -> Result<TcpStream> {
        if self.use_hostname {
            // Tor mode: send hostname to proxy for DNS resolution inside the network
            if let Some(ref host) = self.relay_host {
                self.connector.connect_hostname(host, self.relay_port).await
            } else {
                // Fallback: no hostname available, use IP directly
                self.connector.connect(addr).await
            }
        } else {
            // Generic SOCKS5: use pre-resolved IP address
            self.connector.connect(addr).await
        }
    }

    /// Close the transport gracefully
    pub async fn close(&mut self) -> Result<()> {
        if let Some(mut stream) = self.stream.take() {
            let _ = stream.shutdown().await;
        }
        Ok(())
    }
}

impl Transport for ProxiedTcpTlsTransport {
    async fn connect(&mut self, addr: SocketAddr) -> Result<()> {
        self.connect_proxied(addr).await
    }

    async fn send(&mut self, data: &[u8]) -> Result<usize> {
        let stream = self
            .stream
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("not connected".to_string()))?;

        // Write length prefix (4 bytes BE)
        let len: u32 = data.len().try_into().map_err(|_| {
            NetworkError::ConnectionFailed(format!(
                "payload too large for length prefix: {} bytes",
                data.len()
            ))
        })?;
        stream
            .write_all(&len.to_be_bytes())
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("TCP write len failed: {}", e)))?;

        // Write payload
        stream
            .write_all(data)
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("TCP write failed: {}", e)))?;

        Ok(data.len())
    }

    async fn receive(&mut self, buf: &mut [u8]) -> Result<usize> {
        let stream = self
            .stream
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("not connected".to_string()))?;

        // Read length prefix
        let mut len_buf = [0u8; 4];
        stream
            .read_exact(&mut len_buf)
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("TCP read len failed: {}", e)))?;

        let len = u32::from_be_bytes(len_buf) as usize;
        if len > buf.len() {
            return Err(NetworkError::ConnectionFailed(format!(
                "message too large: {} bytes (buffer is {})",
                len,
                buf.len()
            )));
        }

        // Read payload
        stream
            .read_exact(&mut buf[..len])
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("TCP read failed: {}", e)))?;

        Ok(len)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proxied_transport_new() {
        let config = ProxyConfig::tor_default();
        let transport =
            ProxiedTcpTlsTransport::new(&config, Some("relay.example.com".to_string()), 4433);
        assert!(transport.stream.is_none());
        assert_eq!(transport.relay_port, 4433);
        assert!(transport.use_hostname);
        assert_eq!(transport.relay_host.as_deref(), Some("relay.example.com"));
    }

    #[tokio::test]
    async fn test_proxied_transport_not_connected() {
        let config = ProxyConfig::tor_default();
        let mut transport = ProxiedTcpTlsTransport::new(&config, None, 4433);

        // send before connect should error
        let send_result = transport.send(b"hello").await;
        assert!(send_result.is_err());

        // receive before connect should error
        let mut buf = [0u8; 64];
        let recv_result = transport.receive(&mut buf).await;
        assert!(recv_result.is_err());
    }
}
