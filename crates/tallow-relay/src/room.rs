//! Room management for relay server
//!
//! Rooms pair sender and receiver by room code hash (BLAKE3).
//! The relay forwards encrypted bytes without inspection.

use dashmap::DashMap;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::mpsc;

/// Unique room identifier (BLAKE3 hash of code phrase)
pub type RoomId = [u8; 32];

/// Channel for sending raw bytes to a peer
pub type PeerSender = mpsc::Sender<Vec<u8>>;

/// Channel for receiving raw bytes from a peer
pub type PeerReceiver = mpsc::Receiver<Vec<u8>>;

/// A peer waiting in or connected to a room
pub struct RoomPeer {
    /// Channel to send data to this peer
    pub sender: PeerSender,
}

/// A relay room that pairs two peers
pub struct Room {
    /// First peer (the one who joined first)
    pub peer_a: Option<RoomPeer>,
    /// Second peer (the one who joined second)
    pub peer_b: Option<RoomPeer>,
    /// When this room was created
    pub created_at: Instant,
}

impl Room {
    /// Create a new room with the first peer
    pub fn new(peer: RoomPeer) -> Self {
        Self {
            peer_a: Some(peer),
            peer_b: None,
            created_at: Instant::now(),
        }
    }

    /// Check if the room has both peers
    pub fn is_paired(&self) -> bool {
        self.peer_a.is_some() && self.peer_b.is_some()
    }

    /// Check if the room is empty (both peers left)
    pub fn is_empty(&self) -> bool {
        self.peer_a.is_none() && self.peer_b.is_none()
    }
}

/// Manages rooms and peer pairing
pub struct RoomManager {
    rooms: Arc<DashMap<RoomId, Room>>,
    max_rooms: usize,
}

impl RoomManager {
    /// Create a new room manager
    pub fn new(max_rooms: usize) -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
            max_rooms,
        }
    }

    /// Join a room. Returns a receiver for data from the other peer.
    ///
    /// If the room doesn't exist, creates it and the peer waits.
    /// If the room exists with one peer, the peer is paired.
    /// Returns `(receiver, peer_already_present)`.
    pub fn join(&self, room_id: RoomId) -> Result<(PeerReceiver, PeerSender, bool), RoomError> {
        // Create channels for this peer
        let (tx, rx) = mpsc::channel(256);
        let peer = RoomPeer { sender: tx.clone() };

        // Try to join existing room or create new one
        if let Some(mut room) = self.rooms.get_mut(&room_id) {
            if room.peer_b.is_some() {
                return Err(RoomError::RoomFull);
            }
            // Second peer joining — room is now paired
            let peer_a_sender = room
                .peer_a
                .as_ref()
                .map(|p| p.sender.clone())
                .ok_or(RoomError::RoomFull)?;

            room.peer_b = Some(peer);
            Ok((rx, peer_a_sender, true))
        } else {
            // Check room limit
            if self.rooms.len() >= self.max_rooms {
                return Err(RoomError::TooManyRooms);
            }

            // Create new room with this peer
            let room = Room::new(peer);
            self.rooms.insert(room_id, room);

            // No peer present yet — caller will wait
            // The sender returned here is a dummy; the real peer_b sender
            // will be available when the second peer joins.
            // For now, return a channel that won't receive anything until pairing.
            let (dummy_tx, _dummy_rx) = mpsc::channel(1);
            Ok((rx, dummy_tx, false))
        }
    }

    /// Get the sender for the other peer in a room
    pub fn get_peer_sender(&self, room_id: &RoomId, is_peer_a: bool) -> Option<PeerSender> {
        self.rooms.get(room_id).and_then(|room| {
            if is_peer_a {
                room.peer_b.as_ref().map(|p| p.sender.clone())
            } else {
                room.peer_a.as_ref().map(|p| p.sender.clone())
            }
        })
    }

    /// Remove a room
    pub fn remove_room(&self, room_id: &RoomId) {
        self.rooms.remove(room_id);
    }

    /// Clean up stale rooms older than the given duration
    pub fn cleanup_stale(&self, max_age_secs: u64) -> usize {
        let now = Instant::now();
        let mut removed = 0;

        self.rooms.retain(|_id, room| {
            let age = now.duration_since(room.created_at).as_secs();
            if age > max_age_secs {
                removed += 1;
                false
            } else {
                true
            }
        });

        removed
    }

    /// Get the number of active rooms
    pub fn room_count(&self) -> usize {
        self.rooms.len()
    }

    /// Get a shared reference to the rooms map (for iteration)
    pub fn rooms(&self) -> &DashMap<RoomId, Room> {
        &self.rooms
    }
}

/// Errors from room operations
#[derive(Debug)]
pub enum RoomError {
    /// Room already has two peers
    RoomFull,
    /// Too many concurrent rooms
    TooManyRooms,
}

impl std::fmt::Display for RoomError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::RoomFull => write!(f, "room is full (maximum 2 peers)"),
            Self::TooManyRooms => write!(f, "server at room capacity"),
        }
    }
}

impl std::error::Error for RoomError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_room_manager_create_and_join() {
        let manager = RoomManager::new(100);
        let room_id = [1u8; 32];

        // First peer joins — creates room
        let (_, _, peer_present) = manager.join(room_id).unwrap();
        assert!(!peer_present);
        assert_eq!(manager.room_count(), 1);

        // Second peer joins — room is paired
        let (_, _, peer_present) = manager.join(room_id).unwrap();
        assert!(peer_present);
    }

    #[test]
    fn test_room_full() {
        let manager = RoomManager::new(100);
        let room_id = [1u8; 32];

        manager.join(room_id).unwrap();
        manager.join(room_id).unwrap();

        // Third peer should fail
        assert!(manager.join(room_id).is_err());
    }

    #[test]
    fn test_room_limit() {
        let manager = RoomManager::new(2);

        manager.join([1u8; 32]).unwrap();
        manager.join([2u8; 32]).unwrap();

        // Third room should fail
        assert!(manager.join([3u8; 32]).is_err());
    }

    #[test]
    fn test_cleanup_stale() {
        let manager = RoomManager::new(100);
        manager.join([1u8; 32]).unwrap();

        // Rooms just created should not be cleaned up
        let removed = manager.cleanup_stale(60);
        assert_eq!(removed, 0);
        assert_eq!(manager.room_count(), 1);
    }

    #[test]
    fn test_remove_room() {
        let manager = RoomManager::new(100);
        let room_id = [1u8; 32];
        manager.join(room_id).unwrap();
        assert_eq!(manager.room_count(), 1);

        manager.remove_room(&room_id);
        assert_eq!(manager.room_count(), 0);
    }
}
