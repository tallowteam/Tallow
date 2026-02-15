# Design Token Drift Policy

## Purpose

Prevent new hardcoded visual values from bypassing the design-system token layer.

## Scope

- `app/**`
- `components/ui/**`
- `components/transfer/**`

Generated examples, docs, tests, and story/demo files are excluded from enforcement.

## Rule

1. New hardcoded color literals (`#hex`, `rgb()`, `hsl()`) are not allowed to increase over baseline.
2. Existing legacy literals are tracked in baseline and can only move downward over time.
3. Any baseline update requires explicit governance approval and must include regenerated evidence.

## Enforcement

- Baseline: `docs/governance/DESIGN_TOKEN_DRIFT_BASELINE.json`
- Verification command: `npm run verify:design:tokens`
- CI enforcement: `.github/workflows/ci.yml` (`design-token-drift`)
- Release enforcement: `.github/workflows/release.yml` (`design-token-drift`)
