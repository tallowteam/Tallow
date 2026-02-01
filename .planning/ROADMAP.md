# Tallow Security Fix - Roadmap

## Overview
3 phases to fix all critical and high-severity crypto issues.

---

## Phase 1: Core Crypto Fix
**Goal:** Fix the fundamental crypto primitives (hash, Kyber, HKDF)

**Requirements:** CRYPTO-01, CRYPTO-02, CRYPTO-03, CRYPTO-04, CRYPTO-05, CRYPTO-06, SERIAL-01, SERIAL-02, SERIAL-03

**Success Criteria:**
1. `pqCrypto.hash()` returns actual SHA-256 digest
2. `pqCrypto.generateHybridKeypair()` produces Kyber + X25519 keys
3. `pqCrypto.encapsulate()` works with hybrid keys
4. `pqCrypto.decapsulate()` recovers matching shared secret
5. `pqCrypto.deriveSessionKeys()` uses proper HKDF
6. Key serialization/deserialization round-trips correctly

**Files to modify:**
- `lib/crypto/pqc-crypto.ts` (main changes)

---

## Phase 2: File Encryption Fix
**Goal:** Fix file encryption to use proper crypto

**Requirements:** CRYPTO-07, FILE-01, FILE-02, FILE-03, FILE-04, VALID-01, VALID-02, VALID-03, SERIAL-04

**Success Criteria:**
1. File encryption uses properly derived session keys
2. Per-chunk hashes are computed and verified
3. Full file hash verification works
4. Encrypt → Decrypt produces identical file
5. Input validation prevents invalid operations

**Files to modify:**
- `lib/crypto/file-encryption-pqc.ts`
- `lib/crypto/pqc-crypto.ts` (add auth)

---

## Phase 3: Transfer Integration
**Goal:** Integrate fixed crypto into transfer manager

**Requirements:** XFER-01, XFER-02, XFER-03

**Success Criteria:**
1. PQC transfer manager uses fixed crypto layer
2. Key exchange completes successfully
3. File transfer works end-to-end with PQC encryption
4. PQC test page demonstrates working transfer

**Files to modify:**
- `lib/transfer/pqc-transfer-manager.ts`
- `lib/hooks/use-pqc-transfer.ts`
- `app/pqc-test/page.tsx` (verify)

---

## Phase Summary

| # | Phase | Requirements | Status |
|---|-------|--------------|--------|
| 1 | Core Crypto Fix | CRYPTO-01 to CRYPTO-06, SERIAL-01 to SERIAL-03 | Not Started |
| 2 | File Encryption Fix | CRYPTO-07, FILE-01 to FILE-04, VALID-01 to VALID-03, SERIAL-04 | Not Started |
| 3 | Transfer Integration | XFER-01 to XFER-03 | Not Started |

---

## Execution Order
1. `/gsd:execute-phase 1` - Fix core crypto
2. `/gsd:execute-phase 2` - Fix file encryption
3. `/gsd:execute-phase 3` - Integrate and test
