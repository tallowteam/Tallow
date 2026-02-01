# Tallow Deployment Troubleshooting Quick Reference

Quick solutions to common deployment issues.

## 🚨 Critical Issues

### Application Won't Start

```bash
# Check if process is running
pm2 status
# or
systemctl status tallow-app

# View logs
pm2 logs tallow-app --lines 50
# or
journalctl -u tallow-app -n 50

# Common fixes:
1. Check environment variables: pm2 env 0
2. Rebuild: npm run build
3. Check port availability: sudo netstat -tlnp | grep 3000
4. Restart: pm2 restart tallow-app
```

### 502 Bad Gateway

**Symptom:** Nginx shows 502 error

```bash
# Check upstream
curl http://localhost:3000
curl http://localhost:3001/health

# If no response, restart app
pm2 restart all

# Check Nginx config
sudo nginx -t
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### WebSocket Connection Failed

**Symptom:** "WebSocket connection failed" in browser console

```bash
# Test WebSocket
npm install -g wscat
wscat -c wss://your-domain.com/signaling

# Common fixes:
```

**Fix 1: Nginx Headers Missing**
```nginx
# Add to /etc/nginx/sites-available/tallow
location /signaling {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... other settings
}

sudo systemctl restart nginx
```

**Fix 2: Cloudflare WebSocket Disabled**
1. Cloudflare Dashboard → Network
2. Enable WebSockets
3. Wait 1-2 minutes for propagation

**Fix 3: Firewall Blocking**
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

### SSL Certificate Errors

```bash
# Check certificate
sudo certbot certificates

# Renew if expired
sudo certbot renew --force-renewal

# Test SSL configuration
curl -vI https://your-domain.com

# Check Nginx SSL config
sudo nginx -t
```

---

## 🔧 Build & Deployment Issues

### Build Fails - Out of Memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Enable swap (if low RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Build Fails - TypeScript Errors

```bash
# Check for actual errors
npm run build 2>&1 | tee build.log

# Temporary skip (not recommended for production)
# In next.config.ts:
typescript: {
  ignoreBuildErrors: true,
}
```

### Build Fails - Dependency Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build

# Check Node version
node --version  # Should be 20+

# Install specific Node version
nvm install 20
nvm use 20
```

### Deployment Stuck

```bash
# Check deployment status
pm2 list
docker ps  # if using Docker

# Force restart
pm2 delete all
pm2 start ecosystem.config.js

# Docker
docker-compose down
docker-compose up -d --build --force-recreate
```

---

## 🌐 Network & Connectivity Issues

### Cannot Access Application

**Symptom:** Site unreachable from browser

```bash
# Test local access
curl http://localhost:3000

# Test from server
curl http://your-server-ip:3000

# Test externally
curl https://your-domain.com

# Checklist:
□ Firewall rules (ufw, iptables)
□ Security groups (AWS, GCP)
□ DNS configuration
□ Reverse proxy running
□ SSL certificate valid
```

**Firewall Check:**
```bash
# Check firewall status
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # Signaling
```

**DNS Check:**
```bash
# Check DNS resolution
nslookup your-domain.com
dig your-domain.com

# Check DNS propagation
# https://dnschecker.org/
```

### P2P Connections Failing

**Symptom:** Files won't transfer, "Connection failed" errors

```bash
# Test TURN server
# In browser console:
fetch('https://your-domain.com/api/test-turn')
```

**Common fixes:**

1. **TURN Server Credentials:**
```bash
# Check .env.local
cat .env.local | grep TURN

# Test credentials
# https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
```

2. **Force Relay Mode:**
```bash
# In .env.local
NEXT_PUBLIC_FORCE_RELAY=true
NEXT_PUBLIC_ALLOW_DIRECT=false
```

3. **Check Signaling:**
```bash
# Browser DevTools → Network → WS
# Should see active WebSocket connection
```

### High Latency / Slow Performance

```bash
# Check server resources
htop
df -h

# Check network
ping your-domain.com
traceroute your-domain.com

# Enable CDN
# Cloudflare: Orange cloud icon
# AWS: CloudFront
# Vercel: Automatic
```

---

## 📊 Monitoring & Logs

### View Real-time Logs

```bash
# PM2
pm2 logs --lines 100

# Systemd
journalctl -u tallow-app -f

# Docker
docker logs tallow --tail 100 -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Find Specific Errors

```bash
# Search logs for errors
pm2 logs | grep -i error

# Nginx errors
sudo grep "error" /var/log/nginx/error.log | tail -20

# System logs
sudo journalctl -p err -n 50
```

### Check Resource Usage

```bash
# CPU and Memory
htop
# or
top

# Disk usage
df -h
du -sh /var/www/tallow

# Network
iftop  # Install: sudo apt install iftop
```

### Monitor Application Health

```bash
# Health check endpoint
curl http://localhost:3000/health

# PM2 monitoring
pm2 monit

# Set up external monitoring
# - UptimeRobot: https://uptimerobot.com
# - StatusCake: https://www.statuscake.com
```

---

## 🔐 Security Issues

### Rate Limiting Too Aggressive

**Symptom:** Users getting blocked, "Too many requests" errors

```bash
# Check Nginx rate limits
sudo grep "limiting requests" /var/log/nginx/error.log

# Adjust in /etc/nginx/sites-available/tallow
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;  # Increase from 10r/s

sudo systemctl restart nginx
```

### SSL/TLS Issues

```bash
# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate chain
curl -vI https://your-domain.com

# Verify with online tools:
# - https://www.ssllabs.com/ssltest/
# - https://www.digicert.com/help/
```

### CORS Errors

**Symptom:** "CORS policy" errors in browser console

```bash
# Check signaling server ALLOWED_ORIGINS
# In .env.local or docker-compose.yml
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Restart signaling
pm2 restart tallow-signaling
```

---

## 🐳 Docker-Specific Issues

### Container Won't Start

```bash
# Check container status
docker ps -a

# View container logs
docker logs tallow --tail 50

# Inspect container
docker inspect tallow

# Common fixes:
docker-compose down
docker-compose up -d --build --force-recreate
```

### Container Keeps Restarting

```bash
# Check restart count
docker ps -a

# View exit code
docker inspect tallow | grep -A 5 "State"

# Check health
docker inspect tallow | grep -A 10 "Health"

# Fix:
# 1. Check environment variables in docker-compose.yml
# 2. Check volume mounts
# 3. Increase memory limit
```

### Docker Build Fails

```bash
# Clear build cache
docker system prune -a

# Build with no cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -f Dockerfile .
```

---

## ☁️ Platform-Specific Issues

### Vercel

**Build Timeout:**
```bash
# Reduce build size
# In next.config.ts:
export default {
  experimental: {
    outputStandalone: true,
  },
}
```

**Function Timeout:**
- Max 10s on Hobby
- Max 60s on Pro
- Move long-running tasks to external service

### AWS

**EC2 Instance Unreachable:**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check instance status
aws ec2 describe-instances --instance-ids i-xxxxx
```

**ECS Task Fails:**
```bash
# Check task logs
aws ecs describe-tasks --cluster tallow-cluster --tasks <task-id>

# View CloudWatch logs
aws logs tail /ecs/tallow-app --follow
```

### DigitalOcean

**App Won't Deploy:**
```bash
# Check build logs in dashboard
# Or via CLI:
doctl apps logs <app-id>

# Common issues:
# - Wrong build command
# - Missing environment variables
# - Port mismatch
```

**Droplet SSH Issues:**
```bash
# Reset root password in dashboard
# Or use console access
```

---

## 🔄 Recovery Procedures

### Rollback Deployment

**PM2:**
```bash
# If you saved previous version
cd /var/www/tallow
git reset --hard HEAD~1
npm install
npm run build
pm2 restart all
```

**Docker:**
```bash
# Use previous image
docker pull your-registry/tallow:previous-tag
docker-compose down
docker-compose up -d
```

**Vercel:**
```bash
# In dashboard: Deployments → Previous → Promote to Production
# Or via CLI:
vercel rollback
```

### Restore from Backup

```bash
# Stop application
pm2 stop all

# Restore files
cd /var/www
sudo tar -xzf /var/backups/tallow/tallow-YYYYMMDD.tar.gz

# Restore environment
sudo cp /var/backups/tallow/.env.local.backup /var/www/tallow/.env.local

# Rebuild and restart
cd /var/www/tallow
npm install
npm run build
pm2 start all
```

### Emergency Shutdown

```bash
# Stop everything
pm2 stop all
sudo systemctl stop nginx
docker-compose down

# When ready to restart:
docker-compose up -d  # or
pm2 start all
sudo systemctl start nginx
```

---

## 📞 Getting More Help

### Diagnostic Information to Collect

```bash
#!/bin/bash
# Save this as collect-diagnostics.sh

echo "=== System Info ===" > diagnostics.txt
uname -a >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Node Version ===" >> diagnostics.txt
node --version >> diagnostics.txt
npm --version >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== PM2 Status ===" >> diagnostics.txt
pm2 status >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Recent Logs ===" >> diagnostics.txt
pm2 logs --lines 50 --nostream >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Nginx Config Test ===" >> diagnostics.txt
sudo nginx -t >> diagnostics.txt 2>&1
echo "" >> diagnostics.txt

echo "=== Port Listening ===" >> diagnostics.txt
sudo netstat -tlnp | grep -E "(3000|3001|80|443)" >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Disk Space ===" >> diagnostics.txt
df -h >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Memory Usage ===" >> diagnostics.txt
free -h >> diagnostics.txt

echo "Diagnostics saved to diagnostics.txt"
```

### Support Channels

- 📖 **Full Guide:** `DEPLOYMENT-GUIDE.md`
- 🔍 **Search Issues:** GitHub Issues
- 💬 **Community:** Discord/Forum
- 📧 **Professional Support:** Contact maintainers

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review logs for error messages
3. ✅ Search existing GitHub issues
4. ✅ Collect diagnostic information
5. ✅ Document steps to reproduce
6. ✅ Include environment details (OS, platform, versions)

---

## 📚 Related Documentation

- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md) - Platform comparison
- [README.md](./README.md) - Project overview
- [SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md) - Security details

---

**Last Updated:** 2025-01-25
