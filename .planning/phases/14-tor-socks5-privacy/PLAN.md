# Phase 14: Tor/SOCKS5 Privacy -- Execution Plan

## Goal

Wire the existing SOCKS5 and DoH primitives into the relay connection pipeline so that `--proxy` and `--tor` flags route all traffic through a SOCKS5 proxy with zero DNS leaks. After this phase, users can transfer files anonymously through Tor or any SOCKS5 proxy.

## Success Criteria (from ROADMAP.md)

1. `tallow send --proxy socks5://127.0.0.1:9050 file.txt` completes a transfer with all traffic routed through the SOCKS5 proxy
2. DNS resolution uses the proxy (no system resolver calls) -- verified by network capture showing zero plaintext DNS
3. `tallow send --tor file.txt` is a shortcut that defaults to localhost:9050 and checks Tor is running
4. The relay address is resolved through the proxy, not leaked to the local network
5. Transfer still works E2E encrypted through the proxy -- Tor sees only encrypted relay traffic, not file contents

## Architecture Summary

```
CLI (--proxy / --tor)
    |
    v
ProxyConfig { socks5_addr, tor_mode, auth }
    |
    v
resolve_relay_proxy()     <-- three-branch DNS: IP literal / Tor hostname / DoH
    |
    v
RelayClient::connect_proxied()
    |
    v
ProxiedTcpTlsTransport   <-- SOCKS5 tunnel -> TLS handshake -> Transport trait
    |
    v
Normal relay protocol (RoomJoin, data forwarding, etc.)
```

Key constraint: QUIC cannot traverse SOCKS5. When a proxy is active, the transport MUST be TCP+TLS. The relay server already accepts both QUIC and TCP+TLS, so no server changes are needed.

---

## Wave 1: ProxiedTcpTlsTransport + RelayClient Transport Abstraction

**Goal**: Build the proxied transport and make RelayClient support both QUIC and TCP+TLS.

### Task 1.1: Add `ProxyConfig` to `tallow-net`

**File**: `crates/tallow-net/src/privacy/socks5.rs`

Add a `ProxyConfig` struct alongside the existing `Socks5Connector`:

```rust
/// Proxy configuration for routing relay connections through SOCKS5
#[derive(Debug, Clone)]
pub struct ProxyConfig {
    /// SOCKS5 proxy address
    pub socks5_addr: std::net::SocketAddr,
    /// Whether this is a Tor proxy (affects DNS resolution strategy)
    pub tor_mode: bool,
    /// Optional proxy authentication
    pub auth: Option<ProxyAuth>,
}

#[derive(Debug, Clone)]
pub struct ProxyAuth {
    pub username: String,
    pub password: String,
}
```

Add methods:
- `ProxyConfig::from_url(url: &str) -> Result<Self>` -- parses `socks5://[user:pass@]host:port`
- `ProxyConfig::tor_default() -> Self` -- returns `socks5://127.0.0.1:9050` with `tor_mode: true`
- `ProxyConfig::to_connector(&self) -> Socks5Connector` -- creates a connector from config

Also fix `Socks5Connector::from_url()` to parse `user:pass@host:port` (currently only parses `host:port`).

**Re-export**: Update `crates/tallow-net/src/privacy/mod.rs` to re-export `ProxyConfig` and `ProxyAuth`.

**Tests**:
- `test_proxy_config_from_url_basic` -- `socks5://127.0.0.1:9050`
- `test_proxy_config_from_url_with_auth` -- `socks5://user:pass@127.0.0.1:1080`
- `test_proxy_config_from_url_socks5h` -- `socks5h://127.0.0.1:9050`
- `test_proxy_config_from_url_no_scheme` -- `127.0.0.1:1080`
- `test_proxy_config_tor_default` -- verify addr and tor_mode
- `test_to_connector_with_auth` -- verify connector has credentials

### Task 1.2: Create `ProxiedTcpTlsTransport`

**New file**: `crates/tallow-net/src/transport/proxied.rs`

A new transport that connects through SOCKS5 and wraps the tunnel in TLS. Implements the `Transport` trait identically to `TcpTlsTransport` but the TCP connection goes through the proxy.

```rust
pub struct ProxiedTcpTlsTransport {
    connector: Socks5Connector,
    stream: Option<TlsStream<TcpStream>>,
    relay_host: Option<String>,
    relay_port: u16,
    use_hostname: bool,  // true = Tor mode (send hostname to proxy)
}
```

Key behaviors:
- `connect()` calls `Socks5Connector::connect_hostname()` (Tor) or `Socks5Connector::connect()` (generic) to get a `TcpStream`
- Wraps the `TcpStream` in TLS using `tls_config::rustls_client_config()`
- SNI: use actual relay hostname when available, fall back to `"localhost"`
- `send()` and `receive()` are identical to `TcpTlsTransport` (length-prefixed framing)
- `close()` shuts down TLS gracefully
- Connection timeout: 10 seconds (Tor can be slow)

**Update**: `crates/tallow-net/src/transport/mod.rs` -- add `pub mod proxied;` and `pub use proxied::ProxiedTcpTlsTransport;`

**Tests** (unit, no real proxy):
- `test_proxied_transport_new` -- construction does not panic
- `test_proxied_transport_not_connected` -- send/receive before connect returns error

### Task 1.3: Abstract Transport in RelayClient

**File**: `crates/tallow-net/src/relay/client.rs`

The current `RelayClient` hardcodes `QuicTransport`. Refactor to support either transport type:

Add an enum for transport backing:
```rust
enum RelayTransport {
    #[cfg(feature = "quic")]
    Quic(QuicTransport),
    TcpTls(TcpTlsTransport),
    Proxied(ProxiedTcpTlsTransport),
}
```

Add fields to `RelayClient`:
```rust
pub struct RelayClient {
    relay_addr: SocketAddr,
    transport: Option<RelayTransport>,
    peer_present: bool,
    proxy_config: Option<ProxyConfig>,
    relay_hostname: Option<String>,
}
```

Add methods:
- `RelayClient::new_with_proxy(relay_host: &str, relay_port: u16, proxy: ProxyConfig) -> Self`
- Internal: modify `connect()` to branch on `proxy_config.is_some()`:
  - If proxy: create `ProxiedTcpTlsTransport`, connect through SOCKS5
  - If no proxy: use `QuicTransport` (current behavior)
- `forward()`, `receive()`, `wait_for_peer()`, `close()` dispatch to `RelayTransport` enum

All existing behavior when no proxy is configured must be preserved exactly.

**Tests**:
- `test_relay_client_new_with_proxy` -- construction succeeds
- `test_relay_client_new_unchanged` -- existing `new()` still works identically

### Task 1.4: Validate Build

Run `cargo build --workspace` and `cargo clippy --workspace -- -D warnings` to ensure everything compiles cleanly. No functional integration test yet -- that comes in Wave 4.

---

## Wave 2: DNS Leak Prevention

**Goal**: When a proxy is active, DNS must never hit the system resolver. Implement a three-branch resolution strategy.

### Task 2.1: Create `ResolvedRelay` Enum and `resolve_relay_proxy()` Function

**New file**: `crates/tallow-net/src/relay/resolve.rs`

Centralize proxy-aware relay resolution in `tallow-net` (not duplicated per command):

```rust
/// Result of proxy-aware relay resolution
pub enum ResolvedRelay {
    /// Relay address is a direct IP (no DNS needed)
    Addr(SocketAddr),
    /// Hostname to be resolved by the proxy (Tor mode -- no local resolution)
    Hostname { host: String, port: u16 },
}

/// Resolve a relay address with proxy awareness
///
/// Decision tree:
/// 1. If relay string parses as SocketAddr (IP:port) -> ResolvedRelay::Addr (no DNS)
/// 2. If proxy is active + Tor mode -> ResolvedRelay::Hostname (proxy resolves)
/// 3. If proxy is active + generic SOCKS5 -> resolve via DoH -> ResolvedRelay::Addr
/// 4. If no proxy -> system DNS -> ResolvedRelay::Addr
pub async fn resolve_relay_proxy(
    relay: &str,
    proxy: Option<&ProxyConfig>,
) -> Result<ResolvedRelay> { ... }
```

The function must:
- Parse `host:port` correctly (split on last `:`)
- For Tor mode: return `Hostname` variant without touching DNS
- For generic SOCKS5: use `DohResolver::cloudflare()` -- never `std::net::ToSocketAddrs`
- For no proxy: use `tokio::net::lookup_host()` (async, does not block)

**Update**: `crates/tallow-net/src/relay/mod.rs` -- add `pub mod resolve;`

**Tests**:
- `test_resolve_ip_literal` -- `129.146.114.5:4433` returns `Addr` regardless of proxy config
- `test_resolve_hostname_no_proxy` -- calls system resolver (mock/skip in unit test, assert branch taken)
- `test_resolve_hostname_tor_mode` -- returns `Hostname` variant, never calls DNS
- `test_resolve_hostname_generic_proxy` -- calls DoH (mock/skip in unit test, assert branch taken)
- `test_parse_host_port` -- various formats: `host:1234`, `sub.domain.com:4433`, edge cases

### Task 2.2: Update Commands to Use `resolve_relay_proxy()`

**Files**:
- `crates/tallow/src/commands/send.rs`
- `crates/tallow/src/commands/receive.rs`
- `crates/tallow/src/commands/sync.rs`
- `crates/tallow/src/commands/watch.rs`
- `crates/tallow/src/commands/clip.rs`

In each command's `execute()` function:

1. Replace the local `resolve_relay()` function with a call to `tallow_net::relay::resolve::resolve_relay_proxy()`
2. Pass `proxy_config.as_ref()` (constructed from CLI flags -- wired in Wave 3)
3. Match on `ResolvedRelay`:
   - `Addr(addr)` -> `RelayClient::new(addr)` (current behavior)
   - `Hostname { host, port }` -> `RelayClient::new_with_proxy(&host, port, proxy_config)`

Delete the duplicated `resolve_relay()` helper functions from all five command files. The centralized version in `tallow-net` replaces them.

### Task 2.3: Suppress LAN Discovery When Proxy Active

**Files**: `crates/tallow/src/commands/send.rs`, `crates/tallow/src/commands/receive.rs`

When proxy config is `Some(_)`:
- Skip mDNS discovery/advertise (broadcasts local IP -- defeats the proxy)
- Print a warning if `--discover` or `--advertise` was explicitly passed alongside `--proxy`/`--tor`
- Do NOT error out -- just skip silently with a warning

```rust
if proxy_config.is_some() && args.discover {
    output::color::warning(
        "LAN discovery disabled: --discover leaks local IP when using a proxy"
    );
}
```

---

## Wave 3: CLI Integration

**Goal**: Wire `--proxy` and `--tor` flags into all commands. Add `TALLOW_PROXY` env var and config file support.

### Task 3.1: Add `--tor` Flag to CLI Args

**File**: `crates/tallow/src/cli.rs`

Add `--tor` to `SendArgs`, `ReceiveArgs`, `SyncArgs`, `WatchArgs`, and `ClipArgs`:

```rust
/// Route through Tor (shortcut for --proxy socks5://127.0.0.1:9050)
#[arg(long)]
pub tor: bool,
```

Add `TALLOW_PROXY` env var support to `--proxy` field:

```rust
/// SOCKS5 proxy address (e.g., socks5://127.0.0.1:9050, also reads TALLOW_PROXY env var)
#[arg(long, env = "TALLOW_PROXY")]
pub proxy: Option<String>,
```

### Task 3.2: Build `ProxyConfig` from CLI Flags

**New file**: `crates/tallow/src/commands/proxy.rs`

Create a shared helper used by all commands:

```rust
/// Build ProxyConfig from CLI flags, env vars, and config
///
/// Priority (highest first):
/// 1. --tor (forces socks5://127.0.0.1:9050 + tor_mode)
/// 2. --proxy <url>
/// 3. TALLOW_PROXY env var (handled by clap env attribute)
/// 4. privacy.default_proxy in config file
/// 5. None (direct connection)
pub async fn build_proxy_config(
    tor: bool,
    proxy: &Option<String>,
    json: bool,
) -> io::Result<Option<ProxyConfig>> { ... }
```

When `--tor`:
- Check if Tor is running by probing `127.0.0.1:9050` with a 2-second TCP connect timeout
- If unreachable: print error with actionable message and return `Err`
- If reachable: return `ProxyConfig::tor_default()`

When `--proxy`:
- Parse URL via `ProxyConfig::from_url()`
- Set `tor_mode: false` (unless URL is localhost:9050, in which case consider it Tor)

**Update**: `crates/tallow/src/commands/mod.rs` -- add `pub mod proxy;`

### Task 3.3: Wire Proxy into All Commands

**Files** (each follows the same pattern):
- `crates/tallow/src/commands/send.rs`
- `crates/tallow/src/commands/receive.rs`
- `crates/tallow/src/commands/sync.rs`
- `crates/tallow/src/commands/watch.rs`
- `crates/tallow/src/commands/clip.rs`

For each command's `execute()`:

1. Early in the function, build proxy config:
   ```rust
   let proxy_config = crate::commands::proxy::build_proxy_config(
       args.tor, &args.proxy, json
   ).await?;
   ```

2. Suppress LAN discovery if proxy active (send/receive only)

3. Resolve relay with proxy awareness:
   ```rust
   let resolved = tallow_net::relay::resolve::resolve_relay_proxy(
       &args.relay, proxy_config.as_ref()
   ).await.map_err(|e| io::Error::other(format!("Relay resolution failed: {}", e)))?;
   ```

4. Create RelayClient based on resolution result:
   ```rust
   let mut relay = match resolved {
       ResolvedRelay::Addr(addr) => {
           if let Some(ref proxy) = proxy_config {
               // Proxy active but relay is an IP -- still route through SOCKS5
               let mut client = tallow_net::relay::RelayClient::new(addr);
               client.set_proxy(proxy.clone());
               client
           } else {
               tallow_net::relay::RelayClient::new(addr)
           }
       }
       ResolvedRelay::Hostname { ref host, port } => {
           let proxy = proxy_config.as_ref()
               .expect("Hostname resolution only returned for proxy mode");
           tallow_net::relay::RelayClient::new_with_proxy(host, port, proxy.clone())
       }
   };
   ```

5. Log proxy usage:
   ```rust
   if let Some(ref proxy) = proxy_config {
       if !json {
           if proxy.tor_mode {
               output::color::info("Routing through Tor...");
           } else {
               output::color::info(&format!("Routing through proxy {}...", proxy.socks5_addr));
           }
       }
   }
   ```

### Task 3.4: Add `default_proxy` to Config Schema

**File**: `crates/tallow-store/src/config/schema.rs`

Add to `PrivacyConfig`:

```rust
pub struct PrivacyConfig {
    pub strip_metadata: bool,
    pub encrypt_filenames: bool,
    pub enable_onion_routing: bool,
    pub use_doh: bool,
    /// Default SOCKS5 proxy address (e.g., "socks5://127.0.0.1:9050")
    #[serde(default)]
    pub default_proxy: String,
}
```

Update the `Default` impl for `PrivacyConfig` to set `default_proxy: String::new()`.

Update `build_proxy_config()` in Task 3.2 to fall back to config file `default_proxy` when no CLI flag or env var is set.

### Task 3.5: Add Proxy Check to Doctor Command

**File**: `crates/tallow/src/commands/doctor.rs`

Add a new check after the relay check:

```rust
async fn check_proxy() -> DiagCheck {
    // Check if Tor is running on default port
    let tor_available = tokio::time::timeout(
        std::time::Duration::from_secs(2),
        tokio::net::TcpStream::connect("127.0.0.1:9050"),
    ).await;

    match tor_available {
        Ok(Ok(_)) => DiagCheck {
            name: "Tor".to_string(),
            passed: true,
            message: "Tor SOCKS port reachable at 127.0.0.1:9050".to_string(),
            fix: None,
        },
        _ => DiagCheck {
            name: "Tor".to_string(),
            passed: true,  // Not a failure -- Tor is optional
            message: "Tor not detected (optional -- use --proxy for custom SOCKS5)".to_string(),
            fix: None,
        },
    }
}
```

Note: Tor not running is not a failure. Mark as passed with an informational message.

---

## Wave 4: Tests

**Goal**: Comprehensive test coverage for the proxy pipeline.

### Task 4.1: Unit Tests for ProxyConfig

**File**: `crates/tallow-net/src/privacy/socks5.rs` (in `#[cfg(test)]` module)

Tests (from Task 1.1 -- verified working after all waves):
- URL parsing with various formats
- Auth extraction from URL
- `tor_default()` values
- `to_connector()` creates valid connector

### Task 4.2: Unit Tests for DNS Resolution

**File**: `crates/tallow-net/src/relay/resolve.rs` (in `#[cfg(test)]` module)

Tests:
- `test_ip_literal_no_dns` -- `"129.146.114.5:4433"` returns `Addr` with no proxy, with Tor proxy, with generic proxy
- `test_hostname_tor_returns_hostname` -- `"relay.example.com:4433"` with Tor proxy returns `Hostname`
- `test_hostname_no_proxy_uses_system` -- verify system DNS path (may need to be `#[ignore]` for CI)
- `test_host_port_parsing_edge_cases` -- IPv6 `[::1]:4433`, missing port, extra colons

### Task 4.3: Mock SOCKS5 Server for Integration Tests

**New file**: `crates/tallow-net/tests/proxy_integration.rs`

Build a minimal mock SOCKS5 server using raw TCP:
- Accept connection
- Negotiate SOCKS5 handshake (version 5, no-auth method)
- Accept CONNECT command
- Connect to the target (or return success with no forwarding for unit tests)
- Forward data bidirectionally

Tests using the mock:
- `test_socks5_connector_connect` -- connect through mock to a local TCP echo server
- `test_socks5_connector_connect_hostname` -- verify hostname is passed to proxy (inspect received bytes)
- `test_socks5_connector_auth` -- verify username/password auth negotiation
- `test_proxied_transport_connect` -- full SOCKS5 -> TLS -> send/receive cycle

These tests bind to `127.0.0.1:0` (OS-assigned port) so they do not conflict with real Tor.

Mark these tests with `#[ignore]` if they require real network -- provide a `--ignored` CI flag to run them.

### Task 4.4: Command-Level Tests

**File**: `crates/tallow/tests/proxy_cli.rs` (or inline in existing test files)

Tests:
- `test_tor_flag_without_tor_running` -- `--tor` with no Tor on 9050 produces an actionable error
- `test_proxy_flag_parse` -- `--proxy socks5://127.0.0.1:1080` creates correct ProxyConfig
- `test_proxy_and_discover_warns` -- `--proxy ... --discover` prints a warning (capture stderr)
- `test_tallow_proxy_env_var` -- `TALLOW_PROXY=socks5://127.0.0.1:1080` is read

### Task 4.5: Verify Clippy + Fmt + Build

Run the full validation suite:
```
cargo fmt --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
cargo build --workspace
```

All must pass green.

---

## Files Modified (Complete List)

### New Files
| File | Description |
|------|-------------|
| `crates/tallow-net/src/transport/proxied.rs` | ProxiedTcpTlsTransport implementation |
| `crates/tallow-net/src/relay/resolve.rs` | Proxy-aware DNS resolution |
| `crates/tallow/src/commands/proxy.rs` | Shared proxy config builder |
| `crates/tallow-net/tests/proxy_integration.rs` | Mock SOCKS5 integration tests |

### Modified Files
| File | Changes |
|------|---------|
| `crates/tallow-net/src/privacy/socks5.rs` | Add `ProxyConfig`, `ProxyAuth`, fix `from_url()` auth parsing |
| `crates/tallow-net/src/privacy/mod.rs` | Re-export `ProxyConfig`, `ProxyAuth` |
| `crates/tallow-net/src/transport/mod.rs` | Add `pub mod proxied;`, re-export `ProxiedTcpTlsTransport` |
| `crates/tallow-net/src/relay/client.rs` | Add `RelayTransport` enum, `new_with_proxy()`, `set_proxy()`, transport dispatch |
| `crates/tallow-net/src/relay/mod.rs` | Add `pub mod resolve;` |
| `crates/tallow/src/cli.rs` | Add `--tor` to SendArgs/ReceiveArgs/SyncArgs/WatchArgs/ClipArgs, add `env = "TALLOW_PROXY"` to `--proxy` |
| `crates/tallow/src/commands/mod.rs` | Add `pub mod proxy;` |
| `crates/tallow/src/commands/send.rs` | Wire proxy config, replace `resolve_relay()`, suppress LAN discovery |
| `crates/tallow/src/commands/receive.rs` | Wire proxy config, replace `resolve_relay()`, suppress LAN advertise |
| `crates/tallow/src/commands/sync.rs` | Wire proxy config, replace inline relay resolution |
| `crates/tallow/src/commands/watch.rs` | Wire proxy config, replace inline relay resolution |
| `crates/tallow/src/commands/clip.rs` | Wire proxy config, replace `resolve_relay()` |
| `crates/tallow/src/commands/doctor.rs` | Add Tor availability check |
| `crates/tallow-store/src/config/schema.rs` | Add `default_proxy` field to `PrivacyConfig` |

### Unchanged
| Component | Reason |
|-----------|--------|
| `crates/tallow-relay/` | Relay already accepts TCP+TLS -- no server changes needed |
| `crates/tallow-crypto/` | Crypto layer is transport-agnostic -- no changes needed |
| `crates/tallow-protocol/` | Wire protocol unchanged -- only the transport underneath changes |
| `crates/tallow-tui/` | TUI not involved in this phase |

---

## Dependency Changes

None. All required crates are already in the dependency tree:
- `tokio-socks = "0.5"` -- already in `tallow-net/Cargo.toml`
- `hickory-resolver` with `dns-over-https-rustls` -- already in `tallow-net/Cargo.toml`
- `tokio-rustls` -- already in `tallow-net/Cargo.toml`
- `rustls` -- already in `tallow-net/Cargo.toml`

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| DNS leak via system resolver | Critical | Three-branch resolution in `resolve_relay_proxy()` -- Tor mode never calls DNS, generic SOCKS5 uses DoH |
| QUIC attempted through SOCKS5 | High | `ProxyConfig` forces `ProxiedTcpTlsTransport` -- QUIC path is unreachable when proxy is set |
| TLS SNI leaks hostname | Low | Currently uses `"localhost"` -- safe because SNI travels through the SOCKS5 tunnel. Monitor for Tor exit node issues |
| mDNS/STUN/UPnP leak local IP | Medium | Suppress LAN discovery when proxy active, warn on explicit `--discover` |
| Tor not running on `--tor` | Low | Probe port 9050 before attempting connection, report actionable error |
| `from_url()` breaks existing callers | Low | Only extends parsing -- existing `host:port` format continues to work |
| Performance degradation through Tor | Expected | Not a bug. Document in `--tor` help text. Progress bar naturally reflects slower speeds |

---

## Execution Order

```
Wave 1 (Foundation)
  1.1  ProxyConfig + ProxyAuth structs + URL parsing
  1.2  ProxiedTcpTlsTransport
  1.3  RelayClient transport abstraction
  1.4  Build validation

Wave 2 (DNS Safety)
  2.1  resolve_relay_proxy() + ResolvedRelay enum
  2.2  Replace resolve_relay() in all commands
  2.3  LAN discovery suppression

Wave 3 (CLI Wiring)
  3.1  --tor flag on all arg structs
  3.2  build_proxy_config() shared helper
  3.3  Wire proxy into send/receive/sync/watch/clip
  3.4  Config schema default_proxy field
  3.5  Doctor command Tor check

Wave 4 (Verification)
  4.1  ProxyConfig unit tests
  4.2  DNS resolution unit tests
  4.3  Mock SOCKS5 integration tests
  4.4  Command-level tests
  4.5  Full cargo fmt/clippy/test/build
```

Estimated total: ~1,200 lines of new code, ~200 lines of modified code, ~400 lines of tests.

---

## What Is Deferred

| Feature | Reason | Phase |
|---------|--------|-------|
| Traffic analysis padding (`--pad-traffic`) | 60%+ bandwidth overhead, Tor already provides circuit-level padding | Phase 15+ |
| Tor control port (9051) integration | Massive scope: circuit management, stream isolation | Out of scope |
| QUIC-over-TCP tunneling (MASQUE) | No library support, requires relay changes | Out of scope |
| Onion service hosting | Separate infrastructure work | Out of scope |
| Pluggable transports (obfs4, meek) | Tor-level concern, users configure Tor separately | Out of scope |
