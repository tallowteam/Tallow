# WASM Alchemist Policy (AGENT 059)

## Objective
Maintain async WASM acceleration with guaranteed JavaScript fallback for hashing, compression, and chunking-critical paths.

## Required Controls
1. Async WASM loading:
- WASM module loading MUST be async and capability-detected.
- Loader MUST gracefully fall back when WASM is unavailable.

2. Hash acceleration path:
- BLAKE3/SHA hashing path MUST expose WASM-first + JS fallback behavior.

3. Compression and chunking bridge:
- Compression and chunking bridge modules MUST provide async WASM hooks and deterministic JS fallback paths.

4. Worker isolation:
- Crypto worker MUST exist and remain available for off-main-thread execution.

5. Release gate:
- `npm run verify:wasm:alchemist` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/wasm/wasm-loader.ts`
- `lib/wasm/performance-bridge.ts`
- `lib/wasm/compression-bridge.ts`
- `lib/wasm/chunking-bridge.ts`
- `lib/workers/crypto.worker.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
