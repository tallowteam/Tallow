# Architecture Patterns

**Domain:** Secure P2P file transfer — relay/signaling, QUIC transport, chunked transfer pipeline
**Researched:** 2026-02-19
**Confidence:** HIGH (based on deep codebase analysis of the 7-crate workspace + training knowledge of quinn 0.11, croc, magic-wormhole, WebRTC relay patterns)

---

## Existing Architecture Context

Tallow already has a complete structural skeleton. The architecture is not hypothetical — it is defined and partially implemented. This research focuses on HOW to fill in the `todo!()` bodies correctly within the established boundaries.

### What Is Already Defined (Do Not Redesign)

- 7-crate boundary: `tallow-crypto` (pure) → `tallow-net` (transport) → `tallow-protocol` (orchestration) → `tallow` (CLI)
- `Transport` trait in `crates/tallow-net/src/transport/mod.rs` — connect/send/receive abstraction
- `Message` enum in `crates/tallow-protocol/src/wire/messages.rs` — all wire message types defined
- `TransferStateMachine` in `crates/tallow-protocol/src/transfer/state_machine.rs` — state transitions defined
- `SignalingMessage` enum in `crates/tallow-net/src/signaling/protocol.rs` — Join/Leave/Offer/Answer/IceCandidate
- `RelayConfig` in `crates/tallow-relay/src/config.rs` — bind_addr, max_connections, rate_limit, TLS paths
- `RateLimiter` in `crates/tallow-relay/src/rate_limit.rs` — per-IP token bucket, 1-second window
- `dashmap` already in `tallow-relay/Cargo.toml` — concurrent room map is the right call
- `quinn 0.11` already in `tallow-net/Cargo.toml` (feature-gated `quic`)
- `rustls 0.23` in both `tallow-net` and `tallow-relay` — TLS backend settled

---

## Recommended Architecture

### System-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  SENDER CLIENT (tallow send)          RECEIVER CLIENT (tallow receive) │
│                                                                 │
│  CLI → SendPipeline                   ReceivePipeline → CLI    │
│       ↓                                    ↑                   │
│  [compress → encrypt → sign]    [verify → decrypt → decompress]│
│       ↓                                    ↑                   │
│  TallowCodec (postcard)          TallowCodec (postcard)        │
│       ↓                                    ↑                   │
│  QuicTransport (quinn)           QuicTransport (quinn)         │
│       ↓                                    ↑                   │
└───────┼────────────────────────────────────┼───────────────────┘
        │        QUIC over UDP/TLS           │
        ▼                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     RELAY SERVER (tallow-relay)                 │
│                                                                 │
│  quinn::Endpoint (bind 0.0.0.0:443)                            │
│       ↓                                                         │
│  ConnectionHandler (one tokio task per QUIC connection)        │
│       ↓                                                         │
│  SignalingHandler → RoomRegistry (DashMap<RoomId, RoomEntry>)  │
│       ↓ (after both peers joined)                              │
│  DataForwarder — opaque byte pipe between sender and receiver  │
│                                                                 │
│  RateLimiter (per-IP, token bucket)                            │
│  Auth (anonymous; room code is the auth credential)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|---------------|-------------------|----------|
| `QuicTransport` | Establish QUIC connection to relay; open bidirectional streams; send/receive raw bytes | `RelayServer` via QUIC over UDP | `crates/tallow-net/src/transport/quic.rs` |
| `TcpTlsTransport` | TCP+TLS fallback when QUIC is blocked (port 443) | `RelayServer` via TCP | `crates/tallow-net/src/transport/tcp_tls.rs` |
| `RelayClient` | Owns the `QuicTransport` or `TcpTlsTransport`; handles reconnect, exponential backoff | `QuicTransport` / `TcpTlsTransport` | `crates/tallow-net/src/relay/client.rs` |
| `SignalingClient` | Sends `RoomJoin`/`RoomLeave`/`Handshake` messages through the relay connection | `RelayClient` | `crates/tallow-net/src/signaling/client.rs` |
| `TallowCodec` | Serializes/deserializes `Message` enum to/from `BytesMut` using postcard | `SendPipeline`, `ReceivePipeline`, relay forwarder | `crates/tallow-protocol/src/wire/codec.rs` |
| `SendPipeline` | Orchestrates: file read → chunk → compress → encrypt → sign → encode → send | `TallowCodec`, `RelayClient`, `tallow-crypto` | `crates/tallow-protocol/src/transfer/send.rs` |
| `ReceivePipeline` | Orchestrates: receive → decode → verify → decrypt → decompress → write | `TallowCodec`, `RelayClient`, `tallow-crypto` | `crates/tallow-protocol/src/transfer/receive.rs` |
| `RelayServer` | Accepts QUIC connections; routes room join/leave; forwards data between paired peers | `ConnectionHandler` tasks | `crates/tallow-relay/src/server.rs` |
| `RoomRegistry` | `DashMap<RoomId, RoomEntry>` — tracks waiting/paired peers per room code | `ConnectionHandler` | `crates/tallow-relay/src/server.rs` (inline) |
| `ConnectionHandler` | Per-connection tokio task; reads frames; dispatches to SignalingHandler or DataForwarder | `RoomRegistry`, `RateLimiter` | `crates/tallow-relay/src/server.rs` |
| `DataForwarder` | Reads from sender stream, writes to receiver stream — no decryption, no inspection | sender/receiver streams | `crates/tallow-relay/src/server.rs` |
| `TransferStateMachine` | Guards state transitions: Idle→Connecting→Negotiating→Transferring→Completed/Failed | `SendPipeline`, `ReceivePipeline` | `crates/tallow-protocol/src/transfer/state_machine.rs` |
| `HybridKem` | ML-KEM-1024 + X25519 key exchange; session key derivation via HKDF | `SendPipeline` (initiator), `ReceivePipeline` (responder) | `crates/tallow-crypto/src/kem/hybrid.rs` |

---

## Data Flow: How Information Moves Through the Relay

The relay is a **dumb pipe** — it never sees plaintext. It only routes encrypted bytes based on room code.

### Phase 1: Room Rendezvous (Signaling)

```
Sender                          Relay                         Receiver
  │                               │                               │
  │── QUIC connect ──────────────>│                               │
  │── Message::RoomJoin{code} ───>│                               │
  │                               │  store peer_A_stream          │
  │                               │  RoomEntry::Waiting{peer_A}   │
  │                               │<────────── QUIC connect ──────│
  │                               │<── Message::RoomJoin{code} ───│
  │                               │  RoomEntry::Paired{A,B}       │
  │<── Message::Handshake{..} ───>│──> forward to sender ─────>  │
  │   (relay forwards blindly)    │                               │
```

The relay:
1. Receives `Message::RoomJoin{code}` from the first peer
2. Hashes the code with BLAKE3 to produce the `RoomId` key for `DashMap`
3. Stores the first peer's stream handle in `RoomEntry::Waiting`
4. When the second peer joins with the same code, upgrades to `RoomEntry::Paired`
5. Spawns a `DataForwarder` task that reads from each stream and writes to the other

### Phase 2: Key Exchange (Client-to-Client, Relay Blind)

```
Sender                          Relay                         Receiver
  │                               │                               │
  │── Message::Handshake ────────>│──────────────────────────────>│
  │   {version, peer_id,          │   (forwarded opaquely)        │
  │    ml_kem_pub, x25519_pub}    │                               │
  │<── Message::Handshake ────────│<──────────────────────────────│
  │   {version, peer_id,          │                               │
  │    kem_ciphertext, x25519_pub}│                               │
  │                               │                               │
  │  [HybridKem.decapsulate()]    │          [HybridKem.encapsulate()]
  │  session_key derived          │          session_key derived  │
```

**Key insight from magic-wormhole/croc pattern:** The handshake messages are forwarded by the relay verbatim. The relay has no concept of "handshake" — it sees only `Message` frames. The E2E key exchange happens between the two clients entirely within the forwarded byte stream.

### Phase 3: Authenticated Transfer (Client-to-Client, Relay Blind)

```
Sender                          Relay                         Receiver
  │                               │                               │
  │  [read file chunk]            │                               │
  │  [compress with zstd]         │                               │
  │  [encrypt AES-256-GCM]        │                               │
  │  [encode Message::Chunk]      │                               │
  │── encrypted frame ───────────>│──────────────────────────────>│
  │                               │   (opaque bytes, no          │
  │                               │    inspection possible)       │
  │<── Message::Ack{index} ───────│<──────────────────────────────│
  │  [next chunk]                 │                               │
```

**QUIC streams for transfer:** Use a single long-lived bidirectional QUIC stream for data flow. QUIC handles flow control natively — no need to implement application-level windowing. Chunk acknowledgments flow back on the same bidirectional stream.

---

## Patterns to Follow

### Pattern 1: Quinn Endpoint Lifecycle (Relay Server)

**What:** The relay opens a single `quinn::Endpoint`, accepts connections in a loop, and spawns one tokio task per connection.

**When:** Relay server startup in `crates/tallow-relay/src/server.rs`

```rust
// In RelayServer::start()
pub async fn start(&mut self) -> anyhow::Result<()> {
    let server_config = build_server_config(&self.config)?;  // rustls + rcgen
    let endpoint = quinn::Endpoint::server(server_config, self.config.bind_addr.parse()?)?;

    let room_registry: Arc<DashMap<RoomId, RoomEntry>> = Arc::new(DashMap::new());
    let rate_limiter: Arc<Mutex<RateLimiter>> = Arc::new(Mutex::new(
        RateLimiter::new(self.config.rate_limit)
    ));

    while let Some(incoming) = endpoint.accept().await {
        let registry = Arc::clone(&room_registry);
        let limiter = Arc::clone(&rate_limiter);
        tokio::spawn(async move {
            if let Ok(conn) = incoming.await {
                handle_connection(conn, registry, limiter).await;
            }
        });
    }
    Ok(())
}
```

**Confidence:** HIGH — this is the standard quinn 0.11 server pattern. `Endpoint::server()` replaces the older `Endpoint::new()` API. The `incoming.await` resolves the handshake.

### Pattern 2: Room Pairing via DashMap (Relay Room Registry)

**What:** Concurrent lock-free room state using `dashmap`. Two phases: Waiting (one peer) → Paired (two peers). The forwarding task holds both stream handles.

**When:** `handle_connection` dispatches `RoomJoin` messages.

```rust
enum RoomEntry {
    Waiting {
        sender_stream: quinn::SendStream,
        waker: tokio::sync::oneshot::Sender<quinn::RecvStream>,
    },
    Paired,  // forwarding task owns the streams
}

async fn handle_join(
    room_code: &str,
    peer_stream: (quinn::SendStream, quinn::RecvStream),
    registry: Arc<DashMap<RoomId, RoomEntry>>,
) {
    let room_id = blake3::hash(room_code.as_bytes());

    match registry.entry(room_id) {
        dashmap::Entry::Vacant(e) => {
            // First peer: store and wait
            let (tx, rx) = tokio::sync::oneshot::channel();
            e.insert(RoomEntry::Waiting { sender_stream: peer_stream.0, waker: tx });
            // Block until second peer arrives, then forward
            if let Ok(other_recv) = rx.await {
                forward_streams(peer_stream.1, other_recv).await;
            }
        }
        dashmap::Entry::Occupied(mut e) => {
            // Second peer: pair and launch forwarder
            if let RoomEntry::Waiting { sender_stream, waker } = e.remove() {
                let _ = waker.send(peer_stream.1);
                forward_streams(other_recv_placeholder, peer_stream.0).await;
            }
        }
    }
}
```

**Key design note from croc analysis:** croc's relay uses a simple room code → channel map with the same waiting/pairing pattern. The forwarding is bidirectional `io::copy` between the two halves. Tallow should do the same: `tokio::io::copy_bidirectional` between the two QUIC stream pairs.

**Confidence:** HIGH — this is the established pattern from croc (Go), magic-wormhole (Python), and wormhole-william (Go). The exact types will be `quinn::SendStream`/`quinn::RecvStream`.

### Pattern 3: QUIC Transport as Framed Stream (Client)

**What:** QUIC provides reliable ordered byte streams. Tallow needs to layer a framing protocol on top: length-prefixed postcard frames. Use `tokio_util::codec::LengthDelimitedCodec` as the framing layer, then postcard for message encoding.

**When:** `QuicTransport::connect/send/receive` implementation.

```rust
// In QuicTransport
pub struct QuicTransport {
    endpoint: quinn::Endpoint,
    connection: Option<quinn::Connection>,
    send: Option<quinn::SendStream>,
    recv: Option<quinn::RecvStream>,
}

impl QuicTransport {
    pub async fn connect(&mut self, addr: SocketAddr) -> Result<()> {
        let conn = self.endpoint.connect(addr, "tallow-relay")?.await
            .map_err(|e| NetworkError::QuicConnect(e))?;
        let (send, recv) = conn.open_bi().await
            .map_err(|e| NetworkError::QuicStream(e))?;
        self.connection = Some(conn);
        self.send = Some(send);
        self.recv = Some(recv);
        Ok(())
    }
}
```

**Frame format:** `[u32 length][postcard bytes]` — a 4-byte big-endian length prefix followed by the postcard-encoded `Message`. This maps naturally to `LengthDelimitedCodec` from `tokio-util`, which is already in `tallow-net/Cargo.toml`.

**Confidence:** HIGH — quinn 0.11 bidirectional stream API is stable. The `open_bi()` / `accept_bi()` pattern is well-established.

### Pattern 4: Send Pipeline as Async State Machine

**What:** The send pipeline is an ordered sequence of async stages. Each stage produces a `Future`. The pipeline does NOT spawn separate tasks per chunk — it pipelines within a single task using buffered channels.

**When:** `SendPipeline::start()` implementation in `crates/tallow-protocol/src/transfer/send.rs`.

```
File Read (tokio::fs::File, 256KB reads)
    ↓
Adaptive Chunker (ChunkConfig: 64KB min, 4MB max)
    ↓
Compression Pipeline (zstd level 3 default, adaptive)
    ↓
tallow-crypto::file::encrypt_chunk (AES-256-GCM, counter nonce)
    ↓
Manifest accumulation (BLAKE3 hash per chunk → FileManifest)
    ↓
TallowCodec::encode → Message::Chunk{transfer_id, index, data}
    ↓
QuicTransport::send (length-prefixed frame)
    ↓ (await Ack or timeout → retry or fail)
TransferProgress::update → indicatif progress bar
```

**Key implementation note:** The `TransferStateMachine` should be checked at each transition point. The `state_machine.transition()` call is the guard — if it returns `Err`, the pipeline aborts. This is already wired correctly in the existing state machine.

**Confidence:** HIGH — this is the standard croc / magic-wormhole / Warpspeed pipeline pattern. The stages are well-understood.

### Pattern 5: Receive Pipeline with Chunk Verification

**What:** The receive pipeline mirrors the send pipeline in reverse. Critical invariant: **the AES-GCM auth tag is verified before any plaintext is written to disk** — this is a stated non-negotiable rule in CLAUDE.md.

```
QuicTransport::receive → Message::Chunk{index, data}
    ↓
AES-GCM AEAD verify (auth tag checked; any failure → abort entire transfer)
    ↓  (only if tag verified)
Decompress
    ↓
BLAKE3 hash chunk → compare with FileManifest entry (via subtle::ConstantTimeEq)
    ↓  (only if hash matches)
Write chunk to output file at offset (index * chunk_size)
    ↓
Send Message::Ack{index}
    ↓
TransferProgress::update → indicatif progress bar
    ↓ (when final chunk received)
Verify total chunk count matches manifest
    ↓
Log to tallow-store::history
```

**Confidence:** HIGH — the "verify before write" invariant is standard AEAD practice and explicitly required by the project security rules.

### Pattern 6: TLS Certificate Generation for Relay (rcgen Pattern)

**What:** The relay generates a self-signed TLS certificate at startup using `rcgen` (already in `tallow-relay/Cargo.toml`). Clients pin the certificate fingerprint (TOFU for the relay itself).

**When:** `build_server_config()` helper in `crates/tallow-relay/src/server.rs`.

```rust
fn build_server_config(config: &RelayConfig) -> anyhow::Result<quinn::ServerConfig> {
    let cert = rcgen::generate_simple_self_signed(vec!["tallow-relay".into()])?;
    let cert_der = cert.serialize_der()?;
    let key_der = cert.serialize_private_key_der();

    let cert_chain = vec![rustls::pki_types::CertificateDer::from(cert_der)];
    let key = rustls::pki_types::PrivateKeyDer::try_from(key_der)?;

    let mut server_tls = rustls::ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(cert_chain, key)?;
    server_tls.alpn_protocols = vec![b"tallow/1".to_vec()];

    Ok(quinn::ServerConfig::with_crypto(Arc::new(
        quinn::crypto::rustls::QuinnServerConfig::try_from(server_tls)?
    )))
}
```

**Confidence:** HIGH — this is the standard pattern for quinn + rustls + rcgen. The `rcgen 0.13` API is already declared in `tallow-relay/Cargo.toml`.

### Pattern 7: Transport Negotiation (QUIC First, TCP+TLS Fallback)

**What:** The client attempts QUIC first (UDP port 443). If blocked or timed out, falls back to TCP+TLS on port 443. The existing `TransportProtocol` enum and `negotiate()` function in `tallow-net/src/transport/negotiation.rs` define the right interface.

**When:** Connection setup in `RelayClient::connect()` in `crates/tallow-net/src/relay/client.rs`.

```rust
pub async fn connect(&mut self, peer_id: &str) -> Result<()> {
    // Try QUIC first (300ms timeout)
    match tokio::time::timeout(
        Duration::from_millis(300),
        self.try_quic_connect()
    ).await {
        Ok(Ok(transport)) => {
            self.active_transport = Transport::Quic(transport);
            return Ok(());
        }
        _ => {} // fall through
    }
    // Fallback to TCP+TLS
    let transport = self.try_tcp_tls_connect().await?;
    self.active_transport = Transport::TcpTls(transport);
    Ok(())
}
```

**Confidence:** HIGH — this is the standard connectivity fallback pattern from croc (which uses a similar timeout-based fallback). The 300ms QUIC timeout before TCP fallback is consistent with industry practice.

### Pattern 8: Postcard Frame Encoding in TallowCodec

**What:** Replace `bincode` with `postcard` for wire encoding (resolves the documented serialization mismatch concern). Use `postcard::to_allocvec` for encode, `postcard::from_bytes` for decode. Frame with 4-byte length prefix.

**When:** `TallowCodec::encode` and `TallowCodec::decode` in `crates/tallow-protocol/src/wire/codec.rs`.

```rust
impl TallowCodec {
    pub fn encode(&self, msg: &Message, buf: &mut BytesMut) -> Result<()> {
        let encoded = postcard::to_allocvec(msg)
            .map_err(|e| ProtocolError::Encode(e.to_string()))?;
        let len = encoded.len() as u32;
        buf.put_u32(len);
        buf.put_slice(&encoded);
        Ok(())
    }

    pub fn decode(&self, buf: &mut BytesMut) -> Result<Option<Message>> {
        if buf.len() < 4 { return Ok(None); }
        let len = u32::from_be_bytes(buf[..4].try_into().unwrap()) as usize;
        if buf.len() < 4 + len { return Ok(None); }
        buf.advance(4);
        let bytes = buf.split_to(len);
        let msg = postcard::from_bytes(&bytes)
            .map_err(|e| ProtocolError::Decode(e.to_string()))?;
        Ok(Some(msg))
    }
}
```

**Confidence:** HIGH — postcard is the stated wire protocol serializer in `docs/protocol-spec.md`. The `bytes::BytesMut` pattern is already in use (it's imported in the existing codec stub).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Relay Inspecting Message Content

**What:** Adding any logic in the relay that parses `Message` enum variants beyond `RoomJoin`/`RoomLeave`.

**Why bad:** Violates the threat model ("relay is FULLY untrusted"). If the relay can parse `Message::Chunk`, it can log plaintext during a bug or future code path. The relay should operate on raw byte frames before decode — the only field it reads is the room code from the initial join message.

**Instead:** Relay reads exactly one `RoomJoin` frame at connection start to extract the room code. All subsequent frames are forwarded as opaque bytes using `tokio::io::copy_bidirectional`. The relay never calls `postcard::from_bytes::<Message>()` after that.

### Anti-Pattern 2: Per-Chunk Task Spawning

**What:** Spawning a separate `tokio::spawn` for each chunk in the send or receive pipeline.

**Why bad:** At 256KB chunks and 100MB files, that is 400 spawned tasks. Task overhead (128+ bytes per task, scheduler pressure) adds up. More importantly, it eliminates natural backpressure — the sender will flood the relay.

**Instead:** Use a single pipeline task with `await` at each stage. Let quinn's built-in flow control (QUIC stream credit) provide backpressure. Only spawn separate tasks for the two directions (send vs receive ack) within a transfer.

### Anti-Pattern 3: Storing Room Codes in Relay Memory Longer Than Necessary

**What:** Keeping `RoomEntry` in the `DashMap` after both peers have joined and the forwarding task has started.

**Why bad:** Metadata accumulation on the relay — even room IDs are sensitive (they can correlate transfers). Also creates a memory leak if the cleanup logic fails.

**Instead:** Remove the `RoomEntry` from `DashMap` immediately when the second peer joins (before spawning the forwarding task). The forwarding task holds the stream handles directly; the room registry entry is gone.

### Anti-Pattern 4: Blocking on Chunk Acknowledgments Before Sending Next Chunk

**What:** Waiting for `Message::Ack{index}` before sending `Message::Chunk{index+1}`.

**Why bad:** Eliminates the bandwidth × latency product benefit of QUIC. At 100ms RTT and 1MB/s, you get 100KB in-flight max — 10x worse than necessary.

**Instead:** Use a sliding window of N unacknowledged chunks (N=8 to start). Send chunks ahead without waiting for ack, but stop when the window is full. This is the same approach croc uses (pipeline depth configurable). QUIC's flow control is the ultimate backstop.

### Anti-Pattern 5: Using `serde_json` Tagged Enum Format for Wire Protocol

**What:** The existing `Message` enum uses `#[serde(tag = "type")]` which is the JSON tagged-union format. postcard does not support this; it requires all variants to be represented as discriminant indices.

**Why bad:** `postcard` serializes enums by variant index, not by a `"type"` string field. The `#[serde(tag = "type")]` attribute works for JSON/bincode but is incompatible with postcard's format.

**Instead:** Remove `#[serde(tag = "type")]` from the `Message` enum. postcard uses Rust's native enum discriminant. Verify with a round-trip test: `postcard::to_allocvec(&msg)` → `postcard::from_bytes::<Message>(&bytes)`.

---

## Build Order: Dependency Graph for Implementation

The following order respects both crate-level dependencies and logical prerequisites. Each item's `todo!()` bodies cannot be tested until the items it depends on are implemented.

```
LAYER 0 (no dependencies — implement first):
  ├── TallowCodec::encode/decode (postcard framing)
  │     → blocks: everything that sends/receives messages
  └── ChunkConfig::adaptive_chunk_size
        → blocks: SendPipeline, ReceivePipeline

LAYER 1 (depends on Layer 0):
  ├── QuicTransport::connect/send/receive (quinn client)
  │     → depends on: TallowCodec (framing)
  │     → blocks: RelayClient, SendPipeline, ReceivePipeline
  ├── TcpTlsTransport::connect/send/receive (fallback)
  │     → depends on: TallowCodec
  │     → blocks: RelayClient (fallback path)
  └── RelayServer::start (quinn server, room registry, forwarder)
        → depends on: TallowCodec (to read RoomJoin only)
        → blocks: RelayClient (needs a running relay to connect to)

LAYER 2 (depends on Layer 1):
  ├── RelayClient::connect/forward
  │     → depends on: QuicTransport, TcpTlsTransport
  │     → blocks: SignalingClient, SendPipeline, ReceivePipeline
  └── SignalingClient::connect/send/receive
        → depends on: RelayClient
        → blocks: key exchange flow

LAYER 3 (depends on Layer 2):
  ├── SendPipeline::start (full pipeline: read→chunk→compress→encrypt→sign→encode→send)
  │     → depends on: RelayClient, TallowCodec, tallow-crypto (already implemented)
  │     → blocks: tallow::commands::send::execute
  └── ReceivePipeline::start (full pipeline: receive→verify→decrypt→decompress→write)
        → depends on: RelayClient, TallowCodec, tallow-crypto (already implemented)
        → blocks: tallow::commands::receive::execute

LAYER 4 (depends on Layer 3):
  ├── Transfer resume (checkpoint/restore)
  │     → depends on: SendPipeline, ReceivePipeline
  ├── Manifest signing/verification
  │     → depends on: tallow-crypto::sig (already implemented), FileManifest
  ├── CLI commands: send, receive
  │     → depends on: SendPipeline, ReceivePipeline
  └── tallow-store: config loader, identity keypair, encrypted KV
        → depends on: tallow-crypto (already implemented)
        → blocks: identity command, persistent config

LAYER 5 (can develop in parallel with Layer 3+):
  ├── NAT traversal: STUN → UPnP → hole-punch → TURN
  │     → independent of transfer pipeline
  │     → improves direct connectivity but relay path works without it
  ├── mDNS/DNS-SD discovery
  │     → independent of relay path
  ├── SOCKS5 proxy (Tor integration)
  │     → independent; slots into RelayClient as a proxy wrapper
  └── DoH resolver
        → independent; slots into RelayClient's DNS resolution

LAYER 6 (depends on Layer 4):
  ├── TUI main loop (render, events, panels)
  ├── Logging initialization (tracing-subscriber)
  └── OS sandbox (Landlock + Seccomp)
```

**Recommended phase ordering:**
1. Layer 0: Codec + chunking (2-3 days, pure logic, fully testable without network)
2. Layer 1: Transport + Relay server (5-7 days, core networking)
3. Layer 2: Relay client + Signaling (2-3 days, thin wrapper)
4. Layer 3: Send + Receive pipelines (5-7 days, the core product feature)
5. Layer 4: Resume, manifest, CLI commands, store (3-4 days)
6. Layers 5+6 in parallel with ongoing work

---

## Relay Server Architecture Patterns

### Connection Lifecycle

The relay sees each peer as a QUIC connection with one bidirectional stream for control + data. After pairing, the relay becomes a byte pipe.

```
quinn::Endpoint::accept()
  → incoming.await (TLS handshake, ALPN "tallow/1")
  → conn.accept_bi().await (first bidirectional stream)
  → read length-prefixed frame → expect Message::RoomJoin{code, peer_id}
  → rate_limiter.check(conn.remote_address().ip())
  → room_registry.pair_or_wait(room_id, send_stream, recv_stream)
  → [if paired] spawn DataForwarder{a_recv, b_send, b_recv, a_send}
  → [if waiting] hold recv_stream until paired (oneshot channel)
```

### Room Registry State Machine

```
State diagram for RoomEntry:

[No entry] ──(peer A joins)──> [Waiting{A_streams, waker}]
[Waiting{A}] ──(peer B joins)──> [Paired] → entry removed from DashMap
                                              ↓
                                    DataForwarder task running
                                    (holds A and B stream handles)
[Paired] ──(either disconnects)──> DataForwarder task completes
                                   → streams dropped → QUIC conn closed
```

### Room Timeout and Cleanup

Waiting rooms must expire. If peer A joins but peer B never appears:

```rust
tokio::select! {
    result = rx.await => { /* paired */ }
    _ = tokio::time::sleep(Duration::from_secs(60)) => {
        // Remove room entry, close connection with error
        registry.remove(&room_id);
        send_stream.finish(); // or write error frame
    }
}
```

60-second timeout matches croc's relay timeout. This prevents orphaned room entries from accumulating.

### Memory Bound per Connection

- Each connection: ~2KB quinn state + stream buffers
- `DashMap` entry while waiting: ~200 bytes
- No message payload is stored in relay memory — all forwarding is streaming copy
- At 1GB RAM limit (Oracle Cloud free tier): supports ~500K concurrent waiting connections or ~100K active forwarding connections (bounded by socket buffer sizes)

### Metrics the Relay Should Track (tracing events, not external services)

```rust
tracing::info!(room_id = %hex::encode(&room_id), "room_created");
tracing::info!(room_id = %hex::encode(&room_id), "room_paired");
tracing::info!(room_id = %hex::encode(&room_id), bytes_forwarded = %n, "room_closed");
```

No PII, no IP addresses in logs (privacy requirement from threat model). Room ID is a BLAKE3 hash of the code phrase — not reversible.

---

## Comparison with Reference Implementations

### croc (schollz/croc)

- **Relay pattern:** Room-keyed map of TCP connections. Sender and receiver connect to same room code. Relay does `io.Copy` between the two halves. No message inspection after join.
- **Transport:** TCP + TLS only. No QUIC.
- **Chunk size:** Fixed 1MB chunks. No adaptive sizing.
- **Key exchange:** PAKE (SPAKE2) between clients over relay, relay blind.
- **Tallow adaptation:** Same room pairing pattern. Add QUIC on top. Use postcard framing instead of raw TCP length prefix.

**Confidence:** HIGH (training knowledge of croc source)

### magic-wormhole (Python reference implementation)

- **Relay pattern:** WebSocket-based relay server (Mailbox Server). Room codes → "mailboxes". Each side opens a mailbox, polls for messages. Relay stores messages briefly (until peer retrieves).
- **Transport:** WebSocket over HTTPS. Not QUIC.
- **Key exchange:** SPAKE2 over relay-forwarded messages. Relay sees ciphertext only.
- **Tallow divergence:** Tallow uses streaming QUIC, not WebSocket polling. No mailbox persistence needed — streaming is preferred for large file transfers.

**Confidence:** HIGH (training knowledge)

### WebRTC-based tools (e.g., Snapdrop, Wormhole.app)

- **Relay pattern:** ICE/STUN for P2P, TURN as relay fallback. Signaling server exchanges SDP offers/answers.
- **Transport:** DTLS over UDP for data channels.
- **Tallow divergence:** Tallow uses QUIC (which provides the same reliability guarantees as DTLS+SCTP underlying WebRTC data channels). No SDP/ICE negotiation needed — QUIC is simpler and purpose-built. The `SignalingMessage` enum in `tallow-net/src/signaling/protocol.rs` currently has WebRTC SDP fields (`Offer{sdp}`, `Answer{sdp}`) — these should be replaced with a simpler QUIC address exchange if direct connectivity is needed, or removed if relay-only is sufficient for v1.

**Confidence:** MEDIUM (WebRTC relay pattern is known; Tallow-specific adaptation is a judgment call)

---

## Key Architectural Decision: Signaling Message Cleanup

The existing `SignalingMessage` enum contains WebRTC artifacts (`Offer{sdp}`, `Answer{sdp}`, `IceCandidate{candidate}`). These are not needed for a QUIC+relay architecture.

**Recommendation:** Replace with Tallow-specific signaling:

```rust
// Replace current SignalingMessage with:
pub enum SignalingMessage {
    Join { room_code: String, peer_id: String, version: u32 },
    Leave { room_code: String },
    Ready,          // relay → both peers: "your partner has joined"
    Error(String),  // relay → peer: timeout, room full, etc.
}
```

This is cleaner and removes confusion about WebRTC coupling. The `Offer`/`Answer`/`IceCandidate` variants suggest ICE negotiation which is irrelevant to the QUIC relay model.

**Confidence:** HIGH — this directly follows from the architecture (single relay, QUIC transport, no WebRTC).

---

## Scalability Considerations

| Concern | At 100 concurrent transfers | At 10K concurrent transfers | At 1M concurrent transfers |
|---------|-----------------------------|-----------------------------|---------------------------|
| Relay memory | ~200KB (trivial) | ~20MB (fine) | ~2GB (exceeds Oracle free tier — would need relay clustering) |
| DashMap contention | None | Low (sharded by default) | Shard count needs tuning |
| QUIC connections | Trivial | Fine (quinn handles thousands) | OS file descriptor limits (increase via `ulimit`) |
| Bandwidth | Relay sees all traffic | Need bandwidth metering per room | Rate limiting per IP (already in `RateLimiter`) |
| Binary size | N/A | N/A | N/A |

For v1 (Oracle Cloud free tier, 1GB RAM), 10K concurrent transfers is a reasonable upper bound. This is sufficient for the stated use case (personal / small team secure transfer).

---

## Sources

- Tallow codebase analysis (2026-02-19): `crates/tallow-relay/`, `crates/tallow-net/`, `crates/tallow-protocol/` — HIGH confidence
- `crates/tallow-relay/Cargo.toml`: quinn 0.11, rustls 0.23, rcgen 0.13, dashmap 6 — confirmed present
- `.planning/codebase/ARCHITECTURE.md`: data flow, layer descriptions — HIGH confidence (internal doc)
- `.planning/codebase/CONCERNS.md`: serialization mismatch (bincode vs postcard), signaling protocol WebRTC artifacts — HIGH confidence (internal audit)
- quinn 0.11 API patterns: `Endpoint::server()`, `accept_bi()`, `open_bi()` — HIGH confidence (training, stable API)
- croc relay architecture: room-keyed map, io.Copy forwarding — HIGH confidence (training)
- magic-wormhole relay architecture: mailbox server, SPAKE2 PAKE — HIGH confidence (training)
- `tokio::io::copy_bidirectional`: standard bidirectional stream copy — HIGH confidence
- postcard serde compatibility: does not support `#[serde(tag = "type")]` — HIGH confidence (postcard docs, training)
