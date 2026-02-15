# TIMING-PHANTOM Policy

## Owner
- AGENT 013 - TIMING-PHANTOM

## Mission
Guarantee that EVERY comparison of secret material uses constant-time comparison functions, and NO early returns occur on secret-dependent branches.

## Required Invariants
- All secret comparisons MUST use `timingSafeEqual()`, `constantTimeEqual()`, or equivalent XOR-accumulator pattern.
- NO `===`, `==`, or `!==` operators on secret byte arrays.
- NO early returns in functions that process secret material.
- Length comparison MUST NOT leak via timing (pad to same length before comparing).
- HMAC verification MUST use `timingSafeHMACVerify()`.
- Token comparison MUST use `timingSafeTokenCompare()`.
- The `timing-audit.ts` module provides static analysis helpers to detect violations.
- Policy gate must run in CI and release workflows via `npm run verify:timing:phantom`.

## Evidence Surface
- `lib/security/timing-safe.ts`
- `lib/crypto/hashing.ts` (constantTimeEqual re-export)
- `lib/crypto/timing-audit.ts`
- `tests/unit/crypto/timing-phantom.test.ts`
- `scripts/verify-timing-phantom.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
