# Feature Landscape: Secure File Transfer CLI Tools

**Domain:** Peer-to-peer encrypted CLI file transfer (croc, magic-wormhole, wormhole-rs, portal, ffsend ecosystem)
**Researched:** 2026-02-19
**Confidence note:** WebSearch and WebFetch tools are unavailable in this environment. All competitor findings are from training data (cutoff ~Aug 2025) cross-referenced against the Tallow codebase and feature catalog already in the repo. Confidence levels are noted per section.

---

## Research Methodology

Primary sources used:
1. Tallow's own feature catalog (`TALLOW_CLI_FEATURE_CATALOG.md`, recovered from git history — 1,102 lines)
2. Tallow's `PROJECT.md` with validated/active/out-of-scope features
3. Tallow codebase: all 7 crates examined for what's actually implemented
4. Training knowledge of croc v10, magic-wormhole 0.14, wormhole-rs, portal, ffsend (MEDIUM confidence)

---

## Competitor Feature Matrix

**Confidence: MEDIUM** — from training data on competitor tools, verified against Tallow's own competitive analysis embedded in TALLOW_CLI_FEATURE_CATALOG.md.

| Feature | croc | magic-wormhole | wormhole-rs | portal | ffsend |
|---------|------|----------------|-------------|--------|--------|
| Code-phrase handshake | Yes | Yes (PAKE) | Yes | Yes | No (URL share) |
| E2E encryption | Yes (AES-256-GCM) | Yes (NaCl box) | Yes | Yes | Yes (AES-256-GCM) |
| PAKE key exchange | SPAKE2 | SPAKE2 | SPAKE2 | PAKE | No |
| Post-quantum crypto | No | No | No | No | No |
| Relay server | Yes (built-in) | Yes (mailbox server) | Yes | Yes | Yes (ffsend.xyz) |
| Self-hosted relay | Yes | Yes | Yes | Yes | Yes |
| Resume interrupted transfer | Yes | No | No | No | No |
| Multi-file/folder send | Yes | No (one file) | No | No | No |
| Direct P2P (hole punch) | Yes | Yes | Yes | Yes | No |
| QUIC transport | No | No | No | No | No |
| Tor/proxy support | Yes (SOCKS5) | No | No | No | No |
| TUI dashboard | No | No | No | No | No |
| Progress bars | Yes | Yes | Yes | Yes | Yes |
| JSON output | No | No | No | No | No |
| Shell completions | Yes | No | No | No | No |
| Transfer bandwidth limit | Yes | No | No | No | No |
| Adaptive compression | Yes (zstd) | No | No | No | No |
| Streaming stdin/stdout | Yes | Yes | Yes | No | No |
| Chat alongside transfer | No | No | No | No | No |
| Metadata stripping | No | No | No | No | No |
| Identity/contact system | No | No | No | No | No |
| TOFU trust | No | No | No | No | No |
| Encrypted config/keys | No | No | No | No | No |
| OS sandbox (Landlock/seccomp) | No | No | No | No | No |
| mlock key material | No | No | No | No | No |
| Single static binary | Yes | No (Python) | Yes | Yes | Yes |
| Cross-platform | Yes | Yes | Yes | Linux | Yes |

**Key gap:** No existing tool has post-quantum crypto, a TUI dashboard, or meaningful privacy features (Tor, metadata stripping, traffic analysis resistance). croc is the closest competitor on UX but has no PQ crypto and no TUI.

---

## Table Stakes

Features users expect from any secure file transfer CLI. Missing = product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Tallow Status | Notes |
|---------|--------------|------------|---------------|-------|
| Code-phrase handshake (send/receive) | Every competitor has it; it's the UX pattern | Low | CLI commands exist, logic stubbed | Core v1 deliverable |
| E2E encryption (AES-256-GCM or ChaCha20) | Literally the point of the tool | Low | Crypto done; not wired to transfer | Wiring only |
| PAKE-based key exchange | Without PAKE, anyone can MitM during handshake | High | OPAQUE/CPace stubbed (CRITICAL: returns dummy bytes) | Fix before shipping |
| EFF diceware code phrases | Entropy baseline for code security | Low | Skeleton (100 words, needs 7776-word list) | Easy fix |
| Relay server (pass-through) | Required fallback when direct P2P fails | Medium | 10% done; server is stub | Core v1 |
| Resume interrupted transfers | croc has this; users expect it for large files | Medium | State machine + resume stubs exist | Wire up state persistence |
| Multi-file send | croc sends folders; single-file-only feels incomplete | Low | Protocol supports it; needs CLI + pipeline | v1 must |
| Progress bars | Every CLI file tool has them | Low | Indicatif wired, transfer pipeline missing | Wiring |
| Send folder recursively | croc does it; users expect it | Low | Protocol supports; CLI needs it | Same pipeline |
| Accept/decline prompt | Must not silently accept; user must confirm | Low | CLI prompt stubs exist | Wire up |
| Direct P2P (hole punching) | Relay-only is slow; users expect best-effort direct | High | STUN, hole_punch stubs exist | v1 nice-to-have |
| Error messages that are actionable | Users must know what went wrong and how to fix it | Low | Error types exist; messages not wired | Polish phase |
| TCP+TLS fallback | Networks that block QUIC/UDP are common | Medium | tcp_tls.rs stub | v1 required |
| QUIC transport (primary) | quinn is the dependency; QUIC is the right default | High | quic.rs stub | v1 primary transport |
| Atomic file writes (temp → rename) | No corrupt partial files on failure | Low | Not implemented | Easy, critical |
| File integrity verification (checksum) | User must know file arrived intact | Low | BLAKE3 in crypto; not wired to transfer | Wire up Merkle root |
| Bandwidth limiting | croc has `--limit`; power users need it | Low | Not implemented | v1 |
| Shell completions | Standard for well-built CLIs (bash, zsh, fish, PowerShell) | Low | completions.rs exists (clap_complete) | Low hanging fruit |
| `tallow doctor` diagnostics | Users get confused by connectivity failures; self-diagnosis reduces support burden | Medium | doctor.rs stubbed | v1 |
| `tallow version` | Trivial but expected | Trivial | Exists, needs cleanup | Done |
| Stdin/stdout piping | `cat file \| tallow send --stdin` / receive to stdout | Low | Not wired | v1 |
| mDNS local peer discovery | Faster, cheaper than relay for LAN; croc detects LAN automatically | Medium | discovery stubs exist | v1 |
| Compression (zstd default, skip incompressible) | croc compresses; users expect it | Medium | Compression stubs exist in protocol | v1 |
| Non-interactive mode (--yes, --code from env) | Required for scripting and automation | Low | Clap args defined; logic not wired | v1 |
| Quiet mode / JSON output | Scripting requires machine-readable output | Low | Not implemented | v1 |
| XDG-compliant config file (TOML) | Linux users expect `~/.config/tallow/config.toml` | Low | Config crate stubbed | Wire up |
| Sensible exit codes | Scripts depend on 0=success, 1=error semantics | Low | exit_codes.rs exists | Wire up |

---

## Differentiators

Features that set Tallow apart from croc/magic-wormhole. Users do not expect these, but they provide strong competitive advantage for the security-conscious audience.

| Feature | Value Proposition | Complexity | Tallow Status | Notes |
|---------|-------------------|------------|---------------|-------|
| ML-KEM-1024 + X25519 hybrid KEM | ONLY tool with post-quantum key exchange | High | Crypto done; NEEDS library migration to FIPS-compliant ml-kem | CRITICAL path — must fix pqcrypto-kyber before shipping |
| ML-DSA-87 + Ed25519 hybrid signatures | PQ-authenticated chunks/manifests | High | Same — needs FIPS-compliant ml-dsa | Same critical path |
| Argon2id with correct parameters | Protects code phrases from brute force; croc uses SPAKE2 without Argon2 hardening | Low | Needs parameter fix (256MB, 3 iter, 4 parallel) | Easy fix |
| Ratatui TUI dashboard | NO competitor has a real-time TUI; croc is pure CLI | High | 47 widget files exist; main loop unimplemented | v1 differentiator — ship it |
| SOCKS5/Tor integration | ONLY tool with built-in Tor support (`--tor`) | Medium | socks5.rs stub; DoH stub | v1 |
| DNS-over-HTTPS | Prevents DNS leaks; croc leaks DNS | Low | doh.rs stub | v1 |
| Filename encryption in transit | croc sends filenames in plaintext over TLS to relay | Low | metadata stubs exist | v1 |
| Identity keypair + TOFU trust | No competitor has persistent device identity with TOFU verification | High | Identity/trust/contacts stubs in tallow-store | v1 important |
| Signed file manifest | Sender signs the manifest before transfer; receiver verifies — proves authenticity not just integrity | Medium | manifest.rs stub | v1 |
| Encrypted key storage (Argon2id + XChaCha20) | No competitor persists keys at all | Medium | persistence stubs in tallow-store | v1 |
| Encrypted transfer history (opt-in) | Audit log encrypted at rest; no competitor has this | Low | history stubs in tallow-store | v1 |
| OS sandbox (Landlock + Seccomp on Linux) | No competitor sandboxes the process | Medium | sandbox.rs exists | v1 Linux |
| mlock + core dump prevention | No competitor pins key material in RAM | Low | setrlimit done; mlock is no-op — needs fix | Fix for v1 |
| Secure screen wipe on exit | TUI exits clean; no terminal residue | Low | clearscreen dependency present; not wired | v1 |
| zeroize on all key material + SecretBox | Memory-safe key lifecycle; no competitor does this | Low | Mostly done; SecretBox wrapping incomplete | Finish for v1 |
| constant-time comparisons (subtle crate) | Side-channel hardening; no competitor does this | Low | Partially done; needs audit | Finish for v1 |
| Chunk-level authentication (AAD binds chunk index) | Prevents chunk reordering attack; no competitor does this | Low | Not yet wired | Wire in transfer pipeline |
| Double ratchet / triple ratchet for chat | Forward secrecy + post-compromise security for optional chat | Very High | Implemented but broken (out-of-order, PQ mixing) | DEFER chat to v2 unless ratchet is fixed |
| Transfer bandwidth limit (`--limit`) | croc has this; Tallow should match at minimum | Low | Not implemented | v1 |
| BLAKE3 Merkle tree for full-file verification | Verifiable even with parallel/out-of-order chunks | Low | blake3 merkle done in crypto; not wired to transfer | Wire up |
| Adaptive cipher selection (AES-NI detection) | Best performance on any hardware | Low | cipher negotiation done in crypto | Wire to session setup |

---

## Anti-Features

Features to explicitly NOT build in v1. These would distract from shipping a working, secure tool.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Built-in onion routing (custom 3-hop network) | Extraordinarily complex (directory authorities, circuit building, telescoping encryption, relay selection) — this is the entire Tor codebase | Use SOCKS5 proxy with external Tor (`--tor`). Ship that. |
| Group transfer (1-to-many) | Adds significant session management, key distribution complexity. Nobody is blocked without this in v1 | Ship 1-to-1 transfers. Group is v2. |
| Encrypted chat in v1 (unless ratchet bugs fixed) | Double Ratchet out-of-order handling is broken; Triple Ratchet PQ mixing is broken. Shipping broken crypto is worse than no chat | Fix ratchets properly in v2, or ship basic unratcheted session chat as clearly "beta" |
| OPAQUE PAKE (full protocol) | OPAQUE is complex (registration + authentication phases, augmented PAKE). The current implementation returns dummy bytes — shipping that is a CRITICAL security failure | Ship CPace (balanced PAKE) for v1 — simpler, still secure, implemented in the RFC |
| I2P integration | Niche, complex, overlaps with Tor for the threat model. SOCKS5 covers it | SOCKS5 proxy covers I2P SAM bridge usage |
| AEGIS-256 cipher | Feature-gated for future; AES-256-GCM + ChaCha20 cover all platforms | Defer to v2 |
| Delta sync / watch mode | Complex state management; rsync-like functionality is a separate product | Ship send/receive first |
| QR code display | Nice to have but adds a dependency (`qrcode` crate) for marginal UX gain | `--copy` to clipboard is sufficient for v1 |
| Decoy traffic / constant-rate mode | Significant complexity, real performance cost. Useful against GPA but extremely niche in v1 audience | Document as future feature; timing_obfuscation flag is sufficient |
| Reproducible builds / binary signing | Important for releases, not for building the feature | Release engineering concern for when v1 ships |
| Package manager distribution (brew, apt, scoop) | Maintaining 5+ package repos is substantial ongoing work | GitHub releases with install script; `cargo install tallow` |
| Transfer streaming / watch mode | Separate product category from one-shot transfer | Defer to v2 |
| Group chat | Protocol complexity, multi-party key distribution | 1-to-1 session chat (if fixed) is v1 scope |
| Plausible deniability mode | OTR-style deniable authentication adds protocol complexity | Standard authenticated transfer is fine for v1 |
| Memory-mapped I/O (mmap for large files) | Performance optimization; adds complexity and edge cases | Streaming async I/O is correct for v1 |
| SLH-DSA (hash-based signatures) | Additional PQ signature scheme; ML-DSA-87 + Ed25519 hybrid is sufficient | Keep SLH-DSA as fallback/alternative in code but don't require it in v1 handshake |
| Forward Error Correction | FEC adds complexity. QUIC handles reliability at the transport layer | Let QUIC handle reliability |
| Hidden services (.tallow onion addresses) | Requires directory infrastructure, circuit building — this IS a Tor replacement | Use Tor's actual hidden services via SOCKS5 |

---

## Feature Dependencies

Critical ordering constraints for implementation:

```
PAKE (CPace, correct implementation)
  → Handshake message exchange
  → Session key establishment
  → [All encrypted transfer]

PQ library migration (pqcrypto-* → ml-kem/ml-dsa)
  → Hybrid KEM (ML-KEM-1024 + X25519)
  → Hybrid signature (ML-DSA-87 + Ed25519)
  → [Manifest signing, chunk signing]

QUIC transport (quinn)
  → TCP+TLS fallback
  → Connection to relay
  → [All network transfer]

Relay server (working)
  → Relay client connection
  → Room signaling
  → [Send/receive end-to-end flow]

Wire codec (postcard, encode/decode)
  → All message passing
  → [Handshake, file offer, chunk, ack]

Transfer state machine
  → Send pipeline (read→compress→encrypt→sign→send)
  → Receive pipeline (receive→verify→decrypt→decompress→write)
  → Resume (state persistence)
  → Progress reporting (indicatif)

Config loading (TOML, XDG paths)
  → Identity keypair generation
  → Encrypted key storage
  → Contact/trust database
  → [Identity-gated features: TOFU, fingerprint verification]

TUI main event loop (Ratatui + Crossterm)
  → Panel rendering (status, transfers, devices, hotkeys)
  → Transfer progress display in TUI
  → Help overlay
  → Screen wipe on exit

mlock (fix from no-op)
  → All key material pinned in RAM
  → [Memory security guarantees meaningful]

Argon2id parameter fix (256MB, 3 iter)
  → Code phrase brute-force resistance
  → [Password-protected key storage]

BLAKE3 Merkle root wired to transfer
  → File integrity verified on receive
  → [User can trust received files]

mDNS discovery
  → Direct LAN transfer (skip relay)
  → [Local network use case]

SOCKS5 proxy
  → Tor integration (`--tor`)
  → DNS-over-HTTPS
  → [Privacy use case]
```

---

## V1 MVP Recommendation

### Must Ship (Table Stakes — Blocking)

The following must all work end-to-end before v1 ships. These are the minimum viable secure transfer tool:

1. **Fix PAKE** — CPace or OPAQUE must produce a real shared secret, not dummy bytes. This is a CRITICAL security failure in current code. (High complexity, blocking everything)
2. **Migrate PQ libraries** — pqcrypto-kyber/dilithium → ml-kem/ml-dsa (FIPS 203/204). The CRITICAL differentiator is broken without this. (High complexity, blocking PQ claims)
3. **Fix Argon2id parameters** — 256MB/3iter/4parallel. Wrong parameters = weak key derivation. (Low complexity, easy fix)
4. **Fix .unwrap() in non-test crypto code** — mldsa, slhdsa, cpace, key storage. (Low complexity, boring but required)
5. **Wire codec** — postcard encode/decode for all message types. Current code uses bincode (wrong). (Medium)
6. **QUIC transport** — Connect, send stream, receive stream via quinn. (High complexity)
7. **TCP+TLS fallback** — For UDP-blocked networks. (Medium)
8. **Relay server** — Working pass-through, signaling, room management. (Medium)
9. **Relay client** — Connect to relay, forward encrypted blobs. (Medium)
10. **Send pipeline** — read → compress → encrypt → sign → send, chunked. (Medium)
11. **Receive pipeline** — receive → verify → decrypt → decompress → write, chunked. (Medium)
12. **File integrity** — BLAKE3 Merkle root verification on receive. (Low — wire up existing crypto)
13. **Atomic writes** — write to `.tallow.tmp`, rename on completion. (Low)
14. **Transfer state machine** — lifecycle: negotiating → transferring → verifying → complete/failed. (Medium)
15. **Resume** — persist state; resume from last verified chunk. (Medium)
16. **Progress bars** — indicatif wired to transfer pipeline. (Low)
17. **Config loading** — TOML, XDG paths. (Low)
18. **Identity keypair generation** — on first run, store encrypted. (Medium)
19. **mlock fix** — key material pinned in RAM, not a no-op. (Low)
20. **`tallow send` command** — file(s)/folder, generates code, shows code, sends. (Medium)
21. **`tallow receive` command** — takes code phrase, downloads, writes file. (Medium)
22. **Compression pipeline** — zstd default; skip incompressible files by entropy. (Medium)
23. **EFF wordlist** — embed full 7776-word list. (Trivial)
24. **Filename encryption** — encrypt filename in manifest; never exposed to relay. (Low)

### Should Ship (Strong Differentiators for V1)

Features that make Tallow meaningfully better than croc without adding dangerous complexity:

25. **TUI main loop** — Ratatui + Crossterm event loop, panel rendering, screen wipe on exit. Widgets already exist. (Medium)
26. **SOCKS5 + Tor integration** (`--tor` flag, auto-detect `127.0.0.1:9050`). (Low — stub exists)
27. **DNS-over-HTTPS** — No DNS leaks. (Low — stub exists)
28. **TOFU trust verification** — fingerprint display, warn on key change. (Medium)
29. **Contact database** — store trusted fingerprints with names. (Low)
30. **Transfer history log** — opt-in, encrypted at rest. (Low)
31. **OS sandbox** — Landlock + seccomp on Linux. (Medium — sandbox.rs exists)
32. **`tallow doctor`** — connectivity diagnostics: relay reachable?, STUN works?, QUIC available?, Tor detected?. (Medium)
33. **JSON output** (`--json`) and semantic exit codes. (Low)
34. **Bandwidth limit** (`--limit <rate>`). (Low)
35. **mDNS LAN discovery** — direct transfer on local network. (Medium)

### Can Defer (V2)

Explicitly deferred to avoid scope creep:

- Chat (ratchets are broken; fix properly in v2)
- Group transfer
- Custom onion routing
- Decoy traffic / constant-rate mode
- Watch mode / delta sync
- AEGIS-256 cipher
- Reproducible builds / package manager distribution
- I2P integration
- QR code display
- Hidden services
- TURN relay fallback (STUN + hole punching first; TURN adds cost)

---

## Complexity Reference

| Level | Meaning | Examples |
|-------|---------|---------|
| Trivial | Hours | Fix Argon2id params, embed wordlist, exit codes |
| Low | 1-2 days | Wire existing crypto to pipeline, atomic writes, SOCKS5, JSON output |
| Medium | 3-7 days | QUIC transport, relay server, send/receive pipelines, TUI loop, TOFU |
| High | 1-2 weeks | CPace PAKE, PQ library migration, transfer state machine with resume |
| Very High | 3+ weeks | Full OPAQUE PAKE, group transfer, custom onion routing |

---

## What Makes V1 Compelling vs. Croc

The honest comparison: croc is excellent and battle-tested. Tallow beats croc on:

1. **Post-quantum crypto** — the only tool that protects against harvest-now-decrypt-later. Croc's SPAKE2 + AES-256-GCM will be vulnerable to quantum computers in the 2030-2040 window.
2. **TUI dashboard** — no competitor has this. Shows real-time transfer progress, device trust status, network quality, in a beautiful Ratatui UI.
3. **Tor integration** — `--tor` flag, one command. Croc requires external setup.
4. **Memory security** — mlock, zeroize, SecretBox, core dump prevention. Croc does none of this.
5. **OS sandbox** — Landlock + seccomp on Linux. Croc does none of this.
6. **Identity + TOFU** — persistent fingerprint tracking. Know who you're talking to across sessions.

The story is: croc is great for casual use. Tallow is for users who need to know their files arrive exactly as sent, by the person they think they're talking to, with protection against both classical and quantum attackers, without leaving traces in RAM or on disk.

---

## Sources

- `E:/Tallow/.planning/PROJECT.md` — Project requirements, validated/active/out-of-scope features (HIGH confidence — project's own spec)
- `TALLOW_CLI_FEATURE_CATALOG.md` (recovered from git HEAD) — 358-feature catalog, competitor analysis (HIGH confidence — project's own analysis)
- Tallow codebase: all 7 crates, wire protocol messages, transfer stubs, TUI widget inventory (HIGH confidence — direct code inspection)
- Training knowledge: croc v10, magic-wormhole 0.14.x, wormhole-rs, portal, ffsend features (MEDIUM confidence — training data cutoff Aug 2025, unverified against live repos due to tool restrictions)
- Note: WebSearch and WebFetch were unavailable. Competitor feature matrix is from training knowledge. Validate against live GitHub repos before using for marketing claims.
