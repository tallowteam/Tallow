# Quick Task 001: Deploy Tallow to Synology NAS + Cloudflare

## Goal
Deploy Tallow to `tallow.manisahome.com` using Synology NAS hosting with Cloudflare CDN/DNS, while preserving all security/privacy features.

## Context
- **Target Domain:** `tallow.manisahome.com`
- **NAS IP:** 192.168.4.3
- **Sync Script:** Already exists at `.\sync-to-nas.ps1`
- **Docker Config:** Already exists (`docker-compose.yml`, `Dockerfile`, `Dockerfile.signaling`)

## Security Features to Preserve
1. ✅ Post-Quantum Cryptography (Kyber + X25519) - Client-side, no changes needed
2. ✅ SAS Verification (MITM protection) - Works via signaling server
3. ✅ Traffic Obfuscation - Client-side, no changes needed
4. ✅ E2E Encryption (AES-256-GCM) - Client-side, no changes needed
5. ✅ P2P Direct Transfers - WebRTC, files never touch server

---

## Tasks

### Task 1: Update Docker Configuration for Production ⬜
**Files:** `docker-compose.yml`

Update environment variables for production domain:
- `SIGNALING_SERVER_URL=wss://tallow.manisahome.com/signaling`
- `ALLOWED_ORIGINS=https://tallow.manisahome.com`

### Task 2: Create Comprehensive Deployment Guide ⬜
**Files:** `DEPLOYMENT-GUIDE.md`

Create step-by-step guide covering:
1. Sync files to NAS
2. Build Docker containers
3. Configure Synology reverse proxy
4. Enable WebSocket for signaling
5. Configure SSL certificate
6. Set up router port forwarding
7. Configure Cloudflare DNS
8. Test deployment
9. Troubleshooting

### Task 3: Update DEPLOYMENT.md with Quick Reference ⬜
**Files:** `DEPLOYMENT.md`

Update existing file with:
- Production domain
- Quick command reference
- Architecture diagram

---

## Success Criteria
1. [ ] `docker-compose.yml` has correct production URLs
2. [ ] `DEPLOYMENT-GUIDE.md` provides complete step-by-step instructions
3. [ ] Guide covers WebSocket configuration (critical for P2P)
4. [ ] Security features preservation documented
5. [ ] Architecture diagram shows traffic flow
