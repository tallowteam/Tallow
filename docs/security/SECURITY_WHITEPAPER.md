# Tallow Security Whitepaper

Generated: 2026-02-13
Version: v0.1.0
Owner: AGENT 091 - Documentation Scribe

## 1. Executive Summary

Tallow is a privacy-first file transfer platform that enforces end-to-end encryption by default. The architecture assumes signaling, relay, and infrastructure layers are untrusted transport surfaces. Security controls are implemented to preserve confidentiality, integrity, and authenticity across local and internet transfer modes.

## 2. Threat Model Scope

- Local-network transfer sessions.
- Internet peer-to-peer and relay-assisted transfer sessions.
- Onboarding and trust-establishment flows (SAS verification).
- Recovery and incident handling paths.

Reference: `docs/security/THREAT_MODEL_MATRIX.md`.

## 3. Cryptographic Architecture

- Hybrid key exchange and PQC-capable transfer primitives.
- Authenticated encryption with integrity validation before plaintext use.
- Dedicated nonce and key lifecycle controls.
- Sender-key group-room encryption support for multi-member room messaging.

Primary implementation surfaces:
- `lib/crypto/`
- `lib/rooms/room-crypto.ts`
- `lib/transfer/pqc-transfer-manager.ts`

## 4. Trust and Identity Controls

- SAS verification path is available and enforced in trust-state UX.
- Friend trust authorization supports SAS-verified and guest one-time token modes.
- Block list policy enforces immediate connection drops.

Primary implementation surfaces:
- `lib/stores/friends-store.ts`
- `components/transfer/TrustStateStrip.tsx`
- `app/transfer/page.tsx`

## 5. Storage and Data-at-Rest

- Sensitive storage paths use encrypted storage wrappers.
- Transfer templates and scheduled transfers now persist through encrypted-at-rest flows.
- Security fallbacks are explicit and observable in verifier artifacts.

Primary implementation surfaces:
- `lib/storage/secure-storage.ts`
- `lib/transfer/transfer-templates.ts`
- `lib/transfer/scheduled-transfer.ts`

## 6. Operational Security Gates

Release and CI enforce policy verifiers across security-critical domains:

- Checklist ownership
- Stability discipline
- Zero-knowledge release checks
- FIPS compliance checks
- Dependency policy and security scans
- Incident readiness

Primary workflow surfaces:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

## 7. Incident Response

- Critical incidents target rapid response windows.
- Breach communications and postmortem templates are standardized.
- No-blame culture and mandatory evidence capture are documented.

Reference:
- `docs/security/INCIDENT_RESPONSE_POLICY.md`
- `docs/security/INCIDENT_POSTMORTEM_TEMPLATE.md`

## 8. Security Verification Artifacts

Security gates write timestamped artifacts under `reports/` for traceable audit evidence. Example domains include incident readiness, stability discipline, FIPS compliance, and zero-knowledge release verification.

## 9. Compliance Position

Tallow follows zero-knowledge and privacy-minimization principles, with explicit governance controls for release approval and cryptographic sign-off boundaries.

---

This whitepaper is versioned with code and updated via documentation verification gates.
