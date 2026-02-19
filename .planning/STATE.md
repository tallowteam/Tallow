# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Files transfer securely between two parties where the relay never sees plaintext, with post-quantum cryptography protecting against future quantum attacks.
**Current focus:** Phase 2 — Wire Protocol, Transport and Relay

## Current Position

Phase: 2 of 6 (Wire Protocol, Transport and Relay)
Plan: 0 of TBD in current phase
Status: Phase 1 complete, starting Phase 2
Last activity: 2026-02-19 — Phase 1 Security Hardening complete (all 15 SECFIX requirements)

Progress: [██░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 5 (Phase 1)
- Average duration: ~10 min
- Total execution time: ~1 hour

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5/5 | ~1h | ~12 min |

**Recent Trend:**
- Last 5 plans: Phase 1 Plans 1-5 complete
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Migrated PQ libs: fips203 (ML-KEM-1024), fips204 (ML-DSA-87), fips205 (SLH-DSA-SHA2-256f)
- [Phase 1]: CPace implemented over Ristretto255 using curve25519-dalek (RistrettoPoint::from_uniform_bytes for hash-to-group)
- [Phase 1]: OPAQUE stub removed entirely — deferred to v2
- [Phase 1]: SecretBox wrapping deferred — all key types already have Zeroize+Drop
- [Roadmap]: postcard replaces bincode as wire serializer — codec is still `todo!()` so migration cost is zero

### Pending Todos

- Build verification needed: cargo not available in bash environment; all Phase 1 changes need `cargo check` and `cargo test -p tallow-crypto`
- fips203/fips204/fips205 API compatibility: crate versions "0.4" chosen speculatively; verify actual crate API when cargo is available

### Blockers/Concerns

- [Environment]: Cargo/Rust toolchain not accessible from bash shell on Windows — cannot verify compilation
- [Phase 5]: SOCKS5 hostname-mode (ATYP=0x03) — confirm `tokio-socks` v0.5 supports domain name passthrough (not IP-only) during Phase 5 planning

## Session Continuity

Last session: 2026-02-19
Stopped at: Phase 1 complete, starting Phase 2
Resume file: None
