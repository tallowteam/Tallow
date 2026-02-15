# QRCode Linker Policy (AGENT 071)

## Objective
Enforce one-tap QR room connection flow with expiring link payloads and fast scan behavior for website/CLI scope.

## Required Controls
1. Scanner readiness:
- QR scanner MUST expose camera-based scan flow with manual-entry fallback.
- Scan loop interval MUST be at or below 500ms.

2. One-tap connect flow:
- Join UI MUST expose a "Scan QR Code" action.
- Scanner output MUST feed directly into room join flow.
- `/transfer` page MUST parse room-link params and auto-open Internet mode for link-based joins.

3. Expiring link payload:
- Generated room QR/share links MUST include a time-limited expiry parameter.
- Room-link intake MUST reject expired links with user-visible error.

4. Release gate:
- `npm run verify:qrcode:linker` MUST pass in CI and release workflows.

## Evidence Anchors
- `components/transfer/QRScanner.tsx`
- `components/transfer/RoomCodeConnect.tsx`
- `app/transfer/page.tsx`
- `lib/feature-flags/feature-flags.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
