# TALLOW CLI — Complete Feature & System Catalog

> **The most secure peer-to-peer file transfer CLI tool ever built.**
> Rust · Post-Quantum · Onion-Routed · Zero-Knowledge · Memory-Safe

---

## Project Identity

| Field | Value |
|-------|-------|
| Name | Tallow |
| Type | CLI + TUI Tool (100% terminal-based, no GUI) |
| Language | Rust (2024 edition) |
| TUI Stack | Ratatui + Crossterm (pure Rust, zero C dependencies) |
| License | TBD (GPL-3.0 / AGPL-3.0 recommended for security tools) |
| Target | Windows, macOS, Linux, FreeBSD, Linux ARM64 |
| Binary | Single static binary, zero runtime dependencies |
| Install | `curl \| sh`, `brew`, `cargo`, `scoop`, `pacman`, `nix`, `.deb`, `.rpm`, direct download |

---

## Philosophy

Tallow exists because no CLI file transfer tool delivers all three of these simultaneously:

1. **Post-quantum cryptography** — Secure against both classical and quantum adversaries
2. **Built-in onion routing** — True sender/receiver anonymity without external tools
3. **Encrypted communication** — Chat lives alongside file transfer as a first-class feature

Every design decision prioritizes: **Security → Privacy → Speed → Usability** in that order.

---

## Table of Contents

1. [Cryptography & Key Management](#1-cryptography--key-management)
2. [Privacy & Anonymity](#2-privacy--anonymity)
3. [File Transfer](#3-file-transfer)
4. [Encrypted Chat](#4-encrypted-chat)
5. [Compression](#5-compression)
6. [Networking & Transport](#6-networking--transport)
7. [Relay System](#7-relay-system)
8. [Room System](#8-room-system)
9. [Device Identity & Trust](#9-device-identity--trust)
10. [CLI Interface, TUI & UX](#10-cli-interface--ux)
11. [Configuration & Persistence](#11-configuration--persistence)
12. [Automation & Scripting](#12-automation--scripting)
13. [Operational Security](#13-operational-security)
14. [Performance](#14-performance)
15. [Platform & Distribution](#15-platform--distribution)
16. [Logging, Telemetry & Auditing](#16-logging-telemetry--auditing)
17. [Threat Model](#17-threat-model)
18. [Rust Crate Stack](#18-rust-crate-stack)

---

## 1. Cryptography & Key Management

### 1.1 Post-Quantum Key Encapsulation

| Feature | Detail |
|---------|--------|
| Primary KEM | ML-KEM-1024 (FIPS 203) — highest security level (AES-256 equivalent) |
| Hybrid KEM | ML-KEM-1024 + X25519 — defense-in-depth (if either survives, session is secure) |
| KEM Combiner | Dual-PRF combiner: `BLAKE3(ML-KEM-shared ∥ X25519-shared ∥ ML-KEM-ct ∥ X25519-pk)` |
| Fallback KEM | ML-KEM-768 (FIPS 203, Level 3) for constrained environments |
| KEM Negotiation | Sender advertises supported KEMs; receiver selects strongest mutual option |

### 1.2 Post-Quantum Digital Signatures

| Feature | Detail |
|---------|--------|
| Primary Signature | ML-DSA-87 (FIPS 204) — highest security level |
| Backup Signature | SLH-DSA-SHA2-256f (FIPS 205) — stateless hash-based, conservative |
| Hybrid Signature | ML-DSA-87 + Ed25519 — dual-signed for defense-in-depth |
| File Signing | Every transferred file chunk is signed by sender |
| Relay Signing | Relay messages signed to prevent relay impersonation |

### 1.3 Symmetric Encryption

| Feature | Detail |
|---------|--------|
| Primary Cipher | AES-256-GCM (hardware-accelerated via AES-NI) |
| Alternative Cipher | ChaCha20-Poly1305 (for platforms without AES-NI) |
| High-Performance | AEGIS-256 (when both peers support it — 2-4x faster than AES-GCM) |
| Cipher Negotiation | Auto-detect AES-NI; prefer AES-256-GCM if available, else ChaCha20 |
| Nonce Handling | 96-bit random nonces; nonce-misuse resistant (AES-GCM-SIV available) |
| AEAD | All encryption is authenticated — no unauthenticated modes exist |

### 1.4 Hashing & Key Derivation

| Feature | Detail |
|---------|--------|
| Primary Hash | BLAKE3 — keyed, extendable output, tree-hashing for parallel verification |
| Quantum-Resistant Hash | SHA3-256 (FIPS 202) for contexts requiring NIST compliance |
| KDF | HKDF-BLAKE3 with domain separation tags |
| Domain Separation | All derived keys tagged: `tallow-v1-file-enc`, `tallow-v1-chat-enc`, `tallow-v1-auth`, etc. |
| Password KDF | Argon2id (RFC 9106) — 3 iterations, 256MB memory, 4 parallelism |
| Integrity | BLAKE3 checksum per chunk + Merkle tree root for full-file verification |
| MAC | Keyed BLAKE3 for message authentication |

### 1.5 Password-Authenticated Key Exchange (PAKE)

| Feature | Detail |
|---------|--------|
| Primary PAKE | OPAQUE (RFC 9497) — zero-knowledge, asymmetric, never exposes password |
| CLI PAKE | CPace (RFC 9497) for code-phrase-based transfers (balanced PAKE) |
| Code Phrase | Minimum 6 words from EFF diceware list (77+ bits entropy) |
| Custom Codes | User-supplied code phrases with entropy estimation + warning |
| Brute Force Protection | Server-side rate limiting + exponential backoff on PAKE failures |

### 1.6 Key Management

| Feature | Detail |
|---------|--------|
| Key Zeroing | `zeroize` crate — all key material zeroed on drop, guaranteed by Rust ownership |
| Secret Wrapping | `secrecy` crate — `SecretVec<u8>` prevents accidental logging/display |
| No Key Reuse | Fresh ephemeral keys per session; long-term keys only for identity |
| Key Rotation | Long-term identity keys rotatable with signed transition record |
| Key Storage | Encrypted keyring: `XChaCha20-Poly1305(Argon2id(passphrase), keys)` |
| Memory Locking | `mlock()` / `VirtualLock()` on key material to prevent swap-to-disk |
| Core Dump Prevention | `prctl(PR_SET_DUMPABLE, 0)` on Linux; equivalent on other platforms |
| Fork Safety | Key material pages marked `MADV_DONTFORK` to prevent child process inheritance |

### 1.7 Constant-Time Operations

| Feature | Detail |
|---------|--------|
| Comparison | All secret-dependent comparisons use `subtle::ConstantTimeEq` |
| Selection | `subtle::ConditionallySelectable` for secret-dependent branching |
| No Short-Circuiting | Password checks, MAC verification — always full computation |
| Compiler Barriers | `core::hint::black_box` + volatile reads to prevent dead code elimination |

---

## 2. Privacy & Anonymity

### 2.1 Onion Routing (Built-In)

| Feature | Detail |
|---------|--------|
| Circuit Length | 3-hop default (entry → middle → exit), configurable 1-5 hops |
| Hop Encryption | Each hop encrypted with unique ML-KEM-1024 + X25519 session key |
| Circuit Building | Telescoping circuit construction (Tor-style) — each hop only knows next/prev |
| Relay Discovery | Relay list fetched from multiple hardcoded directory authorities |
| Relay Selection | Weighted random selection by bandwidth + uptime; guard node pinning |
| Path Diversity | Entry guard persistence (reduces Sybil exposure); middle/exit rotated per circuit |
| Onion Addresses | `.tallow` addresses: `BLAKE3(public_key)[..32].tallow` for hidden services |
| Hidden Services | Publish rendezvous points; receivers reachable without revealing IP |
| Circuit Rotation | New circuit every 10 minutes or per transfer (configurable) |
| Padding | Inter-hop padding cells to fixed 512-byte cells |
| Directory Authorities | Multiple independent directory authorities; 2/3 consensus for relay list |

### 2.2 Traffic Analysis Resistance

| Feature | Detail |
|---------|--------|
| Constant-Rate Mode | Transmit at fixed rate with dummy padding when idle (flag: `--constant-rate`) |
| Packet Padding | All packets padded to nearest power-of-2 size (512B, 1KB, 2KB, etc.) |
| Timing Obfuscation | Random jitter (0-50ms) injected between packets |
| File Size Masking | Total transfer size padded to nearest 1MB boundary |
| Filename Encryption | Filenames encrypted in transit; receiver sees original only after decryption |
| Metadata Stripping | Strip EXIF, XMP, IPTC, ID3, PDF metadata before transfer (opt-in: `--strip-metadata`) |
| Connection Correlation Resistance | Different circuits for signaling vs. data channels |
| Statistical Analysis Resistance | Burst traffic shaped into constant-rate stream |
| Decoy Traffic | Background decoy connections to random relays when not actively transferring |

### 2.3 Network Privacy

| Feature | Detail |
|---------|--------|
| DNS-over-HTTPS | All DNS resolution via DoH (Cloudflare/Quad9) to prevent DNS leaks |
| DNS-over-TLS | DoT fallback when DoH unavailable |
| No Plaintext DNS | DNS leak prevention enforced; refuse to resolve via plain UDP/53 |
| SNI Encryption | ECH (Encrypted Client Hello) where supported |
| SOCKS5 Proxy | Route all traffic through external SOCKS5 proxy (`--proxy`) |
| Tor Integration | Route through external Tor SOCKS5 (`--tor`, auto-detect `127.0.0.1:9050`) |
| I2P Support | I2P SAM bridge integration (`--i2p`) |
| No IP Leaks | WebRTC/STUN bypassed when onion routing or proxy mode active |
| IPv6 Privacy Addresses | Prefer temporary IPv6 addresses (RFC 8981) |

### 2.4 Identity Privacy

| Feature | Detail |
|---------|--------|
| Pseudonymous by Default | No registration, no accounts, no email, no phone number — ever |
| Ephemeral Identity | `--ephemeral` flag: generate throwaway identity per session, destroy after |
| Device Fingerprint Resistance | No hardware IDs, MAC addresses, or serial numbers in protocol |
| User-Agent Scrubbing | No version strings, OS info, or build metadata leaked to peers |
| Unlinkable Sessions | Different ephemeral keys per session; no cross-session correlation |
| Plausible Deniability | `--deniable` mode: transcript indistinguishable from random (OTR-style) |

---

## 3. File Transfer

### 3.1 Core Transfer

| Feature | Detail |
|---------|--------|
| Send Files | `tallow send <file> [file2] [file3...]` |
| Send Folders | `tallow send <folder>` — recursive, preserve structure |
| Send Stdin | `echo "data" \| tallow send --stdin` |
| Send Clipboard | `tallow send --clipboard` |
| Receive | `tallow receive <code-phrase>` |
| Receive to Stdout | `tallow receive <code> --stdout` |
| Custom Code Phrase | `tallow send --code <phrase> <file>` |
| Auto-Generated Code | EFF diceware wordlist, 6+ words (77+ bits entropy) |
| Accept/Decline | Receiver prompted with file name, size, sender identity; must confirm |
| Auto-Accept | `--yes` flag or per-trusted-device config |

### 3.2 Chunked & Parallel Transfer

| Feature | Detail |
|---------|--------|
| Chunk Size | 64KB default, adaptive (16KB-1MB based on network conditions) |
| Parallel Streams | 4 parallel streams default (configurable: `--streams 1-16`) |
| Per-Chunk Encryption | Each chunk independently encrypted with unique derived key |
| Per-Chunk Signing | Each chunk signed (ML-DSA-87 + Ed25519) |
| Per-Chunk Integrity | BLAKE3 hash per chunk; Merkle tree for full-file verification |
| Chunk Ordering | Out-of-order chunks reassembled; missing chunks re-requested |
| Chunk Pipeline | Read → compress → encrypt → sign → send (pipelined, zero-copy where possible) |

### 3.3 Resumable & Reliable

| Feature | Detail |
|---------|--------|
| Resume Interrupted | Transfers resume from last verified chunk on reconnect |
| State Persistence | Transfer state saved to encrypted file; survives crash/reboot |
| Partial Recovery | If connection lost mid-chunk, re-request only missing chunks |
| Retry Logic | Exponential backoff with jitter (3 retries default, configurable) |
| Checkpointing | Checkpoint every N chunks (default: 100) for fast resume |
| Atomic Writes | Received file written to `.tallow.tmp`; renamed on completion |
| Rollback | Failed/cancelled transfers clean up partial files |

### 3.4 Advanced Transfer Modes

| Feature | Detail |
|---------|--------|
| Group Transfer | `tallow send --group <file>` — 1-to-many (up to 32 recipients) |
| Broadcast | `tallow send --broadcast <file>` — send to all connected peers |
| File Request | `tallow request <code>` — generate a code that asks a peer to send you a file |
| Relay Transfer | `tallow send --relay-only <file>` — force relay (never direct P2P) |
| Streaming | `tallow stream <command>` — stream command output in real-time |
| Tar Mode | `tallow send --tar <folder>` — stream tar archive without writing temp file |
| Bidirectional | Both peers can send/receive simultaneously on same session |
| Delta Sync | `tallow sync <folder> <code>` — only transfer changed files (rsync-style) |
| Watch Mode | `tallow watch <folder> <code>` — auto-send new/changed files continuously |

### 3.5 File Integrity & Authenticity

| Feature | Detail |
|---------|--------|
| Merkle Tree | Full-file Merkle tree (BLAKE3) — verifiable even with parallel/out-of-order chunks |
| Signed Manifest | Sender signs file manifest (names, sizes, hashes) before transfer begins |
| Hash Verification | Receiver independently computes and verifies all hashes |
| Tamper Detection | Any modified chunk detected immediately; transfer aborted |
| Replay Protection | Session-bound nonces prevent replay of captured transfers |
| Man-in-the-Middle Detection | PAKE + signed key exchange; MitM causes verification failure |

---

## 4. Encrypted Chat

### 4.1 Protocol

| Feature | Detail |
|---------|--------|
| Protocol | Triple Ratchet (Double Ratchet + post-quantum ratchet layer) |
| PQ Ratchet | ML-KEM-1024 re-keying every N messages (default: 50) |
| DH Ratchet | X25519 per-message ratchet (Signal-style) |
| Symmetric Ratchet | BLAKE3-based symmetric key chain |
| Forward Secrecy | Every message uses unique key; past messages unrecoverable |
| Post-Compromise Security | PQ ratchet step restores security even if long-term key compromised |
| Message Ordering | Sequence numbers + out-of-order buffer (tolerate reordering) |
| Message Replay Protection | Reject duplicate sequence numbers |

### 4.2 Chat Features

| Feature | Detail |
|---------|--------|
| Start Chat | `tallow chat <code-phrase>` |
| Group Chat | `tallow chat --group <code>` — multi-party encrypted chat |
| Inline File Send | `/send <file>` within chat to transfer files |
| Message Receipts | Delivery confirmation (encrypted ack) |
| Typing Indicators | Optional (`--typing-indicators`), encrypted |
| Read Receipts | Optional (`--read-receipts`), encrypted |
| Message Expiry | `--ephemeral-chat <duration>` — messages auto-delete after N seconds/minutes |
| Chat History | Encrypted local history (opt-in: `--save-history`) |
| History Export | `tallow chat-export <file>` — export encrypted or plaintext |
| Offline Messages | Queued at relay (encrypted); delivered when recipient comes online |

### 4.3 Chat Security

| Feature | Detail |
|---------|--------|
| Deniability | OTR-style deniable authentication — transcripts are not cryptographic proof |
| No Server-Side Storage | Relay never sees plaintext; offline messages are encrypted blobs with TTL |
| Transcript Verification | Optional signed transcripts for when non-repudiation is desired |
| Silence Detection | No metadata leaks when chat is idle (padded keepalives) |

---

## 5. Compression

### 5.1 Adaptive Compression Pipeline

| Feature | Detail |
|---------|--------|
| Pipeline Order | Analyze → Compress → Encrypt → Sign → Send |
| Default Algorithm | Zstandard (level 3) — best balance of speed/ratio |
| Text-Optimized | Brotli (level 6) for text-heavy files (.txt, .csv, .json, .xml, .log) |
| Speed-Optimized | LZ4 for real-time/low-latency transfers (`--compress fast`) |
| Maximum Compression | LZMA (level 6) for archival/slow networks (`--compress max`) |
| No Compression | `--no-compress` to skip entirely |

### 5.2 Intelligent File Analysis

| Feature | Detail |
|---------|--------|
| Entropy Analysis | Compute Shannon entropy on first 64KB; skip if > 7.5 bits/byte |
| Magic Number Detection | Identify file type by magic bytes; route to best algorithm |
| Skip Incompressible | Auto-skip: JPEG, PNG, WebP, MP4, AV1, H.265, ZIP, 7z, FLAC, AAC, etc. |
| Dictionary Mode | Zstandard trained dictionaries for common formats (JSON, XML, CSV) |
| Streaming Compression | Compress during read; never buffer entire file in memory |
| Compression Ratio Reporting | Show achieved ratio in transfer summary |

---

## 6. Networking & Transport

### 6.1 Transport Protocols

| Feature | Detail |
|---------|--------|
| Primary | QUIC (via `quinn`) — 0-RTT, multiplexed, encrypted by default |
| Fallback | TCP + TLS 1.3 for networks that block UDP/QUIC |
| LAN | Direct TCP for local network (mDNS discovered peers) |
| Protocol Negotiation | QUIC preferred → TCP+TLS fallback → Relay-only fallback |
| Connection Migration | QUIC connection migration (survive WiFi↔cellular handoff) |
| Multiplexing | Multiple logical streams over single QUIC connection |

### 6.2 NAT Traversal

| Feature | Detail |
|---------|--------|
| STUN | Discover public IP/port via STUN servers |
| TURN | Relay fallback when direct P2P impossible |
| Hole Punching | UDP hole punching for direct P2P through NAT |
| UPnP/NAT-PMP | Auto-configure port forwarding on supported routers (opt-in) |
| Relay Fallback | Always fall back to relay if direct connection fails |

### 6.3 Connection Quality

| Feature | Detail |
|---------|--------|
| Congestion Control | BBR v2 (via QUIC) — optimal bandwidth utilization |
| Forward Error Correction | Optional FEC for lossy networks (`--fec`) |
| Adaptive Chunk Size | Smaller chunks on lossy/slow networks; larger on fast/reliable |
| Bandwidth Limiting | `--limit <rate>` — cap upload/download speed |
| MTU Discovery | Path MTU discovery to minimize fragmentation |
| Keep-Alive | Encrypted keepalive pings to maintain connection |

### 6.4 Local Network Discovery

| Feature | Detail |
|---------|--------|
| mDNS | `_tallow._tcp.local` — auto-discover Tallow peers on LAN |
| DNS-SD | Service discovery with TXT records (device name, PQ support level) |
| LAN Direct Transfer | Direct TCP when both peers on same network (skip relay) |
| LAN Auto-Detect | Automatic detection of LAN peers; offer direct path |
| LAN Encryption | Full encryption even on LAN (no "trusted network" downgrade) |

---

## 7. Relay System

### 7.1 Self-Hosted Relay

| Feature | Detail |
|---------|--------|
| Start Relay | `tallow relay` — run your own relay server |
| Relay Auth | Relay password: `tallow relay --password <pass>` |
| Relay TLS | Auto-TLS via ACME/Let's Encrypt: `tallow relay --domain relay.example.com` |
| Relay Ports | Configurable: `tallow relay --port 9009 --data-ports 9010-9013` |
| Relay Docker | `docker run tallow relay` — official container image |
| Relay Systemd | Ships with `.service` file for Linux |
| Relay Config | TOML config file for all relay settings |

### 7.2 Relay Security

| Feature | Detail |
|---------|--------|
| Zero-Knowledge Relay | Relay sees only encrypted blobs; cannot read content, filenames, or metadata |
| Relay Authentication | Mutual TLS or relay password to prevent unauthorized use |
| Relay Rate Limiting | Per-IP and per-session rate limits to prevent abuse |
| Relay Logging | Minimal by default — no content, no filenames, no IP persistence |
| Relay Rotation | Client can rotate between multiple relays per transfer |
| No Relay Trust | Protocol security does not depend on relay honesty |
| Relay Bandwidth Limits | Per-user bandwidth caps: `tallow relay --max-bandwidth 100mbps` |
| Relay Storage Limits | Offline message queue capped per user: `--max-offline-queue 50MB` |

### 7.3 Public Relay Network

| Feature | Detail |
|---------|--------|
| Default Relays | Multiple geographically distributed public relays |
| Relay Selection | Auto-select fastest relay by latency probe |
| Custom Relay | `tallow send --relay relay.example.com:9009 <file>` |
| Relay List | `tallow relays` — show available relays with latency |
| Community Relays | Support for community-contributed relay nodes |

---

## 8. Room System

### 8.1 Room Management

| Feature | Detail |
|---------|--------|
| Create Room | Implicit on `tallow send` or explicit `tallow room create` |
| Room Codes | CSPRNG-generated, 6+ word diceware phrases (human-readable) |
| Custom Codes | `tallow send --code "custom-phrase-here" <file>` (min 6 chars, entropy warning) |
| Room Expiration | Auto-expire after configurable timeout (default: 30 minutes) |
| Room Password | Optional additional password: `tallow send --room-password <pass> <file>` |
| Max Participants | Configurable cap (default: 32 for group transfers) |

### 8.2 Room Security

| Feature | Detail |
|---------|--------|
| No Enumeration | Room codes are cryptographic nonces; cannot be guessed or enumerated |
| Room Key Derivation | Room key derived from code phrase via OPAQUE/CPace (never sent in plaintext) |
| Room Isolation | Each room has unique encryption context; no cross-room key leakage |
| Room Destruction | All room state destroyed on relay after expiration |
| Participant Authentication | Each participant authenticated via PAKE before joining |

### 8.3 Room Roles & Control

| Feature | Detail |
|---------|--------|
| Host Role | Room creator is host; can kick, set permissions |
| Member Role | Regular participants; send/receive per host config |
| Read-Only Mode | `--read-only` — members can receive but not send |
| Kick | Host can kick participant: `/kick <peer-id>` |
| Ban | Host can ban participant for session duration |
| Invite | Host generates one-time invite codes for additional members |

---

## 9. Device Identity & Trust

### 9.1 Identity

| Feature | Detail |
|---------|--------|
| Identity Keypair | Long-term ML-DSA-87 + Ed25519 identity key (generated on first run) |
| Device Nickname | User-set nickname: `tallow config set nickname "Aamir's Laptop"` |
| Device Fingerprint | BLAKE3 hash of public key, displayed as emoji sequence or hex |
| Identity Backup | `tallow identity export` — encrypted backup of identity keys |
| Identity Import | `tallow identity import <file>` — restore on new device |
| Ephemeral Mode | `tallow --ephemeral` — generate throwaway identity, destroy on exit |

### 9.2 Trust System

| Feature | Detail |
|---------|--------|
| Trust Levels | Unknown → Seen → Trusted → Verified (4 levels) |
| Trust on First Use (TOFU) | First connection: fingerprint recorded; warn on change |
| Verified | Out-of-band fingerprint comparison (display emoji/hex for voice verification) |
| Auto-Accept | Auto-accept transfers from Verified devices: `tallow config set auto-accept verified` |
| Trust Revocation | `tallow trust revoke <fingerprint>` — immediately untrust device |
| Key Change Warning | Loud warning if a known device's key changes (potential MitM) |

### 9.3 Contact Management

| Feature | Detail |
|---------|--------|
| Add Contact | `tallow contact add <fingerprint> --name "Alice"` |
| List Contacts | `tallow contacts` — show all known devices with trust levels |
| Remove Contact | `tallow contact remove <fingerprint>` |
| Contact Export | `tallow contacts export` — encrypted backup |
| Contact Groups | `tallow contact group create "Team"` — group devices for broadcast |
| Favorites | `tallow contact favorite <fingerprint>` — quick access |

---

## 10. CLI Interface & UX

Tallow operates in two modes: **Standard CLI** (non-interactive, pipe-friendly) and **Fullscreen TUI** (Ratatui-powered interactive dashboard). Both modes maintain the same security guarantees. The TUI uses immediate-mode rendering — no persistent widget state lingers in memory between frames.

### 10.1 Core Commands

```
tallow send <file|folder> [--code <phrase>] [--to <fingerprint>]
tallow receive [<code-phrase>]
tallow chat [<code-phrase>] [--group]
tallow request [<code-phrase>]
tallow sync <folder> [<code-phrase>]
tallow watch <folder> [<code-phrase>]
tallow stream <command>

tallow tui                          # Launch fullscreen TUI dashboard
tallow tui --minimal                # Minimal TUI (single transfer view)

tallow relay [--port N] [--password P] [--domain D]
tallow relays

tallow contacts
tallow contact add|remove|favorite|group <args>
tallow trust verify|revoke <fingerprint>

tallow identity export|import|rotate|show
tallow config get|set|list|reset <key> [value]

tallow version
tallow doctor
tallow benchmark
```

### 10.2 TUI Architecture (Ratatui + Crossterm)

| Feature | Detail |
|---------|--------|
| Framework | Ratatui v0.29+ — immediate-mode rendering, zero retained widget state |
| Backend | Crossterm — pure Rust, no ncurses/C FFI, cross-platform |
| Rendering Model | Immediate-mode: rebuild every frame, no sensitive data persists in widget tree |
| Alternate Screen | Renders in alternate terminal buffer; main scrollback never contains sensitive data |
| Refresh Rate | 30 FPS default (configurable: `--fps 10-60`), vsync to reduce CPU |
| Responsive Layout | Constraint-based layouts adapt to any terminal size (min 80×24) |
| Color Support | True color (24-bit), 256 color, 16 color — auto-detected via Crossterm |
| Mouse Support | Optional mouse input for panel selection (`--mouse` flag) |
| Unicode | Full Unicode + Nerd Font glyph support for icons and box drawing |
| Graceful Degradation | Falls back to ASCII box drawing on non-Unicode terminals |

### 10.3 TUI Security Measures

| Feature | Detail |
|---------|--------|
| No Scrollback Leak | Alternate screen buffer cleared + overwritten on exit |
| Secure Screen Wipe | On exit: fill alternate buffer with null bytes before restore |
| Password Masking | All secret input (code phrases, passwords) rendered as `●●●●●●` via Dialoguer |
| Redaction on Resize | If terminal too small for security-critical content (fingerprints), show warning instead of truncating |
| No Terminal Logging | TUI frames never reach stdout/stderr; cannot be captured by `script` or `tee` |
| Panic Handler | Custom panic hook: wipe screen, restore terminal, zero sensitive memory, then exit |
| Idle Timeout | TUI auto-locks after configurable idle period (`--idle-timeout 5m`) |
| Lock Screen | `Ctrl+L` locks TUI; requires re-entering identity passphrase to unlock |
| Screenshot Resistance | No sensitive data rendered in window title or terminal tab name |

### 10.4 Fullscreen TUI Dashboard (`tallow tui`)

```
┌─ TALLOW ─────────────────────────────────────────────────────────────┐
│ ┌─ Status ─────────────────┐ ┌─ Active Transfers ───────────────┐ │
│ │ Identity: Aamir's WS     │ │ ↑ report.pdf  ███████░░ 72% 4.2MB│ │
│ │ PQC: ML-KEM-1024 ● ON   │ │   → Alice [verified]    12.3 MB/s│ │
│ │ Onion: 3-hop     ● ON   │ │ ↓ photos.zip  █████████░ 94% 891M│ │
│ │ Relay: relay.tallow.io   │ │   ← Bob [trusted]       28.1 MB/s│ │
│ │ Uptime: 1h 23m           │ │ ◌ backup.tar  queued (3rd)       │ │
│ └──────────────────────────┘ └──────────────────────────────────┘ │
│ ┌─ Devices (LAN) ─────────┐ ┌─ Chat: Alice ────────────────────┐ │
│ │ ● Alice's MacBook [V]    │ │ Alice: Got the files, thanks!    │ │
│ │ ● Bob's Desktop   [T]    │ │ You: Sending the rest now        │ │
│ │ ○ Unknown Device   [?]   │ │ Alice: Perfect, no rush          │ │
│ │                          │ │ ▎ Type message...             ⏎  │ │
│ └──────────────────────────┘ └──────────────────────────────────┘ │
│ ┌─ Transfer Speed ─────────────────────────────────────────────── │ │
│ │ 28.1 ┤    ╭──╮                                                 │ │
│ │ 21.0 ┤╭──╯  ╰──╮   ╭──╮                                       │ │
│ │ 14.0 ┤│        ╰──╯  ╰──╮                                     │ │
│ │  7.0 ┤╯                  ╰──                           MB/s    │ │
│ └──────────────────────────────────────────────────────────────── │ │
│ [Q]uit [S]end [R]eceive [C]hat [D]evices [T]rust [H]elp   Ctrl+L│ │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.5 TUI Panels & Widgets

| Panel | Widget Type | Contents |
|-------|-------------|----------|
| Status Bar | `Paragraph` + styled `Spans` | Identity, PQC status, onion status, relay, uptime |
| Active Transfers | `Table` + `Gauge` | Per-file progress bars, speed, ETA, direction arrows |
| Transfer Queue | `List` (scrollable) | Pending transfers with priority ordering |
| Device Discovery | `List` + trust badges | LAN devices with trust level indicators [V]erified [T]rusted [?]Unknown |
| Chat Panel | `Paragraph` (scrollable) + `Input` | E2E encrypted messages, inline file sends |
| Speed Graph | `Sparkline` or `Chart` | Real-time transfer speed over time (last 60 seconds) |
| Network Stats | `BarChart` | Upload/download bandwidth, compression ratio |
| Fingerprint Display | Custom widget | Emoji/hex grid for visual key verification |
| Security Badge | Custom styled `Span` | Color-coded: 🟢 PQC Active · 🟡 Classical Only · 🔴 Unencrypted |
| Hotkey Bar | `Paragraph` (bottom) | Context-sensitive keyboard shortcuts |
| Notification Popup | `Block` overlay | Accept/decline incoming transfer with file details |
| Trust Verification | `Paragraph` overlay | Side-by-side fingerprint comparison dialog |
| Connection Log | `List` (scrollable) | Timestamped connection events, errors, warnings |

### 10.6 TUI Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Cycle focus between panels |
| `↑` `↓` `j` `k` | Scroll within focused panel |
| `Enter` | Activate selected item / confirm action |
| `Esc` | Cancel / close overlay / back |
| `s` | Open send dialog |
| `r` | Open receive dialog |
| `c` | Focus chat panel |
| `d` | Focus device panel |
| `t` | Open trust verification for selected device |
| `p` | Pause/resume selected transfer |
| `x` | Cancel selected transfer |
| `q` / `Ctrl+C` | Quit (with secure screen wipe) |
| `Ctrl+L` | Lock screen |
| `?` / `F1` | Help overlay with all keybindings |
| `/` | Search transfers / contacts |
| `1-9` | Quick-switch between panels |
| `Ctrl+K` | Command palette (fuzzy search all actions) |

### 10.7 TUI Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| Dashboard | `tallow tui` | Full multi-panel view (default) |
| Minimal | `tallow tui --minimal` | Single transfer view — progress + speed only |
| Chat Fullscreen | `tallow chat <code>` | Full-height chat with optional split for file transfers |
| Monitor | `tallow tui --monitor` | Read-only view of relay activity (for relay operators) |
| Focus | `tallow tui --focus transfer` | Single panel maximized |
| Zen | `tallow tui --zen` | Minimal distractions — only active transfer + essential status |

### 10.8 Standard CLI Output (Non-TUI)

| Feature | Detail |
|---------|--------|
| Progress Bars | Per-file + overall progress via Indicatif (speed, ETA, %) |
| Multi-Bar | Multiple simultaneous progress bars for parallel transfers |
| Transfer Summary | Formatted table via Comfy-Table: file, size, compressed size, ratio, time, speed |
| Color Output | Styled output via owo-colors (auto-detect; `--no-color` to disable) |
| Interactive Prompts | Accept/decline, trust verification, password entry via Dialoguer |
| Password Input | `dialoguer::Password` — masked input, zeroed buffer on drop |
| Confirm Dialogs | `dialoguer::Confirm` — Y/N with default, timeout option |
| Select Menus | `dialoguer::Select` — arrow-key selection for device/relay lists |
| Multi-Select | `dialoguer::MultiSelect` — checkbox lists for batch operations |
| Quiet Mode | `--quiet` / `-q` — suppress all output except errors |
| Verbose Mode | `--verbose` / `-v` — detailed logging (up to `-vvvv`) |
| JSON Output | `--json` — all output as JSON for scripting |
| Clipboard Copy | Auto-copy code phrase to clipboard: `--copy` |
| QR Code | `--qr` — display code phrase as QR code in terminal (via `qrcode` crate) |
| Spinners | Animated spinners via Indicatif for connection establishment, key exchange |

### 10.9 Dialoguer Integration (Secure Prompts)

| Prompt Type | Use Case | Security Detail |
|-------------|----------|-----------------|
| `Password` | Code phrase entry, identity passphrase, room password | Input masked as `●●●●`; buffer zeroed via `zeroize` on drop |
| `Confirm` | Accept/decline transfer, trust device, delete history | Timeout option to auto-decline after N seconds |
| `Select` | Choose relay, select device, pick cipher preference | Arrow-key navigation, no sensitive data in choices |
| `MultiSelect` | Select multiple files, batch trust operations | Checkbox interface with Select All / None |
| `Input` | Device nickname, custom code phrase, config values | Entropy estimation + warning for weak code phrases |
| `FuzzySelect` | Command palette, contact search, relay search | Fuzzy matching without leaking search terms to history |

### 10.10 Indicatif Integration (Progress System)

| Feature | Detail |
|---------|--------|
| Single Transfer | `[██████████░░░░░░░░] 56% 3.2MB/s ETA 12s report.pdf` |
| Multi Transfer | Stacked progress bars with per-file speed and overall totals |
| Steady Tick | Background thread ticks progress at 10Hz for smooth animation |
| Template | `{spinner:.green} [{bar:40.cyan/blue}] {bytes}/{total_bytes} {bytes_per_sec} ETA {eta}` |
| Finish Style | Bar transforms to green checkmark on success, red X on failure |
| Hidden Mode | Progress bars hidden in `--quiet` and `--json` modes |
| Pipe Detection | Auto-disable progress when stdout is not a TTY |

### 10.11 Shell Integration

| Feature | Detail |
|---------|--------|
| Completions | `tallow completions bash\|zsh\|fish\|powershell` |
| Manpage | `tallow manpage` — generate man page |
| Alias Support | `tallow config set alias.s "send"` → `tallow s <file>` |
| Prompt Integration | `tallow status --one-line` — for shell prompt (shows active transfers) |

---

## 11. Configuration & Persistence

### 11.1 Config File

| Feature | Detail |
|---------|--------|
| Location | `~/.config/tallow/config.toml` (XDG compliant) |
| Format | TOML |
| CLI Override | All config values overridable via flags |
| Environment Vars | `TALLOW_RELAY`, `TALLOW_CODE`, `TALLOW_PROXY`, etc. |

### 11.2 Persistent Data

| Feature | Detail |
|---------|--------|
| Identity Keys | `~/.config/tallow/identity.enc` — encrypted with Argon2id + XChaCha20-Poly1305 |
| Contact Database | `~/.config/tallow/contacts.enc` — encrypted key-value store |
| Transfer History | `~/.config/tallow/history.enc` — opt-in encrypted log |
| Chat History | `~/.config/tallow/chat/` — per-conversation encrypted files |
| Resume State | `~/.config/tallow/transfers/` — pending transfer state files |

### 11.3 Config Options (Partial List)

```toml
[identity]
nickname = "Aamir's Workstation"

[network]
relay = "relay.tallow.io:9009"
proxy = ""                          # socks5://127.0.0.1:9050
dns_over_https = true
ipv6 = true

[security]
kem = "ml-kem-1024"                 # ml-kem-768, ml-kem-1024
cipher = "auto"                     # aes-256-gcm, chacha20-poly1305, aegis-256
onion_hops = 3                      # 0 = disabled, 1-5
constant_rate = false
strip_metadata = false
ephemeral = false

[transfer]
streams = 4
chunk_size = "64KB"                 # 16KB-1MB
compress = "auto"                   # auto, zstd, brotli, lz4, lzma, none
auto_accept = "verified"            # none, trusted, verified, all
save_path = "~/Downloads/tallow/"

[chat]
save_history = false
typing_indicators = true
read_receipts = true
ephemeral_ttl = "0"                 # 0 = disabled, "30s", "5m", "1h"

[tui]
default_mode = "dashboard"          # dashboard, minimal, zen
fps = 30                            # 10-60
mouse = false                       # enable mouse input
theme = "dark"                      # dark, light, high-contrast
idle_timeout = "5m"                 # 0 = disabled
secure_wipe_on_exit = true          # overwrite alternate buffer on quit
lock_on_idle = true                 # auto-lock after idle_timeout
panel_layout = "default"            # default, wide, stacked

[privacy]
decoy_traffic = false
timing_obfuscation = true
file_size_padding = true
filename_encryption = true

[logging]
level = "warn"                      # error, warn, info, debug, trace
file = ""                           # path to log file (disabled by default)
```

---

## 12. Automation & Scripting

### 12.1 Scripting Support

| Feature | Detail |
|---------|--------|
| JSON Output | `--json` — machine-readable output for all commands |
| Exit Codes | Semantic exit codes: 0 = success, 1 = error, 2 = auth failure, 3 = cancelled, etc. |
| Stdin/Stdout Piping | Full pipeline support: `cat file \| tallow send --stdin` / `tallow receive <code> --stdout \| tar xz` |
| Non-Interactive | `--yes` auto-accept; `--code` from env var; `--password` from file |
| Environment Variables | All flags available as `TALLOW_*` env vars |
| Hooks | `--on-complete <command>` — run command after successful transfer |
| Watch Mode | `tallow watch <dir> <code>` — auto-send new/changed files |
| Cron Friendly | No TTY required; all prompts skippable via flags |

### 12.2 Integration Patterns

```bash
# Pipe tar stream
tar czf - ./project | tallow send --stdin --code "backup-phrase"

# Receive and extract
tallow receive "backup-phrase" --stdout | tar xzf -

# Automated backup script
tallow send --yes --code "$BACKUP_CODE" --relay $RELAY ./data/

# Watch directory and auto-send changes
tallow watch ./shared-folder "team-sync-code" --trusted-only

# JSON output for scripting
tallow send file.txt --json | jq '.code_phrase'
```

---

## 13. Operational Security

### 13.1 Binary Security

| Feature | Detail |
|---------|--------|
| Static Binary | Fully static; no dynamic linking, no shared libraries |
| Reproducible Builds | Deterministic builds for binary verification |
| Binary Signing | Release binaries signed with Ed25519 (Minisign) |
| Checksum Files | SHA-256 + BLAKE3 checksums for all release artifacts |
| Supply Chain | `cargo-vet` + `cargo-audit` in CI; dependency review |
| SBOM | Software Bill of Materials published with each release |

### 13.2 Runtime Security

| Feature | Detail |
|---------|--------|
| Seccomp (Linux) | Syscall filtering — only allow necessary syscalls |
| Pledge (OpenBSD) | `pledge("stdio rpath wpath cpath inet dns tty")` |
| Landlock (Linux 5.13+) | Filesystem access restricted to config dir + transfer paths |
| No Exec | Never executes external processes (no shell injection surface) |
| Sandboxing | macOS App Sandbox compatible |
| Minimal Permissions | Requires only: network, read/write transfer paths, config directory |

### 13.3 Anti-Forensics (Opt-In)

| Feature | Detail |
|---------|--------|
| Ephemeral Mode | `--ephemeral` — no disk writes; all state in memory only |
| Secure Delete | `--secure-delete` — overwrite temp files with random data before unlink |
| No Logs | `--no-log` — disable all logging (not even stderr) |
| Memory Wipe on Exit | Best-effort wipe of all sensitive memory on clean exit |
| Crash Wipe | Signal handlers attempt memory wipe even on crash |
| History Wipe | `tallow history wipe` — securely delete all transfer/chat history |
| TUI Screen Wipe | On exit: overwrite alternate screen buffer with null bytes before restore |
| TUI Scrollback Prevention | TUI renders exclusively in alternate screen; no data leaks to scrollback |
| TUI Panic Recovery | `color-eyre` panic hook: restore terminal → wipe screen → zero memory → exit |

---

## 14. Performance

### 14.1 Speed Optimizations

| Feature | Detail |
|---------|--------|
| Zero-Copy I/O | `sendfile()` / `splice()` where possible; avoid userspace copies |
| Memory-Mapped Files | `mmap` for large file reads (opt-in: `--mmap`) |
| AES-NI / ARMv8-CE | Hardware-accelerated AES on x86-64 and ARM64 |
| SIMD Hashing | BLAKE3 uses AVX-512, AVX2, SSE4.1, or NEON (auto-detected) |
| Parallel Hashing | BLAKE3 tree-hashing for multi-core integrity verification |
| Async I/O | Full `tokio` async throughout; no blocking operations on network path |
| Buffer Pooling | Reusable buffer pool to minimize allocations |
| Streaming Pipeline | Read → Compress → Encrypt → Send as async pipeline (no buffering entire file) |

### 14.2 Benchmarking

| Feature | Detail |
|---------|--------|
| Built-In Benchmark | `tallow benchmark` — test crypto, compression, and network speed |
| Throughput Reporting | Transfer speed in MB/s with overhead breakdown |
| Latency Reporting | Connection establishment time, key exchange time |
| CPU Usage | Crypto overhead as percentage of total transfer time |

### 14.3 Resource Limits

| Feature | Detail |
|---------|--------|
| Memory Cap | Configurable max memory usage: `--max-memory 512MB` |
| CPU Limit | `--threads N` — limit worker threads |
| Bandwidth Limit | `--limit 10mbps` — cap transfer speed |
| Chunk Buffer Limit | Max in-flight chunks configurable to prevent memory bloat |

---

## 15. Platform & Distribution

### 15.1 Supported Platforms

| Platform | Architecture | Status |
|----------|-------------|--------|
| Linux | x86_64 | Primary |
| Linux | aarch64 (ARM64) | Primary |
| Linux | armv7 (32-bit ARM) | Supported |
| macOS | x86_64 (Intel) | Primary |
| macOS | aarch64 (Apple Silicon) | Primary |
| Windows | x86_64 | Primary |
| Windows | aarch64 (ARM64) | Supported |
| FreeBSD | x86_64 | Supported |
| Android (Termux) | aarch64 | Community |
| OpenBSD | x86_64 | Experimental |

### 15.2 Installation Methods

| Method | Command |
|--------|---------|
| curl install | `curl -sSf https://install.tallow.io \| sh` |
| Homebrew | `brew install tallow` |
| Cargo | `cargo install tallow` |
| Scoop (Windows) | `scoop install tallow` |
| Chocolatey | `choco install tallow` |
| Winget | `winget install tallow` |
| pacman (Arch) | `pacman -S tallow` |
| apt (Debian/Ubuntu) | `.deb` package in releases |
| rpm (Fedora/RHEL) | `.rpm` package in releases |
| Nix | `nix-env -i tallow` / `nix profile install tallow` |
| Docker | `docker run tallow <command>` |
| Direct Download | GitHub releases: `.tar.gz`, `.zip`, `.deb`, `.rpm` |

### 15.3 Build from Source

```bash
# Requires Rust 1.80+
git clone https://github.com/<org>/tallow
cd tallow
cargo build --release
# Binary: target/release/tallow
```

---

## 16. Logging, Telemetry & Auditing

### 16.1 Logging

| Feature | Detail |
|---------|--------|
| Structured Logging | `tracing` crate with span-based context |
| Log Levels | error, warn, info, debug, trace (set via `-v` flags or config) |
| Log Targets | stderr (default), file (opt-in), syslog (opt-in) |
| Sensitive Filtering | Keys, passwords, code phrases NEVER appear in logs (even at trace) |
| Log Rotation | File logs rotated by size (default: 10MB × 3 files) |

### 16.2 Telemetry

| Feature | Detail |
|---------|--------|
| Telemetry | **NONE** — zero telemetry, zero phone-home, zero analytics, ever |
| Update Check | Opt-in only: `tallow update check` (manual) or `--auto-update-check` |
| Crash Reports | **NONE** — no automatic crash reporting |

### 16.3 Audit Trail

| Feature | Detail |
|---------|--------|
| Transfer Log | Opt-in: `tallow config set log.transfers true` |
| Log Contents | Timestamp, peer fingerprint, files (names/sizes), direction, success/fail |
| Log Encryption | Audit log encrypted at rest with identity key |
| Log Export | `tallow log export [--plaintext] [--since "2025-01-01"]` |
| No Content Logging | File contents NEVER logged under any configuration |

---

## 17. Threat Model

### 17.1 What Tallow Protects Against

| Threat | Protection |
|--------|-----------|
| Passive network observer | E2E encryption (AES-256-GCM / ChaCha20-Poly1305); onion routing hides endpoints |
| Active MitM | PAKE (OPAQUE/CPace) + signed key exchange; MitM causes auth failure |
| Quantum computer (future) | ML-KEM-1024 + ML-DSA-87; hybrid ensures security even if classical crypto breaks |
| Compromised relay | Zero-knowledge relay; relay sees only encrypted blobs |
| Traffic analysis | Constant-rate mode, packet padding, timing jitter, decoy traffic |
| Metadata leakage | Encrypted filenames, padded sizes, no version strings |
| Key compromise (past) | Forward secrecy — past sessions unrecoverable |
| Key compromise (present) | Post-compromise security via PQ ratchet — security restores after ratchet step |
| Memory forensics | `zeroize`, `mlock`, core dump prevention, fork safety |
| Disk forensics | Encrypted persistence, ephemeral mode, secure delete |
| Side-channel attacks | Constant-time operations, no secret-dependent branches |
| Endpoint compromise (OS) | Out of scope — Tallow cannot protect against a compromised OS |

### 17.2 What Tallow Does NOT Protect Against

| Threat | Reason |
|--------|--------|
| Compromised endpoint OS | If the OS is malicious, it can read memory, keylog, etc. |
| Physical access to unlocked device | Device security is the user's responsibility |
| Rubber-hose cryptanalysis | Social engineering / coercion is out of scope |
| Global passive adversary (full network view) | Onion routing helps but is not a panacea against GPA |
| Implementation bugs | Mitigated by Rust memory safety, audits, and fuzzing — but not eliminated |
| User error | Sharing code phrases insecurely, trusting wrong devices, etc. |

---

## 18. Rust Crate Stack

### 18.1 Core Dependencies

| Layer | Crate | Purpose |
|-------|-------|---------|
| CLI Framework | `clap` v4 | Argument parsing, subcommands, completions |
| Async Runtime | `tokio` | Multi-threaded async I/O |
| Serialization | `serde` + `bincode` | Efficient binary protocol serialization |
| Config | `toml` + `serde` | TOML config file parsing |
| Error Handling | `thiserror` + `anyhow` | Structured errors + ad-hoc errors |

### 18.2 Cryptography

| Layer | Crate | Purpose |
|-------|-------|---------|
| Post-Quantum KEM | `pqcrypto-kyber` | ML-KEM-768 / ML-KEM-1024 |
| Post-Quantum Sig | `pqcrypto-dilithium` | ML-DSA-65 / ML-DSA-87 |
| PQ Hash Sig | `pqcrypto-sphincsplus` | SLH-DSA (FIPS 205) |
| X25519 | `x25519-dalek` | Classical key exchange |
| Ed25519 | `ed25519-dalek` | Classical digital signatures |
| AES-256-GCM | `aes-gcm` | Symmetric encryption (AES-NI accelerated) |
| ChaCha20-Poly1305 | `chacha20poly1305` | Alternative symmetric encryption |
| AEGIS-256 | `aegis` | High-performance AEAD |
| BLAKE3 | `blake3` | Hashing, KDF, MAC, Merkle tree |
| SHA3 | `sha3` | NIST-compliant hashing |
| Argon2id | `argon2` | Password hashing |
| HKDF | `hkdf` | Key derivation |
| OPAQUE | `opaque-ke` | Zero-knowledge PAKE |
| Key Zeroing | `zeroize` | Guaranteed memory zeroing |
| Secret Wrapping | `secrecy` | Prevent accidental key exposure |
| Constant-Time | `subtle` | Side-channel resistant operations |
| Random | `rand` + `getrandom` | CSPRNG |

### 18.3 Networking

| Layer | Crate | Purpose |
|-------|-------|---------|
| QUIC | `quinn` | Primary transport protocol |
| TLS | `rustls` | TLS 1.3 for TCP fallback |
| DNS-over-HTTPS | `trust-dns-resolver` | Encrypted DNS |
| mDNS | `mdns-sd` | LAN peer discovery |
| SOCKS5 | `tokio-socks` | Proxy support (Tor, I2P) |

### 18.4 Compression

| Layer | Crate | Purpose |
|-------|-------|---------|
| Zstandard | `zstd` | General-purpose compression |
| Brotli | `brotli` | Text-optimized compression |
| LZ4 | `lz4_flex` | Fast compression |
| LZMA | `lzma-rs` | Maximum compression |

### 18.5 TUI Framework

| Layer | Crate | Purpose |
|-------|-------|---------|
| TUI Rendering | `ratatui` v0.29+ | Immediate-mode terminal UI — widgets, layouts, charts, tables, gauges |
| Terminal Backend | `crossterm` | Pure Rust cross-platform terminal I/O — raw mode, events, colors |
| Error Recovery | `color-eyre` | Panic handler that restores terminal state + wipes screen |

### 18.6 Interactive CLI

| Layer | Crate | Purpose |
|-------|-------|---------|
| Interactive Prompts | `dialoguer` | Password input (masked + zeroed), confirmations, select menus |
| Progress Bars | `indicatif` | Multi-bar transfer progress, spinners, speed display |
| Terminal Colors | `owo-colors` | Zero-allocation colored output (non-TUI mode) |
| QR Code | `qrcode` | Terminal QR code display for code phrases |
| Tables | `comfy-table` | Formatted output tables (non-TUI mode) |
| Clipboard | `arboard` | Clipboard read/write for code phrases |
| File Watcher | `notify` | Watch mode file system events |
| Logging | `tracing` + `tracing-subscriber` | Structured logging |

---

## Feature Count Summary

| Category | Features |
|----------|----------|
| Cryptography & Key Management | 34 |
| Privacy & Anonymity | 28 |
| File Transfer | 38 |
| Encrypted Chat | 18 |
| Compression | 10 |
| Networking & Transport | 20 |
| Relay System | 18 |
| Room System | 14 |
| Device Identity & Trust | 16 |
| CLI Interface, TUI & UX | 82 |
| Configuration & Persistence | 14 |
| Automation & Scripting | 12 |
| Operational Security | 16 |
| Performance | 14 |
| Platform & Distribution | 14 |
| Logging & Auditing | 10 |
| **TOTAL** | **~358 features** |

---

## Tallow vs Croc — At a Glance

| Dimension | Croc | Tallow |
|-----------|------|--------|
| Encryption | AES-256 + PAKE | ML-KEM-1024 + X25519 + AES-256/ChaCha20/AEGIS + OPAQUE |
| Quantum Safe | No | Yes (FIPS 203, 204, 205) |
| Anonymity | External Tor proxy | Built-in onion routing (3-hop) |
| Chat | None | Triple Ratchet E2E encrypted chat |
| Compression | None | 4-algorithm adaptive pipeline |
| Transport | TCP | QUIC + TCP+TLS + direct LAN |
| Terminal UI | Text progress bar only | Ratatui fullscreen TUI dashboard + Indicatif progress bars |
| Interactive Input | Basic Y/N prompt | Dialoguer: masked passwords, selects, fuzzy search, zeroed buffers |
| Memory Safety | Go GC (keys may linger) | Rust `zeroize` + `mlock` (guaranteed) |
| Screen Security | Sensitive data may remain in scrollback | Alternate buffer + secure wipe + lock screen |
| Side Channels | Not addressed | Constant-time ops throughout |
| Anti-Forensics | None | Ephemeral mode, secure delete, core dump prevention |
| Telemetry | None | None (by design, forever) |
| Features | ~12 | ~358 |

---

*Tallow — because your files deserve better than "probably secure."*
