# Flow Navigator Policy (AGENT 044)

## Objective
Ensure users always have clear orientation and predictable navigation behavior across transfer and core routes.

## Required Controls
1. Navigation surface exclusivity:
- Transfer UI MUST expose desktop sidebar navigation on desktop breakpoints.
- Transfer UI MUST expose mobile bottom navigation on mobile breakpoints.
- Desktop and mobile navigation surfaces MUST never be visible at the same time.

2. Orientation cues:
- Active transfer mode MUST expose `aria-current`.
- Active panel navigation MUST expose tab semantics (`role="tab"` + `aria-selected`).

3. Back-button behavior:
- Browser history navigation (back) MUST correctly return users to prior routes in primary flows.

4. Verification and release gate:
- E2E coverage MUST include nav-surface exclusivity and browser-back behavior.
- `npm run verify:flow:navigator` MUST pass in CI and release workflows.

## Evidence Anchors
- `components/transfer/Sidebar.tsx`
- `components/transfer/sidebar.module.css`
- `tests/e2e/transfer-page.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
