# Phase 19: Multi-Peer Rooms -- Plan

## Goal

Extend Tallow from exactly 2 peers per room to N peers (up to 10) with pairwise KEM handshakes and per-pair AES-256-GCM encryption, enabling multi-peer encrypted chat via relay fan-out -- without breaking existing 2-peer functionality.

## Architecture Summary

- **Relay**: `MultiRoom` struct with `Vec<Option<RoomPeer>>`, capacity cap, relay-assigned peer IDs, fan-out + targeted routing
- **Wire protocol**: 6 new `Message` variants appended to the end of the enum (postcard ordinal safety)
- **Client**: Pairwise KEM handshakes orchestrated by peer ID ordering (lower ID = initiator), per-pair directional keys via HKDF, multi-peer chat loop with `Targeted` envelope
- **Backward compatibility**: Existing `RoomJoin` path unchanged; `RoomJoinMulti` is a new code path; all 598+ existing tests continue to pass

## Key Design Decisions (Locked)

1. **Pairwise KEM handshakes** -- NOT MLS/TreeKEM. Reuse existing `SenderHandshake`/`ReceiverHandshake` from `kex.rs` for each peer pair.
2. **Per-pair directional keys via HKDF** -- derive `send_key` and `recv_key` from the pairwise session key + peer IDs as HKDF info. Eliminates nonce coordination.
3. **Relay-side fan-out with per-peer mpsc channels** -- NOT `tokio::broadcast`. Each peer gets its own bounded `mpsc::channel(32)` in multi-peer rooms (smaller than 2-peer's 256 to control memory).
4. **Relay overwrites `from_peer`** -- prevents spoofing. The relay maps QUIC connections to peer IDs and stamps outbound messages.
5. **Lower peer ID = handshake initiator** -- deterministic role assignment prevents handshake race conditions.
6. **New Message variants appended at END of enum** -- postcard varint discriminant safety.
7. **Default capacity 10, max 20** -- configurable via `RelayConfig`.
8. **Nonce management: simple counter per-pair, starting at 0** -- per-direction keys make even/odd splitting unnecessary.
9. **Multi-peer file transfer deferred** -- this phase delivers multi-peer chat only.
10. **No new crate dependencies.**

---

## Wave Structure

### Wave 1: Wire Protocol + Relay Room Data Structures (no dependencies)

These tasks modify core types that all subsequent waves depend on. They are independent of each other within this wave.

#### Task 1.1: Add Multi-Peer Message Variants to Wire Protocol

- **Files to modify:** `crates/tallow-protocol/src/wire/messages.rs`
- **Files to create:** None
- **What to do:**

  1. Append exactly 6 new variants to the **end** of the `Message` enum (after `ChatEnd`). Add a doc comment above them marking the start of Phase 19 variants:

  ```rust
  // --- Phase 19: Multi-Peer Room variants (DO NOT reorder; postcard ordinal) ---

  /// Multi-peer room join request
  RoomJoinMulti {
      /// Room ID (BLAKE3 hash of code phrase, 32 bytes)
      room_id: Vec<u8>,
      /// BLAKE3 hash of relay password. None = no auth attempted.
      password_hash: Option<Vec<u8>>,
      /// Requested room capacity (0 = use server default)
      requested_capacity: u8,
  },
  /// Multi-peer room joined response with peer ID assignment
  RoomJoinedMulti {
      /// This peer's assigned ID in the room
      peer_id: u8,
      /// List of already-present peer IDs
      existing_peers: Vec<u8>,
  },
  /// A new peer has joined the room (broadcast to existing peers)
  PeerJoinedRoom {
      /// The new peer's assigned ID
      peer_id: u8,
  },
  /// A peer has left the room (broadcast to remaining peers)
  PeerLeftRoom {
      /// The departing peer's ID
      peer_id: u8,
  },
  /// Targeted message envelope for multi-peer routing
  ///
  /// The relay reads `to_peer` to route and overwrites `from_peer`
  /// with the actual sender's ID (anti-spoofing). Payload is opaque
  /// E2E encrypted bytes.
  Targeted {
      /// Sender's peer ID (set/overwritten by relay)
      from_peer: u8,
      /// Target peer ID (0xFF = broadcast to all)
      to_peer: u8,
      /// Opaque payload (E2E encrypted message bytes)
      payload: Vec<u8>,
  },
  /// Room peer count response
  RoomPeerCount {
      /// Current number of peers in the room
      count: u8,
      /// Room capacity
      capacity: u8,
  },
  ```

  2. Add roundtrip test cases for ALL 6 new variants to the existing `test_message_roundtrip_all_variants` test:

  ```rust
  // Phase 19: Multi-peer variants
  Message::RoomJoinMulti {
      room_id: vec![0u8; 32],
      password_hash: Some(vec![0xAB; 32]),
      requested_capacity: 10,
  },
  Message::RoomJoinMulti {
      room_id: vec![0u8; 32],
      password_hash: None,
      requested_capacity: 0,
  },
  Message::RoomJoinedMulti {
      peer_id: 0,
      existing_peers: vec![],
  },
  Message::RoomJoinedMulti {
      peer_id: 3,
      existing_peers: vec![0, 1, 2],
  },
  Message::PeerJoinedRoom { peer_id: 5 },
  Message::PeerLeftRoom { peer_id: 2 },
  Message::Targeted {
      from_peer: 0,
      to_peer: 1,
      payload: vec![0xDE, 0xAD],
  },
  Message::Targeted {
      from_peer: 0,
      to_peer: 0xFF,
      payload: vec![],
  },
  Message::RoomPeerCount {
      count: 5,
      capacity: 10,
  },
  ```

  3. Add a standalone test that verifies discriminant stability -- encode a `ChatEnd` (last pre-Phase-19 variant) and verify its discriminant byte is unchanged:

  ```rust
  #[test]
  fn test_discriminant_stability_chat_end() {
      // ChatEnd was the last variant before Phase 19 additions.
      // Its encoded discriminant must not change when new variants are appended.
      let bytes = postcard::to_stdvec(&Message::ChatEnd).unwrap();
      // ChatEnd is variant index 30 (0-indexed). Postcard encodes this as varint 30.
      assert_eq!(bytes[0], 30, "ChatEnd discriminant must remain 30");
  }
  ```

- **Verification:**
  ```
  cargo test -p tallow-protocol test_message_roundtrip_all_variants
  cargo test -p tallow-protocol test_discriminant_stability_chat_end
  cargo clippy -p tallow-protocol -- -D warnings
  ```

#### Task 1.2: Add MultiRoom Struct to Relay

- **Files to modify:** `crates/tallow-relay/src/room.rs`
- **Files to create:** None
- **What to do:**

  1. Add a `max_peers_per_room: u8` field to `RoomManager`:

  ```rust
  pub struct RoomManager {
      rooms: Arc<DashMap<RoomId, Room>>,
      /// Multi-peer rooms (Phase 19)
      multi_rooms: Arc<DashMap<RoomId, MultiRoom>>,
      max_rooms: usize,
      max_peers_per_room: u8,
      ip_room_counts: Arc<DashMap<std::net::IpAddr, usize>>,
      max_rooms_per_ip: usize,
  }
  ```

  2. Add `MultiRoom` struct after the existing `Room` struct:

  ```rust
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
      last_activity: Instant,
  }
  ```

  3. Implement `MultiRoom` methods:

  ```rust
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
      pub fn peer_count(&self) -> usize {
          self.peers.iter().filter(|p| p.is_some()).count()
      }

      /// Get room capacity
      pub fn capacity(&self) -> u8 {
          self.capacity
      }

      /// Update last activity timestamp
      pub fn touch(&mut self) {
          self.last_activity = Instant::now();
      }

      /// Fan-out: send data to all peers except the sender
      pub async fn broadcast_from(&self, from_id: u8, data: Vec<u8>) {
          for peer in &self.peers {
              if let Some(ref p) = peer {
                  if p.peer_id != from_id {
                      let _ = p.sender.send(data.clone()).await;
                  }
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
  ```

  4. Update `RoomManager::new()` to initialize the new fields:

  ```rust
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
  ```

  5. Add a `new_with_multi_capacity` constructor:

  ```rust
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
  ```

  6. Add multi-room join method:

  ```rust
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
          if ip_count >= self.max_rooms_per_ip
              && !self.multi_rooms.contains_key(&room_id)
          {
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
  ```

  7. Add multi-room helper methods:

  ```rust
  /// Get a reference to a multi-room for fan-out operations.
  /// Returns None if the room does not exist.
  pub fn get_multi_room(&self, room_id: &RoomId) -> Option<dashmap::mapref::one::Ref<'_, RoomId, MultiRoom>> {
      self.multi_rooms.get(room_id)
  }

  /// Get a mutable reference to a multi-room.
  pub fn get_multi_room_mut(&self, room_id: &RoomId) -> Option<dashmap::mapref::one::RefMut<'_, RoomId, MultiRoom>> {
      self.multi_rooms.get_mut(room_id)
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
  ```

  8. Update `cleanup_stale` to also clean multi-rooms:

  ```rust
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

      self.ip_room_counts.retain(|_ip, count| *count > 0);

      removed
  }
  ```

  9. Update `RoomError::RoomFull` display to be capacity-generic:

  ```rust
  Self::RoomFull => write!(f, "room is full"),
  ```

  10. Add unit tests for `MultiRoom`:

  ```rust
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
  ```

- **Verification:**
  ```
  cargo test -p tallow-relay
  cargo clippy -p tallow-relay -- -D warnings
  ```

#### Task 1.3: Add RelayConfig Field for Max Peers Per Room

- **Files to modify:** `crates/tallow-relay/src/config.rs`, `crates/tallow-relay/src/main.rs`, `crates/tallow-relay/src/server.rs`
- **Files to create:** None
- **What to do:**

  1. Add `max_peers_per_room` to `RelayConfig`:

  ```rust
  /// Maximum peers per multi-peer room (default: 10, max: 20)
  pub max_peers_per_room: u8,
  ```

  2. Update `Default for RelayConfig`:

  ```rust
  max_peers_per_room: 10,
  ```

  3. Add CLI arg in `main.rs` `Commands::Serve`:

  ```rust
  /// Maximum peers per multi-peer room (default: 10, max: 20)
  #[arg(long, default_value = "10")]
  max_peers_per_room: u8,
  ```

  4. Apply the CLI override in `main.rs`:

  ```rust
  relay_config.max_peers_per_room = max_peers_per_room.min(20);
  ```

  5. Update `RelayServer::new()` in `server.rs` to use `RoomManager::new_with_multi_capacity`:

  ```rust
  let room_manager = Arc::new(RoomManager::new_with_multi_capacity(
      config.max_rooms,
      config.max_peers_per_room,
  ));
  ```

- **Verification:**
  ```
  cargo build -p tallow-relay
  cargo clippy -p tallow-relay -- -D warnings
  ```

---

### Wave 2: Relay Server Multi-Peer Connection Handling (depends on Wave 1)

#### Task 2.1: Handle RoomJoinMulti on the Relay Server

- **Files to modify:** `crates/tallow-relay/src/server.rs`
- **Files to create:** None
- **What to do:**

  1. Update `parse_room_join` to return a new enum indicating legacy vs multi join. Create a new struct and update the function:

  ```rust
  /// Parsed room join -- either legacy 2-peer or multi-peer
  enum ParsedRoomJoin {
      Legacy(RoomJoinParsed),
      Multi(MultiRoomJoinParsed),
  }

  struct MultiRoomJoinParsed {
      room_id: RoomId,
      password_hash: Option<[u8; 32]>,
      requested_capacity: u8,
  }
  ```

  The relay server currently does manual byte-level parsing of the `RoomJoin` message (it does NOT use postcard on the relay side). For `RoomJoinMulti`, the simplest approach is to try postcard deserialization of the full `Message` enum to detect multi-peer joins. Update the parsing logic:

  ```rust
  fn parse_room_join(data: &[u8]) -> anyhow::Result<ParsedRoomJoin> {
      // First, try postcard deserialization to detect new message types
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
              _ => anyhow::bail!("expected RoomJoin or RoomJoinMulti, got other message type"),
          }
      }

      // Fallback: existing manual byte parsing for backward compatibility
      // (keep the existing parse_room_join body here, wrapped in ParsedRoomJoin::Legacy)
      // ... existing code ...
  }
  ```

  **Note:** The relay crate will need `tallow-protocol` as a dependency for postcard deserialization. Check if it already has it; if not, add `tallow-protocol = { path = "../tallow-protocol" }` to `crates/tallow-relay/Cargo.toml`. **However**, to avoid pulling in heavy crypto deps, an alternative is to add `postcard` + `serde` directly and define a minimal enum just for parsing. The simplest correct approach is: add `tallow-protocol` as a dependency (the relay already transitively depends on the same crates). Check `crates/tallow-relay/Cargo.toml` and add if needed.

  2. Refactor `handle_connection` to dispatch on `ParsedRoomJoin`:

  ```rust
  match join {
      ParsedRoomJoin::Legacy(legacy_join) => {
          handle_legacy_connection(
              connection, &mut send, &mut recv,
              room_manager, legacy_join, client_ip,
          ).await
      }
      ParsedRoomJoin::Multi(multi_join) => {
          handle_multi_connection(
              connection, &mut send, &mut recv,
              room_manager, multi_join, client_ip,
          ).await
      }
  }
  ```

  3. Keep the existing `handle_connection` logic intact as `handle_legacy_connection` (rename the code after the join parsing). The existing 2-peer forwarding loop moves into this function unchanged.

  4. Implement `handle_multi_connection`:

  ```rust
  async fn handle_multi_connection(
      connection: quinn::Connection,
      send: &mut quinn::SendStream,
      recv: &mut quinn::RecvStream,
      room_manager: Arc<RoomManager>,
      join: MultiRoomJoinParsed,
      client_ip: std::net::IpAddr,
  ) -> anyhow::Result<()> {
      let room_id = join.room_id;

      // Join the multi-peer room
      let (mut peer_rx, my_peer_id, existing_peers) = room_manager
          .join_multi(room_id, join.requested_capacity, Some(client_ip))
          .map_err(|e| anyhow::anyhow!("multi-room join failed: {}", e))?;

      tracing::info!(
          "peer {} joined multi-room (existing: {:?})",
          my_peer_id,
          existing_peers,
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
      let room_manager_rx = Arc::clone(&room_manager);

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
                      tallow_protocol::wire::Message::Targeted { to_peer, payload, .. } => {
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
                          routed_bytes.extend_from_slice(&(routed_payload.len() as u32).to_be_bytes());
                          routed_bytes.extend_from_slice(&routed_payload);

                          if let Some(room) = room_manager_fwd.get_multi_room(&room_id_fwd) {
                              if to_peer == 0xFF {
                                  // Broadcast
                                  room.broadcast_from(my_peer_id, routed_bytes).await;
                              } else {
                                  // Targeted
                                  let _ = room.send_to(to_peer, routed_bytes).await;
                              }
                              drop(room);
                              room_manager_fwd.touch_multi_room(&room_id_fwd);
                          }
                      }
                      _ => {
                          // Non-targeted messages in multi-peer rooms are broadcast
                          // (e.g., Ping/Pong -- but these should be peer-to-relay only)
                          // For now, ignore non-Targeted messages.
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

      tracing::info!("peer {} disconnected from multi-room", my_peer_id);

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
  ```

  5. The relay crate now needs `tallow-protocol` and `postcard` as dependencies. Add to `crates/tallow-relay/Cargo.toml`:

  ```toml
  tallow-protocol = { path = "../tallow-protocol" }
  postcard = { version = "1", features = ["alloc"] }
  ```

  Check if `postcard` is already a transitive dependency; if so, just the `tallow-protocol` line is needed.

- **Verification:**
  ```
  cargo build -p tallow-relay
  cargo test -p tallow-relay
  cargo clippy -p tallow-relay -- -D warnings
  ```

---

### Wave 3: Client-Side Pairwise Key Derivation + Multi-Peer Session (depends on Wave 1)

#### Task 3.1: Add Per-Pair Key Derivation Module

- **Files to modify:** None
- **Files to create:** `crates/tallow-protocol/src/kex/multi.rs`
- **What to do:**

  1. Create the module with `PeerSession` struct and key derivation:

  ```rust
  //! Multi-peer key exchange orchestration
  //!
  //! Manages pairwise KEM sessions between N peers in a multi-peer room.
  //! Each peer pair derives independent directional encryption keys via HKDF.

  use std::collections::HashMap;
  use zeroize::Zeroize;

  /// Per-peer session state holding pairwise encryption keys
  pub struct PeerSession {
      /// Peer's relay-assigned ID
      peer_id: u8,
      /// AES-256-GCM key for encrypting messages TO this peer
      send_key: [u8; 32],
      /// AES-256-GCM key for decrypting messages FROM this peer
      recv_key: [u8; 32],
      /// Nonce counter for sending (simple increment, no even/odd split)
      send_nonce: u64,
  }

  impl PeerSession {
      /// Get the peer ID
      pub fn peer_id(&self) -> u8 {
          self.peer_id
      }

      /// Get the send key
      pub fn send_key(&self) -> &[u8; 32] {
          &self.send_key
      }

      /// Get the recv key
      pub fn recv_key(&self) -> &[u8; 32] {
          &self.recv_key
      }

      /// Get current send nonce and advance counter
      pub fn next_send_nonce(&mut self) -> u64 {
          let n = self.send_nonce;
          self.send_nonce += 1;
          n
      }
  }

  impl Drop for PeerSession {
      fn drop(&mut self) {
          self.send_key.zeroize();
          self.recv_key.zeroize();
      }
  }

  /// Domain separation prefix for multi-peer key derivation
  const MULTI_PEER_KEY_DOMAIN: &str = "tallow.multipeer.pairkey.v1";

  /// Derive directional encryption keys from a pairwise session key.
  ///
  /// Uses HKDF-SHA256 with peer IDs in the info field to derive two
  /// distinct keys: one for each direction of communication.
  ///
  /// The lower peer ID's "send_key" is the higher peer ID's "recv_key",
  /// ensuring both sides derive the same key pair.
  ///
  /// # Arguments
  ///
  /// * `session_key` - The 32-byte pairwise session key from KEM handshake
  /// * `my_peer_id` - This peer's relay-assigned ID
  /// * `their_peer_id` - The other peer's relay-assigned ID
  pub fn derive_peer_keys(
      session_key: &[u8; 32],
      my_peer_id: u8,
      their_peer_id: u8,
  ) -> Result<PeerSession, crate::ProtocolError> {
      // Deterministic ordering: lower ID is always "A", higher is "B"
      let (id_a, id_b) = if my_peer_id < their_peer_id {
          (my_peer_id, their_peer_id)
      } else {
          (their_peer_id, my_peer_id)
      };

      let info_a_to_b = format!("{}-{}-to-{}", MULTI_PEER_KEY_DOMAIN, id_a, id_b);
      let info_b_to_a = format!("{}-{}-to-{}", MULTI_PEER_KEY_DOMAIN, id_b, id_a);

      let key_a_to_b = tallow_crypto::kdf::hkdf::derive(
          &[0u8; 32], // salt
          session_key,
          info_a_to_b.as_bytes(),
          32,
      )
      .map_err(|e| crate::ProtocolError::HandshakeFailed(format!("HKDF derive failed: {}", e)))?;

      let key_b_to_a = tallow_crypto::kdf::hkdf::derive(
          &[0u8; 32],
          session_key,
          info_b_to_a.as_bytes(),
          32,
      )
      .map_err(|e| crate::ProtocolError::HandshakeFailed(format!("HKDF derive failed: {}", e)))?;

      let mut send_key = [0u8; 32];
      let mut recv_key = [0u8; 32];

      if my_peer_id < their_peer_id {
          // I'm A: my send = A->B, my recv = B->A
          send_key.copy_from_slice(&key_a_to_b);
          recv_key.copy_from_slice(&key_b_to_a);
      } else {
          // I'm B: my send = B->A, my recv = A->B
          send_key.copy_from_slice(&key_b_to_a);
          recv_key.copy_from_slice(&key_a_to_b);
      }

      Ok(PeerSession {
          peer_id: their_peer_id,
          send_key,
          recv_key,
          send_nonce: 0,
      })
  }

  /// Manages all pairwise sessions for a multi-peer room
  pub struct MultiPeerSessions {
      /// Our peer ID
      my_peer_id: u8,
      /// Pairwise sessions keyed by the other peer's ID
      sessions: HashMap<u8, PeerSession>,
  }

  impl MultiPeerSessions {
      /// Create a new session manager
      pub fn new(my_peer_id: u8) -> Self {
          Self {
              my_peer_id,
              sessions: HashMap::new(),
          }
      }

      /// Our peer ID
      pub fn my_peer_id(&self) -> u8 {
          self.my_peer_id
      }

      /// Add a pairwise session after a successful KEM handshake
      pub fn add_session(
          &mut self,
          session_key: &[u8; 32],
          their_peer_id: u8,
      ) -> Result<(), crate::ProtocolError> {
          let session = derive_peer_keys(session_key, self.my_peer_id, their_peer_id)?;
          self.sessions.insert(their_peer_id, session);
          Ok(())
      }

      /// Remove a session when a peer leaves
      pub fn remove_session(&mut self, peer_id: u8) {
          self.sessions.remove(&peer_id);
      }

      /// Get a session for a specific peer
      pub fn get(&self, peer_id: &u8) -> Option<&PeerSession> {
          self.sessions.get(peer_id)
      }

      /// Get a mutable session for a specific peer
      pub fn get_mut(&mut self, peer_id: &u8) -> Option<&mut PeerSession> {
          self.sessions.get_mut(peer_id)
      }

      /// Iterate over all sessions
      pub fn iter(&self) -> impl Iterator<Item = (&u8, &PeerSession)> {
          self.sessions.iter()
      }

      /// Iterate over all sessions mutably
      pub fn iter_mut(&mut self) -> impl Iterator<Item = (&u8, &mut PeerSession)> {
          self.sessions.iter_mut()
      }

      /// Number of active sessions
      pub fn len(&self) -> usize {
          self.sessions.len()
      }

      /// Whether there are no sessions
      pub fn is_empty(&self) -> bool {
          self.sessions.is_empty()
      }

      /// Whether we should be the handshake initiator for a given peer
      pub fn is_initiator_for(&self, their_peer_id: u8) -> bool {
          self.my_peer_id < their_peer_id
      }
  }
  ```

  2. Register the module in `crates/tallow-protocol/src/kex.rs` by adding at the top (after the existing `use` statements, before any structs):

  ```rust
  pub mod multi;
  ```

  Actually, `kex.rs` is a file, not a directory. We need to either:
  - Convert `kex.rs` into `kex/mod.rs` + `kex/multi.rs`, OR
  - Place `multi.rs` alongside as `kex_multi.rs` and add `pub mod kex_multi;` in `lib.rs`

  The cleanest approach: keep `kex.rs` as is and create a new top-level module `crates/tallow-protocol/src/multi.rs` (not nested under kex). Register it in `crates/tallow-protocol/src/lib.rs`:

  ```rust
  pub mod multi;
  ```

  3. Add tests:

  ```rust
  #[cfg(test)]
  mod tests {
      use super::*;

      #[test]
      fn test_derive_peer_keys_symmetric() {
          let session_key = [42u8; 32];
          let alice = derive_peer_keys(&session_key, 0, 1).unwrap();
          let bob = derive_peer_keys(&session_key, 1, 0).unwrap();

          // Alice's send key should be Bob's recv key
          assert_eq!(alice.send_key(), bob.recv_key());
          // Alice's recv key should be Bob's send key
          assert_eq!(alice.recv_key(), bob.send_key());
      }

      #[test]
      fn test_derive_peer_keys_different_pairs_produce_different_keys() {
          let session_key = [42u8; 32];
          let pair_01 = derive_peer_keys(&session_key, 0, 1).unwrap();
          let pair_02 = derive_peer_keys(&session_key, 0, 2).unwrap();

          assert_ne!(pair_01.send_key(), pair_02.send_key());
          assert_ne!(pair_01.recv_key(), pair_02.recv_key());
      }

      #[test]
      fn test_derive_peer_keys_different_sessions() {
          let key1 = [1u8; 32];
          let key2 = [2u8; 32];
          let s1 = derive_peer_keys(&key1, 0, 1).unwrap();
          let s2 = derive_peer_keys(&key2, 0, 1).unwrap();

          assert_ne!(s1.send_key(), s2.send_key());
      }

      #[test]
      fn test_multi_peer_sessions_initiator_role() {
          let sessions = MultiPeerSessions::new(2);
          assert!(sessions.is_initiator_for(5)); // 2 < 5
          assert!(!sessions.is_initiator_for(1)); // 2 > 1
      }

      #[test]
      fn test_multi_peer_sessions_add_remove() {
          let mut sessions = MultiPeerSessions::new(0);
          let key = [99u8; 32];

          sessions.add_session(&key, 1).unwrap();
          sessions.add_session(&key, 2).unwrap();
          assert_eq!(sessions.len(), 2);

          sessions.remove_session(1);
          assert_eq!(sessions.len(), 1);
          assert!(sessions.get(&1).is_none());
          assert!(sessions.get(&2).is_some());
      }

      #[test]
      fn test_nonce_counter_increments() {
          let key = [42u8; 32];
          let mut session = derive_peer_keys(&key, 0, 1).unwrap();

          assert_eq!(session.next_send_nonce(), 0);
          assert_eq!(session.next_send_nonce(), 1);
          assert_eq!(session.next_send_nonce(), 2);
      }
  }
  ```

- **Verification:**
  ```
  cargo test -p tallow-protocol multi
  cargo clippy -p tallow-protocol -- -D warnings
  ```

---

### Wave 4: CLI Multi-Peer Chat Command (depends on Waves 2 + 3)

#### Task 4.1: Add `--multi` Flag to ChatArgs

- **Files to modify:** `crates/tallow/src/cli.rs`
- **Files to create:** None
- **What to do:**

  1. Add `multi` flag to `ChatArgs`:

  ```rust
  /// Enable multi-peer room (3+ participants)
  #[arg(long)]
  pub multi: bool,

  /// Maximum room capacity for multi-peer mode (default: 10)
  #[arg(long, default_value = "10")]
  pub capacity: u8,
  ```

- **Verification:**
  ```
  cargo build -p tallow
  cargo clippy -p tallow -- -D warnings
  ```

#### Task 4.2: Implement Multi-Peer Chat Command

- **Files to modify:** `crates/tallow/src/commands/chat.rs`
- **Files to create:** None
- **What to do:**

  1. In `execute()`, after the proxy setup and code phrase generation, add a branch for multi-peer mode:

  ```rust
  if args.multi {
      return execute_multi(args, json, code_phrase, room_id, proxy_config).await;
  }
  ```

  2. Implement `execute_multi` as a new async function in the same file. This is the main multi-peer chat entry point:

  ```rust
  /// Execute multi-peer chat
  async fn execute_multi(
      args: ChatArgs,
      json: bool,
      code_phrase: String,
      room_id: [u8; 32],
      proxy_config: Option<tallow_net::privacy::ProxyConfig>,
  ) -> io::Result<()> {
      // Hash relay password
      let password_hash: Option<[u8; 32]> = args
          .relay_pass
          .as_ref()
          .map(|pass| blake3::hash(pass.as_bytes()).into());
      let pw_ref = password_hash.as_ref();

      // Connect to relay (same pattern as existing chat, but send RoomJoinMulti)
      let relay_addr = resolve_relay(&args.relay)?;
      // Build a raw QUIC connection (we need to manage the join message ourselves)
      let mut channel = /* ... connect same as before ... */;

      // Send RoomJoinMulti
      let mut codec = TallowCodec::new();
      let mut encode_buf = BytesMut::new();
      let join_msg = Message::RoomJoinMulti {
          room_id: room_id.to_vec(),
          password_hash: password_hash.map(|h| h.to_vec()),
          requested_capacity: args.capacity,
      };
      encode_buf.clear();
      codec.encode_msg(&join_msg, &mut encode_buf)
          .map_err(|e| io::Error::other(format!("encode RoomJoinMulti: {e}")))?;
      channel.send_message(&encode_buf).await
          .map_err(|e| io::Error::other(format!("send RoomJoinMulti: {e}")))?;

      // Receive RoomJoinedMulti
      let mut recv_buf = vec![0u8; RECV_BUF_SIZE];
      let n = channel.receive_message(&mut recv_buf).await
          .map_err(|e| io::Error::other(format!("recv RoomJoinedMulti: {e}")))?;
      let mut decode_buf = BytesMut::from(&recv_buf[..n]);
      let joined = codec.decode_msg(&mut decode_buf)
          .map_err(|e| io::Error::other(format!("decode RoomJoinedMulti: {e}")))?;

      let (my_peer_id, existing_peers) = match joined {
          Some(Message::RoomJoinedMulti { peer_id, existing_peers }) => {
              (peer_id, existing_peers)
          }
          other => {
              return Err(io::Error::other(format!(
                  "Expected RoomJoinedMulti, got: {:?}", other
              )));
          }
      };

      if !json {
          output::color::success(&format!(
              "Joined multi-peer room as peer {} ({} existing peers)",
              my_peer_id,
              existing_peers.len(),
          ));
      }

      // Initialize multi-peer session manager
      let mut sessions = tallow_protocol::multi::MultiPeerSessions::new(my_peer_id);

      // Perform pairwise KEM handshakes with all existing peers
      for &peer_id in &existing_peers {
          let session_key = if sessions.is_initiator_for(peer_id) {
              multi_sender_handshake(
                  &code_phrase, &room_id, my_peer_id, peer_id,
                  &mut codec, &mut encode_buf, &mut recv_buf, &mut channel,
              ).await?
          } else {
              multi_receiver_handshake(
                  &code_phrase, &room_id, my_peer_id, peer_id,
                  &mut codec, &mut encode_buf, &mut recv_buf, &mut channel,
              ).await?
          };

          sessions.add_session(session_key.as_bytes(), peer_id)
              .map_err(|e| io::Error::other(format!("Key derivation failed: {e}")))?;

          if !json {
              output::color::success(&format!("Secure session with peer {}", peer_id));
          }
      }

      if !json {
          output::color::info("Chat session started. Type /quit to exit. Waiting for messages...");
      }

      // --- Multi-peer chat loop ---
      let stdin = tokio::io::stdin();
      let reader = tokio::io::BufReader::new(stdin);
      let mut lines = reader.lines();
      let mut sequence: u64 = 0;

      loop {
          tokio::select! {
              line_result = lines.next_line() => {
                  match line_result? {
                      Some(text) if text.trim() == "/quit" => {
                          // Send ChatEnd to all peers via Targeted broadcast
                          let end_payload = postcard::to_stdvec(&Message::ChatEnd)
                              .map_err(|e| io::Error::other(format!("encode ChatEnd: {e}")))?;
                          let broadcast = Message::Targeted {
                              from_peer: my_peer_id,
                              to_peer: 0xFF,
                              payload: end_payload,
                          };
                          encode_and_send(&broadcast, &mut codec, &mut encode_buf, &mut channel).await?;
                          if !json {
                              output::color::info("Chat ended.");
                          }
                          break;
                      }
                      Some(text) if text.trim().is_empty() => continue,
                      Some(text) => {
                          if text.len() > tallow_protocol::chat::MAX_CHAT_MESSAGE_SIZE {
                              if !json {
                                  output::color::warning("Message too large. Not sent.");
                              }
                              continue;
                          }

                          // Encrypt and send to each peer with their pairwise key
                          let message_id: [u8; 16] = rand::random();
                          for (_peer_id, session) in sessions.iter_mut() {
                              let nonce_val = session.next_send_nonce();
                              let mut nonce = [0u8; 12];
                              nonce[4..12].copy_from_slice(&nonce_val.to_be_bytes());

                              let ciphertext = tallow_crypto::symmetric::aes_encrypt(
                                  session.send_key(),
                                  &nonce,
                                  text.as_bytes(),
                                  b"tallow-chat-v1",
                              ).map_err(|e| io::Error::other(format!("encrypt: {e}")))?;

                              let chat_msg = Message::ChatText {
                                  message_id,
                                  sequence,
                                  ciphertext,
                                  nonce,
                              };
                              let inner_bytes = postcard::to_stdvec(&chat_msg)
                                  .map_err(|e| io::Error::other(format!("encode ChatText: {e}")))?;

                              let targeted = Message::Targeted {
                                  from_peer: my_peer_id,
                                  to_peer: session.peer_id(),
                                  payload: inner_bytes,
                              };
                              encode_and_send(&targeted, &mut codec, &mut encode_buf, &mut channel).await?;
                          }
                          sequence += 1;

                          if !json {
                              output::color::info(&format!("You: {}", text));
                          }
                      }
                      None => {
                          // EOF
                          break;
                      }
                  }
              }
              recv_result = channel.receive_message(&mut recv_buf) => {
                  let n = recv_result.map_err(|e| io::Error::other(format!("recv: {e}")))?;
                  let mut decode_buf = BytesMut::from(&recv_buf[..n]);
                  let msg = codec.decode_msg(&mut decode_buf)
                      .map_err(|e| io::Error::other(format!("decode: {e}")))?;

                  match msg {
                      Some(Message::Targeted { from_peer, payload, .. }) => {
                          // Decode inner message
                          if let Ok(inner) = postcard::from_bytes::<Message>(&payload) {
                              match inner {
                                  Message::ChatText { ciphertext, nonce, .. } => {
                                      if let Some(session) = sessions.get(&from_peer) {
                                          match tallow_crypto::symmetric::aes_decrypt(
                                              session.recv_key(), &nonce, &ciphertext,
                                              b"tallow-chat-v1",
                                          ) {
                                              Ok(plaintext_bytes) => {
                                                  let text = String::from_utf8_lossy(&plaintext_bytes);
                                                  let safe = tallow_protocol::transfer::sanitize::sanitize_display(&text);
                                                  if !json {
                                                      output::color::success(
                                                          &format!("Peer {}: {}", from_peer, safe)
                                                      );
                                                  }
                                              }
                                              Err(e) => {
                                                  tracing::warn!("Decrypt from peer {} failed: {}", from_peer, e);
                                              }
                                          }
                                      } else {
                                          tracing::warn!("No session for peer {}", from_peer);
                                      }
                                  }
                                  Message::ChatEnd => {
                                      sessions.remove_session(from_peer);
                                      if !json {
                                          output::color::info(&format!("Peer {} left the chat.", from_peer));
                                      }
                                  }
                                  Message::HandshakeInit { protocol_version, kem_capabilities, cpace_public, nonce } => {
                                      // Late-joiner handshake: a new peer is initiating
                                      tracing::info!("Received handshake init from peer {}", from_peer);
                                      let session_key = handle_incoming_handshake(
                                          &code_phrase, &room_id, my_peer_id, from_peer,
                                          protocol_version, &kem_capabilities, &cpace_public, &nonce,
                                          &mut codec, &mut encode_buf, &mut recv_buf, &mut channel,
                                      ).await?;
                                      sessions.add_session(session_key.as_bytes(), from_peer)
                                          .map_err(|e| io::Error::other(format!("Key derivation: {e}")))?;
                                      if !json {
                                          output::color::success(&format!("Secure session with peer {}", from_peer));
                                      }
                                  }
                                  _ => {
                                      tracing::debug!("Ignoring inner message type from peer {}", from_peer);
                                  }
                              }
                          }
                      }
                      Some(Message::PeerJoinedRoom { peer_id }) => {
                          if !json {
                              output::color::info(&format!("Peer {} joined the room.", peer_id));
                          }
                          // Initiate handshake if we have the lower ID
                          if my_peer_id < peer_id {
                              let session_key = multi_sender_handshake(
                                  &code_phrase, &room_id, my_peer_id, peer_id,
                                  &mut codec, &mut encode_buf, &mut recv_buf, &mut channel,
                              ).await?;
                              sessions.add_session(session_key.as_bytes(), peer_id)
                                  .map_err(|e| io::Error::other(format!("Key derivation: {e}")))?;
                              if !json {
                                  output::color::success(&format!("Secure session with peer {}", peer_id));
                              }
                          }
                          // If we have the higher ID, we wait for their HandshakeInit via Targeted
                      }
                      Some(Message::PeerLeftRoom { peer_id }) => {
                          sessions.remove_session(peer_id);
                          if !json {
                              output::color::info(&format!("Peer {} left the room.", peer_id));
                          }
                      }
                      Some(Message::Ping) => {
                          encode_and_send(&Message::Pong, &mut codec, &mut encode_buf, &mut channel).await?;
                      }
                      _ => {}
                  }
              }
          }
      }

      channel.close().await;
      Ok(())
  }
  ```

  3. Implement the targeted handshake helpers. These wrap existing `SenderHandshake`/`ReceiverHandshake` but route messages through `Targeted` envelopes:

  ```rust
  /// Perform KEM handshake as initiator, routing via Targeted messages
  async fn multi_sender_handshake(
      code_phrase: &str,
      room_id: &[u8; 32],
      my_peer_id: u8,
      their_peer_id: u8,
      codec: &mut TallowCodec,
      encode_buf: &mut BytesMut,
      recv_buf: &mut [u8],
      channel: &mut tallow_net::transport::ConnectionResult,
  ) -> io::Result<tallow_protocol::kex::SessionKey> {
      let mut handshake = tallow_protocol::kex::SenderHandshake::new(code_phrase, room_id);

      // Step 1: Send HandshakeInit -> targeted to their_peer_id
      let init_msg = handshake.init()
          .map_err(|e| io::Error::other(format!("handshake init: {e}")))?;
      let init_bytes = postcard::to_stdvec(&init_msg)
          .map_err(|e| io::Error::other(format!("encode init: {e}")))?;
      let targeted = Message::Targeted {
          from_peer: my_peer_id,
          to_peer: their_peer_id,
          payload: init_bytes,
      };
      encode_and_send(&targeted, codec, encode_buf, channel).await?;

      // Step 2: Wait for HandshakeResponse from their_peer_id
      // (loop until we get a Targeted from the right peer with the right inner type)
      let (selected_kem, cpace_public, kem_public_key, nonce) = loop {
          let n = tokio::time::timeout(
              std::time::Duration::from_secs(30),
              channel.receive_message(recv_buf),
          ).await
          .map_err(|_| io::Error::other("handshake timeout"))?
          .map_err(|e| io::Error::other(format!("recv: {e}")))?;

          let mut db = BytesMut::from(&recv_buf[..n]);
          let msg = codec.decode_msg(&mut db)
              .map_err(|e| io::Error::other(format!("decode: {e}")))?;

          if let Some(Message::Targeted { from_peer, payload, .. }) = msg {
              if from_peer == their_peer_id {
                  if let Ok(inner) = postcard::from_bytes::<Message>(&payload) {
                      if let Message::HandshakeResponse { selected_kem, cpace_public, kem_public_key, nonce } = inner {
                          break (selected_kem, cpace_public, kem_public_key, nonce);
                      }
                  }
              }
          }
          // Ignore non-matching messages (could be from other peers)
      };

      // Step 3: Process response -> HandshakeKem
      let (kem_msg, session_key) = handshake
          .process_response(selected_kem, &cpace_public, &kem_public_key, &nonce)
          .map_err(|e| io::Error::other(format!("handshake response: {e}")))?;
      let kem_bytes = postcard::to_stdvec(&kem_msg)
          .map_err(|e| io::Error::other(format!("encode kem: {e}")))?;
      let targeted = Message::Targeted {
          from_peer: my_peer_id,
          to_peer: their_peer_id,
          payload: kem_bytes,
      };
      encode_and_send(&targeted, codec, encode_buf, channel).await?;

      // Step 4: Wait for HandshakeComplete
      let confirmation = loop {
          let n = tokio::time::timeout(
              std::time::Duration::from_secs(30),
              channel.receive_message(recv_buf),
          ).await
          .map_err(|_| io::Error::other("handshake timeout"))?
          .map_err(|e| io::Error::other(format!("recv: {e}")))?;

          let mut db = BytesMut::from(&recv_buf[..n]);
          let msg = codec.decode_msg(&mut db)
              .map_err(|e| io::Error::other(format!("decode: {e}")))?;

          if let Some(Message::Targeted { from_peer, payload, .. }) = msg {
              if from_peer == their_peer_id {
                  if let Ok(Message::HandshakeComplete { confirmation }) = postcard::from_bytes::<Message>(&payload) {
                      break confirmation;
                  }
              }
          }
      };

      handshake.verify_receiver_confirmation(&confirmation)
          .map_err(|e| io::Error::other(format!("key confirmation: {e}")))?;

      Ok(session_key)
  }
  ```

  Similarly implement `multi_receiver_handshake` and `handle_incoming_handshake` following the same pattern but using `ReceiverHandshake`.

  **Important implementation note:** The multi-peer handshake helpers need to deal with interleaved messages from multiple peers. During handshake with peer X, messages from peer Y may arrive. These must be buffered or re-queued. The simplest approach for v1: use a `VecDeque<(u8, Vec<u8>)>` as a message buffer. When waiting for a specific peer's handshake response, buffer messages from other peers. After handshake completes, drain the buffer into the main chat loop. This buffering logic should be implemented as a helper struct `MessageBuffer`.

  4. **Connection establishment:** The multi-peer join needs to send `RoomJoinMulti` instead of `RoomJoin`. However, the current `RelayClient` API sends `RoomJoin` internally during `connect()`. For Phase 19, the client must send the join message manually after establishing the QUIC connection. Examine `tallow_net::relay::RelayClient` to determine if it supports sending a raw message, or if we need to work at a lower level. If `RelayClient::connect()` is too opaque, the multi-peer code path should use `tallow_net::transport::establish_relay_connection()` or similar lower-level API and send the `RoomJoinMulti` message directly over the QUIC stream.

  **Pragmatic approach:** Create a new method `RelayClient::connect_multi()` in `crates/tallow-net/src/relay/mod.rs` (or `client.rs`) that sends `RoomJoinMulti` instead of `RoomJoin`, and returns the peer_id + existing_peers from the `RoomJoinedMulti` response. This keeps the network layer clean.

- **Verification:**
  ```
  cargo build -p tallow
  cargo clippy -p tallow -- -D warnings
  ```

#### Task 4.3: Add RelayClient Multi-Peer Connect Method

- **Files to modify:** `crates/tallow-net/src/relay/client.rs` (or wherever `RelayClient` is defined)
- **Files to create:** None
- **What to do:**

  1. Add a `connect_multi` method to `RelayClient` that:
     - Establishes the QUIC connection (same as `connect`)
     - Sends a postcard-encoded `RoomJoinMulti` message (length-prefixed)
     - Reads the `RoomJoinedMulti` response
     - Returns `(peer_id: u8, existing_peers: Vec<u8>)`

  2. The method signature:

  ```rust
  /// Connect to relay for a multi-peer room.
  /// Returns (my_peer_id, existing_peer_ids).
  pub async fn connect_multi(
      &mut self,
      room_id: &[u8; 32],
      password_hash: Option<&[u8; 32]>,
      requested_capacity: u8,
  ) -> Result<(u8, Vec<u8>), RelayError> {
      // ... QUIC connection + RoomJoinMulti + parse RoomJoinedMulti ...
  }
  ```

  3. This requires `tallow-protocol` as a dependency of `tallow-net` for the `Message` type. Check if it already exists; if not, this creates a circular dependency (tallow-protocol depends on tallow-net). If circular, the solution is to have the relay client work with raw bytes: serialize the `RoomJoinMulti` in the caller (`tallow` binary crate) and pass raw bytes to a lower-level send method. Alternatively, define a standalone `connect_multi_raw` that takes pre-serialized bytes.

  **Best approach to avoid circular deps:** Keep the serialization in the `tallow` binary crate. Add a method to `RelayClient` that:
  - Accepts raw bytes for the join message
  - Reads raw bytes for the response
  - Returns the raw response bytes

  ```rust
  /// Send a raw join message and receive the raw response.
  /// Used by multi-peer mode where the caller handles serialization.
  pub async fn connect_raw(
      &mut self,
      join_message: &[u8],
  ) -> Result<Vec<u8>, RelayError> { ... }
  ```

  The `tallow` binary crate then handles postcard serialization/deserialization of `RoomJoinMulti`/`RoomJoinedMulti`.

- **Verification:**
  ```
  cargo build -p tallow-net
  cargo build -p tallow
  cargo clippy --workspace -- -D warnings
  ```

---

### Wave 5: Integration Testing + Cleanup (depends on Wave 4)

#### Task 5.1: Add Integration Tests for Multi-Peer Wire Protocol

- **Files to modify:** `crates/tallow-protocol/src/wire/messages.rs` (add tests)
- **Files to create:** None
- **What to do:**

  1. Add a test that encodes `Targeted` with an inner `ChatText`, decodes back, and verifies the structure:

  ```rust
  #[test]
  fn test_targeted_with_inner_chat_text() {
      let inner = Message::ChatText {
          message_id: [0xAA; 16],
          sequence: 5,
          ciphertext: vec![0xDE, 0xAD, 0xBE, 0xEF],
          nonce: [0xBB; 12],
      };
      let inner_bytes = postcard::to_stdvec(&inner).unwrap();

      let targeted = Message::Targeted {
          from_peer: 0,
          to_peer: 1,
          payload: inner_bytes.clone(),
      };

      let encoded = postcard::to_stdvec(&targeted).unwrap();
      let decoded: Message = postcard::from_bytes(&encoded).unwrap();

      if let Message::Targeted { from_peer, to_peer, payload } = decoded {
          assert_eq!(from_peer, 0);
          assert_eq!(to_peer, 1);
          let inner_decoded: Message = postcard::from_bytes(&payload).unwrap();
          assert_eq!(inner_decoded, inner);
      } else {
          panic!("Expected Targeted");
      }
  }
  ```

  2. Add a test verifying that old variants still decode correctly after the new variants are added (backward compat):

  ```rust
  #[test]
  fn test_old_variants_stable_after_phase19() {
      // Encode all pre-Phase-19 variants and verify they round-trip
      let old_messages = vec![
          Message::Ping,
          Message::Pong,
          Message::RoomJoin { room_id: vec![0; 32], password_hash: None },
          Message::ChatEnd,
      ];
      for msg in &old_messages {
          let bytes = postcard::to_stdvec(msg).unwrap();
          let decoded: Message = postcard::from_bytes(&bytes).unwrap();
          assert_eq!(&decoded, msg);
      }
  }
  ```

- **Verification:**
  ```
  cargo test -p tallow-protocol
  ```

#### Task 5.2: Add Multi-Peer Crypto Integration Test

- **Files to modify:** `crates/tallow-protocol/src/multi.rs` (add test)
- **Files to create:** None
- **What to do:**

  1. Add a test simulating 4 peers, each deriving pairwise keys with each other, encrypting a message, and verifying cross-decryption:

  ```rust
  #[test]
  fn test_four_peer_pairwise_encrypt_decrypt() {
      // Simulate 4 peers (IDs 0, 1, 2, 3), each with session keys to all others
      let session_keys: Vec<[u8; 32]> = (0..6).map(|i| [i as u8 + 1; 32]).collect();
      // Pairs: (0,1), (0,2), (0,3), (1,2), (1,3), (2,3)
      let pairs = vec![(0u8,1u8), (0,2), (0,3), (1,2), (1,3), (2,3)];

      for (idx, (a, b)) in pairs.iter().enumerate() {
          let key = &session_keys[idx];
          let session_a = derive_peer_keys(key, *a, *b).unwrap();
          let session_b = derive_peer_keys(key, *b, *a).unwrap();

          // A encrypts to B
          let mut nonce = [0u8; 12];
          nonce[4..12].copy_from_slice(&0u64.to_be_bytes());
          let ct = tallow_crypto::symmetric::aes_encrypt(
              session_a.send_key(), &nonce, b"hello from A", b"tallow-chat-v1",
          ).unwrap();

          // B decrypts from A
          let pt = tallow_crypto::symmetric::aes_decrypt(
              session_b.recv_key(), &nonce, &ct, b"tallow-chat-v1",
          ).unwrap();
          assert_eq!(pt, b"hello from A");

          // B encrypts to A
          let ct2 = tallow_crypto::symmetric::aes_encrypt(
              session_b.send_key(), &nonce, b"hello from B", b"tallow-chat-v1",
          ).unwrap();

          // A decrypts from B
          let pt2 = tallow_crypto::symmetric::aes_decrypt(
              session_a.recv_key(), &nonce, &ct2, b"tallow-chat-v1",
          ).unwrap();
          assert_eq!(pt2, b"hello from B");
      }
  }

  #[test]
  fn test_same_plaintext_different_ciphertext_across_peers() {
      // Sending "hello" to peers 1 and 2 must produce different ciphertexts
      // because the keys are different
      let session_key_01 = [1u8; 32];
      let session_key_02 = [2u8; 32];

      let s1 = derive_peer_keys(&session_key_01, 0, 1).unwrap();
      let s2 = derive_peer_keys(&session_key_02, 0, 2).unwrap();

      let mut nonce = [0u8; 12];
      let ct1 = tallow_crypto::symmetric::aes_encrypt(
          s1.send_key(), &nonce, b"hello", b"tallow-chat-v1",
      ).unwrap();
      let ct2 = tallow_crypto::symmetric::aes_encrypt(
          s2.send_key(), &nonce, b"hello", b"tallow-chat-v1",
      ).unwrap();

      assert_ne!(ct1, ct2, "Same plaintext to different peers must produce different ciphertext");
  }
  ```

- **Verification:**
  ```
  cargo test -p tallow-protocol multi
  ```

#### Task 5.3: Full Workspace Build + Test + Clippy Verification

- **Files to modify:** None
- **Files to create:** None
- **What to do:**

  1. Run the full verification suite to ensure nothing is broken:

  ```
  cargo fmt --check
  cargo clippy --workspace -- -D warnings
  cargo test --workspace
  cargo build -p tallow-relay
  cargo build -p tallow
  ```

  2. Verify that the existing test count has not decreased. Before Phase 19, there were 598+ tests.

  3. Specifically verify existing 2-peer tests still pass:
  ```
  cargo test -p tallow-relay test_room_manager
  cargo test -p tallow-protocol test_message_roundtrip
  cargo test -p tallow-protocol test_kem_handshake
  ```

- **Verification:**
  All commands above must exit 0 with no warnings.

---

## Deferred to Future Phases

- **Multi-peer file transfer** (file-key pattern, relay broadcast of encrypted chunks)
- **Group verification UX** (per-pair safety numbers are functional but tedious for N peers)
- **TUI integration** for multi-peer chat (ratatui panel showing peer list + chat)
- **Room persistence/reconnection** (rejoin after disconnect)
- **Migrating `tallow send/receive` to use `RoomJoinMulti` with capacity=2**

## Verification Checklist

1. `cargo fmt --check` -- passes
2. `cargo clippy --workspace -- -D warnings` -- passes
3. `cargo test --workspace` -- all tests pass, count >= 598 + new tests
4. `cargo build -p tallow-relay` -- builds successfully
5. `cargo build -p tallow` -- builds successfully
6. Existing 2-peer `tallow send`/`tallow receive`/`tallow chat` continue to work (tested by existing test suite + manual verification)
7. New `Message` variants round-trip through postcard
8. `ChatEnd` discriminant remains 30 (stability test)
9. `MultiRoom` unit tests pass (add/remove/full/cleanup)
10. `PeerSession` key derivation is symmetric (Alice's send = Bob's recv)
11. Same plaintext to different peers produces different ciphertext
