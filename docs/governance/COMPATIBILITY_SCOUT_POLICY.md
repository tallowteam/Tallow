# Compatibility Scout Policy

Owner: `AGENT 082 - COMPATIBILITY-SCOUT`

## Objective

Maintain release compatibility across major browsers and fallback paths:

- Last two major browser families represented in release E2E matrix (Chromium/Firefox/WebKit + mobile Chrome/Safari projects).
- WebCrypto and worker fallback paths remain available for environments with degraded capability.
- WASM loading degrades gracefully to JavaScript implementations when unsupported or unavailable.

## Required Gates

1. `npm run verify:e2e:infiltration`
2. `npm run verify:compatibility:scout`

## Pass Criteria

- Required Playwright projects are present in `playwright.config.ts`.
- Latest E2E infiltration evidence reports `failed=0` and `passed>=400`.
- `lib/workers/worker-bridge.ts` retains explicit main-thread fallback imports from `./crypto-fallback`.
- `lib/wasm/wasm-loader.ts` retains support detection and JS fallback paths.
- `lib/transport/transport-selector.ts` keeps a fallback chain across `webtransport`, `webrtc`, and `websocket`.

