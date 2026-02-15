# PWA Engineer Policy (AGENT 066)

## Objective
Enforce installable web-app behavior with offline-resilient settings/history UI while requiring network connectivity for live transfers.

## Required Controls
1. Installability baseline:
- App MUST expose a valid web app manifest.
- Root layout metadata MUST reference `/manifest.json`.
- Service worker registration MUST run in production.

2. Offline-ready website scope:
- Service worker MUST pre-cache website surfaces needed for transfer settings/history workflows.
- Navigation requests MUST use an offline-capable strategy with fallback content.

3. Transfer/network boundaries:
- API and signaling routes MUST remain network-only (no stale API cache serving).
- Offline response MUST clearly communicate that live transfers require network connectivity.

4. Release gate:
- `npm run verify:pwa:engineer` MUST pass in CI and release workflows.

## Evidence Anchors
- `public/manifest.json`
- `public/sw.js`
- `app/layout.tsx`
- `lib/performance/PerformanceInit.tsx`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
