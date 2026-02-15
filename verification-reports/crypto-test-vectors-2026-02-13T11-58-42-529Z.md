# Crypto Test Vector Verification

Generated: 2026-02-13T11:58:42.527Z

## Checks
- [PASS] Policy, test, and workflow files exist
- [PASS] BLAKE3 official vectors are pinned in unit tests
- [PASS] SHA3 FIPS/NIST vectors are pinned in unit tests
- [PASS] Vector suites do not use skipped tests
- [PASS] Package scripts expose crypto vector gates
- [PASS] CI and release workflows execute crypto vector verifier
- [FAIL] Official crypto vector suites execute and pass

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

### CI and release workflows execute crypto vector verifier
- .github/workflows/ci.yml runs npm run verify:crypto:test-vectors
- .github/workflows/release.yml runs npm run verify:crypto:test-vectors

### Official crypto vector suites execute and pass
- failed to execute vitest: spawnSync npx.cmd EINVAL

## Summary
- Overall: FAIL

