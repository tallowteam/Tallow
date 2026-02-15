# Relay Sentinel Policy (Agent 024)

**Owner:** RELAY-SENTINEL (Agent 024)
**Last Updated:** 2026-02-13
**Status:** Active

## Objective

The relay server MUST NEVER see plaintext file data. It relays encrypted bytes only. PAKE (Password-Authenticated Key Exchange) ensures only intended peers can decrypt. The relay is self-hostable as a Go binary and Docker container.

## Required Controls

### 1. Zero-Knowledge Relay

- The relay server MUST only forward encrypted byte streams.
- No decryption keys are ever stored on or transmitted through the relay.
- The relay protocol is opaque: it cannot distinguish file metadata from file content.

### 2. PAKE Authentication

- Peers authenticate using PAKE derived from the connection code.
- Only peers who know the connection code can derive the session key.
- The relay cannot participate in PAKE -- it has no knowledge of the code.

### 3. Onion Routing (Privacy Enhancement)

- Optional onion routing through relay nodes: CLIENT -> ENTRY -> MIDDLE -> EXIT -> PEER.
- Each layer is encrypted with PQC session keys.
- No single relay node sees both sender and receiver.

### 4. Self-Hostable Architecture

- Go relay binary in `tallow-relay/` directory.
- Docker image via `Dockerfile` in the relay directory.
- Configuration via environment variables.

### 5. Relay Client

- `lib/relay/relay-client.ts` - WebSocket client for relay connections.
- `lib/relay/relay-directory.ts` - Relay node discovery and selection.
- `lib/relay/index.ts` - Barrel exports.

### 6. Release Gate

- `npm run verify:relay:sentinel` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/relay/relay-client.ts` - Relay WebSocket client
- `lib/relay/relay-directory.ts` - Relay directory
- `lib/relay/index.ts` - Barrel exports
- `lib/transport/onion-routing.ts` - Onion routing implementation
- `tallow-relay/` - Self-hostable relay server
- `tests/unit/network/relay-sentinel.test.ts` - Unit tests
- `scripts/verify-relay-sentinel.js` - Verifier script

## CI/CD Integration

- **npm script:** `npm run verify:relay:sentinel`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`
