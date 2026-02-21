---
phase: 20-webrtc-p2p-direct
verified: 2026-02-21T17:00:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "Requirement IDs P2P-01 through P2P-08 are traceable in REQUIREMENTS.md"
    status: failed
    reason: "P2P-01..P2P-08 appear only in PLAN frontmatter — they are not defined or cross-referenced anywhere in REQUIREMENTS.md. The Traceability table has no entry for any P2P-xx ID. REQUIREMENTS.md has v2 'Advanced Networking' entries (ANET-01, ANET-02, ANET-03) that semantically overlap with this phase but are deferred and not claimed."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "P2P-01 through P2P-08 absent from all requirement blocks and the Traceability table. ANET-01 (UDP hole punching), ANET-02 (TURN relay fallback) are listed as v2/deferred requirements — this phase implements work that semantically satisfies them but they are not cross-referenced."
    missing:
      - "Add P2P-01..P2P-08 to REQUIREMENTS.md under a new 'P2P Direct (P2P)' section, OR cross-reference the implemented phase-20 work against ANET-01/ANET-02 and mark them as satisfied in Phase 20"
      - "Add P2P-01..P2P-08 rows to the Traceability table mapping them to Phase 20"
human_verification:
  - test: "Run tallow send and tallow receive end-to-end on two machines in the same LAN"
    expected: "After KEM handshake, both peers attempt P2P upgrade — user sees 'Attempting P2P direct connection...' and then either 'Upgraded to direct P2P connection (addr)' or 'P2P direct connection unavailable (...), continuing via relay'"
    why_human: "Cannot verify runtime behavior programmatically — requires two actual processes with QUIC connectivity"
  - test: "Run tallow send --no-p2p on a machine with --proxy active"
    expected: "No 'Attempting P2P direct connection' message appears, transfer proceeds immediately via relay, relay sees full data traffic"
    why_human: "Requires runtime execution to confirm suppression path takes effect and no candidate gathering occurs"
  - test: "Run tallow send against a symmetric NAT (e.g., a mobile hotspot)"
    expected: "Peer reports 'P2P direct connection unavailable (symmetric NAT detected), continuing via relay' within the 10-second timeout"
    why_human: "Requires actual symmetric NAT environment — cannot simulate programmatically"
---

# Phase 20: WebRTC P2P Direct Verification Report

**Phase Goal:** Direct peer-to-peer QUIC connections via NAT hole punching coordinated through the existing relay — eliminating relay forwarding overhead for ~70% of network configurations, with automatic relay fallback when direct connection fails.
**Verified:** 2026-02-21T17:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | After KEM handshake via relay, peers exchange ICE candidates (STUN-discovered public addresses) and attempt QUIC hole punching | VERIFIED | `p2p.rs::negotiate_inner()` gathers candidates via `gather_candidates(local_port)`, sends them via `send_candidate_offer()`, receives remote candidates via `receive_remote_candidates()`, then calls `attempt_as_client()`/`attempt_as_server()` |
| 2 | On successful hole punch, file transfer proceeds directly between peers without relay forwarding — verified by checking relay sees no data traffic after upgrade | VERIFIED (partial) | `send.rs` and `receive.rs` both execute `channel = ConnectionResult::Direct(direct_conn)` on success. Channel variable is reassigned — subsequent I/O uses direct QUIC. Cannot verify relay receives no data without runtime execution (see human_verification) |
| 3 | When hole punching fails (symmetric NAT, firewall), transfer falls back to relay transparently with a user-visible message | VERIFIED | `negotiate_inner()` returns `NegotiationResult::FallbackToRelay(reason)` for symmetric NAT, timeout, no candidates, validation failures. Both `send.rs` and `receive.rs` emit `"P2P direct connection unavailable (...), continuing via relay"` on fallback |
| 4 | `--no-p2p` flag disables hole punching (always use relay) for privacy-sensitive users | VERIFIED | `--no-p2p` is present on `SendArgs`, `ReceiveArgs`, `ChatArgs`, `SyncArgs`, `WatchArgs`, `ClipArgs`. Both `send.rs` and `receive.rs` guard with `!args.no_p2p`. Defense-in-depth guard also inside `negotiate_p2p()` itself |
| 5 | P2P mode is automatically disabled when `--tor` or `--proxy` is active to prevent IP leaks | VERIFIED | Guard condition `proxy_config.is_none() && !args.no_p2p` in both commands. When proxy is active, `proxy_config.is_some()` evaluates true, P2P block is skipped entirely |

**Score: 4/5 truths fully verified** (Truth 2 is verified at code level; runtime relay-bypass behavior needs human confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `crates/tallow-protocol/src/wire/messages.rs` | P2P signaling message variants appended to Message enum | VERIFIED | `CandidateOffer`, `CandidatesDone`, `DirectConnected`, `DirectFailed` appended after `RoomPeerCount` (Phase 19 last variant). Discriminants 35-38. Full round-trip tests and stability tests present. |
| `crates/tallow-net/src/nat/candidates.rs` | Candidate gathering (host, STUN, address validation) | VERIFIED | File exists (366 lines). Contains `gather_candidates()`, `validate_candidate_addr()`, `encode_socket_addr()`, `decode_socket_addr()`, `CandidateType` enum, `Candidate` struct. 25 unit tests. |
| `crates/tallow-net/src/nat/stun.rs` | STUN discovery from a specific local port | VERIFIED | `discover_from_port()` method binds UDP socket to `0.0.0.0:local_port` and sends STUN Binding Request from that port |
| `crates/tallow/src/cli.rs` | `--no-p2p` CLI flag on SendArgs and ReceiveArgs | VERIFIED | Flag present on 6 command structs: `SendArgs`, `ReceiveArgs`, `ChatArgs`, `SyncArgs`, `WatchArgs`, and `ClipArgs` (inner receive variant) |
| `crates/tallow-net/src/transport/p2p.rs` | P2P negotiation state machine | VERIFIED | File exists (772 lines). Contains `negotiate_p2p()`, `NegotiationResult`, candidate exchange, hole punch with 5-second per-candidate timeout, 10-second overall timeout, 13 tests |
| `crates/tallow/src/commands/send.rs` | P2P upgrade attempt after KEM handshake | VERIFIED | P2P upgrade block at lines 545-600, after handshake complete, before FileOffer send. `is_initiator=true` (sender = QUIC client role). Channel swap on success. |
| `crates/tallow/src/commands/receive.rs` | P2P upgrade attempt after KEM handshake | VERIFIED | P2P upgrade block at lines 313-368, after handshake complete, before FileOffer receive. `is_initiator=false` (receiver = QUIC server role). Channel swap on success. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `candidates.rs` | `stun.rs` | `StunClient::discover_from_port()` | VERIFIED | Line 52: `client.discover_from_port(local_port).await` — STUN binds to the same port as the QUIC endpoint |
| `nat/mod.rs` | `candidates.rs` | `pub mod candidates` | VERIFIED | `mod.rs` line 3: `pub mod candidates;`, line 10: `pub use candidates::{Candidate, CandidateType};` |
| `transport/mod.rs` | `p2p.rs` | `pub mod p2p; pub use p2p::{negotiate_p2p, NegotiationResult}` | VERIFIED | `mod.rs` lines 15+33: `pub mod p2p;` and `pub use p2p::{negotiate_p2p, NegotiationResult};` |
| `p2p.rs` | `candidates.rs` | `gather_candidates()` | VERIFIED | `p2p.rs` line 21: `use crate::nat::candidates::{..., gather_candidates, ...}`. Called at line 153. |
| `p2p.rs` | `direct.rs` | `DirectListener::connect_to()/accept_peer()` | VERIFIED | `p2p.rs` line 27: `use crate::transport::direct::{DirectConnection, DirectListener};`. Used at lines 146, 199, 406, 421. `connect_to()` method exists in `direct.rs`. |
| `send.rs` | `p2p.rs` | `negotiate_p2p()` called after handshake | VERIFIED | `send.rs` line 556: `tallow_net::transport::negotiate_p2p(&mut channel, true, suppress_p2p).await` |
| `receive.rs` | `p2p.rs` | `negotiate_p2p()` called after handshake | VERIFIED | `receive.rs` line 324: `tallow_net::transport::negotiate_p2p(&mut channel, false, suppress_p2p).await` |

### Requirements Coverage

| Requirement ID | Source Plan(s) | Description | Status | Evidence |
|----------------|---------------|-------------|--------|---------|
| P2P-01 | 20-01, 20-03 | P2P signaling wire protocol variants | SATISFIED | `CandidateOffer`/`CandidatesDone`/`DirectConnected`/`DirectFailed` in `messages.rs` with discriminant stability tests |
| P2P-02 | 20-02, 20-03 | P2P negotiation state machine | SATISFIED | `negotiate_p2p()` in `p2p.rs` with complete candidate exchange and hole punch logic |
| P2P-03 | 20-02, 20-03 | Relay fallback when hole punch fails | SATISFIED | `NegotiationResult::FallbackToRelay` path wired in both `send.rs` and `receive.rs` |
| P2P-04 | 20-01, 20-03 | Candidate gathering (host + STUN) | SATISFIED | `gather_candidates()` in `candidates.rs` with host IP and STUN server-reflexive discovery |
| P2P-05 | 20-01, 20-03 | STUN port-binding for NAT binding consistency | SATISFIED | `discover_from_port()` in `stun.rs` binds to specific local port |
| P2P-06 | 20-02, 20-03 | `--no-p2p` flag suppression | SATISFIED | Flag on all 6 relay-connected CLI structs, guarded in both commands and inside `negotiate_p2p()` |
| P2P-07 | 20-02, 20-03 | Proxy/Tor suppression to prevent IP leaks | SATISFIED | `proxy_config.is_none()` guard in both commands prevents P2P when proxy is active |
| P2P-08 | 20-01, 20-03 | Candidate address validation | SATISFIED | `validate_candidate_addr()` rejects loopback, link-local, broadcast, multicast, unspecified, port 0 |

**ORPHANED REQUIREMENTS (in REQUIREMENTS.md but not claimed by Phase 20 plans):**

| Requirement ID | Location in REQUIREMENTS.md | Semantic Overlap | Status |
|----------------|----------------------------|------------------|--------|
| `ANET-01` | v2 deferred — "UDP hole punching for direct P2P" | Phase 20 implements exactly this | ORPHANED — not linked to Phase 20 in REQUIREMENTS.md |
| `ANET-02` | v2 deferred — "TURN relay fallback" | Phase 20 implements relay fallback (not TURN, but functionally equivalent) | ORPHANED — partial semantic overlap |

**Critical finding:** P2P-01 through P2P-08 are **not defined in REQUIREMENTS.md**. They appear only in the PLAN frontmatter. The Traceability table in REQUIREMENTS.md ends at DISC-03 (Phase 5) with no Phase 20 entries. The work done is real and substantive, but the requirement traceability is broken — these IDs exist in a planning vacuum.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|---------|--------|
| None detected | — | — | — | — |

All non-test code in `p2p.rs` and `candidates.rs` uses `Result<T, E>` returns with `?` or `.map_err()`. No `.unwrap()` outside `#[cfg(test)]`. No `println!` in library code. No `TODO`/`FIXME`/placeholder comments. All public items have `///` doc comments.

**Notable architectural deviation (documented, not a defect):** The plan specified using `TallowCodec` and `tallow-protocol::Message` for candidate exchange in `p2p.rs`. The implementation uses a lightweight binary tag protocol (`TAG_CANDIDATE_OFFER=0x01`, `TAG_CANDIDATES_DONE=0x02`, etc.) instead, because `tallow-net` cannot depend on `tallow-protocol` (circular dependency). This deviation is documented in the SUMMARY and is architecturally correct. The `Message::CandidateOffer/CandidatesDone/DirectConnected/DirectFailed` variants still exist in `messages.rs` for relay-level routing awareness.

### Human Verification Required

#### 1. Direct P2P Connection Success Path

**Test:** Run `tallow send <file>` on Machine A and `tallow receive <code>` on Machine B, both on the same LAN without `--no-p2p` or `--proxy`.
**Expected:** After "Secure session established", both sides print "Attempting P2P direct connection..." followed by "Upgraded to direct P2P connection (addr)". The relay sees no chunk data traffic after the upgrade message.
**Why human:** Requires two running processes with QUIC connectivity; relay traffic inspection is not automated.

#### 2. P2P Suppression with --no-p2p

**Test:** Run `tallow send --no-p2p <file>` and `tallow receive --no-p2p <code>`.
**Expected:** No "Attempting P2P direct connection" message. Transfer proceeds immediately via relay. The relay sees all chunk traffic.
**Why human:** Requires runtime execution to confirm the guard takes effect at the right point.

#### 3. Symmetric NAT Fallback

**Test:** Run the transfer from behind a symmetric NAT (e.g., a mobile hotspot).
**Expected:** Both peers fall back to relay within 10 seconds. User sees "P2P direct connection unavailable (symmetric NAT detected), continuing via relay". Transfer completes normally.
**Why human:** Requires actual symmetric NAT — cannot simulate programmatically.

---

## Gaps Summary

### Gap 1: Requirement IDs P2P-01..P2P-08 are not in REQUIREMENTS.md

This is a **documentation gap, not an implementation gap**. The actual P2P implementation is complete and substantive: all 7 artifacts exist, all 7 key links are wired, 6 commits are verified in git, 30 new tests pass, the workspace compiles clean.

However, the requirement IDs declared in PLAN frontmatter (`P2P-01` through `P2P-08`) do not appear anywhere in REQUIREMENTS.md. The Traceability table has no Phase 20 entries. The semantically equivalent v2 requirements (`ANET-01`, `ANET-02`) remain marked as deferred with no cross-reference to Phase 20.

**Fix required:** Either (a) add `P2P-01..P2P-08` as a new requirement block to REQUIREMENTS.md with a Traceability row mapping them to Phase 20, or (b) reclassify `ANET-01` and `ANET-02` from v2-deferred to v1-done and add Phase 20 entries to the Traceability table.

This gap does not affect the working software but breaks requirement traceability for the project.

---

_Verified: 2026-02-21T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
