# Accessibility Floor Policy

## Purpose

Enforce the accessibility release floor from operations policy:

- WCAG 2.1 AA baseline checks,
- 4.5:1 color contrast coverage via Lighthouse `color-contrast`,
- keyboard navigability backed by the accessibility E2E suite.

## Required Evidence

1. Lighthouse accessibility category score >= `0.95` on required routes.
2. Lighthouse `color-contrast` audit passes on required routes.
3. Keyboard and focus management tests exist in `tests/e2e/accessibility.spec.ts`.
4. CI workflow includes dedicated accessibility execution.

## Required Routes

- `/`
- `/transfer`
- `/features`
- `/how-it-works`

## Enforcement

- Verification command: `npm run verify:accessibility:floor`
- Policy verifier: `scripts/verify-accessibility-floor.js`
- CI gate: `.github/workflows/ci.yml` (`accessibility-floor`)
- Release gate: `.github/workflows/release.yml` (`accessibility-floor`)
