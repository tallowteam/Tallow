//! Protocol message types

use serde::{Deserialize, Serialize};

/// Wire protocol messages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Message {
    /// Initial handshake
    Handshake {
        /// Protocol version
        version: u32,
        /// Peer identifier
        peer_id: String,
    },
    /// File offer
    FileOffer {
        /// Transfer ID
        transfer_id: String,
        /// File manifest
        manifest: String,
    },
    /// Accept file transfer
    FileAccept {
        /// Transfer ID
        transfer_id: String,
    },
    /// Reject file transfer
    FileReject {
        /// Transfer ID
        transfer_id: String,
        /// Reason
        reason: String,
    },
    /// Data chunk
    Chunk {
        /// Transfer ID
        transfer_id: String,
        /// Chunk index
        index: u64,
        /// Chunk data
        data: Vec<u8>,
    },
    /// Acknowledgment
    Ack {
        /// Transfer ID
        transfer_id: String,
        /// Chunk index
        index: u64,
    },
    /// Chat message
    ChatMessage {
        /// Message text
        text: String,
        /// Timestamp
        timestamp: u64,
    },
    /// Room join
    RoomJoin {
        /// Room code
        code: String,
    },
    /// Room leave
    RoomLeave,
    /// Ping
    Ping,
    /// Pong
    Pong,
}
