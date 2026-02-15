# Crypto and Privacy Verification Matrix

Date: 2026-02-10
Purpose: Evidence bundle for checklist item `F8 Day 15-45` (crypto/privacy verification matrix + red-team closure workflow enforcement).

## Matrix

| Domain | Requirement | Evidence Source |
|---|---|---|
| Key lifecycle | Create, rotate, revoke/consume, destroy/wipe are test-backed | `tests/unit/crypto/key-lifecycle-invariants.test.ts` |
| Constant-time paths | Constant-time comparison behavior has dedicated tests | `tests/unit/crypto/blake3.test.ts`, `tests/unit/crypto/pqc-crypto.test.ts` |
| Metadata privacy | Metadata stripping behavior is automated | `tests/unit/privacy/metadata-stripper.test.ts` |
| IP leak privacy | WebRTC leak detection and risk classification are automated | `tests/unit/privacy/vpn-leak-detection.test.ts` |
| Resume/recovery | Resume from confirmed chunk is automated and validated | `tests/unit/storage/transfer-state.test.ts`, `tests/unit/transfer/resumable-transfer.test.ts` |
| NAT before negotiation | NAT detection sequencing is automated | `tests/unit/network/data-channel-nat-ordering.test.ts` |
| Release signoff policy | Release gate blocks missing required security approvers | `.github/workflows/release.yml`, `scripts/verify-release-signoffs.js`, `release-signoffs/TEMPLATE.json` |

## Red-Team Closure Workflow

- `019` and `078` are mandatory entries in `release-signoffs/<tag>.json`.
- Release workflow runs `scripts/verify-release-signoffs.js` before publishing release artifacts.
- Missing approval or non-approved status blocks release execution.
