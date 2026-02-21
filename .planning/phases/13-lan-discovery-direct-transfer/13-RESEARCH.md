# Phase 13: LAN Discovery & Direct Transfer -- Research

## Standard Stack

### mDNS/DNS-SD Library: `mdns-sd`

The project already depends on `mdns-sd = "0.11"` in `crates/tallow-net/Cargo.toml`. The latest published version is **0.18.0** (as of early 2026). The upgrade from 0.11.5 to 0.18.x is recommended for this phase.

**Why `mdns-sd`:**
- Pure Rust, safe code, small dependency footprint
- Supports both querier (browse) and responder (register) modes
- Thread-based daemon with flume channel API -- works with both sync and async code without requiring a specific async runtime
- Tested for interoperability with Avahi (Linux), dns-sd (macOS), Bonjour (iOS/macOS)
- Actively maintained (last update September 2025 per lib.rs metadata)

**Alternatives considered and rejected:**
- `libmdns` (librespot-org): Responder-only, no querier/browse capability. Not suitable.
- `mdns` crate: Client/querier only, no responder/register. Not suitable.
- `simple-mdns`: Lower-level, more manual packet handling. More work for no benefit.
- `hickory-resolver` mDNS support: Already in the dependency tree for DoH, but its mDNS is experimental and not designed for DNS-SD service advertisement.

### QUIC Transport: `quinn`

Already in the dependency tree (`quinn = "0.11"`, feature-gated). Quinn is the right choice for direct LAN connections because:
- A single `quinn::Endpoint` can act as both client and server simultaneously -- essential for P2P
- QUIC's 0-RTT and 1-RTT handshakes are fast on LAN
- Built-in TLS via rustls provides transport encryption (defense-in-depth alongside E2E)
- UDP-based, which means it works with the existing hole-punching code in `nat/hole_punch.rs`

### NAT Traversal Stack

Already implemented in `crates/tallow-net/src/nat/`:
- `stun.rs`: Full STUN Binding Request implementation (Google + Cloudflare servers)
- `detection.rs`: NAT type classification (None/FullCone/Restricted/PortRestricted/Symmetric)
- `hole_punch.rs`: UDP simultaneous hole punching with TLOW magic bytes
- `upnp.rs`: UPnP/IGD port mapping via `igd-next`
- `turn.rs`: Basic TURN client (allocate + send indication)

### TLS/Certificate Infrastructure

`tls_config.rs` already provides self-signed certificate generation via `rcgen`, SkipServerVerification for P2P (justified by E2E encryption), and both quinn and rustls server/client configs. This is directly reusable for direct LAN connections.

---

## Architecture Patterns

### Pattern 1: Transport Abstraction Layer

The codebase already has a `Transport` trait in `crates/tallow-net/src/transport/mod.rs`:

```rust
pub trait Transport: Send + Sync {
    async fn connect(&mut self, addr: SocketAddr) -> Result<()>;
    async fn send(&mut self, data: &[u8]) -> Result<usize>;
    async fn receive(&mut self, buf: &mut [u8]) -> Result<usize>;
}
```

And a `FallbackTransport` that tries QUIC then TCP+TLS. The direct LAN connection must implement this same trait so that the entire transfer pipeline (send.rs, receive.rs) can use either relay or direct transport interchangeably. This is the critical architectural insight: **the transport layer changes, not the transfer protocol**.

**Recommended approach:** Create a `DirectTransport` or `LanTransport` struct that implements `Transport`, wrapping a quinn `Endpoint` that binds locally and either connects to a discovered peer or accepts an incoming connection.

### Pattern 2: Connection Strategy with Fallback

The connection logic should follow this sequence:

```
1. If --local flag set:
   a. Sender: advertise via mDNS, bind QUIC endpoint, wait for connection
   b. Receiver: browse mDNS, discover sender, connect directly via QUIC
   c. If mDNS fails or connection fails within timeout -> fall back to relay

2. If no --local flag:
   a. Proceed with relay as today (no change)

3. Auto-detect mode (future enhancement):
   a. Race mDNS discovery against relay connection
   b. Use whichever succeeds first
```

### Pattern 3: Relay Client as Transport Adapter

Currently `RelayClient` in `relay/client.rs` embeds `QuicTransport` internally and exposes `forward()` + `receive()`. The send/receive commands use `RelayClient` directly. For Phase 13, we need a common interface that both `RelayClient` and the new direct connection code expose. Two options:

**Option A (Recommended): Unified Channel Abstraction**
Create a `PeerChannel` trait:
```rust
pub trait PeerChannel: Send + Sync {
    async fn send_message(&mut self, data: &[u8]) -> Result<()>;
    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize>;
    async fn close(&mut self);
}
```
Both `RelayClient` and `DirectConnection` implement `PeerChannel`. The send/receive command code is refactored to use `PeerChannel` instead of `RelayClient` directly.

**Option B: Wrapper enum**
```rust
enum TransferChannel {
    Relay(RelayClient),
    Direct(DirectConnection),
}
```
Delegate all method calls through the enum. Simpler but less extensible.

### Pattern 4: Sender-as-Server for LAN

On LAN, the sender should act as the QUIC server (bind + listen) and the receiver connects to it after mDNS discovery. This matches the existing flow where the sender creates the room and the receiver joins:

- Sender: `mDNS::advertise(port, fingerprint)` + `QuicTransport::bind(addr, config)`
- Receiver: `mDNS::browse()` -> discover peer -> `QuicTransport::connect(peer_addr)`

The sender binds to an OS-assigned port (`:0`), then advertises that port via mDNS TXT records.

---

## Don't Hand-Roll

1. **mDNS protocol implementation**: Use `mdns-sd` -- do not implement RFC 6762/6763 manually. The existing code already uses it correctly.

2. **STUN/TURN protocol**: Already implemented in `nat/stun.rs` and `nat/turn.rs`. Use them as-is.

3. **TLS certificate generation**: Already handled by `tls_config.rs` via `rcgen`. Reuse for direct connections.

4. **UDP hole punching**: Already in `nat/hole_punch.rs`. Extend if needed but don't rewrite.

5. **QUIC protocol**: `quinn` handles all the complexity. Don't implement QUIC framing manually.

6. **Service type naming**: Follow RFC 6763 conventions (`_tallow._tcp.local.`). The existing code already uses this.

7. **Length-prefixed framing**: Already standardized in `QuicTransport::send/receive`. Reuse the same framing for direct connections.

8. **Wire protocol codec**: `TallowCodec` in `tallow-protocol` already handles encode/decode. Direct connections MUST use the same codec -- do not create a separate message format.

---

## Common Pitfalls

### 1. Windows mDNS Firewall Blocking

**Problem:** Windows Firewall blocks mDNS multicast (UDP port 5353) by default in Domain profile. Even in Private/Public profiles, the built-in "mDNS (UDP-In)" firewall rule may not be present on older Windows 10 builds.

**Mitigation:**
- Detect mDNS failure and surface a clear error: "mDNS discovery failed -- check Windows Firewall allows UDP port 5353"
- Fall back to relay transparently with user notification
- Consider adding `tallow doctor` check for mDNS reachability

### 2. WiFi Multicast Optimization

**Problem:** Many WiFi access points implement multicast-to-unicast conversion or drop multicast packets entirely for power-saving. This silently breaks mDNS.

**Mitigation:**
- Short discovery timeout (3-5 seconds) with clear fallback messaging
- The existing code already uses a 3-second wait which is appropriate
- Document that wired Ethernet is more reliable for LAN discovery

### 3. Multiple Network Interfaces

**Problem:** `mdns-sd` may advertise/browse on the wrong interface (e.g., VPN adapter, Docker bridge, WSL virtual NIC). This causes discovery to fail even though both peers are on the same physical LAN.

**Mitigation:**
- `mdns-sd` 0.18.x provides `ServiceDaemon::new_with_if_config()` to restrict interfaces -- use this
- Allow `--interface` CLI flag for manual override
- Default to advertising on all non-loopback, non-virtual interfaces
- Log which interface(s) mDNS is active on

### 4. IPv6 Link-Local Confusion

**Problem:** mDNS may return IPv6 link-local addresses (fe80::) which require a scope ID to be usable. Connecting to `fe80::1%eth0` works differently across OSes.

**Mitigation:**
- Prefer IPv4 addresses from mDNS results when available
- The existing `MdnsDiscovery` code already picks `addresses.iter().next()` -- this should be changed to prefer IPv4
- If only IPv6 is available, ensure the scope ID is preserved

### 5. Port Conflicts on Sender

**Problem:** Binding to a fixed port (e.g., 4433) may fail if another Tallow instance or other service is using it.

**Mitigation:**
- Bind to port 0 (OS-assigned) and advertise the actual bound port via mDNS TXT record
- The existing code in `QuicTransport::connect` already uses "0.0.0.0:0" -- extend this to server binding

### 6. mDNS Daemon Thread Leak

**Problem:** If `MdnsDiscovery::stop()` is not called (e.g., panic, early return), the mDNS daemon thread and associated sockets are leaked.

**Mitigation:**
- Implement `Drop` for `MdnsDiscovery` that calls `stop()`
- The current code holds `daemon: Option<ServiceDaemon>` but does not impl Drop
- Use RAII pattern: `impl Drop for MdnsDiscovery { fn drop(&mut self) { let _ = self.stop(); } }`

### 7. Race Condition: Both Peers Discover Each Other Simultaneously

**Problem:** If both peers browse and both try to connect, you get two half-open connections. This is especially likely with the auto-detect mode.

**Mitigation:**
- Assign clear roles: sender = server (bind + advertise), receiver = client (browse + connect)
- The --local flag on send means "I am the server"; --local on receive means "I am the client"
- If using auto-detect, use the room code / code phrase to deterministically assign roles (e.g., sender always serves)

### 8. Stale mDNS Service Records

**Problem:** If a sender crashes without unregistering, the stale service persists in neighbors' caches until the TTL expires (typically 75 minutes for mDNS).

**Mitigation:**
- Use short TTL values in service registration
- Include a timestamp or nonce in TXT records that the receiver can verify
- Implement connection timeout: if the discovered peer doesn't respond within 5 seconds, consider it stale

### 9. Security: mDNS Fingerprint Exposure

**Problem:** Advertising the full identity fingerprint via mDNS exposes it to all devices on the LAN, enabling tracking and correlation attacks.

**Mitigation:**
- Advertise only a truncated fingerprint (first 8 hex chars) -- enough for disambiguation but not full identification
- Include the room code hash (first 8 bytes) so receivers can filter discoveries by the expected room
- Make fingerprint advertisement optional (off by default in privacy-sensitive environments)
- The TXT record should contain: `fp=<8-char-prefix>`, `v=1`, `rc=<room-code-hash-prefix>`

### 10. Postcard Discriminant Stability

**Problem:** Adding new `Message` variants to the wire protocol enum changes postcard's integer discriminants for all subsequent variants, breaking backward compatibility with older clients.

**Mitigation:**
- For Phase 13, no new `Message` variants are needed -- direct connections use the exact same FileOffer/Chunk/Ack flow as relay connections
- If signaling messages are needed for coordination, use the mDNS TXT records or a separate channel, not the transfer protocol

---

## Code Examples

### Example 1: Upgraded mDNS Service Registration (Sender)

```rust
use mdns_sd::{ServiceDaemon, ServiceInfo};

const SERVICE_TYPE: &str = "_tallow._tcp.local.";

pub struct LanAdvertiser {
    daemon: ServiceDaemon,
    service_fullname: String,
}

impl LanAdvertiser {
    pub fn new(
        port: u16,
        fingerprint_prefix: &str,
        room_code_hash: &[u8],
    ) -> Result<Self> {
        let daemon = ServiceDaemon::new()
            .map_err(|e| NetworkError::DiscoveryError(format!("mDNS daemon: {}", e)))?;

        let instance_name = format!("tallow-{}", hex::encode(&room_code_hash[..4]));
        let hostname = get_hostname();

        let properties = [
            ("fp", fingerprint_prefix),
            ("v", "1"),
            ("rc", &hex::encode(&room_code_hash[..8])),
        ];

        let service = ServiceInfo::new(
            SERVICE_TYPE,
            &instance_name,
            &format!("{}.", hostname),
            "",  // empty = all interfaces
            port,
            &properties[..],
        )
        .map_err(|e| NetworkError::DiscoveryError(format!("ServiceInfo: {}", e)))?;

        let fullname = service.get_fullname().to_string();
        daemon.register(service)
            .map_err(|e| NetworkError::DiscoveryError(format!("register: {}", e)))?;

        Ok(Self {
            daemon,
            service_fullname: fullname,
        })
    }
}

impl Drop for LanAdvertiser {
    fn drop(&mut self) {
        let _ = self.daemon.unregister(&self.service_fullname);
        let _ = self.daemon.shutdown();
    }
}
```

### Example 2: mDNS Browser with Room Code Filtering (Receiver)

```rust
use mdns_sd::{ServiceDaemon, ServiceEvent};
use std::time::Duration;

pub async fn discover_sender(
    room_code_hash: &[u8],
    timeout: Duration,
) -> Result<Option<DiscoveredPeer>> {
    let daemon = ServiceDaemon::new()
        .map_err(|e| NetworkError::DiscoveryError(format!("mDNS daemon: {}", e)))?;

    let receiver = daemon.browse(SERVICE_TYPE)
        .map_err(|e| NetworkError::DiscoveryError(format!("browse: {}", e)))?;

    let expected_rc = hex::encode(&room_code_hash[..8]);
    let deadline = tokio::time::Instant::now() + timeout;

    loop {
        if tokio::time::Instant::now() >= deadline {
            let _ = daemon.shutdown();
            return Ok(None);
        }

        // Non-blocking poll with short sleep
        match receiver.try_recv() {
            Ok(ServiceEvent::ServiceResolved(info)) => {
                // Filter by room code hash prefix
                let rc = info.get_properties()
                    .get_property_val_str("rc")
                    .unwrap_or_default();

                if rc == expected_rc {
                    if let Some(addr) = info.get_addresses().iter().next() {
                        let peer = DiscoveredPeer {
                            id: info.get_fullname().to_string(),
                            addr: SocketAddr::new(*addr, info.get_port()),
                            name: info.get_hostname().to_string(),
                            fingerprint: info.get_properties()
                                .get_property_val_str("fp")
                                .map(|s| s.to_string()),
                        };
                        let _ = daemon.shutdown();
                        return Ok(Some(peer));
                    }
                }
            }
            Ok(_) => {} // Ignore other events
            Err(_) => {
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
        }
    }
}
```

### Example 3: Direct QUIC Server (Sender Listening)

```rust
use quinn::{Endpoint, ServerConfig};

pub struct DirectListener {
    endpoint: Endpoint,
    local_addr: SocketAddr,
}

impl DirectListener {
    pub fn bind() -> Result<Self> {
        let tls_identity = tls_config::generate_self_signed()?;
        let server_config = tls_config::quinn_server_config(&tls_identity)?;

        // Bind to any available port
        let endpoint = Endpoint::server(
            server_config,
            "0.0.0.0:0".parse().unwrap(),
        )
        .map_err(|e| NetworkError::ConnectionFailed(format!("bind: {}", e)))?;

        let local_addr = endpoint.local_addr()
            .map_err(|e| NetworkError::ConnectionFailed(format!("local_addr: {}", e)))?;

        tracing::info!("Direct listener bound to {}", local_addr);

        Ok(Self { endpoint, local_addr })
    }

    pub fn port(&self) -> u16 {
        self.local_addr.port()
    }

    pub async fn accept_peer(&self) -> Result<DirectConnection> {
        let incoming = self.endpoint.accept().await
            .ok_or_else(|| NetworkError::ConnectionFailed("endpoint closed".into()))?;

        let connection = incoming.await
            .map_err(|e| NetworkError::ConnectionFailed(format!("accept: {}", e)))?;

        let (send, recv) = connection.accept_bi().await
            .map_err(|e| NetworkError::ConnectionFailed(format!("accept_bi: {}", e)))?;

        Ok(DirectConnection { connection, send, recv })
    }
}
```

### Example 4: Direct QUIC Client (Receiver Connecting)

```rust
pub async fn connect_direct(peer_addr: SocketAddr) -> Result<DirectConnection> {
    let client_config = tls_config::quinn_client_config()?;

    let mut endpoint = Endpoint::client("0.0.0.0:0".parse().unwrap())
        .map_err(|e| NetworkError::ConnectionFailed(format!("client bind: {}", e)))?;

    endpoint.set_default_client_config(client_config);

    let connection = endpoint.connect(peer_addr, "localhost")
        .map_err(|e| NetworkError::ConnectionFailed(format!("connect: {}", e)))?
        .await
        .map_err(|e| NetworkError::ConnectionFailed(format!("handshake: {}", e)))?;

    let (send, recv) = connection.open_bi().await
        .map_err(|e| NetworkError::ConnectionFailed(format!("open_bi: {}", e)))?;

    Ok(DirectConnection { connection, send, recv })
}
```

### Example 5: Unified PeerChannel Trait

```rust
/// Unified channel for communicating with a peer, regardless of transport
#[allow(async_fn_in_trait)]
pub trait PeerChannel: Send + Sync {
    /// Send a framed message to the peer
    async fn send_message(&mut self, data: &[u8]) -> Result<()>;

    /// Receive a framed message from the peer
    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize>;

    /// Close the channel gracefully
    async fn close(&mut self);

    /// Description of the transport for logging
    fn transport_description(&self) -> &str;
}

// Implement for RelayClient
impl PeerChannel for RelayClient {
    async fn send_message(&mut self, data: &[u8]) -> Result<()> {
        self.forward(data).await
    }
    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize> {
        self.receive(buf).await
    }
    async fn close(&mut self) {
        RelayClient::close(self).await;
    }
    fn transport_description(&self) -> &str {
        "relay"
    }
}

// Implement for DirectConnection
impl PeerChannel for DirectConnection {
    async fn send_message(&mut self, data: &[u8]) -> Result<()> {
        // Use same length-prefixed framing as QuicTransport
        let len: u32 = data.len().try_into().map_err(|_|
            NetworkError::ConnectionFailed("payload too large".into()))?;
        self.send.write_all(&len.to_be_bytes()).await?;
        self.send.write_all(data).await?;
        Ok(())
    }
    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize> {
        let mut len_buf = [0u8; 4];
        self.recv.read_exact(&mut len_buf).await?;
        let len = u32::from_be_bytes(len_buf) as usize;
        self.recv.read_exact(&mut buf[..len]).await?;
        Ok(len)
    }
    async fn close(&mut self) {
        self.connection.close(0u32.into(), b"done");
    }
    fn transport_description(&self) -> &str {
        "direct LAN"
    }
}
```

### Example 6: Connection Strategy with Fallback

```rust
pub async fn establish_connection(
    room_id: &[u8; 32],
    code_phrase: &str,
    relay_addr: SocketAddr,
    local_mode: bool,
    password_hash: Option<&[u8; 32]>,
    is_sender: bool,
) -> Result<Box<dyn PeerChannel>> {
    if local_mode {
        match try_direct_connection(room_id, is_sender).await {
            Ok(direct) => {
                tracing::info!("Direct LAN connection established");
                return Ok(Box::new(direct));
            }
            Err(e) => {
                tracing::warn!("Direct connection failed, falling back to relay: {}", e);
                // User-visible message handled by caller
            }
        }
    }

    // Relay fallback
    let mut relay = RelayClient::new(relay_addr);
    relay.connect(room_id, password_hash).await?;
    Ok(Box::new(relay))
}
```

---

## Gap Analysis

### What Exists (Functional)

| Component | File | Status |
|-----------|------|--------|
| `MdnsDiscovery` struct | `discovery/mdns.rs` | **Functional** -- advertise + browse + peer list |
| `DnsServiceRecord` | `discovery/dns_sd.rs` | **Functional** -- data structure only |
| `StunClient` | `nat/stun.rs` | **Functional** -- full STUN binding request |
| NAT type detection | `nat/detection.rs` | **Functional** -- classifies NAT type |
| UDP hole punching | `nat/hole_punch.rs` | **Functional** -- simultaneous punch with magic bytes |
| UPnP port mapping | `nat/upnp.rs` | **Functional** -- add/remove port mapping |
| TURN client | `nat/turn.rs` | **Partial** -- allocate + send, no receive/data relay |
| `QuicTransport` | `transport/quic.rs` | **Functional** -- client and server modes |
| `FallbackTransport` | `transport/fallback.rs` | **Functional** -- QUIC-first, TCP-TLS fallback |
| `Transport` trait | `transport/mod.rs` | **Functional** -- connect/send/receive |
| TLS self-signed certs | `transport/tls_config.rs` | **Functional** -- quinn + rustls configs |
| `BandwidthLimiter` | `transport/bandwidth.rs` | **Functional** -- token-bucket |
| Protocol negotiation | `transport/negotiation.rs` | **Functional** -- preference matching |
| `TallowCodec` | (tallow-protocol) | **Functional** -- postcard encode/decode |
| Wire `Message` enum | (tallow-protocol) | **Functional** -- all transfer messages |
| Send command | `commands/send.rs` | **Functional** -- has `--discover` flag, uses `RelayClient` |
| Receive command | `commands/receive.rs` | **Functional** -- has `--advertise` flag, uses `RelayClient` |
| `SignalingClient` | `signaling/client.rs` | **Stub** -- channel-based, no actual transport |

### What Needs to Be Built

| Component | Priority | Effort | Description |
|-----------|----------|--------|-------------|
| `PeerChannel` trait | **P0** | Medium | Unified abstraction over relay and direct connections |
| `DirectConnection` struct | **P0** | Medium | QUIC-based direct P2P connection implementing `PeerChannel` |
| `DirectListener` struct | **P0** | Medium | QUIC server that binds to a port, accepts one peer |
| Refactor `send.rs` / `receive.rs` | **P0** | Large | Replace `RelayClient` calls with `PeerChannel` trait usage |
| Room-code-filtered mDNS browse | **P1** | Small | Filter discovered services by room code hash in TXT record |
| mDNS service unregistration on Drop | **P1** | Small | Add `Drop` impl to `MdnsDiscovery` |
| `--local` CLI flag (send + receive) | **P1** | Small | CLI args to enable direct LAN mode |
| Connection strategy logic | **P1** | Medium | Try direct, fall back to relay, with timeout |
| Upgrade `mdns-sd` to 0.18.x | **P2** | Small | Newer API, interface selection support |
| IPv4 address preference | **P2** | Small | Prefer IPv4 over IPv6 link-local in mDNS results |
| `--interface` CLI flag | **P3** | Small | Manual network interface selection |
| Multi-peer selection UI | **P3** | Medium | When multiple peers discovered, list and let user choose |
| `tallow doctor` mDNS check | **P3** | Small | Diagnostic for mDNS/firewall issues |

### What Does NOT Need to Change

- **Wire protocol messages**: Direct connections use the exact same `FileOffer` -> `FileAccept` -> `Chunk` -> `Ack` -> `TransferComplete` flow. No new message variants needed.
- **E2E encryption**: Session key derivation, AES-256-GCM encryption, BLAKE3 integrity -- all unchanged. Transport is orthogonal to crypto.
- **Transfer pipeline**: `SendPipeline` and `ReceivePipeline` in tallow-protocol produce/consume `Message` objects. They are transport-agnostic already.
- **Codec**: `TallowCodec` encodes/decodes `Message` to bytes. Same codec for relay and direct.
- **Compression**: Applied at the protocol layer before encryption. Unaffected by transport.
- **Identity/fingerprints**: Same identity store, same fingerprint display.
- **History logging**: Same `TransferLog` regardless of transport.

---

## Discovery Protocol Design

### Service Type

```
_tallow._tcp.local.
```

This follows RFC 6763 conventions. The existing code already uses this. TCP is correct even though the underlying transport is QUIC (UDP) because DNS-SD service types describe the application-layer protocol, not the transport.

### Instance Naming

Each advertised service instance should use a randomized name incorporating the room code hash to enable filtering:

```
tallow-<room-code-hash-prefix-8hex>._tallow._tcp.local.
```

Example: `tallow-a3f7c2d1._tallow._tcp.local.`

This prevents instance name collisions when multiple Tallow transfers run on the same LAN.

### TXT Record Properties

| Key | Value | Purpose |
|-----|-------|---------|
| `v` | `"1"` | Protocol version for forward compatibility |
| `fp` | `"a3f7c2d1"` | Truncated identity fingerprint (8 hex chars) -- enough for disambiguation |
| `rc` | `"b4e8f1a2c3d5e7f9"` | Room code hash prefix (16 hex chars = 8 bytes) -- for receiver filtering |
| `ts` | `"1708444800"` | Unix timestamp -- for stale service detection |

### Discovery Flow (Full Sequence)

```
SENDER                              RECEIVER
------                              --------
1. Generate code phrase
2. Derive room_id = BLAKE3(code)
3. Bind QUIC endpoint to :0
4. Get bound port (e.g., 52341)
5. Advertise via mDNS:
   instance: tallow-<rc_prefix>
   port: 52341
   TXT: fp=..., rc=..., v=1, ts=...
6. Display code phrase to user
                                    7. User enters code phrase
                                    8. Derive room_id = BLAKE3(code)
                                    9. Browse mDNS for _tallow._tcp.local.
                                    10. Filter: rc TXT matches room_id prefix
                                    11. Found match -> get IP:port
                                    12. Connect QUIC to sender IP:port
13. Accept incoming QUIC connection
14. Accept bidirectional stream
                                    15. Open bidirectional stream
--- E2E handshake proceeds ---
16. Send FileOffer
                                    17. Receive FileOffer, prompt user
                                    18. Send FileAccept
19. Receive FileAccept
20. Send Chunk(0), Chunk(1), ...
                                    21. Receive chunks, send Acks
... (standard transfer protocol) ...
22. Send TransferComplete
                                    23. Verify integrity
24. Unregister mDNS service
25. Close QUIC endpoint
                                    26. Close QUIC endpoint
```

### Fallback Flow

```
RECEIVER
--------
1. Browse mDNS for 3 seconds
2. No matching service found (or connection to discovered peer fails)
3. Log: "LAN peer not found, connecting via relay..."
4. Connect to relay as normal
5. Proceed with standard relay transfer

SENDER (if --local fails)
------
1. Bind QUIC endpoint, advertise mDNS
2. Wait up to 10 seconds for incoming connection
3. No connection received
4. Log: "No LAN peer connected, falling back to relay..."
5. Unregister mDNS, close local endpoint
6. Connect to relay as normal
```

### Multiple Peer Selection

When the receiver discovers multiple `_tallow._tcp` services (multiple senders on the same LAN):

1. Filter by `rc` TXT property to match expected room code
2. If exactly one match: connect automatically
3. If multiple matches (same room code, different fingerprints): prompt user to select
4. If zero matches: fall back to relay

In practice, the room code hash filtering will almost always produce exactly 0 or 1 matches, since room codes are cryptographically derived.

---

## Performance Considerations

### LAN vs Relay Speed

The Phase 13 success criterion requires "direct transfer speed is at least 5x faster than relay transfer for files >10MB on a gigabit LAN." This is achievable because:

- **Relay path**: Client -> Internet -> Oracle Cloud (100Mbps) -> Internet -> Client. Limited by relay server bandwidth and round-trip latency.
- **Direct LAN path**: Client -> Switch -> Client. Limited by LAN bandwidth (1 Gbps typical) and zero internet latency.

On a gigabit LAN with 0.1ms RTT vs 100ms relay RTT, the direct path should be 100-1000x faster for throughput-limited transfers.

### QUIC Tuning for LAN

Default QUIC parameters are tuned for internet conditions. On LAN, we can be more aggressive:

```rust
let mut transport_config = quinn::TransportConfig::default();
// LAN: shorter idle timeout (no need for 5-minute relay waits)
transport_config.max_idle_timeout(Some(Duration::from_secs(30).try_into().unwrap()));
// LAN: larger initial congestion window (no internet congestion)
transport_config.initial_rtt(Duration::from_millis(1)); // LAN RTT is ~1ms
// LAN: allow more data in-flight
transport_config.send_window(8 * 1024 * 1024); // 8 MB send window
transport_config.receive_window(8u32.into()); // Not varint -- use quinn's VarInt
```

Note: Quinn's `TransportConfig` has specific types for some parameters. Check the quinn 0.11 API for exact method signatures.

### Chunk Size Optimization

The current chunk size is 64 KB (from the protocol spec). On LAN, larger chunks reduce per-chunk overhead:

- Consider 256 KB or 1 MB chunks for LAN direct transfers
- The chunk size could be negotiated during connection setup, or selected based on transport type
- However, changing chunk size affects the encryption nonce sequence and Merkle tree -- must be coordinated between sender and receiver

**Recommendation:** Keep 64 KB chunks in Phase 13 for simplicity. Chunk size optimization is a follow-up performance enhancement.

### mDNS Discovery Latency

Typical mDNS resolution time is 200-2000ms depending on:
- Whether the responder is already running (faster) or needs to start (slower)
- Network conditions (wired vs WiFi)
- OS mDNS cache state

The 3-second browse timeout in the existing code is appropriate. For the connection strategy with fallback, use a 5-second total timeout for discovery + connection attempt before falling back to relay.

### Memory Considerations

Direct connections avoid the relay's memory overhead but the client-side memory profile is unchanged: the same `SendPipeline` / `ReceivePipeline` buffers apply regardless of transport. No special memory optimization needed.

### Connection Establishment Time

| Step | Expected Time (LAN) |
|------|---------------------|
| mDNS browse + resolve | 200-2000ms |
| QUIC handshake (1-RTT) | ~2ms |
| TLS handshake | ~5ms |
| Total direct | 200-2000ms |
| Relay connect (comparison) | 100-300ms (already connected to internet) |

The mDNS discovery phase dominates. If the sender is already advertising when the receiver starts browsing, resolution happens within 200-500ms. The key optimization is to start mDNS browsing immediately while displaying the "connecting" message to the user.

### Concurrent Transfer Support

Multiple direct transfers can run simultaneously by binding separate QUIC endpoints on different ports. Each endpoint gets its own mDNS service advertisement with a unique room code hash. The `mdns-sd` daemon handles multiple registrations on a single daemon instance.

---

## Sources

- [mdns-sd crate on crates.io](https://crates.io/crates/mdns-sd)
- [mdns-sd API documentation](https://docs.rs/mdns-sd)
- [mdns-sd GitHub repository](https://github.com/keepsimple1/mdns-sd)
- [Quinn QUIC implementation](https://github.com/quinn-rs/quinn)
- [quic-send P2P file transfer](https://github.com/maxomatic458/quic-send)
- [qp2p - QUIC peer-to-peer library](https://github.com/maidsafe/qp2p)
- [libp2p mDNS spec](https://github.com/libp2p/specs/blob/master/discovery/mdns.md)
- [RFC 6762 - Multicast DNS](https://www.rfc-editor.org/rfc/rfc6762)
- [RFC 6763 - DNS-Based Service Discovery](https://www.rfc-editor.org/rfc/rfc6763)
- [Windows mDNS firewall issues](https://learn.microsoft.com/en-us/answers/questions/101168/mdns-not-sending-queries-to-the-network)
- [mDNS in enterprise environments](https://techcommunity.microsoft.com/blog/networkingblog/mdns-in-the-enterprise/3275777)
- [ant-quic NAT traversal extensions](https://crates.io/crates/ant-quic)
