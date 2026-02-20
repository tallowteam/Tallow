//! Chat session management
//!
//! Manages a chat session between two peers using an async channel-based
//! message passing architecture. Optionally encrypts/decrypts messages
//! using a Triple Ratchet (Double Ratchet + Sparse PQ Ratchet) for
//! post-quantum forward secrecy.

use super::ChatMessage;
use crate::{ProtocolError, Result};
use tallow_crypto::ratchet::TripleRatchet;
use tokio::sync::mpsc;

/// Chat session with a peer
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
    /// Optional Triple Ratchet for end-to-end encryption
    ratchet: Option<TripleRatchet>,
}

impl std::fmt::Debug for ChatSession {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ChatSession")
            .field("id", &self.id)
            .field("peer_id", &self.peer_id)
            .field("local_id", &self.local_id)
            .field("messages", &self.messages)
            .field("encrypted", &self.ratchet.is_some())
            .finish_non_exhaustive()
    }
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
            ratchet: None,
        };

        (session, outbound_rx, inbound_tx)
    }

    /// Set the local sender ID
    pub fn set_local_id(&mut self, id: String) {
        self.local_id = id;
    }

    /// Enable end-to-end encryption with a shared secret.
    ///
    /// Initializes the Triple Ratchet (Double Ratchet + Sparse PQ Ratchet)
    /// for post-quantum forward secrecy. The `is_initiator` flag determines
    /// which side of the ratchet this session takes.
    ///
    /// # Arguments
    /// * `shared_secret` - 32-byte shared secret from key exchange
    /// * `is_initiator` - `true` for the session initiator, `false` for the responder
    pub fn enable_encryption(&mut self, shared_secret: &[u8; 32], is_initiator: bool) {
        let ratchet = if is_initiator {
            TripleRatchet::init(shared_secret, 10)
        } else {
            TripleRatchet::init_responder(shared_secret, 10)
        };
        self.ratchet = Some(ratchet);
    }

    /// Check whether encryption is enabled for this session
    pub fn is_encrypted(&self) -> bool {
        self.ratchet.is_some()
    }

    /// Send a message to the peer.
    ///
    /// If encryption is enabled, the message text is encrypted via the
    /// Triple Ratchet and sent as a hex-encoded ciphertext. Otherwise,
    /// the message is sent as plaintext.
    pub async fn send(&mut self, text: String) -> Result<()> {
        let msg = if let Some(ref mut ratchet) = self.ratchet {
            // Encrypt the message text
            let ciphertext = ratchet.encrypt_message(text.as_bytes()).map_err(|e| {
                ProtocolError::TransferFailed(format!("Chat encrypt failed: {}", e))
            })?;
            ratchet.step().map_err(|e| {
                ProtocolError::TransferFailed(format!("Ratchet step failed: {}", e))
            })?;
            // Hex-encode the ciphertext for wire transport
            let hex_ct =
                ciphertext
                    .iter()
                    .fold(String::with_capacity(ciphertext.len() * 2), |mut s, b| {
                        use std::fmt::Write;
                        let _ = write!(s, "{b:02x}");
                        s
                    });
            ChatMessage::new_encrypted(self.local_id.clone(), hex_ct)
        } else {
            ChatMessage::new(self.local_id.clone(), text)
        };

        self.messages.push(msg.clone());

        self.outbound_tx
            .send(msg)
            .await
            .map_err(|e| ProtocolError::TransferFailed(format!("Chat send failed: {}", e)))?;

        Ok(())
    }

    /// Receive a message from the peer.
    ///
    /// If encryption is enabled and the incoming message is marked encrypted,
    /// the hex-encoded ciphertext is decoded and decrypted via the Triple
    /// Ratchet before being returned as plaintext.
    pub async fn receive(&mut self) -> Result<ChatMessage> {
        let mut msg = self
            .inbound_rx
            .recv()
            .await
            .ok_or_else(|| ProtocolError::TransferFailed("Chat channel closed".to_string()))?;

        if msg.encrypted {
            if let Some(ref mut ratchet) = self.ratchet {
                // Decode hex ciphertext
                let ct_bytes = (0..msg.text.len())
                    .step_by(2)
                    .map(|i| {
                        u8::from_str_radix(&msg.text[i..i + 2], 16).map_err(|e| {
                            ProtocolError::TransferFailed(format!(
                                "Invalid hex in ciphertext: {}",
                                e
                            ))
                        })
                    })
                    .collect::<std::result::Result<Vec<u8>, _>>()?;

                let plaintext = ratchet.decrypt_message(&ct_bytes).map_err(|e| {
                    ProtocolError::TransferFailed(format!("Chat decrypt failed: {}", e))
                })?;
                ratchet.step().map_err(|e| {
                    ProtocolError::TransferFailed(format!("Ratchet step failed: {}", e))
                })?;

                msg.text = String::from_utf8(plaintext).map_err(|e| {
                    ProtocolError::TransferFailed(format!(
                        "Invalid UTF-8 in decrypted message: {}",
                        e
                    ))
                })?;
                // Mark as decrypted for display layer
                msg.encrypted = false;
            }
        }

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

    #[tokio::test]
    async fn test_encrypted_send_receive() {
        let shared_secret = [42u8; 32];

        // Create sender session (initiator)
        let (mut sender_session, mut sender_outbound_rx, _sender_inbound_tx) =
            ChatSession::new("sess1".to_string(), "peer1".to_string());
        sender_session.enable_encryption(&shared_secret, true);
        assert!(sender_session.is_encrypted());

        // Create receiver session (responder)
        let (mut receiver_session, _receiver_outbound_rx, receiver_inbound_tx) =
            ChatSession::new("sess2".to_string(), "peer2".to_string());
        receiver_session.enable_encryption(&shared_secret, false);
        assert!(receiver_session.is_encrypted());

        // Send an encrypted message
        sender_session
            .send("secret message".to_string())
            .await
            .unwrap();

        // The outbound message should be encrypted (hex-encoded ciphertext)
        let wire_msg = sender_outbound_rx.recv().await.unwrap();
        assert!(wire_msg.encrypted);
        assert_ne!(wire_msg.text, "secret message");

        // Forward the encrypted message to the receiver's inbound channel
        receiver_inbound_tx.send(wire_msg).await.unwrap();

        // Receive and decrypt
        let received = receiver_session.receive().await.unwrap();
        assert_eq!(received.text, "secret message");
        assert!(!received.encrypted); // Should be marked as decrypted
    }

    #[tokio::test]
    async fn test_encrypted_multiple_messages() {
        let shared_secret = [99u8; 32];

        let (mut sender, mut sender_rx, _sender_tx) =
            ChatSession::new("s1".to_string(), "p1".to_string());
        sender.enable_encryption(&shared_secret, true);

        let (mut receiver, _receiver_rx, receiver_tx) =
            ChatSession::new("s2".to_string(), "p2".to_string());
        receiver.enable_encryption(&shared_secret, false);

        // Send multiple messages and verify round-trip
        let messages = ["hello", "world", "post-quantum secure!"];
        for text in &messages {
            sender.send(text.to_string()).await.unwrap();
            let wire_msg = sender_rx.recv().await.unwrap();
            assert!(wire_msg.encrypted);
            receiver_tx.send(wire_msg).await.unwrap();
            let received = receiver.receive().await.unwrap();
            assert_eq!(received.text, *text);
        }

        assert_eq!(sender.message_count(), 3);
        assert_eq!(receiver.message_count(), 3);
    }

    #[tokio::test]
    async fn test_unencrypted_session_unchanged() {
        // Verify that sessions without encryption still work identically
        let (mut session, mut outbound_rx, _inbound_tx) =
            ChatSession::new("sess1".to_string(), "peer1".to_string());
        assert!(!session.is_encrypted());

        session.send("plaintext".to_string()).await.unwrap();
        let msg = outbound_rx.recv().await.unwrap();
        assert!(!msg.encrypted);
        assert_eq!(msg.text, "plaintext");
    }
}
