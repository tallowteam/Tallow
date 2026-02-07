# Tallow Deployment Runbook

## Quick Reference

### Normal Deployment (Push to main)
```bash
git checkout main
git pull origin main
# Make changes and commit
git push origin main
# Blue-green deployment automatically triggered
```

### Manual Deployment with Canary
```bash
# Via GitHub UI:
1. Go to Actions > Deployment Pipeline
2. Click "Run workflow"
3. Select strategy: "canary"
4. Click "Run workflow"
```

### Release a New Version
```bash
npm version major|minor|patch
git push origin --tags
# Release workflow automatically triggered
```

## Deployment Strategies

### Strategy Selection Matrix

| Scenario | Strategy | Duration | Risk | Rollback |
|----------|----------|----------|------|----------|
| Normal update | Blue-Green | ~15 min | Low | Instant |
| Critical hotfix | Blue-Green | ~15 min | Low | Instant |
| Risky change | Canary | ~30 min | Very Low | Gradual |
| Feature release | Blue-Green | ~15 min | Low | Instant |
| Test environment | Rolling | ~20 min | N/A | N/A |

### Blue-Green Deployment

**Use when**: Standard updates, high reliability needed

**Process**:
1. Deploy to green environment
2. Run smoke tests
3. Switch traffic instantly
4. Keep blue environment for rollback

**Characteristics**:
- Zero downtime
- Instant rollback (if needed)
- Requires 2x infrastructure
- Best for production

**Rollback**:
```bash
# Automatic: If health checks fail
# Manual: Switch traffic back to blue
ssh deploy@prod "docker-compose -f docker-compose.prod.yml up -d"
```

### Canary Deployment

**Use when**: Deploying risky changes, experimental features

**Process**:
1. Deploy to canary (5% traffic)
2. Monitor error rates for 5 minutes
3. Increase to 25% traffic
4. Monitor for 10 minutes
5. Route 100% of traffic

**Characteristics**:
- Gradual traffic shift
- Real-time monitoring
- Automatic rollback if errors detected
- Best for testing runtime behavior

**Rollback**:
```bash
# Automatic: If error rate > 1%
# Manual: Route traffic back to stable
ssh deploy@prod "docker exec tallow-lb nginx -s reload"
```

### Rolling Deployment

**Use when**: Testing, non-critical environments

**Process**:
1. Update one instance at a time
2. Health check after each update
3. Continue until all instances updated

**Characteristics**:
- Minimal infrastructure overhead
- Brief availability degradation
- Best for testing

## Pre-Deployment Checklist

### Code Review
- [ ] All required reviews approved
- [ ] No merge conflicts
- [ ] All checks passing

### Testing
- [ ] Unit tests passing (100% in critical paths)
- [ ] E2E tests passing with both browsers
- [ ] Security scans passing
- [ ] No new vulnerabilities

### Documentation
- [ ] Changelog updated
- [ ] API docs updated (if applicable)
- [ ] Deployment notes documented

### Secrets & Configuration
- [ ] All required secrets configured
- [ ] Environment variables correct
- [ ] No hardcoded secrets
- [ ] Configuration reviewed

## During Deployment

### Monitor Logs

**Real-time logs**:
```bash
# SSH to deployment server
ssh deploy@prod

# Docker logs
docker-compose logs -f web signaling

# System logs
tail -f /var/log/syslog | grep -i tallow
```

**Metrics**:
```bash
# Health check
curl https://tallow.manisahome.com/api/health

# Metrics
curl https://tallow.manisahome.com/api/metrics | jq .
```

### Key Metrics to Watch

```json
{
  "http_requests_total": 1000,
  "http_requests_duration_seconds": 0.250,
  "http_requests_failed": 2,
  "error_rate_percent": 0.2,
  "database_connections": 8,
  "memory_usage_mb": 256,
  "cpu_usage_percent": 15
}
```

### Acceptable Values

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Error Rate | < 0.5% | 0.5-1.0% | > 1.0% |
| Response Time | < 300ms | 300-1000ms | > 1000ms |
| CPU Usage | < 40% | 40-70% | > 70% |
| Memory Usage | < 50% | 50-80% | > 80% |
| Database Conn | < 10 | 10-15 | > 15 |

## Rollback Procedures

### Immediate Rollback (Automatic)

Triggered automatically when:
- Error rate exceeds 1%
- Response time exceeds 2 seconds
- Health check fails
- Database connection errors

**What happens**:
1. Previous version restored
2. All traffic rerouted
3. Incident issue created
4. Deployment marked as failed

### Manual Rollback

**If automatic rollback doesn't trigger**:

```bash
# SSH to deployment server
ssh deploy@prod

# Option 1: Revert last commit
cd /apps/tallow
git revert HEAD --no-edit
npm run build
pm2 reload tallow

# Option 2: Checkout previous version
git checkout previous-version-tag
npm run build
pm2 reload tallow

# Verify
curl https://tallow.manisahome.com/api/health
```

**Verification checklist**:
- [ ] Health endpoint responds
- [ ] Error rate < 1%
- [ ] No timeout errors
- [ ] Database accessible
- [ ] All services running

## Post-Deployment Verification

### Smoke Tests (Run immediately)

```bash
#!/bin/bash
set -e

echo "Running post-deployment smoke tests..."

# Health check
echo "✓ Health check"
curl -f https://tallow.manisahome.com/api/health

# Metrics check
echo "✓ Metrics endpoint"
curl -f https://tallow.manisahome.com/api/metrics

# API connectivity
echo "✓ API connectivity"
curl -f https://tallow.manisahome.com/api/v1/devices

# Database check
echo "✓ Database connectivity"
curl -f https://tallow.manisahome.com/api/ready

echo "✅ All smoke tests passed!"
```

### Full Verification (Run after 15 minutes)

```bash
#!/bin/bash

echo "Running full post-deployment verification..."

# Check error logs
echo "Checking error logs..."
docker-compose logs web | grep -i error || echo "No errors found"

# Performance check
echo "Checking performance metrics..."
RESPONSE_TIME=$(curl -s https://tallow.manisahome.com/api/metrics | grep response_time | awk '{print $2}')
ERROR_RATE=$(curl -s https://tallow.manisahome.com/api/metrics | grep error_rate | awk '{print $2}')

echo "Response time: ${RESPONSE_TIME}ms"
echo "Error rate: ${ERROR_RATE}%"

# Database integrity
echo "Checking database integrity..."
# Add database-specific checks

echo "✅ Full verification complete!"
```

## Monitoring Alert Response

### Alert: High Error Rate (> 1%)

**Immediate Actions**:
1. Check recent deployments
2. Review error logs
3. Trigger rollback if needed
4. Investigate root cause

**Investigation**:
```bash
# Check logs for patterns
docker-compose logs --tail=100 web | grep ERROR

# Check database
docker exec tallow-db psql -U tallow -d tallow -c "SELECT COUNT(*) FROM errors WHERE created_at > NOW() - INTERVAL '15 minutes';"

# Check external services
curl -v https://api.external-service.com/status
```

### Alert: High Response Time (> 1000ms)

**Immediate Actions**:
1. Check server load
2. Review database performance
3. Check external API responses
4. Scale if needed

**Investigation**:
```bash
# Check server resources
top -b -n 1 | head -20

# Check database slow queries
docker exec tallow-db psql -U tallow -d tallow -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Profile application
curl https://tallow.manisahome.com/api/metrics
```

### Alert: Database Connection Failure

**Immediate Actions**:
1. Check database pod status
2. Verify connection string
3. Check firewall rules
4. Restart database if needed

**Investigation**:
```bash
# Check database status
docker ps | grep tallow-db

# Check database logs
docker-compose logs tallow-db

# Test connection
psql -h localhost -U tallow -d tallow -c "SELECT 1;"
```

## Communication

### During Deployment

1. **Notify team**: Post in Slack/Discord
   ```
   🚀 Starting deployment of version X.X.X
   Strategy: [blue-green|canary|rolling]
   ETA: 20 minutes
   ```

2. **Monitor progress**: Update every 5 minutes
3. **Report completion**: Post success/failure

### Deployment Complete

```
✅ Deployment of X.X.X completed successfully
- Error rate: 0.2%
- Response time: 250ms
- All systems operational
```

### Deployment Failed

```
❌ Deployment of X.X.X failed
- Reason: High error rate (2.5%)
- Action: Automatic rollback performed
- Status: Previous version restored
- Investigating: Check #incident-12345
```

## Maintenance Windows

### Scheduled Maintenance

```bash
# Notify users
curl -X POST https://tallow.manisahome.com/api/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "maintenance", "duration_minutes": 30}'

# Perform maintenance
docker-compose down
# ... maintenance tasks ...
docker-compose up -d

# Resume service
curl -X POST https://tallow.manisahome.com/api/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "operational"}'
```

### Zero-Downtime Updates

```bash
# Update without downtime (blue-green)
# Trigger via GitHub Actions with blue-green strategy
```

## Emergency Procedures

### Complete Service Recovery

```bash
#!/bin/bash
set -e

echo "⚠️  Starting emergency recovery..."

# Stop all services
docker-compose down

# Clean up
docker system prune -f
rm -rf /tmp/tallow-*

# Restore from backup
aws s3 cp s3://tallow-backups/latest.tar.gz .
tar xzf latest.tar.gz

# Start services
docker-compose up -d

# Wait for health
sleep 30
curl https://tallow.manisahome.com/api/health

echo "✅ Recovery complete"
```

### Rollback to Previous Version

```bash
#!/bin/bash

CURRENT=$(cat /apps/tallow/.version)
PREVIOUS=$(git describe --tags --abbrev=0 ${CURRENT}^ 2>/dev/null || echo "")

echo "Rolling back from $CURRENT to $PREVIOUS"

cd /apps/tallow
git checkout $PREVIOUS
npm ci
npm run build
docker-compose up -d --build
sleep 30
curl https://tallow.manisahome.com/api/health

echo "✅ Rolled back to $PREVIOUS"
```

## Troubleshooting Common Issues

### Issue: Deployment hangs at health check

**Symptoms**: Deployment stuck for > 5 minutes at health check

**Resolution**:
```bash
# Check if service is starting
docker-compose logs web --tail=50

# Check port availability
ss -tlnp | grep 3000

# Force restart
docker-compose restart web

# Verify manually
curl -v http://localhost:3000/api/health
```

### Issue: Out of memory during build

**Symptoms**: "Error: out of memory"

**Resolution**:
```bash
# Increase available memory
# In docker-compose.yml:
environment:
  NODE_OPTIONS: --max-old-space-size=4096

# Clear cache
docker system prune -a --volumes

# Rebuild
docker-compose up -d --build
```

### Issue: Database migration fails

**Symptoms**: "Migration failed" error during deployment

**Resolution**:
```bash
# Check migration status
docker exec tallow-db psql -U tallow -d tallow -c "SELECT * FROM migrations;"

# Rollback migration
docker exec tallow-db psql -U tallow -d tallow -c "DELETE FROM migrations WHERE name = 'failed_migration';"

# Rerun migration
docker exec tallow-web npm run migrate
```

### Issue: Secret not found during deployment

**Symptoms**: "Error: Secret XXXX not found"

**Resolution**:
1. Verify secret in GitHub Secrets
2. Check secret name spelling
3. Verify permissions
4. Re-add if necessary:
   ```
   GitHub > Settings > Secrets > New repository secret
   ```

## Performance Optimization

### Before Deployment

```bash
# Check bundle size
npm run perf:bundle

# Run performance tests
npm run perf:full

# Check for regressions
npm run bench:regression
```

### After Deployment

```bash
# Verify metrics
curl https://tallow.manisahome.com/api/metrics | jq .

# Check Lighthouse scores
npm run perf:lighthouse

# Monitor real user metrics
curl https://tallow.manisahome.com/api/vitals
```

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| DevOps Lead | Aamir | +1-XXX-XXX-XXXX | aamir@example.com |
| SRE | [Name] | +1-XXX-XXX-XXXX | sre@example.com |
| On-Call | [Name] | +1-XXX-XXX-XXXX | oncall@example.com |

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0
**Status**: Active
