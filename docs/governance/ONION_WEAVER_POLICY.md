# ONION-WEAVER Policy

## Owner
- AGENT 015 - ONION-WEAVER

## Mission
Guarantee that privacy mode enforces a minimum of 3 relay hops for onion routing and circuits are rotated every 10 minutes.

## Required Invariants
- Privacy mode = minimum 3 hops (MIN_HOPS = 3).
- Circuit rotation interval = 10 minutes (CIRCUIT_ROTATION_MS = 600000).
- Relay selection MUST use CSPRNG-based shuffling (Fisher-Yates with crypto.getRandomValues).
- Circuits MUST be torn down and rebuilt on rotation.
- Expired circuits MUST NOT be reused.
- Circuit IDs are 16 random bytes (128-bit entropy).
- Policy gate must run in CI and release workflows via `npm run verify:onion:weaver`.

## Evidence Surface
- `lib/privacy/onion-routing.ts`
- `tests/unit/privacy/onion-weaver.test.ts`
- `scripts/verify-onion-weaver.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
