# WEBAUTHN-GATEKEEPER Policy

## Owner
- AGENT 018 - WEBAUTHN-GATEKEEPER

## Mission
Guarantee that biometric/WebAuthn authentication is always an optional second factor (never the sole auth method), attestation is verified for enterprise authenticators, and HSM binding is used for enterprise key storage.

## Required Invariants
- Biometric/WebAuthn = OPTIONAL second factor, NEVER sole authentication method.
- Attestation verification REQUIRED for enterprise/cross-platform authenticators.
- HSM binding for enterprise key storage when available.
- Re-authentication required for key export/rotation operations.
- WebAuthn credentials stored securely with counter tracking.
- Credential IDs are base64url-encoded for transport.
- User verification requirement configurable (preferred by default).
- Policy gate must run in CI and release workflows via `npm run verify:webauthn:gatekeeper`.

## Evidence Surface
- `lib/auth/webauthn.ts`
- `lib/auth/webauthn-store.ts`
- `tests/unit/auth/webauthn-gatekeeper.test.ts`
- `scripts/verify-webauthn-gatekeeper.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
