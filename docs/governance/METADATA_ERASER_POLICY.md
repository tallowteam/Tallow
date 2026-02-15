# METADATA-ERASER Policy

## Owner
- AGENT 016 - METADATA-ERASER

## Mission
Guarantee ZERO metadata survives file transfer and original filenames are encrypted separately so receivers see only what the sender explicitly allows.

## Required Invariants
- ZERO metadata survives transfer: EXIF, XMP, GPS, camera info, timestamps, author all stripped.
- Original filename encrypted with AES-GCM using the session key.
- Transfer filename is random hex (32 chars = 128 bits entropy).
- Document metadata (PDF author, revision history, software) stripped.
- File timestamps normalized to epoch (1970-01-01T00:00:00.000Z).
- Files padded to nearest power-of-2 boundary to resist size-based fingerprinting.
- Filename encryption/decryption is symmetric (AES-GCM with 12-byte IV).
- Policy gate must run in CI and release workflows via `npm run verify:metadata:eraser`.

## Evidence Surface
- `lib/privacy/metadata-eraser.ts`
- `lib/privacy/metadata-stripper.ts`
- `lib/privacy/filename-encryption.ts`
- `tests/unit/privacy/metadata-eraser.test.ts`
- `scripts/verify-metadata-eraser.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
