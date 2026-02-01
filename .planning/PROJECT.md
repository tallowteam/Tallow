# Tallow - Security Fix Project

## What This Is
Fix critical security vulnerabilities in Tallow's Post-Quantum Cryptography (PQC) implementation to make the file-sharing app actually secure.

## Core Problem
The PQC crypto layer has 4 CRITICAL flaws that break all security guarantees:
1. Hash function returns zeros (not actual hashes)
2. Kyber/ML-KEM not actually implemented (only ECDH)
3. Weak key derivation (no HKDF)
4. No key exchange authentication (MITM possible)

## Goals
1. Implement working SHA-256 hash function
2. Integrate actual Kyber (ML-KEM-768) from pqc-kyber package
3. Implement proper HKDF key derivation
4. Add key exchange authentication
5. Fix high-severity issues (buffer validation, type safety)

## Success Criteria
- All crypto tests pass
- File encryption/decryption works end-to-end
- PQC test page demonstrates working hybrid encryption
- No security vulnerabilities in crypto layer

## Constraints
- Must use existing `pqc-kyber` and `@noble/hashes` packages
- Keep existing API surface (don't break existing components)
- Browser-only (no server-side crypto)

## Requirements

### Validated (Existing Working Features)
- ✓ WebRTC P2P file transfer
- ✓ File chunking and progress tracking
- ✓ UI components and styling
- ✓ Local device discovery
- ✓ Friend management

### Active (To Fix)
- [ ] CRYPTO-01: Implement SHA-256 hash function
- [ ] CRYPTO-02: Implement Kyber key generation
- [ ] CRYPTO-03: Implement Kyber encapsulation/decapsulation
- [ ] CRYPTO-04: Implement hybrid key exchange (Kyber + X25519)
- [ ] CRYPTO-05: Implement HKDF key derivation
- [ ] CRYPTO-06: Add key exchange authentication
- [ ] CRYPTO-07: Fix public key serialization
- [ ] CRYPTO-08: Fix ciphertext serialization
- [ ] TRANSFER-01: Fix chunk encryption with proper keys
- [ ] TRANSFER-02: Add proper ACK handling
- [ ] VALIDATE-01: Add input validation
- [ ] VALIDATE-02: Add buffer bounds checking

### Out of Scope
- Production signaling server (separate project)
- Unit test framework setup (separate milestone)
- UI changes (not needed for crypto fix)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use @noble/hashes for SHA-256 | Already installed, audited library | Pending |
| Use pqc-kyber for ML-KEM | Already installed, NIST standard | Pending |
| Keep hybrid approach | Future-proof (classical + PQC) | Pending |

---
*Last updated: 2025-01-17 after initialization*
