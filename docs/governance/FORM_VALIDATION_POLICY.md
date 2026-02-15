# Form Validation Policy

## Purpose

All governed forms use one shared validation and accessibility policy for:

- validation messages,
- failed-submit focus management,
- and user-visible error channels.

## Shared Policy Module

- `lib/forms/form-policy.ts`

## Governed Form Scope

- `docs/governance/FORM_POLICY_SCOPE.json`

## Enforcement Rules

1. Governed forms must import `@/lib/forms/form-policy`.
2. Browser `alert()` cannot be used for validation.
3. Fields must expose labels (`<label ...>` or component `label=` prop).
4. Errors must surface via accessible channel (`role="alert"` or component error prop).
5. Failed validation must move focus to the first actionable field.

## Enforcement

- Verification command: `npm run verify:forms:policy`
- CI enforcement: `.github/workflows/ci.yml` (`form-policy`)
- Release enforcement: `.github/workflows/release.yml` (`form-policy`)
