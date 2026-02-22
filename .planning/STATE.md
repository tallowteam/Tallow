# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Files transfer securely between two parties where the relay never sees plaintext, with post-quantum cryptography protecting against future quantum attacks.
**Current focus:** Phase 21 - Web UI / Browser Client

## Current Position

Phase: 21 (Web UI / Browser Client)
Plan: 3 of 5
Status: Phase 21 IN PROGRESS (plan 03 complete)
Last activity: 2026-02-22 — Plan 21-03 complete (Browser file transfer UI)

Progress: [======....] 60% (3/5 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 16+ (Phases 1-6)
- Average duration: ~10 min
- Total execution time: ~4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5/5 | ~1h | ~12 min |
| 2 | 4/4 | ~45m | ~11 min |
| 3 | 4/4 | ~40m | ~10 min |
| 4 | 3/3 | ~35m | ~12 min |
| 5 | 3/3 | ~30m | ~10 min |
| 6 | 1/1 | ~15m | ~15 min |
| 20 | 3/3 | ~44m | ~15 min |

**Recent Trend:**
- Phase 21 Plan 03 complete (Browser file transfer UI + dark theme + KEM handshake)
- Phase 21 Plan 02 complete (Relay WebSocket transport + WS-QUIC bridging)
- Phase 21 Plan 01 complete (WASM crate + feature gates + crypto/codec wrappers)
- Phase 20 Plan 03 complete (P2P testing) -- Phase 20 DONE
- Phase 20 Plan 02 complete (P2P negotiation module)
- Phase 20 Plan 01 complete (P2P foundation)
- Trend: Active

*Updated after each plan completion*
| Phase 21 P03 | 15min | 2 tasks | 13 files |
| Phase 21 P02 | 43min | 2 tasks | 5 files |
| Phase 21 P01 | 37min | 2 tasks | 11 files |
| Phase 20 P03 | 12min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Migrated PQ libs: fips203 (ML-KEM-1024), fips204 (ML-DSA-87), fips205 (SLH-DSA-SHA2-256f)
- [Phase 1]: CPace implemented over Ristretto255 using curve25519-dalek
- [Phase 1]: SecretBox wrapping deferred — all key types already have Zeroize+Drop
- [Phase 2]: postcard wire serializer, 4-byte BE length prefix, DashMap room management
- [Phase 3]: Zstd default compression with entropy auto-selection, counter-based AES-GCM nonces
- [Phase 4]: XDG paths via dirs crate, identity encrypted with Argon2id+ChaCha20, JSON persistence for trust/history
- [Phase 5]: SOCKS5 via tokio-socks with hostname passthrough for Tor, hickory-resolver for DoH, mdns-sd for LAN discovery
- [Phase 6]: Platform-gated sandbox (Landlock+Seccomp on Linux, pledge+unveil on OpenBSD), core dump prevention, sensitive field redaction
- [Phase 20-01]: Corrected discriminant values to 35-38 (plan specified 36-39); moved discover_from_port() to Task 1 for compilation
- [Phase 20-01]: Added --no-p2p to all 6 command structs with proxy/tor flags
- [Phase 20-02]: Lightweight binary protocol for P2P signaling in tallow-net (avoids circular dep with tallow-protocol)
- [Phase 20-02]: Quinn endpoint reuse for hole punching (single UDP socket for both accept and connect)
- [Phase 20-03]: 30 new tests verifying P2P local connection, hole punch endpoint reuse, binary protocol encoding, candidate validation, and wire protocol backward compatibility
- [Phase 20]: 30 new P2P tests using binary protocol tags (not TallowCodec), MockChannel for no_p2p guard, TEST-NET-1 for timeouts
- [Phase 21-01]: Feature-gate tallow-protocol: 'full' (default) vs 'wasm' (wire messages + sanitize only)
- [Phase 21-01]: tallow-web cdylib crate with wasm-bindgen, getrandom js, bincode for KEM serialization
- [Phase 21-01]: WASM ANSI stripping uses state machine fallback (no VTE/strip-ansi-escapes dep)
- [Phase 21-01]: postcard with alloc feature (not use-std) in tallow-web for wasm32 compatibility
- [Phase 21-02]: axum 0.8 for WebSocket support — dual-transport relay (QUIC 4433 + WS 4434)
- [Phase 21-02]: Permissive CORS — security from E2E encryption, not origin checking
- [Phase 21-02]: 4-byte BE length prefix bridging between WS and QUIC room channels
- [Phase 21-02]: Shared RoomManager Arc between QUIC and WS listeners
- [Phase 21-03]: Plain TypeScript with tsc (no bundler) -- app is small per CONTEXT.md discretion
- [Phase 21-03]: AAD = transfer_id || chunk_index.to_be_bytes() -- exact match with CLI chunking.rs
- [Phase 21-03]: WasmFileManifest in file_io.rs -- FileManifest behind 'full' gate needs WASM-compatible type
- [Phase 21-03]: SPA state machine: landing -> code-entry -> connecting -> waiting -> handshake -> dashboard

### Pending Todos

- Build verification needed: cargo not available in bash environment; all changes need `cargo check`
- fips203/fips204/fips205 API compatibility: crate versions "0.4" chosen speculatively
- Linux sandbox implementation: Landlock and Seccomp code structures are in place but need Linux-specific deps to compile

### Blockers/Concerns

- [Environment]: Cargo/Rust toolchain not accessible from bash shell on Windows — cannot verify compilation

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 21-03-PLAN.md (Browser file transfer UI + dark theme)
Resume file: None
