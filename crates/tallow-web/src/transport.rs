//! WebSocket connection helpers for WASM side
//!
//! Provides message encoding/decoding for room join/response operations.
//! The TypeScript side owns the WebSocket — this module provides
//! postcard encoding helpers so the browser can construct valid wire messages.

use tallow_protocol::wire::Message;
use wasm_bindgen::prelude::*;

/// WebSocket transport helper for preparing room messages.
///
/// Does NOT own the WebSocket connection (TypeScript manages that).
/// Provides message encoding/decoding for room operations.
#[wasm_bindgen]
pub struct WsTransport;

#[wasm_bindgen]
impl WsTransport {
    /// Create a new WsTransport helper.
    #[wasm_bindgen(constructor)]
    pub fn new() -> WsTransport {
        WsTransport
    }

    /// Prepare a RoomJoin message (legacy 2-peer rooms) ready to send via WebSocket.
    ///
    /// * `room_id` - 32-byte BLAKE3 hash of the code phrase
    /// * `password_hash` - Optional BLAKE3 hash of relay password (or `None`)
    ///
    /// Returns postcard-encoded bytes ready to send as a WebSocket binary message.
    #[wasm_bindgen(js_name = "prepareRoomJoin")]
    pub fn prepare_room_join(
        &self,
        room_id: &[u8],
        password_hash: Option<Vec<u8>>,
    ) -> Result<Vec<u8>, JsValue> {
        let msg = Message::RoomJoin {
            room_id: room_id.to_vec(),
            password_hash,
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode RoomJoin: {}", e)))
    }

    /// Prepare a RoomJoinMulti message (multi-peer rooms) ready to send.
    ///
    /// * `room_id` - 32-byte BLAKE3 hash of the code phrase
    /// * `password_hash` - Optional BLAKE3 hash of relay password
    /// * `capacity` - Requested room capacity (0 = server default)
    ///
    /// Returns postcard-encoded bytes.
    #[wasm_bindgen(js_name = "prepareRoomJoinMulti")]
    pub fn prepare_room_join_multi(
        &self,
        room_id: &[u8],
        password_hash: Option<Vec<u8>>,
        capacity: u8,
    ) -> Result<Vec<u8>, JsValue> {
        let msg = Message::RoomJoinMulti {
            room_id: room_id.to_vec(),
            password_hash,
            requested_capacity: capacity,
        };
        postcard::to_allocvec(&msg)
            .map_err(|e| JsValue::from_str(&format!("encode RoomJoinMulti: {}", e)))
    }

    /// Parse a room response message from the relay.
    ///
    /// Returns a JsValue with one of:
    /// - `{type: "RoomJoined", peer_present: boolean}`
    /// - `{type: "RoomJoinedMulti", peer_id: number, existing_peers: number[]}`
    /// - `{type: "PeerArrived"}`
    /// - `{type: "PeerJoinedRoom", peer_id: number}`
    /// - `{type: "PeerLeftRoom", peer_id: number}`
    /// - `{type: "Unknown", raw: string}` for other message types
    #[wasm_bindgen(js_name = "parseRoomResponse")]
    pub fn parse_room_response(&self, data: &[u8]) -> Result<JsValue, JsValue> {
        if data.len() > 1024 * 1024 {
            return Err(JsValue::from_str("message too large"));
        }
        let message: Message = postcard::from_bytes(data)
            .map_err(|e| JsValue::from_str(&format!("decode message: {}", e)))?;

        serde_wasm_bindgen::to_value(&message)
            .map_err(|e| JsValue::from_str(&format!("serialize to JsValue: {}", e)))
    }
}
