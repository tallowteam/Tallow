# Onboard Guide Verification

Generated: 2026-02-13T14:08:32.743Z

## Checks
- [PASS] Onboarding policy, implementation, tests, and workflows exist
- [PASS] Onboarding hook defines progressive guided targets and skip/dismiss actions
- [PASS] Onboarding coach exposes guided and skippable controls
- [PASS] Transfer page integrates onboarding coach callbacks
- [PASS] Onboarding is covered by unit and e2e tests
- [PASS] Onboarding gate is wired in package scripts and workflows

### Onboarding policy, implementation, tests, and workflows exist
- all required onboarding files are present

### Onboarding hook defines progressive guided targets and skip/dismiss actions
- all required tokens found

### Onboarding coach exposes guided and skippable controls
- all required tokens found

### Transfer page integrates onboarding coach callbacks
- all required tokens found

### Onboarding is covered by unit and e2e tests
- unit and e2e onboarding coverage tokens found

### Onboarding gate is wired in package scripts and workflows
- verify:onboarding:guide: node scripts/verify-onboard-guide.js
- .github/workflows/ci.yml runs onboarding verifier
- .github/workflows/release.yml runs onboarding verifier

## Summary
- Overall: PASS

