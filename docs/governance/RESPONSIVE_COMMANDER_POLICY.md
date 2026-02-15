# Responsive Commander Policy

## Scope

This policy enforces AGENT 049 release expectations for responsive UX discipline.

## Mandatory Requirements

- Responsive E2E coverage must include minimum viewport width `320px`.
- Touch targets in responsive E2E checks must enforce `44px` minimum height for core interactive controls.
- Mode selection must not be hover-only; keyboard activation coverage must exist in transfer E2E tests.
- Mobile-browser project coverage must remain enforced via the E2E infiltration matrix.

## Evidence Requirements

- A passing responsive Chromium run artifact:
  - `reports/responsive-commander-*.json`
- A passing infiltration verifier artifact:
  - `reports/e2e-infiltration-*.json`
- A passing policy verifier artifact:
  - `reports/responsive-commander-verification-*.{json,md}` or `verification-reports/...` fallback.

## Gate Condition

Any regression in the requirements above is a release-blocking failure for AGENT 049.
