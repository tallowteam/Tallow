# Data Visualizer Policy (AGENT 058)

## Objective
Enforce accessible, low-jank visualization primitives for transfer telemetry.

## Required Controls
1. Chart accessibility:
- Visualization SVG containers MUST expose role/aria labels.
- Data points MUST carry readable labels for assistive technologies.

2. Real-time rendering discipline:
- Chart computation MUST use memoized transforms for repeated updates.
- Reduced-motion handling MUST be respected in chart styles where animation exists.

3. Color safety:
- Shared chart palette MUST be color-blind-safe and reusable across chart types.

4. Transfer telemetry coverage:
- Transfer-rate graph and signal-quality indicators MUST expose user-visible and screen-reader-readable status text.

5. Release gate:
- `npm run verify:data:visualizer` MUST pass in CI and release workflows.

## Evidence Anchors
- `components/admin/SimpleChart.tsx`
- `components/transfer/TransferRateGraph.tsx`
- `components/transfer/SignalIndicator.tsx`
- `components/transfer/TransferRateGraph.module.css`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
