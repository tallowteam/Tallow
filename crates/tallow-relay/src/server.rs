//! Relay server implementation
//!
//! Accepts QUIC connections, pairs peers by room code, and forwards
//! encrypted bytes bidirectionally without inspection.

use crate::config::RelayConfig;
use crate::rate_limit::RateLimiter;
use crate::room::{RoomId, RoomManager};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, warn};

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

        // Accept connections
        while let Some(incoming) = endpoint.accept().await {
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

            tokio::spawn(async move {
                match incoming.await {
                    Ok(connection) => {
                        info!("accepted connection from {}", remote_addr);
                        if let Err(e) = handle_connection(connection, room_manager).await {
                            warn!("connection handler error for {}: {}", remote_addr, e);
                        }
                    }
                    Err(e) => {
                        warn!("failed to accept connection from {}: {}", remote_addr, e);
                    }
                }
            });
        }

        info!("relay server shutting down");
        Ok(())
    }

    /// Get the room manager (for monitoring/testing)
    pub fn room_manager(&self) -> &RoomManager {
        &self.room_manager
    }
}

/// Handle a single QUIC connection
///
/// Expects the first message to be a RoomJoin. After joining,
/// forwards all subsequent data to the paired peer.
async fn handle_connection(
    connection: quinn::Connection,
    room_manager: Arc<RoomManager>,
) -> anyhow::Result<()> {
    // Accept bidirectional stream from client
    let (mut send, mut recv) = connection
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

    // Parse room ID from the join message
    // Expected: first byte is message discriminant for RoomJoin,
    // followed by the room_id bytes
    let room_id = parse_room_id(&msg_buf)?;

    info!("peer joining room {:?}", hex_short(&room_id));

    // Join the room
    let (mut peer_rx, _peer_tx, peer_present) = room_manager
        .join(room_id)
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
        info!("waiting for peer in room {:?}", hex_short(&room_id));
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

    info!("peer disconnected from room {:?}", hex_short(&room_id));

    // Don't remove the room immediately — the other peer may still be transferring
    // The stale room cleanup will handle it

    Ok(())
}

/// Parse a room ID from a RoomJoin message payload
///
/// This is a simplified parser — in production, use the full postcard codec.
fn parse_room_id(data: &[u8]) -> anyhow::Result<RoomId> {
    // Postcard format for RoomJoin variant:
    // byte 0: variant discriminant (3 for RoomJoin in the current enum)
    // bytes 1+: varint length of room_id Vec, then the bytes
    if data.is_empty() {
        anyhow::bail!("empty room join message");
    }

    // Try to deserialize as a protocol message
    // We expect a RoomJoin { room_id: Vec<u8> }
    // For robustness, just extract the 32-byte room ID from the payload
    // The discriminant byte + varint length prefix + 32 bytes
    if data.len() >= 34 {
        // Skip discriminant byte and varint length byte
        let offset = data.len() - 32;
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(&data[offset..]);
        Ok(room_id)
    } else if data.len() == 32 {
        // Raw room ID
        let mut room_id = [0u8; 32];
        room_id.copy_from_slice(data);
        Ok(room_id)
    } else {
        anyhow::bail!("invalid room join message length: {}", data.len());
    }
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

/// Format a room ID as a short hex string for logging
fn hex_short(id: &[u8; 32]) -> String {
    format!("{:02x}{:02x}..{:02x}{:02x}", id[0], id[1], id[30], id[31])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_short() {
        let id = [0xABu8; 32];
        assert_eq!(hex_short(&id), "abab..abab");
    }

    #[test]
    fn test_encode_room_joined() {
        let msg = encode_room_joined(true).unwrap();
        assert_eq!(msg.len(), 5); // 4 byte length + 1 byte payload
        assert_eq!(u32::from_be_bytes([msg[0], msg[1], msg[2], msg[3]]), 1);
        assert_eq!(msg[4], 1);
    }
}
