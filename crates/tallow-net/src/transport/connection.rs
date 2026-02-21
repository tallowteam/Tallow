//! Connection strategy for choosing between direct LAN and relay transports
//!
//! Implements automatic fallback: try direct LAN first (when `--local` is set),
//! fall back to relay if mDNS discovery or direct connection fails.

#[cfg(feature = "quic")]
use crate::transport::direct::{connect_direct, DirectListener};
#[cfg(feature = "quic")]
use crate::{NetworkError, Result};
#[cfg(feature = "quic")]
use std::net::SocketAddr;
use std::time::Duration;

/// Timeouts for the direct connection strategy
pub const MDNS_BROWSE_TIMEOUT: Duration = Duration::from_secs(5);

/// Timeout for receiver connecting to sender's direct listener
pub const DIRECT_CONNECT_TIMEOUT: Duration = Duration::from_secs(5);

/// Timeout for sender waiting for receiver to connect
pub const SENDER_ACCEPT_TIMEOUT: Duration = Duration::from_secs(30);

/// Result of a connection attempt, indicating which transport was used.
///
/// Implements `PeerChannel` via enum dispatch, avoiding the need for
/// `dyn PeerChannel` (which is not object-safe due to async methods).
#[cfg(feature = "quic")]
pub enum ConnectionResult {
    /// Direct LAN connection established
    Direct(crate::transport::DirectConnection),
    /// Fell back to relay connection
    Relay(Box<crate::relay::RelayClient>),
}

#[cfg(feature = "quic")]
impl std::fmt::Debug for ConnectionResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConnectionResult::Direct(_) => f.debug_tuple("Direct").field(&"...").finish(),
            ConnectionResult::Relay(_) => f.debug_tuple("Relay").field(&"...").finish(),
        }
    }
}

#[cfg(feature = "quic")]
impl ConnectionResult {
    /// Whether this is a direct connection
    pub fn is_direct(&self) -> bool {
        matches!(self, ConnectionResult::Direct(_))
    }
}

/// Implement PeerChannel on the enum for uniform handling
#[cfg(feature = "quic")]
impl crate::transport::PeerChannel for ConnectionResult {
    async fn send_message(&mut self, data: &[u8]) -> Result<()> {
        match self {
            ConnectionResult::Direct(d) => d.send_message(data).await,
            ConnectionResult::Relay(r) => r.send_message(data).await,
        }
    }

    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize> {
        match self {
            ConnectionResult::Direct(d) => d.receive_message(buf).await,
            ConnectionResult::Relay(r) => r.receive_message(buf).await,
        }
    }

    async fn close(&mut self) {
        match self {
            ConnectionResult::Direct(d) => d.close().await,
            ConnectionResult::Relay(r) => r.close().await,
        }
    }

    fn transport_description(&self) -> String {
        match self {
            ConnectionResult::Direct(d) => d.transport_description(),
            ConnectionResult::Relay(r) => r.transport_description(),
        }
    }
}

/// Establish a connection as the sender.
///
/// If `local_mode` is true:
/// 1. Bind a QUIC listener on a random port
/// 2. Advertise via mDNS with room code hash and fingerprint
/// 3. Wait for receiver to connect (with timeout)
/// 4. If timeout or error: unregister mDNS, fall back to relay
///
/// If `local_mode` is false: connect to relay directly.
///
/// Returns `(connection, is_direct)` where `is_direct` indicates whether the
/// connection is a direct LAN connection.
#[cfg(feature = "quic")]
pub async fn establish_sender_connection(
    room_id: &[u8; 32],
    fingerprint_prefix: &str,
    relay_addr: SocketAddr,
    password_hash: Option<&[u8; 32]>,
    local_mode: bool,
) -> Result<(ConnectionResult, bool)> {
    if local_mode {
        tracing::info!("Attempting direct LAN connection (sender mode)...");

        // Try direct connection first
        match try_sender_direct(room_id, fingerprint_prefix).await {
            Ok(direct_conn) => {
                tracing::info!("Direct LAN connection established (sender)");
                return Ok((ConnectionResult::Direct(direct_conn), true));
            }
            Err(e) => {
                tracing::warn!(
                    "Direct LAN connection failed, falling back to relay: {}",
                    e
                );
            }
        }
    }

    // Fall back to relay
    let mut relay = crate::relay::RelayClient::new(relay_addr);
    relay.connect(room_id, password_hash).await?;

    if !relay.peer_present() {
        relay.wait_for_peer().await?;
    }

    Ok((ConnectionResult::Relay(Box::new(relay)), false))
}

/// Attempt a direct LAN connection as the sender.
///
/// Binds a QUIC listener, advertises via mDNS, and waits for the receiver.
#[cfg(feature = "quic")]
async fn try_sender_direct(
    room_id: &[u8; 32],
    fingerprint_prefix: &str,
) -> Result<crate::transport::DirectConnection> {
    let listener = DirectListener::bind()?;
    let port = listener.port();

    tracing::info!("Direct listener bound on port {}", port);

    // Advertise via mDNS (RAII -- drops and unregisters on scope exit)
    let _advertiser = crate::discovery::lan::LanAdvertiser::new(
        port,
        fingerprint_prefix,
        room_id,
    )?;

    tracing::info!("mDNS advertisement active, waiting for receiver...");

    // Wait for receiver to connect
    let direct_conn = listener.accept_peer(SENDER_ACCEPT_TIMEOUT).await?;

    Ok(direct_conn)
}

/// Establish a connection as the receiver.
///
/// If `local_mode` is true:
/// 1. Browse mDNS for sender matching room code hash
/// 2. If found: connect directly via QUIC
/// 3. If not found or connection fails: fall back to relay
///
/// If `local_mode` is false: connect to relay directly.
///
/// Returns `(connection, is_direct)` where `is_direct` indicates whether the
/// connection is a direct LAN connection.
#[cfg(feature = "quic")]
pub async fn establish_receiver_connection(
    room_id: &[u8; 32],
    relay_addr: SocketAddr,
    password_hash: Option<&[u8; 32]>,
    local_mode: bool,
) -> Result<(ConnectionResult, bool)> {
    if local_mode {
        tracing::info!("Attempting direct LAN connection (receiver mode)...");

        match try_receiver_direct(room_id).await {
            Ok(direct_conn) => {
                tracing::info!("Direct LAN connection established (receiver)");
                return Ok((ConnectionResult::Direct(direct_conn), true));
            }
            Err(e) => {
                tracing::warn!(
                    "Direct LAN discovery/connection failed, falling back to relay: {}",
                    e
                );
            }
        }
    }

    // Fall back to relay
    let mut relay = crate::relay::RelayClient::new(relay_addr);
    relay.connect(room_id, password_hash).await?;

    if !relay.peer_present() {
        relay.wait_for_peer().await?;
    }

    Ok((ConnectionResult::Relay(Box::new(relay)), false))
}

/// Attempt a direct LAN connection as the receiver.
///
/// Browses mDNS for the sender matching the room code, then connects directly.
#[cfg(feature = "quic")]
async fn try_receiver_direct(
    room_id: &[u8; 32],
) -> Result<crate::transport::DirectConnection> {
    // Browse for sender via mDNS
    let peer = crate::discovery::lan::discover_sender(room_id, MDNS_BROWSE_TIMEOUT)
        .await?
        .ok_or_else(|| {
            NetworkError::DiscoveryError(
                "No matching sender found on LAN via mDNS".to_string(),
            )
        })?;

    tracing::info!(
        "Discovered sender at {} (fingerprint: {})",
        peer.addr,
        peer.fingerprint.as_deref().unwrap_or("unknown")
    );

    // Connect directly
    let direct_conn = connect_direct(peer.addr, DIRECT_CONNECT_TIMEOUT).await?;

    Ok(direct_conn)
}

#[cfg(test)]
#[cfg(feature = "quic")]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_relay_fallback_when_not_local_mode() {
        // With local_mode=false, the function should attempt relay connection.
        // Since we don't have a relay server running, it will fail,
        // but we can verify that it does NOT attempt mDNS discovery.
        let room_id = [0u8; 32];
        let relay_addr: SocketAddr = "127.0.0.1:1".parse().unwrap();

        // This should fail because no relay is running, but importantly
        // it should fail with a connection error, NOT a discovery error.
        let result = establish_sender_connection(
            &room_id,
            "abcd1234",
            relay_addr,
            None,
            false,
        )
        .await;

        assert!(result.is_err());
        // Verify it's a connection failure, not a discovery error
        let err_msg = format!("{}", result.unwrap_err());
        assert!(
            !err_msg.contains("mDNS") && !err_msg.contains("discovery"),
            "Expected connection error, not discovery error: {}",
            err_msg
        );
    }
}
