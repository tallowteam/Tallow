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

### Web UI / Browser Client (WEB) — Phase 21

- [x] **WEB-01**: tallow-crypto compiles to wasm32-unknown-unknown target without errors
- [x] **WEB-02**: tallow-web cdylib crate with wasm-bindgen exports for hybrid KEM, AES-256-GCM, BLAKE3, HKDF
- [x] **WEB-03**: tallow-protocol feature-gated (`wasm` feature) so wire module (Message enum + postcard) compiles for WASM without heavy deps (tokio, zstd, etc.)
- [ ] **WEB-04**: Relay server accepts WebSocket connections alongside QUIC for browser clients
- [ ] **WEB-05**: WebSocket-to-QUIC message bridging: relay adds/strips 4-byte length prefix when forwarding between transports
- [ ] **WEB-06**: CORS headers on WebSocket endpoint allow cross-origin browser connections
- [ ] **WEB-07**: Browser WebSocket transport connects to relay, joins room, and exchanges postcard-encoded messages
- [ ] **WEB-08**: Browser performs full KEM handshake (HandshakeInit/Response/Kem/Complete) with CLI peer via WASM crypto
- [ ] **WEB-09**: Browser can send files via drag-and-drop with 64KB chunked AES-256-GCM encryption matching CLI wire format
- [ ] **WEB-10**: Browser can receive files from CLI peer with progressive decryption and download
- [ ] **WEB-11**: Browser displays real-time transfer progress (speed, percentage, ETA)
- [ ] **WEB-12**: Browser clipboard sharing sends text/images E2E encrypted, interoperable with `tallow clip` (uses FileOffer+Chunk pipeline, not a special message variant)
- [ ] **WEB-13**: Received clipboard content auto-copies to browser clipboard via Clipboard API
- [ ] **WEB-14**: Browser chat sends/receives E2E encrypted messages interoperable with `tallow chat` using Message::ChatText with AES-256-GCM (nonce: [0u8;4]||counter.to_be_bytes(), AAD: b"tallow-chat-v1", counter increments by 2)
- [ ] **WEB-15**: All received text sanitized via sanitize_display() before rendering (ANSI stripped, control chars removed)
- [ ] **WEB-16**: Typing indicators sent/received between browser and CLI chat peers via Message::TypingIndicator
- [ ] **WEB-17**: Web app installable as PWA (manifest.json, service worker for offline shell caching)
- [x] **WEB-18**: WASM crypto produces identical output to native for KEM, AES-GCM, BLAKE3 — verified by cargo test on native target

### P2P Direct Transfer (P2P) — Phase 20
- [x] **P2P-01**: ICE candidate exchange via relay signaling (CandidateOffer/CandidatesDone wire messages)
- [x] **P2P-02**: QUIC hole punching via DirectListener::connect_to() endpoint reuse
- [x] **P2P-03**: Automatic relay fallback when hole punch fails (symmetric NAT, firewall, timeout)
- [x] **P2P-04**: --no-p2p CLI flag to disable hole punching for privacy-sensitive users
- [x] **P2P-05**: Auto-disable P2P when --tor or --proxy is active (IP leak prevention)
- [x] **P2P-06**: NAT type detection skips hole punch for symmetric NAT
- [x] **P2P-07**: Connection upgrade wired into send.rs and receive.rs after KEM handshake
- [x] **P2P-08**: STUN port-binding via discover_from_port() for correct NAT mapping

### Advanced Networking
- [x] **ANET-01**: UDP hole punching for direct P2P *(done — Phase 20)*
- [x] **ANET-02**: TURN relay fallback *(done — Phase 20, relay serves as fallback)*
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
| SECFIX-01 | Phase 1 | Done |
| SECFIX-02 | Phase 1 | Done |
| SECFIX-03 | Phase 1 | Done |
| SECFIX-04 | Phase 1 | Done |
| SECFIX-05 | Phase 1 | Done |
| SECFIX-06 | Phase 1 | Done |
| SECFIX-07 | Phase 1 | Done |
| SECFIX-08 | Phase 1 | Done |
| SECFIX-09 | Phase 1 | Done |
| SECFIX-10 | Phase 1 | Done |
| SECFIX-11 | Phase 1 | Done |
| SECFIX-12 | Phase 1 | Done |
| SECFIX-13 | Phase 1 | Done |
| SECFIX-14 | Phase 1 | Done |
| SECFIX-15 | Phase 1 | Done |
| WIRE-01 | Phase 2 | Done |
| WIRE-02 | Phase 2 | Done |
| WIRE-03 | Phase 2 | Done |
| WIRE-04 | Phase 2 | Done |
| XPORT-01 | Phase 2 | Done |
| XPORT-02 | Phase 2 | Done |
| XPORT-03 | Phase 2 | Done |
| XPORT-04 | Phase 2 | Done |
| RELAY-01 | Phase 2 | Done |
| RELAY-02 | Phase 2 | Done |
| RELAY-03 | Phase 2 | Done |
| RELAY-04 | Phase 2 | Done |
| RELAY-05 | Phase 2 | Done |
| RELAY-06 | Phase 2 | Done |
| RELAY-07 | Phase 2 | Done |
| XFER-01 | Phase 3 | Done |
| XFER-02 | Phase 3 | Done |
| XFER-03 | Phase 3 | Done |
| XFER-04 | Phase 3 | Done |
| XFER-05 | Phase 3 | Done |
| XFER-06 | Phase 3 | Done |
| XFER-07 | Phase 3 | Done |
| XFER-08 | Phase 3 | Done |
| XFER-09 | Phase 3 | Done |
| XFER-10 | Phase 3 | Done |
| XFER-11 | Phase 3 | Done |
| XFER-12 | Phase 3 | Done |
| XFER-13 | Phase 3 | Done |
| COMP-01 | Phase 3 | Done |
| COMP-02 | Phase 3 | Done |
| COMP-03 | Phase 3 | Done |
| KEX-01 | Phase 3 | Done |
| KEX-02 | Phase 3 | Done |
| KEX-03 | Phase 3 | Done |
| KEX-04 | Phase 3 | Done |
| STORE-01 | Phase 4 | Done |
| STORE-02 | Phase 4 | Done |
| STORE-03 | Phase 4 | Done |
| STORE-04 | Phase 4 | Done |
| STORE-05 | Phase 4 | Done |
| CLI-01 | Phase 4 | Done |
| CLI-02 | Phase 4 | Done |
| CLI-03 | Phase 4 | Done |
| CLI-04 | Phase 4 | Done |
| CLI-05 | Phase 4 | Done |
| CLI-06 | Phase 4 | Done |
| CLI-07 | Phase 4 | Done |
| CLI-08 | Phase 4 | Done |
| CLI-09 | Phase 4 | Done |
| CLI-10 | Phase 4 | Done |
| CLI-11 | Phase 4 | Done |
| CLI-12 | Phase 4 | Done |
| PRIV-01 | Phase 5 | Done |
| PRIV-02 | Phase 5 | Done |
| PRIV-03 | Phase 5 | Done |
| PRIV-04 | Phase 5 | Done |
| TUI-01 | Phase 5 | Done |
| TUI-02 | Phase 5 | Done |
| TUI-03 | Phase 5 | Done |
| TUI-04 | Phase 5 | Done |
| TUI-05 | Phase 5 | Done |
| TUI-06 | Phase 5 | Done |
| TUI-07 | Phase 5 | Done |
| TUI-08 | Phase 5 | Done |
| SAND-01 | Phase 6 | Done |
| SAND-02 | Phase 6 | Done |
| SAND-03 | Phase 6 | Done |
| SAND-04 | Phase 6 | Done |
| SAND-05 | Phase 6 | Done |
| DISC-01 | Phase 5 | Done |
| DISC-02 | Phase 5 | Done |
| DISC-03 | Phase 5 | Done |

| P2P-01 | Phase 20 | Done |
| P2P-02 | Phase 20 | Done |
| P2P-03 | Phase 20 | Done |
| P2P-04 | Phase 20 | Done |
| P2P-05 | Phase 20 | Done |
| P2P-06 | Phase 20 | Done |
| P2P-07 | Phase 20 | Done |
| P2P-08 | Phase 20 | Done |
| ANET-01 | Phase 20 | Done |
| ANET-02 | Phase 20 | Done |
| WEB-01 | Phase 21 | Not Started |
| WEB-02 | Phase 21 | Not Started |
| WEB-03 | Phase 21 | Not Started |
| WEB-04 | Phase 21 | Not Started |
| WEB-05 | Phase 21 | Not Started |
| WEB-06 | Phase 21 | Not Started |
| WEB-07 | Phase 21 | Not Started |
| WEB-08 | Phase 21 | Not Started |
| WEB-09 | Phase 21 | Not Started |
| WEB-10 | Phase 21 | Not Started |
| WEB-11 | Phase 21 | Not Started |
| WEB-12 | Phase 21 | Not Started |
| WEB-13 | Phase 21 | Not Started |
| WEB-14 | Phase 21 | Not Started |
| WEB-15 | Phase 21 | Not Started |
| WEB-16 | Phase 21 | Not Started |
| WEB-17 | Phase 21 | Not Started |
| WEB-18 | Phase 21 | Not Started |

**Coverage:**
- v1 requirements: 87 total
- v1+ Phase 20 requirements: 8 (P2P-01..P2P-08)
- v1+ Phase 21 requirements: 18 (WEB-01..WEB-18)
- v2-deferred completed: 2 (ANET-01, ANET-02)
- Mapped to phases: 115
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-21 after Phase 21 (Web UI / Browser Client) requirements added*
