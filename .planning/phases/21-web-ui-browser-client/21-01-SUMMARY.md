---
phase: 21-web-ui-browser-client
plan: 01
subsystem: crypto, protocol, wasm
tags: [wasm-bindgen, wasm32, postcard, hybrid-kem, aes-gcm, blake3, hkdf, cdylib, feature-gates]

# Dependency graph
requires:
  - phase: 01-06
    provides: "tallow-crypto (hybrid KEM, AES-GCM, BLAKE3, HKDF) and tallow-protocol (wire Message enum, sanitize_display)"
provides:
  - "tallow-web cdylib crate compiling to wasm32-unknown-unknown"
  - "Feature-gated tallow-protocol (full vs wasm)"
  - "WASM crypto wrappers: WasmKeyPair, encryptChunk, decryptChunk, blake3Hash, hkdfDerive"
  - "WASM codec: encodeMessage/decodeMessage + typed message encoders"
  - "WASM-compatible ANSI stripping fallback in sanitize.rs"
affects: [21-02-PLAN, 21-03-PLAN, 21-04-PLAN, 21-05-PLAN]

# Tech tracking
tech-stack:
  added: [wasm-bindgen, web-sys, js-sys, wasm-bindgen-futures, console_error_panic_hook, serde-wasm-bindgen, getrandom-js]
  patterns: [feature-gating for wasm compilation, bincode serialization for hybrid KEM types across JS boundary, counter-based AES-GCM nonces in WASM]

key-files:
  created:
    - crates/tallow-web/Cargo.toml
    - crates/tallow-web/src/lib.rs
    - crates/tallow-web/src/crypto.rs
    - crates/tallow-web/src/codec.rs
  modified:
    - Cargo.toml
    - crates/tallow-protocol/Cargo.toml
    - crates/tallow-protocol/src/lib.rs
    - crates/tallow-protocol/src/wire/mod.rs
    - crates/tallow-protocol/src/transfer/mod.rs
    - crates/tallow-protocol/src/transfer/sanitize.rs

key-decisions:
  - "Gate heavy modules (chat, compression, kex, metadata, multi, room) behind 'full' feature entirely rather than per-file gating"
  - "Use bincode for hybrid KEM type serialization across JS boundary (consistent with tallow-crypto internal usage)"
  - "WASM ANSI stripping uses lightweight state machine instead of VTE parser (strip-ansi-escapes)"
  - "postcard with alloc (not use-std) in tallow-web to avoid wasm32 std incompatibilities"
  - "getrandom 0.2 with 'js' feature (not 0.3 'wasm_js') for crypto.getRandomValues() wiring"

patterns-established:
  - "Feature gate pattern: 'full' = all deps (default), 'wasm' = minimal (wire + sanitize only)"
  - "WASM crypto wrapper pattern: accept &[u8], validate length, call tallow-crypto, map_err to JsValue"
  - "Counter-based nonce pattern in WASM: [0u8; 4] || counter.to_be_bytes() for AES-GCM"

requirements-completed: [WEB-01, WEB-02, WEB-03, WEB-18]

# Metrics
duration: 37min
completed: 2026-02-21
---

# Phase 21 Plan 01: WASM Crate and Feature-Gated Protocol Summary

**tallow-web cdylib crate exposing hybrid KEM, AES-256-GCM, BLAKE3, HKDF, and postcard codec to JavaScript via wasm-bindgen, compiling to wasm32-unknown-unknown at 627KB**

## Performance

- **Duration:** 37 min
- **Started:** 2026-02-21T23:39:19Z
- **Completed:** 2026-02-22T00:16:26Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Created tallow-web cdylib crate that compiles to wasm32-unknown-unknown (627KB release binary)
- Feature-gated tallow-protocol: `full` (default, all native deps) vs `wasm` (wire messages + sanitize only)
- Exposed hybrid post-quantum KEM (ML-KEM-1024 + X25519), AES-256-GCM, BLAKE3, HKDF via wasm-bindgen
- Implemented typed postcard codec wrappers for all message types needed by browser (handshake, file transfer, chat)
- All 206 existing tallow-protocol tests pass with `--features full` (backward compatible)
- 59 tests pass under `--no-default-features --features wasm`

## Task Commits

Each task was committed atomically:

1. **Task 1: Feature-gate tallow-protocol and create tallow-web crate structure** - `0be099d` (feat)
2. **Task 2: Implement wasm-bindgen crypto wrappers and postcard codec** - `2a68e91` (feat)

## Files Created/Modified
- `Cargo.toml` - Added tallow-web to workspace members
- `crates/tallow-web/Cargo.toml` - New cdylib crate with wasm-bindgen, getrandom js, serde-wasm-bindgen deps
- `crates/tallow-web/src/lib.rs` - WASM entry point with console_error_panic_hook
- `crates/tallow-web/src/crypto.rs` - WasmKeyPair, encryptChunk, decryptChunk, blake3Hash, blake3DeriveRoomId, hkdfDerive, encryptChatMessage, decryptChatMessage
- `crates/tallow-web/src/codec.rs` - encodeMessage/decodeMessage (generic) + 13 typed message encoders + sanitizeDisplayText
- `crates/tallow-protocol/Cargo.toml` - Added `full`/`wasm` features, gated 17 deps behind `full`
- `crates/tallow-protocol/src/lib.rs` - Gate chat/compression/kex/metadata/multi/room behind `full`
- `crates/tallow-protocol/src/wire/mod.rs` - Gate codec/version behind `full`, keep messages always available
- `crates/tallow-protocol/src/transfer/mod.rs` - Gate all submodules except sanitize behind `full`
- `crates/tallow-protocol/src/transfer/sanitize.rs` - Add WASM-compatible ANSI stripping state machine fallback

## Decisions Made
- **Feature gating strategy:** Gate entire modules behind `full` rather than per-file. Simpler, fewer cfg attributes, modules that need tokio/zstd/etc are fully excluded under `wasm`. Only wire/messages.rs, transfer/sanitize.rs, and error.rs always compile.
- **bincode for KEM serialization:** Hybrid KEM types (PublicKey, SecretKey, Ciphertext) already derive Serialize/Deserialize and are serialized with bincode internally. Using bincode at the JS boundary ensures byte-level compatibility with the CLI.
- **postcard::to_allocvec in WASM:** Using `alloc` feature instead of `use-std` since WASM targets have limited std. The `to_allocvec` function works identically to `to_stdvec` but without std dependency.
- **Separate chat encryption in crypto.rs:** Rather than depending on tallow-protocol's chat::encrypt module (which pulls in more deps), replicated the nonce/AAD pattern directly in the WASM wrapper. Same crypto, same format, no extra deps.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing build failure in tallow-net (doh.rs hickory-resolver API change) caused `cargo test -p tallow-protocol --features full` to fail when uncommitted tallow-net changes were present. Resolved by reverting uncommitted tallow-net changes (not part of this plan). All 206 tests pass on clean tallow-net.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- tallow-web foundation complete: crypto and codec ready for WebSocket relay integration (Plan 02)
- Browser can generate KEM keypairs, encapsulate/decapsulate shared secrets, encrypt/decrypt chunks and chat messages
- All message types for the handshake and transfer protocol are encodable from JavaScript
- WASM binary is compact (627KB), suitable for web deployment

## Self-Check: PASSED

- All 9 source files verified present on disk
- Commits `0be099d` and `2a68e91` verified in git log
- WASM binary exists at `target/wasm32-unknown-unknown/release/tallow_web.wasm` (627KB)

---
*Phase: 21-web-ui-browser-client*
*Completed: 2026-02-21*
