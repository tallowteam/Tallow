# Unit Test Sniper Policy (AGENT 076)

## Objective
Enforce release-blocking unit-test discipline for crypto vectors, hook lifecycle behavior, and coverage floors.

## Required Controls
1. Crypto vector discipline:
- SHA3 unit tests MUST include FIPS/NIST vectors.
- BLAKE3 unit tests MUST include official vectors.
- Required crypto vector suites MUST not use skipped tests.

2. Hook lifecycle discipline:
- Hook tests MUST explicitly cover mount/unmount behavior.
- Lifecycle coverage MUST include `useFileTransfer`, `useOnboarding`, and `useNotifications`.
- Notification auto-reject timers MUST be cleared on unmount.

3. Coverage floor:
- Vitest coverage thresholds MUST be configured at:
  - `lines >= 90`
  - `statements >= 90`
  - `functions >= 90`
  - `branches >= 80`

4. Release gate:
- `npm run verify:unit:test-sniper` MUST pass in CI and release workflows.

## Evidence Anchors
- `tests/unit/crypto/blake3.test.ts`
- `tests/unit/crypto/sha3.test.ts`
- `tests/unit/hooks/hook-lifecycle.test.ts`
- `lib/hooks/use-notifications.ts`
- `vitest.config.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
