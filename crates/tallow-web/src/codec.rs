//! Postcard encode/decode wrappers for the wire protocol Message enum
//!
//! Provides JavaScript-accessible functions for encoding and decoding
//! protocol messages using the same postcard format as the CLI.
//!
//! Generic encode/decode uses serde-wasm-bindgen to bridge JsValue <-> Message.
//! Typed convenience functions build specific Message variants from raw fields.

use tallow_protocol::wire::Message;
use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Generic encode / decode
// ---------------------------------------------------------------------------

/// Encode a Message (as JsValue) to postcard bytes.
///
/// The JsValue must be a valid serde representation of the `Message` enum.
#[wasm_bindgen(js_name = "encodeMessage")]
pub fn encode_message(msg: JsValue) -> Result<Vec<u8>, JsValue> {
    let message: Message = serde_wasm_bindgen::from_value(msg)
        .map_err(|e| JsValue::from_str(&format!("deserialize JsValue to Message: {}", e)))?;
    postcard::to_allocvec(&message)
        .map_err(|e| JsValue::from_str(&format!("postcard encode: {}", e)))
}

/// Maximum wire message size accepted by the WASM decoder (1 MiB).
///
/// Prevents memory exhaustion from oversized messages sent by a malicious
/// relay or peer. Normal messages are well under this limit (largest is
/// a Chunk at ~256 KiB + overhead).
const MAX_MESSAGE_SIZE: usize = 1024 * 1024;

/// Decode postcard bytes to a Message (returned as JsValue).
#[wasm_bindgen(js_name = "decodeMessage")]
pub fn decode_message(bytes: &[u8]) -> Result<JsValue, JsValue> {
    if bytes.len() > MAX_MESSAGE_SIZE {
        return Err(JsValue::from_str("message too large"));
    }
    let message: Message = postcard::from_bytes(bytes)
        .map_err(|e| JsValue::from_str(&format!("postcard decode: {}", e)))?;
    serde_wasm_bindgen::to_value(&message)
        .map_err(|e| JsValue::from_str(&format!("serialize Message to JsValue: {}", e)))
}

// ---------------------------------------------------------------------------
// Convenience encoders for specific message types
// ---------------------------------------------------------------------------

/// Encode a RoomJoin message.
///
/// * `room_id`       - 32-byte BLAKE3 hash of the code phrase
/// * `password_hash` - Optional BLAKE3 hash of relay password
#[wasm_bindgen(js_name = "encodeRoomJoin")]
pub fn encode_room_join(
    room_id: &[u8],
    password_hash: Option<Vec<u8>>,
) -> Result<Vec<u8>, JsValue> {
    let msg = Message::RoomJoin {
        room_id: room_id.to_vec(),
        password_hash,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode RoomJoin: {}", e)))
}

/// Encode a FileOffer message.
///
/// * `transfer_id` - 16-byte random transfer identifier
/// * `manifest`    - Serialized file manifest bytes
#[wasm_bindgen(js_name = "encodeFileOffer")]
pub fn encode_file_offer(transfer_id: &[u8], manifest: &[u8]) -> Result<Vec<u8>, JsValue> {
    let tid = to_array_16(transfer_id, "transfer_id")?;
    let msg = Message::FileOffer {
        transfer_id: tid,
        manifest: manifest.to_vec(),
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode FileOffer: {}", e)))
}

/// Encode a FileAccept message.
///
/// * `transfer_id` - 16-byte transfer identifier
#[wasm_bindgen(js_name = "encodeFileAccept")]
pub fn encode_file_accept(transfer_id: &[u8]) -> Result<Vec<u8>, JsValue> {
    let tid = to_array_16(transfer_id, "transfer_id")?;
    let msg = Message::FileAccept { transfer_id: tid };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode FileAccept: {}", e)))
}

/// Encode a Chunk message.
///
/// * `transfer_id` - 16-byte transfer identifier
/// * `index`       - 0-based chunk index
/// * `total`       - Total chunk count (set on final chunk, None otherwise)
/// * `data`        - Encrypted chunk data
#[wasm_bindgen(js_name = "encodeChunk")]
pub fn encode_chunk(
    transfer_id: &[u8],
    index: u64,
    total: Option<u64>,
    data: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let tid = to_array_16(transfer_id, "transfer_id")?;
    let msg = Message::Chunk {
        transfer_id: tid,
        index,
        total,
        data: data.to_vec(),
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode Chunk: {}", e)))
}

/// Encode an Ack message.
///
/// * `transfer_id` - 16-byte transfer identifier
/// * `index`       - Acknowledged chunk index
#[wasm_bindgen(js_name = "encodeAck")]
pub fn encode_ack(transfer_id: &[u8], index: u64) -> Result<Vec<u8>, JsValue> {
    let tid = to_array_16(transfer_id, "transfer_id")?;
    let msg = Message::Ack {
        transfer_id: tid,
        index,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode Ack: {}", e)))
}

/// Encode a ChatText message.
///
/// * `message_id` - 16-byte unique message ID
/// * `sequence`   - Monotonic sequence number
/// * `ciphertext` - AES-256-GCM encrypted chat text
/// * `nonce`      - 12-byte nonce used for encryption
#[wasm_bindgen(js_name = "encodeChatText")]
pub fn encode_chat_text(
    message_id: &[u8],
    sequence: u64,
    ciphertext: &[u8],
    nonce: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let mid = to_array_16(message_id, "message_id")?;
    let n = to_array_12(nonce, "nonce")?;
    let msg = Message::ChatText {
        message_id: mid,
        sequence,
        ciphertext: ciphertext.to_vec(),
        nonce: n,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode ChatText: {}", e)))
}

/// Encode a TypingIndicator message.
///
/// * `typing` - true = started typing, false = stopped
#[wasm_bindgen(js_name = "encodeTypingIndicator")]
pub fn encode_typing_indicator(typing: bool) -> Result<Vec<u8>, JsValue> {
    let msg = Message::TypingIndicator { typing };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode TypingIndicator: {}", e)))
}

/// Encode a HandshakeInit message.
///
/// * `protocol_version` - Protocol version (2 = KEM handshake)
/// * `kem_capabilities`  - Serialized KEM capabilities
/// * `cpace_public`      - CPace initiator public message (32 bytes)
/// * `nonce`             - Random nonce for session binding (16 bytes)
#[wasm_bindgen(js_name = "encodeHandshakeInit")]
pub fn encode_handshake_init(
    protocol_version: u32,
    kem_capabilities: &[u8],
    cpace_public: &[u8],
    nonce: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let cp = to_array_32(cpace_public, "cpace_public")?;
    let n = to_array_16(nonce, "nonce")?;
    let msg = Message::HandshakeInit {
        protocol_version,
        kem_capabilities: kem_capabilities.to_vec(),
        cpace_public: cp,
        nonce: n,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode HandshakeInit: {}", e)))
}

/// Encode a HandshakeResponse message.
///
/// * `selected_kem`   - Selected KEM algorithm discriminant
/// * `cpace_public`   - CPace responder public message (32 bytes)
/// * `kem_public_key` - Serialized hybrid KEM public key
/// * `nonce`          - Random nonce (16 bytes)
#[wasm_bindgen(js_name = "encodeHandshakeResponse")]
pub fn encode_handshake_response(
    selected_kem: u8,
    cpace_public: &[u8],
    kem_public_key: &[u8],
    nonce: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let cp = to_array_32(cpace_public, "cpace_public")?;
    let n = to_array_16(nonce, "nonce")?;
    let msg = Message::HandshakeResponse {
        selected_kem,
        cpace_public: cp,
        kem_public_key: kem_public_key.to_vec(),
        nonce: n,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode HandshakeResponse: {}", e)))
}

/// Encode a HandshakeKem message.
///
/// * `kem_ciphertext` - Serialized hybrid KEM ciphertext
/// * `confirmation`   - Sender's key confirmation tag (32 bytes)
#[wasm_bindgen(js_name = "encodeHandshakeKem")]
pub fn encode_handshake_kem(
    kem_ciphertext: &[u8],
    confirmation: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let conf = to_array_32(confirmation, "confirmation")?;
    let msg = Message::HandshakeKem {
        kem_ciphertext: kem_ciphertext.to_vec(),
        confirmation: conf,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode HandshakeKem: {}", e)))
}

/// Encode a HandshakeComplete message.
///
/// * `confirmation` - Receiver's key confirmation tag (32 bytes)
#[wasm_bindgen(js_name = "encodeHandshakeComplete")]
pub fn encode_handshake_complete(confirmation: &[u8]) -> Result<Vec<u8>, JsValue> {
    let conf = to_array_32(confirmation, "confirmation")?;
    let msg = Message::HandshakeComplete {
        confirmation: conf,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode HandshakeComplete: {}", e)))
}

/// Encode a TransferComplete message.
///
/// * `transfer_id` - 16-byte transfer identifier
/// * `hash`        - 32-byte BLAKE3 hash of the manifest
/// * `merkle_root` - Optional 32-byte Merkle root of chunk hashes
#[wasm_bindgen(js_name = "encodeTransferComplete")]
pub fn encode_transfer_complete(
    transfer_id: &[u8],
    hash: &[u8],
    merkle_root: Option<Vec<u8>>,
) -> Result<Vec<u8>, JsValue> {
    let tid = to_array_16(transfer_id, "transfer_id")?;
    let h = to_array_32(hash, "hash")?;
    let mr = match merkle_root {
        Some(ref bytes) => Some(to_array_32(bytes, "merkle_root")?),
        None => None,
    };
    let msg = Message::TransferComplete {
        transfer_id: tid,
        hash: h,
        merkle_root: mr,
    };
    postcard::to_allocvec(&msg)
        .map_err(|e| JsValue::from_str(&format!("postcard encode TransferComplete: {}", e)))
}

/// Encode a Ping message.
#[wasm_bindgen(js_name = "encodePing")]
pub fn encode_ping() -> Result<Vec<u8>, JsValue> {
    postcard::to_allocvec(&Message::Ping)
        .map_err(|e| JsValue::from_str(&format!("postcard encode Ping: {}", e)))
}

/// Encode a Pong message.
#[wasm_bindgen(js_name = "encodePong")]
pub fn encode_pong() -> Result<Vec<u8>, JsValue> {
    postcard::to_allocvec(&Message::Pong)
        .map_err(|e| JsValue::from_str(&format!("postcard encode Pong: {}", e)))
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/// Strip ANSI escape sequences and control characters from display text.
///
/// Use on any string from the network before showing to the user.
/// Preserves newlines and tabs.
#[wasm_bindgen(js_name = "sanitizeDisplayText")]
pub fn sanitize_display_text(input: &str) -> String {
    tallow_protocol::transfer::sanitize::sanitize_display(input)
}

// ---------------------------------------------------------------------------
// Helpers: convert &[u8] slices to fixed-size arrays with validation
// ---------------------------------------------------------------------------

/// Convert a byte slice to a `[u8; 16]`, returning an error if wrong size.
fn to_array_16(bytes: &[u8], name: &str) -> Result<[u8; 16], JsValue> {
    bytes.try_into().map_err(|_| {
        JsValue::from_str(&format!(
            "{} must be exactly 16 bytes, got {}",
            name,
            bytes.len()
        ))
    })
}

/// Convert a byte slice to a `[u8; 12]`, returning an error if wrong size.
fn to_array_12(bytes: &[u8], name: &str) -> Result<[u8; 12], JsValue> {
    bytes.try_into().map_err(|_| {
        JsValue::from_str(&format!(
            "{} must be exactly 12 bytes, got {}",
            name,
            bytes.len()
        ))
    })
}

/// Convert a byte slice to a `[u8; 32]`, returning an error if wrong size.
fn to_array_32(bytes: &[u8], name: &str) -> Result<[u8; 32], JsValue> {
    bytes.try_into().map_err(|_| {
        JsValue::from_str(&format!(
            "{} must be exactly 32 bytes, got {}",
            name,
            bytes.len()
        ))
    })
}
