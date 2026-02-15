# Unit Test Sniper Verification

Generated: 2026-02-13T21:44:41.427Z

## Checks
- [PASS] Policy, test, hook, config, and workflow files exist
- [PASS] Crypto vector suites contain official NIST/FIPS and BLAKE3 vectors
- [PASS] Crypto vector suites do not include skipped tests
- [PASS] Hook lifecycle tests and runtime cleanup are enforced
- [PASS] Vitest coverage thresholds enforce 90/90/90/80 floor
- [PASS] Unit-test-sniper gate is wired in package scripts and workflows

### Policy, test, hook, config, and workflow files exist
- all required files for AGENT 076 verification are present

### Crypto vector suites contain official NIST/FIPS and BLAKE3 vectors
- required official vectors found in tests/unit/crypto/blake3.test.ts and tests/unit/crypto/sha3.test.ts

### Crypto vector suites do not include skipped tests
- no skip markers detected in required crypto vector suites

### Hook lifecycle tests and runtime cleanup are enforced
- hook lifecycle suite covers mount/unmount for file-transfer/onboarding/notifications and runtime timeout cleanup exists

### Vitest coverage thresholds enforce 90/90/90/80 floor
- vitest.config.ts includes lines/statements/functions=90 and branches=80 thresholds

### Unit-test-sniper gate is wired in package scripts and workflows
- verify:unit:test-sniper: node scripts/verify-unit-test-sniper.js
- .github/workflows/ci.yml runs unit-test-sniper verification
- .github/workflows/release.yml runs unit-test-sniper verification

## Summary
- Overall: PASS

