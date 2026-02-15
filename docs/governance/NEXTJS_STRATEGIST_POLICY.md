# Next.js Strategist Policy (AGENT 051)

## Objective
Enforce App Router architecture discipline:
- Server Components by default
- `'use client'` only when required
- `loading.tsx` and `error.tsx` coverage for every page route
- Middleware-based authentication guard for privileged routes

## Required Controls
1. Client boundaries:
- Static documentation routes MUST remain Server Components.
- Client Components are allowed only when browser APIs, React client hooks, or client-only dynamic rendering are required.

2. Route resilience:
- Every route segment that contains a `page.tsx` MUST also define `loading.tsx` and `error.tsx` in the same segment.
- Root route (`app/page.tsx`) MUST have `app/loading.tsx` and `app/error.tsx`.

3. Middleware auth:
- `middleware.ts` MUST protect `/admin` routes with an auth key gate outside localhost development environments.
- Middleware MUST continue to emit request tracing headers.

4. Release gate:
- `npm run verify:nextjs:strategist` MUST pass in CI and release verification workflows.

## Evidence Anchors
- `middleware.ts`
- `app/**/page.tsx`, `app/**/loading.tsx`, `app/**/error.tsx`
- `app/docs/guides/**/page.tsx` (server-default exemplars)
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
