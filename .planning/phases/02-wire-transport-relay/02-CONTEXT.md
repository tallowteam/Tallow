# Phase 2 Context: Wire Protocol, Transport and Relay

## Phase Goal
A message can be encoded with postcard, sent over QUIC (or TCP+TLS fallback), routed through the relay server, and decoded on the other side.

## Implementation Decisions

### 1. Wire Serialization: postcard replaces bincode
- Replace bincode with postcard throughout all codec paths
- postcard is compact binary, no_std compatible, Serde-based
- Use postcard's length-prefix framing via `postcard::to_stdvec` / `postcard::from_bytes`
- Custom framing: 4-byte big-endian length prefix + postcard payload

### 2. Message Enum Design
- Use `#[serde(tag = "type")]` or integer-discriminant enum for postcard compatibility
- Actually, postcard handles Rust enums natively (variant index + payload) - no special annotation needed
- Keep the existing Message enum structure, just switch serializer

### 3. Version Negotiation
- First message after connection: VersionRequest { supported: Vec<u8> }
- Response: VersionResponse { selected: u8 }
- Current version: 1
- If no overlap, close connection with error

### 4. QUIC Transport (quinn)
- Self-signed TLS cert via rcgen for development/relay
- quinn::Endpoint with server and client configs
- Bidirectional streams for message exchange
- Connection keeps alive with ping/pong

### 5. TCP+TLS Fallback
- tokio::net::TcpStream + tokio_rustls for TLS
- Same framing as QUIC (length-prefixed postcard)
- Used when QUIC is blocked (corporate firewalls)

### 6. Transport Trait
- `async fn connect(&mut self, addr: &str) -> Result<()>`
- `async fn send(&mut self, data: &[u8]) -> Result<()>`
- `async fn receive(&mut self) -> Result<Vec<u8>>`
- `async fn close(&mut self) -> Result<()>`
- QUIC is tried first; on failure, falls back to TCP+TLS

### 7. Relay Server Architecture
- Single-process, async (tokio) server
- DashMap<RoomId, Room> for concurrent room management
- Room: holds two connections (sender + receiver), forwards bytes
- No inspection of payload (zero-knowledge)
- Per-IP rate limiter (already implemented)
- Stale room cleanup via tokio::time::interval

### 8. Room-Based Pairing
- Room ID = BLAKE3 hash of code phrase (from tallow-crypto)
- First connection to room becomes "waiter"
- Second connection triggers pairing notification to both
- Room stays open until transfer completes or timeout

### 9. Memory Budget
- Target: <50MB RSS under 100 concurrent rooms
- Each room: 2 connections + small metadata buffer
- No message buffering (stream-forward mode)
- Relay does NOT store or decrypt any data

### 10. Scope Boundaries
- NAT traversal (STUN/TURN/UPnP) is Phase 5 scope
- mDNS discovery is Phase 5 scope
- Privacy features (DoH, SOCKS5, traffic shaping) are Phase 5 scope
- Chat/signaling client is Phase 5 scope
- This phase: codec + transport + relay only
