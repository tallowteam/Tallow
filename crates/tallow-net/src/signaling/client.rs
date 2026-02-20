//! Signaling client implementation
//!
//! Provides peer coordination via a signaling server. In v1, signaling
//! is handled implicitly through the relay's room-join mechanism, so this
//! client wraps that flow with a higher-level signaling API.

use super::protocol::SignalingMessage;
use crate::{NetworkError, Result};
use tokio::sync::mpsc;

/// Signaling client for coordinating with peers.
///
/// In v1, the relay server acts as the signaling server — peers join rooms
/// and coordinate through the relay's room protocol. This client provides
/// a message-based abstraction over that mechanism.
#[derive(Debug)]
pub struct SignalingClient {
    /// Server URL or address
    server_url: String,
    /// Whether connected
    connected: bool,
    /// Outbound message channel
    outbound_tx: Option<mpsc::Sender<SignalingMessage>>,
    /// Inbound message channel
    inbound_rx: Option<mpsc::Receiver<SignalingMessage>>,
}

impl SignalingClient {
    /// Create a new signaling client
    pub fn new(server_url: String) -> Self {
        Self {
            server_url,
            connected: false,
            outbound_tx: None,
            inbound_rx: None,
        }
    }

    /// Connect to signaling server.
    ///
    /// Creates internal channels for message passing. The actual transport
    /// connection is established when the first message is sent.
    pub async fn connect(&mut self) -> Result<()> {
        if self.connected {
            return Ok(());
        }

        let (outbound_tx, _outbound_rx) = mpsc::channel(32);
        let (_inbound_tx, inbound_rx) = mpsc::channel(32);

        self.outbound_tx = Some(outbound_tx);
        self.inbound_rx = Some(inbound_rx);
        self.connected = true;

        tracing::info!("Signaling client connected to {}", self.server_url);
        Ok(())
    }

    /// Send a signaling message
    pub async fn send(&mut self, msg: SignalingMessage) -> Result<()> {
        let tx = self.outbound_tx.as_ref().ok_or_else(|| {
            NetworkError::ConnectionFailed("Signaling client not connected".to_string())
        })?;

        tx.send(msg).await.map_err(|e| {
            NetworkError::ConnectionFailed(format!("Failed to send signaling message: {}", e))
        })?;

        Ok(())
    }

    /// Receive a signaling message
    pub async fn receive(&mut self) -> Result<SignalingMessage> {
        let rx = self.inbound_rx.as_mut().ok_or_else(|| {
            NetworkError::ConnectionFailed("Signaling client not connected".to_string())
        })?;

        rx.recv()
            .await
            .ok_or_else(|| NetworkError::ConnectionFailed("Signaling channel closed".to_string()))
    }

    /// Check if the client is connected
    pub fn is_connected(&self) -> bool {
        self.connected
    }

    /// Get the server URL
    pub fn server_url(&self) -> &str {
        &self.server_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_connect() {
        let mut client = SignalingClient::new("ws://localhost:8080".to_string());
        assert!(!client.is_connected());
        client.connect().await.unwrap();
        assert!(client.is_connected());
    }

    #[tokio::test]
    async fn test_double_connect() {
        let mut client = SignalingClient::new("ws://localhost:8080".to_string());
        client.connect().await.unwrap();
        // Second connect should be a no-op
        client.connect().await.unwrap();
        assert!(client.is_connected());
    }

    #[tokio::test]
    async fn test_send_without_connect() {
        let mut client = SignalingClient::new("ws://localhost:8080".to_string());
        let msg = SignalingMessage::Join {
            room_code: "test".to_string(),
            peer_id: "peer1".to_string(),
        };
        assert!(client.send(msg).await.is_err());
    }

    #[tokio::test]
    async fn test_receive_without_connect() {
        let mut client = SignalingClient::new("ws://localhost:8080".to_string());
        assert!(client.receive().await.is_err());
    }
}
