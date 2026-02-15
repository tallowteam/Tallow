# Marketing Operative Policy

## Objective
Ensure the public landing experience meets growth, trust, and performance baselines.

## Required Controls
- Landing page first-contentful experience remains under 2 seconds.
- Landing page SEO score remains at or above 90.
- Landing page layout remains mobile-first with explicit small-screen breakpoints.
- Security messaging is visible in primary marketing content.
- Trust signals (encryption, zero-knowledge, open-source posture) remain visible on page.

## Source of Truth
- `app/page.tsx`
- `app/page.module.css`
- `reports/lighthouse/lighthouse-report-*.md`

## Enforcement
- `npm run verify:marketing:operative`
- CI and release workflows must include the `marketing-operative` verification job.
