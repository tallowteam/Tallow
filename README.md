<div align="center">

# tallow

### The most secure file transfer tool ever built.

**Rust. Post-Quantum. End-to-End Encrypted. Zero-Knowledge. Memory-Safe.**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange.svg?style=for-the-badge&logo=rust)](https://www.rust-lang.org)
[![Build](https://img.shields.io/github/actions/workflow/status/tallowteam/Tallow/release.yml?style=for-the-badge&label=CI)](https://github.com/tallowteam/Tallow/actions)
[![Tests](https://img.shields.io/badge/Tests-598_passing-brightgreen?style=for-the-badge)](#)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey?style=for-the-badge)](#installation)

<br>

*Send any file to anyone. No accounts. No cloud. No compromise.*

<br>

</div>

---

## One-Line Install

```bash
# Linux / macOS
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh

# macOS (Homebrew)
brew tap tallowteam/tap && brew install tallow

# Windows (Scoop)
scoop bucket add tallow https://github.com/tallowteam/scoop-tallow && scoop install tallow

# From source (any platform)
cargo install --git https://github.com/tallowteam/Tallow tallow
```

---

## How It Works

```
  Sender                    Relay (sees nothing)              Receiver
  ------                    ------------------                --------
  tallow send report.pdf
    >> Code phrase:
    >> stamp-daybreak-kindred-preface
                                                              tallow receive stamp-daybreak-kindred-preface

  [ML-KEM-1024 + X25519 hybrid key exchange]
  [AES-256-GCM encrypted chunks via QUIC]

    Sending... ████████████████████ 100%  4.27 MiB at 12.3 MiB/s
                                                              Received report.pdf (4.27 MiB)
  OK: Transfer complete                                       OK: Transfer complete
```

The relay **never** sees your data. It only routes encrypted bytes between peers. Even if the relay is fully compromised, your files remain confidential.

---

## Usage

### Send a file

```bash
tallow send secret-report.pdf
```

Tallow generates a code phrase. Share it with the receiver over any channel.

### Receive a file

```bash
tallow receive stamp-daybreak-kindred-preface
```

That's it. No accounts, no sign-ups, no configuration.

### Send text directly

```bash
# Send a quick message
tallow send -t "The launch code is 42"

# Pipe from stdin
echo "secret data" | tallow send
cat database.sql | tallow send
```

### Send directories

```bash
# Send an entire folder (auto-compressed)
tallow send ./my-project/

# Exclude patterns + respect .gitignore
tallow send ./my-project/ --exclude "*.log,node_modules" --git
```

### Sync directories

```bash
# One-way sync: local -> remote
tallow sync ./docs/ --delete

# Watch for changes and auto-sync
tallow watch ./src/
```

### Encrypted chat

```bash
tallow chat --room my-secret-room
```

### QR code sharing

```bash
tallow send report.pdf --qr
```

Displays a scannable QR code containing the receive command.

### Environment variables

```bash
export TALLOW_RELAY="your-relay.example.com:4433"
export TALLOW_RELAY_PASS="your-password"
export TALLOW_CODE="stamp-daybreak-kindred-preface"
```

All sensitive values are hidden from `--help` output and process listings.

---

## Why Tallow?

### vs. croc

| | **tallow** | croc |
|---|---|---|
| **Encryption** | ML-KEM-1024 + X25519 hybrid (quantum-safe) | PAKE (classical only) |
| **Cipher** | AES-256-GCM / ChaCha20 / AEGIS-256 | AES-256-GCM |
| **Transport** | QUIC (0-RTT, multiplexed) | TCP |
| **Compression** | Adaptive (zstd/brotli/lz4/lzma) | None |
| **Memory safety** | Rust (`#![forbid(unsafe_code)]`) | Go (GC) |
| **Key material** | Zeroized on drop, mlock'd | Standard GC |
| **Relay auth** | BLAKE3 + constant-time verify | PAKE relay |
| **Directory sync** | Built-in one-way sync | No |
| **File watching** | `tallow watch` auto-sync | No |

### vs. Magic Wormhole

| | **tallow** | Magic Wormhole |
|---|---|---|
| **Language** | Rust (single binary) | Python (requires runtime) |
| **Post-quantum** | Yes (ML-KEM-1024) | No |
| **Compression** | Adaptive multi-algorithm | None |
| **Chat** | Built-in encrypted chat | No |
| **Resume** | Checkpoint-based resume | No |

---

## Features

### Cryptography

- **Post-quantum key exchange** -- ML-KEM-1024 + X25519 hybrid KEM (NIST FIPS 203)
- **Authenticated encryption** -- AES-256-GCM (hardware-accelerated), ChaCha20-Poly1305, AEGIS-256
- **Key derivation** -- HKDF-SHA256 with domain separation
- **Password hashing** -- Argon2id (256 MB, 3 iterations, 4 lanes)
- **Integrity** -- BLAKE3 Merkle trees, chunk-level authentication
- **Signatures** -- Ed25519 + ML-DSA-87 hybrid (FIPS 204)
- **Forward secrecy** -- Ephemeral keys per session, zeroized on completion
- **Constant-time operations** -- All secret comparisons use `subtle` crate

### Transfer

- **Adaptive compression** -- Analyzes file entropy and selects zstd, brotli, lz4, lzma, or none
- **Chunked transfer** -- 64 KB chunks with per-chunk AEAD and anti-reorder AAD
- **Resumable** -- Checkpoint state survives interruptions
- **Bandwidth throttling** -- `--throttle 10MB` limits transfer speed
- **File exclusion** -- Gitignore-style patterns with `--exclude`
- **Metadata stripping** -- Optional EXIF removal with `--strip-metadata`
- **Filename encryption** -- Optional with `--encrypt-filenames`

### Networking

- **QUIC transport** -- 0-RTT connection establishment, connection migration
- **Keep-alive** -- 15-second QUIC pings prevent idle disconnects
- **LAN discovery** -- mDNS/DNS-SD for local peer detection
- **NAT traversal** -- STUN, TURN, UPnP hole-punching
- **SOCKS5 proxy** -- Tor integration via `--proxy socks5://127.0.0.1:9050`
- **Self-hosted relay** -- Run your own relay with `tallow-relay`

### Security hardening

- **Filename sanitization** -- Defends against 20+ attack vectors (path traversal, null bytes, Unicode homoglyphs, ANSI injection, Windows reserved names)
- **Relay authentication** -- BLAKE3 password hashing with constant-time verification
- **Session verification** -- Numeric and emoji safety numbers for MITM detection
- **Zero telemetry** -- No analytics, no tracking, no phone-home. Ever.
- **Secure memory** -- All key material zeroized via `zeroize` crate, pinned with `mlock`
- **OS sandbox** -- Landlock + seccomp on Linux (defense-in-depth)
- **`#![forbid(unsafe_code)]`** -- Enforced across all crates (except crypto internals with documented SAFETY comments)

---

## Installation

### Quick install (Linux / macOS)

```bash
curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh
```

Detects your OS and architecture, downloads the latest release, verifies SHA256 checksum, and installs to `/usr/local/bin`.

### Homebrew (macOS / Linux)

```bash
brew tap tallowteam/tap
brew install tallow
```

### Scoop (Windows)

```powershell
scoop bucket add tallow https://github.com/tallowteam/scoop-tallow
scoop install tallow
```

### Cargo (any platform)

```bash
cargo install --git https://github.com/tallowteam/Tallow tallow
```

### Download binaries

Pre-built binaries for all platforms are available on the [Releases](https://github.com/tallowteam/Tallow/releases) page:

| Platform | Architecture | Download |
|----------|-------------|----------|
| Linux | x86_64 | `tallow-v*-x86_64-unknown-linux-gnu.tar.gz` |
| Linux | aarch64 | `tallow-v*-aarch64-unknown-linux-gnu.tar.gz` |
| macOS | Intel | `tallow-v*-x86_64-apple-darwin.tar.gz` |
| macOS | Apple Silicon | `tallow-v*-aarch64-apple-darwin.tar.gz` |
| Windows | x86_64 | `tallow-v*-x86_64-pc-windows-msvc.zip` |

### Docker (relay server only)

```bash
docker run -p 4433:4433/udp ghcr.io/tallowteam/tallow-relay:latest
```

Or with Docker Compose:

```bash
docker compose -f docker-compose.relay.yml up -d
```

---

## Self-Hosted Relay

Run your own relay server for complete control over the transport layer. The relay is **zero-knowledge** -- it routes encrypted bytes and never sees plaintext.

### Quick deploy

```bash
# On your server
cargo install --git https://github.com/tallowteam/Tallow tallow-relay
tallow-relay serve --bind 0.0.0.0:4433
```

### With password protection

```bash
tallow-relay serve --bind 0.0.0.0:4433 --pass "your-secret"

# Clients connect with:
tallow send file.txt --relay your-server:4433 --relay-pass "your-secret"
```

### Systemd service

```bash
# Copy the service file and config
sudo cp deploy/tallow-relay.service /etc/systemd/system/
sudo cp deploy/relay.toml /opt/tallow/

# Enable and start
sudo systemctl enable --now tallow-relay
```

### Configuration

```toml
# /opt/tallow/relay.toml
bind_addr = "0.0.0.0:4433"
max_connections = 10000
max_rooms = 5000
rate_limit = 100
room_timeout_secs = 600
```

---

## Architecture

Tallow is a 7-crate Rust workspace designed around strict security boundaries:

```
                    tallow (CLI binary)
                   /        |         \
          tallow-tui   tallow-protocol  tallow-store
                      /        |
              tallow-crypto  tallow-net

              tallow-relay (standalone binary)
                     |
                 tallow-net
```

| Crate | Purpose | Security boundary |
|-------|---------|------------------|
| **tallow-crypto** | All cryptographic operations | Zero I/O. Pure functions only. |
| **tallow-net** | QUIC/TCP transport, mDNS, NAT, relay client | Knows nothing about files. |
| **tallow-protocol** | Wire protocol, transfer pipeline, compression, chat | Connects crypto + net. |
| **tallow-store** | Config, identity, contacts, encrypted key-value store | Persistent state only. |
| **tallow-relay** | Self-hostable relay server | Zero-knowledge pass-through. |
| **tallow-tui** | Ratatui terminal dashboard | Display only. |
| **tallow** | CLI binary, output formatting, sandbox | User-facing shell. |

### Data flow

```
User -> CLI -> Protocol -> Crypto (encrypt/sign) -> Net (QUIC) -> Relay (pass-through)
                                                                        |
User <- CLI <- Protocol <- Crypto (decrypt/verify) <- Net (QUIC) <------
```

The relay never decrypts. The crypto layer never does I/O. Each crate has exactly one job.

---

## Security Model

### Threat model

| Adversary | Capability | Mitigation |
|-----------|-----------|------------|
| **Shared WiFi** | Packet sniffing | E2E encryption + TLS transport |
| **Compromised relay** | Full server control | Relay never sees plaintext |
| **Nation-state passive** | Backbone taps, metadata | Tor integration, traffic padding |
| **Nation-state active** | DNS/BGP hijack, quantum | Post-quantum KEM, DoH |

### Cryptographic choices

| Function | Algorithm | Rationale |
|----------|-----------|-----------|
| Key exchange | ML-KEM-1024 + X25519 | NIST Level 5, 15-year quantum horizon |
| Encryption | AES-256-GCM | Hardware acceleration (AES-NI) |
| Fallback cipher | ChaCha20-Poly1305 | Platforms without AES-NI |
| Hashing | BLAKE3 | Faster than SHA-256, parallelizable |
| Password KDF | Argon2id | Memory-hard, GPU/ASIC resistant |
| Nonces | Counter-based | Guaranteed uniqueness, no birthday bound |
| Signatures | Ed25519 + ML-DSA-87 | Hybrid classical + post-quantum |

### What we don't do

- **No accounts** -- No email, no phone number, no identity server
- **No cloud storage** -- Files go directly peer-to-peer through the relay
- **No telemetry** -- Zero analytics, zero tracking, zero phone-home
- **No key escrow** -- We can't decrypt your files even if compelled
- **No weak defaults** -- Post-quantum crypto is always on, not opt-in

---

## Development

### Build from source

```bash
git clone https://github.com/tallowteam/Tallow.git
cd Tallow
cargo build --release
```

Requires Rust 1.80+ stable.

### Run tests

```bash
cargo test --workspace          # All 598 tests
cargo test -p tallow-crypto     # Crypto tests only
cargo test <test_name>          # Single test
```

### Lint and audit

```bash
cargo clippy --workspace -- -D warnings    # Lint (warnings = errors)
cargo fmt --check                          # Format check
cargo audit                                # CVE scan
cargo deny check                           # License + advisory check
```

### Project stats

```
598 tests  |  7 crates  |  15,000+ lines  |  0 unsafe (outside crypto)
```

---

## Shell completions

Generated automatically with each release. Install manually:

```bash
# Bash
tallow completions bash > ~/.local/share/bash-completion/completions/tallow

# Zsh
tallow completions zsh > ~/.zfunc/_tallow

# Fish
tallow completions fish > ~/.config/fish/completions/tallow.fish

# PowerShell
tallow completions powershell > ~\Documents\PowerShell\Modules\tallow.ps1
```

---

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TALLOW_RELAY` | Default relay server address | `your-relay.com:4433` |
| `TALLOW_RELAY_PASS` | Relay password (hidden from process list) | `secret123` |
| `TALLOW_CODE` | Pre-set code phrase | `stamp-daybreak-kindred` |
| `TALLOW_INSTALL_DIR` | Custom install directory for curl installer | `/opt/bin` |
| `NO_COLOR` | Disable colored output ([no-color.org](https://no-color.org)) | `1` |
| `RUST_LOG` | Log verbosity for debugging | `debug` |

---

## Contributing

Tallow is security-critical software. All contributions must:

1. Pass `cargo test --workspace` (598+ tests)
2. Pass `cargo clippy --workspace -- -D warnings`
3. Pass `cargo fmt --check`
4. Include tests for new functionality
5. Follow existing patterns (see `CLAUDE.md` for conventions)
6. Never introduce `unsafe` without documented SAFETY justification
7. Never use `.unwrap()` outside `#[cfg(test)]`

---

## Roadmap

- [ ] GUI client (desktop + mobile)
- [ ] Browser-based sender/receiver (WASM)
- [ ] Tor onion service relay
- [ ] Multi-party transfers (group rooms)
- [ ] File streaming (real-time)
- [ ] Plugin system for custom protocols

---

## License

**AGPL-3.0-or-later**

Tallow is free software. You can redistribute it and modify it under the terms of the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.html) as published by the Free Software Foundation.

The relay server, client, and all libraries are covered by the same license. If you modify Tallow and run it as a service, you must release your modifications.

---

<div align="center">

**Built with paranoia by the Tallow team.**

*Because "good enough" encryption isn't good enough.*

<br>

[Report a Bug](https://github.com/tallowteam/Tallow/issues) | [Request a Feature](https://github.com/tallowteam/Tallow/issues) | [Security Policy](https://github.com/tallowteam/Tallow/security)

</div>
