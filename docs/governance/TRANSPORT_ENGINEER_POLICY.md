# Transport Engineer Policy (Agent 025)

**Owner:** TRANSPORT-ENGINEER (Agent 025)
**Last Updated:** 2026-02-13
**Status:** Active

## Objective

QUIC (via WebTransport) is the preferred transport protocol. The fallback chain MUST be: QUIC > WebTransport > WebRTC DataChannel > WebSocket Relay. Transport selection MUST be automatic based on browser support and network conditions.

## Required Controls

### 1. Transport Priority Chain

The transport selector MUST follow this priority order:

1. **WebTransport (QUIC/HTTP/3)** - Best latency and throughput, multiplexed streams
2. **WebRTC DataChannel (UDP)** - Good latency, NAT traversal built-in
3. **WebSocket Relay (TCP)** - Universal fallback, always works

### 2. Automatic Transport Selection

- `lib/transport/transport-selector.ts` implements the selection logic.
- Browser capability detection MUST be performed before selection.
- Network condition assessment (NAT type, firewall) MUST influence selection.
- Selection result MUST be logged for diagnostics.

### 3. WebTransport Support

- `lib/transport/webtransport.ts` implements the WebTransport client.
- Feature detection via `typeof WebTransport !== 'undefined'`.
- Graceful fallback when WebTransport is not supported.

### 4. Privacy Transport

- `lib/transport/private-webrtc.ts` implements privacy-enhanced WebRTC.
- `lib/transport/obfuscation.ts` provides traffic obfuscation.
- `lib/transport/timing-obfuscation.ts` prevents timing analysis.
- `lib/transport/packet-padding.ts` normalizes packet sizes.

### 5. Release Gate

- `npm run verify:transport:engineer` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/transport/transport-selector.ts` - Transport selection logic
- `lib/transport/webtransport.ts` - WebTransport client
- `lib/transport/private-webrtc.ts` - Privacy WebRTC
- `lib/transport/obfuscation.ts` - Traffic obfuscation
- `lib/transport/onion-routing.ts` - Onion routing
- `lib/transport/index.ts` - Barrel exports
- `tests/unit/network/transport-engineer.test.ts` - Unit tests
- `scripts/verify-transport-engineer.js` - Verifier script

## CI/CD Integration

- **npm script:** `npm run verify:transport:engineer`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`
