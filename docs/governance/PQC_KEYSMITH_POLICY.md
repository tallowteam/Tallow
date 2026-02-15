# PQC-KEYSMITH Policy

## Owner
- AGENT 006 - PQC-KEYSMITH

## Mission
- Guarantee post-quantum key generation and shared-secret consumption use CSPRNG entropy, BLAKE3 domain separation, and explicit key-material zeroization for ephemeral secrets.

## Required Invariants
- Hybrid key generation uses CSPRNG entropy (`crypto.getRandomValues`) for X25519 private keys.
- Session encryption/auth/session-id keys are derived from shared secrets with distinct BLAKE3 domain contexts.
- Ephemeral key material and intermediate shared-secret buffers are zeroized after use.
- Policy gate must run in CI and release workflows via `npm run verify:pqc:keysmith`.

## Evidence Surface
- `lib/crypto/pqc-crypto.ts`
- `tests/unit/crypto/pqc-keysmith.test.ts`
- `scripts/verify-pqc-keysmith.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
