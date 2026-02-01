# TALLOW DevOps Documentation

Complete CI/CD and infrastructure guide for TALLOW deployment.

## Table of Contents

1. [Overview](#overview)
2. [CI/CD Pipelines](#cicd-pipelines)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

## Overview

TALLOW uses a complete DevOps infrastructure with:

- **CI/CD**: GitHub Actions workflows for automated testing and deployment
- **Containerization**: Multi-stage Docker builds for web and signaling servers
- **Orchestration**: Kubernetes with Helm charts
- **Monitoring**: Prometheus metrics and health checks
- **Security**: Automated vulnerability scanning and security policies

## CI/CD Pipelines

### GitHub Actions Workflows

#### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

Main pipeline triggered on push/PR to main branches.

**Jobs**:
- Lint & Type Check
- Unit Tests (with coverage)
- Build Application
- E2E Tests (Chromium, Firefox)
- Docker Build (multi-arch)
- Security Scanning
- Deploy to Production (main branch only)

**Usage**:
```bash
# Automatic on push
git push origin main

# Manual trigger
gh workflow run ci.yml
```

#### 2. E2E Tests (`.github/workflows/e2e.yml`)

Comprehensive end-to-end testing with sharding.

**Features**:
- Parallel test execution
- Visual regression tests
- Accessibility tests
- Multiple browsers

**Usage**:
```bash
# Run E2E workflow
gh workflow run e2e.yml

# Run locally
npm run test
```

#### 3. Release Workflow (`.github/workflows/release.yml`)

Automated releases with semantic versioning.

**Triggers**:
- Tag push: `v*.*.*`
- Manual dispatch

**Outputs**:
- GitHub Release with changelog
- Docker images with version tags
- Helm chart package

**Usage**:
```bash
# Create release
git tag v1.0.0
git push origin v1.0.0

# Or manual
gh workflow run release.yml -f version=1.0.0
```

#### 4. Security Scanning (`.github/workflows/security.yml`)

Comprehensive security scanning (runs daily).

**Scanners**:
- CodeQL (SAST)
- Trivy (vulnerabilities)
- Semgrep (code patterns)
- Snyk (dependencies)
- Gitleaks (secrets)

**Usage**:
```bash
# Manual scan
gh workflow run security.yml
```

### Required GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

| Secret | Description | Required |
|--------|-------------|----------|
| `NAS_HOST` | NAS IP/hostname for deployment | Yes (for auto-deploy) |
| `NAS_USERNAME` | SSH username | Yes (for auto-deploy) |
| `NAS_SSH_KEY` | Private SSH key | Yes (for auto-deploy) |
| `NAS_SSH_PORT` | SSH port (default: 22) | No |
| `CODECOV_TOKEN` | Code coverage reports | No |
| `SNYK_TOKEN` | Snyk security scanning | No |
| `DOCKERHUB_USERNAME` | Docker Hub username | No |
| `DOCKERHUB_TOKEN` | Docker Hub token | No |

## Docker Deployment

### Building Images

#### Web Application
```bash
# Build
docker build -t tallow-web:latest .

# Multi-arch build
docker buildx build --platform linux/amd64,linux/arm64 -t tallow-web:latest .
```

#### Signaling Server
```bash
# Build
docker build -f Dockerfile.signaling -t tallow-signaling:latest .

# Multi-arch build
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.signaling -t tallow-signaling:latest .
```

### Docker Compose Deployment

#### Production
```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Update and restart
docker compose pull
docker compose up -d --build
```

#### Development
```bash
# Start with hot reload
docker compose -f docker-compose.dev.yml up

# With optional services
docker compose -f docker-compose.dev.yml --profile email up

# Stop
docker compose -f docker-compose.dev.yml down
```

#### Testing
```bash
# Run tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Cleanup
docker compose -f docker-compose.test.yml down -v
```

### Environment Variables

Create `.env` file:
```env
# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Signaling
NEXT_PUBLIC_SIGNALING_URL=wss://yourdomain.com/signaling
ALLOWED_ORIGINS=https://yourdomain.com

# Services (optional)
RESEND_API_KEY=re_xxxxx
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx

# TURN server (optional)
NEXT_PUBLIC_TURN_SERVER=turn:turn.example.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=credential
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x (optional)
- Nginx Ingress Controller
- cert-manager (for TLS)

### Quick Start with Helm

```bash
# Create namespace
kubectl create namespace tallow

# Create secrets
kubectl create secret generic tallow-secrets \
  --from-literal=RESEND_API_KEY=re_xxxxx \
  --from-literal=STRIPE_SECRET_KEY=sk_xxxxx \
  -n tallow

# Install with Helm
helm install tallow ./helm/tallow \
  --namespace tallow \
  --values helm/tallow/values.production.yaml \
  --wait

# Verify deployment
kubectl get pods -n tallow
kubectl get ingress -n tallow
```

### Deployment with kubectl

```bash
# Deploy everything
bash scripts/deploy-k8s.sh -e production

# Or manually
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/serviceaccount.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/web/
kubectl apply -f k8s/signaling/
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
kubectl apply -f k8s/network-policy.yaml
```

### Updating Deployment

```bash
# Update with Helm
helm upgrade tallow ./helm/tallow \
  --namespace tallow \
  --values helm/tallow/values.production.yaml \
  --wait

# Or with kubectl
kubectl set image deployment/tallow-web \
  web=ghcr.io/your-username/tallow-web:v1.1.0 \
  -n tallow

kubectl rollout status deployment/tallow-web -n tallow
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment/tallow-web --replicas=10 -n tallow

# Check HPA status
kubectl get hpa -n tallow

# Adjust HPA
kubectl patch hpa tallow-web-hpa -n tallow \
  --patch '{"spec":{"maxReplicas":20}}'
```

### Rollback

```bash
# Rollback to previous version
bash scripts/rollback.sh -n tallow

# Rollback to specific revision
bash scripts/rollback.sh -r 5 -n tallow

# View rollout history
kubectl rollout history deployment/tallow-web -n tallow
```

## Monitoring & Observability

### Health Checks

```bash
# Web service
curl https://yourdomain.com/api/health

# Signaling service
curl https://yourdomain.com/signaling/health

# Metrics
curl https://yourdomain.com/api/metrics
```

### Prometheus Metrics

Metrics available at `/api/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `websocket_connections_total` - WebSocket connections
- `file_transfers_total` - File transfer count
- `file_transfer_bytes` - Bytes transferred

### Kubernetes Monitoring

```bash
# Pod status
kubectl get pods -n tallow -w

# Resource usage
kubectl top pods -n tallow
kubectl top nodes

# Logs
kubectl logs -f deployment/tallow-web -n tallow
kubectl logs -f deployment/tallow-signaling -n tallow

# Events
kubectl get events -n tallow --sort-by='.lastTimestamp'
```

### Grafana Dashboard

Import dashboard from `grafana-dashboard.json`:

1. Open Grafana
2. Import → Upload JSON
3. Select Prometheus data source
4. Dashboard ready!

## Security

### Secret Management

```bash
# Create secrets from file
kubectl create secret generic tallow-secrets \
  --from-env-file=.env.production \
  -n tallow

# Update secret
kubectl delete secret tallow-secrets -n tallow
kubectl create secret generic tallow-secrets \
  --from-literal=RESEND_API_KEY=new_value \
  -n tallow

# View secrets (base64 encoded)
kubectl get secret tallow-secrets -n tallow -o yaml
```

### TLS Certificates

```bash
# Create TLS secret
kubectl create secret tls tallow-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n tallow

# With cert-manager (automated)
# See k8s/web/ingress.yaml for configuration
```

### Network Policies

Network policies restrict traffic between pods:

```bash
# Apply network policies
kubectl apply -f k8s/network-policy.yaml

# Test connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot -n tallow -- /bin/bash
```

### Security Scanning

```bash
# Scan Docker images locally
trivy image tallow-web:latest

# Scan filesystem
trivy fs .

# Check for secrets
gitleaks detect --source . --verbose
```

## Backups

### Automated Backups

```bash
# Run backup
bash scripts/backup.sh -n tallow

# With remote upload
bash scripts/backup.sh -n tallow -r user@backup-server:/backups

# Scheduled backups (cron)
0 2 * * * /path/to/scripts/backup.sh -n tallow
```

### Restore from Backup

```bash
# Extract backup
tar -xzf tallow_backup_20260130_120000.tar.gz

# Restore Kubernetes resources
kubectl apply -f tallow_backup_20260130_120000/k8s/

# Restore Helm release
helm install tallow tallow_backup_20260130_120000/helm/ \
  --namespace tallow
```

## Troubleshooting

### Common Issues

#### 1. Pods CrashLoopBackOff

```bash
# Check pod logs
kubectl logs pod-name -n tallow

# Describe pod
kubectl describe pod pod-name -n tallow

# Check events
kubectl get events -n tallow --field-selector involvedObject.name=pod-name
```

#### 2. Service Unavailable

```bash
# Check services
kubectl get svc -n tallow

# Check endpoints
kubectl get endpoints -n tallow

# Test service connectivity
kubectl run -it --rm debug --image=curlimages/curl -n tallow -- \
  curl http://tallow-web:3000/api/health
```

#### 3. Ingress Not Working

```bash
# Check ingress
kubectl describe ingress tallow-web -n tallow

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify DNS
nslookup yourdomain.com
```

#### 4. High Memory Usage

```bash
# Check memory usage
kubectl top pods -n tallow

# Increase memory limits
kubectl set resources deployment/tallow-web \
  --limits=memory=4Gi \
  -n tallow

# Or update HPA
kubectl edit hpa tallow-web-hpa -n tallow
```

### Debug Commands

```bash
# Interactive shell in pod
kubectl exec -it pod-name -n tallow -- /bin/sh

# Port forward
kubectl port-forward deployment/tallow-web 3000:3000 -n tallow

# View resource usage
kubectl top pods -n tallow
kubectl top nodes

# Check API calls
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/tallow/pods
```

### Performance Tuning

```bash
# Increase replicas
kubectl scale deployment/tallow-web --replicas=10 -n tallow

# Update resource limits
kubectl set resources deployment/tallow-web \
  --requests=cpu=1000m,memory=2Gi \
  --limits=cpu=4000m,memory=8Gi \
  -n tallow

# Optimize HPA
kubectl patch hpa tallow-web-hpa -n tallow --patch '
spec:
  minReplicas: 5
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
'
```

## Maintenance

### Regular Tasks

1. **Daily**:
   - Monitor pod health
   - Check logs for errors
   - Review metrics

2. **Weekly**:
   - Review security scans
   - Update dependencies
   - Test backups

3. **Monthly**:
   - Review resource usage
   - Optimize performance
   - Update documentation

### Upgrade Checklist

- [ ] Review changelog
- [ ] Test in staging
- [ ] Create backup
- [ ] Update images
- [ ] Deploy to production
- [ ] Run health checks
- [ ] Monitor metrics
- [ ] Keep rollback ready

## Support

For issues or questions:

- Documentation: This file
- Issues: GitHub Issues
- Monitoring: Grafana Dashboard
- Logs: Kubernetes logs

---

**Last Updated**: 2026-01-30
**Version**: 1.0.0
