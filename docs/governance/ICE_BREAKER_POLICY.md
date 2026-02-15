# ICE Breaker Policy (Agent 022)

**Owner:** ICE-BREAKER (Agent 022)
**Last Updated:** 2026-02-13
**Status:** Active

## Objective

Ensure NAT type is detected BEFORE any WebRTC connection attempt. When both peers are behind symmetric NAT, TURN relay MUST be the only strategy. TURN fallback MUST complete within 5 seconds.

## Required Controls

### 1. Pre-Connection NAT Detection

- NAT type MUST be detected before the signaling offer is created.
- Detection uses STUN binding requests per RFC 3489/5389.
- Supported NAT types: `FULL_CONE`, `RESTRICTED`, `PORT_RESTRICTED`, `SYMMETRIC`, `BLOCKED`, `UNKNOWN`.
- Detection result MUST be cached for the session duration.

### 2. Symmetric+Symmetric = TURN Only

- When BOTH peers report `SYMMETRIC` NAT, the connection strategy MUST be `TURN_ONLY`.
- Direct ICE candidate gathering (host/srflx) MAY proceed but MUST NOT delay the TURN setup.
- The `getConnectionStrategy()` function enforces this rule.

### 3. TURN Fallback Timing

- If direct ICE fails, TURN fallback MUST complete within 5 seconds.
- The ICE connection timeout MUST be enforced programmatically.
- If TURN also fails within 5s, escalate to WebSocket relay.

### 4. ICE Configuration

- STUN servers: At minimum Google (`stun.l.google.com:19302`) and Cloudflare (`stun.cloudflare.com:3478`).
- TURN servers: Configured per deployment via environment variables.
- ICE candidate filtering: mDNS candidates preserved for LAN, host candidates stripped for privacy on WAN.

### 5. Release Gate

- `npm run verify:ice:breaker` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/webrtc/ice.ts` - ICE configuration and candidate management
- `lib/network/nat-detection.ts` - NAT type detection (STUN-based)
- `lib/network/connection-strategy.ts` - Connection strategy selection
- `lib/network/turn-config.ts` - TURN server configuration
- `lib/network/turn-health.ts` - TURN health checking
- `tests/unit/network/ice-breaker.test.ts` - Unit tests
- `scripts/verify-ice-breaker.js` - Verifier script

## CI/CD Integration

- **npm script:** `npm run verify:ice:breaker`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`
