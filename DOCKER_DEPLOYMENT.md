# Tallow Docker Deployment Guide

Comprehensive guide for deploying Tallow using Docker and Docker Compose with support for multi-architecture builds and Synology NAS deployments.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Multi-Architecture Builds](#multi-architecture-builds)
4. [Docker Compose Deployment](#docker-compose-deployment)
5. [Synology NAS Deployment](#synology-nas-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Security Best Practices](#security-best-practices)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Docker Buildx (for multi-architecture builds)
- 4GB RAM minimum
- 10GB disk space

### Local Development Deployment

```bash
# Build for local architecture only
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Verify health
curl http://localhost:3000/api/health
curl http://localhost:3001/health
```

### Production Multi-Architecture Build

```bash
# Setup Docker buildx builder
bash scripts/build-multiarch.sh --setup

# Build and push to registry
bash scripts/build-multiarch.sh \
  --push \
  --registry ghcr.io \
  --username youruser \
  --password $GITHUB_TOKEN \
  --tag v0.1.0

# Deploy
docker-compose up -d
```

## Architecture Overview

### Services Architecture

```
┌─────────────────────────────────────────────────┐
│          Internet / Users                        │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐      ┌───────▼────┐
   │ Tallow    │      │ Signaling  │
   │ (3000)    │      │ (3001)     │
   │ Next.js   │◄─────► WebSocket  │
   │ App       │      │ Relay      │
   └──────────┘      └────────────┘
        │                   │
        └────────┬──────────┘
                 │
        ┌────────▼────────┐
        │  tallow-network │
        │   (Docker)      │
        └─────────────────┘
```

### Container Specifications

| Service | Image | Port | CPU | Memory | Architecture |
|---------|-------|------|-----|--------|--------------|
| tallow | tallow:latest | 3000 | 0.5-2 | 512M-2G | AMD64, ARM64 |
| signaling | tallow-signaling:latest | 3001 | 0.25-1 | 128M-512M | AMD64, ARM64 |

## Multi-Architecture Builds

### Setup Docker Buildx

Docker Buildx enables building images for multiple architectures (AMD64, ARM64, etc.)

```bash
# Setup buildx builder
bash scripts/build-multiarch.sh --setup

# Verify builder
docker buildx ls

# You should see output like:
# NAME/NODE          DRIVER/ENDPOINT             STATUS   PLATFORMS
# multiarch-builder  docker-container
#   multiarch-builder0 unix:///var/run/docker.sock running linux/amd64, linux/arm64, ...
```

### Build Targets

#### 1. Local Development (Single Architecture)

```bash
# Build for current architecture (amd64 on x86_64)
bash scripts/build-multiarch.sh --load

# Or with Docker Compose
docker-compose build
```

#### 2. Multi-Architecture Build (No Push)

```bash
# Build for both amd64 and arm64 (cache only, no output)
bash scripts/build-multiarch.sh \
  --platforms linux/amd64,linux/arm64
```

#### 3. Build and Push to Registry

```bash
# Push to Docker Hub
bash scripts/build-multiarch.sh \
  --push \
  --registry docker.io \
  --username myuser \
  --password $DOCKER_PASSWORD \
  --tag latest

# Push to GitHub Container Registry
bash scripts/build-multiarch.sh \
  --push \
  --registry ghcr.io \
  --username myuser \
  --password $GITHUB_TOKEN \
  --tag v0.1.0

# Push to private registry
bash scripts/build-multiarch.sh \
  --push \
  --registry registry.example.com \
  --username myuser \
  --password $REGISTRY_PASSWORD \
  --tag latest
```

#### 4. Tagged Releases

```bash
# Build and push version tag
bash scripts/build-multiarch.sh \
  --push \
  --registry ghcr.io \
  --username myuser \
  --password $GITHUB_TOKEN \
  --tag v0.1.0

# Build and push mainline (adds git commit hash)
bash scripts/build-multiarch.sh \
  --push \
  --mainline true
```

### Dockerfile Multi-Stage Optimization

The Dockerfile uses three stages for optimal image size:

1. **deps** - Installs dependencies with build tools
2. **builder** - Builds Next.js application in production mode
3. **runner** - Minimal production image with only runtime dependencies

```dockerfile
Stage 1 (deps):          ~800MB
Stage 2 (builder):       ~2.5GB (temporary, not in final image)
Stage 3 (runner):        ~200MB (final image size)
```

## Docker Compose Deployment

### Configuration Files

- **docker-compose.yml** - Main production configuration
- **docker-compose.synology.yml** - Synology NAS overrides
- **.dockerignore** - Excludes unnecessary files from build context

### Basic Deployment

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs tallow
docker-compose logs signaling

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Service Management

```bash
# Start specific service
docker-compose up -d tallow

# Restart service
docker-compose restart signaling

# View service logs with follow
docker-compose logs -f tallow

# Execute command in container
docker-compose exec tallow sh
docker-compose exec tallow npm run health
```

## Synology NAS Deployment

### Prerequisites

1. Synology NAS with DSM 7.0+
2. Docker package installed from Synology Package Center
3. SSH access (optional, for command-line deployment)

### Setup Procedure

#### Option A: Command Line (Recommended)

```bash
# Connect to NAS
ssh admin@192.168.1.100

# Create data directories
mkdir -p /volume1/docker/tallow/{data,relay-data,cache}

# Clone Tallow repository
cd /volume1/docker/
git clone https://github.com/your-org/tallow.git
cd tallow

# Create .env file
cp .env.example .env
# Edit .env with your settings
nano .env

# Deploy with Synology-specific overrides
docker-compose -f docker-compose.yml -f docker-compose.synology.yml up -d

# Verify deployment
docker-compose ps
```

#### Option B: Web UI (Using Portainer)

1. Install Portainer from Synology Package Center
2. Access Portainer at `https://nas-ip:9000`
3. Create new stack with docker-compose.yml content
4. Use docker-compose.synology.yml as override

### Synology-Specific Configuration

```yaml
# docker-compose.synology.yml adjusts:
# - CPU/Memory limits (appropriate for NAS)
# - Volume paths (/volume1/docker/tallow/*)
# - Logging sizes (reduced for storage)
# - Network settings (optimized for Synology)
```

**Key Differences from Standard Deployment:**

| Setting | Standard | Synology |
|---------|----------|----------|
| CPU Limit (tallow) | 2 | 1.5 |
| Memory Limit (tallow) | 2G | 1.5G |
| CPU Limit (signaling) | 1 | 0.5 |
| Memory Limit (signaling) | 512M | 256M |
| Log Size | 10m | 5m |
| Log Files | 3 | 2 |

### Synology Volume Paths

Common volume paths on Synology:
- **/volume1** - Primary storage
- **/volume2** - Secondary storage (if available)
- **/volumeUSB1** - USB drives

Example custom setup:
```bash
# Use secondary volume if available
DATA_VOLUME_PATH=/volume2/docker/tallow/data \
RELAY_DATA_PATH=/volume2/docker/tallow/relay-data \
CACHE_VOLUME_PATH=/volume2/docker/tallow/cache \
docker-compose -f docker-compose.yml -f docker-compose.synology.yml up -d
```

## Environment Configuration

### Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

#### Essential Variables

```env
# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Signaling/Relay
NEXT_PUBLIC_SIGNALING_URL=ws://signaling:3001
NEXT_PUBLIC_FORCE_RELAY=true
NEXT_PUBLIC_ALLOW_DIRECT=false

# TURN Server (optional)
NEXT_PUBLIC_TURN_SERVER=stun:turn.example.com
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=

# Email Integration (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=Tallow <noreply@tallow.app>

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Security
API_SECRET_KEY=
ALLOWED_ORIGINS=https://tallow.app,https://www.tallow.app

# Analytics
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

### Docker Compose Env Files

Place environment variables in `.env` file:

```bash
# Production setup
docker-compose --env-file .env up -d

# Synology setup
docker-compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.synology.yml \
  up -d
```

## Security Best Practices

### 1. Non-Root Users

All containers run as non-root users:
- Tallow app: `nextjs:nodejs` (UID 1001)
- Signaling: `relay:relay` (UID 1001)

### 2. Image Scanning

Scan images for vulnerabilities:

```bash
# Using Trivy
trivy image tallow:latest
trivy image tallow-signaling:latest

# Using Grype
grype tallow:latest
grype tallow-signaling:latest
```

### 3. Network Isolation

- Services communicate via internal network `tallow-network`
- Only necessary ports exposed:
  - 3000 (HTTP)
  - 3001 (WebSocket)

### 4. Secrets Management

```bash
# Using Docker Secrets (Swarm mode)
echo "$STRIPE_SECRET_KEY" | docker secret create stripe_key -

# Using environment files
chmod 600 .env
docker-compose --env-file .env up -d

# Using Docker BuildKit secrets
docker buildx build \
  --secret API_KEY=key.txt \
  --secret DB_PASSWORD \
  .
```

### 5. Image Security

```bash
# Sign images with Cosign
cosign sign --key cosign.key tallow:latest

# Sign and verify
cosign sign-blob --key cosign.key tallow:latest > signature.sig
cosign verify-blob --key cosign.pub --signature signature.sig tallow:latest
```

### 6. Registry Security

```bash
# Use private registries
docker buildx build \
  --push \
  --registry private-registry.example.com \
  --tag myapp:latest \
  .

# Configure pull-through cache
# See: https://docs.docker.com/registry/recipes/mirror/
```

## Monitoring & Health Checks

### Health Endpoints

All containers expose health check endpoints:

```bash
# Application health
curl http://localhost:3000/api/health
# Response: { "status": "ok" }

# Signaling server health
curl http://localhost:3001/health
# Response: { "status": "ok" }
```

### Docker Health Status

```bash
# Check service health
docker-compose ps

# Check specific container
docker inspect tallow-app --format='{{.State.Health}}'

# View health check logs
docker inspect tallow-app --format='{{json .State.Health.Log}}' | jq
```

### Monitoring Stack (Optional)

Add Prometheus and Grafana for metrics:

```yaml
# docker-compose.monitoring.yml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  depends_on:
    - tallow
    - signaling

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"  # Note: conflicts with signaling port
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  depends_on:
    - prometheus
```

### Logs Management

```bash
# View logs with timestamp
docker-compose logs --timestamps tallow

# Follow logs
docker-compose logs -f signaling

# Logs from specific time range
docker-compose logs --since 1h tallow

# Export logs
docker-compose logs > deployment.log

# Tail last 50 lines
docker-compose logs --tail=50 tallow
```

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to Docker daemon"

```bash
# Solution: Start Docker
sudo systemctl start docker

# Or on macOS
open /Applications/Docker.app

# Check Docker status
docker info
```

#### 2. "buildx: command not found"

```bash
# Solution: Install Docker Buildx
curl -L -o /tmp/buildx-linux-amd64 \
  https://github.com/docker/buildx/releases/download/v0.12.0/buildx-v0.12.0.linux-amd64
chmod +x /tmp/buildx-linux-amd64
mkdir -p ~/.docker/cli-plugins
mv /tmp/buildx-linux-amd64 ~/.docker/cli-plugins/docker-buildx
```

#### 3. "No space left on device"

```bash
# Clean Docker images
docker image prune -a

# Clean build cache
docker buildx prune -a

# Check disk usage
docker system df

# Remove everything
docker system prune -a --volumes
```

#### 4. "Port already in use"

```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Or with netstat
netstat -tlnp | grep 3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
# ports:
#   - "3000:3000"  -->  "3002:3000"
```

#### 5. Health check failures

```bash
# Check container logs
docker-compose logs tallow

# Test health endpoint manually
curl -v http://localhost:3000/api/health

# Increase health check timeout
# healthcheck:
#   test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
#   timeout: 20s  # Increased from 10s
#   start_period: 60s  # Increased from 40s
```

#### 6. Out of memory errors

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       memory: 4G  # Increased from 2G

# Reduce memory usage
# NODE_OPTIONS: "--max-old-space-size=2048"
```

### Debug Mode

```bash
# Enable verbose logging
docker-compose config

# Build with verbose output
docker buildx build --verbose .

# Use buildkit progress output
DOCKER_BUILDKIT_PROGRESS=plain docker-compose build

# Run container in debug mode
docker-compose run --entrypoint /bin/sh tallow
```

## Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Validate Dockerfile
docker-compose config

# 2. Build images
docker-compose build

# 3. Run tests
docker-compose run tallow npm run test:ci

# 4. Security scan
trivy image tallow:latest

# 5. Push to registry
bash scripts/build-multiarch.sh --push

# 6. Verify images
docker pull registry/tallow:latest
docker inspect registry/tallow:latest
```

### Deployment Steps

#### 1. Prepare Environment

```bash
# Create production .env
cp .env.example .env.production
# Edit with production values
nano .env.production

# Create directories
mkdir -p /data/tallow/{data,relay-data,cache}
chmod 755 /data/tallow/{data,relay-data,cache}
```

#### 2. Deploy Services

```bash
# Production deployment
docker-compose \
  --env-file .env.production \
  -f docker-compose.yml \
  up -d

# Verify services are running
docker-compose ps

# Check health
docker-compose exec tallow curl http://localhost:3000/api/health
```

#### 3. Post-Deployment Verification

```bash
# Test application endpoints
curl -v http://localhost:3000/

# Test API
curl http://localhost:3000/api/health

# Test WebSocket
curl http://localhost:3001/health

# View logs
docker-compose logs --tail=50

# Monitor metrics
curl http://localhost:3000/api/metrics
```

### Updates and Rollbacks

```bash
# Pull latest images
docker-compose pull

# Update specific service
docker-compose up -d --no-deps --build tallow

# Rollback to previous version
docker-compose up -d --no-deps tallow:previous-tag

# View deployment history
docker image ls | grep tallow

# Remove old images
docker image prune
```

### Backup Strategy

```bash
# Backup volumes
docker run --rm \
  -v tallow-data:/data \
  -v /backups:/backup \
  busybox tar czf /backup/tallow-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup configuration
tar czf backup-config-$(date +%Y%m%d).tar.gz \
  docker-compose.yml \
  .env.production

# Restore from backup
docker run --rm \
  -v tallow-data:/data \
  -v /backups:/backup \
  busybox tar xzf /backup/tallow-data-20240206.tar.gz -C /data
```

## Reference

### Docker Commands

```bash
# Image management
docker image ls                    # List images
docker image inspect tallow:latest # Image details
docker image prune                 # Remove unused images

# Container management
docker ps                         # List running containers
docker ps -a                      # List all containers
docker logs <container>           # View container logs
docker exec <container> <cmd>     # Execute command in container

# Compose commands
docker-compose ps                 # Service status
docker-compose logs               # View all logs
docker-compose exec <svc> <cmd>  # Execute in service
docker-compose restart            # Restart services
docker-compose down               # Stop and remove services
```

### Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Buildx](https://github.com/docker/buildx)
- [Multi-arch Build Guide](https://docs.docker.com/build/building/multi-platform/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Synology Docker Guide](https://www.synology.com/en-us/knowledgebase/DSM/help/Docker/docker)

---

Last Updated: 2025-02-06
