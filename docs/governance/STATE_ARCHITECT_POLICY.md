# State Architect Policy (AGENT 052)

## Objective
Enforce clear client/server state boundaries:
- Zustand for client state
- React Query for server state
- No high-risk secret material in Zustand stores
- Shallow selectors for composite Zustand subscriptions

## Required Controls
1. Client state:
- UI/session state MUST be managed in Zustand stores under `lib/stores`.
- Composite store subscriptions MUST use selector objects with `shallow` equality to reduce re-renders.

2. Server state:
- Remote API state MUST use React Query (`@tanstack/react-query`).
- The application MUST provide a shared `QueryClientProvider` at the root layout boundary.
- At least one production page flow MUST consume server state through a React Query hook.

3. Secret boundary:
- Secret classes such as private keys, shared secrets, mnemonic/seed material, and plaintext passwords MUST NOT be stored in Zustand.
- Sensitive persistent data MUST use secure storage utilities.

4. Release gate:
- `npm run verify:state:architect` MUST pass in CI and release verification workflows.

## Evidence Anchors
- `components/theme/query-provider.tsx`
- `lib/hooks/use-feature-flags-query.ts`
- `app/admin/page.tsx`
- `app/transfer/page.tsx`
- `app/settings/page.tsx`
- `lib/stores/*.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
