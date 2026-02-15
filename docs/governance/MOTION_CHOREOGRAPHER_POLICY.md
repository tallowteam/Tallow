# MOTION-CHOREOGRAPHER Policy

## Owner
- AGENT 033 - MOTION-CHOREOGRAPHER

## Mission
- Keep transfer-surface motion compositing-safe, consistent, and responsive under release governance.

## Required Invariants
- Motion duration baseline is `300ms` (hero moments are out of scope for this transfer-surface policy).
- Motion transitions in governed transfer surfaces animate only `transform` and `opacity`.
- Card hover motion translates to `y(-2px)` / `translateY(-2px)`.
- Button/card tap motion scales to `0.98`.
- Reduced-motion users receive transition-disabled fallbacks.
- Policy gate must run in CI and release workflows via `npm run verify:motion:choreographer`.

## Evidence Surface
- `lib/ui/motion-choreographer.ts`
- `components/transfer/modeselector.module.css`
- `components/transfer/sidebar.module.css`
- `components/transfer/dropzone.module.css`
- `tests/unit/ui/motion-choreographer.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
