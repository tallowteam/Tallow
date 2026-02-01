# TALLOW DevOps - Quick Reference Card

## 🚀 Quick Start Commands

### Docker

```bash
# Production
docker compose up -d
docker compose logs -f

# Development
docker compose -f docker-compose.dev.yml up

# Testing
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Kubernetes

```bash
# Deploy
bash scripts/deploy-k8s.sh -e production

# Rollback
bash scripts/rollback.sh -n tallow

# Backup
bash scripts/backup.sh -n tallow

# Status
kubectl get pods -n tallow
kubectl get ingress -n tallow
```

### GitHub Actions

```bash
# Trigger manually
gh workflow run ci.yml
gh workflow run e2e.yml
gh workflow run security.yml

# Create release
git tag v1.0.0
git push origin v1.0.0
```

## 📋 Common Commands

### Docker

```bash
# Build images
docker build -t tallow-web:latest .
docker build -f Dockerfile.signaling -t tallow-signaling:latest .

# View logs
docker compose logs -f tallow
docker compose logs -f signaling

# Restart services
docker compose restart
docker compose up -d --force-recreate

# Cleanup
docker compose down -v
docker system prune -a
```

### Kubernetes

```bash
# Get resources
kubectl get all -n tallow
kubectl get pods -n tallow -o wide
kubectl get svc -n tallow

# View logs
kubectl logs -f deployment/tallow-web -n tallow
kubectl logs -f deployment/tallow-signaling -n tallow

# Execute commands
kubectl exec -it <pod-name> -n tallow -- sh

# Port forward
kubectl port-forward deployment/tallow-web 3000:3000 -n tallow

# Scaling
kubectl scale deployment/tallow-web --replicas=5 -n tallow

# Restart
kubectl rollout restart deployment/tallow-web -n tallow

# Delete pod (will auto-recreate)
kubectl delete pod <pod-name> -n tallow
```

### Helm

```bash
# Install
helm install tallow ./helm/tallow -n tallow --create-namespace

# Upgrade
helm upgrade tallow ./helm/tallow -n tallow

# Rollback
helm rollback tallow -n tallow

# Status
helm status tallow -n tallow
helm list -n tallow

# Uninstall
helm uninstall tallow -n tallow
```

## 🔍 Debugging

### Check Health

```bash
# Web service
curl http://localhost:3000/api/health
curl https://yourdomain.com/api/health

# Signaling service
curl http://localhost:3001/health
curl https://yourdomain.com/signaling/health

# Metrics
curl http://localhost:3000/api/metrics
```

### View Logs

```bash
# Docker
docker compose logs -f --tail=100

# Kubernetes
kubectl logs -f deployment/tallow-web -n tallow --tail=100
kubectl logs -f deployment/tallow-signaling -n tallow --tail=100

# Previous pod logs
kubectl logs <pod-name> -n tallow --previous
```

### Resource Usage

```bash
# Kubernetes
kubectl top pods -n tallow
kubectl top nodes

# Docker
docker stats
```

## 🛠️ Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n tallow

# Check events
kubectl get events -n tallow --sort-by='.lastTimestamp'

# View logs
kubectl logs <pod-name> -n tallow

# Check image pull
kubectl get pods -n tallow -o jsonpath='{.items[*].status.containerStatuses[*].imageID}'
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n tallow
kubectl describe svc tallow-web -n tallow

# Check endpoints
kubectl get endpoints -n tallow

# Test internal connectivity
kubectl run -it --rm debug --image=curlimages/curl -n tallow -- \
  curl http://tallow-web:3000/api/health
```

### High Memory/CPU

```bash
# Check resources
kubectl top pods -n tallow

# Update limits
kubectl set resources deployment/tallow-web \
  --limits=cpu=4000m,memory=4Gi \
  -n tallow

# Check HPA
kubectl get hpa -n tallow
kubectl describe hpa tallow-web-hpa -n tallow
```

## 🔐 Security

### Secrets

```bash
# Create secret
kubectl create secret generic tallow-secrets \
  --from-literal=KEY=value \
  -n tallow

# View secret
kubectl get secret tallow-secrets -n tallow -o yaml

# Delete secret
kubectl delete secret tallow-secrets -n tallow
```

### Scan Images

```bash
# Trivy
trivy image tallow-web:latest

# Snyk
snyk container test tallow-web:latest
```

## 📊 Monitoring

### Metrics Endpoints

```
GET /api/metrics          # Prometheus metrics
GET /api/health           # Health check
GET /api/ready            # Readiness check
```

### Watch Resources

```bash
# Watch pods
kubectl get pods -n tallow -w

# Watch HPA
kubectl get hpa -n tallow -w

# Watch events
kubectl get events -n tallow -w --sort-by='.lastTimestamp'
```

## 💾 Backup & Restore

### Backup

```bash
# Run backup
bash scripts/backup.sh -n tallow

# Backup to remote
bash scripts/backup.sh -n tallow -r user@server:/backups
```

### Restore

```bash
# Extract backup
tar -xzf tallow_backup_TIMESTAMP.tar.gz

# Restore resources
kubectl apply -f tallow_backup_TIMESTAMP/k8s/
```

## 🔄 Updates

### Rolling Update

```bash
# Update image
kubectl set image deployment/tallow-web \
  web=ghcr.io/user/tallow-web:v1.1.0 \
  -n tallow

# Watch rollout
kubectl rollout status deployment/tallow-web -n tallow

# Pause rollout
kubectl rollout pause deployment/tallow-web -n tallow

# Resume rollout
kubectl rollout resume deployment/tallow-web -n tallow
```

### Rollback

```bash
# Rollback to previous
kubectl rollout undo deployment/tallow-web -n tallow

# Rollback to specific revision
kubectl rollout undo deployment/tallow-web -n tallow --to-revision=3

# View history
kubectl rollout history deployment/tallow-web -n tallow
```

## 🧪 Testing

### E2E Tests

```bash
# Run all tests
npm run test

# Run specific test
npx playwright test tests/e2e/landing.spec.ts

# Run with UI
npm run test:ui

# Run headed
npm run test:headed
```

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# With coverage
npm run test:unit -- --coverage

# Watch mode
npm run test:unit -- --watch
```

## 🌐 CI/CD

### GitHub Actions

```bash
# List workflows
gh workflow list

# View runs
gh run list

# View specific run
gh run view <run-id>

# Trigger workflow
gh workflow run ci.yml

# Watch workflow
gh run watch
```

## 📝 Environment Variables

### Required

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SIGNALING_URL=wss://domain.com/signaling
ALLOWED_ORIGINS=https://domain.com
```

### Optional

```env
RESEND_API_KEY=re_xxxxx
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_TURN_SERVER=turn:turn.example.com:3478
```

## 🆘 Emergency Procedures

### Complete Restart

```bash
# Docker
docker compose down
docker compose up -d

# Kubernetes
kubectl rollout restart deployment/tallow-web -n tallow
kubectl rollout restart deployment/tallow-signaling -n tallow
```

### Scale Down/Up (Maintenance)

```bash
# Scale down
kubectl scale deployment/tallow-web --replicas=0 -n tallow
kubectl scale deployment/tallow-signaling --replicas=0 -n tallow

# Scale up
kubectl scale deployment/tallow-web --replicas=3 -n tallow
kubectl scale deployment/tallow-signaling --replicas=2 -n tallow
```

### Force Delete Pod

```bash
kubectl delete pod <pod-name> -n tallow --force --grace-period=0
```

## 📚 Documentation

- **Full Guide**: `DEVOPS.md`
- **Complete Setup**: `CI_CD_INFRASTRUCTURE_COMPLETE.md`
- **GitHub Workflows**: `.github/workflows/README.md`
- **Helm Chart**: `helm/tallow/README.md`

## 🔗 Useful Links

- Kubernetes Dashboard: `kubectl proxy` → http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
- Grafana: http://localhost:3001 (if deployed)
- Prometheus: http://localhost:9090 (if deployed)

---

**Quick Reference Version**: 1.0.0
**Last Updated**: 2026-01-30
