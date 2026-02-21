# Roadmap: Tallow

## Overview

Tallow is a brownfield Rust project — a 7-crate workspace with ~45% implementation and 4 critical security failures that are silent at runtime. The roadmap sequences work from the inside out: fix the broken crypto layer first (Phase 1), build the codec and transport foundation (Phase 2), wire the core send/receive pipeline (Phase 3), add persistence and CLI polish (Phase 4), layer on privacy and TUI differentiators (Phase 5), then audit and harden before release (Phase 6). Every phase delivers one coherent, independently testable capability. The tool cannot safely ship until Phase 6 completes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security Hardening** - Fix 15 critical/high crypto defects before any networking code is wired
- [x] **Phase 2: Wire Protocol, Transport and Relay** - Postcard codec, QUIC+TCP transports, working relay server
- [x] **Phase 3: File Transfer Pipeline** - End-to-end send/receive with compression, key exchange, integrity verification
- [x] **Phase 4: Storage, CLI Commands and Polish** - Persistent identity/config, all CLI commands wired, transfer resume
- [x] **Phase 5: Privacy, TUI and Discovery** - Tor/SOCKS5, DNS-over-HTTPS, Ratatui dashboard, mDNS, OS sandbox
- [x] **Phase 6: Sandbox, Hardening and Security Audit** - Landlock, seccomp, structured logging, fuzz targets, full audit sweep
- [x] **Phase 7: Core Croc UX** - Text send, QR codes, custom codes, pipe support, clipboard, confirmation prompt, shorter codes, overwrite protection
- [x] **Phase 8: Advanced Transfer** - Exclude patterns, gitignore, throttle, transfer queue, sync, watch, path aliases, tab completion
- [x] **Phase 9: Security Hardening & Relay Auth** - Filename sanitization, ANSI stripping, env vars, relay password, verification strings, Docker relay
- [x] **Phase 10: Distribution & Polish** - Homebrew, Scoop, curl installer, shell completions in release, human-readable output, smart errors
- [x] **Phase 11: Real KEM Key Exchange** - Wire ML-KEM-1024 + X25519 hybrid handshake into transfer pipeline, replacing code-phrase-derived keys with actual cryptographic key exchange
- [x] **Phase 12: TUI Integration** - Wire Ratatui widgets into working dashboard with live transfers, peer list, progress bars, overlay system
- [x] **Phase 13: LAN Discovery & Direct Transfer** - mDNS peer discovery, direct P2P transfer without relay, automatic fallback to relay
- [x] **Phase 14: Tor/SOCKS5 Privacy** - Wire SOCKS5 proxy into relay connections, DNS leak prevention, anonymous transfer mode
- [x] **Phase 15: End-to-End Testing & Hardening** - Integration tests with real relay, cross-platform smoke tests, transfer resume, large file stress tests
- [x] **Phase 16: Rich Clipboard Sharing** - `tallow clip` command for text/image/URL clipboard sharing, content type detection, clipboard watch mode, unlimited searchable history, arboard integration
- [x] **Phase 17: Real E2E Transfer Pipeline** - Streaming I/O, per-chunk compression, sliding window sender (8-chunk batches), Merkle tree integrity verification, resume negotiation, stress tests (10GB/100GB/1TB)
- [x] **Phase 18: Encrypted Chat Over Relay** - Real-time E2E encrypted text chat between peers using existing relay rooms, chat sessions, message history, typing indicators, read receipts
- [x] **Phase 19: Multi-Peer Rooms** - Group transfers and chat with 3+ peers in a single room, fan-out message delivery, per-peer KEM handshakes, group key agreement, presence notifications, room capacity management
- [x] **Phase 20: WebRTC / P2P Direct** - Browser-based peer-to-peer transfers using WebRTC data channels, signaling via relay server, STUN/TURN NAT traversal, direct peer connections without relay forwarding, fallback to relay when P2P fails (completed 2026-02-21)

## Phase Details

### Phase 1: Security Hardening
**Goal**: The crypto layer provides the security it advertises — FIPS-compliant PQ algorithms, correct Argon2id parameters, working PAKE, key material pinned in RAM, no panics on bad input.
**Depends on**: Nothing (first phase)
**Requirements**: SECFIX-01, SECFIX-02, SECFIX-03, SECFIX-04, SECFIX-05, SECFIX-06, SECFIX-07, SECFIX-08, SECFIX-09, SECFIX-10, SECFIX-11, SECFIX-12, SECFIX-13, SECFIX-14, SECFIX-15
**Success Criteria** (what must be TRUE):
  1. `cargo test -p tallow-crypto` passes and ML-KEM-1024 key generation, encapsulation, and decapsulation succeed using the `ml-kem` crate against NIST FIPS 203 known-answer test vectors
  2. All hash and MAC comparisons in crypto paths use `subtle::ConstantTimeEq` — `grep -r " == \| != " crates/tallow-crypto/src/` finds zero matches on `[u8]` types outside `#[cfg(test)]`
  3. The CPace PAKE derives a session key that differs when different passwords are used and matches when the same password is used — an incorrect password produces `Err`, not a zero key
  4. Argon2id hashing with `Params::new(262144, 3, 4, None)` completes without error and `Argon2::default()` does not appear anywhere in non-test code
  5. All `.unwrap()` calls in non-test crypto code are replaced with `Result` returns — `cargo clippy -p tallow-crypto` passes with zero warnings
**Plans**: TBD

### Phase 2: Wire Protocol, Transport and Relay
**Goal**: A message can be encoded with postcard, sent over QUIC (or TCP+TLS fallback), routed through the relay server, and decoded on the other side — end-to-end framing and transport works.
**Depends on**: Phase 1
**Requirements**: WIRE-01, WIRE-02, WIRE-03, WIRE-04, XPORT-01, XPORT-02, XPORT-03, XPORT-04, RELAY-01, RELAY-02, RELAY-03, RELAY-04, RELAY-05, RELAY-06, RELAY-07
**Success Criteria** (what must be TRUE):
  1. All `Message` variants round-trip through `TallowCodec::encode` → `TallowCodec::decode` without data loss, and postcard is the serializer (bincode is absent from all codec paths)
  2. Two QUIC clients can connect to the relay server, join the same room by code phrase, and bytes sent by one arrive at the other via `DataForwarder` — verified by integration test
  3. When QUIC is blocked (simulated), the transport layer falls back to TCP+TLS and the same round-trip test passes
  4. The relay server runs within 50 MB RSS under a 100-concurrent-room load test — confirming it fits the 1 GB Oracle Cloud free tier constraint
  5. Stale rooms are removed after the configured timeout (default 60 seconds) and rate limiting rejects connections beyond the per-IP cap
**Plans**: TBD

### Phase 3: File Transfer Pipeline
**Goal**: A user can send a file from one terminal and receive it on another via the relay — the complete encrypt-compress-chunk-sign-send and receive-verify-decrypt-decompress-write pipeline works end-to-end.
**Depends on**: Phase 2
**Requirements**: XFER-01, XFER-02, XFER-03, XFER-04, XFER-05, XFER-06, XFER-07, XFER-08, XFER-09, XFER-10, XFER-11, XFER-12, XFER-13, COMP-01, COMP-02, COMP-03, KEX-01, KEX-02, KEX-03, KEX-04
**Success Criteria** (what must be TRUE):
  1. `tallow send <file>` generates a code phrase and completes transfer; `tallow receive <code>` receives and writes the file byte-for-byte identical to the source (verified by BLAKE3 hash comparison)
  2. A folder sent recursively via `tallow send <folder>` is received with complete directory structure and all file contents verified
  3. When a transfer is interrupted (process kill) and restarted, it resumes from the last verified chunk rather than restarting from byte zero
  4. The receiver displays a prompt with filename, size, and sender fingerprint before accepting, and typing `n` declines without writing any data
  5. Transfer progress shows current speed (MB/s), percentage complete, and ETA — updating at least once per second during active transfer
**Plans**: TBD

### Phase 4: Storage, CLI Commands and Polish
**Goal**: Tallow persists identity across runs, loads config from XDG paths, all CLI commands are wired to real implementations (no `todo!()`), and the tool behaves correctly as a Unix citizen.
**Depends on**: Phase 3
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07, CLI-08, CLI-09, CLI-10, CLI-11, CLI-12
**Success Criteria** (what must be TRUE):
  1. On first run, an identity keypair is generated and saved to `~/.config/tallow/identity.enc`; on second run the same fingerprint is displayed without regenerating keys
  2. `tallow identity export` writes a portable keypair file; `tallow identity import <file>` restores it and the fingerprint matches — enabling device migration
  3. `tallow doctor` exits 0 and reports relay reachability, entropy availability, and DNS resolution status with actionable output when any check fails
  4. `tallow send --json` and `tallow receive --json` produce machine-parseable JSON output on stdout with structured progress events — `jq .` parses it without error
  5. Shell completions generated by `tallow completions bash` are valid bash completion script (source-able without errors)
**Plans**: TBD

### Phase 5: Privacy, TUI and Discovery
**Goal**: Users who need anonymity can route transfers through Tor; the Ratatui TUI dashboard shows live transfer state; local peers are discoverable without a relay.
**Depends on**: Phase 4
**Requirements**: PRIV-01, PRIV-02, PRIV-03, PRIV-04, TUI-01, TUI-02, TUI-03, TUI-04, TUI-05, TUI-06, TUI-07, TUI-08, DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. `tallow send --proxy socks5://127.0.0.1:9050 <file>` completes a transfer with all DNS queries going through the SOCKS5 proxy (no plaintext DNS — verified by absence of system resolver calls)
  2. `tallow tui` launches a Ratatui dashboard that shows identity fingerprint, relay connection status, active transfers with progress bars, and LAN-discovered peers — all panels render without panicking
  3. Two peers on the same LAN can complete a transfer via mDNS discovery without configuring a relay address — the transfer uses the direct LAN path
  4. When `tallow tui` is exited (q or Ctrl+C) or crashes, the terminal is restored to normal state and the screen is cleared (no residual transfer data visible)
  5. EXIF metadata is stripped from images when `--strip-metadata` is passed — the received file contains no GPS coordinates or device identifiers from the original
**Plans**: TBD

### Phase 6: Sandbox, Hardening and Security Audit
**Goal**: The release build passes a full security audit — OS sandboxed on Linux, no timing leaks, no unsafe code without justification, no CVEs, fuzz targets written, NIST test vectors pass.
**Depends on**: Phase 5
**Requirements**: SAND-01, SAND-02, SAND-03, SAND-04, SAND-05
**Success Criteria** (what must be TRUE):
  1. On Linux, `tallow` applies Landlock filesystem restrictions (only output directory writable) and seccomp syscall filtering — a strace of the process shows no syscalls outside the allowlist during a transfer
  2. `cargo clippy --workspace -- -D warnings` exits 0, `cargo audit` reports no vulnerabilities, and `cargo deny check` passes with no policy violations
  3. Fuzz targets for `TallowCodec` (encode/decode round-trips with arbitrary input) and filename sanitization (arbitrary received filenames) run for 60 seconds without panicking or triggering undefined behavior
  4. `tracing-subscriber` is initialized on startup and sensitive data (keys, passphrases, file contents) never appears in log output at any level — verified by grep on a trace-level log capture
  5. `cargo test --workspace` passes clean, including NIST KAT vector tests for ML-KEM-1024 and ML-DSA-87
**Plans**: TBD

### Phase 7: Core Croc UX
**Goal**: Tallow matches Croc's zero-friction UX — text send, QR codes, custom code phrases, pipe/stdin support, clipboard auto-copy, receiver confirmation prompt, shorter default codes, overwrite protection, and `--yes` auto-accept.
**Depends on**: Phase 6
**Requirements**: CROC-01 through CROC-12
**Success Criteria** (what must be TRUE):
  1. `echo "hello" | tallow send` sends the text as a virtual file; `tallow receive <code>` prints it to stdout — pipe-to-pipe transfer works
  2. `tallow send --text "secret message"` sends text directly; receiver gets it printed to terminal without writing a file
  3. `tallow send --code mycode file.txt` uses the custom code; `tallow receive mycode` retrieves it — custom codes work
  4. `tallow send file.txt` displays a QR code in the terminal (when terminal is wide enough) alongside the text code phrase
  5. Receiver shows file listing with sizes and prompts "Accept? (Y/n)" before writing — declined transfers write zero bytes
**Plans**: TBD

### Phase 8: Advanced Transfer
**Goal**: Power-user transfer features — exclude patterns, gitignore support, bandwidth throttling, transfer queue, one-way sync, watch mode, path aliases, and code phrase tab completion.
**Depends on**: Phase 7
**Requirements**: ADV-01 through ADV-12
**Success Criteria** (what must be TRUE):
  1. `tallow send --exclude "node_modules,.git" ./project` sends the directory without excluded patterns
  2. `tallow send --git ./repo` respects `.gitignore` files in the repository
  3. `tallow send --throttle 10MB file.iso` limits transfer speed to ~10 MB/s
  4. `tallow watch ./dir` monitors for changes and auto-sends modified files to the connected peer
  5. `tallow sync ./dir` sends only new/changed files compared to the receiver's last-known state
**Plans**: TBD

### Phase 9: Security Hardening & Relay Auth
**Goal**: Comprehensive filename sanitization (20+ attack vectors), ANSI escape stripping, environment variable support, relay password authentication, session verification strings, and Docker relay deployment.
**Depends on**: Phase 8
**Requirements**: SEC2-01 through SEC2-08
**Success Criteria** (what must be TRUE):
  1. Received filenames with null bytes, Windows reserved names (CON/PRN/NUL), Unicode fullwidth separators, and `..` traversal are all sanitized — property tests with 10,000+ random inputs pass
  2. ANSI escape sequences (CSI, OSC, DCS) in received filenames and text messages are stripped — no terminal manipulation possible
  3. `TALLOW_RELAY` and `TALLOW_CODE` environment variables are respected without CLI flags
  4. Relay password authentication works: `tallow send --relay-pass secret file.txt` connects only to relays with matching password
  5. After key exchange, both peers see matching verification strings (40 numeric digits or 8 emojis) for out-of-band verification
**Plans**: TBD

### Phase 10: Distribution & Polish
**Goal**: Tallow is installable via Homebrew, Scoop, and curl script. CLI output uses human-readable sizes, smart error messages, and consistent colored formatting.
**Depends on**: Phase 9
**Requirements**: DIST-01 through DIST-10
**Success Criteria** (what must be TRUE):
  1. `brew install tallowteam/tap/tallow` installs working binary on macOS (Intel + Apple Silicon)
  2. `scoop install tallow` installs working binary on Windows
  3. `curl -sSf https://raw.githubusercontent.com/tallowteam/tallow/master/scripts/install.sh | sh` installs on Linux
  4. All user-facing byte counts display as human-readable (e.g., "1.43 MiB" not "1500000")
  5. Common errors (connection refused, permission denied, timeout) show actionable guidance
**Plans**: TBD

### Phase 11: Real KEM Key Exchange
**Goal**: Replace code-phrase-derived session keys with actual ML-KEM-1024 + X25519 hybrid key exchange over the relay — the crypto primitives exist in tallow-crypto but aren't wired into the transfer pipeline. After this phase, every transfer uses a proper cryptographic handshake with ephemeral keys.
**Depends on**: Phase 10
**Requirements**: KEM-01 through KEM-08
**Success Criteria** (what must be TRUE):
  1. `tallow send file.txt` performs ML-KEM-1024 + X25519 hybrid key encapsulation with the receiver before any data is encrypted — verified by checking session keys differ even with the same code phrase
  2. The code phrase is used for PAKE authentication (mutual proof of knowledge) not key derivation — an incorrect code phrase rejects with a clear error, not silent decryption failure
  3. Ephemeral KEM keys are generated per-transfer and zeroized after use — no long-term key material persists beyond the session
  4. The handshake completes in under 500ms on a 100ms RTT link — no unnecessary round trips
  5. Backward compatibility: old-format transfers (code-phrase-derived keys) are detected and rejected with a version mismatch error, not silent corruption
**Plans**: TBD

### Phase 12: TUI Integration
**Goal**: Wire the existing Ratatui widget modules in tallow-tui into an actual working dashboard — live transfer progress, peer connection status, identity display, file listing, and overlay system all render and update in real time.
**Depends on**: Phase 11
**Requirements**: TUI-01 through TUI-10
**Success Criteria** (what must be TRUE):
  1. `tallow tui` launches a multi-panel dashboard showing identity fingerprint, relay connection status, and transfer history
  2. Starting a send/receive while in TUI mode shows real-time progress bars with speed, ETA, and percentage
  3. The overlay system works — pressing `?` shows help, `i` shows identity details, overlays stack and dismiss correctly
  4. Terminal is fully restored on exit (q/Ctrl+C) or crash — no residual artifacts, screen cleared
  5. TUI renders without panic on terminals from 80x24 to 300x80, gracefully degrading on small sizes
**Plans**: TBD

### Phase 13: LAN Discovery & Direct Transfer
**Goal**: Two peers on the same LAN can discover each other via mDNS and transfer files directly without a relay — with automatic fallback to relay when direct connection fails.
**Depends on**: Phase 12
**Requirements**: LAN-01 through LAN-08
**Success Criteria** (what must be TRUE):
  1. `tallow send --local file.txt` broadcasts mDNS presence; `tallow receive --local` discovers it and completes transfer without any relay traffic
  2. Direct LAN transfers use the same E2E encryption as relay transfers — the transport changes, not the security
  3. When mDNS discovery fails or peers are on different networks, the transfer automatically falls back to relay with a user-visible message
  4. Multiple peers on the same LAN are listed with their identity fingerprints — the user picks which one to connect to
  5. Direct transfer speed is at least 5x faster than relay transfer for files >10MB on a gigabit LAN
**Plans**: TBD

### Phase 14: Tor/SOCKS5 Privacy
**Goal**: Users can route all relay traffic through Tor or any SOCKS5 proxy for anonymous transfers — no DNS leaks, no plaintext metadata exposure.
**Depends on**: Phase 13
**Requirements**: TOR-01 through TOR-06
**Success Criteria** (what must be TRUE):
  1. `tallow send --proxy socks5://127.0.0.1:9050 file.txt` completes a transfer with all traffic routed through the SOCKS5 proxy
  2. DNS resolution uses the proxy (no system resolver calls) — verified by network capture showing zero plaintext DNS
  3. `tallow send --tor file.txt` is a shortcut that defaults to localhost:9050 and checks Tor is running
  4. The relay address is resolved through the proxy, not leaked to the local network
  5. Transfer still works E2E encrypted through the proxy — Tor sees only encrypted relay traffic, not file contents
**Plans**: TBD

### Phase 15: End-to-End Testing & Hardening
**Goal**: Comprehensive integration tests verify the entire pipeline works — real relay connections, cross-platform behavior, transfer resume after interruption, large file handling, and stress testing under load.
**Depends on**: Phase 14
**Requirements**: E2E-01 through E2E-10
**Success Criteria** (what must be TRUE):
  1. An integration test sends a 100MB file through the actual Oracle relay and verifies byte-for-byte integrity via BLAKE3
  2. Transfer resume works: killing the sender mid-transfer and restarting picks up from the last acknowledged chunk
  3. Concurrent transfers (5 simultaneous send/receive pairs) complete without deadlocks or data corruption
  4. All commands produce valid JSON when `--json` is passed — a test suite parses every output event with serde_json
  5. `cargo test --workspace` passes on Linux, macOS, and Windows CI — no platform-specific failures
**Plans**: TBD

### Phase 16: Rich Clipboard Sharing
**Goal**: `tallow clip` command enables sharing clipboard contents (text, URLs, code, images) between peers with E2E encryption, automatic content type detection, clipboard watch mode for live sharing, and unlimited searchable clipboard history.
**Depends on**: Phase 15
**Requirements**: CLIP-01 through CLIP-08
**Success Criteria** (what must be TRUE):
  1. `tallow clip` reads the current clipboard (text or image) and sends it E2E encrypted through the relay — the receiver gets it pasted to their clipboard automatically
  2. Content type is auto-detected (URL, code, HTML, plain text, image format via magic bytes) and displayed to both sender and receiver
  3. `tallow clip watch` monitors the clipboard and auto-sends on changes (BLAKE3 hash dedup) — enabling live clipboard sharing sessions
  4. `tallow clip history` shows unlimited searchable clipboard history; `tallow clip history --search <keyword>` finds matching entries
  5. Image clipboard sharing works for all common formats (PNG, JPEG, GIF, BMP, WebP) — images are encoded as PNG for transfer and saved to disk on receive
**Plans**: TBD

### Phase 17: Real E2E Transfer Pipeline
**Goal**: Wire the complete transfer pipeline so two machines can actually send files to each other — the KEM handshake happens over the relay, session keys are derived from real key exchange (not just code phrase), files are chunked and encrypted with AES-256-GCM, progress is tracked live, and interrupted transfers can resume. This is the "make it actually work" phase that connects all the individual pieces (crypto, transport, protocol, relay) into a functioning tool.
**Depends on**: Phase 16
**Requirements**: E2E-XFER-01 through E2E-XFER-10
**Success Criteria** (what must be TRUE):
  1. `tallow send file.txt` on Machine A generates a code phrase, connects to the relay, and waits; `tallow receive <code>` on Machine B connects, completes the KEM handshake, and receives the file byte-for-byte identical (verified by BLAKE3)
  2. The session key is derived from ML-KEM-1024 + X25519 hybrid key exchange, NOT from the code phrase — the code phrase only authenticates (PAKE), it doesn't derive encryption keys
  3. Files >1GB transfer successfully with chunked encryption (64KB chunks, counter-based AES-256-GCM nonces) and the receiver can verify integrity via Merkle tree
  4. Progress displays speed (MB/s), percentage, ETA, and updates at least once per second during transfer
  5. Killing the sender mid-transfer and restarting with the same code picks up from the last acknowledged chunk — no data re-sent
**Plans**: TBD

### Phase 18: Encrypted Chat Over Relay
**Goal**: Real-time E2E encrypted text chat between peers using existing relay rooms — chat sessions with message history, AES-256-GCM per-message encryption, sanitized display.
**Depends on**: Phase 17
**Requirements**: CHAT-01 through CHAT-06
**Success Criteria** (what must be TRUE):
  1. `tallow chat` starts a chat session, connects to relay, and exchanges E2E encrypted messages in real-time
  2. Messages are encrypted with AES-256-GCM using per-session keys derived from KEM handshake
  3. All received text is sanitized (ANSI stripped, length limited) before display
  4. Chat sessions support multiple message exchanges without re-handshaking
  5. `/quit` cleanly ends the session and notifies the peer
**Plans**: TBD

### Phase 19: Multi-Peer Rooms
**Goal**: Group transfers and chat with 3+ peers in a single room — fan-out message delivery via Targeted envelopes, pairwise KEM handshakes between all peer pairs, presence notifications, room capacity management.
**Depends on**: Phase 18
**Requirements**: MULTI-01 through MULTI-08
**Success Criteria** (what must be TRUE):
  1. `tallow chat --multi --capacity 5` creates a multi-peer room that accepts up to 5 peers
  2. Each peer pair performs independent KEM handshakes — peer A's messages to peer B use different keys than A's messages to peer C
  3. The relay routes Targeted messages only to the intended recipient (anti-spoofing: relay overwrites `from_peer` field)
  4. Late-joining peers perform handshakes with all existing peers without disrupting ongoing conversations
  5. PeerLeftRoom notifications are broadcast when a peer disconnects
**Plans**: TBD

### Phase 20: QUIC Hole Punching / P2P Direct
**Goal**: Direct peer-to-peer QUIC connections via NAT hole punching coordinated through the existing relay — eliminating relay forwarding overhead for ~70% of network configurations, with automatic relay fallback when direct connection fails.
**Depends on**: Phase 19
**Requirements**: P2P-01 through P2P-08
**Success Criteria** (what must be TRUE):
  1. After KEM handshake via relay, peers exchange ICE candidates (STUN-discovered public addresses) and attempt QUIC hole punching
  2. On successful hole punch, file transfer proceeds directly between peers without relay forwarding — verified by checking relay sees no data traffic after upgrade
  3. When hole punching fails (symmetric NAT, firewall), transfer falls back to relay transparently with a user-visible message
  4. `--no-p2p` flag disables hole punching (always use relay) for privacy-sensitive users
  5. P2P mode is automatically disabled when `--tor` or `--proxy` is active to prevent IP leaks
**Plans**: 3 plans
Plans:
- [ ] 20-01-PLAN.md — Wire protocol P2P signaling variants, candidate gathering, STUN port-binding, --no-p2p CLI flag
- [ ] 20-02-PLAN.md — P2P negotiation module (p2p.rs), connection upgrade in send/receive commands
- [ ] 20-03-PLAN.md — Integration tests, candidate edge cases, discriminant stability, final verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → ... → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 5/5 | Complete | 2026-02-19 |
| 2. Wire Protocol, Transport and Relay | 4/4 | Complete | 2026-02-19 |
| 3. File Transfer Pipeline | 4/4 | Complete | 2026-02-19 |
| 4. Storage, CLI Commands and Polish | 3/3 | Complete | 2026-02-19 |
| 5. Privacy, TUI and Discovery | 3/3 | Complete | 2026-02-19 |
| 6. Sandbox, Hardening and Security Audit | 1/1 | Complete | 2026-02-19 |
| 7. Core Croc UX | - | Complete | 2026-02-20 |
| 8. Advanced Transfer | - | Complete | 2026-02-20 |
| 9. Security Hardening & Relay Auth | - | Complete | 2026-02-20 |
| 10. Distribution & Polish | - | Complete | 2026-02-20 |
| 11. Real KEM Key Exchange | - | Complete | 2026-02-20 |
| 12. TUI Integration | - | Complete | 2026-02-20 |
| 13. LAN Discovery & Direct Transfer | - | Complete | 2026-02-20 |
| 14. Tor/SOCKS5 Privacy | - | Complete | 2026-02-20 |
| 15. End-to-End Testing & Hardening | - | Complete | 2026-02-20 |
| 16. Rich Clipboard Sharing | - | Complete | 2026-02-20 |
| 17. Real E2E Transfer Pipeline | - | Complete | 2026-02-20 |
| 18. Encrypted Chat Over Relay | - | Complete | 2026-02-21 |
| 19. Multi-Peer Rooms | - | Complete | 2026-02-21 |
| 20. QUIC Hole Punching / P2P Direct | 3/3 | Complete    | 2026-02-21 |
