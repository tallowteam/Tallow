# Performance Hawk Policy (AGENT 055)

## Objective
Keep transfer UX responsive by enforcing worker offload, bundle governance, and lighthouse baselines.

## Required Controls
1. Crypto off-main-thread:
- Runtime crypto operations MUST be available through web worker execution paths.
- Worker implementation MUST support encrypt/decrypt/hash/derive-key operations.

2. Bundle governance:
- Bundle-size tracking MUST run through `bench:bundle` and enforce budgets.

3. Lighthouse floor:
- Lighthouse benchmarking MUST be available through `bench:lighthouse`.
- Repository evidence MUST include at least one passing lighthouse budget report.

4. Lazy-loading heavy UI:
- Heavy UI surfaces (charts, chat/history panels, and optional feature bundles) MUST be dynamically imported.

5. Image optimization pipeline:
- Image optimization script(s) MUST exist and remain callable from `package.json`.

6. Release gate:
- `npm run verify:performance:hawk` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/crypto/crypto-worker-client.ts`
- `lib/workers/crypto.worker.ts`
- `lib/performance/dynamic-imports.ts`
- `scripts/benchmark/bundle-size-tracker.js`
- `scripts/benchmark/lighthouse-ci.js`
- `reports/bundle-size-report.md`
- `reports/lighthouse/*.md`
