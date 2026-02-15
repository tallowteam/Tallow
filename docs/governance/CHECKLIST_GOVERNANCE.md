# Checklist Governance

## Canonical Source

The single canonical implementation checklist is:

- `REMAINING_IMPLEMENTATION_CHECKLIST.md`

No parallel checklist may override scope, release criteria, or closure status.

## Ownership Model

Each checklist section maps to one accountable owner group:

| Section | Owner Group | Evidence Directory |
| --- | --- | --- |
| Team execution (A) | Directorate owners | `reports/` and `docs/` |
| Production gates (B) | QA + Ops | `reports/` |
| Sign-off chain (C) | Leadership sign-offs | `release-signoffs/` |
| Autonomous controls (F) | Security + Platform + QA | `reports/`, `docs/security/`, `docs/platform/` |

## Evidence Rule

A checklist item can be marked complete only if:

1. Evidence path(s) are attached in the line item.
2. Evidence is reproducible from scripts/tests/workflows in the repository.
3. Any human approval requirement is represented by sign-off artifacts under `release-signoffs/`.

