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
        let room_manager = Arc::new(RoomManager::new(config.max_rooms));
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
        info!("relay server listening on {}", addr);

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

/// Handle a single QUIC connection
///
/// Expects the first message to be a RoomJoin. After joining,
/// forwards all subsequent data to the paired peer.
async fn handle_connection(
    connection: quinn::Connection,
    room_manager: Arc<RoomManager>,
    mut password: String,
    client_ip: std::net::IpAddr,
) -> anyhow::Result<()> {
    // Accept bidirectional stream from client with handshake timeout.
    // Prevents slowloris attacks where a client connects but never sends data.
    let (mut send, mut recv, join) = tokio::time::timeout(HANDSHAKE_TIMEOUT, async {
        let (send, mut recv) = connection
            .accept_bi()
            .await
            .map_err(|e| anyhow::anyhow!("accept_bi failed: {}", e))?;

        // Read the first message (expect RoomJoin)
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

        let join = parse_room_join(&msg_buf)?;
        Ok::<_, anyhow::Error>((send, recv, join))
    })
    .await
    .map_err(|_| anyhow::anyhow!("handshake timeout ({}s)", HANDSHAKE_TIMEOUT.as_secs()))??;

    // Verify password authentication
    if !auth::verify_relay_password(join.password_hash.as_ref(), &password) {
        warn!("authentication failed");
        // Send rejection: length-prefixed [0xFF]
        let reject = encode_auth_rejection();
        let _ = send.write_all(&reject).await;
        return Ok(());
    }

    // Zeroize password after authentication check
    password.zeroize();

    let room_id = join.room_id;

    tracing::debug!("peer joining room");

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
                Err(_) => break, // Connection closed
            }

            let msg_len = u32::from_be_bytes(len_buf) as usize;
            if msg_len > 16 * 1024 * 1024 {
                break; // Message too large
            }

            let mut data = vec![0u8; msg_len + 4];
            data[..4].copy_from_slice(&len_buf);
            match recv.read_exact(&mut data[4..]).await {
                Ok(_) => {}
                Err(_) => break,
            }

            // Forward to the paired peer
            if let Some(tx) = room_manager_fwd.get_peer_sender(&room_id_fwd, is_peer_a) {
                if tx.send(data).await.is_err() {
                    break; // Peer disconnected
                }
                // Update last activity so stale cleanup doesn't kill active transfers
                room_manager_fwd.touch_room(&room_id_fwd);
            }
        }
    };

    // Task 2: Receive from paired peer channel → write to QUIC stream
    let forward_from_peer = async {
        while let Some(data) = peer_rx.recv().await {
            if send.write_all(&data).await.is_err() {
                break; // Connection closed
            }
        }
    };

    // Run both directions concurrently, stop when either ends
    tokio::select! {
        _ = forward_to_peer => {}
        _ = forward_from_peer => {}
    }

    tracing::debug!("peer disconnected from room");

    // Clean up room and decrement per-IP counter
    room_manager.peer_disconnected(&room_id, Some(client_ip));

    Ok(())
}

/// Parsed fields from a RoomJoin message
struct RoomJoinParsed {
    /// Room identifier (32-byte BLAKE3 hash)
    room_id: RoomId,
    /// Optional BLAKE3 hash of relay password
    password_hash: Option<[u8; 32]>,
}

/// Parse a RoomJoin message payload into room ID and optional password hash
///
/// Wire format (manual postcard-like encoding from the client):
/// - byte 0: variant discriminant (3 for RoomJoin)
/// - byte 1: varint length of room_id (32)
/// - bytes 2..34: room_id (32 bytes)
/// - byte 34: Option discriminant (0x00 = None, 0x01 = Some)
/// - if Some: byte 35: varint length of hash (32), bytes 36..68: hash (32 bytes)
fn parse_room_join(data: &[u8]) -> anyhow::Result<RoomJoinParsed> {
    if data.is_empty() {
        anyhow::bail!("empty room join message");
    }

    // Minimum: discriminant(1) + varint(1) + room_id(32) + option_disc(1) = 35
    // With password: + varint(1) + hash(32) = 68
    if data.len() >= 35 {
        // Skip discriminant byte and varint length byte, read 32-byte room_id
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(&data[2..34]);

        // Parse optional password_hash
        let password_hash = if data.len() > 34 {
            match data[34] {
                0x00 => None,
                0x01 => {
                    // Expect varint(1) + 32 bytes of hash
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
            // Legacy client without password field — treat as None
            None
        };

        Ok(RoomJoinParsed {
            room_id,
            password_hash,
        })
    } else if data.len() >= 34 {
        // Discriminant + varint + 32-byte room_id, no password field
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(&data[2..34]);
        Ok(RoomJoinParsed {
            room_id,
            password_hash: None,
        })
    } else if data.len() == 32 {
        // Raw room ID (legacy)
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
