# Phase 14: Tor/SOCKS5 Privacy -- Research

## Standard Stack

### SOCKS5 Library: tokio-socks 0.5

The project already depends on `tokio-socks = "0.5"` in `crates/tallow-net/Cargo.toml`. This is the correct choice and should not change.

**tokio-socks key API surface:**

| Method | Use Case |
|--------|----------|
| `Socks5Stream::connect(proxy, target_addr)` | IP-based connection (DNS leak risk) |
| `Socks5Stream::connect(proxy, (hostname, port))` | Hostname-based -- proxy resolves DNS (safe for Tor) |
| `Socks5Stream::connect_with_password(proxy, target, user, pass)` | Authenticated connection |
| `.into_inner()` -> `TcpStream` | Extract the proxied TCP stream for TLS wrapping |

**Alternative considered and rejected:**
- `fast-socks5` -- more features (server, UDP ASSOCIATE), but heavier. We only need client TCP CONNECT. tokio-socks is simpler and already in the dependency tree.

### DNS Resolution: hickory-resolver (already present)

`hickory-resolver = "0.24"` with `dns-over-https-rustls` feature is already in `Cargo.toml`. The `DohResolver` in `privacy/doh.rs` is functional and wraps Cloudflare, Google, and Quad9 DoH endpoints. This is ready to use.

### Transport: TCP+TLS over SOCKS5 (not QUIC)

When a proxy is active, the transport must be TCP+TLS. QUIC cannot traverse SOCKS5 (explained in detail below). The `TcpTlsTransport` and `FallbackTransport` in `transport/` already exist and are functional.

### Relay: tallow-relay server

The relay server (`crates/tallow-relay/`) already accepts both QUIC and TCP+TLS connections. No relay-side changes are needed for proxy support -- the client just connects differently.

## Architecture Patterns

### Pattern 1: Proxy-Aware Transport Layer

The cleanest architecture injects proxy awareness at the transport layer, not at the command level. The relay client (`RelayClient`) currently takes a `SocketAddr` and creates a `QuicTransport` internally. The key change is to make `RelayClient` accept an optional `ProxyConfig` that forces TCP+TLS transport and routes the TCP connection through SOCKS5.

```
User CLI --proxy flag
    |
    v
ProxyConfig { socks5_addr, use_doh, tor_mode }
    |
    v
RelayClient::new_with_proxy(relay_addr, proxy_config)
    |
    v
Socks5Connector::connect_hostname(relay_host, relay_port)
    |
    v
TcpStream (proxied) -> TLS handshake -> TcpTlsTransport
    |
    v
Normal relay protocol (RoomJoin, data forwarding, etc.)
```

### Pattern 2: DNS Resolution Chain

When proxy is active, DNS resolution must never hit the system resolver. The resolution chain should be:

1. If relay address is already an IP (`SocketAddr` parses), skip DNS entirely
2. If proxy is active and relay is a hostname, use one of:
   - **Tor mode**: Send hostname directly to SOCKS5 proxy (Tor resolves it at exit node)
   - **Generic SOCKS5 mode**: Use DoH (`DohResolver`) to resolve hostname, then `Socks5Connector::connect()` with the resolved IP
3. If no proxy, use system DNS (current behavior via `std::net::ToSocketAddrs`)

### Pattern 3: Separate "ProxiedTcpTlsTransport"

Rather than modifying the existing `TcpTlsTransport`, create a `ProxiedTcpTlsTransport` that:
1. Takes a `Socks5Connector` at construction
2. Connects via `connect_hostname` (or `connect` for IPs)
3. Wraps the resulting `TcpStream` in TLS via `tokio_rustls::TlsConnector`
4. Implements the `Transport` trait identically to `TcpTlsTransport`

This avoids polluting the non-proxy code path and makes the proxy transport independently testable.

### Pattern 4: `--tor` as Sugar for `--proxy socks5://127.0.0.1:9050`

The `--tor` flag should be pure CLI sugar:
- Set proxy to `socks5://127.0.0.1:9050` (Tor default)
- Enable DNS-through-proxy (hostname passed to Tor, not resolved locally)
- Optionally: probe the Tor SOCKS port first and report if Tor is not running

## Don't Hand-Roll

1. **SOCKS5 protocol**: Use `tokio-socks` exclusively. The SOCKS5 handshake (version negotiation, auth, CONNECT command) is tricky. The existing `Socks5Connector` wrapping is correct.

2. **DNS-over-HTTPS**: Use `hickory-resolver` with DoH config. Do not build raw HTTPS DNS queries. The `DohResolver` is already functional.

3. **TLS**: Use `tokio-rustls` with the existing `SkipServerVerification` (relay is untrusted by design). Do not change the TLS verification model for proxied connections.

4. **Tor control protocol**: Do NOT implement Tor control port (9051) communication for circuit management. That is massive scope creep. Just use the SOCKS5 interface.

5. **Traffic analysis padding at the application level**: The `TrafficShaper` in `privacy/traffic_analysis.rs` exists and is functional, but integrating it into the transfer pipeline should be deferred to Phase 15 or beyond. The research section below explains why.

6. **UDP ASSOCIATE for QUIC-over-SOCKS5**: Do not attempt this. It doesn't work with Tor and has negligible real-world proxy support.

## Common Pitfalls

### Pitfall 1: DNS Leaks (Critical)

**The #1 failure mode.** The current `resolve_relay()` function in both `send.rs` and `receive.rs` uses `std::net::ToSocketAddrs`, which calls the system resolver. If `--proxy` is set and the relay address is a hostname, this leaks the relay hostname to the local DNS server, completely defeating the purpose of the proxy.

**Fix**: When proxy is active, `resolve_relay()` must:
- For Tor mode: not resolve at all -- pass hostname to `Socks5Connector::connect_hostname`
- For generic SOCKS5: resolve via `DohResolver`, never the system resolver

The current `Socks5Connector` already has `connect_hostname()` with a doc comment warning about this exact issue. The fix is in the calling code, not the connector.

### Pitfall 2: QUIC Cannot Traverse SOCKS5

SOCKS5's TCP CONNECT command creates a TCP tunnel. QUIC runs over UDP. These are fundamentally incompatible:
- SOCKS5 UDP ASSOCIATE exists in the spec but Tor does not support it
- Even non-Tor SOCKS5 proxies rarely support UDP ASSOCIATE properly
- Chrome, Firefox, and Safari all refuse to send QUIC through SOCKS5

**Fix**: When proxy is active, force TCP+TLS transport. Never attempt QUIC. The current `RelayClient` hardcodes `QuicTransport` -- this must be changed to support `TcpTlsTransport` when a proxy is configured.

### Pitfall 3: TLS SNI Leaks Hostname

When wrapping a proxied TCP stream in TLS, the TLS ClientHello includes the Server Name Indication (SNI) field. Currently the code uses `"localhost"` as the server name (see `tls_config.rs` line 144 and `tcp_tls.rs` line 56). This is actually safe for our case because:
- The relay uses self-signed certs (no real hostname needed)
- SNI goes through the encrypted SOCKS5 tunnel to the proxy
- The proxy sees the hostname anyway (it's doing the TCP CONNECT)

However, verify that `"localhost"` SNI doesn't cause Tor exit node issues. Tor exit nodes see the TLS handshake -- an SNI of `"localhost"` connecting to a remote IP might look suspicious. Consider using the actual relay hostname as SNI, which Tor already knows from the SOCKS5 CONNECT.

### Pitfall 4: IP Address Leaks from Other System Calls

Even with proxy-routed relay connections, other operations could leak the user's IP:
- mDNS discovery (`--discover`, `--advertise`) broadcasts on the local network
- STUN/TURN queries
- UPnP requests

**Fix**: When proxy mode is active, automatically disable mDNS discovery, STUN, TURN, and UPnP. Print a warning if the user explicitly passes `--discover` with `--proxy`.

### Pitfall 5: Relay Address as SocketAddr Bypasses Proxy DNS

The current default relay address is `129.146.114.5:4433` (a raw IP). This means DNS leaks don't occur with the default relay. But if a user configures a hostname-based relay (e.g., `relay.tallow.dev:4433`), the leak occurs. The fix must handle both cases.

### Pitfall 6: connect() vs connect_hostname() on Socks5Connector

`Socks5Connector::connect(SocketAddr)` is unsafe for Tor because DNS was already resolved locally. `connect_hostname(&str, u16)` is safe because the proxy resolves DNS. The code must use the right method based on context:
- If relay address parsed as IP: use `connect(SocketAddr)` (no DNS involved)
- If relay address is hostname: use `connect_hostname(host, port)` (proxy resolves)

### Pitfall 7: Proxy Auth Credentials in CLI

If the user passes `--proxy socks5://user:pass@127.0.0.1:1080`, the URL must be parsed to extract credentials. The current `Socks5Connector::from_url()` does not handle userinfo in the URL. It only strips the scheme prefix and parses the rest as `SocketAddr`.

## Code Examples

### Example 1: ProxyConfig Structure

```rust
/// Proxy configuration for routing relay connections
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

impl ProxyConfig {
    /// Parse from CLI --proxy flag value
    pub fn from_url(url: &str) -> Result<Self> {
        let stripped = url
            .strip_prefix("socks5://")
            .or_else(|| url.strip_prefix("socks5h://"))
            .unwrap_or(url);

        // Parse userinfo if present (user:pass@host:port)
        let (auth, addr_str) = if let Some(at_pos) = stripped.find('@') {
            let userinfo = &stripped[..at_pos];
            let addr = &stripped[at_pos + 1..];
            let (user, pass) = userinfo.split_once(':')
                .ok_or_else(|| NetworkError::ConnectionFailed(
                    "Proxy auth must be user:pass".into()
                ))?;
            (Some(ProxyAuth {
                username: user.to_string(),
                password: pass.to_string(),
            }), addr)
        } else {
            (None, stripped)
        };

        let addr: SocketAddr = addr_str.parse().map_err(|e| {
            NetworkError::ConnectionFailed(format!("Invalid proxy address: {}", e))
        })?;

        Ok(Self {
            socks5_addr: addr,
            tor_mode: false,
            auth,
        })
    }

    /// Create Tor-mode proxy config (localhost:9050)
    pub fn tor_default() -> Self {
        Self {
            socks5_addr: "127.0.0.1:9050".parse().unwrap(),
            tor_mode: true,
            auth: None,
        }
    }
}
```

### Example 2: ProxiedTcpTlsTransport

```rust
use crate::privacy::Socks5Connector;
use crate::{NetworkError, Result, Transport};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio_rustls::client::TlsStream;

/// TCP+TLS transport routed through a SOCKS5 proxy
pub struct ProxiedTcpTlsTransport {
    connector: Socks5Connector,
    stream: Option<TlsStream<TcpStream>>,
    /// Relay hostname (for connect_hostname)
    relay_host: Option<String>,
    /// Relay port
    relay_port: u16,
    /// Whether to use hostname-based connection (Tor mode)
    use_hostname: bool,
}

impl Transport for ProxiedTcpTlsTransport {
    async fn connect(&mut self, addr: SocketAddr) -> Result<()> {
        // Step 1: Connect through SOCKS5 proxy
        let tcp_stream = if self.use_hostname {
            if let Some(ref host) = self.relay_host {
                self.connector.connect_hostname(host, self.relay_port).await?
            } else {
                self.connector.connect(addr).await?
            }
        } else {
            self.connector.connect(addr).await?
        };

        // Step 2: Wrap in TLS
        let tls_config = super::tls_config::rustls_client_config()?;
        let tls_connector = tokio_rustls::TlsConnector::from(tls_config);

        let server_name = if let Some(ref host) = self.relay_host {
            rustls::pki_types::ServerName::try_from(host.as_str())
                .unwrap_or_else(|_| {
                    rustls::pki_types::ServerName::try_from("localhost").unwrap()
                })
                .to_owned()
        } else {
            rustls::pki_types::ServerName::try_from("localhost")
                .unwrap()
                .to_owned()
        };

        let tls_stream = tls_connector.connect(server_name, tcp_stream).await
            .map_err(|e| NetworkError::TlsError(
                format!("TLS over SOCKS5 failed: {}", e)
            ))?;

        self.stream = Some(tls_stream);
        Ok(())
    }

    // send() and receive() identical to TcpTlsTransport
}
```

### Example 3: Proxy-Aware RelayClient

```rust
impl RelayClient {
    /// Create a relay client that routes through a SOCKS5 proxy
    pub fn new_with_proxy(
        relay_host: &str,
        relay_port: u16,
        proxy: ProxyConfig,
    ) -> Self {
        Self {
            relay_addr: format!("{}:{}", relay_host, relay_port)
                .parse()
                .unwrap_or_else(|_| {
                    // If hostname doesn't parse as SocketAddr, use a placeholder
                    // The actual connection goes through SOCKS5 with the hostname
                    "0.0.0.0:0".parse().unwrap()
                }),
            transport: None, // Will use ProxiedTcpTlsTransport instead of QuicTransport
            peer_present: false,
            proxy_config: Some(proxy),
            relay_hostname: Some(relay_host.to_string()),
        }
    }
}
```

### Example 4: Proxy-Aware DNS Resolution

```rust
/// Resolve relay address with proxy awareness
///
/// When proxy is active:
///   - Tor mode: Returns None (hostname sent to SOCKS5 proxy, not resolved locally)
///   - Generic SOCKS5: Resolves via DoH (encrypted DNS)
/// When no proxy: Uses system DNS resolver
async fn resolve_relay_proxied(
    relay: &str,
    proxy: Option<&ProxyConfig>,
) -> io::Result<ResolvedRelay> {
    // Try parsing as IP:port first (no DNS needed)
    if let Ok(addr) = relay.parse::<SocketAddr>() {
        return Ok(ResolvedRelay::Addr(addr));
    }

    // Split host:port
    let (host, port) = parse_host_port(relay)?;

    match proxy {
        Some(proxy) if proxy.tor_mode => {
            // Tor mode: don't resolve, pass hostname to SOCKS5
            Ok(ResolvedRelay::Hostname {
                host: host.to_string(),
                port,
            })
        }
        Some(_proxy) => {
            // Generic SOCKS5: resolve via DoH
            let resolver = DohResolver::cloudflare();
            let addrs = resolver.resolve(host).await
                .map_err(|e| io::Error::other(format!("DoH resolution failed: {}", e)))?;
            let ip = addrs.into_iter().next()
                .ok_or_else(|| io::Error::other("DoH returned no addresses"))?;
            Ok(ResolvedRelay::Addr(SocketAddr::new(ip, port)))
        }
        None => {
            // No proxy: system DNS
            use std::net::ToSocketAddrs;
            let addr = relay.to_socket_addrs()?
                .next()
                .ok_or_else(|| io::Error::other("No addresses found"))?;
            Ok(ResolvedRelay::Addr(addr))
        }
    }
}

enum ResolvedRelay {
    /// Resolved to an IP address
    Addr(SocketAddr),
    /// Hostname to be resolved by proxy (Tor mode)
    Hostname { host: String, port: u16 },
}
```

### Example 5: Tor Auto-Detection

```rust
/// Check if Tor is running on the default SOCKS port
async fn check_tor_available() -> bool {
    let addr: SocketAddr = "127.0.0.1:9050".parse().unwrap();

    // Try connecting to Tor's SOCKS port
    match tokio::time::timeout(
        std::time::Duration::from_secs(2),
        tokio::net::TcpStream::connect(addr),
    ).await {
        Ok(Ok(_stream)) => {
            tracing::info!("Tor SOCKS port reachable at {}", addr);
            true
        }
        _ => {
            tracing::warn!("Tor does not appear to be running on {}", addr);
            false
        }
    }
}
```

### Example 6: CLI --tor Flag Integration

```rust
// In send.rs / receive.rs execute()
let proxy_config = if args.tor {
    if !check_tor_available().await {
        output::color::error(
            "Tor does not appear to be running. Start Tor and try again, \
             or use --proxy socks5://host:port for a custom SOCKS5 proxy."
        );
        return Err(io::Error::other("Tor not available"));
    }
    Some(ProxyConfig::tor_default())
} else if let Some(ref proxy_url) = args.proxy {
    Some(ProxyConfig::from_url(proxy_url)
        .map_err(|e| io::Error::other(format!("Invalid proxy: {}", e)))?)
} else {
    None
};

// Warn if --discover is used with --proxy (IP leak)
if args.discover && proxy_config.is_some() {
    output::color::warning(
        "LAN discovery disabled: --discover leaks local IP when using a proxy"
    );
}
```

## Gap Analysis

### What Exists (Functional)

| Component | Location | Status |
|-----------|----------|--------|
| `Socks5Connector` | `privacy/socks5.rs` | Functional -- `connect()` and `connect_hostname()` work, URL parsing works |
| `DohResolver` | `privacy/doh.rs` | Functional -- Cloudflare/Google/Quad9 DoH resolution works |
| `TrafficShaper` | `privacy/traffic_analysis.rs` | Functional -- pad/unpad/shape work, but not wired into transfer pipeline |
| `TcpTlsTransport` | `transport/tcp_tls.rs` | Functional -- TCP+TLS with length-prefixed framing |
| `FallbackTransport` | `transport/fallback.rs` | Functional -- QUIC-first with TCP+TLS fallback |
| `--proxy` CLI flag | `cli.rs` (SendArgs, ReceiveArgs, etc.) | Exists but not wired -- the flag is parsed but never used |
| `PrivacyConfig` | `config/schema.rs` | Exists -- has `enable_onion_routing` and `use_doh` fields |

### What's Missing (Must Build)

| Component | Description | Effort |
|-----------|-------------|--------|
| `ProxyConfig` struct | Unified proxy configuration with Tor mode, auth, DoH settings | Small |
| `ProxiedTcpTlsTransport` | TCP+TLS transport that connects through SOCKS5 | Medium |
| `--tor` CLI flag | Sugar for `--proxy socks5://127.0.0.1:9050` with Tor detection | Small |
| Proxy-aware `RelayClient` | `RelayClient::new_with_proxy()` or `connect_proxied()` | Medium |
| Proxy-aware DNS resolution | Replace `resolve_relay()` in send.rs/receive.rs with proxy-aware version | Medium |
| Wire proxy into send/receive/sync/watch | Pass `ProxyConfig` from CLI flags through to `RelayClient` | Medium |
| LAN discovery suppression | Disable mDNS/STUN/UPnP when proxy active | Small |
| `TALLOW_PROXY` env var | Environment variable for proxy, analogous to `TALLOW_RELAY` | Trivial |
| Integration tests | Mock SOCKS5 server for testing proxy path | Medium |
| `tallow doctor` proxy check | Doctor command should test proxy connectivity | Small |

### What Exists But Needs Modification

| Component | Current State | Required Change |
|-----------|---------------|-----------------|
| `RelayClient` | Hardcodes `QuicTransport` | Must support `TcpTlsTransport` via `ProxiedTcpTlsTransport` when proxy is set |
| `resolve_relay()` | Uses `std::net::ToSocketAddrs` (DNS leak) | Must use DoH or skip resolution for Tor mode |
| `Socks5Connector::from_url()` | Does not parse `user:pass@host:port` | Must handle userinfo in URL |
| `PrivacyConfig` | Has `enable_onion_routing` but no `proxy_address` | Add `default_proxy` field |
| `SendArgs` / `ReceiveArgs` | Has `--proxy` flag but field is unused | Wire into `ProxyConfig` construction |

### What Should Be Deferred

| Component | Reason to Defer |
|-----------|----------------|
| Traffic shaping integration | Adds 60%+ bandwidth overhead, complex to tune, diminishing returns when Tor already provides traffic analysis resistance at the circuit level |
| Tor control port (9051) integration | Massive scope: circuit management, stream isolation, onion services. SOCKS5 interface is sufficient |
| QUIC-over-TCP tunneling | Requires custom encapsulation (e.g., MASQUE/CONNECT-UDP), no library support, relay changes needed |
| Onion service hosting | Running a Tor hidden service for the relay is separate infrastructure work |
| Pluggable transports (obfs4, meek) | Tor-level concern, not application-level. Users should configure Tor's pluggable transports separately |

## Proxy Architecture Design

### Layer Diagram

```
Layer 4 (Application):  send.rs / receive.rs / sync.rs / watch.rs
                              |
Layer 3 (Relay):         RelayClient { proxy_config: Option<ProxyConfig> }
                              |
                    +---------+---------+
                    |                   |
Layer 2a (Direct):  |         Layer 2b (Proxied):
  QuicTransport     |           ProxiedTcpTlsTransport
  (no proxy)        |               |
                    |           Socks5Connector
                    |               |
Layer 1 (Network):  UDP socket      TCP socket -> SOCKS5 -> TCP to relay
```

### Connection Flow (Proxied)

```
1. CLI parses --proxy / --tor flag -> ProxyConfig
2. ProxyConfig determines:
   - Force TCP+TLS (no QUIC)
   - DNS strategy (Tor: hostname to proxy, Generic: DoH)
   - Disable LAN discovery
3. RelayClient::new_with_proxy(relay_host, relay_port, proxy_config)
4. RelayClient::connect():
   a. Socks5Connector::connect_hostname(relay_host, relay_port)
      -> SOCKS5 handshake with proxy
      -> Proxy opens TCP to relay
      -> Returns TcpStream (tunneled through proxy)
   b. TLS handshake over proxied TcpStream
      -> tokio_rustls wraps stream
   c. ProxiedTcpTlsTransport stores TLS stream
5. RoomJoin message sent over proxied TLS stream
6. Transfer proceeds identically (length-prefixed framing)
7. All data flows: Client <-> SOCKS5 Proxy <-> Relay
   - Proxy sees TLS ciphertext only
   - Relay sees TLS-decrypted wire protocol only (still E2E encrypted)
   - No party sees plaintext file content
```

### DNS Resolution Decision Tree

```
resolve_relay(relay_str, proxy_config):
  |
  +-- Is relay_str a valid SocketAddr (IP:port)?
  |     Yes -> Return SocketAddr (no DNS needed)
  |     No  -> Continue (it's a hostname)
  |
  +-- Is proxy_config set?
  |     No  -> Use std::net::ToSocketAddrs (system DNS) -- current behavior
  |     Yes -> Continue
  |
  +-- Is proxy_config.tor_mode?
  |     Yes -> Return Hostname { host, port } -- Tor resolves via SOCKS5
  |     No  -> Continue (generic SOCKS5)
  |
  +-- Resolve via DohResolver::cloudflare()
        -> Return SocketAddr from DoH result
```

### Config Integration

Add to `PrivacyConfig` in `config/schema.rs`:

```rust
pub struct PrivacyConfig {
    pub strip_metadata: bool,
    pub encrypt_filenames: bool,
    pub enable_onion_routing: bool,
    pub use_doh: bool,
    /// Default SOCKS5 proxy (e.g., "socks5://127.0.0.1:9050")
    #[serde(default)]
    pub default_proxy: String,
    /// Default DoH provider ("cloudflare", "google", "quad9")
    #[serde(default = "default_doh_provider")]
    pub doh_provider: String,
}
```

### CLI Flag Hierarchy

Priority order (highest to lowest):
1. `--tor` flag (overrides everything, forces Tor defaults)
2. `--proxy <url>` flag (explicit proxy)
3. `TALLOW_PROXY` environment variable
4. `privacy.default_proxy` in config file
5. No proxy (direct connection)

### Files to Modify

```
crates/tallow-net/src/privacy/socks5.rs     -- Add ProxyConfig, fix URL parsing
crates/tallow-net/src/privacy/mod.rs        -- Re-export ProxyConfig
crates/tallow-net/src/transport/mod.rs       -- Add ProxiedTcpTlsTransport module
crates/tallow-net/src/transport/proxied.rs   -- New: ProxiedTcpTlsTransport impl
crates/tallow-net/src/relay/client.rs        -- Add new_with_proxy(), connect_proxied()
crates/tallow/src/cli.rs                     -- Add --tor flag to SendArgs, ReceiveArgs, etc.
crates/tallow/src/commands/send.rs           -- Wire proxy into relay connection
crates/tallow/src/commands/receive.rs        -- Wire proxy into relay connection
crates/tallow/src/commands/sync.rs           -- Wire proxy into relay connection
crates/tallow/src/commands/watch.rs          -- Wire proxy into relay connection
crates/tallow-store/src/config/schema.rs     -- Add default_proxy, doh_provider fields
```

## Performance Considerations

### SOCKS5 Overhead

SOCKS5 adds one additional TCP hop between the client and the relay. The overhead is:
- **Latency**: +1 RTT for the SOCKS5 handshake (~1-5ms local, ~50-200ms for remote proxy)
- **Bandwidth**: Negligible -- SOCKS5 framing is minimal (header bytes only)
- **Connection setup**: ~10ms for SOCKS5 negotiation + TLS handshake through the tunnel

### Tor-Specific Overhead

When routing through Tor (3-hop circuit):
- **Latency**: +200-800ms per round trip (3 hops, each adding 50-200ms)
- **Bandwidth**: Tor cells are 512 bytes; overhead from cell padding is ~5-10%
- **Circuit setup**: 1-3 seconds for circuit establishment (one-time per connection)
- **Throughput**: Typically 1-10 MB/s through Tor (varies by circuit quality)

**Impact on transfer UX:**
- Small files (<1MB): Latency dominates. Transfer takes 2-5 seconds instead of <1 second
- Large files (>100MB): Throughput dominates. Transfer takes 10-100x longer through Tor
- The progress bar and ETA in the transfer pipeline will naturally reflect Tor's lower throughput

### TCP vs QUIC Degradation

Forcing TCP+TLS (because QUIC cannot traverse SOCKS5) means:
- Loss of QUIC's 0-RTT connection resumption
- Loss of QUIC's multiplexed streams (single TCP stream for all data)
- Head-of-line blocking on packet loss (TCP retransmits block all data)
- No UDP hole-punching for direct connections

For relay-proxied transfers, the practical impact is moderate:
- Single bidirectional stream is sufficient (we only use one stream anyway)
- Relay connections are long-lived, so 0-RTT savings are irrelevant
- Head-of-line blocking matters mainly for high-loss networks

### Traffic Analysis Resistance: Cost/Benefit

The existing `TrafficShaper` provides constant-rate padding with configurable packet sizes. Analysis:

| Defense | Bandwidth Overhead | Latency Overhead | Effectiveness |
|---------|-------------------|------------------|---------------|
| No padding | 0% | 0ms | None |
| Fixed-size packets only | 5-20% | 0ms | Low (timing still visible) |
| Constant-rate shaping | 60-200% | Variable | Moderate (defeats length analysis) |
| Full cover traffic | 300%+ | Variable | High (defeats timing analysis) |

**Recommendation**: For Phase 14, implement only the proxy routing (SOCKS5/Tor). Traffic analysis resistance should be an opt-in feature (`--pad-traffic`) deferred to Phase 15 or beyond. Reasons:
1. Tor already provides circuit-level traffic analysis resistance
2. Application-level padding on top of Tor provides diminishing returns
3. The bandwidth overhead is significant and confusing to users
4. Cover traffic generation runs counter to the "minimal budget" design principle
5. Research shows adaptive padding requires neural-network-based tuning to be effective (DeTorrent, MUFFLER) -- far beyond scope

### DoH Performance

DNS-over-HTTPS resolution via `DohResolver`:
- First query: 100-300ms (HTTPS connection setup + DNS query)
- Cached queries: <10ms (hickory-resolver has a 64-entry cache)
- Relay hostname is typically resolved once per session

This is acceptable. The relay hostname is resolved once at connection time, not per-chunk.

### Recommended Performance Guards

1. **Connection timeout**: Set a 10-second timeout for SOCKS5 connection (Tor can be slow)
2. **Tor circuit retry**: If connection fails, suggest user restart Tor or use `--proxy` with a different proxy
3. **Progress bar update**: No changes needed -- the existing progress bar will naturally show slower speeds through Tor
4. **Chunk size**: Keep the 64KB chunk size unchanged. Smaller chunks waste Tor bandwidth on framing; larger chunks increase latency between progress updates
5. **Keep-alive**: The 15-second keep-alive interval in `tls_config.rs` is appropriate for proxied connections. Tor circuits can idle for minutes without being torn down
