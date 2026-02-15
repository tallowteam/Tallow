# Threat Model Matrix

Last updated: 2026-02-10
Scope: Direct transfer, relay transfer, privacy mode, onboarding, and recovery/resume flows.

## Assumptions

- Peer payloads are encrypted end-to-end before transport.
- Signaling and relay components are untrusted transport surfaces.
- Browsers/devices may run on hostile or monitored networks.
- Key material is ephemeral where possible and is wiped on teardown paths.

## Flow Matrix

| Flow | Primary Threats | Controls | Verification Evidence |
|---|---|---|---|
| Direct P2P transfer | MITM, ICE candidate IP leakage, replay/resend abuse, chunk tampering | Signed prekeys, session key derivation, private transport candidate filtering, per-chunk integrity checks | `tests/unit/network/data-channel-nat-ordering.test.ts`, `tests/unit/crypto/file-encryption.test.ts`, `tests/e2e/accessibility.spec.ts` |
| Relay transfer | Relay observation, metadata disclosure, unauthorized room join | Encrypted payloads, encrypted signaling, short-lived room/session context, relay fallback without plaintext exposure | `reports/TRANSPORT_FALLBACK_MATRIX_2026-02-09.md`, `reports/RELIABILITY_MATRIX_2026-02-09.md` |
| Privacy mode | WebRTC IP leak, traffic correlation, metadata leakage | TURN/relay privacy transport, VPN/WebRTC leak detection, metadata stripping controls, onion routing mode | `tests/unit/privacy/vpn-leak-detection.test.ts`, `tests/unit/privacy/metadata-stripper.test.ts`, `lib/transport/private-webrtc.ts` |
| Onboarding / trust establishment | Impersonation during first connect, weak verification UX | SAS verification workflows, device trust controls, explicit security settings | `tests/e2e/settings-page.spec.ts`, `tests/unit/stores/settings-store.test.ts` |
| Recovery / resume | State desync, partial-chunk corruption, stale resumptions, reconnect confusion | Persisted transfer state, bitmap-based missing chunk requests, resumable protocol, reconnect handling | `tests/unit/storage/transfer-state.test.ts`, `tests/unit/transfer/resumable-transfer.test.ts` |

## Residual Risks

- Browser-side privacy capabilities vary by platform and runtime policy.
- Human trust verification (SAS/out-of-band) still depends on user action.
- Operational sign-off quality depends on release process discipline.

## Required Release Checks

- Security signoffs (`002`, `019`, `078`) attached via `release-signoffs/<tag>.json`.
- Security artifact bundle includes dependency audit + SBOM.
- Privacy automation tests must pass in unit test gate.
