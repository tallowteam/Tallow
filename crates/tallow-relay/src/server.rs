//! Relay server implementation
//!
//! Accepts QUIC connections, pairs peers by room code, and forwards
//! encrypted bytes bidirectionally without inspection.

use crate::auth;
use crate::config::RelayConfig;
use crate::rate_limit::RateLimiter;
use crate::room::{RoomId, RoomManager};
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tracing::{info, warn};
use zeroize::Zeroize;

/// Timeout for the initial handshake (room join message).
/// Prevents slowloris-style attacks where a client opens a connection
/// and never sends data, holding the spawned task indefinitely.
const HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(10);

/// Relay server
pub struct RelayServer {
    config: RelayConfig,
    room_manager: Arc<RoomManager>,
    rate_limiter: Arc<Mutex<RateLimiter>>,
}

impl RelayServer {
    /// Create a new relay server
    pub fn new(config: RelayConfig) -> Self {
        let room_manager = Arc::new(RoomManager::new_with_multi_capacity(
            config.max_rooms,
            config.max_peers_per_room,
        ));
        let rate_limiter = Arc::new(Mutex::new(RateLimiter::new(config.rate_limit)));

        Self {
            config,
            room_manager,
            rate_limiter,
        }
    }

    /// Start the relay server
    ///
    /// Binds to the configured address, accepts QUIC connections,
    /// and spawns a task per connection for room pairing and data forwarding.
    /// If `ws_bind_addr` is configured, also starts a WebSocket listener
    /// for browser clients on a separate HTTP port.
    pub async fn start(&self) -> anyhow::Result<()> {
        let addr: SocketAddr = self
            .config
            .bind_addr
            .parse()
            .map_err(|e| anyhow::anyhow!("invalid bind address: {}", e))?;

        // Generate TLS identity
        let identity = tallow_net::transport::tls_config::generate_self_signed()
            .map_err(|e| anyhow::anyhow!("TLS cert generation failed: {}", e))?;

        let server_config = tallow_net::transport::tls_config::quinn_server_config(&identity)
            .map_err(|e| anyhow::anyhow!("quinn server config failed: {}", e))?;

        let endpoint = quinn::Endpoint::server(server_config, addr)?;
        info!("relay server listening on {} (QUIC)", addr);

        // Start WebSocket listener if configured
        if !self.config.ws_bind_addr.is_empty() {
            let ws_addr: SocketAddr = self
                .config
                .ws_bind_addr
                .parse()
                .map_err(|e| anyhow::anyhow!("invalid ws_bind_addr: {}", e))?;
            let ws_state = Arc::new(crate::websocket::WsState {
                room_manager: Arc::clone(&self.room_manager),
                password: self.config.password.clone(),
            });
            let app = crate::websocket::ws_router(ws_state);
            let listener = tokio::net::TcpListener::bind(ws_addr).await?;
            info!("WebSocket listener on {} (HTTP)", ws_addr);
            tokio::spawn(async move {
                if let Err(e) = axum::serve(listener, app).await {
                    warn!("WebSocket server error: {}", e);
                }
            });
        }

        // Spawn stale room cleanup task
        let room_manager_cleanup = Arc::clone(&self.room_manager);
        let room_timeout = self.config.room_timeout_secs;
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
            loop {
                interval.tick().await;
                let removed = room_manager_cleanup.cleanup_stale(room_timeout);
                if removed > 0 {
                    info!("cleaned up {} stale rooms", removed);
                }
            }
        });

        // Accept connections with graceful shutdown on Ctrl+C / SIGTERM
        let shutdown = async {
            let _ = tokio::signal::ctrl_c().await;
            info!("shutdown signal received, stopping accept loop");
        };
        tokio::pin!(shutdown);

        loop {
            let incoming = tokio::select! {
                incoming = endpoint.accept() => {
                    match incoming {
                        Some(i) => i,
                        None => break,
                    }
                }
                _ = &mut shutdown => {
                    info!("graceful shutdown: no longer accepting new connections");
                    break;
                }
            };
            let remote_addr = incoming.remote_address();

            // Rate limiting
            {
                let mut limiter = self.rate_limiter.lock().await;
                if !limiter.check(remote_addr.ip()) {
                    warn!("rate limited connection from {}", remote_addr);
                    continue;
                }
            }

            // Check connection limit
            if endpoint.open_connections() >= self.config.max_connections {
                warn!("connection limit reached, rejecting {}", remote_addr);
                continue;
            }

            let room_manager = Arc::clone(&self.room_manager);
            let password = self.config.password.clone();

            tokio::spawn(async move {
                match incoming.await {
                    Ok(connection) => {
                        tracing::debug!("accepted connection from {}", remote_addr);
                        if let Err(e) =
                            handle_connection(connection, room_manager, password, remote_addr.ip())
                                .await
                        {
                            warn!("connection handler error: {}", e);
                        }
                    }
                    Err(e) => {
                        warn!("failed to accept connection: {}", e);
                    }
                }
            });
        }

        info!("relay server shutting down");
        Ok(())
    }
}

/// Parsed room join — either legacy 2-peer or multi-peer
enum ParsedRoomJoin {
    Legacy(RoomJoinParsed),
    Multi(MultiRoomJoinParsed),
}

/// Parsed fields from a multi-peer room join
struct MultiRoomJoinParsed {
    /// Room identifier (32-byte BLAKE3 hash)
    room_id: RoomId,
    /// Optional BLAKE3 hash of relay password
    password_hash: Option<[u8; 32]>,
    /// Requested room capacity
    requested_capacity: u8,
}

/// Handle a single QUIC connection
///
/// Reads the first message and dispatches to legacy (2-peer) or
/// multi-peer connection handling.
async fn handle_connection(
    connection: quinn::Connection,
    room_manager: Arc<RoomManager>,
    mut password: String,
    client_ip: std::net::IpAddr,
) -> anyhow::Result<()> {
    // Accept bidirectional stream from client with handshake timeout.
    let (mut send, recv, join) = tokio::time::timeout(HANDSHAKE_TIMEOUT, async {
        let (send, mut recv) = connection
            .accept_bi()
            .await
            .map_err(|e| anyhow::anyhow!("accept_bi failed: {}", e))?;

        // Read the first message (expect RoomJoin or RoomJoinMulti)
        let mut len_buf = [0u8; 4];
        recv.read_exact(&mut len_buf)
            .await
            .map_err(|e| anyhow::anyhow!("read room join length failed: {}", e))?;

        let msg_len = u32::from_be_bytes(len_buf) as usize;
        if msg_len > 1024 {
            anyhow::bail!("room join message too large: {} bytes", msg_len);
        }

        let mut msg_buf = vec![0u8; msg_len];
        recv.read_exact(&mut msg_buf)
            .await
            .map_err(|e| anyhow::anyhow!("read room join message failed: {}", e))?;

        let join = parse_room_join_dispatch(&msg_buf)?;
        Ok::<_, anyhow::Error>((send, recv, join))
    })
    .await
    .map_err(|_| anyhow::anyhow!("handshake timeout ({}s)", HANDSHAKE_TIMEOUT.as_secs()))??;

    // Extract password hash for auth check
    let pw_hash = match &join {
        ParsedRoomJoin::Legacy(j) => j.password_hash.as_ref(),
        ParsedRoomJoin::Multi(j) => j.password_hash.as_ref(),
    };

    // Verify password authentication
    if !auth::verify_relay_password(pw_hash, &password) {
        warn!("authentication failed");
        let reject = encode_auth_rejection();
        let _ = send.write_all(&reject).await;
        return Ok(());
    }

    // Zeroize password after authentication check
    password.zeroize();

    match join {
        ParsedRoomJoin::Legacy(legacy_join) => {
            handle_legacy_connection(send, recv, room_manager, legacy_join, client_ip).await
        }
        ParsedRoomJoin::Multi(multi_join) => {
            handle_multi_connection(send, recv, room_manager, multi_join, client_ip).await
        }
    }
}

/// Handle a legacy 2-peer room connection (existing behavior)
async fn handle_legacy_connection(
    mut send: quinn::SendStream,
    mut recv: quinn::RecvStream,
    room_manager: Arc<RoomManager>,
    join: RoomJoinParsed,
    client_ip: std::net::IpAddr,
) -> anyhow::Result<()> {
    let room_id = join.room_id;

    tracing::debug!("peer joining room (legacy 2-peer)");

    // Join the room with per-IP tracking
    let (mut peer_rx, _peer_tx, peer_present) = room_manager
        .join_with_ip(room_id, Some(client_ip))
        .map_err(|e| anyhow::anyhow!("room join failed: {}", e))?;

    let is_peer_a = !peer_present;

    // Send RoomJoined response
    let joined_msg = encode_room_joined(peer_present)?;
    send.write_all(&joined_msg)
        .await
        .map_err(|e| anyhow::anyhow!("send room joined failed: {}", e))?;

    if peer_present {
        // We're peer_b — notify peer_a that we arrived
        if let Some(peer_a_tx) = room_manager.get_peer_sender(&room_id, false) {
            let arrived_msg = encode_peer_arrived()?;
            let _ = peer_a_tx.send(arrived_msg).await;
        }
    } else {
        // We're peer_a — wait for peer_b to arrive
        tracing::debug!("waiting for peer in room");
    }

    // Forward data bidirectionally
    let room_id_fwd = room_id;
    let room_manager_fwd = Arc::clone(&room_manager);

    // Task 1: Read from QUIC stream → send to paired peer via channel
    let forward_to_peer = async {
        loop {
            let mut len_buf = [0u8; 4];
            match recv.read_exact(&mut len_buf).await {
                Ok(_) => {}
                Err(_) => break,
            }

            let msg_len = u32::from_be_bytes(len_buf) as usize;
            if msg_len > 16 * 1024 * 1024 {
                break;
            }

            let mut data = vec![0u8; msg_len + 4];
            data[..4].copy_from_slice(&len_buf);
            match recv.read_exact(&mut data[4..]).await {
                Ok(_) => {}
                Err(_) => break,
            }

            if let Some(tx) = room_manager_fwd.get_peer_sender(&room_id_fwd, is_peer_a) {
                if tx.send(data).await.is_err() {
                    break;
                }
                room_manager_fwd.touch_room(&room_id_fwd);
            }
        }
    };

    // Task 2: Receive from paired peer channel → write to QUIC stream
    let forward_from_peer = async {
        while let Some(data) = peer_rx.recv().await {
            if send.write_all(&data).await.is_err() {
                break;
            }
        }
    };

    tokio::select! {
        _ = forward_to_peer => {}
        _ = forward_from_peer => {}
    }

    tracing::debug!("peer disconnected from room");
    room_manager.peer_disconnected(&room_id, Some(client_ip));

    Ok(())
}

/// Handle a multi-peer room connection (Phase 19)
async fn handle_multi_connection(
    mut send: quinn::SendStream,
    mut recv: quinn::RecvStream,
    room_manager: Arc<RoomManager>,
    join: MultiRoomJoinParsed,
    client_ip: std::net::IpAddr,
) -> anyhow::Result<()> {
    let room_id = join.room_id;

    // Join the multi-peer room
    let (mut peer_rx, my_peer_id, existing_peers) = room_manager
        .join_multi(room_id, join.requested_capacity, Some(client_ip))
        .map_err(|e| anyhow::anyhow!("multi-room join failed: {}", e))?;

    info!(
        "peer {} joined multi-room (existing: {:?})",
        my_peer_id, existing_peers,
    );

    // Send RoomJoinedMulti response
    let joined_msg = tallow_protocol::wire::Message::RoomJoinedMulti {
        peer_id: my_peer_id,
        existing_peers: existing_peers.clone(),
    };
    let payload = postcard::to_stdvec(&joined_msg)
        .map_err(|e| anyhow::anyhow!("encode RoomJoinedMulti: {}", e))?;
    let mut response = Vec::with_capacity(4 + payload.len());
    response.extend_from_slice(&(payload.len() as u32).to_be_bytes());
    response.extend_from_slice(&payload);
    send.write_all(&response).await?;

    // Notify existing peers that a new peer joined
    if let Some(room) = room_manager.get_multi_room(&room_id) {
        let notify_msg = tallow_protocol::wire::Message::PeerJoinedRoom {
            peer_id: my_peer_id,
        };
        let notify_payload = postcard::to_stdvec(&notify_msg)
            .map_err(|e| anyhow::anyhow!("encode PeerJoinedRoom: {}", e))?;
        let mut notify_bytes = Vec::with_capacity(4 + notify_payload.len());
        notify_bytes.extend_from_slice(&(notify_payload.len() as u32).to_be_bytes());
        notify_bytes.extend_from_slice(&notify_payload);
        room.broadcast_from(my_peer_id, notify_bytes).await;
    }

    // Bidirectional forwarding with routing
    let room_id_fwd = room_id;
    let room_manager_fwd = Arc::clone(&room_manager);

    // Task 1: Read from QUIC -> route to targeted peer(s)
    let forward_to_peers = async {
        loop {
            let mut len_buf = [0u8; 4];
            if recv.read_exact(&mut len_buf).await.is_err() {
                break;
            }

            let msg_len = u32::from_be_bytes(len_buf) as usize;
            if msg_len > 16 * 1024 * 1024 {
                break;
            }

            let mut msg_buf = vec![0u8; msg_len];
            if recv.read_exact(&mut msg_buf).await.is_err() {
                break;
            }

            // Try to decode as Message to extract routing info
            if let Ok(msg) = postcard::from_bytes::<tallow_protocol::wire::Message>(&msg_buf) {
                match msg {
                    tallow_protocol::wire::Message::Targeted {
                        to_peer, payload, ..
                    } => {
                        // Overwrite from_peer with actual sender ID (anti-spoofing)
                        let routed = tallow_protocol::wire::Message::Targeted {
                            from_peer: my_peer_id,
                            to_peer,
                            payload,
                        };
                        let routed_payload = match postcard::to_stdvec(&routed) {
                            Ok(p) => p,
                            Err(_) => break,
                        };
                        let mut routed_bytes = Vec::with_capacity(4 + routed_payload.len());
                        routed_bytes
                            .extend_from_slice(&(routed_payload.len() as u32).to_be_bytes());
                        routed_bytes.extend_from_slice(&routed_payload);

                        if let Some(room) = room_manager_fwd.get_multi_room(&room_id_fwd) {
                            if to_peer == 0xFF {
                                // Broadcast to all peers except sender
                                room.broadcast_from(my_peer_id, routed_bytes).await;
                            } else {
                                // Targeted to specific peer
                                let _ = room.send_to(to_peer, routed_bytes).await;
                            }
                            drop(room);
                            room_manager_fwd.touch_multi_room(&room_id_fwd);
                        }
                    }
                    _ => {
                        // Non-targeted messages in multi-peer rooms are ignored
                        tracing::debug!(
                            "ignoring non-Targeted message from peer {} in multi-room",
                            my_peer_id,
                        );
                    }
                }
            }
        }
    };

    // Task 2: Receive from mpsc channel -> write to QUIC stream
    let forward_from_peers = async {
        while let Some(data) = peer_rx.recv().await {
            if send.write_all(&data).await.is_err() {
                break;
            }
        }
    };

    tokio::select! {
        _ = forward_to_peers => {}
        _ = forward_from_peers => {}
    }

    info!("peer {} disconnected from multi-room", my_peer_id);

    // Notify remaining peers
    if let Some(room) = room_manager.get_multi_room(&room_id) {
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

    // Clean up
    room_manager.multi_peer_disconnected(&room_id, my_peer_id, Some(client_ip));

    Ok(())
}

/// Parsed fields from a RoomJoin message
struct RoomJoinParsed {
    /// Room identifier (32-byte BLAKE3 hash)
    room_id: RoomId,
    /// Optional BLAKE3 hash of relay password
    password_hash: Option<[u8; 32]>,
}

/// Parse a room join message, dispatching to legacy or multi-peer path.
///
/// First tries postcard deserialization to detect `RoomJoinMulti`. Falls back
/// to manual byte parsing for legacy `RoomJoin` backward compatibility.
fn parse_room_join_dispatch(data: &[u8]) -> anyhow::Result<ParsedRoomJoin> {
    if data.is_empty() {
        anyhow::bail!("empty room join message");
    }

    // Try postcard deserialization first (detects RoomJoinMulti)
    if let Ok(msg) = postcard::from_bytes::<tallow_protocol::wire::Message>(data) {
        match msg {
            tallow_protocol::wire::Message::RoomJoinMulti {
                room_id,
                password_hash,
                requested_capacity,
            } => {
                if room_id.len() != 32 {
                    anyhow::bail!("invalid room_id length: {}", room_id.len());
                }
                let mut rid = [0u8; 32];
                rid.copy_from_slice(&room_id);
                let pw = password_hash.and_then(|h| {
                    if h.len() == 32 {
                        let mut arr = [0u8; 32];
                        arr.copy_from_slice(&h);
                        Some(arr)
                    } else {
                        None
                    }
                });
                return Ok(ParsedRoomJoin::Multi(MultiRoomJoinParsed {
                    room_id: rid,
                    password_hash: pw,
                    requested_capacity,
                }));
            }
            tallow_protocol::wire::Message::RoomJoin {
                room_id,
                password_hash,
            } => {
                if room_id.len() != 32 {
                    anyhow::bail!("invalid room_id length: {}", room_id.len());
                }
                let mut rid = [0u8; 32];
                rid.copy_from_slice(&room_id);
                let pw = password_hash.and_then(|h| {
                    if h.len() == 32 {
                        let mut arr = [0u8; 32];
                        arr.copy_from_slice(&h);
                        Some(arr)
                    } else {
                        None
                    }
                });
                return Ok(ParsedRoomJoin::Legacy(RoomJoinParsed {
                    room_id: rid,
                    password_hash: pw,
                }));
            }
            _ => anyhow::bail!("expected RoomJoin or RoomJoinMulti"),
        }
    }

    // Fallback: existing manual byte parsing for backward compatibility
    parse_room_join_legacy(data).map(ParsedRoomJoin::Legacy)
}

/// Legacy manual byte parsing for RoomJoin messages.
///
/// Wire format (manual postcard-like encoding from the client):
/// - byte 0: variant discriminant (3 for RoomJoin)
/// - byte 1: varint length of room_id (32)
/// - bytes 2..34: room_id (32 bytes)
/// - byte 34: Option discriminant (0x00 = None, 0x01 = Some)
/// - if Some: byte 35: varint length of hash (32), bytes 36..68: hash (32 bytes)
fn parse_room_join_legacy(data: &[u8]) -> anyhow::Result<RoomJoinParsed> {
    // Minimum: discriminant(1) + varint(1) + room_id(32) + option_disc(1) = 35
    // With password: + varint(1) + hash(32) = 68
    if data.len() >= 35 {
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(&data[2..34]);

        let password_hash = if data.len() > 34 {
            match data[34] {
                0x00 => None,
                0x01 => {
                    if data.len() >= 68 {
                        let mut hash = [0u8; 32];
                        hash.copy_from_slice(&data[36..68]);
                        Some(hash)
                    } else {
                        anyhow::bail!(
                            "password hash truncated: expected 68 bytes, got {}",
                            data.len()
                        );
                    }
                }
                _ => anyhow::bail!("invalid Option discriminant: {:#x}", data[34]),
            }
        } else {
            None
        };

        Ok(RoomJoinParsed {
            room_id,
            password_hash,
        })
    } else if data.len() >= 34 {
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(&data[2..34]);
        Ok(RoomJoinParsed {
            room_id,
            password_hash: None,
        })
    } else if data.len() == 32 {
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(data);
        Ok(RoomJoinParsed {
            room_id,
            password_hash: None,
        })
    } else {
        anyhow::bail!("invalid room join message length: {}", data.len());
    }
}

/// Encode an authentication rejection as length-prefixed bytes
///
/// Payload is a single byte `0xFF` indicating auth failure.
fn encode_auth_rejection() -> Vec<u8> {
    let payload = [0xFF];
    let mut msg = Vec::with_capacity(5);
    msg.extend_from_slice(&(payload.len() as u32).to_be_bytes());
    msg.extend_from_slice(&payload);
    msg
}

/// Encode a RoomJoined response as length-prefixed bytes
fn encode_room_joined(peer_present: bool) -> anyhow::Result<Vec<u8>> {
    // Simple response: 1 byte for peer_present flag
    let payload = vec![if peer_present { 1u8 } else { 0u8 }];
    let mut msg = Vec::with_capacity(4 + payload.len());
    msg.extend_from_slice(&(payload.len() as u32).to_be_bytes());
    msg.extend_from_slice(&payload);
    Ok(msg)
}

/// Encode a PeerArrived notification as length-prefixed bytes
fn encode_peer_arrived() -> anyhow::Result<Vec<u8>> {
    let payload = vec![2u8]; // PeerArrived indicator
    let mut msg = Vec::with_capacity(4 + payload.len());
    msg.extend_from_slice(&(payload.len() as u32).to_be_bytes());
    msg.extend_from_slice(&payload);
    Ok(msg)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_room_joined() {
        let msg = encode_room_joined(true).unwrap();
        assert_eq!(msg.len(), 5); // 4 byte length + 1 byte payload
        assert_eq!(u32::from_be_bytes([msg[0], msg[1], msg[2], msg[3]]), 1);
        assert_eq!(msg[4], 1);
    }
}
