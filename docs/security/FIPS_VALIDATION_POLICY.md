# FIPS Compliance Validation Policy

Date: 2026-02-12
Owner: `002` (CIPHER) with release co-signoff from `019` (CRYPTO-AUDITOR)

## Scope

This policy defines mandatory controls for FIPS 140-3 aligned release verification in Tallow.
No release is eligible for production unless all controls below pass and evidence is attached in `release-signoffs`.

## Required Controls

1. Runtime FIPS mode flag:
- `NEXT_PUBLIC_TALLOW_FIPS_MODE` must gate non-approved algorithms in transfer paths.
- When `NEXT_PUBLIC_TALLOW_FIPS_MODE=true`, only approved algorithm paths are allowed.

2. Approved algorithms:
- AEAD encryption in FIPS mode must use `AES-GCM`.
- Hash and KDF evidence for FIPS mode must use `SHA-256` based derivation or verification controls.
- Non-FIPS algorithms must be rejected in FIPS mode.

3. Release signoff enforcement:
- `release-signoffs/<tag>.json` is required for each tagged release.
- Security approvers `002` and `019` must be `approved`.
- Evidence paths declared in `release-signoffs` must exist.

4. Evidence publication:
- A release evidence file must exist at `reports/security/fips-validation-<tag>.md`.
- Machine-readable verifier output must exist under `reports/fips-compliance-*.json`.

## Verification Command

Run:

```bash
npm run verify:fips:compliance -- v0.1.0
```

Expected outcome:
- Exit code `0`
- Generated reports:
  - `reports/fips-compliance-<timestamp>.json`
  - `reports/fips-compliance-<timestamp>.md`

## Failure Policy

- Any failed control blocks release.
- FIPS control failures must be fixed before release promotion.
