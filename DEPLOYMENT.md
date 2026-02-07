# Tallow Deployment Guide

Quick guide to deploy Tallow on Synology NAS with Docker and Cloudflare Tunnel.

## Files Overview

- **Dockerfile** - Multi-stage Next.js standalone build (optimized for minimal size)
- **Dockerfile.signaling** - Signaling/relay server with PQC support
- **docker-compose.yml** - Production stack with health checks and resource limits
- **.dockerignore** - Excludes node_modules, .next, docs, tests from build
- **.env.example** - All environment variables with descriptions
- **deploy/cloudflare-tunnel.md** - Detailed Cloudflare Tunnel setup guide

## Quick Start

### 1. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
- `CLOUDFLARE_TUNNEL_TOKEN` - From Cloudflare Zero Trust dashboard
- `NEXT_PUBLIC_SIGNALING_URL` - wss://relay.yourdomain.com
- `NEXT_PUBLIC_TURN_SERVER` - TURN server URL for NAT traversal
- `ALLOWED_ORIGINS` - https://tallow.yourdomain.com

### 2. Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Verify Health

```bash
# Web app health
curl http://localhost:3000/api/health

# Signaling server health
curl http://localhost:3001/health

# Expected: {"status":"ok",...}
```

### 4. Setup Cloudflare Tunnel

See detailed guide: **deploy/cloudflare-tunnel.md**

Quick summary:
1. Create tunnel at https://one.dash.cloudflare.com/
2. Configure hostnames:
   - `tallow.yourdomain.com` → `http://tallow:3000`
   - `relay.yourdomain.com` → `http://signaling:3001` (enable WebSocket)
3. Copy tunnel token to `.env`
4. Uncomment cloudflared service in `docker-compose.yml`
5. Restart: `docker-compose up -d`

## Architecture

```
Internet
   ↓
Cloudflare Tunnel (HTTPS/WSS)
   ↓
┌─────────────────────────────────────┐
│ Synology NAS (Docker)               │
│                                     │
│  ┌─────────────┐   ┌──────────────┐│
│  │   tallow    │   │  signaling   ││
│  │   :3000     │←→ │    :3001     ││
│  └─────────────┘   └──────────────┘│
│         ↓                  ↓        │
│  Next.js Standalone   Relay Server │
│  (PQC + WebRTC)      (Onion/PQC)   │
└─────────────────────────────────────┘
```

## Docker Images

### tallow:latest
- **Base**: node:20-alpine
- **Size**: ~200MB (multi-stage build)
- **User**: nextjs (non-root)
- **Health**: /api/health endpoint

### tallow-signaling:latest
- **Base**: node:20-alpine
- **Size**: ~150MB
- **User**: relay (non-root)
- **Health**: /health endpoint

## Resource Limits

**tallow**:
- CPU: 0.5-2 cores
- Memory: 512MB-2GB

**signaling**:
- CPU: 0.25-1 core
- Memory: 128MB-512MB

Adjust in `docker-compose.yml` based on your NAS specs.

## Monitoring

### Health Checks

```bash
# Container status
docker-compose ps

# Application health
curl http://localhost:3000/api/health
curl http://localhost:3001/health

# Tunnel status
docker-compose logs cloudflared | grep "Connection registered"
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f tallow
docker-compose logs -f signaling

# Last 100 lines
docker-compose logs --tail=100 tallow
```

## Maintenance

### Update

```bash
git pull
docker-compose build
docker-compose up -d
```

### Backup

```bash
tar czf tallow-backup-$(date +%Y%m%d).tar.gz \
  docker-compose.yml .env Dockerfile*
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Prune unused resources
docker system prune -a
```

## Security Checklist

- [ ] `.env` configured (not committed to Git)
- [ ] API_SECRET_KEY generated (32+ random bytes)
- [ ] TURN server configured
- [ ] FORCE_RELAY=true for IP privacy
- [ ] Firewall blocks direct access to 3000/3001
- [ ] Cloudflare Tunnel token secured
- [ ] HTTPS enforced via Cloudflare
- [ ] Rate limiting enabled in Cloudflare

## Troubleshooting

### Container won't start

```bash
docker-compose logs tallow
# Common: Missing .env, invalid syntax, port conflict
```

### Health check failing

```bash
docker-compose exec tallow wget -O- http://localhost:3000/api/health
```

### Build fails

```bash
docker-compose build --no-cache
```

## Support

- **Cloudflare Setup**: `deploy/cloudflare-tunnel.md`
- **Issues**: GitHub Issues
- **Community**: Cloudflare Community, Synology Forum

## Next Steps

1. ✅ Deploy to Synology NAS
2. ✅ Setup Cloudflare Tunnel
3. ⬜ Configure custom domain
4. ⬜ Test P2P transfers
5. ⬜ Enable monitoring
6. ⬜ Setup automatic backups
