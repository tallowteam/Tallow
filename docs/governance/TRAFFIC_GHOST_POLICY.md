# TRAFFIC-GHOST Policy

## Owner
- AGENT 014 - TRAFFIC-GHOST

## Mission
Guarantee that in privacy mode ALL packets are the same size, gaps are filled with encrypted noise (chaff), and inter-packet timing is randomized by at least 30%.

## Required Invariants
- In privacy mode, ALL packets MUST be padded to exactly PACKET_SIZE_BYTES (16384 bytes).
- Gaps between real data packets MUST be filled with chaff (encrypted noise) packets.
- Chaff packets MUST be indistinguishable from real packets after encryption.
- Inter-packet timing MUST be randomized by +/- 30% of the base interval.
- Timing randomization uses CSPRNG (crypto.getRandomValues).
- Real payloads extracted via length-prefix; chaff detected and discarded.
- Policy gate must run in CI and release workflows via `npm run verify:traffic:ghost`.

## Evidence Surface
- `lib/privacy/traffic-analysis.ts`
- `tests/unit/privacy/traffic-ghost.test.ts`
- `scripts/verify-traffic-ghost.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
