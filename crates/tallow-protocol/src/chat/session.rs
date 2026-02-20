//! Chat session management
//!
//! Manages a chat session between two peers using an async channel-based
//! message passing architecture.

use super::ChatMessage;
use crate::{ProtocolError, Result};
use tokio::sync::mpsc;

/// Chat session with a peer
#[derive(Debug)]
pub struct ChatSession {
    /// Session ID
    pub id: String,
    /// Peer ID
    pub peer_id: String,
    /// Local sender ID
    local_id: String,
    /// Message history
    messages: Vec<ChatMessage>,
    /// Outbound message channel
    outbound_tx: mpsc::Sender<ChatMessage>,
    /// Inbound message channel
    inbound_rx: mpsc::Receiver<ChatMessage>,
}

impl ChatSession {
    /// Create a new chat session with channels for message I/O.
    ///
    /// Returns the session along with the channel endpoints that should
    /// be connected to the network transport layer.
    pub fn new(
        id: String,
        peer_id: String,
    ) -> (Self, mpsc::Receiver<ChatMessage>, mpsc::Sender<ChatMessage>) {
        let (outbound_tx, outbound_rx) = mpsc::channel(64);
        let (inbound_tx, inbound_rx) = mpsc::channel(64);

        let session = Self {
            id,
            local_id: "local".to_string(),
            peer_id,
            messages: Vec::new(),
            outbound_tx,
            inbound_rx,
        };

        (session, outbound_rx, inbound_tx)
    }

    /// Set the local sender ID
    pub fn set_local_id(&mut self, id: String) {
        self.local_id = id;
    }

    /// Send a message to the peer.
    ///
    /// Creates a ChatMessage, stores it in history, and sends it through
    /// the outbound channel to be transmitted by the network layer.
    pub async fn send(&mut self, text: String) -> Result<()> {
        let msg = ChatMessage::new(self.local_id.clone(), text);
        self.messages.push(msg.clone());

        self.outbound_tx
            .send(msg)
            .await
            .map_err(|e| ProtocolError::TransferFailed(format!("Chat send failed: {}", e)))?;

        Ok(())
    }

    /// Receive a message from the peer.
    ///
    /// Waits for the next inbound message from the channel and stores it
    /// in the message history.
    pub async fn receive(&mut self) -> Result<ChatMessage> {
        let msg = self
            .inbound_rx
            .recv()
            .await
            .ok_or_else(|| ProtocolError::TransferFailed("Chat channel closed".to_string()))?;

        self.messages.push(msg.clone());
        Ok(msg)
    }

    /// Get message history
    pub fn messages(&self) -> &[ChatMessage] {
        &self.messages
    }

    /// Get the number of messages in history
    pub fn message_count(&self) -> usize {
        self.messages.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_send_message() {
        let (mut session, mut outbound_rx, _inbound_tx) =
            ChatSession::new("sess1".to_string(), "peer1".to_string());

        session.send("hello".to_string()).await.unwrap();
        assert_eq!(session.messages().len(), 1);
        assert_eq!(session.messages()[0].text, "hello");

        // Message should be available on the outbound channel
        let msg = outbound_rx.recv().await.unwrap();
        assert_eq!(msg.text, "hello");
    }

    #[tokio::test]
    async fn test_receive_message() {
        let (mut session, _outbound_rx, inbound_tx) =
            ChatSession::new("sess1".to_string(), "peer1".to_string());

        // Simulate an inbound message
        let msg = ChatMessage::new("peer1".to_string(), "hi there".to_string());
        inbound_tx.send(msg).await.unwrap();

        let received = session.receive().await.unwrap();
        assert_eq!(received.text, "hi there");
        assert_eq!(session.messages().len(), 1);
    }

    #[tokio::test]
    async fn test_message_count() {
        let (mut session, _outbound_rx, inbound_tx) =
            ChatSession::new("sess1".to_string(), "peer1".to_string());

        session.send("msg1".to_string()).await.unwrap();

        let msg = ChatMessage::new("peer1".to_string(), "msg2".to_string());
        inbound_tx.send(msg).await.unwrap();
        session.receive().await.unwrap();

        assert_eq!(session.message_count(), 2);
    }
}
