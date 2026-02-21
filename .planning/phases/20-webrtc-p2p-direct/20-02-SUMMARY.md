---
phase: 20-webrtc-p2p-direct
plan: 02
subsystem: network
tags: [p2p, quic, hole-punch, nat-traversal, direct-connection, quinn]

# Dependency graph
requires:
  - phase: 20-webrtc-p2p-direct
    provides: "CandidateOffer/CandidatesDone/DirectFailed/DirectConnected Message variants, candidates.rs, --no-p2p CLI flag"
provides:
  - "negotiate_p2p() P2P negotiation state machine with candidate exchange and hole punch"
  - "DirectListener::connect_to() for outbound QUIC via existing endpoint (no EADDRINUSE)"
  - "P2P upgrade logic in send.rs (initiator/client) and receive.rs (responder/server)"
  - "Automatic relay-to-direct channel swap on successful hole punch"
  - "JSON events for p2p_upgrade and p2p_fallback"
affects: [20-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Lightweight binary P2P signaling protocol in tallow-net (avoids circular dependency)", "Quinn endpoint reuse for hole punching (single UDP socket for both accept and connect)"]

key-files:
  created:
    - crates/tallow-net/src/transport/p2p.rs
  modified:
    - crates/tallow-net/src/transport/direct.rs
    - crates/tallow-net/src/transport/mod.rs
    - crates/tallow/src/commands/send.rs
    - crates/tallow/src/commands/receive.rs

key-decisions:
  - "Used lightweight binary protocol for P2P signaling in tallow-net instead of tallow-protocol Message/TallowCodec to avoid circular crate dependency"
  - "connect_to() takes &mut self since quinn::Endpoint::set_default_client_config requires &mut"
  - "Manual Debug impl on NegotiationResult since DirectConnection lacks derive(Debug)"

patterns-established:
  - "P2P negotiation as post-handshake upgrade: gather candidates, exchange via relay, attempt hole punch, swap channel"
  - "Binary protocol tags (0x01-0x04) for P2P signaling within tallow-net transport layer"

requirements-completed: [P2P-02, P2P-03, P2P-06, P2P-07]

# Metrics
duration: 15min
completed: 2026-02-21
---

# Phase 20 Plan 02: P2P Negotiation Summary

**P2P negotiation module with QUIC hole punching via endpoint reuse, wired into send/receive commands for automatic relay-to-direct upgrade after KEM handshake**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-21T15:39:20Z
- **Completed:** 2026-02-21T15:54:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Complete P2P negotiation state machine: NAT detection, candidate gathering, exchange, QUIC hole punch
- DirectListener::connect_to() for outbound connections reusing the listener's quinn::Endpoint (critical for hole punching)
- P2P upgrade wired into both send.rs (initiator/client) and receive.rs (responder/server) after KEM handshake
- Defense-in-depth: no_p2p guard inside negotiate_p2p(), callers also check proxy/no_p2p before calling
- Symmetric NAT short-circuits to relay fallback immediately

## Task Commits

Each task was committed atomically:

1. **Task 1: Create P2P negotiation module (p2p.rs)** - `228a9b6` (feat)
2. **Task 2: Wire P2P upgrade into send and receive commands** - `09d44c6` (feat)

## Files Created/Modified
- `crates/tallow-net/src/transport/p2p.rs` - P2P negotiation module with negotiate_p2p(), candidate exchange, hole punch
- `crates/tallow-net/src/transport/direct.rs` - Added connect_to() method to DirectListener for endpoint reuse
- `crates/tallow-net/src/transport/mod.rs` - Added p2p module and re-exports (negotiate_p2p, NegotiationResult)
- `crates/tallow/src/commands/send.rs` - P2P upgrade block after KEM handshake (is_initiator=true)
- `crates/tallow/src/commands/receive.rs` - P2P upgrade block after KEM handshake (is_initiator=false)

## Decisions Made
- Used lightweight binary protocol (tag-based, no postcard) for P2P candidate exchange within tallow-net to avoid circular dependency with tallow-protocol. The Message enum's CandidateOffer/CandidatesDone variants exist for relay awareness but the actual candidate exchange is self-contained.
- connect_to() takes &mut self because quinn::Endpoint::set_default_client_config requires mutable access
- Implemented manual Debug for NegotiationResult since DirectConnection doesn't derive Debug
- Used tracing::info for is_direct state change to suppress unused-assignment warning (variable reserved for future use)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced tallow-protocol imports with lightweight binary protocol**
- **Found during:** Task 1 (p2p.rs creation)
- **Issue:** Plan specified using TallowCodec and Message types from tallow-protocol in p2p.rs, but tallow-net cannot depend on tallow-protocol (circular dependency: tallow-protocol depends on tallow-net)
- **Fix:** Implemented lightweight binary tag-based protocol (TAG_CANDIDATE_OFFER=0x01, TAG_CANDIDATES_DONE=0x02, TAG_DIRECT_FAILED=0x03, TAG_DIRECT_CONNECTED=0x04) with simple encode/decode in p2p.rs itself
- **Files modified:** crates/tallow-net/src/transport/p2p.rs
- **Verification:** cargo build -p tallow-net succeeds; cargo clippy clean
- **Committed in:** 228a9b6 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed connect_to() mutability and Debug derive**
- **Found during:** Task 1 (compilation)
- **Issue:** quinn::Endpoint::set_default_client_config requires &mut self; DirectConnection doesn't derive Debug for NegotiationResult derive
- **Fix:** Changed connect_to() to take &mut self; implemented manual Debug for NegotiationResult; adjusted attempt_as_client to take mut listener
- **Files modified:** crates/tallow-net/src/transport/direct.rs, crates/tallow-net/src/transport/p2p.rs
- **Verification:** cargo build -p tallow-net succeeds; cargo clippy clean
- **Committed in:** 228a9b6 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for compilation. Binary protocol approach preserves the clean crate dependency graph. No scope creep.

## Issues Encountered
None - all changes compile clean, clippy clean across workspace.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- P2P negotiation module complete and wired into send/receive commands
- DirectListener::connect_to() ready for endpoint reuse in hole punching
- Plan 03 (benchmarks/metrics/integration tests) can build on this foundation
- All existing tests continue to pass unchanged

---
*Phase: 20-webrtc-p2p-direct*
*Completed: 2026-02-21*
