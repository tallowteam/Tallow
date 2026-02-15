# Empty State Artist Policy

## Scope

This policy enforces AGENT 047 release expectations for guided empty states in transfer UX surfaces.

## Mandatory Requirements

- Empty states must never be plain placeholder copy only.
- Each governed empty state must include:
  - illustration
  - explanation
  - action button
- The transfer dashboard empty states must be enforced for:
  - nearby device discovery
  - active transfers
  - transfer history
- Empty-state quality checks must be enforced by automated verification in CI and release workflows.

## Evidence Requirements

- Governed components and styles:
  - `components/transfer/DeviceList.tsx`
  - `components/transfer/devicelist.module.css`
  - `components/transfer/TransferProgress.tsx`
  - `components/transfer/TransferProgress.module.css`
  - `components/transfer/TransferHistory.tsx`
  - `components/transfer/transferhistory.module.css`
- Automated tests:
  - `tests/unit/components/TransferDashboardPanels.test.tsx`
- Passing policy verifier artifact:
  - `reports/empty-state-artist-verification-*.{json,md}` or `verification-reports/...` fallback.

## Gate Condition

Any regression that removes illustration, explanation, or action guidance from governed empty states is a release-blocking failure for AGENT 047.
