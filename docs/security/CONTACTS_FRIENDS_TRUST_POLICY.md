# Contacts & Friends Trust Policy

Generated: 2026-02-13
Owner: AGENT 099 - Contacts/Friends Agent

## Purpose

Define trust-gating and connection safety behavior for friend-based transfer flows.

## Control Requirements

1. Trusted transfer path requires SAS verification state.
2. Favorites can auto-connect only when online, trusted, and SAS-verified.
3. Block list operations must immediately drop active connections to blocked peers.
4. Guest mode must support one-time transfer authorization without persistent trust.

## Implementation Mapping

- Trust + SAS + guest token authorization:
  - `lib/stores/friends-store.ts`
- Connection drop on block:
  - `lib/stores/friends-store.ts` with `useDeviceStore` disconnect.
- Guest mode control source:
  - `lib/stores/settings-store.ts`

## Verification

- Command: `npm run verify:contacts:friends`
- Evidence: `reports/contacts-friends-agent-*.json` and `reports/contacts-friends-agent-*.md`

## CI/Release Gate

Contacts/friends trust verification is required in:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
