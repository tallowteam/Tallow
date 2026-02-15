# Crypto Test Vector Verification

Generated: 2026-02-13T12:04:14.352Z

## Checks
- [PASS] Policy, test, and workflow files exist
- [PASS] BLAKE3 official vectors are pinned in unit tests
- [PASS] SHA3 FIPS/NIST vectors are pinned in unit tests
- [PASS] Vector suites do not use skipped tests
- [PASS] Package scripts expose crypto vector gates
- [PASS] CI and release workflows execute crypto vector gates

### Policy, test, and workflow files exist
- all required files for crypto vector enforcement are present

### BLAKE3 official vectors are pinned in unit tests
- official BLAKE3 vectors present in tests/unit/crypto/blake3.test.ts

### SHA3 FIPS/NIST vectors are pinned in unit tests
- FIPS/NIST SHA3 vectors present in tests/unit/crypto/sha3.test.ts

### Vector suites do not use skipped tests
- no skip markers detected in required vector suites

### Package scripts expose crypto vector gates
- test:crypto: vitest run tests/unit/crypto
- verify:crypto:test-vectors: node scripts/verify-crypto-test-vectors.js

### CI and release workflows execute crypto vector gates
- .github/workflows/ci.yml runs npm run verify:crypto:test-vectors
- .github/workflows/ci.yml runs npm run test:crypto -- tests/unit/crypto/blake3.test.ts tests/unit/crypto/sha3.test.ts
- .github/workflows/release.yml runs npm run verify:crypto:test-vectors
- .github/workflows/release.yml runs npm run test:crypto -- tests/unit/crypto/blake3.test.ts tests/unit/crypto/sha3.test.ts

## Summary
- Overall: PASS

