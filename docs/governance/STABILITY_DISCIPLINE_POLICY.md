# Stability Discipline Policy

## Purpose

This policy enforces stability-first execution so expansion work cannot bypass baseline reliability and security gates.

## Non-Negotiable Rules

1. Core secure transfer remains Priority 0 until baseline gates are green.
2. Expansion categories are sequenced behind explicit prerequisites.
3. No expansion category can advance while baseline gates are failing.
4. Every category must define measurable success criteria and an evidence format.

## Baseline Gates

- `type-check`
- `lint`
- `test:unit`
- `security:check`
- `verify:chaos`
- `verify:zero-knowledge`

## Enforcement

- Source plan and category sequencing: `docs/governance/EXPANSION_SEQUENCE.json`
- Verification command: `npm run verify:stability:discipline`
- CI enforcement: `.github/workflows/ci.yml` job `stability-discipline`
- Release enforcement: `.github/workflows/release.yml` job `stability-discipline`
