# Cloudflare Tunnel Setup for Tallow on Synology NAS

This guide explains how to expose your Tallow Docker deployment running on Synology NAS to the internet using Cloudflare Tunnel (formerly Argo Tunnel).

## Overview

Cloudflare Tunnel creates a secure, encrypted connection between your Synology NAS and Cloudflare's network without opening any inbound ports on your firewall. This provides:

- **Zero Trust Security**: No exposed ports, no IP exposure
- **Automatic HTTPS**: Free SSL certificates managed by Cloudflare
- **DDoS Protection**: Built-in protection from Cloudflare
- **WebSocket Support**: Full support for signaling server
- **Easy Management**: Web dashboard for configuration

## Prerequisites

- Synology NAS with Docker installed (DSM 7.x recommended)
- Domain name managed by Cloudflare (Free plan works)
- Cloudflare account: https://dash.cloudflare.com/sign-up
- SSH access to your Synology NAS

## Step 1: Prepare Your Domain in Cloudflare

1. Add your domain to Cloudflare (if not already):
   - Go to https://dash.cloudflare.com/
   - Click "Add a site"
   - Enter your domain: `manisahome.com`
   - Follow nameserver instructions from your registrar

2. Wait for DNS propagation (can take 5-60 minutes)

## Step 2: Create Cloudflare Tunnel

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Access Zero Trust Dashboard**:
   - Visit https://one.dash.cloudflare.com/
   - Navigate to **Networks** → **Tunnels**

2. **Create Tunnel**:
   - Click **Create a tunnel**
   - Select **Cloudflared** connector type
   - Name it: `tallow-nas`
   - Click **Save tunnel**

3. **Get Tunnel Token**:
   - After creation, you'll see installation instructions
   - Copy the tunnel token (starts with `eyJ...`)
   - Save this token - you'll need it for Docker

4. **Configure Public Hostnames**:

   **For Main App:**
   - Click **Public Hostname** tab
   - Click **Add a public hostname**
   - Subdomain: `tallow`
   - Domain: `manisahome.com`
   - Service Type: `HTTP`
   - URL: `tallow:3000`
   - Click **Save hostname**

   **For Signaling Server:**
   - Click **Add a public hostname** again
   - Subdomain: `relay`
   - Domain: `manisahome.com`
   - Service Type: `HTTP`
   - URL: `signaling:3001`
   - Under **Additional application settings**:
     - Enable **WebSocket**
   - Click **Save hostname**

### Option B: Via CLI (Advanced)

```bash
# SSH into Synology
ssh admin@synology.local

# Install cloudflared
sudo wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create tallow-nas

# Note the tunnel ID from output
# Create DNS routes
cloudflared tunnel route dns tallow-nas tallow.manisahome.com
cloudflared tunnel route dns tallow-nas relay.manisahome.com
```

## Step 3: Configure Docker Compose

Edit your `docker-compose.yml` to add the Cloudflare Tunnel service:

```yaml
services:
  # ... existing tallow and signaling services ...

  # Cloudflare Tunnel
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: tallow-cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - tallow-network
    depends_on:
      tallow:
        condition: service_healthy
      signaling:
        condition: service_healthy
```

## Step 4: Update Environment Variables

Create or update your `.env` file:

```bash
# Cloudflare Tunnel Token (from Step 2)
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWJjZGVmMTIzNDU2...

# Update signaling URL to use secure WebSocket
NEXT_PUBLIC_SIGNALING_URL=wss://relay.manisahome.com

# Update allowed origins
ALLOWED_ORIGINS=https://tallow.manisahome.com,https://www.tallow.manisahome.com

# Keep relay on for best privacy
NEXT_PUBLIC_FORCE_RELAY=true
NEXT_PUBLIC_ALLOW_DIRECT=false
```

## Step 5: Deploy to Synology

### Upload Files to Synology

1. **Using File Station**:
   - Open File Station in DSM
   - Navigate to `/docker/tallow/`
   - Upload all project files

2. **Using rsync (recommended)**:
   ```bash
   # From your local machine
   rsync -avz --exclude node_modules --exclude .next \
     ~/Documents/Apps/Tallow/ \
     admin@synology.local:/volume1/docker/tallow/
   ```

### Start Services

```bash
# SSH into Synology
ssh admin@synology.local

# Navigate to project directory
cd /volume1/docker/tallow

# Start services
sudo docker-compose up -d

# Check logs
sudo docker-compose logs -f
```

## Step 6: Verify Deployment

### Check Service Health

```bash
# Check running containers
sudo docker-compose ps

# Should show:
# tallow-app        running (healthy)
# tallow-signaling  running (healthy)
# tallow-cloudflared running

# Check tunnel status
sudo docker-compose logs cloudflared
# Look for: "Connection registered"
```

### Test Endpoints

1. **Web App**:
   - Visit: https://tallow.manisahome.com
   - Should load instantly with valid SSL

2. **Health Check**:
   - Visit: https://tallow.manisahome.com/api/health
   - Should return JSON: `{"status":"ok",...}`

3. **Signaling Server**:
   - Test WebSocket connection in browser console:
   ```javascript
   const ws = new WebSocket('wss://relay.manisahome.com/relay');
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ```

### Check Cloudflare Dashboard

1. Go to **Networks** → **Tunnels** in Zero Trust dashboard
2. Your tunnel should show as "Healthy"
3. Click on it to see traffic metrics

## Security Enhancements

### 1. Enable Cloudflare Access (Optional)

Protect your app with authentication:

1. **Create Access Application**:
   - Go to **Access** → **Applications**
   - Click **Add an application** → **Self-hosted**
   - Application name: `Tallow`
   - Application domain: `tallow.manisahome.com`

2. **Configure Identity Providers**:
   - Email OTP (free, no setup)
   - Google OAuth
   - GitHub OAuth
   - SAML/OIDC for enterprise

3. **Set Access Policies**:
   - Allow: Your email addresses
   - Allow: Specific email domains
   - Require: MFA for sensitive operations

### 2. Firewall Configuration

Keep your NAS secure:

```bash
# Synology Firewall Rules:
# - DENY all inbound traffic to ports 3000, 3001
# - ALLOW only SSH (22) from your IP
# - Cloudflare Tunnel uses outbound HTTPS (443) only
```

In DSM:
1. Go to **Control Panel** → **Security** → **Firewall**
2. Enable firewall
3. Create rules to block ports 3000 and 3001 from WAN

### 3. Rate Limiting (Cloudflare)

Protect against abuse:

1. Go to **Security** → **WAF** → **Rate limiting rules**
2. Create rule:
   - Path: `tallow.manisahome.com/*`
   - Requests: 100 per 10 seconds
   - Action: Challenge or Block

## Maintenance

### Update Application

```bash
# SSH into Synology
ssh admin@synology.local
cd /volume1/docker/tallow

# Pull latest code
git pull

# Rebuild and restart
sudo docker-compose build
sudo docker-compose up -d

# Verify health
sudo docker-compose ps
```

### View Logs

```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f tallow
sudo docker-compose logs -f signaling
sudo docker-compose logs -f cloudflared

# Last 100 lines
sudo docker-compose logs --tail=100 tallow
```

### Backup Configuration

```bash
# Backup to NAS shared folder
sudo cp -r /volume1/docker/tallow /volume1/backup/tallow-$(date +%Y%m%d)

# Backup tunnel credentials
sudo docker exec tallow-cloudflared cat /root/.cloudflared/*.json > tunnel-creds.json
```

### Monitor Tunnel Health

In Cloudflare Zero Trust Dashboard:
1. **Networks** → **Tunnels** → `tallow-nas`
2. View metrics:
   - Requests per second
   - Bandwidth usage
   - Connection status
   - Error rates

## Troubleshooting

### Tunnel Won't Connect

**Symptoms**: Container runs but tunnel shows "Down" in dashboard

**Solutions**:
```bash
# Check token is correct
sudo docker-compose exec cloudflared env | grep TUNNEL_TOKEN

# Check container logs
sudo docker-compose logs cloudflared

# Common errors:
# - "Invalid token": Re-copy token from dashboard
# - "Connection refused": Check if tallow/signaling are healthy
# - "DNS resolution failed": Wait for DNS propagation
```

### DNS Not Resolving

**Symptoms**: Domain doesn't resolve or shows wrong IP

**Solutions**:
1. Check Cloudflare DNS settings:
   - Go to **DNS** → **Records**
   - Should see CNAME: `tallow` → `<tunnel-id>.cfargotunnel.com`
   - Should see CNAME: `relay` → `<tunnel-id>.cfargotunnel.com`

2. Clear DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```

3. Test with dig:
   ```bash
   dig tallow.manisahome.com
   # Should return CNAME record
   ```

### WebSocket Connections Failing

**Symptoms**: App loads but transfers don't work

**Solutions**:
1. Verify WebSocket is enabled:
   - Cloudflare Dashboard → **Networks** → **Tunnels**
   - Edit hostname for `relay.manisahome.com`
   - Under **Additional settings**, ensure **WebSockets** is enabled

2. Check signaling server logs:
   ```bash
   sudo docker-compose logs signaling
   ```

3. Test WebSocket in browser:
   ```javascript
   // Open browser console on your site
   const ws = new WebSocket('wss://relay.manisahome.com/relay');
   ws.onopen = () => console.log('✓ Connected');
   ws.onerror = (e) => console.error('✗ Error:', e);
   ```

### 502 Bad Gateway

**Symptoms**: Cloudflare shows 502 error page

**Solutions**:
```bash
# Check if containers are running
sudo docker-compose ps

# Check if app is healthy
sudo docker-compose exec tallow wget -O- http://localhost:3000/api/health

# Check service name matches tunnel config
# Tunnel config should use: tallow:3000 (not localhost:3000)

# Restart services
sudo docker-compose restart
```

### High Memory Usage

**Symptoms**: NAS sluggish, out of memory errors

**Solutions**:
```bash
# Check memory usage
sudo docker stats

# Reduce resource limits in docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 1G  # Reduce from 2G
      cpus: '1'   # Reduce from 2
```

## Advanced Configuration

### Custom Tunnel Config

For advanced routing, create `config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Main app
  - hostname: tallow.manisahome.com
    service: http://tallow:3000
    originRequest:
      connectTimeout: 30s
      noTLSVerify: false

  # Signaling server
  - hostname: relay.manisahome.com
    service: ws://signaling:3001
    originRequest:
      connectTimeout: 30s
      noHappyEyeballs: true

  # Catch-all
  - service: http_status:404
```

Update docker-compose.yml:
```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  volumes:
    - ./cloudflare-config.yml:/root/.cloudflared/config.yml
  command: tunnel --config /root/.cloudflared/config.yml run
```

### Load Balancing Multiple Replicas

For high availability:

```yaml
# docker-compose.yml
services:
  tallow:
    deploy:
      replicas: 2
    # ... rest of config
```

Then in Cloudflare, configure load balancing in tunnel settings.

### Auto-Update with Watchtower

Add to docker-compose.yml:
```yaml
services:
  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400  # Check daily
```

## Performance Optimization

### Enable Cloudflare Caching

1. **Page Rules**:
   - Go to **Rules** → **Page Rules**
   - Create rule:
     - URL: `tallow.manisahome.com/_next/static/*`
     - Settings: Cache Level = Cache Everything, Edge TTL = 1 month

2. **Argo Smart Routing** (Paid):
   - Speeds up dynamic content by 30%
   - $5/month base + $0.10/GB

### Enable HTTP/3 (QUIC)

1. Go to **Network** in Cloudflare dashboard
2. Enable **HTTP/3 (with QUIC)**
3. This provides faster connection establishment

## Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Synology Docker Guide](https://kb.synology.com/en-global/DSM/help/Docker/docker_desc)
- [Tallow GitHub Repository](https://github.com/yourusername/tallow)
- [Cloudflare Zero Trust Community](https://community.cloudflare.com/c/security/zero-trust/55)

## Getting Help

**Tallow Issues**:
- Check logs: `sudo docker-compose logs tallow`
- GitHub Issues: https://github.com/yourusername/tallow/issues

**Cloudflare Tunnel Issues**:
- Cloudflare Community: https://community.cloudflare.com/
- Tunnel Status: https://www.cloudflarestatus.com/

**Synology Issues**:
- Synology Community: https://community.synology.com/
- DSM Knowledge Base: https://kb.synology.com/

## Summary

You've now deployed Tallow on your Synology NAS with Cloudflare Tunnel:

✅ **Secure**: No exposed ports, encrypted tunnel
✅ **Fast**: Cloudflare's global CDN
✅ **Private**: WebRTC connections through TURN relay
✅ **Reliable**: Docker with health checks and auto-restart
✅ **Professional**: Free SSL certificates and DDoS protection

Your Tallow instance is now accessible at:
- **App**: https://tallow.manisahome.com
- **Signaling**: wss://relay.manisahome.com

Enjoy secure, private file transfers!
