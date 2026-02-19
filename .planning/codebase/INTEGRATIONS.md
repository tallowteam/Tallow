# External Integrations

**Analysis Date:** 2026-02-19

## Cryptographic Libraries (Core Integrations)

Tallow does not integrate with external cloud APIs or SaaS services. All cryptographic operations are handled by local Rust crates. The key external integrations are cryptographic protocol libraries and network services.

**Post-Quantum KEM:**
- `pqcrypto-kyber` (v0.8) — ML-KEM-1024 (Kyber1024) key encapsulation
  - Usage: `crates/tallow-crypto/src/kem/mlkem.rs`
  - API: `kyber1024::keypair()`, `kyber1024::encapsulate()`, `kyber1024::decapsulate()`
  - Note: Wraps the `pqcrypto` family of NIST PQC reference implementations
- `pqcrypto-dilithium` (v0.5) — ML-DSA-87 (Dilithium3) signatures
  - Usage: `crates/tallow-crypto/src/sig/mldsa.rs`
- `pqcrypto-sphincsplus` (v0.7) — SLH-DSA (SPHINCS+) stateless hash-based signatures
  - Usage: `crates/tallow-crypto/src/sig/slhdsa.rs`

**Classical Cryptography:**
- `x25519-dalek` (v2) + `curve25519-dalek` (v4) — X25519 Diffie-Hellman (RustCrypto / Dalek ecosystem)
  - Usage: `crates/tallow-crypto/src/kem/x25519.rs`, hybrid KEM in `crates/tallow-crypto/src/kem/hybrid.rs`
- `ed25519-dalek` (v2) — Ed25519 signatures
  - Usage: `crates/tallow-crypto/src/sig/ed25519.rs`, hybrid signer in `crates/tallow-crypto/src/sig/hybrid.rs`
- `aes-gcm` (v0.10) — AES-256-GCM AEAD (RustCrypto)
  - Usage: `crates/tallow-crypto/src/symmetric/aes_gcm.rs`
  - Benefit: Hardware acceleration via AES-NI instructions
- `chacha20poly1305` (v0.10) — ChaCha20-Poly1305 AEAD fallback (RustCrypto)
  - Usage: `crates/tallow-crypto/src/symmetric/chacha20.rs`
  - Used in Double Ratchet in `crates/tallow-crypto/src/ratchet/double.rs`
- `aegis` (v0.6, optional) — AEGIS-256 cipher for high throughput
  - Usage: `crates/tallow-crypto/src/symmetric/aegis.rs`
  - Enabled via `--features aegis`
- `hkdf` (v0.12) + `sha2` (v0.10) — HKDF-SHA256 key derivation
  - Usage: `crates/tallow-crypto/src/kdf/hkdf.rs`
- `sha3` (v0.10) — SHA3-256 for NIST compliance contexts
  - Usage: `crates/tallow-crypto/src/hash/sha3.rs`
- `argon2` (v0.5) — Argon2id password hashing and key derivation
  - Usage: `crates/tallow-crypto/src/kdf/argon2.rs`
  - Configured params: 19 MiB memory, 2 iterations, 1 thread (derive_key); PHC string format (hash_password)
  - Note: Current derive_key params (19 MiB, 2 iter, 1 thread) are below documented spec (256 MB, 3 iter, 4 threads) — see CONCERNS.md
- `blake3` (v1) — BLAKE3 hashing and KDF (primary hash function)
  - Usage: `crates/tallow-crypto/src/hash/blake3.rs`; domain-separated via `crates/tallow-crypto/src/hash/domain.rs`
- `opaque-ke` (v3) — OPAQUE password-authenticated key exchange
  - Usage: `crates/tallow-crypto/src/pake/opaque.rs` (currently a stub implementation)
  - PAKE protocol for relay authentication without password exposure

## Network Services

**QUIC Transport:**
- `quinn` (v0.11, optional) — QUIC protocol over UDP
  - Usage: `crates/tallow-net/src/transport/quic.rs`
  - Requires `quic` feature (default enabled)
  - Status: Stub implementation with `todo!()` bodies

**TLS:**
- `rustls` (v0.23, features: `ring`) — TLS 1.3 for TCP connections and relay
  - Usage: `crates/tallow-net/src/transport/tcp_tls.rs`, `crates/tallow-relay/`
- `rustls-pemfile` (v2) — PEM file parsing for TLS certificates
- `webpki-roots` (v0.26) — Mozilla CA root certificate bundle for server verification
- `tokio-rustls` (v0.26) — Async TLS integration with Tokio

**DNS-over-HTTPS:**
- `hickory-resolver` (v0.24, features: `dns-over-https-rustls`) — DoH resolver for metadata-leak-resistant DNS
  - Usage: `crates/tallow-net/src/privacy/doh.rs`
  - Status: Stub (`todo!()`)
  - Purpose: Prevents DNS queries from leaking transfer metadata to ISPs

**Tor / SOCKS5 Proxy:**
- `tokio-socks` (v0.5) — SOCKS5 proxy connector (Tor integration)
  - Usage: `crates/tallow-net/src/privacy/socks5.rs`
  - Status: Stub (`todo!()`)
  - Tor itself is an external process; Tallow connects via SOCKS5 at configurable address
  - Enabled via `onion` feature in `tallow-net` / `tallow`
  - Config: `PrivacyConfig.enable_onion_routing` in `crates/tallow-store/src/config/schema.rs`

**Local Network Discovery:**
- `mdns-sd` (v0.11) — mDNS/DNS-SD for LAN peer discovery
  - Usage: `crates/tallow-net/src/discovery/mdns.rs`, `crates/tallow-net/src/discovery/dns_sd.rs`

**NAT Traversal:**
- `igd-next` (v0.15) — UPnP/IGD for automatic port mapping
  - Usage: `crates/tallow-net/src/nat/upnp.rs`
- STUN: Manual implementation planned in `crates/tallow-net/src/nat/stun.rs` (stub)
- TURN: Manual implementation planned in `crates/tallow-net/src/nat/turn.rs` (stub)
- Hole punching: `crates/tallow-net/src/nat/hole_punch.rs` (stub)

## Self-Hosted Relay Server

**The relay is Tallow's own server, not a third-party service.**
- Binary: `crates/tallow-relay/src/main.rs`
- Binds on `0.0.0.0:443` by default
- Config: `crates/tallow-relay/src/config.rs` — `RelayConfig` struct (TOML)
- TLS: Uses `rustls` + `rcgen` (v0.13) for self-signed certificate generation
- Room tracking: `dashmap` (v6) concurrent map for active sessions
- Status: Core server logic is a stub; authentication (`crates/tallow-relay/src/auth.rs`), rate limiting (`crates/tallow-relay/src/rate_limit.rs`), and signaling (`crates/tallow-relay/src/signaling.rs`) are scaffold modules
- Relay is fully untrusted by design — sees only encrypted data

## Data Storage

**Databases:**
- No external database. Uses encrypted local key-value store.
- `EncryptedKv` in `crates/tallow-store/src/persistence/encrypted_kv.rs` — in-memory HashMap backed, to-disk persistence planned (currently stub)
- Config: TOML files at XDG paths (`~/.config/tallow/`, see `crates/tallow-store/src/persistence/paths.rs`)
- Identity/keys: Stored at `~/.local/share/tallow/` (XDG data dir)

**File Storage:**
- Local filesystem only. No cloud storage integration.
- Download directory configurable: `TransferConfig.download_dir` in config schema

**Caching:**
- `~/.cache/tallow/` path defined; no cache implementation yet

## Authentication and Identity

**Auth Provider:**
- Self-managed identity system (no OAuth, no external auth)
- Identity keypairs: Hybrid Ed25519 + ML-DSA-87, generated locally
  - `crates/tallow-store/src/identity/keypair.rs`
  - Fingerprints in `crates/tallow-store/src/identity/fingerprint.rs`
- Trust model: TOFU (Trust On First Use) with manual verification
  - `crates/tallow-store/src/trust/tofu.rs`, `crates/tallow-store/src/trust/levels.rs`
- PAKE: CPace (`crates/tallow-crypto/src/pake/cpace.rs`) and OPAQUE (`crates/tallow-crypto/src/pake/opaque.rs`) for password-based key exchange (both stubbed)

## Monitoring and Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)

**Logs:**
- `tracing` crate with structured output
- `tracing-subscriber` with `env-filter` and optional JSON format
- `tracing-appender` for file-based log rotation
- Log level controlled by `-v`/`-vv`/`-vvv` CLI flags (see `crates/tallow/src/logging.rs`)

## CI/CD and Deployment

**CI Pipeline:**
- GitHub Actions: `.github/workflows/ci.yml`
  - Jobs: `check`, `test`, `clippy`, `fmt`, `audit`
  - Matrix: Ubuntu, macOS, Windows
  - Security audit via `rustsec/audit-check@v2` using GitHub token

**Release Pipeline:**
- GitHub Actions: `.github/workflows/release.yml`
  - Triggered by `v*` tags
  - Builds 5 targets (Linux x86_64, Linux ARM64, macOS x86_64, macOS ARM64, Windows x86_64)
  - Produces `.tar.gz` (Unix) and `.zip` (Windows) archives with SHA256 checksums
  - Creates GitHub Releases via `softprops/action-gh-release@v2`

**Hosting:**
- Relay: Self-hostable (no managed hosting defined)
- Client: Distributed as pre-built binaries via GitHub Releases

## Wire Protocol Serialization

**Binary encoding:**
- `bincode` v1.3 — Compact binary for protocol messages
- `serde` framework drives all serialization
- Wire messages defined in `crates/tallow-protocol/src/wire/messages.rs`
- Note: `postcard` mentioned in `docs/protocol-spec.md` but not in Cargo.toml; actual implementation uses `bincode`

## File Metadata Handling

**EXIF Stripping:**
- `img-parts` v0.3 — Image format (JPEG, PNG, WebP) byte-level manipulation
  - Usage: `crates/tallow-protocol/src/metadata/stripper.rs`
- `kamadak-exif` v0.5 — EXIF metadata reading for identification before strip

## Webhooks and Callbacks

**Incoming:**
- None (no webhook endpoints)

**Outgoing:**
- None (no webhook delivery)

## Environment Configuration

**Required env vars:**
- None at runtime (config is file-based TOML)
- `RUST_LOG` - Controls tracing log level (standard Rust ecosystem pattern)

**Secrets location:**
- Identity keys stored encrypted in `~/.local/share/tallow/` (XDG data dir)
- No `.env` files or secrets in repository

---

*Integration audit: 2026-02-19*
