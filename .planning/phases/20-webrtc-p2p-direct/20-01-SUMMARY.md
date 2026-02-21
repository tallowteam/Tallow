---
phase: 20-webrtc-p2p-direct
plan: 01
subsystem: network
tags: [p2p, stun, ice, candidates, nat-traversal, cli, postcard]

# Dependency graph
requires:
  - phase: 19-multi-peer-rooms
    provides: "Message enum with multi-peer variants (RoomPeerCount as last variant)"
provides:
  - "CandidateOffer/CandidatesDone/DirectConnected/DirectFailed Message variants"
  - "candidates.rs with gather_candidates(), validate_candidate_addr(), encode/decode_socket_addr()"
  - "StunClient::discover_from_port() for port-specific STUN binding"
  - "--no-p2p CLI flag on all relay-connected command args"
affects: [20-02-PLAN, 20-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: ["ICE-like candidate gathering with priority sorting", "Port-specific STUN binding for NAT binding consistency"]

key-files:
  created:
    - crates/tallow-net/src/nat/candidates.rs
  modified:
    - crates/tallow-protocol/src/wire/messages.rs
    - crates/tallow-net/src/nat/stun.rs
    - crates/tallow-net/src/nat/mod.rs
    - crates/tallow/src/cli.rs

key-decisions:
  - "Corrected discriminant values to 35-38 (plan specified 36-39 but RoomPeerCount is index 34)"
  - "Added discover_from_port() in Task 1 instead of Task 2 to unblock candidates.rs compilation"
  - "Added --no-p2p to all 6 command structs with proxy/tor flags (Send, Receive, Chat, Sync, Watch, Clip)"

patterns-established:
  - "P2P signaling variants appended after Phase 19 multi-peer variants with discriminant stability tests"
  - "Candidate address validation rejects loopback, link-local, broadcast, multicast, unspecified, and port 0"

requirements-completed: [P2P-01, P2P-04, P2P-05, P2P-08]

# Metrics
duration: 17min
completed: 2026-02-21
---

# Phase 20 Plan 01: P2P Foundation Summary

**P2P signaling message variants (CandidateOffer/CandidatesDone/DirectConnected/DirectFailed), ICE-like candidate gathering with STUN port binding, and --no-p2p CLI flag**

## Performance

- **Duration:** 17 min
- **Started:** 2026-02-21T15:19:26Z
- **Completed:** 2026-02-21T15:36:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Four new P2P signaling Message variants appended with verified postcard discriminants (35-38)
- candidates.rs module with gather_candidates(), validate_candidate_addr(), encode/decode_socket_addr() and 10 unit tests
- StunClient::discover_from_port() for port-specific STUN binding (critical for hole punching NAT binding consistency)
- --no-p2p flag on all 6 relay-connected CLI command structs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add P2P signaling Message variants and candidate types** - `e232521` (feat)
2. **Task 2: Add STUN port-binding method and --no-p2p CLI flag** - `7a408bd` (feat)

## Files Created/Modified
- `crates/tallow-protocol/src/wire/messages.rs` - Four new P2P signaling variants appended to Message enum
- `crates/tallow-net/src/nat/candidates.rs` - ICE-like candidate gathering, address validation, encode/decode
- `crates/tallow-net/src/nat/stun.rs` - discover_from_port() method and hostname format test
- `crates/tallow-net/src/nat/mod.rs` - Export candidates module, Candidate, CandidateType
- `crates/tallow/src/cli.rs` - --no-p2p flag on SendArgs, ReceiveArgs, ChatArgs, SyncArgs, WatchArgs, ClipArgs

## Decisions Made
- Corrected discriminant values from plan's 36-39 to actual 35-38 (counted 35 existing variants 0-indexed through RoomPeerCount at 34)
- Moved discover_from_port() implementation from Task 2 to Task 1 to resolve compilation dependency (candidates.rs imports it)
- Applied --no-p2p to all 6 structs with proxy/tor flags, not just SendArgs/ReceiveArgs as minimally specified

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved discover_from_port() to Task 1**
- **Found during:** Task 1 (candidates.rs compilation)
- **Issue:** candidates.rs calls StunClient::discover_from_port() which was planned for Task 2, causing compile error
- **Fix:** Added discover_from_port() method to stun.rs as part of Task 1 commit
- **Files modified:** crates/tallow-net/src/nat/stun.rs
- **Verification:** cargo test -p tallow-net -- candidates passes all 10 tests
- **Committed in:** e232521 (Task 1 commit)

**2. [Rule 1 - Bug] Corrected discriminant values in test**
- **Found during:** Task 1 (discriminant counting)
- **Issue:** Plan specified CandidateOffer=36 but actual variant count shows it should be 35 (RoomPeerCount is index 34)
- **Fix:** Set discriminant assertions to 35/36/37/38 instead of plan's 36/37/38/39
- **Files modified:** crates/tallow-protocol/src/wire/messages.rs
- **Verification:** test_discriminant_stability_p2p_variants passes; test_discriminant_stability_chat_end still confirms ChatEnd=28
- **Committed in:** e232521 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None - all tests pass, clippy clean across all three affected crates.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- P2P signaling message types ready for Plan 02 (P2P negotiation module)
- Candidate gathering infrastructure ready for integration with quinn Endpoint
- --no-p2p flag ready for runtime P2P suppression logic
- All existing 598+ tests continue to pass unchanged

---
*Phase: 20-webrtc-p2p-direct*
*Completed: 2026-02-21*
