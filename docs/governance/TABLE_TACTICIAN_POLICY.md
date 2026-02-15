# TABLE-TACTICIAN Policy

## Owner
- AGENT 037 - TABLE-TACTICIAN

## Mission
- Ensure large transfer lists stay responsive by enforcing virtualization and list-update discipline.

## Required Invariants
- Any governed transfer list with more than `100` items must use virtualization.
- Transfer history virtualization threshold and dimensions are tokenized in `lib/ui/table-tactician.ts`.
- Virtualized history surface must expose an explicit virtualized viewport marker.
- Policy gate must run in CI and release workflows via `npm run verify:table:tactician`.

## Evidence Surface
- `lib/ui/table-tactician.ts`
- `components/transfer/TransferHistory.tsx`
- `components/transfer/transferhistory.module.css`
- `tests/unit/ui/table-tactician.test.ts`
- `tests/unit/components/TransferDashboardPanels.test.tsx`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
