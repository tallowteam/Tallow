# PASSWORD-FORTRESS Policy

## Owner
- AGENT 010 - PASSWORD-FORTRESS

## Mission
Guarantee that all password-based key derivation uses Argon2id with 600K+ equivalent iterations (or 64 MiB memory cost), passwords are NEVER transmitted, PAKE protocols are enforced per transport context (CPace for CLI, OPAQUE for web), and salts are at least 16 bytes from CSPRNG.

## Required Invariants
- Argon2id memory cost >= 64 MiB (65536 KiB), timeCost >= 3, parallelism >= 4.
- PBKDF2 fallback iterations >= 600,000 (OWASP 2023 floor).
- Passwords NEVER transmitted in any form. Only PAKE protocols used for authentication.
- CLI transport uses CPace (balanced PAKE); web transport uses OPAQUE (asymmetric PAKE).
- Salt: >= 16 bytes, sourced from CSPRNG, unique per derivation.
- Output key length: >= 32 bytes (256-bit for AES-256).
- Policy gate must run in CI and release workflows via `npm run verify:password:fortress`.

## Evidence Surface
- `lib/crypto/password.ts`
- `lib/crypto/argon2-browser.ts`
- `lib/crypto/pake.ts`
- `tests/unit/crypto/password-fortress.test.ts`
- `scripts/verify-password-fortress.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
