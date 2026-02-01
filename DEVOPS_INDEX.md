# Tallow DevOps - Complete File Index

This document lists all DevOps-related files created for the Tallow project.

## Health Check Endpoints

### API Routes
| File | Purpose | Status Codes |
|------|---------|--------------|
| `app/api/health/route.ts` | Liveness probe - basic health check | 200 (OK), 503 (Error) |
| `app/api/ready/route.ts` | Readiness probe - comprehensive checks | 200 (Ready), 503 (Not Ready) |

**Checks performed by `/api/ready`:**
- PQC library loaded
- Signaling server connectivity
- Environment variables configured

## Docker Configuration

### Docker Compose Files
| File | Environment | Purpose |
|------|-------------|---------|
| `docker-compose.yml` | Production | Base production configuration with health checks |
| `docker-compose.dev.yml` | Development | Hot reload, volume mounting, local services |
| `docker-compose.prod.yml` | Production | Security hardening, scaling, NGINX |

### Dockerfiles
| File | Purpose |
|------|---------|
| `Dockerfile` | Production multi-stage build |
| `Dockerfile.dev` | Development build with hot reload |
| `Dockerfile.signaling` | Signaling server (existing) |
| `Dockerfile.playwright` | E2E testing (existing) |

### Configuration
| File | Purpose |
|------|---------|
| `nginx.conf` | NGINX reverse proxy configuration |
| `.dockerignore` | Files to exclude from Docker builds (existing) |

## Kubernetes Manifests

All files are in the `k8s/` directory:

### Core Resources
| File | Resource Type | Purpose |
|------|---------------|---------|
| `namespace.yaml` | Namespace | Creates `tallow` namespace |
| `configmap.yaml` | ConfigMap | Application config + NGINX config |
| `secrets.yaml` | Secret | Template for sensitive data |

### Application Deployment
| File | Resource Type | Purpose |
|------|---------------|---------|
| `deployment.yaml` | Deployment | App and signaling deployments |
| `service.yaml` | Service | ClusterIP, LoadBalancer services |
| `ingress.yaml` | Ingress + ClusterIssuer | TLS routing, cert-manager |

### Scaling & Reliability
| File | Resource Type | Purpose |
|------|---------------|---------|
| `hpa.yaml` | HorizontalPodAutoscaler | Auto-scaling based on metrics |
| `pdb.yaml` | PodDisruptionBudget | High availability during updates |

### Data & Security
| File | Resource Type | Purpose |
|------|---------------|---------|
| `redis.yaml` | StatefulSet + Service | Redis with persistent storage |
| `networkpolicy.yaml` | NetworkPolicy | Pod-to-pod communication rules |

## Deployment Scripts

All scripts are in the `scripts/` directory:

### Bash Scripts (Linux/macOS)
| File | Purpose | Usage |
|------|---------|-------|
| `deploy-dev.sh` | Start development environment | `./scripts/deploy-dev.sh` |
| `deploy-prod.sh` | Deploy to production | `./scripts/deploy-prod.sh` |
| `deploy-k8s.sh` | Deploy to Kubernetes | `./scripts/deploy-k8s.sh production` |
| `health-check.sh` | Run health checks | `./scripts/health-check.sh dev` |

### PowerShell Scripts (Windows)
| File | Purpose | Usage |
|------|---------|-------|
| `deploy-dev.ps1` | Start development environment | `.\scripts\deploy-dev.ps1` |

**Note:** Make scripts executable on Linux/macOS:
```bash
chmod +x scripts/*.sh
```

## Documentation

### Main Documentation
| File | Content | Audience |
|------|---------|----------|
| `DEVOPS.md` | Complete DevOps guide | Developers, DevOps engineers |
| `DEPLOYMENT_SUMMARY.md` | Implementation summary | Project managers, stakeholders |
| `QUICKSTART.md` | Quick reference guide | All users |
| `DEVOPS_INDEX.md` | This file - file index | All users |

### Specialized Documentation
| File | Content | Audience |
|------|---------|----------|
| `k8s/README.md` | Kubernetes deployment guide | DevOps engineers, SREs |
| `ACCESSIBILITY.md` | Accessibility features (existing) | Frontend developers |
| `SECURITY_ENHANCEMENTS.md` | Security features (existing) | Security team |
| `PQC_INTEGRATION.md` | Post-quantum cryptography (existing) | Backend developers |

## Environment Files

### Templates
Create these files from templates:

| File | Environment | Status |
|------|-------------|--------|
| `.env.local` | Development | Create from example |
| `.env.production` | Production | Create from example |

### Required Variables

**Development (`.env.local`):**
```env
RESEND_API_KEY=
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
NEXT_PUBLIC_FORCE_RELAY=false
NEXT_PUBLIC_ALLOW_DIRECT=true
```

**Production (`.env.production`):**
```env
NEXT_PUBLIC_SIGNALING_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
RESEND_API_KEY=
NEXT_PUBLIC_TURN_SERVER=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
NEXT_PUBLIC_FORCE_RELAY=true
NEXT_PUBLIC_ALLOW_DIRECT=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Directory Structure

```
tallow/
├── app/
│   └── api/
│       ├── health/
│       │   └── route.ts              # Liveness probe
│       └── ready/
│           └── route.ts              # Readiness probe
│
├── k8s/                              # Kubernetes manifests
│   ├── README.md                     # K8s documentation
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
│
├── scripts/                          # Deployment scripts
│   ├── deploy-dev.sh                 # Development (Bash)
│   ├── deploy-dev.ps1                # Development (PowerShell)
│   ├── deploy-prod.sh                # Production (Bash)
│   ├── deploy-k8s.sh                 # Kubernetes (Bash)
│   └── health-check.sh               # Health checks (Bash)
│
├── docker-compose.yml                # Production base
├── docker-compose.dev.yml            # Development
├── docker-compose.prod.yml           # Production overrides
├── Dockerfile                        # Production build
├── Dockerfile.dev                    # Development build
├── nginx.conf                        # NGINX configuration
│
├── DEVOPS.md                         # Complete guide
├── DEPLOYMENT_SUMMARY.md             # Summary
├── QUICKSTART.md                     # Quick reference
├── DEVOPS_INDEX.md                   # This file
│
├── .env.local                        # Development env (create)
└── .env.production                   # Production env (create)
```

## Service Architecture

### Development Environment
```
┌─────────────────────────────────────────────┐
│  Docker Compose (dev)                       │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐         │
│  │  Tallow App │  │  Signaling   │         │
│  │  (3000)     │  │  Server      │         │
│  │  Hot Reload │  │  (3001)      │         │
│  └─────────────┘  └──────────────┘         │
│  ┌─────────────┐  ┌──────────────┐         │
│  │  Redis      │  │  Coturn      │         │
│  │  (6379)     │  │  TURN        │         │
│  │             │  │  (3478)      │         │
│  └─────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

### Production Environment (Docker Compose)
```
┌─────────────────────────────────────────────┐
│  Docker Compose (prod)                      │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  NGINX (80/443)                     │   │
│  │  - SSL/TLS                          │   │
│  │  - Load Balancing                   │   │
│  │  - Rate Limiting                    │   │
│  └───────┬─────────────────────────────┘   │
│          │                                  │
│  ┌───────┴─────────┬──────────────┐        │
│  │  Tallow App     │  Signaling   │        │
│  │  (2 replicas)   │  (2 replicas)│        │
│  └─────────────────┴──────────────┘        │
│  ┌─────────────┐                           │
│  │  Redis      │                           │
│  │  (persistent)│                          │
│  └─────────────┘                           │
└─────────────────────────────────────────────┘
```

### Kubernetes Environment
```
┌────────────────────────────────────────────┐
│  Kubernetes Cluster                        │
├────────────────────────────────────────────┤
│  Namespace: tallow                         │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Ingress (TLS + Let's Encrypt)       │ │
│  └────────┬─────────────────────────────┘ │
│           │                                │
│  ┌────────┴─────────┬───────────────┐    │
│  │ App Service      │ Signaling Svc │    │
│  │ (ClusterIP)      │ (ClusterIP)   │    │
│  └────────┬─────────┴───────────────┘    │
│           │                                │
│  ┌────────┴─────────┬───────────────┐    │
│  │ App Deployment   │ Signaling     │    │
│  │ (3-10 pods, HPA) │ (2-6 pods)    │    │
│  └──────────────────┴───────────────┘    │
│  ┌─────────────┐                         │
│  │ Redis       │                         │
│  │ StatefulSet │                         │
│  │ (PV)        │                         │
│  └─────────────┘                         │
└────────────────────────────────────────────┘
```

## Health Check URLs

### Development
- App Health: http://localhost:3000/api/health
- App Ready: http://localhost:3000/api/ready
- Signaling: http://localhost:3001/health

### Production
- App Health: https://your-domain.com/api/health
- App Ready: https://your-domain.com/api/ready
- Signaling: https://your-domain.com/health (or via same domain)

### Kubernetes
```bash
# From outside cluster
curl https://your-domain.com/api/health

# From inside cluster
kubectl exec -it deployment/tallow-app -n tallow -- \
  wget -qO- http://localhost:3000/api/health
```

## Monitoring Endpoints (Future)

Ready for integration:
- `/api/metrics` - Prometheus metrics
- `/api/logs` - Structured logs
- `/api/traces` - Distributed tracing

## Resource Requirements Summary

| Environment | Min CPU | Min RAM | Min Disk | Nodes |
|-------------|---------|---------|----------|-------|
| Development | 2 cores | 4GB | 10GB | 1 |
| Production (Docker) | 4 cores | 8GB | 50GB | 1 |
| Production (K8s) | 12 cores | 24GB | 100GB | 3+ |

## Port Assignments

| Service | Port | Protocol | Exposure |
|---------|------|----------|----------|
| Tallow App | 3000 | HTTP | Public |
| Signaling | 3001 | WebSocket | Public |
| Redis | 6379 | TCP | Internal |
| TURN (dev) | 3478 | UDP/TCP | Public |
| NGINX HTTP | 80 | HTTP | Public |
| NGINX HTTPS | 443 | HTTPS | Public |

## Security Features

### Container Security
- Non-root users (UID 1001)
- Read-only filesystems
- Dropped capabilities
- Security context constraints

### Network Security
- Network policies (K8s)
- TLS encryption
- Rate limiting (NGINX)
- CORS configuration

### Secret Management
- Kubernetes Secrets
- Environment variables
- No hardcoded credentials

## Testing Checklist

### Before Deployment
- [ ] Health endpoints respond correctly
- [ ] Environment variables configured
- [ ] Secrets created
- [ ] SSL certificates ready (production)
- [ ] Domain DNS configured (production)

### After Deployment
- [ ] All pods/containers healthy
- [ ] Health checks passing
- [ ] Logs showing no errors
- [ ] Can access application
- [ ] WebSocket connections work

### Load Testing
- [ ] Performance under load
- [ ] Autoscaling works
- [ ] Resource limits appropriate
- [ ] No memory leaks

## Common Commands Reference

### Docker Compose
```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Kubernetes
```bash
# Deploy
kubectl apply -f k8s/

# Status
kubectl get all -n tallow

# Logs
kubectl logs -f deployment/tallow-app -n tallow

# Scale
kubectl scale deployment/tallow-app --replicas=5 -n tallow
```

### Health Checks
```bash
# Local
curl http://localhost:3000/api/health

# Script
./scripts/health-check.sh dev
```

## Troubleshooting Resources

1. **Docker Issues**: Check `docker-compose logs`
2. **Kubernetes Issues**: Check `kubectl describe pod`
3. **Health Check Failures**: See logs and environment variables
4. **Network Issues**: Verify ports and firewall rules
5. **Performance Issues**: Check resource limits and HPA

## Next Steps

1. Review all documentation
2. Test development environment
3. Configure production environment
4. Deploy to staging/production
5. Set up monitoring and alerts
6. Configure backups
7. Document runbook procedures

## Support

- **Documentation**: See DEVOPS.md, QUICKSTART.md
- **Kubernetes**: See k8s/README.md
- **Issues**: GitHub Issues
- **Health**: Run health-check.sh script
