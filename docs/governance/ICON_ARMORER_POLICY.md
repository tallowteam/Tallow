# ICON-ARMORER Policy

## Owner
- AGENT 038 - ICON-ARMORER

## Mission
- Keep iconography consistent and accessible across transfer-critical surfaces.

## Required Invariants
- Allowed icon sizes are restricted to `16`, `20`, `24`, `32` and exported from `lib/ui/icon-armor.ts`.
- Icon stroke widths are restricted to `1.5` and `2` and exported from `lib/ui/icon-armor.ts`.
- Transfer status/security icon surfaces use semantic security colors (`var(--success)`, `var(--warning)`, `var(--destructive)`).
- Loading/processing icons use explicit motion treatment and include reduced-motion fallback.
- Policy gate must run in CI and release workflows via `npm run verify:icon:armorer`.

## Evidence Surface
- `lib/ui/icon-armor.ts`
- `components/transfer/TransferHistory.tsx`
- `components/transfer/TransferProgress.tsx`
- `components/transfer/TransferProgress.module.css`
- `tests/unit/ui/icon-armor.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
