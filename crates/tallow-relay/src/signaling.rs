//! Signaling handler for relay
//!
//! Handles room join/leave notifications and peer pairing signals.

use tracing::info;

/// Signaling message types for relay coordination
#[derive(Debug, Clone)]
pub enum RelaySignal {
    /// Peer joined a room
    PeerJoined { room_id: [u8; 32] },
    /// Peer left a room
    PeerLeft { room_id: [u8; 32] },
    /// Room is now paired (both peers present)
    RoomPaired { room_id: [u8; 32] },
}

/// Signaling message handler
#[derive(Debug)]
pub struct SignalingHandler;

impl SignalingHandler {
    /// Create a new signaling handler
    pub fn new() -> Self {
        Self
    }

    /// Handle an incoming signaling event
    pub fn handle(&self, signal: &RelaySignal) {
        match signal {
            RelaySignal::PeerJoined { room_id } => {
                info!("peer joined room {:02x}{:02x}..", room_id[0], room_id[1]);
            }
            RelaySignal::PeerLeft { room_id } => {
                info!("peer left room {:02x}{:02x}..", room_id[0], room_id[1]);
            }
            RelaySignal::RoomPaired { room_id } => {
                info!("room {:02x}{:02x}.. is now paired", room_id[0], room_id[1]);
            }
        }
    }
}

impl Default for SignalingHandler {
    fn default() -> Self {
        Self::new()
    }
}
