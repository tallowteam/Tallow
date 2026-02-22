# Changelog

All notable changes to Tallow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-22

### Added

- **Post-quantum key exchange**: ML-KEM-1024 + X25519 hybrid KEM for forward secrecy against quantum attacks
- **End-to-end encryption**: AES-256-GCM with counter-based nonces, ChaCha20-Poly1305 fallback
- **Hybrid signatures**: Ed25519 + ML-DSA-87 for identity verification
- **File transfer**: Chunked streaming with Merkle tree integrity verification
- **Compression**: Adaptive pipeline with zstd, lz4, brotli, lzma support
- **QUIC transport**: Low-latency UDP-based connections via quinn
- **TCP+TLS fallback**: For networks blocking UDP
- **Self-hosted relay**: Zero-knowledge relay server (never sees plaintext)
- **Room codes**: Human-readable code phrases for peer discovery
- **NAT traversal**: STUN, UPnP, hole-punching for direct P2P connections
- **Local discovery**: mDNS/DNS-SD for LAN transfers without relay
- **Tor integration**: SOCKS5 proxy support for IP anonymity
- **DNS-over-HTTPS**: Prevents DNS leaks via Cloudflare/Google/Quad9
- **TUI**: Full terminal UI with Ratatui (panels, overlays, vim keybindings)
- **CLI**: Complete command-line interface with clap v4
- **Transfer resume**: Resume interrupted transfers from last verified chunk
- **Multi-peer rooms**: Up to 20 peers per relay room
- **Per-file selection**: Receiver can accept/reject individual files
- **Dry run mode**: Preview transfers without network activity
- **Transfer history**: Searchable log of past transfers
- **Auto-reconnect**: Exponential backoff with configurable retry limits
- **Speed test**: Measure relay latency and throughput
- **SSH key exchange**: Send/receive SSH public keys via encrypted channel
- **Drop box mode**: Persistent receiver waiting for incoming transfers
- **Desktop notifications**: Optional notify-rust integration
- **Hook system**: Pre/post transfer hooks with environment variables
- **OS sandbox**: Landlock + Seccomp on Linux
- **Encrypted config storage**: AES-256-GCM encrypted key-value store
- **Shell completions**: bash, zsh, fish, PowerShell
- **Man pages**: Generated via clap_mangen
- **5 platform binaries**: Linux x86/ARM, macOS x86/ARM, Windows x86

### Security

- All key material zeroized on drop via `zeroize` crate
- Constant-time comparisons via `subtle` crate
- Core dumps disabled, secrets pinned in RAM via mlock
- Screen wiped on exit/panic
- Integer overflow checks in release builds
- 891 tests passing, clippy clean

[0.1.0]: https://github.com/tallowteam/Tallow/releases/tag/v0.1.0
