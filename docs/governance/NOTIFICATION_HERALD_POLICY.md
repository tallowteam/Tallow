# Notification Herald Policy (AGENT 041)

## Objective
Enforce consistent, actionable, privacy-respecting notification behavior for transfer-critical UX.

## Required Controls
1. Success and error semantics:
- Success notifications MUST use success variants for completion flows.
- Error notifications MUST be persistent for actionable failures (`duration: Infinity` or explicit action-driven dismissal path).

2. Transfer request quality:
- Incoming transfer requests MUST include sender context and file information.
- Incoming transfer requests MUST expose explicit accept/reject behavior.

3. Anti-spam discipline:
- Related notification events MUST be grouped/de-duplicated for bursty traffic.
- Connection/transfer notifications MUST use grouping state before emitting browser-level notifications.

4. Rich notification payload:
- Toasts MUST support structured preview payloads for file/image/transfer contexts.
- Action buttons MUST be supported for recovery flows (retry, accept, reject, view).

5. Release gate:
- `npm run verify:notification:herald` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/hooks/use-notifications.ts`
- `lib/utils/notification-manager.ts`
- `components/ui/Toast.tsx`
- `tests/unit/hooks/use-notifications.test.ts`
- `components/ui/Toast.test.tsx`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
