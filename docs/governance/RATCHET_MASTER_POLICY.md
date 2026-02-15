# RATCHET-MASTER Policy

## Owner
- AGENT 007 - RATCHET-MASTER

## Mission
- Enforce deterministic ratchet discipline for forward secrecy: periodic DH cadence, sparse PQ cadence, out-of-order message handling, and secure key destruction.

## Required Invariants
- Triple ratchet send path performs DH ratchet at least every `1000` messages when peer DH key is known.
- Out-of-order message handling is supported through skipped message-key cache with a bounded cap.
- Sparse PQ ratchet epoch cadence is `100` messages per epoch threshold.
- Old key material is wiped via secure delete paths during ratchet transitions.
- Policy gate must run in CI and release workflows via `npm run verify:ratchet:master`.

## Evidence Surface
- `lib/crypto/triple-ratchet.ts`
- `lib/crypto/sparse-pq-ratchet.ts`
- `tests/unit/crypto/ratchet-master.test.ts`
- `scripts/verify-ratchet-master.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
