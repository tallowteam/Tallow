# Requirements: Tallow

**Defined:** 2026-02-19
**Core Value:** Files transfer securely between two parties where the relay never sees plaintext, with post-quantum cryptography protecting against future quantum attacks.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Security Hardening (SECFIX)

- [ ] **SECFIX-01**: ML-KEM-1024 uses FIPS 203 compliant `ml-kem` crate (not pqcrypto-kyber)
- [ ] **SECFIX-02**: ML-DSA-87 uses FIPS 204 compliant `ml-dsa` crate (not pqcrypto-dilithium)
- [ ] **SECFIX-03**: SLH-DSA uses FIPS 205 compliant `slh-dsa` crate (not pqcrypto-sphincsplus)
- [ ] **SECFIX-04**: Argon2id parameters match spec: 256MB memory, 3 iterations, 4 parallel lanes
- [ ] **SECFIX-05**: All hash/MAC comparisons in crypto paths use subtle::ConstantTimeEq
- [ ] **SECFIX-06**: OPAQUE PAKE returns real session keys (not dummy bytes)
- [ ] **SECFIX-07**: CPace PAKE uses proper hash-to-curve (not bare DH + salt)
- [ ] **SECFIX-08**: All key material types wrapped in secrecy::SecretBox
- [ ] **SECFIX-09**: overflow-checks = true in release profile
- [ ] **SECFIX-10**: #![forbid(unsafe_code)] in all library crates
- [ ] **SECFIX-11**: mlock implemented for key material (not no-op)
- [ ] **SECFIX-12**: All .unwrap() in non-test crypto code replaced with Result
- [ ] **SECFIX-13**: Full EFF Diceware wordlist (7776 words) for code phrase generation
- [ ] **SECFIX-14**: Double Ratchet supports out-of-order messages (skipped-message-keys cache)
- [ ] **SECFIX-15**: Triple Ratchet PQ secret properly mixed into root key via HKDF

### Wire Protocol (WIRE)

- [ ] **WIRE-01**: Wire messages serialized with postcard (not bincode)
- [ ] **WIRE-02**: TallowCodec encodes/decodes framed messages with length prefix
- [ ] **WIRE-03**: Version negotiation on initial connection
- [ ] **WIRE-04**: Message enum uses postcard-compatible serde format (no tagged enums)

### Transport (XPORT)

- [ ] **XPORT-01**: QUIC transport connects, sends, and receives via quinn
- [ ] **XPORT-02**: TCP+TLS fallback transport for QUIC-blocked networks
- [ ] **XPORT-03**: Transport trait abstraction selects QUIC-first with TCP fallback
- [ ] **XPORT-04**: QUIC connection uses self-signed TLS cert generated via rcgen

### Relay Server (RELAY)

- [ ] **RELAY-01**: Relay server accepts QUIC connections on configurable address
- [ ] **RELAY-02**: Room-based connection pairing (sender + receiver matched by room code hash)
- [ ] **RELAY-03**: Relay forwards encrypted bytes without inspection (zero-knowledge)
- [ ] **RELAY-04**: Per-IP and per-room rate limiting
- [ ] **RELAY-05**: Stale room cleanup with configurable timeout
- [ ] **RELAY-06**: Relay fits within 1GB RAM (Oracle Cloud free tier)
- [ ] **RELAY-07**: Relay client connects and authenticates with relay server

### File Transfer (XFER)

- [ ] **XFER-01**: User can send one or more files via `tallow send <file>`
- [ ] **XFER-02**: User can send a folder recursively via `tallow send <folder>`
- [ ] **XFER-03**: User can receive files via `tallow receive <code-phrase>`
- [ ] **XFER-04**: Files chunked at 64KB default with adaptive sizing
- [ ] **XFER-05**: Each chunk encrypted with AES-256-GCM using counter-based nonces
- [ ] **XFER-06**: Chunk AAD binds chunk index to prevent reordering
- [ ] **XFER-07**: Final chunk authenticates total chunk count
- [ ] **XFER-08**: Transfer progress reported with speed, ETA, percentage
- [ ] **XFER-09**: Transfer resumes from last verified chunk on reconnect
- [ ] **XFER-10**: Manifest signed by sender before transfer begins
- [ ] **XFER-11**: Receiver verifies all hashes independently
- [ ] **XFER-12**: Sliding window (N=8) for chunk acknowledgment (not stop-and-wait)
- [ ] **XFER-13**: Receiver prompted with file details before accepting transfer

### Compression (COMP)

- [ ] **COMP-01**: Zstandard compression (level 3) as default
- [ ] **COMP-02**: Entropy analysis on first 64KB to skip incompressible files
- [ ] **COMP-03**: Streaming compression in pipeline (no full-file buffering)

### Key Exchange (KEX)

- [ ] **KEX-01**: Hybrid KEM key exchange (ML-KEM-1024 + X25519) per session
- [ ] **KEX-02**: Session key derived via HKDF-SHA256 with domain separation
- [ ] **KEX-03**: Room code phrase derives room ID via BLAKE3 hash
- [ ] **KEX-04**: PAKE authentication (CPace) for code-phrase-based sessions

### Storage (STORE)

- [ ] **STORE-01**: TOML config loaded from XDG paths (~/.config/tallow/config.toml)
- [ ] **STORE-02**: Identity keypair generated on first run and persisted encrypted
- [ ] **STORE-03**: Identity export and import for device migration
- [ ] **STORE-04**: Trust-on-first-use: fingerprint recorded on first connection, warn on change
- [ ] **STORE-05**: Transfer history logged (opt-in, encrypted at rest)

### CLI Commands (CLI)

- [ ] **CLI-01**: `tallow send <file>` initiates encrypted transfer
- [ ] **CLI-02**: `tallow receive <code>` receives encrypted transfer
- [ ] **CLI-03**: `tallow identity show` displays device fingerprint
- [ ] **CLI-04**: `tallow identity export/import` manages keypair backup
- [ ] **CLI-05**: `tallow config get/set/list` manages configuration
- [ ] **CLI-06**: `tallow doctor` checks connectivity, DNS, relay, entropy
- [ ] **CLI-07**: `tallow benchmark` runs real crypto performance tests
- [ ] **CLI-08**: `tallow completions <shell>` generates shell completions
- [ ] **CLI-09**: `--json` flag for machine-readable output on all commands
- [ ] **CLI-10**: `--quiet` and `--verbose` flags for output control
- [ ] **CLI-11**: Progress bars via indicatif for transfers
- [ ] **CLI-12**: Colored output via owo-colors with NO_COLOR support

### Privacy (PRIV)

- [ ] **PRIV-01**: SOCKS5 proxy support for Tor integration (--proxy)
- [ ] **PRIV-02**: DNS-over-HTTPS resolution (no plaintext DNS)
- [ ] **PRIV-03**: Filename encryption in transit
- [ ] **PRIV-04**: EXIF/metadata stripping (opt-in --strip-metadata)

### TUI Dashboard (TUI)

- [ ] **TUI-01**: Ratatui main event loop with crossterm backend
- [ ] **TUI-02**: Status panel shows identity, PQC status, relay, uptime
- [ ] **TUI-03**: Transfers panel shows active transfers with progress
- [ ] **TUI-04**: Devices panel shows LAN-discovered peers with trust levels
- [ ] **TUI-05**: Help overlay with keybindings
- [ ] **TUI-06**: Hotkey bar with context-sensitive shortcuts
- [ ] **TUI-07**: Screen wipe on exit and panic via clearscreen
- [ ] **TUI-08**: Panic handler restores terminal state

### Sandbox & Hardening (SAND)

- [ ] **SAND-01**: Landlock filesystem restrictions on Linux
- [ ] **SAND-02**: Seccomp syscall filtering on Linux
- [ ] **SAND-03**: Core dump prevention via prctl
- [ ] **SAND-04**: tracing-subscriber initialized with structured logging
- [ ] **SAND-05**: Sensitive data never appears in log output

### Network Discovery (DISC)

- [ ] **DISC-01**: mDNS local peer discovery (_tallow._udp)
- [ ] **DISC-02**: STUN NAT type detection
- [ ] **DISC-03**: UPnP port mapping (opt-in)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Chat
- **CHAT-01**: Encrypted chat via `tallow chat <code>`
- **CHAT-02**: Triple Ratchet forward secrecy with PQ re-keying
- **CHAT-03**: Typing indicators and read receipts

### Advanced Transfer
- **AXFER-01**: Group transfer (1-to-many, up to 32 recipients)
- **AXFER-02**: Delta sync (rsync-style, only changed files)
- **AXFER-03**: Watch mode (auto-send on file changes)
- **AXFER-04**: Streaming mode (pipe command output)
- **AXFER-05**: Bidirectional transfer on same session

### Advanced Privacy
- **APRIV-01**: Constant-rate traffic mode
- **APRIV-02**: Decoy traffic to random relays
- **APRIV-03**: Traffic timing obfuscation
- **APRIV-04**: File size padding to nearest 1MB

### Advanced Networking
- **ANET-01**: UDP hole punching for direct P2P
- **ANET-02**: TURN relay fallback
- **ANET-03**: Connection migration (WiFi to cellular)

### Advanced TUI
- **ATUI-01**: Chat panel in TUI
- **ATUI-02**: Speed graph (sparkline)
- **ATUI-03**: Monitor mode for relay operators
- **ATUI-04**: Command palette (Ctrl+K)

### Distribution
- **DIST-01**: Homebrew formula
- **DIST-02**: Scoop manifest
- **DIST-03**: Deb/RPM packages
- **DIST-04**: Docker image for relay

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom onion routing (3-hop) | Tor via SOCKS5 proxy covers anonymity; custom routing is 100x complexity |
| I2P integration | SOCKS5 proxy covers this; I2P has minimal Rust ecosystem |
| GUI / desktop app | Terminal-only by design philosophy |
| Mobile app | CLI tool — not applicable |
| AEGIS-256 cipher | AES-256-GCM + ChaCha20 cover all platforms; AEGIS is a future optimization |
| WebRTC/SDP signaling | QUIC + relay is simpler; WebRTC is browser-oriented complexity |
| Multi-relay routing | Single relay + Tor is the architecture; resist multi-hop complexity |
| Account system / registration | Pseudonymous by design — no accounts, no email, no phone |
| Telemetry / analytics | Zero telemetry forever — design principle |
| Binary signing / reproducible builds | Release engineering, not v1 feature code |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SECFIX-01 | Phase 1 | Pending |
| SECFIX-02 | Phase 1 | Pending |
| SECFIX-03 | Phase 1 | Pending |
| SECFIX-04 | Phase 1 | Pending |
| SECFIX-05 | Phase 1 | Pending |
| SECFIX-06 | Phase 1 | Pending |
| SECFIX-07 | Phase 1 | Pending |
| SECFIX-08 | Phase 1 | Pending |
| SECFIX-09 | Phase 1 | Pending |
| SECFIX-10 | Phase 1 | Pending |
| SECFIX-11 | Phase 1 | Pending |
| SECFIX-12 | Phase 1 | Pending |
| SECFIX-13 | Phase 1 | Pending |
| SECFIX-14 | Phase 1 | Pending |
| SECFIX-15 | Phase 1 | Pending |
| WIRE-01 | Phase 2 | Pending |
| WIRE-02 | Phase 2 | Pending |
| WIRE-03 | Phase 2 | Pending |
| WIRE-04 | Phase 2 | Pending |
| XPORT-01 | Phase 2 | Pending |
| XPORT-02 | Phase 2 | Pending |
| XPORT-03 | Phase 2 | Pending |
| XPORT-04 | Phase 2 | Pending |
| RELAY-01 | Phase 2 | Pending |
| RELAY-02 | Phase 2 | Pending |
| RELAY-03 | Phase 2 | Pending |
| RELAY-04 | Phase 2 | Pending |
| RELAY-05 | Phase 2 | Pending |
| RELAY-06 | Phase 2 | Pending |
| RELAY-07 | Phase 2 | Pending |
| XFER-01 | Phase 3 | Pending |
| XFER-02 | Phase 3 | Pending |
| XFER-03 | Phase 3 | Pending |
| XFER-04 | Phase 3 | Pending |
| XFER-05 | Phase 3 | Pending |
| XFER-06 | Phase 3 | Pending |
| XFER-07 | Phase 3 | Pending |
| XFER-08 | Phase 3 | Pending |
| XFER-09 | Phase 3 | Pending |
| XFER-10 | Phase 3 | Pending |
| XFER-11 | Phase 3 | Pending |
| XFER-12 | Phase 3 | Pending |
| XFER-13 | Phase 3 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| KEX-01 | Phase 3 | Pending |
| KEX-02 | Phase 3 | Pending |
| KEX-03 | Phase 3 | Pending |
| KEX-04 | Phase 3 | Pending |
| STORE-01 | Phase 4 | Pending |
| STORE-02 | Phase 4 | Pending |
| STORE-03 | Phase 4 | Pending |
| STORE-04 | Phase 4 | Pending |
| STORE-05 | Phase 4 | Pending |
| CLI-01 | Phase 4 | Pending |
| CLI-02 | Phase 4 | Pending |
| CLI-03 | Phase 4 | Pending |
| CLI-04 | Phase 4 | Pending |
| CLI-05 | Phase 4 | Pending |
| CLI-06 | Phase 4 | Pending |
| CLI-07 | Phase 4 | Pending |
| CLI-08 | Phase 4 | Pending |
| CLI-09 | Phase 4 | Pending |
| CLI-10 | Phase 4 | Pending |
| CLI-11 | Phase 4 | Pending |
| CLI-12 | Phase 4 | Pending |
| PRIV-01 | Phase 5 | Pending |
| PRIV-02 | Phase 5 | Pending |
| PRIV-03 | Phase 5 | Pending |
| PRIV-04 | Phase 5 | Pending |
| TUI-01 | Phase 5 | Pending |
| TUI-02 | Phase 5 | Pending |
| TUI-03 | Phase 5 | Pending |
| TUI-04 | Phase 5 | Pending |
| TUI-05 | Phase 5 | Pending |
| TUI-06 | Phase 5 | Pending |
| TUI-07 | Phase 5 | Pending |
| TUI-08 | Phase 5 | Pending |
| SAND-01 | Phase 6 | Pending |
| SAND-02 | Phase 6 | Pending |
| SAND-03 | Phase 6 | Pending |
| SAND-04 | Phase 6 | Pending |
| SAND-05 | Phase 6 | Pending |
| DISC-01 | Phase 5 | Pending |
| DISC-02 | Phase 5 | Pending |
| DISC-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 87 total
- Mapped to phases: 87
- Unmapped: 0 (corrected from prior count of 78 which undercounted WIRE, XPORT, RELAY, DISC categories)

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation (coverage count corrected to 87)*
