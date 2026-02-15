# Incident Response Policy

Last Updated: 2026-02-13

## Purpose

This policy defines mandatory response, notification, and post-incident requirements for TALLOW security incidents.

## Severity and Response SLA

- `P0 (critical)`: Initial response and escalation within `15 minutes`.
- `P1 (high)`: Initial response within `60 minutes`.
- `P2 (medium)`: Initial response within `4 hours`.
- `P3 (low)`: Initial response within `24 hours`.

## Breach Notification SLA

- Any confirmed or probable data breach requires external notification workflow completion within `72h` of confirmed discovery.
- Notification workflow includes legal/compliance review, affected-user notice, and regulator-ready incident summary package.
- Evidence of notification timing must be attached to the release/incident artifact set.

## Mandatory Incident Lifecycle

Every incident must pass through these states:

1. `detected`
2. `investigating`
3. `contained`
4. `resolved`

Required controls:

- Escalation path must be explicit for critical/high incidents.
- Incident owner and deputy must be recorded at detection time.
- Evidence capture must begin at detection and continue through containment.

## Post-Mortem Requirement

- Every incident receives a post-mortem, regardless of severity.
- Post-mortem due date: within 5 business days of incident resolution.
- Action items must have owners and due dates.
- Re-validation check must be scheduled for all remediation changes.

## No-Blame Culture

Incident process is explicitly no-blame:

- Focus is on system and process improvements, not individual fault.
- Language in post-mortems must remain factual and corrective.
- Escalation and retrospective documents must avoid personal attribution as root cause.

## Automation and Evidence

- Rollback failures in deployment automation must auto-open an incident issue.
- Incident readiness verification must run in CI and release workflows.
- Evidence artifacts are generated under `reports/incident-readiness-*.{json,md}`.
