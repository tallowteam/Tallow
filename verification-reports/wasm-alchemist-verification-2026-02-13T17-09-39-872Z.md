# WASM Alchemist Verification

Generated: 2026-02-13T17:09:39.869Z

## Checks
- [PASS] WASM policy, bridges, worker, and workflows exist
- [PASS] WASM loader is async, capability-detected, and cached
- [PASS] Hash acceleration path exposes WASM-first with JS fallback
- [PASS] Compression and chunking bridges expose async WASM hooks with JS fallback
- [FAIL] Crypto worker remains available for off-main-thread execution
- [PASS] Release benchmark evidence exists for WASM-related transfer performance tracking
- [PASS] WASM alchemist gate is wired in package scripts and workflows

### WASM policy, bridges, worker, and workflows exist
- all required wasm alchemist files are present

### WASM loader is async, capability-detected, and cached
- async fetch+instantiate loader with cache and support checks verified

### Hash acceleration path exposes WASM-first with JS fallback
- hash routing exists across wasm-loader, performance bridge, and wasm index API

### Compression and chunking bridges expose async WASM hooks with JS fallback
- compression/chunking bridge exports and fallback paths verified

### Crypto worker remains available for off-main-thread execution
- crypto worker is missing message event listener

### Release benchmark evidence exists for WASM-related transfer performance tracking
- bench:transfer:release: node --expose-gc scripts/benchmark/transfer-release-benchmark.js
- latest release benchmark report: reports/transfer-benchmarks/release-benchmark-report-1770982933578.md

### WASM alchemist gate is wired in package scripts and workflows
- verify:wasm:alchemist: node scripts/verify-wasm-alchemist.js
- .github/workflows/ci.yml runs wasm alchemist verification
- .github/workflows/release.yml runs wasm alchemist verification

## Summary
- Overall: FAIL

