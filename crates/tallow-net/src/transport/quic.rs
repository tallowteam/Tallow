//! QUIC transport implementation using quinn
//!
//! Provides bidirectional stream communication over QUIC.
//! Uses length-prefixed framing matching the wire protocol codec.

#[cfg(feature = "quic")]
use crate::{NetworkError, Result};
#[cfg(feature = "quic")]
use std::net::SocketAddr;

/// QUIC transport (requires `quic` feature)
#[cfg(feature = "quic")]
pub struct QuicTransport {
    /// Local endpoint
    endpoint: Option<quinn::Endpoint>,
    /// Active connection
    connection: Option<quinn::Connection>,
    /// Send stream for the current bidirectional stream
    send_stream: Option<quinn::SendStream>,
    /// Receive stream for the current bidirectional stream
    recv_stream: Option<quinn::RecvStream>,
}

#[cfg(feature = "quic")]
impl std::fmt::Debug for QuicTransport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("QuicTransport")
            .field("has_endpoint", &self.endpoint.is_some())
            .field("has_connection", &self.connection.is_some())
            .field("has_streams", &self.send_stream.is_some())
            .finish()
    }
}

#[cfg(feature = "quic")]
impl QuicTransport {
    /// Create a new QUIC transport
    pub fn new() -> Self {
        Self {
            endpoint: None,
            connection: None,
            send_stream: None,
            recv_stream: None,
        }
    }

    /// Create a QUIC transport bound to a specific address (for servers)
    pub fn bind(addr: SocketAddr, server_config: quinn::ServerConfig) -> Result<Self> {
        let endpoint = quinn::Endpoint::server(server_config, addr)
            .map_err(|e| NetworkError::ConnectionFailed(format!("QUIC bind failed: {}", e)))?;

        Ok(Self {
            endpoint: Some(endpoint),
            connection: None,
            send_stream: None,
            recv_stream: None,
        })
    }

    /// Accept an incoming connection (server-side)
    pub async fn accept(&mut self) -> Result<()> {
        let endpoint = self
            .endpoint
            .as_ref()
            .ok_or_else(|| NetworkError::ConnectionFailed("no endpoint bound".to_string()))?;

        let incoming = endpoint
            .accept()
            .await
            .ok_or_else(|| NetworkError::ConnectionFailed("endpoint closed".to_string()))?;

        let connection = incoming
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("QUIC accept failed: {}", e)))?;

        self.connection = Some(connection);
        Ok(())
    }

    /// Accept a bidirectional stream on the current connection
    pub async fn accept_bi_stream(&mut self) -> Result<()> {
        let conn = self
            .connection
            .as_ref()
            .ok_or_else(|| NetworkError::ConnectionFailed("no connection".to_string()))?;

        let (send, recv) = conn
            .accept_bi()
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("accept_bi failed: {}", e)))?;

        self.send_stream = Some(send);
        self.recv_stream = Some(recv);
        Ok(())
    }

    /// Get a reference to the underlying connection
    pub fn connection(&self) -> Option<&quinn::Connection> {
        self.connection.as_ref()
    }

    /// Get the endpoint
    pub fn endpoint(&self) -> Option<&quinn::Endpoint> {
        self.endpoint.as_ref()
    }

    /// Close the transport gracefully
    pub async fn close(&mut self) {
        if let Some(conn) = self.connection.take() {
            conn.close(0u32.into(), b"done");
        }
        if let Some(endpoint) = self.endpoint.take() {
            endpoint.close(0u32.into(), b"shutdown");
        }
        self.send_stream = None;
        self.recv_stream = None;
    }
}

#[cfg(feature = "quic")]
impl Default for QuicTransport {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(feature = "quic")]
impl crate::Transport for QuicTransport {
    async fn connect(&mut self, addr: SocketAddr) -> Result<()> {
        let client_config = super::tls_config::quinn_client_config()?;

        // Bind to any available port
        let mut endpoint =
            quinn::Endpoint::client("0.0.0.0:0".parse().map_err(|e| {
                NetworkError::ConnectionFailed(format!("invalid bind addr: {}", e))
            })?)
            .map_err(|e| {
                NetworkError::ConnectionFailed(format!("QUIC client bind failed: {}", e))
            })?;

        endpoint.set_default_client_config(client_config);

        let connection = endpoint
            .connect(addr, "localhost")
            .map_err(|e| {
                NetworkError::ConnectionFailed(format!("QUIC connect initiation failed: {}", e))
            })?
            .await
            .map_err(|e| {
                NetworkError::ConnectionFailed(format!("QUIC connection failed: {}", e))
            })?;

        // Open a bidirectional stream
        let (send, recv) = connection
            .open_bi()
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("open_bi failed: {}", e)))?;

        self.endpoint = Some(endpoint);
        self.connection = Some(connection);
        self.send_stream = Some(send);
        self.recv_stream = Some(recv);

        Ok(())
    }

    async fn send(&mut self, data: &[u8]) -> Result<usize> {
        let stream = self
            .send_stream
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("no send stream".to_string()))?;

        // Write length prefix (4 bytes BE)
        let len = data.len() as u32;
        stream
            .write_all(&len.to_be_bytes())
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("QUIC write len failed: {}", e)))?;

        // Write payload
        stream
            .write_all(data)
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("QUIC write failed: {}", e)))?;

        Ok(data.len())
    }

    async fn receive(&mut self, buf: &mut [u8]) -> Result<usize> {
        let stream = self
            .recv_stream
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("no recv stream".to_string()))?;

        // Read length prefix
        let mut len_buf = [0u8; 4];
        stream
            .read_exact(&mut len_buf)
            .await
            .map_err(|e| NetworkError::ConnectionFailed(format!("QUIC read len failed: {}", e)))?;

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
            .map_err(|e| NetworkError::ConnectionFailed(format!("QUIC read failed: {}", e)))?;

        Ok(len)
    }
}
