//! Protocol message types
//!
//! All messages use postcard serialization with integer-discriminant enums.
//! No `#[serde(tag = ...)]` — postcard handles Rust enums natively.

use serde::{Deserialize, Serialize};

/// Wire protocol messages
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Message {
    /// Version negotiation request
    VersionRequest {
        /// Supported protocol versions (sorted, ascending)
        supported_versions: Vec<u32>,
    },
    /// Version negotiation response
    VersionResponse {
        /// Selected protocol version
        selected_version: u32,
    },
    /// Version negotiation failure
    VersionReject {
        /// Reason for rejection
        reason: String,
    },
    /// Room join request (relay routing)
    RoomJoin {
        /// Room ID (BLAKE3 hash of code phrase, 32 bytes)
        room_id: Vec<u8>,
        /// BLAKE3 hash of relay password. None = no auth attempted.
        password_hash: Option<Vec<u8>>,
    },
    /// Room join acknowledgment
    RoomJoined {
        /// Whether peer is already waiting in the room
        peer_present: bool,
    },
    /// Room leave
    RoomLeave,
    /// Peer arrived notification (sent by relay when second peer joins)
    PeerArrived,
    /// Peer departed notification
    PeerDeparted,
    /// File offer (sender → receiver)
    FileOffer {
        /// Transfer ID (random, unique per transfer)
        transfer_id: [u8; 16],
        /// File manifest (serialized separately)
        manifest: Vec<u8>,
    },
    /// Accept file transfer
    FileAccept {
        /// Transfer ID
        transfer_id: [u8; 16],
    },
    /// Reject file transfer
    FileReject {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Reason for rejection
        reason: String,
    },
    /// Data chunk
    Chunk {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Chunk index (0-based)
        index: u64,
        /// Total chunks (set on final chunk)
        total: Option<u64>,
        /// Encrypted chunk data
        data: Vec<u8>,
    },
    /// Chunk acknowledgment
    Ack {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Acknowledged chunk index
        index: u64,
    },
    /// Transfer complete
    TransferComplete {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// BLAKE3 hash of complete file
        hash: [u8; 32],
    },
    /// Error during transfer
    TransferError {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Error message
        error: String,
    },
    /// Exchange manifests for sync comparison
    ManifestExchange {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Serialized manifest data
        manifest: Vec<u8>,
    },
    /// Request deletion of files on the remote side
    SyncDeleteList {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Relative paths of files to delete on the remote
        paths: Vec<String>,
    },
    /// Ping (keepalive)
    Ping,
    /// Pong (keepalive response)
    Pong,
    /// Handshake initiation (sender -> receiver)
    ///
    /// Carries CPace initiator public message, KEM capability negotiation,
    /// and a random nonce for session ID binding.
    HandshakeInit {
        /// Protocol version for this handshake (2 = KEM handshake)
        protocol_version: u32,
        /// Serialized KemCapabilities (supported algorithms)
        kem_capabilities: Vec<u8>,
        /// CPace initiator public message (Ristretto255 point, 32 bytes)
        cpace_public: [u8; 32],
        /// Random nonce for session ID binding (16 bytes)
        nonce: [u8; 16],
    },
    /// Handshake response (receiver -> sender)
    ///
    /// Carries CPace responder public message, selected KEM algorithm,
    /// the receiver's ephemeral hybrid KEM public key, and a random nonce.
    HandshakeResponse {
        /// Selected KEM algorithm discriminant
        selected_kem: u8,
        /// CPace responder public message (32 bytes)
        cpace_public: [u8; 32],
        /// Serialized hybrid KEM public key
        kem_public_key: Vec<u8>,
        /// Random nonce for session ID binding (16 bytes)
        nonce: [u8; 16],
    },
    /// KEM encapsulation + sender key confirmation (sender -> receiver)
    HandshakeKem {
        /// Serialized hybrid KEM ciphertext
        kem_ciphertext: Vec<u8>,
        /// Sender's key confirmation tag (BLAKE3 keyed MAC, 32 bytes)
        confirmation: [u8; 32],
    },
    /// Handshake completion with receiver key confirmation (receiver -> sender)
    HandshakeComplete {
        /// Receiver's key confirmation tag (BLAKE3 keyed MAC, 32 bytes)
        confirmation: [u8; 32],
    },
    /// Handshake failure (either direction)
    ///
    /// The reason string MUST NOT distinguish PAKE failure from KEM failure
    /// to avoid oracle attacks.
    HandshakeFailed {
        /// Generic failure reason
        reason: String,
    },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_roundtrip_all_variants() {
        let messages = vec![
            Message::VersionRequest {
                supported_versions: vec![1, 2],
            },
            Message::VersionResponse {
                selected_version: 1,
            },
            Message::VersionReject {
                reason: "unsupported".to_string(),
            },
            Message::RoomJoin {
                room_id: vec![0u8; 32],
                password_hash: Some(vec![0xAB; 32]),
            },
            Message::RoomJoin {
                room_id: vec![0u8; 32],
                password_hash: None,
            },
            Message::RoomJoined { peer_present: true },
            Message::RoomLeave,
            Message::PeerArrived,
            Message::PeerDeparted,
            Message::FileOffer {
                transfer_id: [1u8; 16],
                manifest: vec![0, 1, 2, 3],
            },
            Message::FileAccept {
                transfer_id: [1u8; 16],
            },
            Message::FileReject {
                transfer_id: [1u8; 16],
                reason: "too large".to_string(),
            },
            Message::Chunk {
                transfer_id: [1u8; 16],
                index: 42,
                total: Some(100),
                data: vec![0xDE, 0xAD, 0xBE, 0xEF],
            },
            Message::Ack {
                transfer_id: [1u8; 16],
                index: 42,
            },
            Message::TransferComplete {
                transfer_id: [1u8; 16],
                hash: [0xABu8; 32],
            },
            Message::TransferError {
                transfer_id: [1u8; 16],
                error: "disk full".to_string(),
            },
            Message::ManifestExchange {
                transfer_id: [2u8; 16],
                manifest: vec![10, 20, 30, 40],
            },
            Message::SyncDeleteList {
                transfer_id: [2u8; 16],
                paths: vec!["old/file.txt".to_string(), "removed.log".to_string()],
            },
            Message::Ping,
            Message::Pong,
            Message::HandshakeInit {
                protocol_version: 2,
                kem_capabilities: vec![0, 1, 2],
                cpace_public: [0xAA; 32],
                nonce: [0xBB; 16],
            },
            Message::HandshakeResponse {
                selected_kem: 2,
                cpace_public: [0xCC; 32],
                kem_public_key: vec![0xDD; 128],
                nonce: [0xEE; 16],
            },
            Message::HandshakeKem {
                kem_ciphertext: vec![0xFF; 256],
                confirmation: [0x11; 32],
            },
            Message::HandshakeComplete {
                confirmation: [0x22; 32],
            },
            Message::HandshakeFailed {
                reason: "handshake failed".to_string(),
            },
        ];

        for msg in &messages {
            let bytes = postcard::to_stdvec(msg).expect("encode should succeed");
            let decoded: Message = postcard::from_bytes(&bytes).expect("decode should succeed");
            assert_eq!(&decoded, msg, "round-trip failed for {:?}", msg);
        }
    }

    #[test]
    fn test_message_compact_encoding() {
        // Ping should be very small (just a discriminant byte)
        let bytes = postcard::to_stdvec(&Message::Ping).unwrap();
        assert!(
            bytes.len() <= 2,
            "Ping should be compact, got {} bytes",
            bytes.len()
        );
    }
}
