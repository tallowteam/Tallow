# Phase 13: LAN Discovery & Direct Transfer -- Execution Plan

## Goal

Two peers on the same LAN can discover each other via mDNS and transfer files directly over QUIC without a relay server -- with automatic fallback to relay when direct connection fails. The wire protocol, E2E encryption, and transfer pipeline remain unchanged; only the transport layer is swapped.

## Success Criteria (from ROADMAP.md)

1. `tallow send --local file.txt` broadcasts mDNS presence; `tallow receive --local` discovers it and completes transfer without any relay traffic
2. Direct LAN transfers use the same E2E encryption as relay transfers -- the transport changes, not the security
3. When mDNS discovery fails or peers are on different networks, the transfer automatically falls back to relay with a user-visible message
4. Multiple peers on the same LAN are listed with their identity fingerprints -- the user picks which one to connect to
5. Direct transfer speed is at least 5x faster than relay transfer for files >10MB on a gigabit LAN

## Architecture Decision

**Option A: PeerChannel trait** (chosen over enum wrapper). A trait-based approach allows future transports (Bluetooth, WebRTC) without touching existing code. Both `RelayClient` and `DirectConnection` implement `PeerChannel`, and `send.rs`/`receive.rs` are refactored to operate on `Box<dyn PeerChannel>` instead of `RelayClient` directly.

**Key invariant**: The wire protocol (`Message` enum, `TallowCodec`, postcard encoding) is NEVER modified. A direct connection carries exactly the same byte sequences as a relay connection. The `SendPipeline` and `ReceivePipeline` are already transport-agnostic.

## Dependency Upgrade

Upgrade `mdns-sd` from `0.11.5` to `0.18.x` in `crates/tallow-net/Cargo.toml`. The 0.18.x API provides:
- `ServiceDaemon::new_with_if_config()` for network interface selection
- Improved multicast handling on Windows
- `get_property_val_str()` for TXT record access (API may have minor changes from 0.11)

The upgrade MUST happen first because later waves depend on 0.18.x features.

---

## Wave 1: PeerChannel Trait + DirectConnection Implementation

**Scope**: Define the unified `PeerChannel` trait in `tallow-net`, implement `DirectConnection` (QUIC P2P), and implement `PeerChannel` for both `DirectConnection` and `RelayClient`.

**Why first**: This is the foundation. Nothing else works without a transport abstraction.

### Task 1.1: Define `PeerChannel` trait

**File**: `crates/tallow-net/src/transport/peer_channel.rs` (new)

```rust
/// Unified channel for communicating with a peer, regardless of transport.
///
/// Both relay connections and direct LAN connections implement this trait,
/// allowing the transfer pipeline to be transport-agnostic.
#[allow(async_fn_in_trait)]
pub trait PeerChannel: Send {
    /// Send a framed message to the peer.
    ///
    /// Uses the same 4-byte BE length-prefixed framing as `QuicTransport`.
    /// The caller is responsible for encoding `Message` to bytes via `TallowCodec`
    /// before calling this method.
    async fn send_message(&mut self, data: &[u8]) -> Result<()>;

    /// Receive a framed message from the peer.
    ///
    /// Returns the number of bytes read into `buf`.
    /// Uses the same 4-byte BE length-prefixed framing as `QuicTransport`.
    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize>;

    /// Close the channel gracefully.
    async fn close(&mut self);

    /// Human-readable description of the transport for logging.
    ///
    /// Examples: `"relay (129.146.114.5:4433)"`, `"direct LAN (192.168.1.42:52341)"`
    fn transport_description(&self) -> String;
}
```

**Constraints**:
- Return type is `crate::Result<T>` (using `NetworkError`)
- `Send` bound required (used across `.await` points in tokio tasks)
- No `Sync` bound (channels are used mutably by a single task)
- `transport_description()` returns `String` not `&str` to avoid lifetime issues with dynamic dispatch

**Re-export**: Add `pub use transport::peer_channel::PeerChannel;` to `crates/tallow-net/src/transport/mod.rs` and `pub use transport::PeerChannel;` to `crates/tallow-net/src/lib.rs`.

### Task 1.2: Implement `PeerChannel` for `RelayClient`

**File**: `crates/tallow-net/src/relay/client.rs` (modify)

Add `impl PeerChannel for RelayClient`:

```rust
impl crate::transport::PeerChannel for RelayClient {
    async fn send_message(&mut self, data: &[u8]) -> Result<()> {
        self.forward(data).await
    }

    async fn receive_message(&mut self, buf: &mut [u8]) -> Result<usize> {
        self.receive(buf).await
    }

    async fn close(&mut self) {
        RelayClient::close(self).await;
    }

    fn transport_description(&self) -> String {
        format!("relay ({})", self.relay_addr)
    }
}
```

**Note**: The existing `forward()` and `receive()` methods are `#[cfg(feature = "quic")]`. The `PeerChannel` impl must also be `#[cfg(feature = "quic")]`.

### Task 1.3: Create `DirectConnection` struct

**File**: `crates/tallow-net/src/transport/direct.rs` (new)

`DirectConnection` wraps a QUIC connection established directly between two peers (no relay). It uses the same length-prefixed framing as `QuicTransport`.

```rust
/// A direct peer-to-peer QUIC connection for LAN transfers.
///
/// Uses the same 4-byte BE length-prefixed framing as relay connections.
/// The wire protocol is identical -- only the transport path differs.
#[cfg(feature = "quic")]
pub struct DirectConnection {
    /// The underlying QUIC connection
    connection: quinn::Connection,
    /// Bidirectional send stream
    send: quinn::SendStream,
    /// Bidirectional receive stream
    recv: quinn::RecvStream,
    /// Remote peer address for logging
    remote_addr: SocketAddr,
}
```

Implement `PeerChannel` for `DirectConnection`:
- `send_message`: Write 4-byte BE length prefix + payload via `self.send.write_all()`
- `receive_message`: Read 4-byte BE length prefix, validate against `buf.len()`, read payload via `self.recv.read_exact()`
- `close`: Call `self.connection.close(0u32.into(), b"done")`
- `transport_description`: Return `format!("direct LAN ({})", self.remote_addr)`

### Task 1.4: Create `DirectListener` struct (sender-side server)

**File**: `crates/tallow-net/src/transport/direct.rs` (same file as 1.3)

The sender binds a QUIC endpoint on an OS-assigned port and waits for the receiver to connect.

```rust
/// QUIC server for accepting a direct LAN connection from a peer.
///
/// The sender acts as the server: bind to `:0`, advertise the port via mDNS,
/// and wait for the receiver to connect.
#[cfg(feature = "quic")]
pub struct DirectListener {
    /// The QUIC endpoint accepting connections
    endpoint: quinn::Endpoint,
    /// The actual bound address (with OS-assigned port)
    local_addr: SocketAddr,
}
```

Methods:
- `bind() -> Result<Self>`: Generate self-signed TLS cert via `tls_config::generate_self_signed()`, create `quinn::ServerConfig` with LAN-tuned transport config (30s idle timeout, 1ms initial RTT, 8MB send window), bind to `0.0.0.0:0`, store the actual bound port
- `port() -> u16`: Return the bound port (used for mDNS advertisement)
- `local_addr() -> SocketAddr`: Return the full bound address
- `accept_peer(timeout: Duration) -> Result<DirectConnection>`: Accept one incoming connection with a timeout, accept the bidirectional stream, return `DirectConnection`
- `close(&self)`: Close the endpoint

LAN-tuned `TransportConfig`:
```rust
let mut transport = quinn::TransportConfig::default();
transport.max_idle_timeout(Some(Duration::from_secs(30).try_into().unwrap()));
transport.initial_rtt(Duration::from_millis(1));
// Note: send_window and receive_window types must match quinn 0.11 API
```

### Task 1.5: Create `connect_direct()` function (receiver-side client)

**File**: `crates/tallow-net/src/transport/direct.rs` (same file)

```rust
/// Connect directly to a LAN peer via QUIC.
///
/// The receiver calls this after discovering the sender via mDNS.
#[cfg(feature = "quic")]
pub async fn connect_direct(
    peer_addr: SocketAddr,
    timeout: Duration,
) -> Result<DirectConnection>
```

Implementation:
- Create `quinn::ClientConfig` via `tls_config::quinn_client_config()` (reuse existing -- SkipServerVerification is justified by E2E encryption)
- Override transport config with LAN-tuned parameters (same as listener)
- Bind `Endpoint::client("0.0.0.0:0")`
- `endpoint.connect(peer_addr, "localhost")` with `tokio::time::timeout`
- Open bidirectional stream via `connection.open_bi()`
- Return `DirectConnection`

### Task 1.6: Register new module

**File**: `crates/tallow-net/src/transport/mod.rs` (modify)

Add:
```rust
pub mod direct;
pub mod peer_channel;
```

Re-export:
```rust
pub use peer_channel::PeerChannel;
#[cfg(feature = "quic")]
pub use direct::{DirectConnection, DirectListener, connect_direct};
```

Also update `crates/tallow-net/src/lib.rs` to re-export `PeerChannel`:
```rust
pub use transport::PeerChannel;
```

### Task 1.7: Unit tests for DirectConnection

**File**: `crates/tallow-net/src/transport/direct.rs` (test module)

Tests (all `#[cfg(test)]`):
1. `test_direct_listener_bind`: Bind listener, verify port is non-zero
2. `test_direct_roundtrip`: Bind listener, spawn task to connect, send/receive a message in both directions, verify data integrity
3. `test_direct_large_message`: Send a 1MB payload, verify it arrives intact
4. `test_connect_timeout`: Connect to a non-listening address, verify timeout fires

### Wave 1 Verification

```
cargo test -p tallow-net direct
cargo clippy -p tallow-net -- -D warnings
```

All `DirectConnection` tests pass. `PeerChannel` is implemented for both `RelayClient` and `DirectConnection`. No changes to any other crate yet.

---

## Wave 2: Enhanced mDNS Discovery

**Scope**: Upgrade `mdns-sd`, add room-code-filtered advertisement/browsing, TXT record enrichment, IPv4 preference, `Drop` impl, and the `--local` CLI flag.

### Task 2.1: Upgrade `mdns-sd` to 0.18.x

**File**: `crates/tallow-net/Cargo.toml` (modify)

Change:
```toml
mdns-sd = "0.11"
```
To:
```toml
mdns-sd = "0.18"
```

Then run `cargo build -p tallow-net` and fix any API breakage. Known differences in 0.18.x:
- `ServiceInfo::new()` parameter types may differ
- `get_property_val_str()` return type may change
- `ServiceDaemon::new_with_if_config()` is now available

Fix all compilation errors in `mdns.rs` before proceeding.

### Task 2.2: Create `LanAdvertiser` (sender mDNS service)

**File**: `crates/tallow-net/src/discovery/lan.rs` (new)

```rust
/// Advertises a Tallow sender on the LAN via mDNS.
///
/// Registers a `_tallow._tcp.local.` service with TXT records containing:
/// - `v`: Protocol version ("1")
/// - `fp`: Truncated identity fingerprint (8 hex chars)
/// - `rc`: Room code hash prefix (16 hex chars = 8 bytes)
/// - `ts`: Unix timestamp (stale detection)
///
/// Implements `Drop` to unregister the service and shut down the mDNS daemon.
pub struct LanAdvertiser {
    daemon: ServiceDaemon,
    service_fullname: String,
}
```

Constructor:
```rust
pub fn new(
    port: u16,
    fingerprint_prefix: &str,  // first 8 hex chars of identity fingerprint
    room_code_hash: &[u8; 32],
) -> Result<Self>
```

Implementation:
- Instance name: `tallow-<hex(room_code_hash[..4])>` (8 hex chars)
- Hostname: `env::var("HOSTNAME")` or `env::var("COMPUTERNAME")` or `"tallow-peer"`
- TXT records: `v=1`, `fp=<fingerprint_prefix>`, `rc=<hex(room_code_hash[..8])>`, `ts=<unix_timestamp>`
- Register via `daemon.register(service)`
- Store `service_fullname` for unregister in `Drop`

`Drop` implementation:
```rust
impl Drop for LanAdvertiser {
    fn drop(&mut self) {
        let _ = self.daemon.unregister(&self.service_fullname);
        let _ = self.daemon.shutdown();
    }
}
```

### Task 2.3: Create `discover_sender()` function (receiver mDNS browse)

**File**: `crates/tallow-net/src/discovery/lan.rs` (same file)

```rust
/// Browse for a Tallow sender on the LAN matching a specific room code.
///
/// Filters discovered services by the `rc` TXT record to find only the
/// sender advertising the expected room. Returns `None` if no match is
/// found within the timeout.
pub async fn discover_sender(
    room_code_hash: &[u8; 32],
    timeout: Duration,
) -> Result<Option<DiscoveredPeer>>
```

Implementation:
- Create `ServiceDaemon::new()`, call `daemon.browse(SERVICE_TYPE)`
- Poll the `flume::Receiver` in a loop with `tokio::time::timeout`
- For each `ServiceEvent::ServiceResolved(info)`:
  - Extract `rc` TXT property, compare to `hex::encode(&room_code_hash[..8])`
  - If match: extract address (prefer IPv4 -- see Task 2.4), port, fingerprint
  - Return `Some(DiscoveredPeer { ... })`
- If timeout expires: shut down daemon, return `Ok(None)`

### Task 2.4: Create `discover_all_senders()` function

**File**: `crates/tallow-net/src/discovery/lan.rs` (same file)

```rust
/// Browse for ALL Tallow senders on the LAN (no room code filter).
///
/// Used for the `--discover` flag to list all available peers.
/// Returns after the timeout expires.
pub async fn discover_all_senders(
    timeout: Duration,
) -> Result<Vec<DiscoveredPeer>>
```

Collects all `ServiceResolved` events within the timeout period. Deduplicates by service fullname.

### Task 2.5: IPv4 address preference helper

**File**: `crates/tallow-net/src/discovery/lan.rs` (same file)

```rust
/// Select the best address from an mDNS service's address set.
///
/// Prefers IPv4 over IPv6 link-local to avoid scope ID issues.
/// If only IPv6 is available, returns it (with scope ID if present).
fn prefer_ipv4(addresses: &HashSet<IpAddr>) -> Option<IpAddr>
```

Implementation:
- Iterate addresses, return first IPv4
- If no IPv4, return first non-link-local IPv6
- If only link-local IPv6, return it (may require scope ID -- log a warning)

### Task 2.6: Add `Drop` impl to existing `MdnsDiscovery`

**File**: `crates/tallow-net/src/discovery/mdns.rs` (modify)

Add:
```rust
impl Drop for MdnsDiscovery {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}
```

This prevents daemon thread and socket leaks on panic or early return.

### Task 2.7: Add `--local` flag to CLI

**File**: `crates/tallow\src\cli.rs` (modify)

Add to `SendArgs`:
```rust
/// Use direct LAN transfer (mDNS discovery, no relay)
/// Falls back to relay if direct connection fails
#[arg(long)]
pub local: bool,
```

Add to `ReceiveArgs`:
```rust
/// Use direct LAN transfer (mDNS discovery, no relay)
/// Falls back to relay if direct connection fails
#[arg(long)]
pub local: bool,
```

The existing `--discover` and `--advertise` flags remain for backward compatibility but their behavior changes in Wave 3 to delegate to the new LAN infrastructure.

### Task 2.8: Register new discovery module

**File**: `crates/tallow-net/src/discovery/mod.rs` (modify)

Add:
```rust
pub mod lan;

pub use lan::{LanAdvertiser, discover_sender, discover_all_senders};
```

### Task 2.9: Unit tests for mDNS discovery

**File**: `crates/tallow-net/src/discovery/lan.rs` (test module)

Tests:
1. `test_lan_advertiser_creates_service`: Create advertiser, verify it doesn't error
2. `test_lan_advertiser_drops_cleanly`: Create and drop advertiser, verify no panic
3. `test_prefer_ipv4`: Test IPv4 preference with mixed address sets
4. `test_prefer_ipv4_only_v6`: Test fallback to IPv6 when no IPv4 available

Note: Full mDNS discovery integration tests (advertise on one thread, browse on another) are deferred to Wave 4 because they require network access and may fail in CI environments.

### Wave 2 Verification

```
cargo build -p tallow-net
cargo test -p tallow-net lan
cargo test -p tallow-net mdns
cargo clippy -p tallow-net -- -D warnings
cargo build -p tallow  # verify --local flag parses
```

---

## Wave 3: Integration (send.rs / receive.rs refactor + fallback logic)

**Scope**: Refactor `send.rs` and `receive.rs` to use `PeerChannel` trait objects instead of `RelayClient` directly. Add connection strategy with automatic fallback. Wire `--local` flag into the transfer flow.

### Task 3.1: Create connection strategy module

**File**: `crates/tallow-net/src/transport/connection.rs` (new)

This module contains the logic for choosing between direct and relay connections.

```rust
/// Timeouts for the direct connection strategy
pub const MDNS_BROWSE_TIMEOUT: Duration = Duration::from_secs(5);
pub const DIRECT_CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
pub const SENDER_ACCEPT_TIMEOUT: Duration = Duration::from_secs(30);

/// Result of a connection attempt, indicating which transport was used
pub enum ConnectionResult {
    /// Direct LAN connection established
    Direct(DirectConnection),
    /// Fell back to relay connection
    Relay(RelayClient),
}

impl ConnectionResult {
    /// Convert into a boxed PeerChannel for uniform handling
    pub fn into_channel(self) -> Box<dyn PeerChannel> {
        match self {
            ConnectionResult::Direct(d) => Box::new(d),
            ConnectionResult::Relay(r) => Box::new(r),
        }
    }

    /// Whether this is a direct connection
    pub fn is_direct(&self) -> bool {
        matches!(self, ConnectionResult::Direct(_))
    }
}
```

### Task 3.2: Implement sender connection strategy

**File**: `crates/tallow-net/src/transport/connection.rs` (same file)

```rust
/// Establish a connection as the sender.
///
/// If `local_mode` is true:
/// 1. Bind a QUIC listener on a random port
/// 2. Advertise via mDNS with room code hash and fingerprint
/// 3. Wait for receiver to connect (with timeout)
/// 4. If timeout or error: unregister mDNS, fall back to relay
///
/// If `local_mode` is false: connect to relay directly.
pub async fn establish_sender_connection(
    room_id: &[u8; 32],
    fingerprint_prefix: &str,
    relay_addr: SocketAddr,
    password_hash: Option<&[u8; 32]>,
    local_mode: bool,
) -> Result<(Box<dyn PeerChannel>, bool)>  // (channel, is_direct)
```

Flow:
1. If `local_mode`:
   a. `DirectListener::bind()`
   b. `LanAdvertiser::new(listener.port(), fingerprint_prefix, room_id)` -- advertiser held alive via RAII
   c. `listener.accept_peer(SENDER_ACCEPT_TIMEOUT).await`
   d. On success: return `(Box::new(direct_conn), true)`
   e. On timeout/error: log warning, drop advertiser (auto-unregister), fall through to relay
2. Connect to relay: create `RelayClient`, call `connect(room_id, password_hash)`, call `wait_for_peer()`, return `(Box::new(relay), false)`

**Important**: The `LanAdvertiser` must be dropped (unregistering the mDNS service) BEFORE connecting to the relay, to avoid advertising a stale service.

### Task 3.3: Implement receiver connection strategy

**File**: `crates/tallow-net/src/transport/connection.rs` (same file)

```rust
/// Establish a connection as the receiver.
///
/// If `local_mode` is true:
/// 1. Browse mDNS for sender matching room code hash
/// 2. If found: connect directly via QUIC
/// 3. If not found or connection fails: fall back to relay
///
/// If `local_mode` is false: connect to relay directly.
pub async fn establish_receiver_connection(
    room_id: &[u8; 32],
    relay_addr: SocketAddr,
    password_hash: Option<&[u8; 32]>,
    local_mode: bool,
) -> Result<(Box<dyn PeerChannel>, bool)>  // (channel, is_direct)
```

Flow:
1. If `local_mode`:
   a. `discover_sender(room_id, MDNS_BROWSE_TIMEOUT).await`
   b. On `Some(peer)`: `connect_direct(peer.addr, DIRECT_CONNECT_TIMEOUT).await`
   c. On success: return `(Box::new(direct_conn), true)`
   d. On `None` or error: log warning, fall through to relay
2. Connect to relay: create `RelayClient`, call `connect(room_id, password_hash)`, call `wait_for_peer()`, return `(Box::new(relay), false)`

### Task 3.4: Register connection module

**File**: `crates/tallow-net/src/transport/mod.rs` (modify)

Add:
```rust
pub mod connection;
```

Re-export:
```rust
pub use connection::{establish_sender_connection, establish_receiver_connection, ConnectionResult};
```

### Task 3.5: Refactor `send.rs` to use `PeerChannel`

**File**: `crates/tallow/src/commands/send.rs` (modify)

This is the largest single task. The refactoring replaces every `relay.forward()` / `relay.receive()` / `relay.close()` call with `channel.send_message()` / `channel.receive_message()` / `channel.close()`.

**Changes**:

1. **Connection setup** (lines ~316-367): Replace the entire relay connection block with:
```rust
// Establish connection (direct LAN or relay with fallback)
let fingerprint_prefix = identity.fingerprint_prefix(8);
let (mut channel, is_direct) = tallow_net::transport::establish_sender_connection(
    &room_id,
    &fingerprint_prefix,
    relay_addr,
    pw_ref,
    args.local,
).await.map_err(|e| io::Error::other(format!("Connection failed: {}", e)))?;

if is_direct {
    if json {
        println!("{}", serde_json::json!({"event": "direct_connection"}));
    } else {
        output::color::success("Direct LAN connection established!");
    }
} else {
    if json {
        println!("{}", serde_json::json!({"event": "relay_connection", "relay": args.relay}));
    } else {
        if args.local {
            output::color::warning("LAN peer not found, connected via relay");
        }
    }
}
```

2. **Message sending**: Replace all `relay.forward(&encode_buf)` with `channel.send_message(&encode_buf)`

3. **Message receiving**: Replace all `relay.receive(&mut recv_buf)` with `channel.receive_message(&mut recv_buf)`

4. **Close**: Replace `relay.close().await` with `channel.close().await`

5. **Wait-for-peer logic**: For direct connections, peer is already connected (no relay room concept). The `wait_for_peer()` call only applies to relay -- this is handled inside `establish_sender_connection()`.

**Note on `--discover` flag**: The existing `--discover` block at the top of `execute()` (lines 72-118) currently does a standalone mDNS browse and prints results. This behavior is preserved but enhanced: when `--local` is also set, the discovered peer is used for direct connection instead of just listing.

### Task 3.6: Refactor `receive.rs` to use `PeerChannel`

**File**: `crates/tallow/src/commands/receive.rs` (modify)

Same pattern as send.rs:

1. **Connection setup** (lines ~88-139): Replace relay connection block with:
```rust
let (mut channel, is_direct) = tallow_net::transport::establish_receiver_connection(
    &room_id,
    relay_addr,
    pw_ref,
    args.local,
).await.map_err(|e| io::Error::other(format!("Connection failed: {}", e)))?;
```

2. **Message sending**: Replace all `relay.forward(&encode_buf)` with `channel.send_message(&encode_buf)`

3. **Message receiving**: Replace all `relay.receive(&mut recv_buf)` with `channel.receive_message(&mut recv_buf)`

4. **Close**: Replace `relay.close().await` with `channel.close().await`

5. **Remove `--advertise` mDNS block** (lines 17-29): The `--local` flag subsumes this functionality. The old `--advertise` flag remains in `ReceiveArgs` for backward compatibility but is now a no-op that logs a deprecation warning.

### Task 3.7: Add `fingerprint_prefix()` to `IdentityStore`

**File**: `crates/tallow-store/src/identity/mod.rs` (modify)

Add a method to extract a truncated hex fingerprint for mDNS advertisement:

```rust
/// Return the first `n` hex characters of the identity fingerprint.
///
/// Used for mDNS advertisement -- enough for disambiguation but not
/// full identification (privacy-preserving truncation).
pub fn fingerprint_prefix(&self, hex_chars: usize) -> String {
    let fp = self.fingerprint();
    fp.chars().take(hex_chars).collect()
}
```

If `fingerprint()` does not exist, derive it from the public key via BLAKE3 and return the hex encoding.

### Task 3.8: Output messaging for transport mode

**File**: `crates/tallow/src/output/color.rs` (modify)

Add helper functions:
```rust
/// Display that a direct LAN connection was established
pub fn direct_connection() { ... }

/// Display that the transfer fell back to relay after LAN attempt failed
pub fn fallback_to_relay(relay: &str) { ... }
```

### Task 3.9: Integration smoke test

**File**: `crates/tallow-net/tests/direct_transfer.rs` (new integration test)

This is NOT a full end-to-end test (that's Phase 15). It tests the `PeerChannel` abstraction by:

1. Binding a `DirectListener`
2. Spawning a task that calls `connect_direct()` to the listener's address
3. Sender side: `channel.send_message(b"hello")`, `channel.receive_message(&mut buf)` -- verify echo
4. Receiver side: `channel.receive_message(&mut buf)`, `channel.send_message(data)` -- echo back
5. Both sides: `channel.close()`

This verifies the `PeerChannel` trait works end-to-end over a real QUIC connection without involving mDNS, codec, or encryption.

### Wave 3 Verification

```
cargo build --workspace
cargo test -p tallow-net direct
cargo test -p tallow-net connection
cargo clippy --workspace -- -D warnings
cargo fmt --check
```

Manually verify:
- `tallow send --help` shows `--local` flag
- `tallow receive --help` shows `--local` flag
- `tallow send file.txt` (without `--local`) works exactly as before (regression test)

---

## Wave 4: Tests

**Scope**: Comprehensive unit tests, integration tests, and manual verification for all Wave 1-3 code.

### Task 4.1: PeerChannel trait compliance tests

**File**: `crates/tallow-net/src/transport/peer_channel.rs` (test module)

Test that both implementations satisfy the contract:
1. `test_relay_client_is_peer_channel`: Verify `RelayClient` can be used as `Box<dyn PeerChannel>` (compile-time check via type assertion)
2. `test_direct_connection_is_peer_channel`: Same for `DirectConnection`

### Task 4.2: DirectConnection framing tests

**File**: `crates/tallow-net/src/transport/direct.rs` (test module, expand)

1. `test_empty_message`: Send 0-byte payload, verify it roundtrips
2. `test_max_message`: Send message near the u32::MAX boundary, verify length prefix handling
3. `test_multiple_messages`: Send 100 messages in sequence, verify all arrive in order
4. `test_bidirectional_concurrent`: Send messages in both directions simultaneously
5. `test_connection_close_send_error`: Close one side, verify send on other side returns error

### Task 4.3: LanAdvertiser lifecycle tests

**File**: `crates/tallow-net/src/discovery/lan.rs` (test module, expand)

1. `test_advertiser_unique_instance_names`: Create two advertisers with different room codes, verify instance names differ
2. `test_advertiser_txt_records`: Create advertiser, verify TXT properties contain expected keys

### Task 4.4: Connection strategy unit tests

**File**: `crates/tallow-net/src/transport/connection.rs` (test module)

These test the fallback logic with mock/stub implementations:

1. `test_relay_fallback_when_not_local_mode`: With `local_mode=false`, verify relay path is taken
2. `test_direct_preferred_when_local_mode`: With `local_mode=true` and a listening peer, verify direct path is taken

Note: Testing the actual mDNS discovery flow requires network access. These tests focus on the connection logic branches, using direct connections by address rather than mDNS.

### Task 4.5: mDNS discovery integration test (requires network)

**File**: `crates/tallow-net/tests/mdns_discovery.rs` (new)

Marked `#[ignore]` for CI (requires multicast-capable network):

1. `test_advertise_and_discover`: One thread advertises, another browses, verify discovery succeeds and TXT records match
2. `test_discover_with_room_filter`: Advertise two services with different room codes, browse with filter, verify only the matching one is returned
3. `test_discover_timeout`: Browse with no advertiser, verify timeout returns `None`

### Task 4.6: IPv4 preference tests

**File**: `crates/tallow-net/src/discovery/lan.rs` (test module, expand)

1. `test_prefer_ipv4_with_both`: Input `{192.168.1.1, fe80::1}`, verify returns `192.168.1.1`
2. `test_prefer_ipv4_only_v4`: Input `{10.0.0.1}`, verify returns `10.0.0.1`
3. `test_prefer_ipv4_only_link_local_v6`: Input `{fe80::1}`, verify returns `fe80::1` (fallback)
4. `test_prefer_ipv4_global_v6`: Input `{2001:db8::1}`, verify returns `2001:db8::1`
5. `test_prefer_ipv4_empty`: Input `{}`, verify returns `None`

### Task 4.7: Existing test regression check

Run the full test suite to verify nothing is broken:

```
cargo test --workspace
```

All 598+ existing tests must continue to pass. The refactoring of `send.rs` and `receive.rs` should not change behavior for non-`--local` paths.

### Wave 4 Verification

```
cargo test --workspace
cargo test -p tallow-net -- --include-ignored  # optional: run mDNS tests if network available
cargo clippy --workspace -- -D warnings
cargo fmt --check
```

---

## File Change Summary

### New Files (6)

| File | Purpose |
|------|---------|
| `crates/tallow-net/src/transport/peer_channel.rs` | `PeerChannel` trait definition |
| `crates/tallow-net/src/transport/direct.rs` | `DirectConnection`, `DirectListener`, `connect_direct()` |
| `crates/tallow-net/src/transport/connection.rs` | Connection strategy with fallback logic |
| `crates/tallow-net/src/discovery/lan.rs` | `LanAdvertiser`, `discover_sender()`, `discover_all_senders()`, `prefer_ipv4()` |
| `crates/tallow-net/tests/direct_transfer.rs` | Integration test for `PeerChannel` over direct QUIC |
| `crates/tallow-net/tests/mdns_discovery.rs` | Integration test for mDNS advertise/browse (ignored in CI) |

### Modified Files (9)

| File | Changes |
|------|---------|
| `crates/tallow-net/Cargo.toml` | `mdns-sd` version `0.11` -> `0.18`, add `hex` dependency |
| `crates/tallow-net/src/lib.rs` | Re-export `PeerChannel` |
| `crates/tallow-net/src/transport/mod.rs` | Add `direct`, `peer_channel`, `connection` modules; re-exports |
| `crates/tallow-net/src/relay/client.rs` | Add `impl PeerChannel for RelayClient` |
| `crates/tallow-net/src/discovery/mod.rs` | Add `lan` module; re-exports |
| `crates/tallow-net/src/discovery/mdns.rs` | Add `impl Drop for MdnsDiscovery`; fix 0.18.x API breakage |
| `crates/tallow/src/cli.rs` | Add `--local` flag to `SendArgs` and `ReceiveArgs` |
| `crates/tallow/src/commands/send.rs` | Refactor to use `PeerChannel`; add `--local` connection strategy |
| `crates/tallow/src/commands/receive.rs` | Refactor to use `PeerChannel`; add `--local` connection strategy |

### Unchanged (critical invariants)

| Component | Why unchanged |
|-----------|---------------|
| `crates/tallow-protocol/src/wire/` | Wire protocol messages are transport-agnostic. No new variants. |
| `crates/tallow-crypto/` | E2E encryption is orthogonal to transport. Same key derivation, same AES-256-GCM. |
| `crates/tallow-protocol/src/transfer/` | `SendPipeline`/`ReceivePipeline` produce/consume `Message` objects. Transport-agnostic already. |
| `crates/tallow-protocol/src/compression/` | Applied before encryption at protocol layer. Unaffected by transport. |
| `crates/tallow-store/` | Identity, config, history, trust -- all unchanged except `fingerprint_prefix()` addition. |
| `crates/tallow-relay/` | Relay server is unchanged. Direct connections bypass it entirely. |

---

## Risk Mitigations

### Risk 1: `mdns-sd` 0.18.x API breakage
**Mitigation**: Upgrade in Task 2.1 before any new code depends on the new API. Fix compilation errors immediately. If 0.18.x is incompatible, pin to the latest 0.17.x instead.

### Risk 2: Windows mDNS firewall blocking
**Mitigation**: The fallback to relay is automatic and transparent. When direct fails, log a clear message: "LAN discovery failed (check firewall allows UDP 5353). Connecting via relay..."

### Risk 3: send.rs/receive.rs refactoring breaks existing relay flow
**Mitigation**: The `PeerChannel` trait's `send_message`/`receive_message` methods have identical semantics to `RelayClient::forward`/`receive`. The refactoring is a mechanical replacement. Wave 4 Task 4.7 explicitly requires all 598+ existing tests to pass.

### Risk 4: QUIC configuration differences between LAN and relay
**Mitigation**: LAN-tuned transport config (shorter timeout, lower initial RTT) is only applied in `DirectListener::bind()` and `connect_direct()`. Relay connections continue using the existing `tls_config::quinn_client_config()` with 300s idle timeout.

### Risk 5: Race condition in sender-as-server model
**Mitigation**: Clear role assignment: sender always binds (server), receiver always connects (client). The room code ensures both peers find each other. No ambiguity.

---

## Estimated Effort

| Wave | Tasks | Estimated Effort |
|------|-------|-----------------|
| Wave 1: PeerChannel + DirectConnection | 7 tasks | Medium |
| Wave 2: Enhanced mDNS | 9 tasks | Medium |
| Wave 3: Integration | 9 tasks | Large (send.rs/receive.rs refactoring) |
| Wave 4: Tests | 7 tasks | Medium |
| **Total** | **32 tasks** | **Large** |

## Execution Order

Waves execute sequentially: 1 -> 2 -> 3 -> 4. Within each wave, tasks are independent and can be done in any order, except where noted (e.g., Task 2.1 must precede Task 2.2).

## Not In Scope (Future Enhancements)

- Chunk size optimization for LAN (keep 64KB for now)
- `--interface` CLI flag for manual network interface selection
- `tallow doctor` mDNS diagnostic check
- Multi-peer selection UI (when multiple senders match same room code)
- Auto-detect mode (race mDNS against relay without `--local` flag)
- NAT hole-punching for cross-network direct connections
