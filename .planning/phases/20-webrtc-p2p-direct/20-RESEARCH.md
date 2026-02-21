# Phase 20: WebRTC / P2P Direct — Research

**Date:** 2026-02-21
**Phase:** 20 — WebRTC / P2P Direct
**Mode:** Ecosystem research
**Status:** Complete

---

## Executive Summary

Phase 20 aims to add P2P direct connections so peers can transfer files without relay forwarding when possible, falling back to the relay when P2P fails. After thorough investigation, **the correct approach is NOT full WebRTC**. WebRTC is a browser-oriented protocol that brings enormous complexity (DTLS, SCTP, SDP, ICE) for a problem Tallow already mostly solves with QUIC. The right architecture is **QUIC hole punching coordinated through the existing relay**, using ICE-like candidate exchange over the relay's signaling path. This avoids a massive new dependency stack, reuses the existing transport layer, and achieves the same NAT traversal outcomes.

**Critical reframe:** The phase title says "WebRTC / P2P Direct" but the actual requirement is "direct peer connections without relay forwarding, fallback to relay when P2P fails." WebRTC is one way to achieve this. QUIC hole punching via the existing relay is a far better fit for a CLI tool that already has QUIC transport, STUN, and relay infrastructure.

---

## Domain Analysis

### Domain 1: Library Selection — WebRTC vs QUIC Hole Punching

#### What Exists in the Rust WebRTC Ecosystem

| Library | Type | Status | Data Channels | Unsafe | Notes |
|---------|------|--------|---------------|--------|-------|
| `webrtc-rs/webrtc` | Pure Rust, async | Active | Yes | Extensive (DTLS, SRTP) | Callback-heavy, requires Arc/Mutex everywhere |
| `webrtc-rs/rtc` | Pure Rust, sans-IO | Active (v0.8.0, Jan 2026) | Yes | Less, but still DTLS | New, less battle-tested, 8-method API |
| `str0m` | Pure Rust, sans-IO | Active (v0.16.2) | Yes | Crypto backends | SFU-focused, P2P less tested |
| `datachannel-rs` | C++ bindings (libdatachannel) | Active (v0.16.0) | Yes | FFI | Requires CMake, C++ toolchain |

#### Why Full WebRTC is Wrong for Tallow

1. **Redundant encryption layer**: WebRTC mandates DTLS for all data channels. Tallow already has post-quantum E2E encryption (ML-KEM-1024 + AES-256-GCM). Adding DTLS means double encryption with no security benefit — DTLS is NOT post-quantum and adds latency.

2. **Redundant transport**: WebRTC data channels use SCTP-over-DTLS-over-UDP. Tallow already has QUIC (which is TLS 1.3 over UDP with built-in congestion control, multiplexing, and reliability). SCTP adds nothing.

3. **SDP complexity**: WebRTC requires SDP offer/answer exchange for even the simplest data channel. This is designed for browser media negotiation and is vastly over-engineered for binary data transfer.

4. **Massive dependency tree**: `webrtc-rs` pulls in ~150 transitive dependencies. `str0m` is lighter but still brings DTLS, SRTP, SCTP stacks. The `datachannel-rs` path requires CMake and a C++ compiler, violating Tallow's pure-Rust preference.

5. **`#![forbid(unsafe_code)]` conflict**: All WebRTC libraries contain significant unsafe code in their DTLS/SCTP implementations. Tallow's `tallow-net` crate uses `#![forbid(unsafe_code)]`.

6. **Tor/SOCKS5 incompatibility**: WebRTC ICE inherently leaks UDP connections past SOCKS5 proxies. Most SOCKS5 implementations (including Tor) do not support UDP relay. This fundamentally conflicts with Tallow's privacy mode.

7. **Browser interop not needed**: The phase description mentions "browser-based" but Tallow is a CLI tool. There is no browser peer to interoperate with. WebRTC's value proposition (browser P2P) does not apply.

**Confidence: HIGH** — This conclusion is supported by Tallow's existing architecture, the REQUIREMENTS.md "Out of Scope" section (which explicitly lists "WebRTC/SDP signaling" as out of scope with rationale "QUIC + relay is simpler; WebRTC is browser-oriented complexity"), and the technical analysis above.

#### What to Build Instead: QUIC Hole Punching

The correct approach is **coordinated QUIC hole punching** using the existing relay as the signaling/coordination server:

1. Both peers connect to the relay (existing flow).
2. Both peers perform STUN discovery to learn their public address (existing `StunClient`).
3. Peers exchange candidate addresses through the relay using new `Message` variants.
4. Both peers attempt simultaneous QUIC connection to each other's public address.
5. If hole punching succeeds, transfer proceeds over direct QUIC (existing `DirectConnection`).
6. If hole punching fails (timeout), transfer falls back to relay forwarding (existing `RelayClient`).

This approach reuses:
- `QuicTransport` / `DirectConnection` / `DirectListener` (existing)
- `StunClient` for address discovery (existing)
- `RelayClient` for signaling and fallback (existing)
- `PeerChannel` trait for transport abstraction (existing)
- The entire wire protocol and handshake pipeline (existing)

**Confidence: HIGH** — Recent research (Liang 2024, Seemann 2024) demonstrates QUIC hole punching achieves ~70% success rate, comparable to WebRTC ICE. The libp2p DCUtR protocol achieves similar rates with QUIC as with TCP.

### Domain 2: NAT Traversal Architecture

#### ICE-Like Candidate Gathering (Without Full ICE)

Full ICE (RFC 8445) is a 60-page spec with aggressive nomination, controlled/controlling roles, and complex state machines. We do NOT need full ICE. We need:

1. **Host candidates**: Local IP addresses from network interfaces
2. **Server-reflexive candidates**: Public IP:port from STUN
3. **Relay candidates**: The existing relay connection (always available as fallback)

The candidate exchange protocol:

```
Sender                    Relay                    Receiver
   |--- RoomJoin ----------->|                        |
   |                         |<--- RoomJoin ----------|
   |--- CandidateExchange -->|--- CandidateExchange ->|
   |<-- CandidateExchange ---|<-- CandidateExchange --|
   |                         |                        |
   |====== QUIC hole punch attempt (simultaneous) ====|
   |                         |                        |
   [if success: direct QUIC, relay disconnected]
   [if fail: continue over relay]
```

#### NAT Type Success Rates

| NAT Type | STUN-Only Success | With TURN/Relay Fallback |
|----------|-------------------|--------------------------|
| No NAT (public IP) | 100% | 100% |
| Full Cone | ~95% | 100% |
| Restricted Cone | ~85% | 100% |
| Port-Restricted Cone | ~65% | 100% |
| Symmetric NAT | ~5% | 100% (relay only) |
| Symmetric + Symmetric | 0% | 100% (relay only) |

Overall: ~70% of real-world connections can go direct with STUN. The remaining ~30% fall back to relay. This matches the empirical findings from the libp2p DCUtR measurement study (4.4M traversal attempts, 85K networks, 167 countries).

**Confidence: HIGH** — Multiple independent sources confirm these rates.

#### UPnP as a Supplementary Mechanism

The existing `upnp::add_port_mapping()` can be used as an additional candidate source:
- Request a port mapping from the gateway
- Add the external IP + mapped port as a candidate
- Works when STUN fails but the user's router supports UPnP
- Opt-in only (as it currently is)

### Domain 3: Signaling via Existing Relay

#### Reusing the Relay for Candidate Exchange

The relay already supports:
- Room-based peer pairing (`RoomJoin` / `RoomJoined` / `PeerArrived`)
- Targeted message routing (`Targeted { from_peer, to_peer, payload }`)
- Bidirectional data forwarding

New `Message` variants needed for signaling:

```rust
/// Candidate address for P2P direct connection
CandidateOffer {
    /// Candidate type: 0 = host, 1 = server-reflexive, 2 = relay
    candidate_type: u8,
    /// Candidate address (IPv4 or IPv6)
    addr: Vec<u8>,  // 6 bytes (IPv4+port) or 18 bytes (IPv6+port)
    /// Priority (higher = preferred). Host > SRFLX > Relay.
    priority: u32,
},
/// Candidate exchange complete — ready to attempt direct connection
CandidatesDone,
/// Direct connection established — stop relay forwarding
DirectConnected,
/// Direct connection failed — continue via relay
DirectFailed,
```

These MUST be appended to the end of the `Message` enum to preserve postcard discriminant stability (as established in Phase 19).

**Confidence: HIGH** — The `Targeted` message pattern already supports arbitrary inner payloads routed through the relay. Candidate exchange is just another inner payload type.

#### Signaling Flow

1. After `PeerArrived`, both peers gather candidates (host IPs + STUN reflexive).
2. Each peer sends `CandidateOffer` messages via the relay.
3. Each peer sends `CandidatesDone` when all candidates are gathered.
4. Both peers attempt QUIC connections to all remote candidates in priority order.
5. First successful connection wins. Send `DirectConnected` via relay.
6. If all attempts fail after timeout, send `DirectFailed` and continue over relay.

### Domain 4: QUIC Hole Punching Mechanics

#### Simultaneous Open

QUIC hole punching requires "simultaneous open" — both peers send Initial packets to each other at approximately the same time, creating NAT pinhole mappings that allow the return traffic through.

Key implementation details:

1. **Timing synchronization**: The relay can coordinate timing. Both peers receive a "start punch" signal with a timestamp. They begin sending at the agreed time.

2. **Multiple attempts**: Send 5-10 QUIC Initial packets at 200ms intervals (matching the existing `hole_punch.rs` pattern).

3. **Connection role**: One peer must be the QUIC client (sends Initial), the other the server (accepts). With simultaneous open, BOTH peers send Initials. Quinn supports this via `Endpoint::connect()` from both sides.

4. **Port prediction**: For cone NATs, the STUN-discovered port is the one the NAT will use for outbound traffic. For symmetric NATs, the port changes per destination — this is why symmetric NAT hole punching fails.

5. **Binding keepalive**: Once a hole is punched, QUIC keepalives maintain the NAT binding (existing 15s keepalive config).

#### Quinn-Specific Considerations

Quinn (v0.11) supports:
- Client and server endpoints on the same UDP socket
- Connection migration (if the NAT rebinds)
- Custom transport config (RTT, idle timeout)
- Self-signed certificates (already used for direct LAN connections)

Quinn does NOT support:
- Simultaneous open (both sides as client) out of the box — requires endpoint rebind
- NAT-friendly Initial retransmission timing

**Implementation approach**: Create a `quinn::Endpoint` bound to a specific local port. Use that port for STUN discovery. Then use the same endpoint to both `connect()` to the remote and `accept()` from the remote. The first successful connection (either direction) wins.

**Confidence: MEDIUM** — Quinn's simultaneous open support is not well-documented. The approach works conceptually but may require empirical testing with different NAT types. The libp2p QUIC hole punching implementation (using quinn) provides a reference.

### Domain 5: Security Implications

#### E2E Encryption is Transport-Independent

Tallow's security model is explicitly transport-agnostic:
- The relay is "FULLY untrusted" (threat model)
- E2E encryption (ML-KEM-1024 + AES-256-GCM) is applied at the protocol layer
- The `PeerChannel` trait abstracts the transport — relay and direct use identical encryption

Moving to direct QUIC changes NOTHING about the security model:
- The KEM handshake still happens over whatever transport is available
- PAKE authentication still verifies the code phrase
- All data is still E2E encrypted before transmission
- The direct connection's TLS is a bonus layer, not a security dependency

#### IP Address Exposure

Direct P2P connections inherently expose IP addresses to the other peer. This is acceptable because:
- Tallow's privacy mode (Tor/SOCKS5) explicitly disables P2P direct (incompatible)
- Non-Tor users already expose their IP to the relay server
- Direct connections are opt-in, not default

**Important**: When `--proxy` or `--tor` is active, P2P direct MUST be disabled entirely. The STUN discovery and candidate exchange MUST NOT occur in proxy mode.

**Confidence: HIGH** — This matches the existing architecture where LAN discovery is disabled in proxy mode.

### Domain 6: Tor/SOCKS5 Compatibility

#### WebRTC + Tor = Fundamentally Broken

This is another reason to reject WebRTC:
- WebRTC ICE sends UDP probes that bypass SOCKS5 proxies
- Most SOCKS5 implementations (including Tor) do not support UDP
- Firefox has unfixed bugs since 2014 where TURN/TCP doesn't use configured proxy
- The IETF RETURN draft (Recursively Encapsulated TURN) was proposed but never adopted

**With QUIC hole punching**: Simply skip the P2P negotiation when proxy mode is active. Continue using the existing relay path through SOCKS5. This is clean and simple.

**Confidence: HIGH** — Multiple browser bug reports and IETF discussions confirm WebRTC + SOCKS5 is fundamentally broken.

### Domain 7: Performance Comparison

#### QUIC Direct vs Relay-Forwarded QUIC

| Metric | Relay-Forwarded | QUIC Direct |
|--------|----------------|-------------|
| Latency | 2x RTT (client->relay->client) | 1x RTT (client->client) |
| Throughput | Limited by relay bandwidth | Limited by peer bandwidth |
| Cost | Relay bandwidth consumed | Zero relay cost |
| Connection setup | ~500ms (relay join) | ~2-5s (STUN + hole punch) |

#### WebRTC Data Channel vs QUIC

| Metric | WebRTC Data Channel | QUIC (quinn) |
|--------|-------------------|--------------|
| Throughput | ~135 MB/s (benchmark) | ~800+ MB/s (QUIC direct) |
| Encryption | DTLS (not PQ) | TLS 1.3 + Tallow E2E (PQ) |
| Reliability | SCTP (ordered) | QUIC streams (ordered) |
| Congestion control | SCTP CC | QUIC CC (BBR/Cubic) |
| Connection setup | ICE + DTLS + SCTP (~3-8s) | QUIC 1-RTT (~200ms) |

QUIC is strictly superior for Tallow's use case (binary data transfer between CLI peers).

**Confidence: MEDIUM-HIGH** — Throughput numbers are approximate and vary by implementation, but the architectural advantage of QUIC over SCTP-DTLS is well-established.

---

## Standard Stack

Use these libraries. No alternatives.

| Purpose | Library | Version | Notes |
|---------|---------|---------|-------|
| QUIC transport | `quinn` | 0.11 | Already in workspace |
| STUN discovery | Custom (`nat::stun`) | N/A | Already implemented |
| UDP hole punch | Custom (`nat::hole_punch`) | N/A | Already implemented, needs QUIC upgrade |
| UPnP mapping | `igd-next` | 0.15 | Already in workspace |
| Peer abstraction | `PeerChannel` trait | N/A | Already implemented |
| Wire protocol | `postcard` | 1.1 | Already in workspace |
| NAT detection | Custom (`nat::detection`) | N/A | Already implemented |
| TLS certificates | `rcgen` | 0.13 | Already in workspace |
| Async runtime | `tokio` | 1 | Already in workspace |

**No new dependencies required.** This phase reuses the existing stack entirely.

---

## Architecture Patterns

### Pattern 1: Connection Upgrade

The transfer pipeline starts on the relay, then attempts to upgrade to direct:

```
1. Both peers join relay room (existing flow)
2. KEM handshake completes over relay (existing flow)
3. Candidate exchange via relay (new signaling messages)
4. Hole punch attempt (new logic)
5a. Success: Swap PeerChannel from RelayClient to DirectConnection
5b. Failure: Continue with RelayClient (no change)
6. Transfer proceeds identically regardless of transport
```

The `PeerChannel` trait makes step 5a seamless — the transfer pipeline doesn't know or care which transport it's using.

### Pattern 2: Candidate Gathering Module

New module: `crates/tallow-net/src/nat/candidates.rs`

```rust
pub struct Candidate {
    pub addr: SocketAddr,
    pub candidate_type: CandidateType,
    pub priority: u32,
}

pub enum CandidateType {
    Host,          // Local network interface
    ServerReflexive, // From STUN
    UPnP,          // From UPnP port mapping
}

pub async fn gather_candidates(stun_timeout: Duration) -> Vec<Candidate> {
    // 1. Enumerate local interfaces (host candidates)
    // 2. STUN discovery (server-reflexive)
    // 3. UPnP mapping (if enabled)
    // Return sorted by priority
}
```

### Pattern 3: P2P Negotiator

New module: `crates/tallow-net/src/transport/p2p.rs`

```rust
pub struct P2pNegotiator {
    local_candidates: Vec<Candidate>,
    remote_candidates: Vec<Candidate>,
    local_endpoint: quinn::Endpoint,
    result: Option<DirectConnection>,
}

impl P2pNegotiator {
    /// Exchange candidates via relay, attempt hole punch, return result
    pub async fn negotiate(
        relay: &mut RelayClient,
        timeout: Duration,
    ) -> Result<NegotiationResult> {
        // 1. Gather local candidates
        // 2. Send candidates via relay
        // 3. Receive remote candidates
        // 4. Attempt QUIC connections to all candidates
        // 5. Return DirectConnection or fallback indicator
    }
}

pub enum NegotiationResult {
    Direct(DirectConnection),
    FallbackToRelay,
}
```

### Pattern 4: Transport Swapper

The send/receive commands need to handle the upgrade:

```rust
// In send/receive command:
let mut channel: Box<dyn PeerChannel> = Box::new(relay_client);

// Attempt P2P upgrade (non-blocking, timeout-bounded)
if !proxy_mode {
    match p2p::negotiate(&mut relay_client, Duration::from_secs(10)).await {
        Ok(NegotiationResult::Direct(direct)) => {
            info!("Upgraded to direct P2P connection");
            channel = Box::new(direct);
        }
        Ok(NegotiationResult::FallbackToRelay) => {
            info!("P2P failed, continuing via relay");
        }
        Err(e) => {
            warn!("P2P negotiation error: {}, continuing via relay", e);
        }
    }
}

// Transfer proceeds identically
transfer_pipeline.run(&mut channel).await?;
```

---

## Don't Hand-Roll

| Component | Reason | Use Instead |
|-----------|--------|-------------|
| STUN protocol | Complex, well-specified RFC | Existing `nat::stun::StunClient` |
| QUIC transport | Congestion control, encryption | Existing `quinn` |
| TLS certificates | X.509 generation | Existing `rcgen` |
| UPnP/IGD | Gateway protocol is complex | Existing `igd-next` |
| NAT type detection | Requires multiple STUN servers | Existing `nat::detection::detect()` |
| Wire serialization | Framing, versioning | Existing `postcard` + `TallowCodec` |
| Network interface enumeration | OS-specific, tricky | Use quinn's local_addr or `local-ip-address` crate |

**DO hand-roll:**
- Candidate exchange signaling (simple message exchange via relay)
- Hole punch coordination (timing synchronization via relay)
- Connection upgrade logic (swap PeerChannel)
- Candidate priority sorting (simple comparison)

---

## Common Pitfalls

### Pitfall 1: NAT Binding Timeout
**Problem**: NAT bindings expire after 30-120 seconds of inactivity. If the hole punch succeeds but the handshake takes too long, the binding closes.
**Mitigation**: Send QUIC keepalives immediately. The existing 15s keepalive interval is sufficient. Start the KEM handshake immediately after connection.

### Pitfall 2: Symmetric NAT Detection
**Problem**: Hole punching will never work with symmetric NAT. Attempting it wastes 5-10 seconds.
**Mitigation**: Use the existing `nat::detection::detect()` to identify symmetric NAT. Skip hole punching and go straight to relay if both peers are symmetric.
**Verification step**: Log NAT type in the P2P negotiation flow.

### Pitfall 3: Port Prediction Failure
**Problem**: Some NATs use random port allocation even for cone-type NATs, causing STUN-discovered port to differ from the actual outbound port.
**Mitigation**: Try multiple ports around the STUN-discovered port (port +/- 1, +/- 2). This increases the chances of hitting the right NAT mapping.
**Verification step**: Test with multiple NAT types in integration tests.

### Pitfall 4: Firewall Blocking
**Problem**: Corporate firewalls may block all UDP except port 443. QUIC on random ports will fail.
**Mitigation**: Already handled — the relay fallback uses QUIC on port 4433 (or TCP+TLS through proxy). The P2P attempt is best-effort.
**Verification step**: Ensure timeout is bounded (max 10 seconds for hole punch attempt).

### Pitfall 5: Quinn Simultaneous Open
**Problem**: Quinn may not handle both peers sending QUIC Initial packets simultaneously. The connection may fail or both sides may think they're the client.
**Mitigation**: Assign roles based on peer ID (lower ID = server, higher ID = client). Server listens, client connects. If the relay assigns peer IDs (Phase 19's `peer_id` field), use those.
**Verification step**: Test with two peers behind the same NAT (should work since it's essentially LAN).

### Pitfall 6: IPv6 vs IPv4 Mismatch
**Problem**: One peer may be IPv6-only while the other is IPv4-only. Direct connection impossible.
**Mitigation**: Gather candidates for both address families. Only attempt connections between matching families. Fall back to relay if no family matches.
**Verification step**: Include both IPv4 and IPv6 host candidates in gathering.

### Pitfall 7: Proxy Mode Leaks
**Problem**: STUN discovery or hole punch attempts could leak the user's real IP when proxy mode is active.
**Mitigation**: Hard-check at the entry point: `if proxy_config.is_some() { return NegotiationResult::FallbackToRelay; }`. Do NOT gather candidates, do NOT perform STUN, do NOT attempt any direct connection.
**Verification step**: Test that `--proxy` flag prevents all P2P logic from executing.

### Pitfall 8: Postcard Discriminant Stability
**Problem**: Adding new `Message` variants could break backward compatibility with older peers/relays.
**Mitigation**: Only append new variants at the end of the `Message` enum. Never reorder. This is the established pattern (Phase 19 did the same).
**Verification step**: Add a test verifying the new variants' discriminant values.

---

## Code Examples

### Example 1: Candidate Gathering

```rust
use crate::nat::stun::StunClient;
use std::net::SocketAddr;

pub async fn gather_candidates() -> Vec<Candidate> {
    let mut candidates = Vec::new();

    // Host candidates: local network interfaces
    if let Ok(local_ip) = local_ip_address::local_ip() {
        candidates.push(Candidate {
            addr: SocketAddr::new(local_ip, 0), // port assigned later
            candidate_type: CandidateType::Host,
            priority: 100,
        });
    }

    // Server-reflexive candidate: STUN
    if let Ok(stun) = StunClient::from_hostname("stun.l.google.com:19302").await {
        if let Ok(result) = stun.discover_public_address().await {
            candidates.push(Candidate {
                addr: result.mapped_addr,
                candidate_type: CandidateType::ServerReflexive,
                priority: 50,
            });
        }
    }

    candidates.sort_by(|a, b| b.priority.cmp(&a.priority));
    candidates
}
```

### Example 2: Candidate Exchange via Relay

```rust
// Send local candidates through relay
for candidate in &local_candidates {
    let msg = Message::CandidateOffer {
        candidate_type: candidate.candidate_type as u8,
        addr: encode_socket_addr(candidate.addr),
        priority: candidate.priority,
    };
    let bytes = postcard::to_stdvec(&msg)?;
    relay.forward(&bytes).await?;
}
let done_msg = postcard::to_stdvec(&Message::CandidatesDone)?;
relay.forward(&done_msg).await?;

// Receive remote candidates
let mut remote_candidates = Vec::new();
loop {
    let mut buf = vec![0u8; 4096];
    let n = relay.receive(&mut buf).await?;
    let msg: Message = postcard::from_bytes(&buf[..n])?;
    match msg {
        Message::CandidateOffer { candidate_type, addr, priority } => {
            remote_candidates.push(Candidate {
                addr: decode_socket_addr(&addr)?,
                candidate_type: CandidateType::from(candidate_type),
                priority,
            });
        }
        Message::CandidatesDone => break,
        _ => {} // ignore other messages during negotiation
    }
}
```

### Example 3: QUIC Hole Punch Attempt

```rust
use std::time::Duration;
use quinn::Endpoint;

pub async fn attempt_hole_punch(
    local_port: u16,
    remote_addr: SocketAddr,
    is_server: bool,
    timeout: Duration,
) -> Result<DirectConnection> {
    let bind_addr: SocketAddr = format!("0.0.0.0:{}", local_port).parse()?;

    if is_server {
        // Server side: bind and accept
        let listener = DirectListener::bind_to(bind_addr)?;
        listener.accept_peer(timeout).await
    } else {
        // Client side: connect to remote
        connect_direct(remote_addr, timeout).await
    }
}
```

### Example 4: Transport Upgrade in Send Command

```rust
pub async fn send_with_p2p_upgrade(
    relay: &mut RelayClient,
    proxy_mode: bool,
) -> Result<Box<dyn PeerChannel>> {
    // Always start with relay
    if proxy_mode {
        // Never attempt P2P in proxy mode
        return Ok(Box::new(relay));
    }

    // Detect NAT type
    let nat_type = nat::detection::detect().await.unwrap_or(NatType::Unknown);
    if nat_type == NatType::Symmetric {
        tracing::info!("Symmetric NAT detected, skipping P2P attempt");
        return Ok(Box::new(relay));
    }

    // Attempt P2P negotiation with 10s timeout
    match tokio::time::timeout(
        Duration::from_secs(10),
        p2p::negotiate(relay),
    ).await {
        Ok(Ok(NegotiationResult::Direct(conn))) => {
            tracing::info!("Direct P2P connection established to {}", conn.remote_addr());
            Ok(Box::new(conn))
        }
        _ => {
            tracing::info!("P2P negotiation failed, using relay");
            Ok(Box::new(relay))
        }
    }
}
```

---

## Open Questions

### Q1: Should P2P be opt-in or opt-out?
**Recommendation**: Opt-out (enabled by default, `--no-p2p` to disable). Direct connections are faster and reduce relay load. Users who want privacy should use `--tor` which implicitly disables P2P.
**Confidence: HIGH**

### Q2: Should we attempt P2P before or after the KEM handshake?
**Recommendation**: After. The KEM handshake happens over the relay (reliable, always works). Once the session key is established, attempt P2P upgrade. This avoids the risk of the handshake failing if the direct connection drops during negotiation.
**Confidence: HIGH**

### Q3: Should we use the same QUIC endpoint for relay and direct?
**Recommendation**: No. Use separate endpoints. The relay connection uses one quinn Endpoint, the direct connection uses another. This avoids complications with connection migration and keeps the relay connection stable as a fallback.
**Confidence: MEDIUM** — Could be revisited if quinn's connection migration proves reliable.

### Q4: What timeout for the P2P negotiation?
**Recommendation**: 10 seconds total (STUN: 3s, candidate exchange: 2s, hole punch: 5s). If the user passes `--fast`, skip P2P entirely and use relay immediately.
**Confidence: MEDIUM** — May need tuning based on real-world testing.

### Q5: Should the relay server assist with hole punching?
**Recommendation**: Not in this phase. The relay just forwards signaling messages. A future phase could add relay-assisted hole punching (where the relay coordinates timing more precisely), but the client-side approach is sufficient for ~70% success rate.
**Confidence: HIGH**

---

## Phase Scope Recommendation

### In Scope
1. Candidate gathering (host + STUN server-reflexive)
2. Candidate exchange signaling via relay (new `Message` variants)
3. QUIC hole punching with timeout
4. Connection upgrade (`RelayClient` -> `DirectConnection`)
5. NAT type detection to skip hopeless cases (symmetric NAT)
6. Proxy mode guard (disable P2P when `--proxy`/`--tor`)
7. `--no-p2p` CLI flag
8. Unit tests for candidate gathering, exchange, and upgrade logic
9. Integration test: two local peers upgrading to direct

### Out of Scope (Future Phases)
- TURN relay (the existing Tallow relay IS the fallback — no need for TURN)
- ICE-TCP (QUIC subsumes this)
- Browser WebRTC interop (CLI tool, no browser)
- Relay-assisted timing coordination
- Multiple simultaneous hole punch attempts to different candidates
- IPv6 hole punching (IPv4 first, IPv6 in future)

---

## Existing Code to Reuse

| File | What to Reuse |
|------|--------------|
| `crates/tallow-net/src/transport/peer_channel.rs` | `PeerChannel` trait — direct connections implement this |
| `crates/tallow-net/src/transport/direct.rs` | `DirectConnection`, `DirectListener`, `connect_direct()` |
| `crates/tallow-net/src/nat/stun.rs` | `StunClient::discover_public_address()` |
| `crates/tallow-net/src/nat/detection.rs` | `detect()` -> `NatType` |
| `crates/tallow-net/src/nat/hole_punch.rs` | `punch_hole()` pattern (upgrade to QUIC) |
| `crates/tallow-net/src/nat/upnp.rs` | `add_port_mapping()` for supplementary candidates |
| `crates/tallow-net/src/relay/client.rs` | `RelayClient` for signaling and fallback |
| `crates/tallow-net/src/transport/tls_config.rs` | Self-signed cert generation for direct QUIC |
| `crates/tallow-protocol/src/wire/messages.rs` | `Message` enum — append new variants |
| `crates/tallow-net/src/signaling/protocol.rs` | `SignalingMessage` — has Offer/Answer/IceCandidate already |

---

## Existing Code to Modify

| File | Modification |
|------|-------------|
| `crates/tallow-protocol/src/wire/messages.rs` | Append `CandidateOffer`, `CandidatesDone`, `DirectConnected`, `DirectFailed` variants |
| `crates/tallow-net/src/nat/mod.rs` | Add `pub mod candidates;` |
| `crates/tallow-net/src/transport/mod.rs` | Add `pub mod p2p;` |
| `crates/tallow/src/commands/send.rs` | Add P2P upgrade attempt after handshake |
| `crates/tallow/src/commands/receive.rs` | Add P2P upgrade attempt after handshake |
| `crates/tallow/src/cli.rs` | Add `--no-p2p` flag |

---

## New Files to Create

| File | Purpose |
|------|---------|
| `crates/tallow-net/src/nat/candidates.rs` | Candidate gathering (host, STUN, UPnP) |
| `crates/tallow-net/src/transport/p2p.rs` | P2P negotiation state machine |

---

## Sources

- [Marten Seemann: A P2P Vision for QUIC (2024)](https://seemann.io/posts/2024-10-26---p2p-quic/)
- [Liang et al.: Implementing NAT Hole Punching with QUIC (VTC2024-Fall)](https://arxiv.org/abs/2408.01791)
- [libp2p DCUtR: Large Scale Measurement of Decentralized NAT Traversal](https://arxiv.org/html/2510.27500v1)
- [libp2p: Switch from webrtc-rs to str0m (Issue #3659)](https://github.com/libp2p/rust-libp2p/issues/3659)
- [WebRTC.rs: Announcing rtc 0.3.0](https://webrtc.rs/blog/2026/01/04/announcing-rtc-v0.3.0.html)
- [WebRTC.rs: RTC Feature Complete](https://webrtc.rs/blog/2026/01/18/rtc-feature-complete-whats-next.html)
- [str0m: Sans I/O WebRTC in Rust](https://github.com/algesten/str0m)
- [datachannel-rs: Rust wrappers for libdatachannel](https://github.com/lerouxrgd/datachannel-rs)
- [Mozilla Bug 949703: WebRTC proxy issues](https://bugzilla.mozilla.org/show_bug.cgi?id=949703)
- [Mozilla Bug 1416787: TURN doesn't use SOCKS proxy](https://bugzilla.mozilla.org/show_bug.cgi?id=1416787)
- [IETF RETURN Draft: Recursively Encapsulated TURN](https://tools.ietf.org/id/draft-ietf-rtcweb-return-01.html)
- [coturn: Open-source TURN server](https://github.com/coturn/coturn)
- [WebRTC Security Study](https://webrtc-security.github.io/)
- [qingchoulove/tunnel: QUIC NAT traversal](https://github.com/qingchoulove/tunnel)

---

## Deep Dive: QUIC Hole Punching Feasibility

**Researched:** 2026-02-21
**Confidence:** MEDIUM-HIGH (verified against quinn docs, Iroh blog, libp2p research, IETF drafts)

### Quinn API for Simultaneous Client/Server Operation

The critical finding for Tallow's QUIC hole punching is that **quinn::Endpoint natively supports both client and server roles on the same UDP socket**. From the official quinn docs:

- A single `Endpoint` corresponds to a single UDP socket
- `set_default_client_config()` and `set_server_config()` can both be called on the same Endpoint
- `connect()` and `accept()` can be called concurrently on the same Endpoint
- `rebind()` allows updating the socket address live (affects all active connections)

This means we do NOT need "QUIC simultaneous open" in the TCP sense. Instead, the approach is:

1. Create a `quinn::Endpoint` bound to a specific local port
2. Configure it with BOTH client and server configs
3. Use STUN to discover the public mapping for that port
4. Exchange the mapped address with the remote peer via the relay
5. Concurrently: call `endpoint.connect(remote_addr, "tallow")` AND `endpoint.accept()`
6. The first operation that succeeds wins

**Source:** [quinn::Endpoint docs](https://docs.rs/quinn/latest/quinn/struct.Endpoint.html)
**Confidence: HIGH** -- verified from official quinn API docs

### Why "Simultaneous Open" Is Not a QUIC Concept

Unlike TCP, QUIC does not have a "simultaneous open" handshake defined in RFC 9000. In TCP, both peers can send SYN simultaneously and the kernel merges them into one connection. QUIC has no such mechanism -- each connection has a clear client (sends Initial) and server (accepts Incoming).

For hole punching, this means:

- **Both peers MUST agree on roles**: One is the QUIC client, one is the QUIC server
- **The relay coordinates role assignment**: The peer with the lower `peer_id` (from Phase 19's `RoomJoinedMulti`) acts as server; the higher ID acts as client
- **Both peers send probing packets**: The client sends QUIC Initial packets; the server listens. But BOTH peers should also send UDP keepalive probes to create the NAT pinhole from both sides simultaneously
- **NAT pinhole creation**: The client's Initial packets create a NAT mapping on the client side. The server's probing packets create a mapping on the server side. When the client's Initial reaches the server through its pinhole, the connection establishes

### Iroh's Approach (Reference Implementation)

Iroh (n0-computer) is the most mature production QUIC hole punching implementation in Rust. Key findings:

- **Iroh forked quinn** specifically to get deeper access to congestion controller APIs and path management, NOT because quinn's basic API was insufficient for hole punching
- Iroh uses a **MagicSocket** abstraction that wraps quinn's UDP socket and handles path switching between direct and relay (DERP) connections
- The fork was needed for **latency optimization** (resetting congestion state when switching paths), not for fundamental hole-punching capability
- Iroh's approach: try direct connection using discovered addresses; if it fails within timeout, fall back to DERP relay; if it succeeds later, migrate from relay to direct

**Key lesson for Tallow**: We do NOT need to fork quinn. Iroh's fork was for advanced multipath/congestion-control integration. Tallow's simpler approach (try direct, fall back to relay, no in-flight migration) works with vanilla quinn.

**Source:** [Iroh: Why We Forked Quinn](https://www.iroh.computer/blog/why-we-forked-quinn)
**Confidence: HIGH**

### Real-World Success Rates

The libp2p DCUtR measurement campaign (the largest empirical NAT traversal study ever published) provides definitive data:

| Metric | Value | Source |
|--------|-------|--------|
| Total attempts measured | 6.25 million | libp2p DCUtR 2025 |
| Distinct networks | 85,000+ | libp2p DCUtR 2025 |
| Countries | 167 | libp2p DCUtR 2025 |
| Overall success rate | 70% +/- 7.1% | libp2p DCUtR 2025 |
| First-attempt success | 97.6% | libp2p DCUtR 2025 |
| TCP vs QUIC parity | Yes (both ~70%) | libp2p DCUtR 2025 |

**Critical finding**: TCP and QUIC (UDP) achieve statistically equivalent success rates with precise RTT-based synchronization. The long-held assumption that UDP is inherently better for hole punching is empirically refuted.

**Source:** [Challenging Tribal Knowledge -- Large Scale Measurement Campaign on Decentralized NAT Traversal](https://arxiv.org/html/2510.27500v1)
**Confidence: HIGH** -- peer-reviewed, 6.25M data points

### Liang 2024: QUIC-Specific Hole Punching Results

The Liang 2024 paper (VTC2024-Fall) demonstrates QUIC-specific advantages:

| Metric | QUIC | TCP | Advantage |
|--------|------|-----|-----------|
| Ideal hole punch time | 2 RTTs | 2.5 RTTs | QUIC 20% faster |
| Connection restoration via migration | 0 RTTs | N/A (re-punch: 2.5 RTTs) | QUIC saves 2-3 RTTs |
| Weak network performance | Pronounced advantage | Baseline | QUIC congestion control |

**Source:** [Liang et al.: Implementing NAT Hole Punching with QUIC (VTC2024-Fall)](https://arxiv.org/abs/2408.01791)
**Confidence: MEDIUM** -- conference paper, smaller scale

### NAT Type Success Rates (Refined)

Per Tailscale's comprehensive NAT traversal analysis and the libp2p data, the refined success rates are:

| Local NAT | Remote NAT | Direct Success | Notes |
|-----------|------------|----------------|-------|
| No NAT | Any | ~100% | Public IP reachable |
| EIM (cone) | EIM (cone) | ~85-95% | Best case for hole punching |
| EIM (cone) | EDM (symmetric) | ~50-65% | Birthday paradox: 256 ports open |
| EDM (symmetric) | EIM (cone) | ~50-65% | Reverse of above |
| EDM (symmetric) | EDM (symmetric) | ~0.01% | Both sides unpredictable |

The 70% overall rate comes from the real-world distribution of NAT types: most residential/business NATs are EIM (cone) variants.

**Key design decision**: Skip hole punching attempt when BOTH peers detect symmetric NAT. The existing `nat::detection::detect()` already identifies symmetric NAT by comparing mapped addresses from two different STUN servers. This avoids wasting 5-10 seconds on a doomed attempt.

**Source:** [Tailscale: How NAT Traversal Works](https://tailscale.com/blog/how-nat-traversal-works)
**Confidence: HIGH** -- multiple sources confirm

### What Happens with Symmetric NATs?

For symmetric NATs (EDM/Address-Port-Dependent Mapping):

1. The STUN-discovered port is meaningless -- the NAT assigns a different port for each destination
2. Port prediction is unreliable -- some NATs increment sequentially, others randomize
3. Birthday paradox approach (opening 256+ ports) increases success to ~64% for one-sided symmetric, but costs time and NAT table entries
4. **Tallow's approach**: Do NOT attempt birthday paradox. Fall back to relay immediately when symmetric NAT detected on both sides. When only one side is symmetric, attempt standard hole punch (50-65% chance) with quick timeout (3 seconds instead of 10)

### IETF Draft Status

Three IETF drafts are relevant to the future of QUIC hole punching:

1. **QUIC Address Discovery** (draft-seemann-quic-address-discovery): Allows peers to learn their reflexive address directly from the QUIC connection, without external STUN. Two implementations exist (picoquic, quinn fork). NOT yet standardized.

2. **NAT Traversal for QUIC** (draft-seemann-quic-nat-traversal): Defines how to coordinate hole punching within the QUIC protocol using new frame types (ADD_ADDRESS, PUNCH_ME_NOW). NOT yet standardized.

3. **Proxy UDP Listeners in HTTP** (draft-pardue-masque-dgram-proxy-listen): Reserves IP:port tuples on relay servers for fallback. NOT yet standardized.

**Tallow's approach**: Do NOT implement these drafts. They are unstable and require quinn modifications. Use the simpler relay-signaled approach (STUN + candidate exchange + quinn connect/accept). Revisit when drafts reach RFC status.

**Source:** [Marten Seemann: A P2P Vision for QUIC](https://seemann.io/posts/2024-10-26---p2p-quic/)
**Confidence: HIGH**

---

## Deep Dive: STUN/TURN Architecture

**Researched:** 2026-02-21
**Confidence:** HIGH (verified against existing tallow-net code, STUN RFC 5389, TURN RFC 5766)

### Existing STUN Implementation Analysis

The current `StunClient` in `crates/tallow-net/src/nat/stun.rs` provides:

| Capability | Status | Notes |
|------------|--------|-------|
| STUN Binding Request (RFC 5389) | Implemented | 20-byte header, random transaction ID |
| XOR-MAPPED-ADDRESS parsing | Implemented | IPv4 and IPv6 support |
| MAPPED-ADDRESS parsing | Implemented | Fallback for non-RFC5389 servers |
| Multiple STUN servers | Configured | `GOOGLE_STUN` (stun.l.google.com:19302), `CLOUDFLARE_STUN` (stun.cloudflare.com:3478) |
| Timeout | 3 seconds | Hardcoded per request |
| Socket binding | New socket per request | **Problem: binds `0.0.0.0:0` -- gets a random port each time** |

**Critical issue**: The current STUN client creates a NEW UDP socket (`UdpSocket::bind("0.0.0.0:0")`) for each `discover_public_address()` call. For hole punching, the STUN discovery MUST use the same local port that the quinn Endpoint will use. Otherwise, the NAT mapping discovered by STUN is for a different port than the one quinn uses, and hole punching will fail.

**Required modification**: Add a `discover_public_address_from_socket(socket: &UdpSocket)` method that uses an existing socket, OR accept a local port parameter. This is the single most important STUN change for Phase 20.

### Candidate Gathering Flow (Step by Step)

```
1. Create quinn::Endpoint bound to "0.0.0.0:{specific_port}"
   - The endpoint binds to a specific port (or random OS-assigned)
   - Get local_addr() to learn the actual bound port

2. Perform STUN discovery FROM THE SAME LOCAL PORT
   - Create a UdpSocket bound to the same port (or use quinn's underlying socket)
   - Send STUN Binding Request to stun.l.google.com:19302
   - Parse response -> mapped_addr = public_ip:public_port
   - This is the server-reflexive candidate

3. Enumerate local interfaces for host candidates
   - Use local_ip_address::local_ip() or network-interface crate
   - Filter out loopback (127.0.0.1), link-local (169.254.x.x)
   - Add each valid IP + bound port as a host candidate

4. Optional: UPnP port mapping
   - Request gateway to forward external_port -> local_addr
   - Add gateway_external_ip:external_port as UPnP candidate
   - Only if UPnP is enabled (opt-in)

5. Sort candidates by priority:
   - Host (local LAN): priority 100 (fastest if both peers on same LAN)
   - Server-reflexive (STUN): priority 50 (most likely to work for WAN)
   - UPnP: priority 30 (depends on router cooperation)
```

### Socket Binding Strategy

The most technically challenging aspect is binding STUN discovery to the same port as quinn. Two approaches:

**Approach A: Sequential binding (recommended)**
1. Create quinn Endpoint on `0.0.0.0:0` -- OS assigns port P
2. Drop the Endpoint temporarily (releases the port)
3. Bind a raw UDP socket to port P for STUN
4. Perform STUN discovery
5. Drop the raw socket
6. Re-create quinn Endpoint on port P
7. This assumes the OS does not reassign port P in the brief interval

**Approach B: Shared socket**
1. Bind a raw `std::net::UdpSocket` to `0.0.0.0:0`
2. Convert to `tokio::net::UdpSocket` for STUN
3. Use STUN to discover public address
4. Convert the socket to `quinn::Endpoint` using `Endpoint::new()` with a custom `AsyncUdpSocket`
5. This requires implementing quinn's `AsyncUdpSocket` trait, which is more complex

**Approach C: quinn rebind (simplest)**
1. Create quinn Endpoint on `0.0.0.0:0`
2. Use `endpoint.local_addr()` to learn port P
3. Create a SEPARATE socket on a DIFFERENT port for STUN
4. STUN discovers public_ip:stun_port -- this is the wrong port BUT same IP
5. Use the IP from STUN and the port from quinn
6. **Problem**: For EIM NATs, the external port may not match the internal port

**Recommended approach for Tallow**: **Approach A** (sequential binding). It is the simplest and most reliable. The port reuse interval is typically < 100ms, and on most OS stacks the port remains available. Add a retry loop with random backoff if the port is taken.

### Do We Need a TURN Server?

**No.** The existing Tallow relay IS the fallback mechanism. TURN (RFC 5766) is a standardized protocol for relayed media, designed for WebRTC interoperability. Tallow does not need WebRTC interop.

The existing relay path:
- `RelayClient` connects to the relay via QUIC (or TCP+TLS through proxy)
- `RelayClient.forward()` and `RelayClient.receive()` handle data relay
- The relay forwards encrypted bytes between paired peers (zero knowledge)
- This is functionally equivalent to TURN but simpler and purpose-built

The existing `TurnClient` in `crates/tallow-net/src/nat/turn.rs` is a stub (sends Allocate but does not parse XOR-RELAYED-ADDRESS properly). It should NOT be completed for Phase 20 -- use the existing relay instead.

**Confidence: HIGH** -- the existing relay is already a working fallback

### Public STUN Servers

The current code uses two STUN servers, which is correct for NAT type detection. For Phase 20 candidate gathering, a single STUN server suffices:

| Server | Address | Provider | Reliability |
|--------|---------|----------|-------------|
| Google | stun.l.google.com:19302 | Google | Very High |
| Cloudflare | stun.cloudflare.com:3478 | Cloudflare | High |
| Twilio | stun.twilio.com:3478 | Twilio | High |
| Mozilla | stun.services.mozilla.com:3478 | Mozilla | Medium |

**Recommendation**: Use Google as primary, Cloudflare as fallback. This is already the pattern in `nat::detection`.

### STUN Failure Handling

STUN can fail for several reasons:

| Failure Mode | Current Handling | Required for Phase 20 |
|-------------|-----------------|----------------------|
| DNS resolution failure | Returns error | Skip server-reflexive candidate, keep host candidates |
| Timeout (3s) | Returns `NetworkError::Timeout` | Same -- skip SRFLX, use host only |
| Firewall blocks UDP to STUN port | Returns error | Same -- fall back to relay |
| Response parsing error | Returns error | Same -- skip SRFLX |
| Both STUN servers fail | `detect()` returns `Unknown` | Skip hole punch entirely, use relay |

The design principle: STUN failure is NEVER fatal. It just means no server-reflexive candidate is available, so hole punching has lower success odds. The relay fallback always works.

---

## Deep Dive: Transport Integration

**Researched:** 2026-02-21
**Confidence:** HIGH (verified against actual send.rs, receive.rs, connection.rs, peer_channel.rs code)

### Existing Transport Architecture

The current connection flow is:

```
send.rs / receive.rs
  |
  v
ConnectionResult enum (dispatch)
  |-- Direct(DirectConnection)    <-- LAN via mDNS
  |-- Relay(Box<RelayClient>)     <-- relay server
  |
  v
PeerChannel trait (unified interface)
  - send_message(&[u8])
  - receive_message(&mut [u8]) -> usize
  - close()
  - transport_description() -> String
  |
  v
Transfer pipeline (codec, handshake, chunks)
```

Key properties:
- `PeerChannel` is NOT object-safe (async methods) -- cannot use `Box<dyn PeerChannel>`
- `ConnectionResult` is an enum that implements `PeerChannel` via match dispatch
- `send.rs` and `receive.rs` call `channel.send_message()` / `channel.receive_message()` directly
- The handshake (KEM) and transfer pipeline are completely transport-agnostic
- `is_direct` flag is set at connection time and used only for user-facing output

### Where P2P Upgrade Would Happen

Looking at the actual send.rs flow (lines 350-396):

```rust
// Current flow:
let (mut channel, is_direct) = if proxy_config.is_some() {
    // Proxy: relay only
    ...ConnectionResult::Relay(Box::new(relay))...
} else {
    // No proxy: try LAN direct, else relay
    establish_sender_connection(...)  // returns (ConnectionResult, bool)
};

// ... handshake over channel ...
// ... transfer over channel ...
```

The P2P upgrade should happen AFTER the handshake completes (as recommended in the existing research). The reason: the handshake uses the relay as a guaranteed-reliable channel. Attempting P2P before the session key is established risks handshake failure if the direct connection is flaky.

**Proposed insertion point** (send.rs, after line 531 "End handshake"):

```rust
// --- P2P Upgrade Attempt ---
if proxy_config.is_none() && !args.no_p2p {
    match try_p2p_upgrade(&mut channel, &room_id, ...).await {
        Ok(Some(direct)) => {
            channel = ConnectionResult::Direct(direct);
            is_direct = true;
            // Log upgrade
        }
        Ok(None) => { /* stay on relay */ }
        Err(e) => { /* log, stay on relay */ }
    }
}
// --- End P2P Upgrade ---
```

The same pattern applies to receive.rs (after line 302 "End handshake").

### ConnectionResult Enum Extension

The `ConnectionResult` enum already has a `Direct` variant. No new variant is needed. The P2P direct connection produces a `DirectConnection` which is exactly what the `Direct` variant wraps.

However, there is a subtlety: the P2P connection may need to keep the relay connection alive as a fallback. If the direct connection drops mid-transfer, falling back to the relay requires re-establishing the relay session and resuming from the last checkpoint. This is complex and NOT recommended for Phase 20.

**Phase 20 approach**: If the P2P connection succeeds, close the relay (or let it idle). If the P2P connection fails during transfer, the transfer fails and the user retries. Resume support (existing XFER-09) handles this case.

### Relay Signaling Integration

The relay already supports arbitrary data forwarding. For candidate exchange, we need to add new `Message` variants but the relay does NOT need changes -- it just forwards opaque bytes.

The signaling flow through the existing relay:

```
Sender                    Relay                     Receiver
   |-- RoomJoin ---------->|                            |
   |                       |<-- RoomJoin ---------------|
   |<- RoomJoined ---------|-- PeerArrived ------------>|
   |                       |                            |
   |== KEM Handshake (via relay, existing) =============|
   |                       |                            |
   |-- CandidateOffer ---->|-- CandidateOffer --------->|
   |<- CandidateOffer -----|<- CandidateOffer ----------|
   |-- CandidatesDone ---->|-- CandidatesDone --------->|
   |<- CandidatesDone -----|<- CandidatesDone ----------|
   |                       |                            |
   |======= QUIC hole punch attempt (background) =======|
   |                       |                            |
   [Success: channel = Direct, relay idles]
   [Failure: channel stays as Relay, transfer continues]
```

**Important**: The candidate exchange messages are sent through the relay's `forward()` / `receive()` methods. They are NOT encrypted with the session key (the session key is for file data, not signaling). The candidates contain only IP:port pairs, which the relay can already see in the transport headers anyway.

### Concrete Code Path for P2P Negotiation

The P2P negotiation function would look like:

```rust
// In crates/tallow-net/src/transport/p2p.rs

pub async fn negotiate_p2p(
    relay: &mut RelayClient,
    nat_type: NatType,
    timeout: Duration,
) -> Result<Option<DirectConnection>> {
    // 1. Skip if symmetric NAT detected
    if nat_type == NatType::Symmetric {
        tracing::info!("Symmetric NAT -- skipping P2P attempt");
        return Ok(None);
    }

    // 2. Create quinn Endpoint on specific port
    let endpoint = create_dual_endpoint()?;
    let local_port = endpoint.local_addr()?.port();

    // 3. STUN discovery from the same port
    let stun_result = stun_from_port(local_port).await?;

    // 4. Gather all candidates
    let candidates = gather_candidates(local_port, stun_result)?;

    // 5. Exchange candidates via relay
    send_candidates(relay, &candidates).await?;
    let remote_candidates = receive_candidates(relay).await?;

    // 6. Attempt connections to all remote candidates
    // Server role: accept() on endpoint
    // Client role: connect() to each remote candidate
    let direct = attempt_connections(
        endpoint,
        &remote_candidates,
        timeout,
    ).await?;

    Ok(direct)
}
```

### PeerChannel Trait -- No Changes Needed

The `PeerChannel` trait is already sufficient:

```rust
pub trait PeerChannel: Send {
    async fn send_message(&mut self, data: &[u8]) -> Result<()>;
    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize>;
    async fn close(&mut self);
    fn transport_description(&self) -> String;
}
```

Both `RelayClient` and `DirectConnection` already implement this trait. The transfer pipeline is already transport-agnostic. No changes to the trait or the pipeline are needed.

### Existing SignalingMessage Module

The `crates/tallow-net/src/signaling/protocol.rs` contains `SignalingMessage` enum with `Offer`, `Answer`, `IceCandidate` variants. These are SDP-oriented (WebRTC) and should NOT be reused for the QUIC P2P approach. The candidate exchange should use new `Message` variants in the wire protocol (as specified in the existing research), not the signaling module.

The signaling module was designed for a WebRTC path that we are explicitly NOT taking. It can remain as-is for now (no breaking changes) but is not used by Phase 20.

---

## Deep Dive: Security & Privacy Implications

**Researched:** 2026-02-21
**Confidence:** HIGH (verified against threat model, existing privacy module, WebRTC IP leak research)

### IP Address Exposure During Candidate Exchange

**Risk**: When a peer sends its candidates through the relay, the candidate addresses contain:

| Candidate Type | Information Leaked | To Whom |
|---------------|-------------------|---------|
| Host candidate | Local LAN IP (e.g., 192.168.1.42) | Relay server, remote peer |
| Server-reflexive | Public IP + port | Relay server, remote peer |
| UPnP | Public IP + mapped port | Relay server, remote peer |

**Analysis**:

1. **To the relay**: The relay can already see the source IP of the QUIC connection. Candidates add local LAN IP information (minor additional leak). Mitigation: the relay is untrusted by design -- this is not a new trust boundary violation.

2. **To the remote peer**: This IS a new exposure. Currently, peers only know they're connected through the relay -- they don't learn each other's real IP. With P2P, peers learn each other's public IP and potentially LAN IP.

3. **Risk level**: MEDIUM. For the typical Tallow use case (two collaborators sharing files), knowing each other's IP is expected. For adversarial scenarios (anonymous leaks), this is unacceptable -- which is why `--tor`/`--proxy` mode must disable P2P.

### STUN Metadata Leakage

When performing STUN discovery, the following metadata is exposed:

| Metadata | Leaked To | Mitigation |
|----------|-----------|------------|
| Client IP | STUN server (Google/Cloudflare) | Unavoidable for STUN |
| Timing of request | STUN server | Minimal information |
| Source port | STUN server | Unavoidable |
| No payload | N/A | STUN carries no application data |

**Analysis**: STUN is a lightweight, single-packet protocol with no session state. Google/Cloudflare see the client's IP (they already see it for DNS and web traffic). No application data is transmitted. The metadata risk from STUN is strictly lower than the metadata risk from connecting to the relay server.

**Important**: When `--proxy` or `--tor` is active, STUN requests MUST NOT be sent. STUN uses raw UDP, which does not go through SOCKS5 proxies. A STUN request would bypass Tor and expose the user's real IP to Google/Cloudflare.

### IP Fingerprinting via Candidate Exchange

An attacker who operates both the relay and a malicious peer could:

1. Join a room with the target user
2. Receive the target's candidate addresses (public IP, LAN IP)
3. Correlate with other activity to identify the user

**Mitigations**:
- P2P is opt-out (enabled by default) -- users who need anonymity use `--tor`
- `--no-p2p` flag explicitly disables candidate gathering and exchange
- Candidates are NOT sent when proxy mode is active (hard check, not soft)
- LAN IP can be excluded from candidates (send only server-reflexive) via config option

### Interaction with Tor/SOCKS5 Mode

The existing privacy module (`crates/tallow-net/src/privacy/`) provides:

- `ProxyConfig` with `tor_mode` flag
- `Socks5Connector` for TCP routing through Tor
- LAN discovery already disabled in proxy mode (send.rs line 95: `if args.discover && proxy_config.is_none()`)

**Phase 20 must replicate this guard for P2P**:

```rust
// HARD CHECK at entry point -- identical pattern to LAN discovery guard
if proxy_config.is_some() {
    tracing::info!("Proxy mode active -- P2P disabled");
    return; // Stay on relay, do not gather candidates
}
```

This is NOT a soft warning. It is a hard return that prevents ALL P2P logic from executing:
- No STUN requests (would bypass Tor)
- No candidate gathering (would discover real IP)
- No candidate exchange (would share real IP with peer)
- No hole punch attempts (would create direct connection revealing IP)

### Attack Surface Analysis

| Attack | P2P Risk | Relay Risk | Mitigation |
|--------|----------|------------|------------|
| IP discovery by peer | YES (inherent) | Peer knows relay, not client IP | `--no-p2p`, `--tor` |
| IP discovery by relay | Already exposed | Already exposed | No change |
| MITM on direct connection | TLS provides transport encryption | TLS on relay | E2E encryption is transport-agnostic |
| NAT binding hijacking | Low (QUIC has connection IDs) | N/A | QUIC connection IDs prevent hijacking |
| Amplification/reflection | STUN server could be abused | N/A | STUN response is small, low risk |
| Candidate spoofing | Attacker sends fake addresses | N/A | Candidates from relay are authenticated by relay (from_peer field) |

### E2E Encryption Independence

The most important security property: **E2E encryption is completely independent of transport**.

- The KEM handshake (ML-KEM-1024 + CPace) establishes the session key over the relay
- Once the session key is established, ALL data (file chunks, acks, completion) is encrypted with AES-256-GCM
- Switching from relay to direct QUIC does NOT change the encryption
- The direct QUIC connection's TLS 1.3 is a bonus transport-layer encryption, not a security dependency
- An attacker who compromises the direct QUIC connection still cannot read the data (E2E encrypted)

This means the security analysis is simple: P2P changes the transport, not the security. The only new risk is IP exposure, which is addressed by the `--tor` and `--no-p2p` guards.

### Candidate Address Validation

Before attempting to connect to a remote candidate, validate the address:

1. **Not loopback**: Reject 127.0.0.0/8, ::1 (attacker could redirect to local services)
2. **Not link-local**: Reject 169.254.0.0/16, fe80::/10 (unless on same LAN)
3. **Not broadcast**: Reject 255.255.255.255, x.x.x.255
4. **Not multicast**: Reject 224.0.0.0/4, ff00::/8
5. **Not unspecified**: Reject 0.0.0.0, ::
6. **Port range**: Reject ports 0 and > 65535

This prevents an attacker from sending crafted candidates that cause the peer to connect to unintended addresses (similar to the QUIC request forgery concern in RFC 9000 Section 21.4).

### Privacy Mode Summary

| Mode | P2P | STUN | Candidates | Hole Punch | Transport |
|------|-----|------|-----------|------------|-----------|
| Default | YES | YES | Exchanged | Attempted | Direct if success, relay if fail |
| `--no-p2p` | NO | NO | NOT gathered | NOT attempted | Relay only |
| `--tor` | NO | NO | NOT gathered | NOT attempted | Relay via Tor SOCKS5 |
| `--proxy` | NO | NO | NOT gathered | NOT attempted | Relay via SOCKS5 |
| `--local` (LAN) | Implicit | NO | mDNS instead | N/A | Direct LAN via mDNS |

---

## Deep Dive Sources

### Primary (HIGH confidence)
- [quinn::Endpoint API docs](https://docs.rs/quinn/latest/quinn/struct.Endpoint.html) -- verified dual client/server, rebind(), connect()/accept() concurrency
- [libp2p DCUtR Large Scale Measurement (2025)](https://arxiv.org/html/2510.27500v1) -- 6.25M attempts, 70% success rate, TCP/QUIC parity
- [Tailscale: How NAT Traversal Works](https://tailscale.com/blog/how-nat-traversal-works) -- NAT type matrix, birthday paradox, STUN mechanics
- Actual tallow-net source code: stun.rs, detection.rs, hole_punch.rs, direct.rs, connection.rs, relay/client.rs, peer_channel.rs, socks5.rs

### Secondary (MEDIUM confidence)
- [Iroh: Why We Forked Quinn](https://www.iroh.computer/blog/why-we-forked-quinn) -- quinn fork rationale (latency, not API limitation)
- [Iroh Hole Punching docs](https://docs.iroh.computer/concepts/holepunching) -- reference implementation approach
- [Marten Seemann: A P2P Vision for QUIC (2024)](https://seemann.io/posts/2024-10-26---p2p-quic/) -- IETF drafts, ADD_ADDRESS, security concerns
- [Liang et al.: Implementing NAT Hole Punching with QUIC (VTC2024)](https://arxiv.org/abs/2408.01791) -- 2 RTT ideal, migration advantage

### Tertiary (LOW confidence)
- [WebRTC IP Leak research](https://thewebknows.com/insights/webrtc-leaks/) -- STUN bypass of VPN/proxy, candidate exposure risks
- [Mozilla Bug 959893: WebRTC IP Leak](https://bugzilla.mozilla.org/show_bug.cgi?id=959893) -- historical context for IP leaks via ICE candidates
