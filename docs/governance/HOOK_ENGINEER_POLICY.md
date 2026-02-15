# Hook Engineer Policy (AGENT 054)

## Objective
Enforce composable, cleanup-safe hook architecture for transfer-critical React hooks.

## Required Controls
1. Core hook typing:
- `useTransferOrchestrator`, `useRoomConnection`, and `useP2PConnection` MUST declare explicit exported return types.

2. Hook documentation:
- Core WebRTC hooks MUST include JSDoc blocks describing behavior and outputs.

3. Cleanup discipline:
- Hooks that register side effects MUST return cleanup functions from `useEffect`.
- WebRTC hooks MUST clean up active connections/resources on unmount.

4. Composition boundary:
- Transfer hooks MUST expose control APIs through returned methods and avoid embedding unrelated business flows.
- Direct Zustand `.getState()` access is disallowed in core WebRTC hooks.

5. Release gate:
- `npm run verify:hook:engineer` MUST pass in CI and release workflows.

## Evidence Anchors
- `lib/hooks/use-transfer-orchestrator.ts`
- `lib/hooks/use-room-connection.ts`
- `lib/hooks/use-p2p-connection.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
