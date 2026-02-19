# Tallow

## What This Is

Tallow is a security-maximalist peer-to-peer file transfer CLI/TUI tool built in Rust. It enables end-to-end encrypted file transfers between two parties via untrusted relay servers, with post-quantum cryptography (ML-KEM-1024 + X25519 hybrid KEM) ensuring forward secrecy against future quantum attacks. Optional Tor anonymity layer via SOCKS5 proxy. The tool is 100% terminal-based — both a standard CLI with progress bars and a full Ratatui TUI dashboard.

## Core Value

Files transfer securely between two parties where the relay never sees plaintext, with post-quantum cryptography that protects against both classical and quantum adversaries for a 15-year threat horizon.

## Requirements

### Validated

<!-- Shipped and confirmed working — from existing codebase analysis -->

- ✓ ML-KEM-1024 key encapsulation (keygen, encapsulate, decapsulate with tests) — existing (needs library migration from pqcrypto-kyber to ml-kem)
- ✓ X25519 Diffie-Hellman key exchange — existing
- ✓ Hybrid KEM combiner (ML-KEM-1024 + X25519 → HKDF session key) — existing
- ✓ AES-256-GCM symmetric encryption with counter-based nonces — existing
- ✓ ChaCha20-Poly1305 alternative cipher — existing
- ✓ HKDF-SHA256 key derivation with domain separation — existing
- ✓ Argon2id password hashing (needs parameter fix) — existing
- ✓ BLAKE3 hashing, keyed MAC, domain separation, Merkle trees — existing
- ✓ SHA3-256 hashing — existing
- ✓ ML-DSA-87 digital signatures — existing (needs library migration)
- ✓ Ed25519 digital signatures — existing
- ✓ Hybrid signatures (ML-DSA-87 + Ed25519) — existing
- ✓ SLH-DSA hash-based signatures — existing (needs library migration)
- ✓ Double Ratchet protocol (Signal-style, needs out-of-order fix) — existing
- ✓ Triple Ratchet with sparse PQ ratchet (needs PQ mixing fix) — existing
- ✓ File encrypt/decrypt with chunk-based streaming — existing
- ✓ Nonce generator with counter-based uniqueness — existing
- ✓ Constant-time comparison helpers — existing
- ✓ Core dump prevention (setrlimit) — existing
- ✓ Secure memory wipe on drop (zeroize) — existing
- ✓ Cipher suite negotiation (AES-NI detection) — existing
- ✓ CLI argument parsing (clap v4 derive, all commands defined) — existing
- ✓ Wire protocol message types (Handshake, FileOffer, Chunk, Chat, Room, etc.) — existing
- ✓ Room code phrase generation (needs full EFF wordlist) — existing
- ✓ 7-crate workspace architecture with clean module boundaries — existing
- ✓ TUI widget library (30+ widgets: file browser, chat, transfer progress, accessibility, vim/emacs modes) — existing

### Active

<!-- Current scope. Building toward these. All are hypotheses until shipped and validated. -->

#### Critical Security Fixes (Pre-v1)
- [ ] Migrate PQ crypto from pqcrypto-kyber/dilithium/sphincsplus to ml-kem/ml-dsa/slh-dsa (FIPS 203/204/205)
- [ ] Fix Argon2id parameters to match spec (256MB, 3 iter, 4 parallel)
- [ ] Replace all non-constant-time hash comparisons with subtle::ConstantTimeEq
- [ ] Implement OPAQUE PAKE (currently returns dummy bytes — silent security failure)
- [ ] Implement CPace PAKE properly (currently bare DH, not the actual protocol)
- [ ] Wrap all key material in secrecy::SecretBox
- [ ] Add overflow-checks = true to release profile
- [ ] Add #![forbid(unsafe_code)] to all library crates
- [ ] Implement mlock for key material (currently no-op)
- [ ] Fix Double Ratchet out-of-order message handling (skipped-message-keys cache)
- [ ] Fix Triple Ratchet PQ secret mixing (currently discarded)
- [ ] Fix .unwrap() in non-test crypto code (mldsa, slhdsa, cpace, key storage)
- [ ] Embed full EFF Diceware wordlist (7776 words, not 100)

#### Core Transfer Pipeline (v1 MVP)
- [ ] Wire codec (postcard serialization, encode/decode)
- [ ] QUIC transport (quinn — connect, send, receive)
- [ ] TCP+TLS fallback transport
- [ ] Relay server (pass-through, signaling, rate limiting, auth)
- [ ] Relay client connection and forwarding
- [ ] Send pipeline (read → compress → encrypt → sign → send)
- [ ] Receive pipeline (receive → verify → decrypt → decompress → write)
- [ ] Chunk-based transfer with adaptive sizing
- [ ] Transfer resume from last verified chunk
- [ ] Transfer state machine lifecycle
- [ ] Manifest signing and verification
- [ ] Transfer progress reporting

#### Network Layer (v1)
- [ ] STUN NAT type detection
- [ ] UPnP port mapping
- [ ] UDP hole punching
- [ ] TURN relay fallback
- [ ] mDNS local peer discovery
- [ ] DNS-SD service advertisement
- [ ] SOCKS5 proxy support (Tor integration)
- [ ] DNS-over-HTTPS resolution

#### Storage Layer (v1)
- [ ] Config loading/saving (TOML, XDG paths)
- [ ] Identity keypair generation, export, import
- [ ] Encrypted key-value store
- [ ] Trust-on-first-use (TOFU) verification
- [ ] Contact database
- [ ] Transfer history log

#### CLI Commands (v1)
- [ ] tallow send — file transfer initiation
- [ ] tallow receive — file reception
- [ ] tallow identity — keypair management
- [ ] tallow config — configuration management
- [ ] tallow doctor — connectivity diagnostics
- [ ] tallow version — version display (done, needs cleanup)
- [ ] tallow benchmark — real crypto benchmarks (currently fake)

#### TUI Integration (v1)
- [ ] TUI main event loop (Ratatui + Crossterm)
- [ ] Panel rendering (status, transfers, devices, hotkey bar)
- [ ] Help overlay
- [ ] Screen wipe on exit/panic (clearscreen)
- [ ] Panic handler with terminal restoration

#### Logging & Observability (v1)
- [ ] tracing-subscriber initialization
- [ ] Structured log output (env-filter, levels)
- [ ] Sensitive data filtering in logs

#### OS Sandbox (v1)
- [ ] Landlock filesystem restrictions (Linux)
- [ ] Seccomp syscall filtering (Linux)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Custom onion routing — Tor via SOCKS5 proxy provides anonymity; building custom 3-hop routing is massive complexity for marginal gain over Tor
- I2P integration — defer to v2+; SOCKS5 proxy covers this use case
- AEGIS-256 cipher — feature-gated for v2; AES-256-GCM + ChaCha20 cover all platforms
- Group chat / group transfer — 1-to-1 is the v1 scope; multi-party adds significant protocol complexity
- Mobile app — CLI/TUI only for v1
- GUI — terminal-only by design philosophy
- Streaming/watch/sync modes — defer to v2; core send/receive must work first
- Decoy traffic — significant complexity, defer to v2
- Binary signing / reproducible builds — release infrastructure, not v1 feature code
- Package manager distribution (brew, scoop, apt, etc.) — v2 release engineering

## Context

### Current Codebase State
- **7-crate Rust workspace** with 200+ source files, 19,447 lines of Rust
- **tallow-crypto** is ~85% implemented — real ML-KEM, AES-GCM, HKDF, signatures, ratchets with tests
- **tallow-tui** has 47 widget files (11,826 LOC) but the main loop is unimplemented
- **tallow-net** is ~30% (all transport, NAT, privacy stubs)
- **tallow-protocol** is ~40% (message types defined, transfer logic missing)
- **tallow-store** is ~35% (schemas defined, all I/O stubs)
- **tallow-relay** is ~10% (bare CLI, server is a stub)
- **tallow** (main binary) is ~25% (CLI framework done, all commands stub to todo!())
- 4 CRITICAL security issues, 8 HIGH issues identified in concerns audit
- Uses wrong PQ crypto libraries (pqcrypto-* instead of FIPS-compliant ml-kem/ml-dsa)

### Technical Environment
- Rust stable toolchain, 2021 edition, MSRV 1.80
- tokio multi-threaded async runtime
- RustCrypto ecosystem for symmetric crypto
- pqcrypto ecosystem for PQ crypto (needs migration to pure Rust ml-kem/ml-dsa)
- Ratatui + Crossterm for TUI
- clap v4 derive API for CLI
- 60-agent Claude Code intelligence hierarchy for development
- GSD (Get Shit Done) framework for project management

### Feature Catalog
- 358 features documented in TALLOW_CLI_FEATURE_CATALOG.md
- v1 focuses on core secure transfer: ~80 features
- Full catalog serves as the long-term product vision

## Constraints

- **Budget**: Zero — Oracle Cloud free tier (ARM64, 1 OCPU, 12GB RAM) for relay; self-hostable
- **Binary size**: < 10 MB stripped
- **Startup time**: < 100ms to first prompt
- **Relay memory**: Must fit in 1 GB RAM
- **No external services**: No cloud APIs, no SaaS, no databases for relay
- **Security-first**: Every crypto decision documented in docs/crypto-decisions.md
- **AGPL-3.0 license**: Copyleft — relay modifications must be published
- **Rust stable**: No nightly features in production code (fuzz targets can use nightly)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ML-KEM-1024 (Security Level 5) | 15-year quantum threat horizon | — Pending (library migration needed) |
| Hybrid KEM (ML-KEM + X25519) | Defense-in-depth: if either survives, session secure | ✓ Good |
| HKDF-SHA256 over SHA3 | Broader compatibility, cryptographically sound | ✓ Good |
| AES-256-GCM primary cipher | Hardware acceleration (AES-NI), NIST standard | ✓ Good |
| Counter nonces over random | Guaranteed uniqueness, simpler state management | ✓ Good |
| BLAKE3 for hashing | Faster, parallelizable, built-in keyed hashing | ✓ Good |
| Single-relay + Tor over custom onion routing | Massive complexity reduction; Tor handles anonymity | ✓ Good |
| 7-crate workspace | Clean module boundaries, independent testing/auditing | ✓ Good |
| postcard for wire protocol | Compact binary, Serde-compatible (bincode in code — needs migration) | — Pending |
| Ratatui immediate-mode TUI | No sensitive data persists in widget tree between frames | ✓ Good |

---
*Last updated: 2026-02-19 after project initialization*
