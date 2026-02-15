# Visual Regression Watcher Policy (AGENT 080)

## Objective
Protect visual quality by enforcing screenshot diff gates across key themes and viewport extremes.

## Required Controls
1. Storybook baseline:
- Storybook config MUST be present and enabled for component docs.
- Component props-table index MUST exist and be kept current.

2. Visual diff suite:
- Playwright visual suite MUST exist under `tests/e2e/visual/`.
- Suite MUST capture all four themes: `dark`, `light`, `forest`, `ocean`.
- Suite MUST cover viewport extremes at `320px` and `1920px`.

3. PR/CI enforcement:
- E2E workflow MUST run visual regression tests on PRs.
- `npm run verify:visual:regression` MUST pass in CI and release workflows.

## Evidence Anchors
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `docs/governance/COMPONENT_PROPS_TABLES.md`
- `tests/e2e/visual/visual-regression.spec.ts`
- `.github/workflows/e2e.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
