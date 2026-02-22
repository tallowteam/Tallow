---
phase: 21-web-ui-browser-client
plan: 02
subsystem: relay, transport
tags: [websocket, axum, cors, browser, dual-transport, relay]

# Dependency graph
requires:
  - phase: 21-web-ui-browser-client (plan 01)
    provides: WASM crate, feature-gated protocol
  - phase: 2
    provides: Relay server, room management, QUIC transport
  - phase: 19
    provides: Multi-peer room support
provides:
  - WebSocket listener on relay server (axum 0.8 + ws)
  - WS-to-QUIC message bridging with length prefix translation
  - CORS headers for cross-origin browser connections
  - Dual-transport relay (QUIC + WebSocket simultaneously)
  - ws_bind_addr config field with CLI override
affects: [21-03, 21-04, 21-05, relay-deployment]

# Tech tracking
tech-stack:
  added: [axum 0.8 (ws feature), tower 0.5, tower-http 0.6 (cors feature)]
  patterns: [dual-transport server, length-prefix bridging, shared RoomManager Arc]

key-files:
  created:
    - crates/tallow-relay/src/websocket.rs
  modified:
    - crates/tallow-relay/src/config.rs
    - crates/tallow-relay/src/main.rs
    - crates/tallow-relay/src/server.rs
    - crates/tallow-relay/Cargo.toml
    - deploy/relay.toml

key-decisions:
  - "axum 0.8 for WebSocket support — already in workspace, mature ws feature, built on tower"
  - "Permissive CORS (allow any origin) — security comes from E2E encryption, not origin checking"
  - "4-byte BE length prefix bridging: WS handler adds prefix on WS->room, strips on room->WS for QUIC interop"
  - "Shared RoomManager Arc between QUIC and WS listeners — both transports use identical room infrastructure"
  - "ws_bind_addr default 0.0.0.0:4434, empty string disables WS support"

patterns-established:
  - "Dual-transport pattern: QUIC on port 4433, WebSocket on port 4434, shared room manager"
  - "Length prefix translation: room channels carry [4-byte len + payload], WS strips/adds prefix at boundary"
  - "Health endpoint at /health for monitoring WS listener availability"

requirements-completed: [WEB-04, WEB-05, WEB-06]

# Metrics
duration: 43min
completed: 2026-02-22
---

# Phase 21 Plan 02: Relay WebSocket Transport Summary

**Dual-transport relay server with axum WebSocket listener, WS-to-QUIC length-prefix bridging, and permissive CORS for browser clients**

## Performance

- **Duration:** 43 min
- **Started:** 2026-02-21T23:39:18Z
- **Completed:** 2026-02-22T00:22:42Z
- **Tasks:** 2
- **Files modified:** 5 (4 modified + 1 created)

## Accomplishments
- WebSocket handler module (766 lines) with full room join, auth, and message bridging for both legacy 2-peer and multi-peer rooms
- Length-prefix translation layer: WS messages get 4-byte BE length prefix added on WS->room path and stripped on room->WS path, enabling seamless QUIC<->WS interoperability
- CORS configured as fully permissive (any origin, any method, any header) since security comes from E2E encryption
- 12 comprehensive tests covering router creation, health endpoint, CORS headers, length prefix roundtrips, password hash extraction, room manager sharing, and room join parsing
- All 31 relay tests pass (19 existing + 12 new), clippy clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Add WebSocket transport to relay** - `13369a3` (feat)
2. **Task 2: Verify tests and update relay config** - `0329282` (test)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `crates/tallow-relay/src/websocket.rs` - Full WebSocket handler: WsState, ws_router(), ws_handler(), handle_ws_client(), legacy/multi room join, bridge functions, length prefix helpers, 12 tests
- `crates/tallow-relay/src/config.rs` - Added ws_bind_addr field with default, validation, serde default
- `crates/tallow-relay/src/main.rs` - Added mod websocket, --ws-addr CLI flag, config override
- `crates/tallow-relay/src/server.rs` - Added WebSocket listener startup alongside QUIC, shared RoomManager Arc
- `crates/tallow-relay/Cargo.toml` - Added axum 0.8 (ws), tower 0.5, tower-http 0.6 (cors), futures deps
- `deploy/relay.toml` - Added ws_bind_addr = "0.0.0.0:4434" example config

## Decisions Made
- **axum 0.8 for WebSocket:** Already in workspace, mature ws feature, integrates with tower middleware stack. No new framework needed.
- **Permissive CORS:** Security comes from E2E encryption (relay never sees plaintext), not origin checking. Restricting origins would break legitimate deployments.
- **Length prefix bridging:** Room channels carry 4-byte BE length-prefixed data (QUIC format). WS handler adds prefix on inbound and strips on outbound, making both transports transparent to room logic.
- **Shared RoomManager Arc:** Both QUIC and WS listeners share the same RoomManager via Arc, so browser and CLI peers can join the same rooms.
- **Empty string disables WS:** Setting ws_bind_addr to "" skips WebSocket listener startup, preserving backward compatibility for relay operators who don't want browser support.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed strip_length_prefix boundary condition**
- **Found during:** Task 1
- **Issue:** `strip_length_prefix` used `data.len() > 4` but empty data prefixed as `[0,0,0,0]` is exactly 4 bytes, causing off-by-one
- **Fix:** Changed to `data.len() >= 4` in bridge functions and tests
- **Files modified:** crates/tallow-relay/src/websocket.rs
- **Verification:** test_length_prefix_empty_data passes
- **Committed in:** 13369a3 (Task 1 commit)

**2. [Rule 1 - Bug] Used non-existent Message::Error variant**
- **Found during:** Task 1
- **Issue:** Plan referenced `Message::Error` but the enum has no Error variant (40 variants, none named Error)
- **Fix:** Used `Message::HandshakeFailed { reason: "authentication failed".to_string() }` which exists in the enum
- **Files modified:** crates/tallow-relay/src/websocket.rs
- **Verification:** Compiles and clippy clean
- **Committed in:** 13369a3 (Task 1 commit)

**3. [Rule 3 - Blocking] axum 0.8 WsMsg::Binary type change**
- **Found during:** Task 1
- **Issue:** axum 0.8's `WsMsg::Binary` takes `bytes::Bytes` not `Vec<u8>`, causing type inference failures with `.into()`
- **Fix:** Added explicit `use bytes::Bytes;` and replaced `.into()` with `Bytes::from()` for all Binary message construction
- **Files modified:** crates/tallow-relay/src/websocket.rs
- **Verification:** Compiles without warnings
- **Committed in:** 13369a3 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and compilation. No scope creep.

## Issues Encountered
- Linter repeatedly reverted changes to Cargo.toml, main.rs, server.rs, and config.rs to pre-modification state. Resolved by using Write tool for complete file rewrites instead of incremental edits.
- hickory-resolver v0.25 API change (builder_tokio -> builder_with_config) in doh.rs was auto-fixed by the linter during compilation. Not a deviation since it was in an unrelated file and auto-resolved.

## User Setup Required
None - no external service configuration required. Relay operators can optionally add `ws_bind_addr` to their relay.toml, but it defaults to "0.0.0.0:4434" automatically.

## Next Phase Readiness
- WebSocket transport is ready for browser clients to connect (Plan 21-03)
- Browser JS/WASM can connect via `new WebSocket("ws://relay:4434")`, join rooms, and exchange postcard-encoded messages
- CORS is configured, health endpoint is available at /health
- Relay deployment will need updating to include the new binary (separate from this plan)

## Self-Check: PASSED

All files verified present:
- FOUND: crates/tallow-relay/src/websocket.rs
- FOUND: deploy/relay.toml
- FOUND: .planning/phases/21-web-ui-browser-client/21-02-SUMMARY.md
- FOUND: commit 13369a3
- FOUND: commit 0329282

---
*Phase: 21-web-ui-browser-client*
*Completed: 2026-02-22*
