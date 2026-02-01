# Kubernetes Manifests for Tallow

This directory contains Kubernetes manifests for deploying Tallow to a Kubernetes cluster.

## Quick Start

```bash
# Deploy everything
./scripts/deploy-k8s.sh production

# Or manually:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl create secret generic tallow-secrets --from-env-file=.env.production -n tallow
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
kubectl apply -f k8s/networkpolicy.yaml
kubectl apply -f k8s/ingress.yaml
```

## Files Overview

### Core Resources

- **namespace.yaml**: Creates the `tallow` namespace
- **configmap.yaml**: Application configuration and NGINX config
- **secrets.yaml**: Template for sensitive data (DO NOT commit with real values)
- **deployment.yaml**: Deployments for app and signaling server
- **service.yaml**: Services for internal and external access
- **ingress.yaml**: Ingress with TLS and routing rules

### Scaling & Reliability

- **hpa.yaml**: Horizontal Pod Autoscaler for automatic scaling
- **pdb.yaml**: Pod Disruption Budgets for high availability
- **networkpolicy.yaml**: Network policies for security

### Data Storage

- **redis.yaml**: Redis StatefulSet with persistent storage

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet Traffic                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Ingress (NGINX + TLS)                       │
│  - tallow.example.com → tallow-service:3000             │
│  - /signaling → tallow-signaling-service:3001           │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐   ┌──────────────────────┐
│   tallow-service     │   │ signaling-service    │
│   (ClusterIP)        │   │ (ClusterIP)          │
└──────┬───────────────┘   └──────┬───────────────┘
       │                          │
       ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│   tallow-app         │   │ tallow-signaling     │
│   Deployment         │   │ Deployment           │
│   (3-10 replicas)    │   │ (2-6 replicas)       │
└──────┬───────────────┘   └──────────────────────┘
       │
       ▼
┌──────────────────────┐
│   tallow-redis       │
│   StatefulSet        │
│   (1 replica + PV)   │
└──────────────────────┘
```

## Resource Requirements

### Minimum Cluster Requirements

- **Nodes**: 3+ worker nodes
- **CPU**: 4+ cores per node
- **Memory**: 8GB+ per node
- **Storage**: 20GB+ for persistent volumes

### Per-Service Requirements

| Service | Min CPU | Max CPU | Min Memory | Max Memory | Replicas |
|---------|---------|---------|------------|------------|----------|
| App | 500m | 2000m | 512Mi | 2Gi | 3-10 |
| Signaling | 250m | 1000m | 128Mi | 512Mi | 2-6 |
| Redis | 100m | 500m | 256Mi | 768Mi | 1 |

## Configuration

### ConfigMap

Edit `k8s/configmap.yaml` to customize:

- Application environment variables
- Feature flags
- NGINX configuration
- CORS settings

### Secrets

Create secrets before deployment:

```bash
# Method 1: From literals
kubectl create secret generic tallow-secrets \
  --from-literal=resend-api-key=<key> \
  --from-literal=stripe-secret-key=<key> \
  --from-literal=stripe-webhook-secret=<key> \
  --from-literal=stripe-publishable-key=<key> \
  --from-literal=turn-username=<user> \
  --from-literal=turn-credential=<pass> \
  --from-literal=redis-password=<pass> \
  -n tallow

# Method 2: From .env file
kubectl create secret generic tallow-secrets \
  --from-env-file=.env.production \
  -n tallow

# Method 3: From YAML (after base64 encoding)
kubectl apply -f k8s/secrets.yaml
```

### Ingress

Update `k8s/ingress.yaml`:

1. Replace `tallow.example.com` with your domain
2. Update `cert-manager.io/cluster-issuer` if using different issuer
3. Configure CORS origins
4. Adjust rate limiting

## Autoscaling

### Horizontal Pod Autoscaler (HPA)

The HPA automatically scales based on:

- **CPU utilization**: 70% for app, 75% for signaling
- **Memory utilization**: 80% for app, 85% for signaling

### Manual Scaling

```bash
# Scale app
kubectl scale deployment/tallow-app --replicas=5 -n tallow

# Scale signaling
kubectl scale deployment/tallow-signaling --replicas=3 -n tallow
```

### Cluster Autoscaler

For cloud providers, enable cluster autoscaler:

```yaml
# Example for AWS
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler
  namespace: kube-system
data:
  aws-regions: us-west-2
  min-nodes: "3"
  max-nodes: "10"
```

## High Availability

### Pod Distribution

- **Anti-affinity rules**: Pods spread across nodes
- **Pod Disruption Budgets**: Ensure minimum replicas during updates
- **Multiple replicas**: 3+ for app, 2+ for signaling

### Rolling Updates

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

### Health Checks

- **Liveness probe**: `/api/health` - restart if fails
- **Readiness probe**: `/api/ready` - remove from service if fails

## Networking

### Network Policies

Network policies restrict traffic:

- **App pods**: Can access signaling and Redis
- **Signaling pods**: Can only receive connections
- **Redis pods**: Only accessible by app pods

### Service Types

- **ClusterIP**: Internal services (default)
- **LoadBalancer**: External access (optional)
- **NodePort**: Development/testing only

## Storage

### Redis Persistent Volume

```yaml
volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: standard
      resources:
        requests:
          storage: 10Gi
```

### Storage Classes

Adjust `storageClassName` based on your cloud provider:

- **AWS**: `gp3`, `gp2`, `io1`
- **GCP**: `standard`, `pd-ssd`
- **Azure**: `default`, `managed-premium`

## Monitoring

### Prometheus Integration

Pods are annotated for Prometheus scraping:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/api/metrics"
```

### Recommended Dashboards

- **Kubernetes Cluster**: General cluster health
- **Node Exporter**: Node-level metrics
- **Application Metrics**: Custom app metrics

## Security

### Pod Security

- **Non-root user**: All containers run as UID 1001
- **Read-only filesystem**: Where possible
- **Dropped capabilities**: Only required capabilities
- **Security context**: seccompProfile: RuntimeDefault

### Network Security

- **Network policies**: Restrict pod-to-pod communication
- **TLS**: All external communication encrypted
- **CORS**: Strict origin validation

### Secret Management

Options for secret management:

1. **Kubernetes Secrets**: Built-in (basic)
2. **Sealed Secrets**: Encrypt secrets in Git
3. **External Secrets Operator**: Sync from vault
4. **Cloud Provider KMS**: AWS Secrets Manager, GCP Secret Manager

## Backup and Restore

### Backup Redis Data

```bash
# Create backup
kubectl exec statefulset/tallow-redis -n tallow -- \
  redis-cli --rdb /data/backup-$(date +%Y%m%d).rdb save

# Copy backup
kubectl cp tallow/tallow-redis-0:/data/backup-*.rdb ./redis-backup.rdb
```

### Restore Redis Data

```bash
# Copy backup to pod
kubectl cp ./redis-backup.rdb tallow/tallow-redis-0:/data/dump.rdb

# Restart Redis
kubectl rollout restart statefulset/tallow-redis -n tallow
```

### Cluster State Backup

```bash
# Backup all resources
kubectl get all -n tallow -o yaml > tallow-backup.yaml

# Restore
kubectl apply -f tallow-backup.yaml
```

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n tallow
kubectl logs <pod-name> -n tallow
```

**Service not accessible:**
```bash
kubectl get svc -n tallow
kubectl get endpoints -n tallow
```

**Ingress not working:**
```bash
kubectl describe ingress tallow-ingress -n tallow
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

**HPA not scaling:**
```bash
kubectl describe hpa -n tallow
kubectl top pods -n tallow
```

### Debug Commands

```bash
# Shell into pod
kubectl exec -it deployment/tallow-app -n tallow -- /bin/sh

# Port forward for testing
kubectl port-forward deployment/tallow-app 3000:3000 -n tallow

# View events
kubectl get events -n tallow --sort-by=.metadata.creationTimestamp

# Check resource usage
kubectl top nodes
kubectl top pods -n tallow
```

## Updates and Rollbacks

### Update Application

```bash
# Update image
kubectl set image deployment/tallow-app tallow=tallow:v2.0.0 -n tallow

# Watch rollout
kubectl rollout status deployment/tallow-app -n tallow

# Check history
kubectl rollout history deployment/tallow-app -n tallow
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/tallow-app -n tallow

# Rollback to specific revision
kubectl rollout undo deployment/tallow-app --to-revision=3 -n tallow
```

## Production Checklist

Before deploying to production:

- [ ] Update all domain names in `ingress.yaml`
- [ ] Create and verify all secrets
- [ ] Configure TLS certificates
- [ ] Set appropriate resource limits
- [ ] Enable monitoring and logging
- [ ] Configure backup strategy
- [ ] Test health checks
- [ ] Review network policies
- [ ] Set up alerting
- [ ] Document runbook procedures
- [ ] Test disaster recovery
- [ ] Load test the application

## Support

For issues or questions:
- See main DEVOPS.md documentation
- Check Kubernetes documentation: https://kubernetes.io/docs/
- GitHub Issues: https://github.com/yourusername/tallow/issues
