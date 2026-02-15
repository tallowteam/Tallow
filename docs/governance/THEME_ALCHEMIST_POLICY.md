# Theme Alchemist Policy (AGENT 034)

This policy defines release-blocking requirements for theme runtime behavior.

## Required Behaviors

1. Theme switching must be CSS-variable driven (`data-theme` + CSS variables), without runtime style recalculation loops.
2. Theme bootstrap must run before hydration to prevent flash-of-incorrect-theme (FOUC).
3. System color-scheme preference must be respected on first visit when no saved preference exists.
4. Four baseline themes (`dark`, `light`, `forest`, `ocean`) must be defined and selectable in the UI.
5. Visual regression gates must include all four baseline themes.

## Enforcement Scope

- `components/theme/theme-provider.tsx`
- `components/theme/theme-script.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/settings/page.tsx`
- `tests/e2e/visual/visual-regression.spec.ts`
- `tests/unit/theme/theme-provider.test.tsx`
- `tests/unit/theme/theme-script.test.tsx`

## Verification

- Gate command: `npm run verify:theme:alchemist`
- Verifier: `scripts/verify-theme-alchemist.js`
- Expected artifacts: `reports/theme-alchemist-verification-<timestamp>.json` and `.md`
