# Compression Specialist Policy (AGENT 074)

## Objective
Enforce transfer compression discipline so compression only runs when it helps, with deterministic algorithm selection.

## Required Controls
1. Entropy gate:
- Compression analysis MUST compute sample entropy before attempting compression.
- Files with entropy greater than `7.5` bits/byte MUST be skipped as already compressed.

2. Zstandard baseline:
- Zstandard MUST use level `3` (`ZstdLevel.DEFAULT`) as the default balanced setting.

3. Priority routing:
- Speed-priority mode MUST select `lz4`.
- Maximum-compression mode MUST be the only path that selects `lzma`.

4. Verification and tests:
- Unit coverage MUST include a high-entropy skip test.
- `npm run verify:compression:specialist` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/compression/compression-pipeline.ts`
- `lib/compression/index.ts`
- `lib/compression/zstd.ts`
- `tests/unit/compression/compression-pipeline.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
