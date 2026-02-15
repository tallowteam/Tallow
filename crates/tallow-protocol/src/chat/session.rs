//! Chat session management

use super::ChatMessage;
use crate::Result;

/// Chat session with a peer
#[derive(Debug)]
pub struct ChatSession {
    /// Session ID
    pub id: String,
    /// Peer ID
    pub peer_id: String,
    /// Message history
    messages: Vec<ChatMessage>,
}

impl ChatSession {
    /// Create a new chat session
    pub fn new(id: String, peer_id: String) -> Self {
        Self {
            id,
            peer_id,
            messages: Vec::new(),
        }
    }

    /// Send a message
    pub async fn send(&mut self, _text: String) -> Result<()> {
        todo!("Implement chat send")
    }

    /// Receive a message
    pub async fn receive(&mut self) -> Result<ChatMessage> {
        todo!("Implement chat receive")
    }

    /// Get message history
    pub fn messages(&self) -> &[ChatMessage] {
        &self.messages
    }
}
