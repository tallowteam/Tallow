# Tallow Deployment - Synology NAS + Cloudflare CDN

> **Production URL:** `https://tallow.manisahome.com`

## Quick Reference

```powershell
# Step 1: Sync to NAS (from Windows)
.\sync-to-nas.ps1

# Step 2: SSH to NAS and deploy
ssh admin@192.168.4.3
cd /volume1/docker/tallow
sudo docker compose up -d --build

# Step 3: Verify containers
sudo docker ps
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN                            │
│  • tallow.manisahome.com → Your Public IP                   │
│  • SSL Termination  • DDoS Protection  • WebSockets ON      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Port 443
┌─────────────────────────────────────────────────────────────┐
│                       YOUR ROUTER                            │
│              Port Forward: 443 → 192.168.4.3                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               SYNOLOGY NAS (192.168.4.3)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              REVERSE PROXY (Port 443)                  │ │
│  │  /          → localhost:3000 (Tallow App)              │ │
│  │  /signaling → localhost:3001 (WebSocket + WS Headers)  │ │
│  └────────────────────────────────────────────────────────┘ │
│                    │                │                       │
│                    ▼                ▼                       │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   TALLOW CONTAINER   │  │   SIGNALING CONTAINER        │ │
│  │   Next.js (3000)     │  │   Socket.IO (3001)           │ │
│  │   • Web UI           │  │   • WebRTC signaling only    │ │
│  │   • API routes       │  │   • No file data             │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

               P2P FILE TRANSFER (Direct WebRTC)
    User A ◄────────── Encrypted via PQC ──────────► User B
         🔐 Server never sees file contents 🔐
```

---

## Full Deployment Steps

### 1. Sync Files to NAS
```powershell
# From your local machine
cd c:\Users\aamir\Documents\Apps\File_Sharing\Tallow
.\sync-to-nas.ps1
```

### 2. SSH into Synology & Deploy
```bash
ssh admin@192.168.4.3
cd /volume1/docker/tallow
sudo docker compose up -d --build
```

### 3. Configure Synology Reverse Proxy
1. **Control Panel** → **Login Portal** → **Advanced** → **Reverse Proxy**
2. Create rule for main app:
   - Source: HTTPS, `tallow.manisahome.com`, 443
   - Destination: HTTP, localhost, 3000
3. Create rule for signaling:
   - Source: HTTPS, `tallow.manisahome.com`, 443, Path: `/signaling*`
   - Destination: HTTP, localhost, 3001
   - **IMPORTANT:** Add WebSocket custom headers!

### 4. Configure Router
Forward port 443 TCP → 192.168.4.3:443

### 5. Configure Cloudflare
1. Add A record: `tallow` → Your public IP (Proxied ☁️)
2. SSL/TLS mode: **Full**
3. Network → WebSockets: **ON**

---

## Environment Variables

| Variable | Value | Container |
|----------|-------|-----------|
| `SIGNALING_SERVER_URL` | `wss://tallow.manisahome.com/signaling` | tallow |
| `ALLOWED_ORIGINS` | `https://tallow.manisahome.com` | signaling |

---

## Security Features (All Preserved)

| Feature | Status | Notes |
|---------|--------|-------|
| Post-Quantum Crypto | ✅ | Kyber + X25519, client-side |
| SAS Verification | ✅ | MITM protection via signaling |
| Traffic Obfuscation | ✅ | Client-side padding/decoys |
| E2E Encryption | ✅ | AES-256-GCM, client-side |
| P2P Transfers | ✅ | WebRTC direct, no server touch |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check `docker ps`, restart containers |
| WebSocket fails | Enable WS headers in reverse proxy |
| SSL error | Check Cloudflare SSL mode matches setup |
| Can't connect | Verify port forwarding + DNS proxy |

---

## Updating

```powershell
# 1. Sync from Windows
.\sync-to-nas.ps1
```

```bash
# 2. Rebuild on NAS
ssh admin@192.168.4.3
cd /volume1/docker/tallow
sudo docker compose down
sudo docker compose up -d --build
```
