# Ralph Wiggum Autonomous Build Policy

Generated: 2026-02-13
Owner: AGENT 100 - Ralph Wiggum (Autonomous Build Orchestrator)

## Purpose

Define runtime guardrails for unattended overnight orchestration loops.

## Required Runtime Behavior

1. Runs as an overnight iteration loop.
2. Circuit breaker triggers after 3 consecutive failures.
3. Progress is reported every 10 iterations.
4. Completion emits `<promise>DONE</promise>`.
5. Crypto-modifying operations are denied unless CIPHER sign-off evidence is present.

## Sign-off Gate

Crypto changes require explicit CIPHER (`AGENT 002`) approval:
- `release-signoffs/v0.1.0.json` with approver `002`, or
- `release-signoffs/TEMPLATE.json` during template validation.

## Implementation Mapping

- Runtime orchestrator: `scripts/ralph-wiggum-orchestrator.js`
- Policy verifier: `scripts/verify-ralph-wiggum.js`

## Verification

- Command: `npm run verify:ralph:wiggum`
- Evidence: `reports/ralph-wiggum-*.json` and `reports/ralph-wiggum-*.md`
