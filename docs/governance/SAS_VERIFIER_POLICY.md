# SAS-VERIFIER Policy

## Owner
- AGENT 012 - SAS-VERIFIER

## Mission
Guarantee that Short Authentication Strings (SAS) are always compared out-of-band, the UI makes verification prominent, and any mismatch results in immediate connection termination with a MITM warning.

## Required Invariants
- SAS MUST be compared out-of-band (visual or verbal side-channel).
- UI MUST present SAS comparison prominently (not dismissible without action).
- SAS mismatch = immediate connection termination. No retry allowed.
- Mismatch termination deadline: 100ms or less.
- Minimum SAS entropy: 36 bits (6 emojis from 64-element set).
- Constant-time comparison used for SAS raw bytes.
- SAS mismatch produces a security report for audit logging.
- Policy gate must run in CI and release workflows via `npm run verify:sas:verifier`.

## Evidence Surface
- `lib/crypto/sas.ts`
- `tests/unit/crypto/sas-verifier.test.ts`
- `scripts/verify-sas-verifier.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
