# Storybook Component Props Table

Generated: 2026-02-13
Owner: AGENT 091 - Documentation Scribe

Total components tracked: 136

## Coverage Statement

Storybook/autodocs props-table coverage is maintained for all current `components/**/*.tsx` surfaces (excluding tests and stories files). This index is the governance reference used by `verify:documentation:scribe`.

## Regeneration Command

`node scripts/generate-component-props-table.js`

## Current Category Totals

| Category | Count |
| --- | --- |
| `components/a11y` | 3 |
| `components/admin` | 3 |
| `components/docs` | 6 |
| `components/feedback` | 1 |
| `components/landing` | 8 |
| `components/layout` | 4 |
| `components/sections` | 2 |
| `components/security` | 3 |
| `components/theme` | 3 |
| `components/transfer` | 79 |
| `components/ui` | 23 |
| root `components/*.tsx` | 1 |

## Props Table Schema

Each component entry tracks:

- Component name
- Source file path
- Props interface/type (when declared)
- Expected story path for Storybook docs

## Notes

- `@storybook/nextjs` configuration is defined in `.storybook/main.ts`.
- Storybook preview and control configuration is defined in `.storybook/preview.ts`.
- API and architecture docs remain linked to this coverage policy through `verify:documentation:scribe`.
