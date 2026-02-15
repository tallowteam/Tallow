# Error Diplomat Policy (AGENT 040)

This policy defines release-blocking requirements for transfer error handling.

## Required Behaviors

1. Transfer errors must not crash the page; runtime failures are isolated by an error boundary with a reset path.
2. Crypto failures must be normalized to user-safe language: `Connection not secure...` with no stack traces.
3. Network failures must provide a retry path.
4. File failures must provide clear user guidance.
5. Every surfaced transfer error must include a recovery action.

## Enforcement Scope

- `app/transfer/page.tsx`
- `app/transfer/page.module.css`
- `lib/transfer/error-diplomat.ts`
- `tests/unit/transfer/error-diplomat.test.ts`

## Verification

- Gate command: `npm run verify:error:diplomat`
- Verifier: `scripts/verify-error-diplomat.js`
- Expected artifacts: `reports/error-diplomat-verification-<timestamp>.json` and `.md`
