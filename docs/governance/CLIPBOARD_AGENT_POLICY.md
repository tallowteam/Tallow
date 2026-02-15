# Clipboard Agent Policy (AGENT 072)

## Objective
Enforce clipboard sharing as opt-in and consent-gated, with secure transfer path usage for text/image/file payloads.

## Required Controls
1. Opt-in only:
- Clipboard sharing MUST default to disabled.
- Runtime clipboard-sharing feature flag MUST default to `false`.

2. Explicit consent before send:
- Clipboard payloads MUST require explicit confirmation callback approval before send.
- Missing or declined confirmation MUST block send.
- Auto-send without consent is prohibited.

3. Payload coverage:
- Clipboard flow MUST support text, image, and file payload handling.

4. Encrypted transfer path:
- Clipboard payload dispatch MUST go through the existing transfer queue/orchestrator path where encryption is enabled in transfer runtime.

5. Release gate:
- `npm run verify:clipboard:agent` MUST pass in CI and release workflows.

## Evidence Anchors
- `components/transfer/ClipboardPanel.tsx`
- `lib/clipboard/auto-send.ts`
- `lib/clipboard/clipboard-monitor.ts`
- `app/transfer/page.tsx`
- `lib/feature-flags/feature-flags.ts`
- `tests/unit/clipboard/auto-send-consent.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
