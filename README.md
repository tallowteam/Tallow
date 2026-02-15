# Tallow

**The most secure peer-to-peer file transfer CLI tool ever built.**

Rust. Post-Quantum. Onion-Routed. Zero-Knowledge. Memory-Safe.

## Quick Start

```bash
# Send a file
tallow send secret-report.pdf

# Receive (on another machine)
tallow receive lunar-kitchen-marble-crystal-forest-dawn

# Launch TUI dashboard
tallow tui
```

## Features

- **Post-quantum cryptography** — ML-KEM-1024 + X25519 hybrid key exchange
- **End-to-end encryption** — AES-256-GCM / ChaCha20-Poly1305 / AEGIS-256
- **Built-in onion routing** — 3-hop circuits for sender/receiver anonymity
- **Encrypted chat** — Triple Ratchet (Double Ratchet + PQ ratchet layer)
- **Resumable transfers** — Checkpoint and resume from any interruption
- **Adaptive compression** — Zstd, Brotli, LZ4, LZMA with intelligent file analysis
- **QUIC transport** — 0-RTT, multiplexed, connection migration
- **LAN discovery** — mDNS auto-discovery of nearby peers
- **Zero telemetry** — No analytics, no phone-home, no tracking. Ever.
- **Single binary** — Static build, zero runtime dependencies

## Install

```bash
# curl (Linux/macOS)
curl -sSf https://install.tallow.io | sh

# Cargo
cargo install tallow

# Homebrew
brew install tallow

# Scoop (Windows)
scoop install tallow
```

## Build from Source

```bash
git clone https://github.com/AamirAlam/tallow
cd tallow
cargo build --release
# Binary: target/release/tallow
```

Requires Rust 1.80+.

## Architecture

Tallow is a Cargo workspace with 7 crates:

| Crate | Purpose |
|-------|---------|
| `tallow-crypto` | PQC, symmetric encryption, hashing, PAKE, ratchets |
| `tallow-net` | QUIC/TCP transport, mDNS, NAT traversal, relay client |
| `tallow-protocol` | Wire protocol, file transfer pipeline, compression, chat |
| `tallow-store` | Config, identity, contacts, encrypted persistence |
| `tallow-relay` | Self-hosted relay server binary |
| `tallow-tui` | Ratatui terminal dashboard |
| `tallow` | Main CLI binary |

## License

AGPL-3.0-or-later
