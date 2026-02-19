# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- Rust (stable toolchain, 2021 edition) - All crates; enforced by `rust-toolchain.toml`

**Secondary:**
- None - pure Rust workspace

## Runtime

**Environment:**
- Rust stable toolchain (minimum `rust-version = "1.80"`, from `Cargo.toml`)
- Components required: `clippy`, `rustfmt` (see `rust-toolchain.toml`)

**Package Manager:**
- Cargo (workspace resolver v2)
- Lockfile: `Cargo.lock` present and committed

## Frameworks

**Async Runtime:**
- `tokio` v1 (features: `full`) - Multi-threaded async runtime; `#[tokio::main]` entry point in `crates/tallow/src/main.rs` and `crates/tallow-relay/src/main.rs`
- `tokio-util` v0.7 (features: `codec`, `io`) - Codec and IO adapters
- `futures` v0.3 - Async stream combinators

**CLI Framework:**
- `clap` v4 (features: `derive`, `env`, `string`, `wrap_help`) - Used in `crates/tallow/src/cli.rs` via derive API
- `clap_complete` v4 - Shell completion generation
- `clap_mangen` v0.2 - Man page generation

**TUI Framework:**
- `ratatui` v0.29 (features: `all-widgets`) - Immediate-mode terminal UI; used throughout `crates/tallow-tui/src/`
- `crossterm` v0.28 (features: `event-stream`) - Terminal backend and input events

**Testing:**
- `proptest` v1 - Property-based testing (dev-dep in `crates/tallow-crypto/`)
- `criterion` v0.5 (features: `html_reports`) - Benchmarking framework; bench target `crypto_benchmarks` in `crates/tallow-crypto/benches/`
- `insta` v1 - Snapshot testing (dev-dep in `crates/tallow-tui/`)
- `assert_cmd` v2 / `predicates` v3 - CLI integration testing (dev-dep in `crates/tallow/`)
- `tempfile` v3 - Temp file fixtures (dev-deps in `tallow-protocol`, `tallow-store`, `tallow`)

**Build/Dev:**
- `cargo audit` - CVE scanning via RustSec advisory database
- `cargo deny` - License, advisory, duplicate dependency checks
- `cargo fuzz` - Fuzz testing (requires nightly)
- GitHub Actions CI: `.github/workflows/ci.yml`, `.github/workflows/release.yml`

## Key Dependencies

**Post-Quantum Cryptography:**
- `pqcrypto-kyber` v0.8 - ML-KEM-1024 (Kyber1024) implementation; used in `crates/tallow-crypto/src/kem/mlkem.rs`
- `pqcrypto-traits` v0.3 - Shared PQC trait definitions
- `pqcrypto-dilithium` v0.5 - ML-DSA-87 (Dilithium) signatures; used in `crates/tallow-crypto/src/sig/mldsa.rs`
- `pqcrypto-sphincsplus` v0.7 - SLH-DSA (SPHINCS+) signatures; used in `crates/tallow-crypto/src/sig/slhdsa.rs`

**Classical Cryptography:**
- `x25519-dalek` v2 (features: `static_secrets`) - X25519 Diffie-Hellman; used in `crates/tallow-crypto/src/kem/x25519.rs`
- `curve25519-dalek` v4 - Curve25519 arithmetic primitives
- `ed25519-dalek` v2 (features: `rand_core`) - Ed25519 signatures; used in `crates/tallow-crypto/src/sig/ed25519.rs`
- `aes-gcm` v0.10 - AES-256-GCM AEAD; used in `crates/tallow-crypto/src/symmetric/aes_gcm.rs`
- `chacha20poly1305` v0.10 - ChaCha20-Poly1305 AEAD fallback; used in `crates/tallow-crypto/src/symmetric/chacha20.rs`
- `aegis` v0.6 (optional feature `aegis`) - AEGIS-256 cipher; used in `crates/tallow-crypto/src/symmetric/aegis.rs`
- `hkdf` v0.12 - HKDF key derivation; used in `crates/tallow-crypto/src/kdf/hkdf.rs`
- `sha2` v0.10 - SHA-256/SHA-512
- `sha3` v0.10 - SHA3-256 for NIST compliance contexts; used in `crates/tallow-crypto/src/hash/sha3.rs`
- `argon2` v0.5 - Argon2id password hashing/KDF; used in `crates/tallow-crypto/src/kdf/argon2.rs`
- `blake3` v1 - BLAKE3 hashing and KDF; used extensively as primary hash throughout `crates/tallow-crypto/`
- `opaque-ke` v3 - OPAQUE PAKE protocol; dependency declared for `crates/tallow-crypto/src/pake/opaque.rs` (currently stubbed)

**Memory Safety:**
- `zeroize` v1 (features: `derive`) - Automatic memory zeroing on drop; applied to all key material types
- `secrecy` v0.10 - `SecretBox` wrappers for sensitive data
- `subtle` v2 - Constant-time comparisons for secret-dependent operations
- `rand` v0.8 + `rand_core` v0.6 - CSPRNG
- `getrandom` v0.2 - OS entropy source
- `region` v3 - Cross-platform memory locking (used in `crates/tallow/src/`)

**Networking:**
- `quinn` v0.11 (optional feature `quic`) - QUIC transport; used in `crates/tallow-net/src/transport/quic.rs`
- `rustls` v0.23 (features: `ring`) - TLS 1.3; used in `crates/tallow-net/` and `crates/tallow-relay/`
- `rustls-pemfile` v2 - PEM certificate parsing
- `webpki-roots` v0.26 - Mozilla CA root bundle
- `tokio-rustls` v0.26 - Async TLS over Tokio
- `hickory-resolver` v0.24 (features: `dns-over-https-rustls`) - DNS-over-HTTPS resolver; used in `crates/tallow-net/src/privacy/doh.rs`
- `mdns-sd` v0.11 - mDNS service discovery; used in `crates/tallow-net/src/discovery/mdns.rs`
- `tokio-socks` v0.5 - SOCKS5 proxy (Tor); used in `crates/tallow-net/src/privacy/socks5.rs`
- `igd-next` v0.15 - UPnP for NAT traversal; used in `crates/tallow-net/src/nat/upnp.rs`

**Serialization:**
- `serde` v1 (features: `derive`) - Serialization framework; used throughout all crates
- `serde_json` v1 - JSON for config and output
- `bincode` v1.3 - Compact binary wire format for protocol messages
- `toml` v0.8 - TOML config file parsing; used in `crates/tallow-store/src/config/`

**Compression:**
- `zstd` v0.13 - Primary compression; used in `crates/tallow-protocol/src/compression/zstd.rs`
- `brotli` v7 - Brotli compression; used in `crates/tallow-protocol/src/compression/brotli.rs`
- `lz4_flex` v0.11 - LZ4 fast compression; used in `crates/tallow-protocol/src/compression/lz4.rs`
- `lzma-rs` v0.3 - LZMA/XZ compression; used in `crates/tallow-protocol/src/compression/lzma.rs`

**File Handling:**
- `notify` v7 - Filesystem watching for sync/watch commands
- `tar` v0.4 - Tar archive streaming for directory transfers
- `img-parts` v0.3 - Image format parsing for EXIF stripping; used in `crates/tallow-protocol/src/metadata/stripper.rs`
- `kamadak-exif` v0.5 - EXIF metadata reading for stripping

**CLI Output:**
- `owo-colors` v4 - Zero-alloc terminal colors (NO_COLOR compliant); used in `crates/tallow/src/output/color.rs`
- `indicatif` v0.17 - Progress bars; used in `crates/tallow/src/output/progress.rs`
- `dialoguer` v0.11 (features: `password`, `fuzzy-select`) - Interactive prompts; used in `crates/tallow/src/output/prompts.rs`
- `comfy-table` v7 - Formatted table output
- `qrcode` v0.14 - QR code generation for room codes
- `arboard` v3 - Clipboard access
- `color-eyre` v0.6 - Colorized error reporting
- `tracing-appender` v0.2 - File-based log appending

**Relay Server:**
- `dashmap` v6 - Concurrent HashMap for room/connection tracking; used in `crates/tallow-relay/`
- `rcgen` v0.13 - Self-signed TLS certificate generation for relay

**Storage:**
- `dirs` v6 - XDG/platform-specific path resolution; used in `crates/tallow-store/src/persistence/paths.rs`
- `chrono` v0.4 (features: `serde`, `clock`) - Timestamps in transfer history

**Logging:**
- `tracing` v0.1 - Structured instrumentation throughout all crates
- `tracing-subscriber` v0.3 (features: `env-filter`, `json`) - Log output formatting and filtering

**Error Handling:**
- `thiserror` v2 - Typed error enums in all library crates
- `anyhow` v1 - Top-level error handling in `crates/tallow/src/main.rs` and `crates/tallow-relay/src/main.rs`

**Utilities:**
- `bytes` v1 - Efficient byte buffer management
- `unicode-width` v0.2 - Unicode terminal width calculation in TUI

## Configuration

**Application Config Format:**
- TOML files stored at XDG paths (e.g., `~/.config/tallow/config.toml`)
- Schema defined in `crates/tallow-store/src/config/schema.rs`
- Sections: `network`, `transfer`, `privacy`, `ui`

**Build Features:**
- `tallow` crate features: `tui` (default), `quic` (default), `aegis` (optional), `onion` (optional), `full` (all)
- `tallow-crypto` features: `aegis` (optional), `fips` (optional)
- `tallow-net` features: `quic` (default), `onion` (optional)

**Release Profile:**
- LTO: fat
- Codegen units: 1
- Strip symbols: true
- Panic: abort
- Opt level: 3
- Integer overflow checks: enabled

**Environment Variables:**
- `RUSTFLAGS=-D warnings` enforced in CI
- `CARGO_TERM_COLOR=always` in CI
- No application-level env vars detected (config is file-based)

## Platform Requirements

**Development:**
- Rust stable toolchain (1.80+)
- Cargo with workspace support
- Optional: nightly Rust for `cargo fuzz`

**Production Targets (from `.github/workflows/release.yml`):**
- `x86_64-unknown-linux-gnu` (Linux x86_64)
- `aarch64-unknown-linux-gnu` (Linux ARM64, cross-compiled)
- `x86_64-apple-darwin` (macOS x86_64)
- `aarch64-apple-darwin` (macOS ARM/Apple Silicon)
- `x86_64-pc-windows-msvc` (Windows x86_64)

**OS Sandbox Support:**
- Linux: Landlock + Seccomp-BPF (planned, see `crates/tallow/src/sandbox.rs`)
- OpenBSD: Pledge + Unveil (planned)
- macOS: App Sandbox (planned)
- Windows: No sandboxing

---

*Stack analysis: 2026-02-19*
