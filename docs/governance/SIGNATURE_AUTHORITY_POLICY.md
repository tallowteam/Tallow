# SIGNATURE-AUTHORITY Policy

## Owner
- AGENT 011 - SIGNATURE-AUTHORITY

## Mission
Guarantee all prekeys are signed before publication, prekey rotation occurs every 7 days, old prekeys are revocable, and ML-DSA-65 (or SLH-DSA fallback) is used for quantum-resistant signing.

## Required Invariants
- All prekeys MUST be signed by the identity key before publication.
- Prekey rotation interval: 7 days (PREKEY_ROTATION_INTERVAL_MS).
- Old prekeys MUST be revocable (explicit revocation API).
- ML-DSA-65 is the primary quantum-resistant signature scheme.
- SLH-DSA (SPHINCS+) serves as stateless backup.
- Ed25519 used for classical fallback and hybrid signing.
- Signature verification MUST occur before any prekey is trusted.
- Policy gate must run in CI and release workflows via `npm run verify:signature:authority`.

## Evidence Surface
- `lib/crypto/digital-signatures.ts`
- `lib/crypto/signed-prekeys.ts`
- `lib/crypto/slh-dsa.ts`
- `tests/unit/crypto/signature-authority.test.ts`
- `scripts/verify-signature-authority.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
