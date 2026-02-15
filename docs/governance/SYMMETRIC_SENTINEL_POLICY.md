# SYMMETRIC-SENTINEL Policy

## Owner
- AGENT 008 - SYMMETRIC-SENTINEL

## Mission
- Enforce authenticated symmetric encryption contracts with 96-bit nonces, nonce non-reuse discipline, and auth-tag validation before plaintext is released.

## Required Invariants
- Every symmetric transfer nonce is 96 bits (`12` bytes).
- Nonces are counter-derived with direction separation (`sender` and `receiver`) and must never be reused.
- Decrypt paths do not expose plaintext if authentication fails.
- Policy gate must run in CI and release workflows via `npm run verify:symmetric:sentinel`.

## Evidence Surface
- `lib/crypto/cipher-selection.ts`
- `lib/crypto/symmetric.ts`
- `tests/unit/crypto/symmetric-sentinel.test.ts`
- `scripts/verify-symmetric-sentinel.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
