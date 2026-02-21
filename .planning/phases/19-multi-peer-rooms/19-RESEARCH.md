# Phase 19: Multi-Peer Rooms - Research

**Researched:** 2026-02-20
**Domain:** Multi-peer encrypted group communication, group key agreement, relay fan-out architecture
**Confidence:** HIGH

## Summary

Phase 19 extends Tallow from exactly 2 peers per room to N peers (3+), enabling group file transfers and group chat. The current architecture is deeply pairwise: the relay `Room` struct has `peer_a: Option<RoomPeer>` and `peer_b: Option<RoomPeer>`, the KEM handshake is a 4-message exchange between sender and receiver, and chat nonce management uses even/odd counter splitting that only works for 2 peers.

The core architectural decision is **how to establish shared encryption keys among N peers**. After researching MLS (RFC 9420, TreeKEM), Signal Sender Keys, and pairwise session approaches, the recommendation is: **use pairwise KEM handshakes with per-pair session keys and HKDF-derived per-direction encryption keys, NOT a shared group key**. This avoids the complexity of group key agreement protocols (MLS is massive -- OpenMLS is ~50K lines) while remaining secure for Tallow's target of small groups (2-10 peers). Each peer performs a pairwise KEM handshake with every other peer upon joining. Messages are encrypted per-recipient (the sender encrypts N-1 copies for chat, or the relay fans out already-encrypted-per-recipient chunks for file transfer). This is the same approach Signal used for group messaging before Sender Keys, and it is sound for groups under ~50 members.

For the relay, the `Room` struct changes from `(Option<peer_a>, Option<peer_b>)` to `Vec<RoomPeer>` with a configurable capacity (default: 10). The relay continues to be content-agnostic -- it receives a message from one peer along with a target peer ID (or "all" for broadcast) and forwards it. Fan-out is relay-side: the relay copies the encrypted bytes to each target peer's mpsc channel. The relay never decrypts anything.

**Primary recommendation:** Pairwise KEM handshakes between all peer pairs, per-pair AES-256-GCM keys derived via HKDF with peer IDs in the info field, relay-side fan-out with per-peer mpsc channels (not tokio::broadcast), peer IDs assigned by the relay on join, and presence notifications for join/leave events.

## Standard Stack

### Core (Already in Workspace)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tallow-protocol::kex` | workspace | SenderHandshake/ReceiverHandshake | Reuse for each pairwise handshake -- already has KEM + CPace |
| `tallow-protocol::wire` | workspace | Message enum | Extend with multi-peer variants (RoomJoinMulti, PeerList, etc.) |
| `tallow-protocol::chat::encrypt` | workspace | AES-256-GCM chat encryption | Reuse per-pair with derived keys |
| `tallow-crypto::kdf::hkdf` | workspace | HKDF-SHA256 key derivation | Derive per-pair encryption keys from session key + peer IDs |
| `tallow-relay::room` | workspace | RoomManager with DashMap | Extend Room from 2-peer to N-peer |
| `dashmap` | 6.x | Concurrent room storage | Already used by relay, handles concurrent peer joins |
| `tokio::sync::mpsc` | 1.x | Per-peer message channels | Already used, one channel per peer in room |
| `rand` | 0.8+ | Peer ID generation | Already a dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tokio::sync::Notify` | 1.x | Peer join notification | Wake waiting peers when new peer arrives |
| `postcard` | 1.x | Wire serialization | Already the codec, for new message variants |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pairwise KEM handshakes | OpenMLS (MLS/TreeKEM) | MLS provides O(log N) group key updates vs O(N) pairwise, but adds ~50K lines of dependency, requires a Delivery Service abstraction, and is massively over-engineered for groups of 2-10 peers. Pairwise is simpler, uses existing KEM code, and is provably correct for small N. |
| Pairwise KEM handshakes | Sender Keys (Signal-style) | Sender Keys reduce message encryption from N-1 to 1 per send, but sacrifice forward secrecy on compromise and require O(N^2) auxiliary messages on membership change. For ephemeral transfer sessions, the per-session forward secrecy from KEM handshakes is more valuable. |
| Per-peer mpsc channels | tokio::broadcast channel | Broadcast is simpler (one send fans out to all), but has no backpressure (drops old messages when lagging), messages are cloned on demand per receiver (same cost as mpsc), and Tallow needs targeted messaging (to specific peer, not all). mpsc per-peer gives explicit per-peer backpressure and targeted delivery. |
| Relay-side fan-out (relay copies bytes) | Client-side fan-out (sender encrypts and sends N-1 copies) | Client-side fan-out multiplies sender bandwidth by N-1. For file transfer, this is prohibitive (sending a 1GB file to 9 peers = 9GB upload). Relay-side fan-out means sender uploads once, relay copies to each recipient. Since content is E2E encrypted, relay-side fan-out of the same ciphertext is secure IF all recipients can decrypt it -- which requires either a shared key (complex) or per-recipient encryption (the sender encrypts once per recipient, relay routes each to the correct peer). |

## Architecture Patterns

### Recommended Module Changes

```
crates/tallow-relay/src/
  room.rs              # MAJOR REWRITE: Room from (peer_a, peer_b) to Vec<RoomPeer> with capacity
  server.rs            # MODIFY: Handle multi-peer join, fan-out routing, peer IDs

crates/tallow-protocol/src/
  wire/messages.rs     # ADD: MultiPeerJoin, PeerList, PeerJoined, PeerLeft, TargetedMessage variants
  room/multi.rs        # NEW: Multi-peer room logic, peer ID assignment, handshake orchestration
  kex.rs               # MINOR: No changes needed -- pairwise handshakes are reused as-is

crates/tallow/src/
  commands/chat.rs     # MODIFY: Support N peers in chat loop (recv from any, send to all)
  commands/send.rs     # MODIFY: Multi-peer file send (one file to all peers in room)
```

### Pattern 1: Pairwise KEM Handshake Mesh

**What:** When a new peer joins a room with K existing peers, it performs K pairwise KEM handshakes -- one with each existing peer. Each handshake produces an independent session key. The joining peer and each existing peer both derive a per-direction encryption key from the pairwise session key using HKDF with the peer IDs as info.

**When to use:** Always, for all multi-peer rooms.

**Why not a shared group key:** A shared group key has a critical nonce management problem. With AES-256-GCM, each (key, nonce) pair must be globally unique. With 2 peers, even/odd splitting works. With N peers, you'd need to partition the nonce space into N ranges -- possible but fragile. Per-pair keys eliminate this entirely: each pair has its own key, and the even/odd counter split works for each pair independently.

**Example:**
```rust
/// Per-pair session state
struct PeerSession {
    /// Peer's relay-assigned ID
    peer_id: u8,
    /// AES-256-GCM key for encrypting messages TO this peer
    send_key: [u8; 32],
    /// AES-256-GCM key for decrypting messages FROM this peer
    recv_key: [u8; 32],
    /// Nonce counter for sending (increments by 1, no split needed -- unique key per direction)
    send_nonce: u64,
}

/// Derive directional keys from pairwise session key
fn derive_peer_keys(
    session_key: &[u8; 32],
    my_peer_id: u8,
    their_peer_id: u8,
) -> ([u8; 32], [u8; 32]) {
    // Deterministic ordering: lower ID's send_key = higher ID's recv_key
    let (id_a, id_b) = if my_peer_id < their_peer_id {
        (my_peer_id, their_peer_id)
    } else {
        (their_peer_id, my_peer_id)
    };

    let info_ab = format!("tallow-peer-key-{}-to-{}", id_a, id_b);
    let info_ba = format!("tallow-peer-key-{}-to-{}", id_b, id_a);

    let key_a_to_b = tallow_crypto::kdf::hkdf::derive(
        &[0u8; 32], // salt
        session_key,
        info_ab.as_bytes(),
        32,
    ).unwrap();

    let key_b_to_a = tallow_crypto::kdf::hkdf::derive(
        &[0u8; 32],
        session_key,
        info_ba.as_bytes(),
        32,
    ).unwrap();

    let mut k_ab = [0u8; 32];
    let mut k_ba = [0u8; 32];
    k_ab.copy_from_slice(&key_a_to_b);
    k_ba.copy_from_slice(&key_b_to_a);

    if my_peer_id < their_peer_id {
        (k_ab, k_ba) // my send_key = a_to_b, my recv_key = b_to_a
    } else {
        (k_ba, k_ab) // my send_key = b_to_a, my recv_key = a_to_b
    }
}
```

### Pattern 2: Relay-Side Fan-Out with Peer IDs

**What:** The relay assigns each peer a sequential u8 ID (0, 1, 2, ...) upon joining the room. Messages from clients include a `target` field: either a specific peer ID or `0xFF` for broadcast. The relay reads the target from the message header (first byte after the length prefix) and forwards to the targeted peer(s). The relay never decrypts the payload.

**When to use:** All relay routing in multi-peer rooms.

**Example:**
```rust
// Relay-side room structure (replaces current Room)
struct MultiRoom {
    /// Peers in the room, indexed by peer_id (0..capacity)
    peers: Vec<Option<RoomPeer>>,
    /// Maximum number of peers allowed
    capacity: u8,
    /// Next peer ID to assign
    next_peer_id: u8,
    /// Last activity timestamp
    last_activity: Instant,
}

impl MultiRoom {
    fn new(capacity: u8) -> Self {
        Self {
            peers: Vec::with_capacity(capacity as usize),
            capacity,
            next_peer_id: 0,
            last_activity: Instant::now(),
        }
    }

    /// Add a peer, return their assigned ID
    fn add_peer(&mut self, peer: RoomPeer) -> Result<u8, RoomError> {
        if self.peers.iter().filter(|p| p.is_some()).count() >= self.capacity as usize {
            return Err(RoomError::RoomFull);
        }
        let id = self.next_peer_id;
        self.next_peer_id += 1;
        // Extend vec if needed, then insert
        while self.peers.len() <= id as usize {
            self.peers.push(None);
        }
        self.peers[id as usize] = Some(peer);
        self.last_activity = Instant::now();
        Ok(id)
    }

    /// Fan-out: send to all peers except the sender
    async fn broadcast(&self, from_id: u8, data: &[u8]) {
        for (id, peer) in self.peers.iter().enumerate() {
            if id as u8 != from_id {
                if let Some(ref p) = peer {
                    let _ = p.sender.send(data.to_vec()).await;
                }
            }
        }
    }

    /// Send to a specific peer
    async fn send_to(&self, target_id: u8, data: &[u8]) -> bool {
        if let Some(Some(ref peer)) = self.peers.get(target_id as usize) {
            peer.sender.send(data.to_vec()).await.is_ok()
        } else {
            false
        }
    }
}
```

### Pattern 3: Wire Protocol Extensions

**What:** New `Message` variants for multi-peer room operations. These are appended to the existing enum (postcard uses varint discriminants, so appending new variants is backward compatible as long as old code never encounters new variant discriminants).

**When to use:** Wire protocol changes for Phase 19.

**Important postcard compatibility note:** Postcard encodes enum variants by ordinal position (0-indexed varint). Adding new variants at the END of the `Message` enum is safe -- old clients will fail to decode unknown discriminants but won't silently misinterpret data. Inserting variants in the middle would break all existing message parsing.

**Example:**
```rust
// NEW variants to append to Message enum

/// Multi-peer room join request (extends RoomJoin)
RoomJoinMulti {
    room_id: Vec<u8>,
    password_hash: Option<Vec<u8>>,
    /// Requested room capacity (0 = use server default)
    requested_capacity: u8,
},
/// Room joined response with peer ID assignment
RoomJoinedMulti {
    /// This peer's assigned ID in the room
    peer_id: u8,
    /// List of already-present peer IDs
    existing_peers: Vec<u8>,
},
/// A new peer has joined the room
PeerJoinedRoom {
    /// The new peer's assigned ID
    peer_id: u8,
},
/// A peer has left the room
PeerLeftRoom {
    /// The departing peer's ID
    peer_id: u8,
},
/// Targeted message envelope (wraps any payload)
/// The relay reads target to route; payload is opaque E2E encrypted bytes
Targeted {
    /// Sender's peer ID (set by relay, not trusted from client)
    from_peer: u8,
    /// Target peer ID (0xFF = broadcast to all)
    to_peer: u8,
    /// Opaque payload (E2E encrypted message bytes)
    payload: Vec<u8>,
},
/// Room peer count query response
PeerCount {
    /// Current number of peers in the room
    count: u8,
    /// Room capacity
    capacity: u8,
},
```

### Pattern 4: Per-Sender Nonce Management (No Collision Risk)

**What:** With pairwise keys, each (sender, recipient) pair has a unique key. Nonces can be simple monotonic counters starting at 0 for each pair, incrementing by 1. No even/odd split needed because the keys are direction-specific (send_key differs from recv_key).

**When to use:** All encryption in multi-peer rooms.

**Why this is safe:** AES-256-GCM requires unique (key, nonce) pairs. With per-direction keys derived via HKDF, each direction has a unique key. Therefore, each direction can independently use counter nonces starting at 0. Even if two peers both send their first message simultaneously, they use different keys, so the (key, 0) pairs are distinct.

### Pattern 5: File Transfer Fan-Out Strategy

**What:** For multi-peer file transfer, the sender encrypts the file with a randomly generated symmetric key (the "file key"), then distributes the file key to each peer encrypted under their pairwise session key. File chunks are encrypted once with the file key and broadcast by the relay to all peers. This is the "encrypt once, distribute key N-1 times" optimization used by Signal for large attachments.

**When to use:** File transfers to multiple peers.

**Why:** Without this, the sender would need to encrypt and upload the entire file N-1 times (one per recipient). With the file key approach, the sender uploads once (encrypted with file key), and distributes only the small file key (32 bytes) N-1 times under pairwise keys. The relay fans out the same encrypted chunks to all recipients.

**Example:**
```rust
/// Generate a random file key, encrypt it per-recipient
fn prepare_group_file_transfer(
    file_key: &[u8; 32],
    peer_sessions: &[PeerSession],
) -> Vec<Message> {
    let mut key_messages = Vec::new();
    for session in peer_sessions {
        // Encrypt the file key under the pairwise send_key
        let mut nonce = [0u8; 12];
        // Use a reserved nonce value (e.g., u64::MAX) for key distribution
        nonce[4..].copy_from_slice(&u64::MAX.to_be_bytes());

        let encrypted_file_key = tallow_crypto::symmetric::aes_encrypt(
            &session.send_key,
            &nonce,
            file_key,
            b"tallow-file-key-v1",
        ).unwrap();

        key_messages.push(Message::Targeted {
            from_peer: 0, // filled by relay
            to_peer: session.peer_id,
            payload: encrypted_file_key,
        });
    }
    key_messages
}
```

### Anti-Patterns to Avoid

- **Don't use a shared group key with AES-256-GCM.** With N peers sharing one key, nonce coordination becomes a nightmare. Even nonce-space partitioning (peer 0 uses 0..2^60, peer 1 uses 2^60..2*2^60) is fragile and error-prone. Per-pair keys with per-direction derivation eliminates the problem entirely.

- **Don't implement MLS/TreeKEM.** It is designed for groups of thousands with ongoing membership changes. Tallow targets ephemeral rooms of 2-10 peers. The complexity of TreeKEM (binary tree state, commit/welcome/proposal messages, epoch tracking) is disproportionate to the benefit for small groups. Pairwise handshakes with existing KEM code is O(N^2) but N is small.

- **Don't use tokio::broadcast for relay fan-out.** It lacks backpressure (drops old messages silently), doesn't support targeted delivery (to specific peer), and provides no per-peer flow control. Per-peer mpsc channels (already used in the current relay) are the right tool.

- **Don't trust the `from_peer` field from the client.** The relay MUST set the `from_peer` field based on which connection the message arrived on. A malicious peer could otherwise spoof messages as coming from another peer.

- **Don't block the room while a new peer handshakes.** When peer 4 joins a room with 3 existing peers, the pairwise handshakes should not block message flow between the existing 3 peers. Use separate per-pair handshake state machines that run concurrently.

- **Don't change postcard enum variant ordering.** New Message variants MUST be appended at the end of the enum. Inserting in the middle shifts all subsequent discriminants and breaks backward compatibility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pairwise KEM handshake | New handshake protocol | `SenderHandshake`/`ReceiverHandshake` from `kex.rs` | Already has KEM + CPace, tested, zeroizes secrets |
| Per-direction key derivation | Custom key splitting | `tallow_crypto::kdf::hkdf::derive()` with peer ID info | HKDF is the standard tool for deriving multiple keys from one secret |
| AES-256-GCM encryption | Custom encrypt/decrypt | `tallow_crypto::symmetric::aes_encrypt/decrypt` | Already tested with AEAD, handles auth tag correctly |
| Message framing | Custom codec | `TallowCodec` from `tallow_protocol::wire::codec` | Length-prefixed postcard framing works for all message types |
| Concurrent room access | Manual locking | `DashMap` (already used by relay) | Handles shard-level locking, avoids deadlocks |
| Group key agreement protocol | Custom MLS/TreeKEM | Pairwise KEM reuse | MLS is 50K+ lines; pairwise reuse is ~100 lines of orchestration |
| Nonce management for N peers | Nonce-space partitioning | Per-pair keys with simple counters | Per-pair keys make nonce collision impossible by construction |
| Message ordering in group | Vector clocks | Per-sender sequence numbers + per-sender display | Vector clocks add O(N) overhead per message; for a relay-mediated system with QUIC ordering, per-sender sequence numbers are sufficient |

**Key insight:** The existing pairwise KEM handshake, AES-256-GCM encryption, and HKDF key derivation are the building blocks. Multi-peer is an orchestration problem (run N-1 handshakes, derive N-1 key pairs), not a new cryptographic protocol.

## Common Pitfalls

### Pitfall 1: Nonce Reuse Across Peer Pairs

**What goes wrong:** Using a single nonce counter shared across all peer pairs causes AES-256-GCM nonce reuse when sending the same message to multiple peers.

**Why it happens:** Developer assumes one counter is simpler than per-peer counters.

**How to avoid:** Each `PeerSession` has its own `send_nonce: u64` counter. When sending a chat message to 4 peers, each encryption uses a different key (per-pair send_key) and independently incremented nonce. The keys are different, so even if nonces collide numerically, the (key, nonce) pairs are unique.

**Warning signs:** Test that sending the same plaintext to 2 peers produces different ciphertexts.

### Pitfall 2: Handshake Race Conditions on Concurrent Join

**What goes wrong:** Two peers join simultaneously and both try to be the "initiator" of their pairwise handshake, sending `HandshakeInit` to each other. Neither expects to receive `HandshakeInit` -- both expect `HandshakeResponse`.

**Why it happens:** The current SenderHandshake/ReceiverHandshake assumes one side is sender (initiator) and the other is receiver (responder). With multiple peers joining, role assignment is ambiguous.

**How to avoid:** Use the relay-assigned peer ID to determine roles: the peer with the LOWER ID is always the handshake initiator (uses `SenderHandshake`), the peer with the HIGHER ID is always the responder (uses `ReceiverHandshake`). This is a deterministic, coordination-free convention.

**Warning signs:** Test where 3 peers join within 100ms of each other and all pairwise handshakes complete.

### Pitfall 3: Relay Memory Exhaustion from Large Rooms

**What goes wrong:** A room with 10 peers means every broadcast message is copied 9 times in memory by the relay. A 256KB file chunk broadcast creates 2.3MB of relay memory pressure per chunk.

**Why it happens:** Fan-out multiplies memory usage linearly with peer count.

**How to avoid:** 1) Cap room capacity (default 10, max 20). 2) Use bounded mpsc channels with backpressure (already used -- `mpsc::channel(256)`). 3) For file transfer, the sender uses the file-key pattern (Pattern 5) so chunks are broadcast once, not encrypted N-1 times. 4) Consider relay memory limits in the config: `max_rooms * max_peers_per_room * channel_capacity * max_message_size` should fit in available RAM. With defaults: `100 rooms * 10 peers * 256 messages * 256KB = 64GB` -- too high. Reduce channel capacity for multi-peer rooms to 32.

**Warning signs:** Monitor relay RSS during a 10-peer room stress test. Should stay under 100MB.

### Pitfall 4: Postcard Enum Variant Ordering Breaks Wire Protocol

**What goes wrong:** New `Message` variants inserted in the middle of the enum shift the varint discriminant of all subsequent variants. A client compiled with the old enum interprets `HandshakeInit` bytes as `RoomJoinMulti`.

**Why it happens:** Postcard uses positional (ordinal) enum discriminants, not string-tagged variants.

**How to avoid:** ALWAYS append new variants at the end of the `Message` enum. Never insert between existing variants. Never reorder variants. Document this constraint with a comment at the top of the enum.

**Warning signs:** A round-trip test with the old and new enum definitions -- old code should fail to decode new variants with an error, not silently misinterpret.

### Pitfall 5: Spoofing Peer Identity via from_peer Field

**What goes wrong:** A malicious peer sets `from_peer: 0` in a `Targeted` message, making it appear to come from peer 0 (the room creator). Other peers trust this and may accept handshake messages or file keys from an impersonator.

**Why it happens:** The relay forwards bytes without inspecting content. If `from_peer` is inside the encrypted payload, the relay can't verify it. If it's outside (in the envelope), a malicious client can set it to any value.

**How to avoid:** The relay MUST overwrite the `from_peer` field based on which connection sent the message. The relay tracks which peer_id corresponds to which QUIC connection. When forwarding, it sets `from_peer` to the sender's actual ID. Clients should NEVER trust `from_peer` set by other clients.

**Warning signs:** Test where a malicious peer sends a message with a spoofed `from_peer` and verify the relay overwrites it.

### Pitfall 6: Late-Joiner Missing Handshakes

**What goes wrong:** Peer 4 joins a room where peers 0, 1, 2 are already exchanging messages. Peer 4 needs to handshake with all 3 existing peers, but peers 0-2 are in the middle of a file transfer and don't respond to handshake messages promptly.

**Why it happens:** The chat/transfer message loop doesn't expect handshake messages after the initial setup.

**How to avoid:** The message loop must handle `HandshakeInit` messages at any time (for new peers joining). When a `PeerJoinedRoom` notification arrives, the existing peer checks if its ID is lower (if so, it initiates a handshake with the new peer). Handshake messages are interleaved with data messages. The `Targeted` envelope allows routing handshake messages to specific peers without disrupting others.

**Warning signs:** Integration test where peer 4 joins mid-transfer and successfully handshakes with all existing peers while the transfer continues.

### Pitfall 7: Channel Capacity Prevents PeerArrived Delivery

**What goes wrong:** When peer_a is the first to join and its mpsc channel fills up while waiting (because the relay sends PeerArrived but the channel is full), the arrival notification is silently dropped.

**Why it happens:** The current relay uses `mpsc::channel(256)` which is bounded. If a peer isn't draining its channel, messages queue up.

**How to avoid:** Use a separate `tokio::sync::Notify` or `tokio::sync::watch` for join/leave events, separate from the data channel. Alternatively, ensure the PeerArrived/PeerJoinedRoom message is always the first message in the channel (which it will be, since the joining peer sends no data until after handshake).

**Warning signs:** Test where peer_a's channel is pre-filled (stress test) and verify PeerArrived still arrives.

## Code Examples

### Relay Room Structure (Multi-Peer)

```rust
// Replaces the current Room struct in tallow-relay/src/room.rs
use tokio::sync::mpsc;
use std::time::Instant;

pub type PeerSender = mpsc::Sender<Vec<u8>>;
pub type PeerReceiver = mpsc::Receiver<Vec<u8>>;

pub struct RoomPeer {
    pub sender: PeerSender,
    pub peer_id: u8,
}

pub struct MultiRoom {
    /// Peers indexed by slot (not necessarily contiguous)
    peers: Vec<Option<RoomPeer>>,
    /// Maximum peers allowed
    capacity: u8,
    /// Next ID to assign (monotonically increasing, never reused in a session)
    next_id: u8,
    /// Last activity
    last_activity: Instant,
}

impl MultiRoom {
    pub fn new(capacity: u8) -> Self {
        Self {
            peers: Vec::with_capacity(capacity as usize),
            capacity,
            next_id: 0,
            last_activity: Instant::now(),
        }
    }

    pub fn add_peer(&mut self, sender: PeerSender) -> Result<(u8, Vec<u8>), RoomError> {
        let active_count = self.peers.iter().filter(|p| p.is_some()).count();
        if active_count >= self.capacity as usize {
            return Err(RoomError::RoomFull);
        }
        let peer_id = self.next_id;
        self.next_id = self.next_id.checked_add(1).ok_or(RoomError::RoomFull)?;

        // Collect existing peer IDs before adding the new one
        let existing: Vec<u8> = self.peers.iter()
            .filter_map(|p| p.as_ref().map(|rp| rp.peer_id))
            .collect();

        // Add new peer
        while self.peers.len() <= peer_id as usize {
            self.peers.push(None);
        }
        self.peers[peer_id as usize] = Some(RoomPeer { sender, peer_id });
        self.last_activity = Instant::now();

        Ok((peer_id, existing))
    }

    pub fn remove_peer(&mut self, peer_id: u8) {
        if let Some(slot) = self.peers.get_mut(peer_id as usize) {
            *slot = None;
        }
    }

    pub fn is_empty(&self) -> bool {
        self.peers.iter().all(|p| p.is_none())
    }

    pub fn peer_count(&self) -> usize {
        self.peers.iter().filter(|p| p.is_some()).count()
    }

    /// Fan-out to all peers except sender
    pub async fn broadcast_from(&self, from_id: u8, data: Vec<u8>) {
        for peer in &self.peers {
            if let Some(ref p) = peer {
                if p.peer_id != from_id {
                    let _ = p.sender.send(data.clone()).await;
                }
            }
        }
    }

    /// Send to a specific peer
    pub async fn send_to(&self, target_id: u8, data: Vec<u8>) -> bool {
        if let Some(Some(ref peer)) = self.peers.get(target_id as usize) {
            peer.sender.send(data).await.is_ok()
        } else {
            false
        }
    }
}
```

### Handshake Orchestration for Joining Peer

```rust
/// When a new peer joins, determine which existing peers to handshake with
/// and in what role (initiator vs responder).
///
/// Convention: lower peer_id = initiator (SenderHandshake)
///             higher peer_id = responder (ReceiverHandshake)
async fn handshake_with_existing_peers(
    my_peer_id: u8,
    existing_peer_ids: &[u8],
    code_phrase: &str,
    room_id: &[u8; 32],
    channel: &mut ConnectionResult,
    codec: &mut TallowCodec,
) -> io::Result<HashMap<u8, PeerSession>> {
    let mut sessions = HashMap::new();

    for &peer_id in existing_peer_ids {
        let session_key = if my_peer_id < peer_id {
            // I'm initiator (lower ID)
            sender_handshake_targeted(code_phrase, room_id, peer_id, channel, codec).await?
        } else {
            // I'm responder (higher ID)
            receiver_handshake_targeted(code_phrase, room_id, peer_id, channel, codec).await?
        };

        let (send_key, recv_key) = derive_peer_keys(
            session_key.as_bytes(), my_peer_id, peer_id
        );

        sessions.insert(peer_id, PeerSession {
            peer_id,
            send_key,
            recv_key,
            send_nonce: 0,
        });
    }

    Ok(sessions)
}
```

### Multi-Peer Chat Message Loop

```rust
/// Extended chat loop that handles N peers
async fn run_multi_peer_chat(
    my_peer_id: u8,
    sessions: &mut HashMap<u8, PeerSession>,
    channel: &mut ConnectionResult,
    codec: &mut TallowCodec,
    json: bool,
) -> io::Result<()> {
    let stdin = tokio::io::stdin();
    let reader = tokio::io::BufReader::new(stdin);
    let mut lines = reader.lines();
    let mut recv_buf = vec![0u8; 256 * 1024];
    let mut encode_buf = BytesMut::new();
    let mut sequence: u64 = 0;

    loop {
        tokio::select! {
            line = lines.next_line() => {
                match line? {
                    Some(text) if text.trim() == "/quit" => {
                        // Send ChatEnd to all peers
                        for (peer_id, _session) in sessions.iter() {
                            let msg = Message::Targeted {
                                from_peer: my_peer_id,
                                to_peer: *peer_id,
                                payload: postcard::to_stdvec(&Message::ChatEnd).unwrap(),
                            };
                            encode_and_send(&msg, codec, &mut encode_buf, channel).await?;
                        }
                        break;
                    }
                    Some(text) if !text.trim().is_empty() => {
                        // Encrypt and send to each peer with their pairwise key
                        for (_peer_id, session) in sessions.iter_mut() {
                            let (ciphertext, nonce) = encrypt_chat_text(
                                &text, &session.send_key, &mut session.send_nonce,
                            ).map_err(|e| io::Error::other(format!("Encrypt: {e}")))?;

                            let chat_msg = Message::ChatText {
                                message_id: rand::random(),
                                sequence,
                                ciphertext,
                                nonce,
                            };

                            let inner_bytes = postcard::to_stdvec(&chat_msg)
                                .map_err(|e| io::Error::other(format!("Encode: {e}")))?;

                            let targeted = Message::Targeted {
                                from_peer: my_peer_id,
                                to_peer: session.peer_id,
                                payload: inner_bytes,
                            };
                            encode_and_send(&targeted, codec, &mut encode_buf, channel).await?;
                        }
                        sequence += 1;
                        // Display locally
                        output::color::info(&format!("You: {}", text));
                    }
                    _ => {}
                }
            }
            recv = channel.receive_message(&mut recv_buf) => {
                let n = recv.map_err(|e| io::Error::other(format!("recv: {e}")))?;
                let mut decode_buf = BytesMut::from(&recv_buf[..n]);
                let msg = codec.decode_msg(&mut decode_buf)
                    .map_err(|e| io::Error::other(format!("decode: {e}")))?;

                match msg {
                    Some(Message::Targeted { from_peer, payload, .. }) => {
                        // Decrypt with the pairwise recv_key for from_peer
                        if let Some(session) = sessions.get(&from_peer) {
                            let inner: Message = postcard::from_bytes(&payload)
                                .map_err(|e| io::Error::other(format!("decode inner: {e}")))?;
                            match inner {
                                Message::ChatText { ciphertext, nonce, .. } => {
                                    match decrypt_chat_text(&ciphertext, &nonce, &session.recv_key) {
                                        Ok(text) => {
                                            output::color::success(
                                                &format!("Peer {}: {}", from_peer, text)
                                            );
                                        }
                                        Err(e) => {
                                            tracing::warn!("Decrypt from peer {} failed: {}", from_peer, e);
                                        }
                                    }
                                }
                                Message::ChatEnd => {
                                    output::color::info(&format!("Peer {} left the chat.", from_peer));
                                }
                                _ => {}
                            }
                        }
                    }
                    Some(Message::PeerJoinedRoom { peer_id }) => {
                        output::color::info(&format!("Peer {} joined the room.", peer_id));
                        // Initiate pairwise handshake if needed
                    }
                    Some(Message::PeerLeftRoom { peer_id }) => {
                        output::color::info(&format!("Peer {} left the room.", peer_id));
                        sessions.remove(&peer_id);
                    }
                    _ => {}
                }
            }
        }
    }
    Ok(())
}
```

### Backward Compatibility with 2-Peer Rooms

```rust
// The existing RoomJoin message still works for 2-peer rooms.
// The relay checks the message type:
// - RoomJoin -> legacy 2-peer room (existing behavior, unchanged)
// - RoomJoinMulti -> multi-peer room (new behavior)
//
// This ensures existing clients (tallow send/receive) continue to work
// without modification. Multi-peer mode is opt-in via new message variants.

match msg {
    Message::RoomJoin { room_id, password_hash } => {
        // Legacy 2-peer room handling (unchanged from current code)
        handle_legacy_room_join(room_id, password_hash, connection).await
    }
    Message::RoomJoinMulti { room_id, password_hash, requested_capacity } => {
        // New multi-peer room handling
        handle_multi_room_join(room_id, password_hash, requested_capacity, connection).await
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shared group key (single key for all peers) | Pairwise session keys (per-pair keys) | Standard practice in Signal, WhatsApp | Eliminates nonce coordination, simpler security analysis |
| MLS/TreeKEM for all group sizes | MLS for large groups (100+), pairwise for small (<50) | Ongoing consensus | Small groups don't benefit from logarithmic scaling |
| Client-side fan-out (sender uploads N times) | Relay-side fan-out + file key distribution | Signal large attachments, WhatsApp media | Reduces sender bandwidth by factor of N-1 |
| Random nonces for multi-peer AES-GCM | Per-direction keys with counter nonces | Best practice since TLS 1.3 | Eliminates birthday-bound nonce collision risk |

**Why not MLS for Tallow:**
- OpenMLS is ~50K lines of code, massive dependency
- Requires a Delivery Service abstraction that doesn't map to Tallow's relay model
- Designed for persistent groups with ongoing membership changes; Tallow rooms are ephemeral
- TreeKEM's O(log N) advantage over O(N) pairwise is negligible for N < 20
- MLS's Commit/Welcome/Proposal state machine adds enormous complexity
- Post-quantum MLS extensions are still experimental (not RFC)

## Open Questions

1. **Should existing 2-peer transfers use the new multi-peer room system?**
   - What we know: Backward compatibility is important. The relay must support both RoomJoin (legacy 2-peer) and RoomJoinMulti (new N-peer).
   - What's unclear: Whether to migrate `tallow send/receive` to use RoomJoinMulti with capacity=2, or keep them on the legacy path.
   - Recommendation: Keep `tallow send/receive` on the legacy 2-peer path for now. Multi-peer is a new command (`tallow room` or `tallow group`). Migrate send/receive in a future phase after multi-peer is stable.

2. **Maximum room capacity?**
   - What we know: Pairwise handshakes scale as O(N^2). For 10 peers, that's 45 handshakes. For 20 peers, 190 handshakes. Each handshake involves 4 round-trip messages and ML-KEM-1024 operations.
   - What's unclear: Whether 20-peer handshake storms will cause timeouts or relay congestion.
   - Recommendation: Default capacity 10, configurable up to 20. Test with 10 peers; if performance is acceptable, consider 20. Above 20, pairwise becomes impractical and MLS would be warranted.

3. **Chat message fan-out: per-peer encryption or broadcast encryption?**
   - What we know: For chat (short messages), per-peer encryption (encrypt N-1 copies with N-1 different keys) adds negligible overhead. For file transfer, per-peer encryption is prohibitive (N-1 full encryptions of a large file).
   - Recommendation: Chat uses per-peer encryption (each chat message encrypted per-recipient). File transfer uses the file-key pattern (one encryption + N-1 key distributions).

4. **Should the relay understand Targeted message routing or be fully opaque?**
   - What we know: Currently the relay is fully opaque -- it forwards raw bytes. For multi-peer, it needs to know which peer to forward to.
   - Recommendation: Add a 2-byte routing header OUTSIDE the encrypted payload: `[from_peer: u8, to_peer: u8]`. The relay reads these bytes, overwrites `from_peer` with the actual sender ID, and routes accordingly. The rest of the message is opaque encrypted bytes. This is minimal relay involvement -- just routing, no content inspection.

5. **Verification in groups: per-pair safety numbers or group fingerprint?**
   - What we know: With pairwise keys, each pair has a different session key and thus different verification strings. A group of 5 peers would have 10 different verification strings.
   - What's unclear: Whether displaying 10 verification strings is usable.
   - Recommendation: Defer group verification UX to a future phase. For now, each peer can verify pairwise with any other peer using `--verify` (same as current 2-peer behavior). Group-wide verification (e.g., hash of all pairwise session keys) is a nice-to-have but not essential for v1.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** (direct file reads):
  - `tallow-relay/src/room.rs` -- Current 2-peer Room struct with DashMap
  - `tallow-relay/src/server.rs` -- Relay server connection handling, fan-out pattern
  - `tallow-protocol/src/wire/messages.rs` -- Full Message enum (31 variants)
  - `tallow-protocol/src/kex.rs` -- SenderHandshake/ReceiverHandshake, 4-message KEM + CPace
  - `tallow-protocol/src/chat/encrypt.rs` -- AES-256-GCM with even/odd nonce splitting
  - `tallow-protocol/src/room/code.rs` -- Room ID derivation from code phrase
  - `tallow/src/commands/chat.rs` -- Chat command with pairwise handshake + chat loop
  - `tallow/src/commands/send.rs` -- Send pipeline with KEM handshake + chunked transfer

- **RFC 9420 - The Messaging Layer Security (MLS) Protocol** - https://datatracker.ietf.org/doc/rfc9420/ -- MLS architecture, TreeKEM, complexity analysis
- **Tokio broadcast channel docs** - https://docs.rs/tokio/latest/tokio/sync/broadcast/index.html -- No backpressure, clone-on-demand semantics
- **HKDF RFC 5869** - https://datatracker.ietf.org/doc/html/rfc5869 -- Info field for context-specific key derivation

### Secondary (MEDIUM confidence)
- **OpenMLS** - https://github.com/openmls/openmls -- Rust MLS implementation, confirms ~50K LOC
- **Trail of Bits: Better Encrypted Group Chat** - https://blog.trailofbits.com/2019/08/06/better-encrypted-group-chat/ -- O(log N) vs O(N) vs O(N^2) tradeoff analysis
- **Quarkslab: Secure Messaging Group Protocols Part 2** - https://blog.quarkslab.com/secure-messaging-apps-and-group-protocols-part-2.html -- Pairwise vs Sender Keys vs MLS comparison
- **p2panda group encryption** - https://p2panda.org/2025/02/24/group-encryption.html -- DCGKA for small groups, rejected MLS as too complex
- **Signal Private Groups** - https://signal.org/blog/private-groups/ -- Sender Keys architecture, forward secrecy tradeoffs
- **Analyzing Group Chat Encryption** (2025 paper) - https://eprint.iacr.org/2025/554.pdf -- Academic comparison of MLS, Signal, Session, Matrix group encryption

### Tertiary (LOW confidence)
- **Postcard enum variant compatibility** -- Based on understanding of varint discriminant encoding; postcard does not have explicit backward compatibility documentation. The claim "appending is safe" is based on how varint ordinal encoding works, but should be validated with a test.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in workspace, no new dependencies needed
- Architecture (pairwise approach): HIGH - Well-established pattern used by Signal, WhatsApp; directly reuses existing KEM handshake code
- Architecture (relay changes): HIGH - Direct extension of existing Room struct; DashMap and mpsc patterns unchanged
- Pitfalls: HIGH - Derived from deep codebase analysis, known AES-GCM/relay constraints, and multi-peer messaging literature
- Wire protocol changes: MEDIUM - Postcard enum variant ordering claim needs validation with a specific test
- File transfer fan-out: MEDIUM - File-key pattern is well-established (Signal media) but hasn't been implemented in Tallow before; integration with existing SendPipeline needs careful design

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- stable codebase, no external dependency changes expected)
