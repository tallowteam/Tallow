# Onboard Guide Policy

## Scope

This policy enforces AGENT 045 release expectations for first-use onboarding on the transfer experience.

## Mandatory Requirements

- First-time onboarding must use progressive disclosure and reveal one step at a time.
- Onboarding must remain skippable at any point in the flow.
- A "remind me later" dismissal path must exist without forcing completion.
- Onboarding must guide the first transfer path using mode selection, device selection, and drop zone steps.
- Onboarding checks must be enforced by automated verification in CI and release workflows.

## Evidence Requirements

- Onboarding hook and coach implementation:
  - `lib/hooks/use-onboarding.ts`
  - `components/transfer/OnboardingCoach.tsx`
  - `app/transfer/page.tsx`
- Automated onboarding tests:
  - `tests/unit/hooks/use-onboarding.test.ts`
  - `tests/e2e/transfer-page.spec.ts` (skippable progressive onboarding test)
- Passing policy verifier artifact:
  - `reports/onboard-guide-verification-*.{json,md}` or `verification-reports/...` fallback.

## Gate Condition

Any regression in progressive onboarding, skippability, or verification coverage is a release-blocking failure for AGENT 045.
