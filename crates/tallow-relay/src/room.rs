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
    /// Last time any activity occurred (join, data forwarded)
    pub last_activity: Instant,
}

/// A peer in a multi-peer room
pub struct MultiRoomPeer {
    /// Channel to send data to this peer
    pub sender: PeerSender,
    /// Relay-assigned peer ID
    pub peer_id: u8,
}

/// A relay room supporting N peers (Phase 19)
pub struct MultiRoom {
    /// Peers indexed by slot (not necessarily contiguous after leaves)
    peers: Vec<Option<MultiRoomPeer>>,
    /// Maximum peers allowed
    capacity: u8,
    /// Next ID to assign (monotonically increasing, never reused)
    next_id: u8,
    /// Last activity timestamp
    pub last_activity: Instant,
}

impl MultiRoom {
    /// Create a new multi-peer room with the given capacity
    pub fn new(capacity: u8) -> Self {
        Self {
            peers: Vec::with_capacity(capacity as usize),
            capacity,
            next_id: 0,
            last_activity: Instant::now(),
        }
    }

    /// Add a peer, return (assigned_peer_id, list_of_existing_peer_ids)
    pub fn add_peer(&mut self, sender: PeerSender) -> Result<(u8, Vec<u8>), RoomError> {
        let active_count = self.peers.iter().filter(|p| p.is_some()).count();
        if active_count >= self.capacity as usize {
            return Err(RoomError::RoomFull);
        }
        let peer_id = self.next_id;
        self.next_id = self.next_id.checked_add(1).ok_or(RoomError::RoomFull)?;

        let existing: Vec<u8> = self
            .peers
            .iter()
            .filter_map(|p| p.as_ref().map(|rp| rp.peer_id))
            .collect();

        while self.peers.len() <= peer_id as usize {
            self.peers.push(None);
        }
        self.peers[peer_id as usize] = Some(MultiRoomPeer { sender, peer_id });
        self.last_activity = Instant::now();

        Ok((peer_id, existing))
    }

    /// Remove a peer by ID
    pub fn remove_peer(&mut self, peer_id: u8) {
        if let Some(slot) = self.peers.get_mut(peer_id as usize) {
            *slot = None;
        }
    }

    /// Check if the room is empty (all peers left)
    pub fn is_empty(&self) -> bool {
        self.peers.iter().all(|p| p.is_none())
    }

    /// Get the number of active peers
    #[cfg(test)]
    pub fn peer_count(&self) -> usize {
        self.peers.iter().filter(|p| p.is_some()).count()
    }

    /// Update last activity timestamp
    pub fn touch(&mut self) {
        self.last_activity = Instant::now();
    }

    /// Fan-out: send data to all peers except the sender
    pub async fn broadcast_from(&self, from_id: u8, data: Vec<u8>) {
        for p in self.peers.iter().flatten() {
            if p.peer_id != from_id {
                let _ = p.sender.send(data.clone()).await;
            }
        }
    }

    /// Send to a specific peer by ID
    pub async fn send_to(&self, target_id: u8, data: Vec<u8>) -> bool {
        if let Some(Some(ref peer)) = self.peers.get(target_id as usize) {
            peer.sender.send(data).await.is_ok()
        } else {
            false
        }
    }
}

impl Room {
    /// Create a new room with the first peer
    pub fn new(peer: RoomPeer) -> Self {
        let now = Instant::now();
        Self {
            peer_a: Some(peer),
            peer_b: None,
            last_activity: now,
        }
    }

    /// Update last activity timestamp (call on data forwarding)
    pub fn touch(&mut self) {
        self.last_activity = Instant::now();
    }

    /// Check if the room is empty (both peers left)
    pub fn is_empty(&self) -> bool {
        self.peer_a.is_none() && self.peer_b.is_none()
    }
}

/// Manages rooms and peer pairing
pub struct RoomManager {
    rooms: Arc<DashMap<RoomId, Room>>,
    /// Multi-peer rooms (Phase 19)
    multi_rooms: Arc<DashMap<RoomId, MultiRoom>>,
    max_rooms: usize,
    /// Maximum peers per multi-peer room
    max_peers_per_room: u8,
    /// Per-IP room count tracking to prevent single-IP exhaustion
    ip_room_counts: Arc<DashMap<std::net::IpAddr, usize>>,
    /// Maximum rooms per IP
    max_rooms_per_ip: usize,
}

impl RoomManager {
    /// Create a new room manager
    #[cfg(test)]
    pub fn new(max_rooms: usize) -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
            multi_rooms: Arc::new(DashMap::new()),
            max_rooms,
            max_peers_per_room: 10,
            ip_room_counts: Arc::new(DashMap::new()),
            max_rooms_per_ip: 50,
        }
    }

    /// Create with custom per-room peer capacity
    pub fn new_with_multi_capacity(max_rooms: usize, max_peers_per_room: u8) -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
            multi_rooms: Arc::new(DashMap::new()),
            max_rooms,
            max_peers_per_room,
            ip_room_counts: Arc::new(DashMap::new()),
            max_rooms_per_ip: 50,
        }
    }

    /// Join a room with per-IP tracking.
    ///
    /// If the room doesn't exist, creates it and the peer waits.
    /// If the room exists with one peer, the peer is paired.
    /// Returns `(receiver, peer_sender, peer_already_present)`.
    ///
    /// Note: the room count check happens before acquiring the entry lock
    /// to avoid a DashMap deadlock (len() cannot be called while holding
    /// an entry write lock on the same map).
    pub fn join_with_ip(
        &self,
        room_id: RoomId,
        client_ip: Option<std::net::IpAddr>,
    ) -> Result<(PeerReceiver, PeerSender, bool), RoomError> {
        // Per-IP room limit check
        if let Some(ip) = client_ip {
            let ip_count = self.ip_room_counts.get(&ip).map(|v| *v).unwrap_or(0);
            if ip_count >= self.max_rooms_per_ip && !self.rooms.contains_key(&room_id) {
                return Err(RoomError::TooManyRoomsPerIp);
            }
        }
        use dashmap::mapref::entry::Entry;

        // Check room limit BEFORE entering the entry API to avoid deadlock:
        // DashMap's entry() holds a shard write lock, and len() needs to
        // read-lock all shards — calling len() inside entry() deadlocks.
        // This is technically a TOCTOU gap, but the worst case is allowing
        // one extra room briefly, which is acceptable for a relay server.
        if self.rooms.len() >= self.max_rooms && !self.rooms.contains_key(&room_id) {
            return Err(RoomError::TooManyRooms);
        }

        // Create channels for this peer
        let (tx, rx) = mpsc::channel(256);
        let peer = RoomPeer { sender: tx.clone() };

        match self.rooms.entry(room_id) {
            Entry::Occupied(mut entry) => {
                let room = entry.get_mut();
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
                room.touch();
                Ok((rx, peer_a_sender, true))
            }
            Entry::Vacant(entry) => {
                entry.insert(Room::new(peer));

                // Track per-IP room creation
                if let Some(ip) = client_ip {
                    *self.ip_room_counts.entry(ip).or_insert(0) += 1;
                }

                // No peer present yet — caller will wait for peer_b.
                // The PeerSender returned here is a non-functional placeholder:
                // the receiver side is immediately dropped, so any send on this
                // channel will fail. The actual peer_b sender becomes available
                // via `get_peer_sender()` once the second peer joins the room.
                // Channel capacity is 1 (minimum allowed by mpsc::channel).
                let (placeholder_tx, _drop_rx) = mpsc::channel(1);
                Ok((rx, placeholder_tx, false))
            }
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

    /// Update last activity timestamp for a room (call during data forwarding)
    pub fn touch_room(&self, room_id: &RoomId) {
        if let Some(mut room) = self.rooms.get_mut(room_id) {
            room.touch();
        }
    }

    /// Notify that a peer from a given IP has disconnected from a room.
    /// Decrements the per-IP room count.
    pub fn peer_disconnected(&self, room_id: &RoomId, client_ip: Option<std::net::IpAddr>) {
        // Remove peer from room; if room is now empty, remove it
        let should_remove = if let Some(mut room) = self.rooms.get_mut(room_id) {
            // Mark one peer slot as empty
            if room.peer_b.is_some() {
                room.peer_b = None;
            } else if room.peer_a.is_some() {
                room.peer_a = None;
            }
            room.is_empty()
        } else {
            false
        };

        if should_remove {
            self.rooms.remove(room_id);
        }

        // Decrement per-IP counter
        if let Some(ip) = client_ip {
            if let Some(mut count) = self.ip_room_counts.get_mut(&ip) {
                *count = count.saturating_sub(1);
                if *count == 0 {
                    drop(count);
                    self.ip_room_counts.remove(&ip);
                }
            }
        }
    }

    /// Clean up stale rooms that have been idle longer than the given duration
    ///
    /// Uses `last_activity` (not `created_at`) so that active transfers
    /// are not interrupted while completed/abandoned rooms are cleaned up.
    /// Also prunes stale per-IP counters.
    pub fn cleanup_stale(&self, max_idle_secs: u64) -> usize {
        let now = Instant::now();
        let mut removed = 0;

        self.rooms.retain(|_id, room| {
            let idle_secs = now.duration_since(room.last_activity).as_secs();
            if idle_secs > max_idle_secs {
                removed += 1;
                false
            } else {
                true
            }
        });

        self.multi_rooms.retain(|_id, room| {
            let idle_secs = now.duration_since(room.last_activity).as_secs();
            if idle_secs > max_idle_secs {
                removed += 1;
                false
            } else {
                true
            }
        });

        // Prune stale per-IP counters (entries with 0 rooms)
        self.ip_room_counts.retain(|_ip, count| *count > 0);

        removed
    }

    /// Join a multi-peer room. Creates the room if it doesn't exist.
    /// Returns (receiver_channel, assigned_peer_id, existing_peer_ids).
    pub fn join_multi(
        &self,
        room_id: RoomId,
        requested_capacity: u8,
        client_ip: Option<std::net::IpAddr>,
    ) -> Result<(PeerReceiver, u8, Vec<u8>), RoomError> {
        // Per-IP room limit check
        if let Some(ip) = client_ip {
            let ip_count = self.ip_room_counts.get(&ip).map(|v| *v).unwrap_or(0);
            if ip_count >= self.max_rooms_per_ip && !self.multi_rooms.contains_key(&room_id) {
                return Err(RoomError::TooManyRoomsPerIp);
            }
        }

        // Global room limit (count both legacy + multi rooms)
        let total_rooms = self.rooms.len() + self.multi_rooms.len();
        if total_rooms >= self.max_rooms && !self.multi_rooms.contains_key(&room_id) {
            return Err(RoomError::TooManyRooms);
        }

        // Channel for this peer (bounded, smaller for multi-peer memory control)
        let (tx, rx) = mpsc::channel(32);

        use dashmap::mapref::entry::Entry;
        match self.multi_rooms.entry(room_id) {
            Entry::Occupied(mut entry) => {
                let room = entry.get_mut();
                let (peer_id, existing) = room.add_peer(tx)?;
                Ok((rx, peer_id, existing))
            }
            Entry::Vacant(entry) => {
                let capacity = if requested_capacity == 0 {
                    self.max_peers_per_room
                } else {
                    requested_capacity.min(self.max_peers_per_room)
                };
                let mut room = MultiRoom::new(capacity);
                let (peer_id, existing) = room.add_peer(tx)?;
                entry.insert(room);

                // Track per-IP
                if let Some(ip) = client_ip {
                    *self.ip_room_counts.entry(ip).or_insert(0) += 1;
                }

                Ok((rx, peer_id, existing))
            }
        }
    }

    /// Get a reference to a multi-room for fan-out operations.
    pub fn get_multi_room(
        &self,
        room_id: &RoomId,
    ) -> Option<dashmap::mapref::one::Ref<'_, RoomId, MultiRoom>> {
        self.multi_rooms.get(room_id)
    }

    /// Notify that a peer disconnected from a multi-peer room.
    pub fn multi_peer_disconnected(
        &self,
        room_id: &RoomId,
        peer_id: u8,
        client_ip: Option<std::net::IpAddr>,
    ) {
        let should_remove = if let Some(mut room) = self.multi_rooms.get_mut(room_id) {
            room.remove_peer(peer_id);
            room.is_empty()
        } else {
            false
        };

        if should_remove {
            self.multi_rooms.remove(room_id);
        }

        if let Some(ip) = client_ip {
            if let Some(mut count) = self.ip_room_counts.get_mut(&ip) {
                *count = count.saturating_sub(1);
                if *count == 0 {
                    drop(count);
                    self.ip_room_counts.remove(&ip);
                }
            }
        }
    }

    /// Touch multi-room activity timestamp
    pub fn touch_multi_room(&self, room_id: &RoomId) {
        if let Some(mut room) = self.multi_rooms.get_mut(room_id) {
            room.touch();
        }
    }

    /// Get the number of active rooms
    #[cfg(test)]
    pub fn room_count(&self) -> usize {
        self.rooms.len()
    }
}

/// Errors from room operations
#[derive(Debug)]
pub enum RoomError {
    /// Room already has two peers
    RoomFull,
    /// Too many concurrent rooms
    TooManyRooms,
    /// Too many rooms from a single IP address
    TooManyRoomsPerIp,
}

impl std::fmt::Display for RoomError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::RoomFull => write!(f, "room is full"),
            Self::TooManyRooms => write!(f, "server at room capacity"),
            Self::TooManyRoomsPerIp => write!(f, "too many rooms from this IP"),
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
        let (_, _, peer_present) = manager.join_with_ip(room_id, None).unwrap();
        assert!(!peer_present);
        assert_eq!(manager.room_count(), 1);

        // Second peer joins — room is paired
        let (_, _, peer_present) = manager.join_with_ip(room_id, None).unwrap();
        assert!(peer_present);
    }

    #[test]
    fn test_room_full() {
        let manager = RoomManager::new(100);
        let room_id = [1u8; 32];

        manager.join_with_ip(room_id, None).unwrap();
        manager.join_with_ip(room_id, None).unwrap();

        // Third peer should fail
        assert!(manager.join_with_ip(room_id, None).is_err());
    }

    #[test]
    fn test_room_limit() {
        let manager = RoomManager::new(2);

        manager.join_with_ip([1u8; 32], None).unwrap();
        manager.join_with_ip([2u8; 32], None).unwrap();

        // Third room should fail
        assert!(manager.join_with_ip([3u8; 32], None).is_err());
    }

    #[test]
    fn test_cleanup_stale() {
        let manager = RoomManager::new(100);
        manager.join_with_ip([1u8; 32], None).unwrap();

        // Rooms just created should not be cleaned up
        let removed = manager.cleanup_stale(60);
        assert_eq!(removed, 0);
        assert_eq!(manager.room_count(), 1);
    }

    #[test]
    fn test_peer_disconnect_removes_empty_room() {
        let manager = RoomManager::new(100);
        let room_id = [1u8; 32];
        manager.join_with_ip(room_id, None).unwrap();
        assert_eq!(manager.room_count(), 1);

        // Disconnect the only peer — room should be removed
        manager.peer_disconnected(&room_id, None);
        assert_eq!(manager.room_count(), 0);
    }

    // --- Phase 19: Multi-peer room tests ---

    #[test]
    fn test_multi_room_add_peers() {
        let mut room = MultiRoom::new(3);
        let (tx1, _rx1) = mpsc::channel(32);
        let (tx2, _rx2) = mpsc::channel(32);
        let (tx3, _rx3) = mpsc::channel(32);

        let (id0, existing0) = room.add_peer(tx1).unwrap();
        assert_eq!(id0, 0);
        assert!(existing0.is_empty());

        let (id1, existing1) = room.add_peer(tx2).unwrap();
        assert_eq!(id1, 1);
        assert_eq!(existing1, vec![0]);

        let (id2, existing2) = room.add_peer(tx3).unwrap();
        assert_eq!(id2, 2);
        assert_eq!(existing2, vec![0, 1]);

        assert_eq!(room.peer_count(), 3);
    }

    #[test]
    fn test_multi_room_full() {
        let mut room = MultiRoom::new(2);
        let (tx1, _rx1) = mpsc::channel(32);
        let (tx2, _rx2) = mpsc::channel(32);
        let (tx3, _rx3) = mpsc::channel(32);

        room.add_peer(tx1).unwrap();
        room.add_peer(tx2).unwrap();
        assert!(room.add_peer(tx3).is_err());
    }

    #[test]
    fn test_multi_room_remove_peer() {
        let mut room = MultiRoom::new(10);
        let (tx1, _rx1) = mpsc::channel(32);
        let (tx2, _rx2) = mpsc::channel(32);

        room.add_peer(tx1).unwrap();
        room.add_peer(tx2).unwrap();
        assert_eq!(room.peer_count(), 2);

        room.remove_peer(0);
        assert_eq!(room.peer_count(), 1);
        assert!(!room.is_empty());

        room.remove_peer(1);
        assert!(room.is_empty());
    }

    #[test]
    fn test_multi_room_manager_join() {
        let manager = RoomManager::new(100);
        let room_id = [2u8; 32];

        let (_rx, peer_id, existing) = manager.join_multi(room_id, 5, None).unwrap();
        assert_eq!(peer_id, 0);
        assert!(existing.is_empty());

        let (_rx2, peer_id2, existing2) = manager.join_multi(room_id, 5, None).unwrap();
        assert_eq!(peer_id2, 1);
        assert_eq!(existing2, vec![0]);
    }

    #[test]
    fn test_multi_room_peer_disconnect_cleanup() {
        let manager = RoomManager::new(100);
        let room_id = [3u8; 32];

        let (_rx, _, _) = manager.join_multi(room_id, 5, None).unwrap();
        manager.multi_peer_disconnected(&room_id, 0, None);
        // Room should be removed since it's empty
        assert!(manager.get_multi_room(&room_id).is_none());
    }

    #[test]
    fn test_multi_room_capacity_capped() {
        let manager = RoomManager::new_with_multi_capacity(100, 5);
        let room_id = [4u8; 32];

        // Request capacity 20, but server cap is 5
        let (_rx, _, _) = manager.join_multi(room_id, 20, None).unwrap();

        // Should be able to add 4 more (5 total)
        for _ in 0..4 {
            let _ = manager.join_multi(room_id, 20, None).unwrap();
        }

        // 6th peer should fail
        assert!(manager.join_multi(room_id, 20, None).is_err());
    }
}
