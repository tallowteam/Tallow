---
status: fixing
trigger: "Element type is invalid hydration error on client component pages"
created: 2026-01-31T00:00:00Z
updated: 2026-01-31T00:00:01Z
---

## Current Focus

hypothesis: CONFIRMED - Import mismatch in app/features/page.tsx
test: Compare import statement with actual file/export names
expecting: Import statement references wrong file and wrong export name
next_action: Fix the import to use correct path and component name

## Symptoms

expected: Client pages with 'use client' should hydrate without errors
actual: "Element type is invalid" hydration error occurs after HMR connects
errors: Element type is invalid hydration error
reproduction: Visit /features page
started: Unknown - investigating

## Eliminated

## Evidence

- timestamp: 2026-01-31T00:00:01Z
  checked: app/features/page.tsx import statement
  found: |
    Line 1: import { ClientContent } from './client-content';
    Line 3-5: export default function FeaturesPage() { return <ClientContent />; }
  implication: Page imports ClientContent from non-existent file

- timestamp: 2026-01-31T00:00:01Z
  checked: app/features/ directory contents
  found: |
    - features-content.tsx (exists, exports FeaturesContent)
    - page.tsx (references non-existent client-content.tsx)
    - NO client-content.tsx file exists
  implication: Import path is wrong - file doesn't exist

- timestamp: 2026-01-31T00:00:01Z
  checked: features-content.tsx export
  found: |
    Line 255: export function FeaturesContent()
    Component name is FeaturesContent, not ClientContent
  implication: Even if path was fixed, export name is wrong

- timestamp: 2026-01-31T00:00:01Z
  checked: Homepage (app/page.tsx)
  found: |
    Has 'use client' directive and works fine
    All content is inline, no broken imports
  implication: Homepage works because it doesn't have broken import

- timestamp: 2026-01-31T00:00:01Z
  checked: Other pages (how-it-works, security)
  found: |
    Server components with no 'use client'
    Don't import broken client components
  implication: Other pages work because they're server components

## Resolution

root_cause: |
  app/features/page.tsx has import mismatch:
  - Imports: { ClientContent } from './client-content'
  - Actual file: features-content.tsx
  - Actual export: FeaturesContent

  This causes React to receive undefined as component type during hydration,
  triggering "Element type is invalid" error.

fix: Change import from:
  import { ClientContent } from './client-content';

  To:
  import { FeaturesContent } from './features-content';

  And change JSX from:
  return <ClientContent />;

  To:
  return <FeaturesContent />;

verification:
files_changed: []
