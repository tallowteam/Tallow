//! Relay client for connecting through relay servers
//!
//! Connects to a relay server via QUIC, joins a room by code hash,
//! and forwards encrypted data to/from the paired peer.

use crate::{NetworkError, Result};
use std::net::SocketAddr;
use tracing::info;

/// Relay client for connecting through relay servers
pub struct RelayClient {
    relay_addr: SocketAddr,
    #[cfg(feature = "quic")]
    transport: Option<crate::transport::QuicTransport>,
    /// Whether the peer was already in the room when we joined
    peer_present: bool,
}

impl std::fmt::Debug for RelayClient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RelayClient")
            .field("relay_addr", &self.relay_addr)
            .field("peer_present", &self.peer_present)
            .finish()
    }
}

impl RelayClient {
    /// Create a new relay client targeting the given relay address
    pub fn new(relay_addr: SocketAddr) -> Self {
        Self {
            relay_addr,
            #[cfg(feature = "quic")]
            transport: None,
            peer_present: false,
        }
    }

    /// Connect to the relay server and join a room
    ///
    /// # Arguments
    ///
    /// * `room_id` - BLAKE3 hash of the code phrase (32 bytes)
    /// * `password_hash` - Optional BLAKE3 hash of relay password
    ///
    /// # Returns
    ///
    /// Whether the peer was already waiting in the room
    ///
    /// # Errors
    ///
    /// Returns `NetworkError::AuthenticationFailed` if the relay rejects the password.
    #[cfg(feature = "quic")]
    pub async fn connect(
        &mut self,
        room_id: &[u8; 32],
        password_hash: Option<&[u8; 32]>,
    ) -> Result<bool> {
        use crate::Transport;

        let mut transport = crate::transport::QuicTransport::new();
        transport.connect(self.relay_addr).await?;

        info!("connected to relay at {}", self.relay_addr);

        // Send RoomJoin message (length-prefixed room_id + optional password hash)
        // Format: [discriminant(1)][varint_len(1)][room_id(32)][option_disc(1)][...hash]
        let capacity = if password_hash.is_some() { 68 } else { 35 };
        let mut join_payload = Vec::with_capacity(capacity);
        join_payload.push(3); // RoomJoin discriminant (matches wire::Message enum position)
        join_payload.push(32); // varint length of room_id
        join_payload.extend_from_slice(room_id);

        // Encode optional password hash
        match password_hash {
            None => {
                join_payload.push(0x00); // Option::None
            }
            Some(hash) => {
                join_payload.push(0x01); // Option::Some
                join_payload.push(32); // varint length of hash
                join_payload.extend_from_slice(hash);
            }
        }

        transport.send(&join_payload).await?;

        // Read response (RoomJoined or auth rejection)
        let mut buf = [0u8; 256];
        let n = transport.receive(&mut buf).await?;

        // Check for auth rejection (payload = [0xFF])
        if n >= 1 && buf[0] == 0xFF {
            transport.close().await;
            return Err(NetworkError::AuthenticationFailed);
        }

        if n >= 1 {
            self.peer_present = buf[0] == 1;
        }

        info!("joined room, peer_present={}", self.peer_present);

        self.transport = Some(transport);
        Ok(self.peer_present)
    }

    /// Wait for the peer to arrive (blocks until PeerArrived notification)
    #[cfg(feature = "quic")]
    pub async fn wait_for_peer(&mut self) -> Result<()> {
        if self.peer_present {
            return Ok(());
        }

        let transport = self
            .transport
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("not connected".to_string()))?;

        use crate::Transport;
        let mut buf = [0u8; 256];
        let n = transport.receive(&mut buf).await?;

        if n >= 1 && buf[0] == 2 {
            info!("peer arrived");
            self.peer_present = true;
        }

        Ok(())
    }

    /// Send data to the paired peer through the relay
    #[cfg(feature = "quic")]
    pub async fn forward(&mut self, data: &[u8]) -> Result<()> {
        let transport = self
            .transport
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("not connected".to_string()))?;

        use crate::Transport;
        transport.send(data).await?;
        Ok(())
    }

    /// Receive data from the paired peer through the relay
    #[cfg(feature = "quic")]
    pub async fn receive(&mut self, buf: &mut [u8]) -> Result<usize> {
        let transport = self
            .transport
            .as_mut()
            .ok_or_else(|| NetworkError::ConnectionFailed("not connected".to_string()))?;

        use crate::Transport;
        transport.receive(buf).await
    }

    /// Close the relay connection
    #[cfg(feature = "quic")]
    pub async fn close(&mut self) {
        if let Some(mut transport) = self.transport.take() {
            transport.close().await;
        }
    }

    /// Check if peer is present
    pub fn peer_present(&self) -> bool {
        self.peer_present
    }
}
