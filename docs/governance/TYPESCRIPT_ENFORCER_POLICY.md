# TypeScript Enforcer Policy (AGENT 053)

## Objective
Enforce production type-safety controls for critical transfer and API paths:
- Strict TypeScript compiler flags stay enabled
- No directive-based type suppression in runtime code
- No `as any`/`: any` in security-critical code paths
- API request bodies are validated before use
- Branded key types exist for key-material boundaries

## Required Controls
1. Compiler strictness:
- `tsconfig.json` MUST keep `strict`, `noImplicitAny`, `strictNullChecks`, and `noUncheckedIndexedAccess` enabled.

2. Type-suppression ban:
- `@ts-ignore` and `@ts-expect-error` MUST NOT appear in `app/`, `components/`, or `lib/`.

3. Critical-path `any` restrictions:
- `as any` and `: any` MUST NOT appear in:
  - `app/api/**`
  - `lib/crypto/**`
  - `lib/rooms/**`
  - `lib/hooks/use-p2p-connection.ts`
  - `lib/hooks/use-transfer-orchestrator.ts`

4. API validation discipline:
- Any route using `request.json()` MUST implement request-shape validation through Zod or explicit structural guards before business logic.

5. Key-type separation:
- Branded types for `PublicKey`, `PrivateKey`, and `SharedSecret` MUST exist and be consumed in runtime crypto/handshake code to reduce key-class mixups.

6. Release gate:
- `npm run verify:typescript:enforcer` MUST pass in CI and release workflows.

## Evidence Anchors
- `tsconfig.json`
- `lib/types/crypto-brands.ts`
- `lib/hooks/use-p2p-connection.ts`
- `app/api/**/route.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
