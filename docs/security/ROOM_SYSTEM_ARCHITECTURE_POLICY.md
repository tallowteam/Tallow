# Room System Architecture Policy

Generated: 2026-02-13
Owner: AGENT 098 - Room System Architect

## Purpose

Define hard invariants for room lifecycle, membership control, and room-message encryption.

## Control Requirements

1. Rooms expire by default after 24 hours unless explicitly configured otherwise.
2. Maximum room size is capped at 50 members.
3. Room owner/admin must be able to remove members.
4. Group room encryption must use sender-key semantics (per-sender derived room keys).

## Implementation Mapping

- Default expiry + configurable TTL + max-members enforcement:
  - `app/api/rooms/route.ts`
- Owner/admin member removal endpoint behavior:
  - `app/api/rooms/route.ts` (`DELETE` with `memberId`)
- Sender-key group encryption:
  - `lib/rooms/room-crypto.ts` (`deriveRoomSenderKey`)
  - `lib/rooms/transfer-room-manager.ts` (`sid` sender-key routing)

## Verification

- Command: `npm run verify:room-system:architect`
- Evidence: `reports/room-system-architect-*.json` and `reports/room-system-architect-*.md`

## CI/Release Gate

Room-system verification is required in:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
