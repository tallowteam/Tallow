# Project Research Summary

**Project:** Tallow — Post-Quantum Secure File Transfer CLI/TUI
**Domain:** Peer-to-peer encrypted file transfer (brownfield Rust, ~45% implemented)
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

Tallow is a brownfield Rust project with a complete 7-crate structural skeleton (~45% implemented), a strong cryptographic foundation, and 47 TUI widget files — but no working end-to-end transfer. The codebase contains 4 critical security failures that must be resolved before any networking code is wired: the PQ crypto libraries use pre-standard Kyber/Dilithium instead of finalized FIPS 203/204 ML-KEM/ML-DSA, Argon2id parameters are 13x weaker than spec, the OPAQUE PAKE implementation silently returns dummy bytes (authentication always succeeds regardless of password), and key material is not pinned in RAM due to a no-op mlock. None of these failures produce compile errors or runtime panics — they are silent. The recommended approach is to fix all 4 critical security issues first, then build the wire codec and transport layer, then the transfer pipelines, making Tallow a working tool before adding differentiating features.

The competitive position is clear and defensible: no existing tool (croc, magic-wormhole, wormhole-rs, portal, ffsend) has post-quantum crypto, a TUI dashboard, or meaningful privacy features (Tor, metadata stripping, memory security). Croc is the closest functional competitor and the benchmark to beat for table stakes. The strategy is: close the functional gap with croc (working send/receive, relay, PAKE, progress bars) while shipping the differentiators croc lacks (ML-KEM-1024 + X25519 hybrid KEM, Ratatui TUI, Tor integration, mlock, OS sandbox). Chat via Double Ratchet should be deferred to v2 — the ratchet implementation has known bugs with out-of-order message handling and PQ secret mixing that would require more work than the feature is worth for v1.

The layered build order from ARCHITECTURE.md research is the correct sequencing: wire codec first (unblocks everything), then transport and relay server, then send/receive pipelines, then CLI commands and persistence. This order ensures every layer is independently testable before the layer above depends on it. The critical constraint is that the codec must switch from bincode to postcard before any messages are sent — a post-facto migration after peers are communicating would require a protocol version bump.

## Key Findings

### Recommended Stack

The stack is already settled — the 7-crate workspace architecture, tokio async runtime, quinn QUIC, ratatui TUI, and clap CLI framework are correct choices and present in Cargo.toml files. The primary action item is two dependency migrations: replace `pqcrypto-kyber`/`pqcrypto-dilithium`/`pqcrypto-sphincsplus` with `ml-kem`/`ml-dsa`/`slh-dsa` (RustCrypto crates implementing finalized FIPS 203/204/205), and replace `bincode` with `postcard` as the wire serializer in all crates. Everything else in the stack is already the right choice.

**Core technologies:**
- `ml-kem` (RustCrypto) replacing `pqcrypto-kyber` — FIPS 203 ML-KEM-1024, interoperable with all standards-compliant implementations; the current Kyber library is wire-incompatible with ML-KEM
- `ml-dsa` (RustCrypto) replacing `pqcrypto-dilithium` — FIPS 204 ML-DSA-87 hybrid signatures; same interoperability concern
- `postcard` replacing `bincode` — spec-mandated wire serializer; postcard is purpose-built for compact binary protocols and does not support the `#[serde(tag = "type")]` JSON-style enum tagging that bincode tolerates; must migrate before the codec is implemented
- `quinn` v0.11 — QUIC transport, already present; use `Endpoint::server()` / `accept_bi()` / `open_bi()` patterns; framed with 4-byte length prefix + postcard
- `ratatui` v0.29 + `crossterm` v0.28 — TUI engine; 47 widget files already exist, only the main event loop is missing
- `tokio` v1 — multi-threaded async runtime; one task per QUIC connection in the relay, single pipeline task for send/receive (not per-chunk)
- `argon2` v0.5 with explicit `Params::new(262144, 3, 4, None)` — never `Argon2::default()` which uses 13x-weaker parameters

### Expected Features

The feature research cross-referenced Tallow's own 1,102-line feature catalog against the implemented codebase and competitor analysis.

**Must have (table stakes — blocking v1 launch):**
- Working PAKE (CPace over OPAQUE for v1 — OPAQUE is too complex and currently returns dummy bytes)
- PQ library migration (ml-kem/ml-dsa replacing pqcrypto-*) — the core differentiator is broken without this
- QUIC transport (quinn) + TCP+TLS fallback — no transfer is possible without these
- Working relay server — stub at 10% completion; required for all non-LAN transfers
- Send/receive pipelines (read→compress→encrypt→sign→send and inverse) — the core product functionality
- File integrity verification (BLAKE3 Merkle root wired to transfer)
- Atomic file writes (write to `.tallow.tmp`, rename on completion)
- Resume interrupted transfers (state persistence + checkpoint restore)
- Progress bars (indicatif wired to transfer pipeline)
- `tallow send` and `tallow receive` CLI commands (pipeline-wired)
- Config loading (TOML, XDG paths)
- Identity keypair generation (on first run, stored encrypted)
- EFF 7776-word diceware list (currently 100 words — trivial fix)
- Filename encryption (never expose filenames to relay)

**Should have (differentiators that justify choosing Tallow over croc):**
- Ratatui TUI dashboard with main event loop — no competitor has this; 47 widget files already exist
- SOCKS5/Tor integration (`--tor` flag) — only tool with built-in Tor support
- DNS-over-HTTPS — prevents DNS leaks that croc exposes
- TOFU trust verification with fingerprint display
- OS sandbox (Landlock + seccomp on Linux) — `sandbox.rs` exists
- `tallow doctor` diagnostics
- JSON output (`--json`) and semantic exit codes
- Bandwidth limiting (`--limit`)
- mDNS LAN discovery (skip relay for local transfers)
- Contact database for trusted peers

**Defer to v2:**
- Chat (Double Ratchet has known bugs with out-of-order messages and PQ mixing — broken crypto is worse than no chat)
- Group transfer (multi-party key distribution adds significant complexity)
- Custom onion routing (this is rebuilding Tor — use SOCKS5 instead)
- AEGIS-256 cipher (AES-256-GCM + ChaCha20 cover all platforms)
- TURN relay fallback (STUN + hole punching first)
- Package manager distribution (GitHub releases + `cargo install` for v1)
- Watch mode / delta sync (separate product category)

### Architecture Approach

The architecture is already defined at a structural level and is correct — do not redesign it. The 7-crate boundary (crypto pure → net transport → protocol orchestration → CLI) is the right separation. The primary work is filling in `todo!()` bodies in the correct dependency order. The relay is a dumb pipe that never inspects message content beyond the initial `RoomJoin` frame — all subsequent bytes are forwarded opaquely via `tokio::io::copy_bidirectional`. Key exchange and file transfer happen client-to-client through the relay, which cannot decrypt them. The relay uses a `DashMap<RoomId, RoomEntry>` for concurrent room state, removes the entry immediately when the second peer joins, and runs a `DataForwarder` task holding both stream handles directly.

**Major components and build order:**

1. `TallowCodec` — postcard framing with 4-byte length prefix; blocks everything else; must switch from `bincode` before implementing
2. `QuicTransport` / `TcpTlsTransport` — quinn bidirectional streams; QUIC-first with 300ms timeout before TCP+TLS fallback
3. `RelayServer` — quinn endpoint, DashMap room registry, DataForwarder; rcgen self-signed cert with TOFU fingerprint pinning
4. `RelayClient` + `SignalingClient` — thin wrappers over transport; handle reconnect/backoff
5. `SendPipeline` — read→chunk→compress→encrypt→sign→encode→send; single pipeline task (not per-chunk spawning); sliding window of 8 unacked chunks
6. `ReceivePipeline` — receive→verify (AES-GCM tag before any write)→decrypt→decompress→write; BLAKE3 Merkle root final verification
7. `TransferStateMachine` — already defined; guards transitions at each pipeline stage
8. CLI commands (`tallow send`, `tallow receive`), config/identity persistence, TUI event loop

Two architectural cleanup items identified: (1) Replace `#[serde(tag = "type")]` on `Message` enum — postcard does not support JSON-style tagged enums; (2) Replace `SignalingMessage::Offer{sdp}/Answer{sdp}/IceCandidate` WebRTC artifacts with Tallow-specific `Join/Leave/Ready/Error` variants that match the QUIC relay model.

### Critical Pitfalls

1. **pqcrypto-kyber is not ML-KEM** — Kyber (round 3 submission) and ML-KEM (FIPS 203 final) have different internal encodings, hash domain separators, and implicit rejection behavior. They are not wire-compatible. Any peer using a standards-compliant ML-KEM-1024 library will fail to interoperate with the current Tallow code. Fix: replace with `ml-kem = "0.2"` and `ml-dsa` from RustCrypto; run NIST Known Answer Tests against published FIPS 203/204 test vectors before closing.

2. **OPAQUE PAKE is a silent security stub** — `opaque.rs` returns `Ok(vec![1, 2, 3])` and `Ok([0u8; 32])`. Authentication always succeeds. Any password works. No compiler error, no runtime panic, no test failure. Fix: implement CPace (balanced PAKE, simpler than OPAQUE) for v1 using the actual protocol's password-derived generator point — not plain X25519 DH which is what the current CPace stub does.

3. **Argon2id parameters are 13x weaker than spec** — `Argon2::default()` uses 19 MiB / 2 iterations vs. spec's 256 MiB / 3 iterations / 4 parallel lanes. Hashes stored with weak parameters cannot be re-hashed without user re-authentication. Fix: define `const ARGON2_PARAMS: Params = Params::new(262144, 3, 4, None)` and use it everywhere; eliminate all `Argon2::default()` in non-test code.

4. **bincode vs postcard wire incompatibility** — The spec mandates `postcard` but all crates use `bincode`. Additionally, `#[serde(tag = "type")]` on the `Message` enum is incompatible with postcard's binary enum discriminant format. Fix: migrate to `postcard` and remove the serde tag attribute before implementing `TallowCodec::encode/decode` — this is still `todo!()` so there is no migration cost yet.

5. **mlock is a no-op — key material can swap to disk** — `lock_memory()` explicitly does nothing due to `#![forbid(unsafe_code)]` in tallow-crypto. Session keys, identity keys, and Argon2 hash intermediates can be swapped to the hibernation file or swap partition. Fix: wrap all long-lived key types in `secrecy::SecretBox`; add mlock behind a feature flag using the `region` crate already in `tallow`'s dependencies.

6. **AES-GCM nonce scope must be per-transfer, not per-chunk-index** — If the same session key is reused across multiple file transfers within a session, chunk index 0 of file A and chunk index 0 of file B produce identical nonces under the same key — catastrophic nonce reuse. Fix: derive per-transfer keys from the session key via HKDF with the transfer ID as context string; wire the existing `NonceGenerator` into `FileEncryptor`.

7. **File path traversal in receive pipeline** — Encrypted filenames protect against relay inspection, not against a malicious sender sending `../../.bashrc` as a filename. The receiver decrypts the filename and uses it. Fix: filter received filenames through `std::path::Component::Normal` — reject `ParentDir`, `RootDir`, `Prefix`; assert the final path is still under the output directory.

## Implications for Roadmap

Based on the dependency graph from ARCHITECTURE.md and security severity from PITFALLS.md, a 6-phase structure is recommended. The ordering is strict — each phase unblocks the next.

### Phase 1: Security Hardening (Critical Fixes)

**Rationale:** Four critical security failures exist that produce zero compiler or test warnings. Shipping any networking code before fixing these would lock in the failures. PQ library migration must happen before any wire format is finalized because the KEM output bytes will change. Argon2 parameter fix must happen before any identity keys are stored. PAKE fix must happen before any session establishment code integrates it.

**Delivers:** A crypto layer that actually provides the security it advertises. NIST KAT compliance. No silent auth bypasses. Key material pinned in RAM.

**Addresses (from FEATURES.md):** Items 2, 3, 4, 19, 24 from the Must Ship list — PQ migration, Argon2 fix, unwrap fixes, mlock fix.

**Avoids (from PITFALLS.md):** Pitfalls 1 (pqcrypto-kyber), 2 (Argon2 weak params), 3 (OPAQUE stub), 4 (unwrap panics in prod), 12 (mlock no-op), 13 (forbid unsafe_code in all crates).

**Research flag:** Standard patterns — FIPS 203/204 migration is well-documented; RustCrypto ml-kem/ml-dsa crates have established APIs. No additional research needed.

### Phase 2: Wire Codec and Transport

**Rationale:** `TallowCodec::encode/decode` is still `todo!()` — this is the ideal moment to migrate from bincode to postcard and fix the `#[serde(tag = "type")]` issue at zero migration cost. All transport and relay code depends on the codec. QUIC and TCP+TLS transports are the foundation for every subsequent network operation.

**Delivers:** A working codec (postcard framing, all Message variants round-trippable), QUIC transport (quinn bidirectional streams), TCP+TLS fallback, and a working relay server (room registry, DataForwarder, rate limiting, 60s room timeout, rcgen TLS cert with TOFU fingerprint pinning).

**Addresses (from FEATURES.md):** Items 5, 6, 7, 8, 9 from Must Ship list — wire codec, QUIC transport, TCP+TLS fallback, relay server, relay client.

**Avoids (from PITFALLS.md):** Pitfall 5 (bincode→postcard before codec implemented), Pitfall 7 (relay DoS: design room caps into initial data model), Pitfall 8 (self-signed TLS without pinning). Also: replace `SignalingMessage` WebRTC artifacts with Tallow-specific variants.

**Research flag:** Standard patterns — quinn 0.11 `Endpoint::server()` / `accept_bi()` / `open_bi()` are stable and well-documented. DashMap room registry follows established relay patterns from croc and magic-wormhole. No additional research needed.

### Phase 3: Send and Receive Pipelines

**Rationale:** With codec and transport working, the core product feature can be built. The pipeline order (read→compress→encrypt→sign→send and inverse) is the heart of Tallow. The AES-GCM nonce scope fix (per-transfer key derivation via HKDF) and path traversal sanitization must be built into the pipeline design from the start — not bolted on later.

**Delivers:** Working `tallow send` and `tallow receive` commands. File chunking (64KB base, adaptive), zstd compression (entropy-based skip for incompressible files), AES-256-GCM encryption with per-transfer derived keys, BLAKE3 Merkle root verification on receive, atomic writes (`.tallow.tmp` → rename), progress bars (indicatif), accept/decline prompt, chunk-level authentication (AAD binds chunk index).

**Addresses (from FEATURES.md):** Items 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 24 from Must Ship list.

**Avoids (from PITFALLS.md):** Pitfall 6 (AES-GCM nonce reuse across transfers — derive per-transfer keys), Pitfall 11 (path traversal — Component::Normal filter on receive), Pitfall 15 (remove redundant unauthenticated chunk hash field; rely on GCM tag). Use a sliding window of 8 unacked chunks; do not block on ack before sending next chunk (Pitfall AP4).

**Research flag:** Standard patterns — the send/receive pipeline follows established croc / magic-wormhole patterns. The "verify AES-GCM tag before any write" invariant is well-understood AEAD practice. No additional research needed.

### Phase 4: State Persistence and CLI Polish

**Rationale:** With working send/receive, the persistence layer (config, identity, encrypted key storage, transfer resume) and CLI polish (shell completions, JSON output, exit codes, `tallow doctor`, bandwidth limiting) can be wired up. Transfer resume requires state persistence, so both must happen together.

**Delivers:** Config file loading (TOML, XDG paths), identity keypair generation on first run, encrypted key-value storage (Argon2id-derived key + XChaCha20), TOFU trust verification with fingerprint display, contact database, transfer history log (opt-in, encrypted), transfer resume (checkpoint/restore from last verified chunk), shell completions (bash/zsh/fish/PowerShell via clap_complete), JSON output mode, semantic exit codes, `tallow doctor` diagnostics, bandwidth limiting, stdin/stdout piping, non-interactive mode (`--yes`, `--code` from env).

**Addresses (from FEATURES.md):** Items 17, 18, 28-35 from Must/Should Ship lists.

**Avoids (from PITFALLS.md):** Pitfall 2 revisited — config loading must use the fixed Argon2id constants, never `Argon2::default()`.

**Research flag:** Standard patterns — clap_complete, XDG path resolution, TOML config, indicatif resume. No additional research needed.

### Phase 5: Privacy and TUI

**Rationale:** The two strongest differentiators vs. croc (TUI dashboard and Tor integration) both require Phase 3-4 foundations. The TUI needs transfer state to display. Tor integration slots into the RelayClient as a SOCKS5 proxy wrapper. Both can be built in parallel within this phase.

**Delivers:** SOCKS5 proxy integration (hostname-mode, not IP-only — prevents DNS leaks), Tor integration (`--tor` flag, auto-detect `127.0.0.1:9050`), DNS-over-HTTPS (hickory-resolver already has DoH support), Ratatui TUI main event loop (terminal resize, input handling, panel routing), TUI panels (transfer progress, device trust status, network quality), screen wipe on exit and panic hook, mDNS LAN peer discovery (skip relay for local transfers), OS sandbox (Landlock + seccomp on Linux).

**Addresses (from FEATURES.md):** Items 25-31 from Should Ship list.

**Avoids (from PITFALLS.md):** Pitfall 10 (Tor DNS leaks — SOCKS5 hostname-mode with remote resolution; disable system DNS in Tor mode), Pitfall 17 (screen wipe — register panic hook with clearscreen). Note: compression oracle risk — ensure compress-then-encrypt ordering (not the reverse) to mitigate CRIME-style attacks.

**Research flag:** SOCKS5 hostname-mode implementation may need closer review of the `tokio-socks` crate API to confirm it supports ATYP=0x03 hostname passthrough. TUI event loop patterns with ratatui 0.29 are well-documented.

### Phase 6: Security Audit and Release Hardening

**Rationale:** Before any public v1 release, a full audit sweep is required: timing side channels, clippy lint compliance, cargo audit, cargo deny, fuzz targets for protocol parsing and filename sanitization, property tests for crypto round-trips, NIST KAT vector verification for all PQ operations.

**Delivers:** Clean `cargo clippy --workspace -- -D warnings`, `cargo audit` clear, `cargo deny check` clear, property tests for all Message round-trips via postcard, fuzz targets for TallowCodec and filename sanitization, NIST KAT test suite for ml-kem/ml-dsa, review of all `subtle::ConstantTimeEq` usage vs. `==` on secret types, `#![forbid(unsafe_code)]` verified on all library crates, `SecretBox` wrapping audit for all key material types.

**Avoids (from PITFALLS.md):** Pitfall 4 (non-constant-time comparisons propagating to production), residual `unwrap()` outside test blocks, compression oracle (verify encrypt-then-compress is not accidentally inverted).

**Research flag:** No additional research needed — audit process is defined by `cargo audit`, `cargo deny`, clippy, and the NIST test vector suite.

### Phase Ordering Rationale

- Phase 1 before everything: silent security failures cannot be allowed to propagate into networking code. The PQ library migration changes key sizes and encoding — it must happen before any wire format is defined.
- Phase 2 before Phase 3: the codec is the foundation of all message passing; the relay server must exist before client code can be tested; transport negotiation must work before pipelines can send anything.
- Phase 3 before Phase 4: persistence and resume require a working pipeline to resume from; `tallow doctor` needs real QUIC/relay connectivity to diagnose.
- Phase 5 in parallel after Phase 3: TUI and Tor do not block the core transfer path; they layer on top of the working CLI.
- Phase 6 last: audit sweeps are only meaningful once all features are implemented and integrated.

### Research Flags

Phases needing deeper research during planning:
- **Phase 5 (SOCKS5 hostname-mode):** Confirm `tokio-socks` v0.5 supports ATYP=0x03 (domain name) passthrough, not just IP-mode connections. If it does not, evaluate `socks5-proto` or raw SOCKS5 implementation. DNS leak prevention correctness is subtle.
- **Phase 1 (CPace PAKE):** CPace implementation requires hash-to-curve (derive a generator point from the password via Elligator2 or similar). The current CPace stub does plain X25519 DH without the password-derived generator step — this makes it unauthenticated key exchange. Research the CPace RFC 9380 hash-to-curve requirement and identify the correct Rust implementation path.

Phases with standard, well-documented patterns (skip additional research):
- **Phase 2 (quinn relay server):** The `Endpoint::server()` / `accept_bi()` / DashMap room registry pattern is established and directly applicable.
- **Phase 3 (send/receive pipelines):** The pipeline pattern mirrors croc and magic-wormhole; the crypto operations are already implemented in tallow-crypto.
- **Phase 4 (persistence/CLI polish):** clap_complete, dirs, TOML config, and indicatif resume are all well-documented.
- **Phase 6 (audit):** Process-driven, no domain research required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Derived from direct Cargo.toml inspection and codebase analysis; the two migrations (pqcrypto→ml-kem, bincode→postcard) are well-documented and straightforward |
| Features | HIGH | Primary sources: Tallow's own 1,102-line feature catalog and full codebase inspection; competitor matrix is MEDIUM (training data, no live verification) |
| Architecture | HIGH | Based on deep codebase analysis of all 7 crates plus established relay patterns from croc/magic-wormhole; quinn 0.11 API patterns are stable |
| Pitfalls | HIGH | All critical pitfalls confirmed via direct code inspection with specific file and line citations; no speculative pitfalls presented as critical |

**Overall confidence:** HIGH

### Gaps to Address

- **CPace hash-to-curve implementation path:** The correct way to implement the CPace password-derived generator in Rust (via hash-to-curve per RFC 9380) needs validation. The `curve25519-dalek` crate's Elligator2 map or a separate `hash2curve` crate may be needed. Resolve during Phase 1 planning.
- **Competitor feature verification:** The competitor matrix (croc, magic-wormhole feature list) is from training data (Aug 2025 cutoff). Verify against live GitHub repos before using for marketing claims.
- **Ratchet fix scope:** The Double Ratchet skipped-message-key cache fix was deferred to v2, but if a decision is made to include basic session chat in v1 (using QUIC ordered streams which eliminate out-of-order delivery), the scope of ratchet work changes. This needs a deliberate decision during roadmap creation.
- **TURN relay:** The current plan uses STUN + hole punching only; TURN (relay fallback for symmetric NATs) is deferred. Estimate of how many users will be blocked by symmetric NAT without TURN would sharpen the v1/v2 decision.
- **Windows sandbox:** `sandbox.rs` targets Linux Landlock + seccomp; Windows has no equivalent plan. This is acknowledged but not addressed for v1.

## Sources

### Primary (HIGH confidence)
- Tallow codebase: all 7 crates, direct source inspection (2026-02-19) — pitfall confirmation, architecture patterns, stack inventory
- `E:/Tallow/.planning/codebase/STACK.md` — full dependency inventory with versions and file locations
- `E:/Tallow/.planning/codebase/CONCERNS.md` (via ARCHITECTURE.md references) — serialization mismatch, signaling protocol artifacts
- `E:/Tallow/.planning/PROJECT.md` — validated/active/out-of-scope feature list
- `TALLOW_CLI_FEATURE_CATALOG.md` (recovered from git history) — 1,102-line feature catalog with competitor analysis
- NIST FIPS 203/204/205 (ML-KEM/ML-DSA/SLH-DSA finalization documentation) — Kyber vs. ML-KEM incompatibility
- RFC 1928 (SOCKS5), RFC 9380 (hash-to-curve) — privacy layer protocol behavior
- Signal Protocol double ratchet specification — ratchet out-of-order handling requirements

### Secondary (MEDIUM confidence)
- Training knowledge: croc v10, magic-wormhole 0.14.x, wormhole-rs, portal, ffsend feature matrices — competitor analysis
- quinn 0.11 API patterns from training data — `Endpoint::server()`, `accept_bi()`, `open_bi()` (stable, well-documented)
- postcard vs. bincode serde compatibility behavior — `#[serde(tag = "type")]` incompatibility with postcard

### Tertiary (LOW confidence)
- N/A — no LOW confidence findings were used to inform roadmap implications

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
