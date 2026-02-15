# CLI Operator Policy (AGENT 065)

## Objective
Enforce a release-gated CLI experience where `tallow send <file>` generates a code phrase and `tallow receive <code>` securely receives the file with clear, simple UX.

## Required Controls
1. Command surface:
- CLI MUST expose `send <file>` and `receive <code>` commands.
- Root help/examples MUST document both commands.

2. Code phrase workflow:
- Send flow MUST generate a human-readable room code when one is not provided.
- Receive flow MUST normalize and validate provided room codes before transfer.

3. Secure transfer handshake:
- Send/receive flows MUST run PAKE handshake before file transfer.
- Hybrid key exchange + final key derivation MUST be present before payload transfer.

4. Operational transfer path:
- Send flow MUST prepare and transmit file payloads.
- Receive flow MUST receive payload and persist output path.
- Local discovery fallback to relay path MUST be available in both directions.

5. Release gate:
- `npm run verify:cli:operator` MUST pass in CI and release workflows.

## Evidence Anchors
- `tallow-cli/internal/cli/root.go`
- `tallow-cli/internal/cli/send.go`
- `tallow-cli/internal/cli/receive.go`
- `tallow-cli/pkg/protocol/codes.go`
- `tallow-cli/pkg/protocol/codes_test.go`
- `tallow-cli/internal/transfer/sender.go`
- `tallow-cli/internal/transfer/receiver.go`
- `tallow-cli/README.md`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
