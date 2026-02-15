# RADIX-SURGEON Policy

## Owner
- AGENT 035 - RADIX-SURGEON

## Mission
- Enforce Radix-grade accessibility behavior through shared primitives and composition-first usage in interactive overlays.

## Required Invariants
- Dialog behavior (focus trap, Escape dismissal, backdrop dismissal for non-critical overlays, and `aria-modal` semantics) must be implemented once in `components/ui/Modal.tsx`.
- Higher-level overlays must compose the shared modal primitive instead of re-implementing accessibility behavior.
- Policy gates must prove composition discipline for `ConfirmDialog` and `TransferCommandPalette`.
- Policy gate must run in CI and release workflows via `npm run verify:radix:surgeon`.

## Evidence Surface
- `lib/ui/radix-surgeon.ts`
- `components/ui/Modal.tsx`
- `components/ui/ConfirmDialog.tsx`
- `components/transfer/TransferCommandPalette.tsx`
- `tests/unit/ui/radix-surgeon.test.ts`
- `components/ui/Modal.test.tsx`
- `tests/unit/components/transfer/TransferCommandPalette.test.tsx`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
