# Loading Illusionist Policy (AGENT 039)

This policy defines release-blocking requirements for transfer loading states.

## Required Behaviors

1. The transfer route must never render a blank screen while loading.
2. A skeleton status surface must appear immediately with `aria-busy` semantics.
3. Loading sections must stream progressively in defined stages.
4. Skeleton structure must mirror the transfer dashboard layout it replaces.
5. Reduced-motion users must receive a non-animated fallback.

## Enforcement Scope

- `app/transfer/loading.tsx`
- `app/transfer/loading.module.css`
- `tests/unit/components/transfer/TransferPageLoading.test.tsx`

## Verification

- Gate command: `npm run verify:loading:illusionist`
- Verifier: `scripts/verify-loading-illusionist.js`
- Expected artifacts: `reports/loading-illusionist-verification-<timestamp>.json` and `.md`
