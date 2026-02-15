# Discovery Hunter Policy (Agent 026)

**Owner:** DISCOVERY-HUNTER (Agent 026)
**Last Updated:** 2026-02-13
**Status:** Active

## Purpose

Governs the device discovery subsystem for TALLOW. Ensures LAN devices are discovered in under 2 seconds via mDNS, BLE is available for proximity detection, NFC is documented for instant pairing, and WiFi Direct is documented for no-router scenarios.

## Owned Files

| File | Purpose |
|------|---------|
| `lib/discovery/discovery-controller.ts` | Singleton managing discovery lifecycle (plain TS, NOT a React hook) |
| `lib/discovery/unified-discovery.ts` | Merges mDNS + signaling into unified device list |
| `lib/discovery/local-discovery.ts` | Signaling-server-based discovery via WebSocket |
| `lib/discovery/mdns-bridge.ts` | WebSocket bridge to local mDNS daemon |
| `lib/discovery/mdns-types.ts` | mDNS service type definitions (`_tallow._tcp.local`) |
| `lib/discovery/ble.ts` | BLE proximity detection via Web Bluetooth API |
| `lib/discovery/group-discovery-manager.ts` | Multi-device discovery for group transfers |
| `lib/discovery/index.ts` | Barrel exports for the discovery module |
| `lib/hooks/use-device-discovery.ts` | Thin React wrapper around discovery-controller |
| `lib/hooks/use-unified-discovery.ts` | React hook for unified discovery |
| `lib/stores/device-store.ts` | Zustand store for device state |
| `components/transfer/DeviceList.tsx` | UI component rendering discovered devices |

## Discovery Methods

### 1. mDNS (Primary LAN Discovery)

- **Target:** Less than 2 seconds for first device appearance on LAN
- **Service type:** `_tallow._tcp.local`
- **TXT records:** device name, capabilities, version, platform, fingerprint
- **Auto-expire:** 60 seconds without heartbeat refresh
- **Architecture:** Browser connects to local mDNS daemon via WebSocket bridge (`ws://localhost:53318`)
- **Fallback:** When daemon is unavailable, falls back to signaling server discovery

### 2. BLE (Proximity Detection)

- **Range:** Approximately 10 meters
- **Speed:** 3-5 seconds for scan
- **Service UUID:** `0000fd00-0000-1000-8000-00805f9b34fb`
- **Requires:** User permission (Web Bluetooth API requires user gesture)
- **Browser support:** Chrome, Edge, Opera. Not supported in Firefox or Safari.
- **Distance estimation:** RSSI-based log-distance path loss model

### 3. NFC (Instant Pairing)

- **Status:** Documented for future native app integration
- **Mechanism:** Tap-to-pair via NFC tag containing device connection info
- **Use case:** Instant one-tap pairing between two physical devices
- **Platform requirement:** Native app (iOS/Android) -- Web NFC API is experimental
- **Data exchanged:** Device ID, public key fingerprint, connection endpoint

### 4. WiFi Direct (No-Router Scenarios)

- **Status:** Documented for future native app integration
- **Mechanism:** Peer-to-peer WiFi connection without access point
- **Use case:** Transfer files when no WiFi router is available
- **Platform requirement:** Native app (Android has mature WiFi Direct API; iOS uses MultipeerConnectivity)
- **Fallback chain:** mDNS -> Signaling -> WiFi Direct -> BLE -> Manual IP

### 5. Signaling Server (Internet Fallback)

- **Mechanism:** WebSocket connection to signaling server
- **Use case:** Discovery across different networks or when mDNS unavailable
- **Privacy:** Device IDs are hashed (SHA-256 truncated to 16 hex chars)
- **Heartbeat:** 3 seconds
- **Offline timeout:** 10 seconds

### 6. Manual IP Entry

- **Range:** Any reachable IP
- **Speed:** Instant
- **Privacy:** No broadcast required

### 7. QR Code

- **Mechanism:** Camera-based scanning of device connection QR code
- **Speed:** Instant upon successful scan
- **Privacy:** Visual-only, no network broadcast

## Invariants

1. **Zustand constraint:** `discovery-controller.ts` is a plain TypeScript singleton. It MUST NOT be a React hook. All Zustand store access MUST use `.getState()` -- never the hook form. This prevents Turbopack from transforming store access into infinite re-render loops.

2. **Privacy:** mDNS broadcasts are opt-in only. Device names are user-chosen, not hardware identifiers. Presence broadcasts use hashed device IDs.

3. **BLE permission:** BLE discovery MUST require explicit user permission via user gesture.

4. **Performance target:** mDNS discovery MUST find LAN devices in under 2 seconds when the daemon is available. The daemon WebSocket connection timeout is 5 seconds. Auto-refresh interval is 10 seconds.

5. **Graceful degradation:** The system MUST fall back through the discovery chain (mDNS -> Signaling -> Manual) without user intervention.

6. **No hook-level store mutation:** Discovery controller functions MUST NOT start with `use` prefix. They are plain module functions invoked outside React's render cycle.

## Verification Checks

The verifier (`scripts/verify-discovery-hunter.js`) enforces:

1. All required discovery files exist
2. `discovery-controller.ts` uses `.getState()` and does NOT import React hooks
3. mDNS service type is `_tallow._tcp.local`
4. BLE service UUID is defined
5. Unified discovery merges mDNS and signaling sources
6. Discovery controller is exported as a singleton (not a hook)
7. `package.json` has the `verify:discovery:hunter` script
8. CI workflow runs `npm run verify:discovery:hunter`
9. Release workflow runs `npm run verify:discovery:hunter`
10. Unit tests exist at `tests/unit/network/discovery-hunter.test.ts`

## CI/CD Integration

- **npm script:** `npm run verify:discovery:hunter`
- **CI job:** Runs in `unit-test` job of `.github/workflows/ci.yml`
- **Release job:** Runs in `verify-security-signoffs` job of `.github/workflows/release.yml`
