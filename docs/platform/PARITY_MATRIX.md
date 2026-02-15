# Platform Parity Matrix

## Scope

This matrix defines mandatory versus optional capability requirements before claiming platform parity.

Readiness levels are defined in `docs/platform/RELEASE_READINESS_LEVELS.md`.

## Capability Matrix

| Capability | Web | PWA | Browser Extension | iOS | Android | Desktop | CLI | Requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Encrypted file transfer | Mandatory | Mandatory | Optional | Mandatory | Mandatory | Mandatory | Mandatory | Core |
| NAT/relay fallback | Mandatory | Mandatory | Optional | Mandatory | Mandatory | Mandatory | Mandatory | Core |
| Resume from checkpoint | Mandatory | Mandatory | Optional | Mandatory | Mandatory | Mandatory | Mandatory | Core |
| Accessibility keyboard support | Mandatory | Mandatory | Optional | N/A | N/A | Mandatory | N/A | Core |
| QR link flow | Mandatory | Mandatory | Optional | Mandatory | Mandatory | Mandatory | Optional | Optional |
| NFC pairing | Optional | Optional | N/A | Optional | Optional | N/A | N/A | Optional |
| Clipboard share | Mandatory | Mandatory | Optional | Optional | Optional | Mandatory | Optional | Optional |
| Share-sheet integration | Optional | Optional | Optional | Optional | Optional | Optional | N/A | Optional |

## Feature-Flag Staging

Native and OS-specific integrations are staged with feature flags:

| Feature | Flag Key | Default |
| --- | --- | --- |
| Share-sheet integrations | `share_sheet_integrations` | `false` |
| NFC pairing | `nfc_pairing` | `false` |
| QR linking rollout | `qr_linking` | `false` |
| Clipboard sharing rollout | `clipboard_sharing` | `false` |
| Browser extension API | `browser_extension_api` | `true` |

Flag definitions are enforced by:

- `lib/feature-flags/feature-flags.ts`
- `app/api/flags/route.ts`

