# Performance Hawk Verification

Generated: 2026-02-13T17:09:39.903Z

## Checks
- [PASS] Performance policy, benchmark scripts, runtime paths, and workflows exist
- [FAIL] Crypto operations are wired for worker execution
- [PASS] Heavy UI/features are lazy-loaded through dynamic import boundaries
- [PASS] Bundle and Lighthouse benchmark evidence is present
- [PASS] Performance benchmark and image-optimization scripts are configured
- [PASS] Performance hawk gate is wired in package scripts and workflows

### Performance policy, benchmark scripts, runtime paths, and workflows exist
- all required performance hawk files are present

### Crypto operations are wired for worker execution
- crypto worker missing operation: decrypt
- crypto worker missing operation: hash
- crypto worker missing operation: derive-key

### Heavy UI/features are lazy-loaded through dynamic import boundaries
- dynamic loading paths detected for heavy chart and transfer UI modules

### Bundle and Lighthouse benchmark evidence is present
- bundle report indicates budgets met
- lighthouse budget pass reports found: 5

### Performance benchmark and image-optimization scripts are configured
- bench:bundle: node scripts/benchmark/bundle-size-tracker.js
- bench:lighthouse: node scripts/benchmark/lighthouse-ci.js
- optimize:images: node scripts/optimize-images.js

### Performance hawk gate is wired in package scripts and workflows
- verify:performance:hawk: node scripts/verify-performance-hawk.js
- .github/workflows/ci.yml runs performance hawk verification
- .github/workflows/release.yml runs performance hawk verification

## Summary
- Overall: FAIL

