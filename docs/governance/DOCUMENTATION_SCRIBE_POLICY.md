# Documentation Scribe Policy

Generated: 2026-02-13
Owner: AGENT 091 - Documentation Scribe

## Scope

Documentation quality controls for API coverage, Storybook props visibility, architecture diagrams, and security publication artifacts.

## Requirements

1. API endpoints are documented with examples via OpenAPI.
2. Component props coverage index is maintained for Storybook/autodocs workflows.
3. Architecture diagram index remains aligned with live diagram sources.
4. Security whitepaper is published and versioned.

## Canonical Sources

- API spec: `lib/docs/openapi.ts`
- API docs route: `app/api/docs/route.ts`
- Storybook config: `.storybook/main.ts`, `.storybook/preview.ts`
- Component props index: `docs/governance/COMPONENT_PROPS_TABLES.md`
- Diagram index: `docs/governance/ARCHITECTURE_DIAGRAM_INDEX.md`
- Whitepaper: `docs/security/SECURITY_WHITEPAPER.md`

## Verification

- Command: `npm run verify:documentation:scribe`
- Evidence: `reports/documentation-scribe-*.json` and `reports/documentation-scribe-*.md`
