# HASH-ORACLE Policy

## Owner
- AGENT 009 - HASH-ORACLE

## Mission
- Ensure integrity of every file transferred by hashing every chunk into a Merkle tree and verifying full-file root hash on completion.
- Provide key derivation for the entire crypto stack via HKDF-BLAKE3 with mandatory domain separation.

## Required Invariants
- Every chunk is hashed with BLAKE3 -- no skipping, no sampling.
- Full file hash (Merkle root) is verified on transfer completion.
- All KDF calls use an explicit domain separation context string from the canonical registry.
- Domain separation strings are unique per context -- no collisions.
- BLAKE3 is the preferred hash; SHA3-256 used only when BLAKE3 is unavailable.
- Policy gate must run in CI and release workflows via `npm run verify:hash:oracle`.

## HKDF Domain Separation Registry (Canonical)
| Context                | Info String                      |
|------------------------|----------------------------------|
| Hybrid key exchange    | `tallow-v3-hybrid-kex`           |
| Ratchet root key       | `tallow-v3-root-key`             |
| Chain key derivation   | `tallow-v3-chain-key`            |
| Message key derivation | `tallow-v3-message-key`          |
| Nonce seed             | `tallow-v3-nonce-seed`           |
| IndexedDB encryption   | `tallow-v3-storage-key`          |

## Evidence Surface
- `lib/crypto/hashing.ts`
- `lib/crypto/integrity.ts`
- `lib/crypto/blake3.ts`
- `tests/unit/crypto/hash-oracle.test.ts`
- `scripts/verify-hash-oracle.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
