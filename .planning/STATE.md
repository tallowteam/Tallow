# Tallow - Project State

## Current Position
- **Phase:** COMPLETED (Security Fix Milestone)
- **Status:** Ready for deployment
- **Last Action:** Quick task 001 completed - Deployment configuration

## Completed Phases

### Phase 1: Core Crypto Fix ✅
- [x] Fixed hash function (now returns actual SHA-256 via @noble/hashes)
- [x] Implemented Kyber key generation via pqc-kyber package
- [x] Implemented hybrid encapsulation/decapsulation (Kyber + X25519)
- [x] Implemented HKDF key derivation for session keys
- [x] Fixed key serialization/deserialization

### Phase 2: File Encryption Fix ✅
- [x] Updated file encryption to use HKDF
- [x] Fixed password-based encryption with proper salt
- [x] Fixed TypeScript compatibility with Web Crypto API

### Phase 3: Transfer Integration ✅
- [x] Updated transfer manager to use new crypto types
- [x] Fixed chunk handling with proper nonce/hash preservation
- [x] Fixed callback signatures in hooks

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Deploy to Synology NAS + Cloudflare | 2026-01-21 | — | [001-deploy-to-synology-cloudflare](./quick/001-deploy-to-synology-cloudflare/) |
| 003 | Multi-device responsive UX optimization | 2026-01-28 | 23e1b30 | [003-multi-device-responsive-ux](./quick/003-multi-device-responsive-ux/) |
| 004 | Visual regression snapshot update | 2026-01-28 | — | [004-visual-regression-update](./quick/004-visual-regression-update/) |

## Files Modified (Security Fix)
- `lib/crypto/pqc-crypto.ts` - Complete rewrite with proper crypto
- `lib/crypto/file-encryption-pqc.ts` - Updated for new crypto API
- `lib/transfer/pqc-transfer-manager.ts` - Fixed type integration
- `lib/transfer/file-encryption.ts` - Fixed Web Crypto compatibility
- `lib/hooks/use-pqc-transfer.ts` - Fixed callback signatures

## Files Modified (Deployment)
- `docker-compose.yml` - Production URLs for tallow.manisahome.com
- `DEPLOYMENT.md` - Updated with quick reference and architecture
- `DEPLOYMENT-GUIDE.md` - New comprehensive deployment guide

## Critical Fixes Applied
1. **Hash function** - Was returning zeros, now uses SHA-256
2. **Kyber/ML-KEM** - Was not implemented, now uses pqc-kyber
3. **Key derivation** - Was weak, now uses HKDF
4. **Hybrid encryption** - Properly combines Kyber + X25519

## Build Status
```
✓ Compiled successfully
✓ TypeScript checks passed
✓ Static pages generated (11/11)
```

## Accumulated Context

### Pending Todos
- 1 todo pending (use `/gsd:check-todos` to review)

### Completed Todos
- Security audit checklist — PASSED 19/20 checks (2026-01-19)
- Deployment configuration — COMPLETE (2026-01-21)

### Blockers/Concerns
(None active)

## Session Continuity
Last activity: 2026-01-28 - Completed quick task 004: Visual regression snapshot update

## Next Steps
1. Run deployment steps from `DEPLOYMENT.md` or `DEPLOYMENT-GUIDE.md`
2. Configure Synology reverse proxy with WebSocket headers
3. Set up Cloudflare DNS
4. Test at https://tallow.manisahome.com
