# Platform Readiness Levels

## Levels

| Level | Label | Meaning |
| --- | --- | --- |
| L0 | Planned | No release claim. Feature work can be in progress behind flags. |
| L1 | Experimental | Basic flow works in dev; not release-eligible. |
| L2 | Beta | Core flows pass required tests; limited release audiences only. |
| L3 | Production Ready | Mandatory platform profile satisfied and release-eligible. |

## Minimum Pass Profile

A platform can only be marked `L3` when all of the following are true:

1. Core transfer flow passes (`connect -> send -> receive -> verify`).
2. Security gates pass (`security:check` with zero critical/high and `security:audit` with zero vulnerabilities).
3. Reliability gates pass (resume checkpoint tests + 1GB release benchmark).
4. Accessibility/responsive gates pass for web-facing surfaces.
5. Platform-specific mandatory capabilities from `docs/platform/PARITY_MATRIX.md` are complete.

## Release Notes Requirement

Every release note must include a `Platform Readiness` section listing each platform and its level.

Template: `docs/release/RELEASE_NOTES_TEMPLATE.md`.

