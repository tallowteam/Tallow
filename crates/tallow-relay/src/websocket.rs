//! WebSocket transport for browser clients
//!
//! Runs an axum HTTP server that upgrades connections to WebSocket.
//! Each WebSocket client joins the same room system as QUIC clients.
//! The relay bridges message framing between transports:
//!
//! - **WS -> Room**: WebSocket messages are already framed, so a 4-byte
//!   big-endian length prefix is prepended before sending into the room
//!   channel (QUIC peers expect length-prefixed framing via TallowCodec).
//!
//! - **Room -> WS**: Messages from the room channel include a 4-byte
//!   length prefix (added by the QUIC handler). This prefix is stripped
//!   before sending as a binary WebSocket message.

use axum::{
    extract::ws::{Message as WsMsg, WebSocket, WebSocketUpgrade},
    extract::State,
    response::IntoResponse,
    routing::get,
    Router,
};
use bytes::Bytes;
use futures::{SinkExt, StreamExt};
use std::sync::Arc;
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};
use tracing::{debug, info, warn};

use crate::auth;
use crate::room::RoomManager;

/// Timeout for the initial WebSocket room join message
const WS_HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(10);

/// Maximum message size from WebSocket clients (16 MiB)
const MAX_WS_MESSAGE_SIZE: usize = 16 * 1024 * 1024;

/// Shared state for WebSocket handlers
pub struct WsState {
    /// Room manager shared with QUIC path
    pub room_manager: Arc<RoomManager>,
    /// Relay password (empty = open relay, no authentication required).
    /// Wrapped in `Zeroizing` so the password is wiped from memory on drop.
    pub password: zeroize::Zeroizing<String>,
}

/// Create the axum Router for WebSocket connections
///
/// Routes:
/// - `GET /ws` - WebSocket upgrade handler
/// - `GET /health` - Health check (200 OK)
///
/// CORS is permissive because the relay is a data forwarding service.
/// Security comes from E2E encryption, not origin checking.
pub fn ws_router(state: Arc<WsState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(health_handler))
        .layer(cors)
        .with_state(state)
}

/// Health check endpoint
async fn health_handler() -> &'static str {
    "ok"
}

/// WebSocket upgrade handler
///
/// Accepts the HTTP upgrade and spawns the client handler task.
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<WsState>>,
) -> impl IntoResponse {
    ws.max_message_size(MAX_WS_MESSAGE_SIZE)
        .on_upgrade(move |socket| handle_ws_client(socket, state))
}

/// Handle a single WebSocket client connection
///
/// 1. Read first message (RoomJoin or RoomJoinMulti, postcard-encoded, no length prefix)
/// 2. Authenticate if password required
/// 3. Join room via RoomManager
/// 4. Send room joined response
/// 5. Bridge bidirectionally between WebSocket and room channels
async fn handle_ws_client(socket: WebSocket, state: Arc<WsState>) {
    if let Err(e) = handle_ws_client_inner(socket, state).await {
        debug!("WebSocket client disconnected: {}", e);
    }
}

/// Inner handler with error propagation
async fn handle_ws_client_inner(
    socket: WebSocket,
    state: Arc<WsState>,
) -> Result<(), WsError> {
    let (mut ws_sink, mut ws_stream) = socket.split();

    // Step 1: Read first message with timeout (room join)
    let join_data = tokio::time::timeout(WS_HANDSHAKE_TIMEOUT, async {
        while let Some(msg) = ws_stream.next().await {
            match msg {
                Ok(WsMsg::Binary(data)) => return Ok(data.to_vec()),
                Ok(WsMsg::Ping(_)) | Ok(WsMsg::Pong(_)) => continue,
                Ok(WsMsg::Close(_)) => return Err(WsError::ClosedDuringHandshake),
                Ok(_) => return Err(WsError::NonBinaryMessage),
                Err(e) => return Err(WsError::Transport(e.to_string())),
            }
        }
        Err(WsError::ClosedDuringHandshake)
    })
    .await
    .map_err(|_| WsError::HandshakeTimeout)??;

    // Step 2: Parse as Message to determine room join type
    let msg: tallow_protocol::wire::Message =
        postcard::from_bytes(&join_data).map_err(|e| WsError::InvalidMessage(e.to_string()))?;

    match msg {
        tallow_protocol::wire::Message::RoomJoin {
            room_id,
            password_hash,
        } => {
            handle_ws_legacy_join(
                &state,
                &mut ws_sink,
                ws_stream,
                &room_id,
                password_hash.as_deref(),
            )
            .await
        }
        tallow_protocol::wire::Message::RoomJoinMulti {
            room_id,
            password_hash,
            requested_capacity,
        } => {
            handle_ws_multi_join(
                &state,
                &mut ws_sink,
                ws_stream,
                &room_id,
                password_hash.as_deref(),
                requested_capacity,
            )
            .await
        }
        _ => Err(WsError::InvalidMessage(
            "expected RoomJoin or RoomJoinMulti".to_string(),
        )),
    }
}

/// Handle a legacy 2-peer room join via WebSocket
async fn handle_ws_legacy_join(
    state: &Arc<WsState>,
    ws_sink: &mut futures::stream::SplitSink<WebSocket, WsMsg>,
    ws_stream: futures::stream::SplitStream<WebSocket>,
    room_id_bytes: &[u8],
    password_hash: Option<&[u8]>,
) -> Result<(), WsError> {
    // Validate room_id
    if room_id_bytes.len() != 32 {
        return Err(WsError::InvalidMessage(format!(
            "invalid room_id length: {}",
            room_id_bytes.len()
        )));
    }
    let mut room_id = [0u8; 32];
    room_id.copy_from_slice(room_id_bytes);

    // Auth check
    let pw_hash: Option<[u8; 32]> = extract_password_hash(password_hash);
    if !auth::verify_relay_password(pw_hash.as_ref(), &state.password) {
        warn!("WebSocket auth failed");
        let reject_payload = postcard::to_stdvec(
            &tallow_protocol::wire::Message::HandshakeFailed {
                reason: "authentication failed".to_string(),
            },
        )
        .unwrap_or_default();
        let _ = ws_sink.send(WsMsg::Binary(Bytes::from(reject_payload))).await;
        return Err(WsError::AuthFailed);
    }

    // Join room
    let (mut peer_rx, _peer_tx, peer_present) = state
        .room_manager
        .join_with_ip(room_id, None)
        .map_err(|e| WsError::RoomError(e.to_string()))?;

    let is_peer_a = !peer_present;

    // Send RoomJoined response (raw postcard, no length prefix)
    let joined_msg = tallow_protocol::wire::Message::RoomJoined { peer_present };
    let joined_payload =
        postcard::to_stdvec(&joined_msg).map_err(|e| WsError::Encode(e.to_string()))?;
    ws_sink
        .send(WsMsg::Binary(Bytes::from(joined_payload)))
        .await
        .map_err(|e| WsError::Transport(e.to_string()))?;

    // Notify peer_a if we're peer_b
    if peer_present {
        if let Some(peer_a_tx) = state.room_manager.get_peer_sender(&room_id, false) {
            let arrived_payload = vec![2u8]; // PeerArrived indicator
            let mut arrived_msg = Vec::with_capacity(5);
            arrived_msg.extend_from_slice(&(arrived_payload.len() as u32).to_be_bytes());
            arrived_msg.extend_from_slice(&arrived_payload);
            let _ = peer_a_tx.send(arrived_msg).await;
        }
    }

    info!(
        "WebSocket peer joined legacy room (peer_a={})",
        is_peer_a,
    );

    let room_manager = Arc::clone(&state.room_manager);

    // Bidirectional bridge
    bridge_ws_legacy(ws_sink, ws_stream, &mut peer_rx, &room_manager, &room_id, is_peer_a).await;

    // Cleanup
    debug!("WebSocket peer disconnected from legacy room");
    state.room_manager.peer_disconnected(&room_id, None);

    Ok(())
}

/// Handle a multi-peer room join via WebSocket
async fn handle_ws_multi_join(
    state: &Arc<WsState>,
    ws_sink: &mut futures::stream::SplitSink<WebSocket, WsMsg>,
    ws_stream: futures::stream::SplitStream<WebSocket>,
    room_id_bytes: &[u8],
    password_hash: Option<&[u8]>,
    requested_capacity: u8,
) -> Result<(), WsError> {
    // Validate room_id
    if room_id_bytes.len() != 32 {
        return Err(WsError::InvalidMessage(format!(
            "invalid room_id length: {}",
            room_id_bytes.len()
        )));
    }
    let mut room_id = [0u8; 32];
    room_id.copy_from_slice(room_id_bytes);

    // Auth check
    let pw_hash: Option<[u8; 32]> = extract_password_hash(password_hash);
    if !auth::verify_relay_password(pw_hash.as_ref(), &state.password) {
        warn!("WebSocket auth failed (multi)");
        let reject_payload = postcard::to_stdvec(
            &tallow_protocol::wire::Message::HandshakeFailed {
                reason: "authentication failed".to_string(),
            },
        )
        .unwrap_or_default();
        let _ = ws_sink.send(WsMsg::Binary(Bytes::from(reject_payload))).await;
        return Err(WsError::AuthFailed);
    }

    // Join multi-peer room
    let (mut peer_rx, my_peer_id, existing_peers) = state
        .room_manager
        .join_multi(room_id, requested_capacity, None)
        .map_err(|e| WsError::RoomError(e.to_string()))?;

    info!(
        "WebSocket peer {} joined multi-room (existing: {:?})",
        my_peer_id, existing_peers,
    );

    // Send RoomJoinedMulti response (raw postcard, no length prefix)
    let joined_msg = tallow_protocol::wire::Message::RoomJoinedMulti {
        peer_id: my_peer_id,
        existing_peers: existing_peers.clone(),
    };
    let joined_payload =
        postcard::to_stdvec(&joined_msg).map_err(|e| WsError::Encode(e.to_string()))?;
    ws_sink
        .send(WsMsg::Binary(Bytes::from(joined_payload)))
        .await
        .map_err(|e| WsError::Transport(e.to_string()))?;

    // Notify existing peers
    if let Some(room) = state.room_manager.get_multi_room(&room_id) {
        let notify_msg = tallow_protocol::wire::Message::PeerJoinedRoom {
            peer_id: my_peer_id,
        };
        if let Ok(notify_payload) = postcard::to_stdvec(&notify_msg) {
            let mut notify_bytes = Vec::with_capacity(4 + notify_payload.len());
            notify_bytes.extend_from_slice(&(notify_payload.len() as u32).to_be_bytes());
            notify_bytes.extend_from_slice(&notify_payload);
            room.broadcast_from(my_peer_id, notify_bytes).await;
        }
    }

    let room_manager = Arc::clone(&state.room_manager);

    // Bidirectional bridge
    bridge_ws_multi(
        ws_sink,
        ws_stream,
        &mut peer_rx,
        &room_manager,
        &room_id,
        my_peer_id,
    )
    .await;

    // Notify remaining peers
    if let Some(room) = state.room_manager.get_multi_room(&room_id) {
        let left_msg = tallow_protocol::wire::Message::PeerLeftRoom {
            peer_id: my_peer_id,
        };
        if let Ok(left_payload) = postcard::to_stdvec(&left_msg) {
            let mut left_bytes = Vec::with_capacity(4 + left_payload.len());
            left_bytes.extend_from_slice(&(left_payload.len() as u32).to_be_bytes());
            left_bytes.extend_from_slice(&left_payload);
            room.broadcast_from(my_peer_id, left_bytes).await;
        }
    }

    // Cleanup
    debug!("WebSocket peer {} disconnected from multi-room", my_peer_id);
    state
        .room_manager
        .multi_peer_disconnected(&room_id, my_peer_id, None);

    Ok(())
}

/// Bidirectional bridge for legacy 2-peer rooms
///
/// WS -> Room: prepend 4-byte BE length prefix (QUIC peers expect it)
/// Room -> WS: strip 4-byte BE length prefix (WS has its own framing)
async fn bridge_ws_legacy(
    ws_sink: &mut futures::stream::SplitSink<WebSocket, WsMsg>,
    mut ws_stream: futures::stream::SplitStream<WebSocket>,
    peer_rx: &mut tokio::sync::mpsc::Receiver<Vec<u8>>,
    room_manager: &Arc<RoomManager>,
    room_id: &[u8; 32],
    is_peer_a: bool,
) {
    // WS -> Room: add length prefix
    let room_manager_fwd = Arc::clone(room_manager);
    let room_id_fwd = *room_id;

    let ws_to_room = async {
        while let Some(msg) = ws_stream.next().await {
            match msg {
                Ok(WsMsg::Binary(data)) => {
                    if data.len() > MAX_WS_MESSAGE_SIZE {
                        break;
                    }
                    // Prepend 4-byte big-endian length prefix for QUIC framing
                    let mut prefixed = Vec::with_capacity(4 + data.len());
                    prefixed.extend_from_slice(&(data.len() as u32).to_be_bytes());
                    prefixed.extend_from_slice(&data);

                    if let Some(tx) =
                        room_manager_fwd.get_peer_sender(&room_id_fwd, is_peer_a)
                    {
                        if tx.send(prefixed).await.is_err() {
                            break;
                        }
                        room_manager_fwd.touch_room(&room_id_fwd);
                    }
                }
                Ok(WsMsg::Ping(_)) | Ok(WsMsg::Pong(_)) => continue,
                Ok(WsMsg::Close(_)) | Err(_) => break,
                Ok(_) => continue,
            }
        }
    };

    // Room -> WS: strip length prefix
    let room_to_ws = async {
        while let Some(data) = peer_rx.recv().await {
            // Strip 4-byte length prefix from room channel data
            let payload = if data.len() >= 4 {
                &data[4..]
            } else {
                &data
            };
            if ws_sink
                .send(WsMsg::Binary(Bytes::from(payload.to_vec())))
                .await
                .is_err()
            {
                break;
            }
        }
    };

    tokio::select! {
        _ = ws_to_room => {}
        _ = room_to_ws => {}
    }
}

/// Bidirectional bridge for multi-peer rooms
///
/// Same length prefix adaptation as legacy, plus Targeted message routing.
async fn bridge_ws_multi(
    ws_sink: &mut futures::stream::SplitSink<WebSocket, WsMsg>,
    mut ws_stream: futures::stream::SplitStream<WebSocket>,
    peer_rx: &mut tokio::sync::mpsc::Receiver<Vec<u8>>,
    room_manager: &Arc<RoomManager>,
    room_id: &[u8; 32],
    my_peer_id: u8,
) {
    let room_manager_fwd = Arc::clone(room_manager);
    let room_id_fwd = *room_id;

    // WS -> Room: parse for Targeted routing, add length prefix
    let ws_to_room = async {
        while let Some(msg) = ws_stream.next().await {
            match msg {
                Ok(WsMsg::Binary(data)) => {
                    if data.len() > MAX_WS_MESSAGE_SIZE {
                        break;
                    }

                    // Try to decode for routing
                    if let Ok(parsed) =
                        postcard::from_bytes::<tallow_protocol::wire::Message>(&data)
                    {
                        match parsed {
                            tallow_protocol::wire::Message::Targeted {
                                to_peer, payload, ..
                            } => {
                                // Overwrite from_peer (anti-spoofing)
                                let routed = tallow_protocol::wire::Message::Targeted {
                                    from_peer: my_peer_id,
                                    to_peer,
                                    payload,
                                };
                                let routed_payload = match postcard::to_stdvec(&routed) {
                                    Ok(p) => p,
                                    Err(_) => break,
                                };
                                // Add length prefix
                                let mut routed_bytes =
                                    Vec::with_capacity(4 + routed_payload.len());
                                routed_bytes.extend_from_slice(
                                    &(routed_payload.len() as u32).to_be_bytes(),
                                );
                                routed_bytes.extend_from_slice(&routed_payload);

                                if let Some(room) =
                                    room_manager_fwd.get_multi_room(&room_id_fwd)
                                {
                                    if to_peer == 0xFF {
                                        room.broadcast_from(my_peer_id, routed_bytes).await;
                                    } else {
                                        let _ = room.send_to(to_peer, routed_bytes).await;
                                    }
                                    drop(room);
                                    room_manager_fwd.touch_multi_room(&room_id_fwd);
                                }
                            }
                            _ => {
                                debug!(
                                    "ignoring non-Targeted WS message from peer {} in multi-room",
                                    my_peer_id,
                                );
                            }
                        }
                    }
                }
                Ok(WsMsg::Ping(_)) | Ok(WsMsg::Pong(_)) => continue,
                Ok(WsMsg::Close(_)) | Err(_) => break,
                Ok(_) => continue,
            }
        }
    };

    // Room -> WS: strip length prefix
    let room_to_ws = async {
        while let Some(data) = peer_rx.recv().await {
            let payload = if data.len() >= 4 {
                &data[4..]
            } else {
                &data
            };
            if ws_sink
                .send(WsMsg::Binary(Bytes::from(payload.to_vec())))
                .await
                .is_err()
            {
                break;
            }
        }
    };

    tokio::select! {
        _ = ws_to_room => {}
        _ = room_to_ws => {}
    }
}

/// Extract a 32-byte password hash from an optional byte slice
fn extract_password_hash(data: Option<&[u8]>) -> Option<[u8; 32]> {
    data.and_then(|h| {
        if h.len() == 32 {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(h);
            Some(arr)
        } else {
            None
        }
    })
}

/// WebSocket handler errors
#[derive(Debug)]
enum WsError {
    /// Client closed connection during handshake
    ClosedDuringHandshake,
    /// Non-binary message received (expected binary)
    NonBinaryMessage,
    /// Transport error
    Transport(String),
    /// Handshake timed out
    HandshakeTimeout,
    /// Invalid/unparseable message
    InvalidMessage(String),
    /// Encoding error
    Encode(String),
    /// Authentication failed
    AuthFailed,
    /// Room join error
    RoomError(String),
}

impl std::fmt::Display for WsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ClosedDuringHandshake => write!(f, "closed during handshake"),
            Self::NonBinaryMessage => write!(f, "non-binary message received"),
            Self::Transport(e) => write!(f, "transport error: {}", e),
            Self::HandshakeTimeout => write!(f, "handshake timeout"),
            Self::InvalidMessage(e) => write!(f, "invalid message: {}", e),
            Self::Encode(e) => write!(f, "encode error: {}", e),
            Self::AuthFailed => write!(f, "authentication failed"),
            Self::RoomError(e) => write!(f, "room error: {}", e),
        }
    }
}

impl std::error::Error for WsError {}

/// Add 4-byte big-endian length prefix to raw bytes
///
/// Used to convert WebSocket-framed messages to the length-prefixed
/// format that QUIC peers (via TallowCodec) expect.
#[cfg(test)]
pub fn add_length_prefix(data: &[u8]) -> Vec<u8> {
    let mut prefixed = Vec::with_capacity(4 + data.len());
    prefixed.extend_from_slice(&(data.len() as u32).to_be_bytes());
    prefixed.extend_from_slice(data);
    prefixed
}

/// Strip 4-byte big-endian length prefix from bytes
///
/// Used to convert length-prefixed room channel data back to raw
/// postcard bytes for WebSocket transmission.
#[cfg(test)]
pub fn strip_length_prefix(data: &[u8]) -> &[u8] {
    if data.len() >= 4 {
        &data[4..]
    } else {
        data
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ws_router_creates_valid_router() {
        let room_manager = Arc::new(RoomManager::new_with_multi_capacity(100, 10));
        let state = Arc::new(WsState {
            room_manager,
            password: String::new(),
        });
        // Should not panic
        let _router = ws_router(state);
    }

    #[tokio::test]
    async fn test_health_endpoint_returns_200() {
        use axum::body::Body;
        use axum::http::{Request, StatusCode};
        use tower::ServiceExt;

        let room_manager = Arc::new(RoomManager::new_with_multi_capacity(100, 10));
        let state = Arc::new(WsState {
            room_manager,
            password: String::new(),
        });
        let app = ws_router(state);

        let request = Request::builder()
            .uri("/health")
            .body(Body::empty())
            .unwrap();
        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[test]
    fn test_length_prefix_add_strip_roundtrip() {
        let original = vec![0xDE, 0xAD, 0xBE, 0xEF];
        let prefixed = add_length_prefix(&original);

        // Verify prefix
        assert_eq!(prefixed.len(), 4 + original.len());
        let len = u32::from_be_bytes([prefixed[0], prefixed[1], prefixed[2], prefixed[3]]);
        assert_eq!(len, original.len() as u32);

        // Verify roundtrip
        let stripped = strip_length_prefix(&prefixed);
        assert_eq!(stripped, &original);
    }

    #[test]
    fn test_length_prefix_empty_data() {
        let original: Vec<u8> = vec![];
        let prefixed = add_length_prefix(&original);
        assert_eq!(prefixed, vec![0, 0, 0, 0]);

        let stripped = strip_length_prefix(&prefixed);
        assert!(stripped.is_empty());
    }

    #[test]
    fn test_length_prefix_large_message() {
        let original = vec![0xAB; 65536];
        let prefixed = add_length_prefix(&original);
        let len = u32::from_be_bytes([prefixed[0], prefixed[1], prefixed[2], prefixed[3]]);
        assert_eq!(len, 65536);

        let stripped = strip_length_prefix(&prefixed);
        assert_eq!(stripped, &original);
    }

    #[test]
    fn test_extract_password_hash_valid() {
        let hash = [42u8; 32];
        let result = extract_password_hash(Some(&hash));
        assert_eq!(result, Some(hash));
    }

    #[test]
    fn test_extract_password_hash_wrong_length() {
        let short = [42u8; 16];
        assert!(extract_password_hash(Some(&short)).is_none());
    }

    #[test]
    fn test_extract_password_hash_none() {
        assert!(extract_password_hash(None).is_none());
    }

    #[test]
    fn test_ws_state_shares_room_manager() {
        let room_manager = Arc::new(RoomManager::new_with_multi_capacity(100, 10));
        let rm_ptr = Arc::as_ptr(&room_manager);
        let state = Arc::new(WsState {
            room_manager: Arc::clone(&room_manager),
            password: String::new(),
        });
        // Verify same Arc instance
        assert_eq!(Arc::as_ptr(&state.room_manager), rm_ptr);
    }

    #[tokio::test]
    async fn test_cors_headers_present() {
        use axum::body::Body;
        use axum::http::Request;
        use tower::ServiceExt;

        let room_manager = Arc::new(RoomManager::new_with_multi_capacity(100, 10));
        let state = Arc::new(WsState {
            room_manager,
            password: String::new(),
        });
        let app = ws_router(state);

        // Send OPTIONS preflight request
        let request = Request::builder()
            .method("OPTIONS")
            .uri("/health")
            .header("Origin", "http://example.com")
            .header("Access-Control-Request-Method", "GET")
            .body(Body::empty())
            .unwrap();
        let response = app.oneshot(request).await.unwrap();

        // CORS should allow any origin
        let cors_header = response
            .headers()
            .get("access-control-allow-origin")
            .map(|v| v.to_str().unwrap_or(""));
        assert_eq!(cors_header, Some("*"));
    }

    #[test]
    fn test_room_join_parsing() {
        // Construct a valid RoomJoin message
        let msg = tallow_protocol::wire::Message::RoomJoin {
            room_id: vec![1u8; 32],
            password_hash: None,
        };
        let encoded = postcard::to_stdvec(&msg).unwrap();

        // Should parse back correctly
        let decoded: tallow_protocol::wire::Message =
            postcard::from_bytes(&encoded).unwrap();
        match decoded {
            tallow_protocol::wire::Message::RoomJoin {
                room_id,
                password_hash,
            } => {
                assert_eq!(room_id, vec![1u8; 32]);
                assert!(password_hash.is_none());
            }
            _ => panic!("expected RoomJoin"),
        }
    }

    #[test]
    fn test_room_join_multi_parsing() {
        let msg = tallow_protocol::wire::Message::RoomJoinMulti {
            room_id: vec![2u8; 32],
            password_hash: Some(vec![3u8; 32]),
            requested_capacity: 5,
        };
        let encoded = postcard::to_stdvec(&msg).unwrap();

        let decoded: tallow_protocol::wire::Message =
            postcard::from_bytes(&encoded).unwrap();
        match decoded {
            tallow_protocol::wire::Message::RoomJoinMulti {
                room_id,
                password_hash,
                requested_capacity,
            } => {
                assert_eq!(room_id, vec![2u8; 32]);
                assert_eq!(password_hash, Some(vec![3u8; 32]));
                assert_eq!(requested_capacity, 5);
            }
            _ => panic!("expected RoomJoinMulti"),
        }
    }
}
