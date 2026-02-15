# State Architect Verification

Generated: 2026-02-13T16:07:17.907Z

## Checks
- [PASS] State policy, React Query integration files, and workflows exist
- [PASS] React Query dependency is declared for server state
- [PASS] Root layout wires QueryClientProvider through QueryProvider
- [PASS] Server state is consumed through React Query hooks in production UI
- [FAIL] Composite Zustand subscriptions use shallow selector equality
- [FAIL] Client state remains centralized in Zustand stores
- [PASS] High-risk secrets are not stored in Zustand store files
- [PASS] State architect gate is wired in package scripts and workflows

### State policy, React Query integration files, and workflows exist
- all required state architect files are present

### React Query dependency is declared for server state
- @tanstack/react-query: ^5.90.21

### Root layout wires QueryClientProvider through QueryProvider
- query provider is created and wrapped at root layout

### Server state is consumed through React Query hooks in production UI
- React Query hook + admin page usage verified

### Composite Zustand subscriptions use shallow selector equality
- transfer page missing shallow import
- settings page missing shallow import

### Client state remains centralized in Zustand stores
- not a zustand store file: lib/stores/index.ts
- not a zustand store file: lib/stores/storage.ts

### High-risk secrets are not stored in Zustand store files
- no forbidden secret markers detected in lib/stores

### State architect gate is wired in package scripts and workflows
- verify:state:architect: node scripts/verify-state-architect.js
- .github/workflows/ci.yml runs state architect verification
- .github/workflows/release.yml runs state architect verification

## Summary
- Overall: FAIL

