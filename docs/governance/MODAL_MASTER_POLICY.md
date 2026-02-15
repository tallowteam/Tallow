# Modal Master Policy (AGENT 042)

This policy defines the release-blocking requirements for modal safety and power-user command access.

## Required Behaviors

1. Modals must trap focus while open.
2. Escape must close non-blocking modals.
3. Backdrop click must close non-critical modals.
4. Destructive actions must require explicit confirmation via a confirmation dialog.
5. A command palette must be available for power users through `Ctrl/Cmd + K`.

## Enforcement Scope

- `components/ui/Modal.tsx`
- `components/ui/ConfirmDialog.tsx`
- `components/transfer/TransferCommandPalette.tsx`
- `app/transfer/page.tsx`
- `components/transfer/FileActions.tsx`
- `components/ui/Modal.test.tsx`
- `tests/unit/components/transfer/TransferCommandPalette.test.tsx`

## Verification

- Gate command: `npm run verify:modal:master`
- Verifier: `scripts/verify-modal-master.js`
- Expected artifacts: `reports/modal-master-verification-<timestamp>.json` and `.md`
