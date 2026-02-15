# Architecture Diagram Index

Generated: 2026-02-13
Owner: AGENT 091 - Documentation Scribe

## Canonical Diagram Sources

- Diagram definitions: `lib/docs/architecture-diagrams.ts`
- Diagram rendering route: `app/docs/architecture/page.tsx`
- Mermaid renderer: `components/docs/MermaidDiagram.tsx`

## Current Diagram Set

1. System Overview
2. Cryptographic Architecture
3. Transfer Flow
4. Discovery Flow
5. State Management
6. Deployment Architecture

## Update Protocol

1. Update diagram definitions in `lib/docs/architecture-diagrams.ts`.
2. Verify rendering and section copy in `app/docs/architecture/page.tsx`.
3. Re-run documentation verification gate:
   - `npm run verify:documentation:scribe`
4. Store generated verification evidence under `reports/`.

## Freshness Rules

- Any API, transport, cryptographic, or deployment topology change must update at least one impacted diagram.
- Diagram changes must be versioned in the same PR as implementation changes.
