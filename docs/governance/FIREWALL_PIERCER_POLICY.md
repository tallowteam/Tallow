# Firewall Piercer Policy (Agent 028)

**Owner:** FIREWALL-PIERCER (Agent 028)
**Last Updated:** 2026-02-13
**Status:** Active

## Objective

If UDP is blocked, fall back to TCP. If TCP is blocked, fall back to WebSocket over port 443. Auto-detect corporate proxies. NEVER fail silently -- always inform the user of connection restrictions and recommended actions.

## Required Controls

### 1. Protocol Fallback Chain

The connection MUST attempt protocols in this order:

1. **UDP (STUN/WebRTC)** - Direct P2P, best performance
2. **TCP (TURN over TCP)** - When UDP is blocked
3. **WebSocket over 443** - When TCP is also restricted
4. **Relay via HTTPS** - When all direct connections fail

### 2. Firewall Detection

- `lib/network/firewall-detection.ts` implements parallel connectivity testing.
- Tests: STUN connectivity, WebSocket connectivity, TURN connectivity, direct P2P.
- Timeout: 5 seconds per test.
- Classification: `none`, `moderate`, `strict`, `corporate`.
- Results are cached to avoid repeated testing.

### 3. Corporate Proxy Detection

- Auto-detect HTTP/HTTPS proxy settings.
- Detect CONNECT method availability.
- `lib/network/proxy-config.ts` handles proxy configuration.
- Provide user-friendly guidance for proxy configuration.

### 4. No Silent Failures

- Every connection attempt MUST log its result.
- Failed connection attempts MUST produce user-visible notifications.
- The UI MUST show the current connection path (direct, TURN, relay, etc.).
- `secureLog` is used for all diagnostics (no sensitive data in logs).

### 5. Release Gate

- `npm run verify:firewall:piercer` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/network/firewall-detection.ts` - Firewall detection and classification
- `lib/network/proxy-config.ts` - Proxy configuration
- `lib/network/connection-strategy.ts` - Connection strategy selection
- `lib/transport/transport-selector.ts` - Transport protocol selection
- `tests/unit/network/firewall-piercer.test.ts` - Unit tests
- `scripts/verify-firewall-piercer.js` - Verifier script

## CI/CD Integration

- **npm script:** `npm run verify:firewall:piercer`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`
