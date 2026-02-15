# COMPONENT-FORGER Policy

## Owner
- AGENT 032 - COMPONENT-FORGER

## Mission
- Enforce consistent component construction patterns for core UI primitives: typed props, `forwardRef`, `displayName`, and CVA-driven variant composition.

## Required Invariants
- Governed UI primitives (`Button`, `Input`, `Card`) must use `forwardRef`.
- Governed UI primitives must expose explicit `displayName`.
- Governed UI primitives must use the CVA utility for variant class composition.
- Governed UI primitives must not use `any` or type assertions.
- Policy gate must run in CI and release workflows via `npm run verify:component:forger`.

## Evidence Surface
- `lib/ui/cva.ts`
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Card.tsx`
- `tests/unit/ui/component-forger.test.ts`
- `tests/unit/components/Button.test.tsx`
- `tests/unit/components/Input.test.tsx`
- `tests/unit/components/Card.test.tsx`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
