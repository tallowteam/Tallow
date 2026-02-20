//! TCP+TLS transport implementation
//!
//! Fallback transport for networks where QUIC is blocked.
//! Uses tokio_rustls for TLS over TCP with the same framing as QUIC.

use crate::{NetworkError, Result, Transport};
use std::net::SocketAddr;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio_rustls::client::TlsStream;

/// TCP with TLS transport
pub struct TcpTlsTransport {
    /// TLS-wrapped TCP stream
    stream: Option<TlsStream<TcpStream>>,
}

impl std::fmt::Debug for TcpTlsTransport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TcpTlsTransport")
            .field("connected", &self.stream.is_some())
            .finish()
    }
}

impl TcpTlsTransport {
    /// Create a new TCP+TLS transport
    pub fn new() -> Self {
        Self { stream: None }
    }

    /// Close the transport gracefully
    pub async fn close(&mut self) -> Result<()> {
        if let Some(mut stream) = self.stream.take() {
            let _ = stream.shutdown().await;
        }
        Ok(())
    }
}

impl Default for TcpTlsTransport {
    fn default() -> Self {
        Self::new()
    }
}

impl Transport for TcpTlsTransport {
    async fn connect(&mut self, addr: SocketAddr) -> Result<()> {
        let tcp_stream = TcpStream::connect(addr)
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("TCP connect failed: {}", e)))?;

        let tls_config = super::tls_config::rustls_client_config()?;
        let connector = tokio_rustls::TlsConnector::from(tls_config);

        let server_name = rustls::pki_types::ServerName::try_from("localhost")
            .map_err(|e| NetworkError::TlsError(format!("invalid server name: {}", e)))?
            .to_owned();

        let tls_stream = connector
            .connect(server_name, tcp_stream)
            .await
            .map_err(|e| NetworkError::TlsError(format!("TLS handshake failed: {}", e)))?;

        self.stream = Some(tls_stream);
        Ok(())
    }

    async fn send(&mut self, data: &[u8]) -> Result<usize> {
        let stream = self
            .stream
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("not connected".to_string()))?;

        // Write length prefix (4 bytes BE)
        let len = data.len() as u32;
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
