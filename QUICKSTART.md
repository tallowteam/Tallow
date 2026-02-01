# Tallow DevOps - Quick Start Guide

Fast reference for deploying and managing Tallow infrastructure.

## One-Line Commands

### Development
```bash
# Linux/macOS
./scripts/deploy-dev.sh

# Windows
.\scripts\deploy-dev.ps1

# Manual
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
# Linux/macOS
./scripts/deploy-prod.sh

# Manual
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
./scripts/deploy-k8s.sh production
```

### Health Checks
```bash
./scripts/health-check.sh dev
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
```

## Environment Setup

### Required Files

**Development**: `.env.local`
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
NEXT_PUBLIC_FORCE_RELAY=false
```

**Production**: `.env.production`
```env
NEXT_PUBLIC_SIGNALING_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443
NEXT_PUBLIC_TURN_USERNAME=xxxxxxxxxxxxx
NEXT_PUBLIC_TURN_CREDENTIAL=xxxxxxxxxxxxx
NEXT_PUBLIC_FORCE_RELAY=true
```

## Common Commands

### Docker Compose

```bash
# View logs
docker-compose logs -f

# Restart service
docker-compose restart tallow

# Stop all
docker-compose down

# Clean everything
docker-compose down -v

# Check status
docker-compose ps
```

### Kubernetes

```bash
# View pods
kubectl get pods -n tallow

# View logs
kubectl logs -f deployment/tallow-app -n tallow

# Scale
kubectl scale deployment/tallow-app --replicas=5 -n tallow

# Rollback
kubectl rollout undo deployment/tallow-app -n tallow

# Port forward
kubectl port-forward deployment/tallow-app 3000:3000 -n tallow
```

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Web App | 3000 | http://localhost:3000 |
| Signaling | 3001 | http://localhost:3001 |
| Redis | 6379 | localhost:6379 |
| TURN | 3478 | localhost:3478 |
| NGINX | 80/443 | http://localhost |

## Health Endpoints

| Endpoint | Purpose | Status Code |
|----------|---------|-------------|
| `/api/health` | Liveness | 200 = OK |
| `/api/ready` | Readiness | 200 = Ready, 503 = Not Ready |
| `/health` (3001) | Signaling | 200 = OK |

## File Structure

```
tallow/
├── app/api/
│   ├── health/route.ts          # Liveness probe
│   └── ready/route.ts           # Readiness probe
├── k8s/                         # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── networkpolicy.yaml
│   └── redis.yaml
├── scripts/                     # Deployment scripts
│   ├── deploy-dev.sh
│   ├── deploy-dev.ps1
│   ├── deploy-prod.sh
│   ├── deploy-k8s.sh
│   └── health-check.sh
├── docker-compose.yml           # Base production config
├── docker-compose.dev.yml       # Development config
├── docker-compose.prod.yml      # Production overrides
├── Dockerfile                   # Production build
├── Dockerfile.dev               # Development build
├── nginx.conf                   # NGINX config
├── DEVOPS.md                    # Full documentation
└── QUICKSTART.md                # This file
```

## Troubleshooting Quick Fixes

### Container Won't Start
```bash
docker-compose logs tallow
docker inspect tallow
```

### Health Check Fails
```bash
curl -v http://localhost:3000/api/health
docker exec tallow env
```

### Port Already in Use
```bash
# Find process
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Stop service
docker-compose down
```

### Clean Start
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

## Production Checklist

- [ ] Create `.env.production` with all required variables
- [ ] Configure TURN server credentials
- [ ] Set up SSL certificates
- [ ] Configure domain DNS
- [ ] Test health endpoints
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Test rollback procedure

## Kubernetes Checklist

- [ ] Configure kubectl context
- [ ] Create namespace
- [ ] Create secrets
- [ ] Update ConfigMap with domain
- [ ] Configure ingress domain
- [ ] Install cert-manager
- [ ] Test autoscaling
- [ ] Configure monitoring

## Resource Needs

### Development
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB

### Production
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 50GB SSD

### Kubernetes
- Nodes: 3+
- CPU: 4 cores/node
- RAM: 8GB/node

## Next Steps

1. Start with development: `./scripts/deploy-dev.sh`
2. Test locally: http://localhost:3000
3. Configure production environment
4. Deploy to staging/production
5. Set up monitoring and alerts

## Documentation

- **Full Guide**: See `DEVOPS.md`
- **Kubernetes**: See `k8s/README.md`
- **Summary**: See `DEPLOYMENT_SUMMARY.md`

## Support

- GitHub Issues: Report bugs
- Health Checks: Run health-check script
- Logs: Check container/pod logs
