# Crypto Test Vector Policy

## Scope

This policy governs release-blocking vector validation for cryptographic primitives used in Tallow transfer security paths.

## Mandatory Vector Suites

- `tests/unit/crypto/blake3.test.ts`
  - Must include official BLAKE3 digest vectors for `""`, `"abc"`, and `"hello world"`.
- `tests/unit/crypto/sha3.test.ts`
  - Must include FIPS 202 / NIST SHA3-256 vectors, including `""` and `"abc"`.

## Release Gate Requirements

- `npm run verify:crypto:test-vectors` must pass.
- The vector unit suites must execute in CI and release workflows.
- Any vector mismatch is a hard failure and blocks merge/release.
- No skipped vector tests are allowed in gated suites.

## Evidence Artifacts

- Verifier output is written to:
  - `reports/crypto-test-vectors-*.json`
  - `reports/crypto-test-vectors-*.md`
  - fallback: `verification-reports/crypto-test-vectors-*.{json,md}` when `reports/` is not writable.
