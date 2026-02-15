# Automation Engineer Security Policy

Generated: 2026-02-13
Owner: AGENT 097 - Automation Engineer

## Purpose

Define mandatory security controls for automation features (scheduled transfers and reusable templates).

## Control Requirements

1. Scheduled transfer execution requires fresh re-authentication within a bounded window.
2. Transfer templates must be encrypted at rest.
3. Scheduled transfer state must be encrypted at rest.
4. Automation flows may not bypass global security defaults (metadata stripping, trust controls, and transport safeguards remain in effect).

## Implementation Mapping

- Re-authentication gating:
  - `lib/transfer/scheduled-transfer.ts`
  - exported status + reauth helpers for runtime checks.
- Encrypted template persistence:
  - `lib/transfer/transfer-templates.ts`
  - `lib/storage/secure-storage.ts`
- Encrypted scheduled-transfer persistence:
  - `lib/transfer/scheduled-transfer.ts`
  - `lib/storage/secure-storage.ts`

## Verification

- Command: `npm run verify:automation:engineer`
- Evidence: `reports/automation-engineer-*.json` and `reports/automation-engineer-*.md`

## CI/Release Gate

Automation policy verification is required in both:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
