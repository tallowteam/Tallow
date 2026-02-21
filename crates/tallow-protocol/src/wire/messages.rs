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
        /// BLAKE3 hash of the manifest
        hash: [u8; 32],
        /// Merkle root of chunk hashes (for integrity verification)
        merkle_root: Option<[u8; 32]>,
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
    /// Resume information (receiver -> sender after FileAccept)
    ///
    /// Sent when the receiver has a checkpoint from a previous interrupted
    /// transfer. The sender skips chunks in the verified_chunks set.
    ResumeInfo {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// BLAKE3 hash of the manifest (to verify same transfer)
        manifest_hash: [u8; 32],
        /// Set of chunk indices already verified by the receiver
        verified_chunks: Vec<u64>,
    },
    /// Handshake failure (either direction)
    ///
    /// The reason string MUST NOT distinguish PAKE failure from KEM failure
    /// to avoid oracle attacks.
    HandshakeFailed {
        /// Generic failure reason
        reason: String,
    },
    /// Encrypted chat text message
    ChatText {
        /// Unique message ID for read receipts (random 16 bytes)
        message_id: [u8; 16],
        /// Monotonic sequence number for ordering
        sequence: u64,
        /// AES-256-GCM encrypted plaintext
        ciphertext: Vec<u8>,
        /// 12-byte nonce used for encryption
        nonce: [u8; 12],
    },
    /// Typing indicator (reserved for future use)
    TypingIndicator {
        /// true = started typing, false = stopped typing
        typing: bool,
    },
    /// Read receipt acknowledging messages (reserved for future use)
    ReadReceipt {
        /// Message IDs confirmed as read
        message_ids: Vec<[u8; 16]>,
    },
    /// Graceful chat session termination
    ChatEnd,

    // --- Phase 19: Multi-Peer Room variants (DO NOT reorder; postcard ordinal) ---
    /// Multi-peer room join request
    RoomJoinMulti {
        /// Room ID (BLAKE3 hash of code phrase, 32 bytes)
        room_id: Vec<u8>,
        /// BLAKE3 hash of relay password. None = no auth attempted.
        password_hash: Option<Vec<u8>>,
        /// Requested room capacity (0 = use server default)
        requested_capacity: u8,
    },
    /// Multi-peer room joined response with peer ID assignment
    RoomJoinedMulti {
        /// This peer's assigned ID in the room
        peer_id: u8,
        /// List of already-present peer IDs
        existing_peers: Vec<u8>,
    },
    /// A new peer has joined the room (broadcast to existing peers)
    PeerJoinedRoom {
        /// The new peer's assigned ID
        peer_id: u8,
    },
    /// A peer has left the room (broadcast to remaining peers)
    PeerLeftRoom {
        /// The departing peer's ID
        peer_id: u8,
    },
    /// Targeted message envelope for multi-peer routing
    ///
    /// The relay reads `to_peer` to route and overwrites `from_peer`
    /// with the actual sender's ID (anti-spoofing). Payload is opaque
    /// E2E encrypted bytes.
    Targeted {
        /// Sender's peer ID (set/overwritten by relay)
        from_peer: u8,
        /// Target peer ID (0xFF = broadcast to all)
        to_peer: u8,
        /// Opaque payload (E2E encrypted message bytes)
        payload: Vec<u8>,
    },
    /// Room peer count response
    RoomPeerCount {
        /// Current number of peers in the room
        count: u8,
        /// Room capacity
        capacity: u8,
    },

    // --- Phase 20: P2P Direct signaling variants (DO NOT reorder; postcard ordinal) ---
    /// Candidate address for P2P direct connection attempt
    CandidateOffer {
        /// Candidate type: 0 = host, 1 = server-reflexive (STUN), 2 = UPnP
        candidate_type: u8,
        /// Socket address encoded as bytes: 6 bytes (IPv4 u32 BE + port u16 BE) or 18 bytes (IPv6)
        addr: Vec<u8>,
        /// Priority (higher = preferred). Host=100, SRFLX=50, UPnP=30.
        priority: u32,
    },
    /// All candidates have been sent; peer may begin connection attempts
    CandidatesDone,
    /// Direct P2P connection established -- notify relay to stop forwarding
    DirectConnected,
    /// Direct P2P connection failed -- continue via relay
    DirectFailed,

    // --- Feature 35: Per-file accept/reject (DO NOT reorder; postcard ordinal) ---
    /// Receiver's per-file selection (sent after FileOffer, before chunks).
    ///
    /// Contains the indices of files from the manifest that the receiver
    /// wants to receive. If all indices are selected, the full transfer
    /// proceeds as normal (backward-compatible). Sent instead of FileAccept
    /// when the receiver uses `--per-file` mode.
    FileSelection {
        /// Transfer ID
        transfer_id: [u8; 16],
        /// Indices of files from the manifest that the receiver wants (0-based)
        selected_indices: Vec<u32>,
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
                merkle_root: None,
            },
            Message::TransferComplete {
                transfer_id: [1u8; 16],
                hash: [0xABu8; 32],
                merkle_root: Some([0xCDu8; 32]),
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
            Message::ResumeInfo {
                transfer_id: [3u8; 16],
                manifest_hash: [0xFFu8; 32],
                verified_chunks: vec![0, 1, 5, 10],
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
            Message::ChatText {
                message_id: [0xAA; 16],
                sequence: 1,
                ciphertext: vec![0xDE, 0xAD],
                nonce: [0xBB; 12],
            },
            Message::TypingIndicator { typing: true },
            Message::TypingIndicator { typing: false },
            Message::ReadReceipt {
                message_ids: vec![[0xCC; 16], [0xDD; 16]],
            },
            Message::ChatEnd,
            // Phase 19: Multi-peer variants
            Message::RoomJoinMulti {
                room_id: vec![0u8; 32],
                password_hash: Some(vec![0xAB; 32]),
                requested_capacity: 10,
            },
            Message::RoomJoinMulti {
                room_id: vec![0u8; 32],
                password_hash: None,
                requested_capacity: 0,
            },
            Message::RoomJoinedMulti {
                peer_id: 0,
                existing_peers: vec![],
            },
            Message::RoomJoinedMulti {
                peer_id: 3,
                existing_peers: vec![0, 1, 2],
            },
            Message::PeerJoinedRoom { peer_id: 5 },
            Message::PeerLeftRoom { peer_id: 2 },
            Message::Targeted {
                from_peer: 0,
                to_peer: 1,
                payload: vec![0xDE, 0xAD],
            },
            Message::Targeted {
                from_peer: 0,
                to_peer: 0xFF,
                payload: vec![],
            },
            Message::RoomPeerCount {
                count: 5,
                capacity: 10,
            },
            // Phase 20: P2P Direct signaling variants
            Message::CandidateOffer {
                candidate_type: 0,
                addr: vec![192, 168, 1, 42, 0x1F, 0x90],
                priority: 100,
            },
            Message::CandidateOffer {
                candidate_type: 1,
                addr: vec![],
                priority: 50,
            },
            Message::CandidatesDone,
            Message::DirectConnected,
            Message::DirectFailed,
            // Feature 35: Per-file selection
            Message::FileSelection {
                transfer_id: [1u8; 16],
                selected_indices: vec![0, 2, 5],
            },
            Message::FileSelection {
                transfer_id: [2u8; 16],
                selected_indices: vec![],
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

    #[test]
    fn test_chat_message_roundtrips() {
        let messages = vec![
            Message::ChatText {
                message_id: [0xAA; 16],
                sequence: 0,
                ciphertext: vec![0xDE, 0xAD, 0xBE, 0xEF],
                nonce: [0xBB; 12],
            },
            Message::ChatText {
                message_id: [0xFF; 16],
                sequence: u64::MAX,
                ciphertext: vec![],
                nonce: [0x00; 12],
            },
            Message::TypingIndicator { typing: true },
            Message::TypingIndicator { typing: false },
            Message::ReadReceipt {
                message_ids: vec![],
            },
            Message::ReadReceipt {
                message_ids: vec![[0x11; 16], [0x22; 16], [0x33; 16]],
            },
            Message::ChatEnd,
        ];

        for msg in &messages {
            let bytes = postcard::to_stdvec(msg).expect("encode");
            let decoded: Message = postcard::from_bytes(&bytes).expect("decode");
            assert_eq!(&decoded, msg);
        }
    }

    #[test]
    fn test_chat_end_compact() {
        // ChatEnd should be very small (just a discriminant byte), like Ping
        let bytes = postcard::to_stdvec(&Message::ChatEnd).unwrap();
        assert!(
            bytes.len() <= 2,
            "ChatEnd should be compact, got {} bytes",
            bytes.len()
        );
    }

    #[test]
    fn test_discriminant_stability_chat_end() {
        // ChatEnd was the last variant before Phase 19 additions.
        // Its encoded discriminant must not change when new variants are appended.
        let bytes = postcard::to_stdvec(&Message::ChatEnd).unwrap();
        // ChatEnd is variant index 28 (0-indexed). Postcard encodes this as varint 28.
        assert_eq!(bytes[0], 28, "ChatEnd discriminant must remain 28");
    }

    /// Verify a Targeted message can carry an inner ChatText through
    /// nested postcard serialization (the multi-peer envelope pattern).
    #[test]
    fn test_targeted_with_inner_chat_text() {
        let inner = Message::ChatText {
            message_id: [0xAA; 16],
            sequence: 5,
            ciphertext: vec![0xDE, 0xAD, 0xBE, 0xEF],
            nonce: [0xBB; 12],
        };
        let inner_bytes = postcard::to_stdvec(&inner).unwrap();

        let targeted = Message::Targeted {
            from_peer: 0,
            to_peer: 1,
            payload: inner_bytes,
        };

        let encoded = postcard::to_stdvec(&targeted).unwrap();
        let decoded: Message = postcard::from_bytes(&encoded).unwrap();

        if let Message::Targeted {
            from_peer,
            to_peer,
            payload,
        } = decoded
        {
            assert_eq!(from_peer, 0);
            assert_eq!(to_peer, 1);
            let inner_decoded: Message = postcard::from_bytes(&payload).unwrap();
            assert_eq!(inner_decoded, inner);
        } else {
            panic!("Expected Targeted");
        }
    }

    /// Verify pre-Phase-19 variants still round-trip correctly after
    /// appending the new multi-peer variants (backward compatibility).
    #[test]
    fn test_old_variants_stable_after_phase19() {
        let old_messages = vec![
            Message::Ping,
            Message::Pong,
            Message::RoomJoin {
                room_id: vec![0; 32],
                password_hash: None,
            },
            Message::RoomJoined { peer_present: true },
            Message::ChatEnd,
            Message::ChatText {
                message_id: [0xAA; 16],
                sequence: 1,
                ciphertext: vec![0xDE, 0xAD],
                nonce: [0xBB; 12],
            },
            Message::HandshakeInit {
                protocol_version: 1,
                kem_capabilities: vec![0],
                cpace_public: [0xCC; 32],
                nonce: [0xDD; 16],
            },
        ];
        for msg in &old_messages {
            let bytes = postcard::to_stdvec(msg).unwrap();
            let decoded: Message = postcard::from_bytes(&bytes).unwrap();
            assert_eq!(&decoded, msg, "backward compat failed for {:?}", msg);
        }
    }

    #[test]
    fn test_discriminant_stability_p2p_variants() {
        // RoomPeerCount was variant index 34 (the last pre-Phase-20 variant).
        // CandidateOffer must be 35, CandidatesDone 36, DirectConnected 37, DirectFailed 38.
        let bytes = postcard::to_stdvec(&Message::CandidateOffer {
            candidate_type: 0,
            addr: vec![],
            priority: 0,
        })
        .unwrap();
        assert_eq!(bytes[0], 35, "CandidateOffer discriminant must be 35");

        let bytes = postcard::to_stdvec(&Message::CandidatesDone).unwrap();
        assert_eq!(bytes[0], 36, "CandidatesDone discriminant must be 36");

        let bytes = postcard::to_stdvec(&Message::DirectConnected).unwrap();
        assert_eq!(bytes[0], 37, "DirectConnected discriminant must be 37");

        let bytes = postcard::to_stdvec(&Message::DirectFailed).unwrap();
        assert_eq!(bytes[0], 38, "DirectFailed discriminant must be 38");
    }

    /// Verify all P2P signaling message variants round-trip correctly through postcard
    #[test]
    fn test_p2p_message_roundtrip() {
        let msgs = vec![
            Message::CandidateOffer {
                candidate_type: 0,
                addr: vec![192, 168, 1, 42, 0x1F, 0x90], // 192.168.1.42:8080
                priority: 100,
            },
            Message::CandidateOffer {
                candidate_type: 1,
                addr: vec![8, 8, 8, 8, 0x11, 0x51], // 8.8.8.8:4433
                priority: 50,
            },
            Message::CandidateOffer {
                candidate_type: 2,
                addr: vec![10, 0, 0, 1, 0x00, 0x50], // 10.0.0.1:80
                priority: 30,
            },
            Message::CandidatesDone,
            Message::DirectConnected,
            Message::DirectFailed,
        ];

        for msg in &msgs {
            let bytes = postcard::to_stdvec(msg).unwrap();
            let decoded: Message = postcard::from_bytes(&bytes).unwrap();
            assert_eq!(&decoded, msg, "P2P round-trip failed for {:?}", msg);
        }
    }

    /// Verify pre-Phase-20 variants are unchanged after appending P2P variants
    #[test]
    fn test_old_variants_stable_after_phase20() {
        let old_messages = vec![
            Message::Ping,
            Message::Pong,
            Message::ChatEnd,
            Message::RoomJoinMulti {
                room_id: vec![0; 32],
                password_hash: None,
                requested_capacity: 5,
            },
            Message::RoomPeerCount {
                count: 3,
                capacity: 10,
            },
            Message::HandshakeInit {
                protocol_version: 1,
                kem_capabilities: vec![0],
                cpace_public: [0xCC; 32],
                nonce: [0xDD; 16],
            },
            Message::FileOffer {
                transfer_id: [1u8; 16],
                manifest: vec![0, 1, 2, 3],
            },
        ];
        for msg in &old_messages {
            let bytes = postcard::to_stdvec(msg).unwrap();
            let decoded: Message = postcard::from_bytes(&bytes).unwrap();
            assert_eq!(
                &decoded, msg,
                "backward compat failed after Phase 20 for {:?}",
                msg
            );
        }
    }

    /// Verify CandidateOffer with empty addr round-trips (edge case)
    #[test]
    fn test_candidate_offer_empty_addr() {
        let msg = Message::CandidateOffer {
            candidate_type: 0,
            addr: vec![],
            priority: 0,
        };
        let bytes = postcard::to_stdvec(&msg).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(decoded, msg);
    }

    /// Verify CandidateOffer with IPv6-sized addr (18 bytes) round-trips
    #[test]
    fn test_candidate_offer_ipv6_addr() {
        let msg = Message::CandidateOffer {
            candidate_type: 0,
            addr: vec![
                0x20, 0x01, 0x0d, 0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x01, 0x11, 0x51,
            ],
            priority: 100,
        };
        let bytes = postcard::to_stdvec(&msg).unwrap();
        let decoded: Message = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(decoded, msg);
    }

    /// Verify a Targeted broadcast (to_peer = 0xFF) with inner ChatEnd.
    #[test]
    fn test_targeted_broadcast_chat_end() {
        let inner = Message::ChatEnd;
        let inner_bytes = postcard::to_stdvec(&inner).unwrap();

        let broadcast = Message::Targeted {
            from_peer: 2,
            to_peer: 0xFF,
            payload: inner_bytes,
        };

        let encoded = postcard::to_stdvec(&broadcast).unwrap();
        let decoded: Message = postcard::from_bytes(&encoded).unwrap();

        if let Message::Targeted {
            from_peer,
            to_peer,
            payload,
        } = decoded
        {
            assert_eq!(from_peer, 2);
            assert_eq!(to_peer, 0xFF);
            let inner_decoded: Message = postcard::from_bytes(&payload).unwrap();
            assert_eq!(inner_decoded, Message::ChatEnd);
        } else {
            panic!("Expected Targeted");
        }
    }

    // --- Feature 35: FileSelection tests ---

    #[test]
    fn test_file_selection_roundtrip() {
        let messages = vec![
            Message::FileSelection {
                transfer_id: [0xAA; 16],
                selected_indices: vec![0, 1, 2, 3],
            },
            Message::FileSelection {
                transfer_id: [0xBB; 16],
                selected_indices: vec![],
            },
            Message::FileSelection {
                transfer_id: [0xCC; 16],
                selected_indices: vec![0],
            },
            Message::FileSelection {
                transfer_id: [0xDD; 16],
                selected_indices: vec![u32::MAX],
            },
        ];

        for msg in &messages {
            let bytes = postcard::to_stdvec(msg).unwrap();
            let decoded: Message = postcard::from_bytes(&bytes).unwrap();
            assert_eq!(
                &decoded, msg,
                "FileSelection round-trip failed for {:?}",
                msg
            );
        }
    }

    #[test]
    fn test_discriminant_stability_file_selection() {
        // FileSelection is the variant after DirectFailed (index 38).
        // It must be discriminant 39.
        let bytes = postcard::to_stdvec(&Message::FileSelection {
            transfer_id: [0; 16],
            selected_indices: vec![],
        })
        .unwrap();
        assert_eq!(bytes[0], 39, "FileSelection discriminant must be 39");
    }

    #[test]
    fn test_old_variants_stable_after_file_selection() {
        // Verify that appending FileSelection does not shift existing discriminants
        let old_messages = vec![
            Message::Ping,
            Message::Pong,
            Message::ChatEnd,
            Message::DirectFailed,
            Message::FileOffer {
                transfer_id: [1u8; 16],
                manifest: vec![0, 1, 2, 3],
            },
            Message::FileAccept {
                transfer_id: [1u8; 16],
            },
        ];
        for msg in &old_messages {
            let bytes = postcard::to_stdvec(msg).unwrap();
            let decoded: Message = postcard::from_bytes(&bytes).unwrap();
            assert_eq!(
                &decoded, msg,
                "backward compat failed after FileSelection for {:?}",
                msg
            );
        }
    }
}
