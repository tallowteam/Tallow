# Copy Operations Program

Last Updated: 2026-02-13
Owner: Agent 045 (Word-Smith) with QA oversight from DC-GOLF (075)
Scope: Product marketing copy, in-app instructional copy, metadata descriptions, and user-facing error/recovery text.

## Goals

1. Keep conversion and trust copy consistent with Tallow voice standards.
2. Maintain clear, testable CTA language across core routes.
3. Continuously improve error and placeholder messaging using real feedback and analytics.

## Execution Cadence

1. Weekly:
- Review user feedback channels.
- Review error/recovery copy findings.

2. Monthly:
- Review metadata descriptions on core routes.
- Review SEO metrics and competitor positioning changes.

3. Quarterly:
- Run full copy audit across landing, transfer, docs, pricing, security, and policy pages.

## Workstreams

### A/B Test CTA Variants

- Primary surfaces: `app/page.tsx`, `app/features/page.tsx`.
- Minimum experiment definition:
1. Hypothesis
2. Variant A/B copy
3. Primary metric (CTR or completed transfer start)
4. Decision deadline and owner

### Monitor User Feedback

- Inputs:
1. `components/feedback/ErrorReporter.tsx` issue submissions
2. Docs/support issue links on settings/docs routes
3. Direct release feedback notes
- Output: weekly triage entry in `docs/governance/COPY_OPERATIONS_TRACKER.md`.

### Update Placeholder Text on Feature Launch

- Trigger: any new transfer/settings panel moving from placeholder to live feature.
- Requirement: update placeholder text to specific expected behavior before merge.
- Verification: `npm run verify:copy:quality`.

### Quarterly Copy Audit

- Run `npm run verify:copy:quality`.
- Record pass/fail and remediation links in tracker.

### Update Meta Descriptions

- Required routes: `/`, `/features`, `/how-it-works`, `/security`, `/privacy`, `/terms`, `/about`, `/docs`, `/pricing`.
- All updates must preserve explicit user benefit and route intent.

### Track SEO Performance

- Baseline metrics:
1. organic sessions
2. branded and non-branded CTR
3. average position for core route keywords
- Record monthly snapshot in tracker.

### Monitor Competitor Positioning

- Watchlist categories:
1. security and privacy claims
2. transfer limits and throttling
3. onboarding friction and account requirements
- Record meaningful claim changes in tracker and adjust comparison copy if needed.

### Gather User Feedback

- Maintain open feedback intake through in-app and docs channels.
- Tag copy-related issues for weekly review.

### Refine Error Messages Using Analytics

- Minimum signals:
1. top error message impressions
2. repeat-error rate
3. recovery action success rate
- Apply copy updates for messages with high repeat rate and low recovery rate.

## Evidence Artifacts

- `reports/copy-quality-*.json`
- `reports/copy-quality-*.md`
- `reports/copy-operations-*.json`
- `reports/copy-operations-*.md`
- `docs/governance/COPY_OPERATIONS_TRACKER.md`

