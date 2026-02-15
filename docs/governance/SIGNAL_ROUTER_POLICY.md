# Signal Router Policy (Agent 023)

**Owner:** SIGNAL-ROUTER (Agent 023)
**Last Updated:** 2026-02-13
**Status:** Active

## Objective

The signaling server MUST NEVER see encryption keys. All signaling payloads MUST be encrypted with session keys derived from the connection code. Rooms MUST expire after 24 hours. Connection codes MUST be at least 6 characters and generated using CSPRNG.

## Required Controls

### 1. Zero-Knowledge Signaling

- Signaling payloads (SDP offers, SDP answers, ICE candidates) MUST be encrypted before transmission.
- Encryption key is derived from the connection code using HKDF (SHA-256).
- The signaling server sees only encrypted blobs -- never plaintext SDP or ICE candidates.
- `lib/signaling/signaling-crypto.ts` implements this encryption layer.

### 2. Session Key Derivation

- Connection code -> HKDF with `tallow-signaling-v1` info and `tallow-signaling-salt-v1` salt.
- Counter-based nonces to prevent nonce reuse attacks.
- Nonce manager resets on key rotation.

### 3. Room Expiration

- Rooms MUST expire after 24 hours (86400 seconds).
- The rooms API (`app/api/rooms/route.ts`) MUST enforce TTL.
- Expired rooms MUST be cleaned up automatically.

### 4. Connection Code Requirements

- Minimum 6 characters.
- Generated using CSPRNG (`crypto.getRandomValues` or `crypto.randomBytes`).
- Codes MUST NOT be sequential or predictable.

### 5. Signaling Server Architecture

- `lib/signaling/socket-signaling.ts` - WebSocket signaling client
- `lib/signaling/connection-manager.ts` - Connection lifecycle management
- `lib/signaling/pqc-signaling.ts` - Post-quantum signaling integration
- `signaling-server.js` - Standalone signaling server

### 6. Release Gate

- `npm run verify:signal:router` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/signaling/signaling-crypto.ts` - Signaling encryption
- `lib/signaling/socket-signaling.ts` - WebSocket signaling
- `lib/signaling/connection-manager.ts` - Connection management
- `lib/signaling/pqc-signaling.ts` - PQC signaling
- `app/api/rooms/route.ts` - Room API
- `tests/unit/network/signal-router.test.ts` - Unit tests
- `scripts/verify-signal-router.js` - Verifier script

## CI/CD Integration

- **npm script:** `npm run verify:signal:router`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`
