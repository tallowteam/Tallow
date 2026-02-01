# Quick Start: Deploy Tallow in 15 Minutes

The fastest way to get Tallow running in production.

## Choose Your Speed

### ⚡ Fastest (5-10 minutes)
**Vercel - One-Click Deployment**

Perfect for: Testing, personal use, quick demos

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Follow prompts, done!
```

**Note:** You'll need to deploy signaling separately (see below).

---

### 🚀 Quick & Easy (10-15 minutes)
**DigitalOcean App Platform**

Perfect for: Small teams, production apps, predictable costs

1. **Create account:** [DigitalOcean](https://www.digitalocean.com)
2. **Connect Git:** Link your GitHub/GitLab
3. **Use config:** Upload `configs/digitalocean/app.yaml`
4. **Add secrets:** Set environment variables
5. **Deploy!**

Cost: ~$17/month

---

### 🐳 Docker Anywhere (15-20 minutes)
**Docker Compose**

Perfect for: Self-hosted, full control, any VPS

```bash
# 1. Setup environment
./setup-deployment.sh

# 2. Deploy
./deploy-docker.sh

# 3. Access at http://localhost:3000
```

For remote deployment:
```bash
./deploy-docker.sh remote user@your-server-ip
```

---

## Step-by-Step: Vercel (Fastest)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Deploy

```bash
# From your Tallow directory
vercel

# For production
vercel --prod
```

### 4. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
API_SECRET_KEY=<run: openssl rand -hex 32>
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=<your-turn-username>
NEXT_PUBLIC_TURN_CREDENTIAL=<your-turn-credential>
```

### 5. Deploy Signaling Server

**Option A: Railway.app (Free tier available)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Copy signaling files
cp signaling-server.js package.json <railway-dir>

# Deploy
railway up

# Get URL
railway domain
```

Set in Vercel env:
```
NEXT_PUBLIC_SIGNALING_URL=wss://your-app.up.railway.app/signaling
```

**Option B: Render.com (Free tier)**

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect your repo
4. Build command: `npm install`
5. Start command: `node signaling-server.js`
6. Environment: `SIGNALING_PORT=3001`

### ✅ Done!

Visit your Vercel URL and test file transfer.

---

## Step-by-Step: DigitalOcean

### 1. Create Account

Sign up at [DigitalOcean](https://www.digitalocean.com)

### 2. Create App

1. Apps → Create App
2. Choose GitHub/GitLab
3. Select your Tallow repository
4. Choose branch: `main`

### 3. Configure App

**Method A: Use App Spec (Recommended)**

Upload `configs/digitalocean/app.yaml` and customize:
- Replace `yourusername/tallow` with your repo
- Update domain

**Method B: Manual Configuration**

**Web Service:**
- Name: `tallow-app`
- Build command: `npm run build`
- Run command: `npm start`
- HTTP Port: `3000`
- Instance size: `Basic ($5)`
- Instance count: `2`

**Signaling Service:**
- Name: `tallow-signaling`
- Build command: `npm install`
- Run command: `node signaling-server.js`
- HTTP Port: `3001`
- Instance size: `Basic ($2.50)`

### 4. Environment Variables

Add in App Settings:

```bash
# Required
NODE_ENV=production
API_SECRET_KEY=<generate-random>

# TURN Server
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=<your-username>
NEXT_PUBLIC_TURN_CREDENTIAL=<your-credential>

# Optional
RESEND_API_KEY=<for-emails>
```

### 5. Deploy

Click "Create Resources" and wait ~5 minutes.

### 6. Custom Domain (Optional)

1. Apps → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. SSL is automatic

### ✅ Done!

Your app is live at `<app-name>.ondigitalocean.app`

---

## Step-by-Step: Docker Self-Hosted

### 1. Prepare Server

**Minimum requirements:**
- Ubuntu 22.04 LTS
- 2GB RAM
- 20GB disk
- Public IP or domain

**Recommended VPS providers:**
- Hetzner: €5/month
- Vultr: $6/month
- DigitalOcean: $12/month
- Linode: $12/month

### 2. SSH to Server

```bash
ssh root@your-server-ip
```

### 3. Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify
docker --version
docker-compose --version
```

### 4. Clone Repository

```bash
cd /opt
git clone https://github.com/yourusername/tallow.git
cd tallow
```

### 5. Configure Environment

```bash
# Copy template
cp .env.example .env.local

# Edit variables
nano .env.local
```

Required variables:
```bash
NODE_ENV=production
API_SECRET_KEY=<generate-with-openssl-rand-hex-32>
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=<your-username>
NEXT_PUBLIC_TURN_CREDENTIAL=<your-credential>
```

### 6. Start Application

```bash
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 7. Install Nginx

```bash
apt install nginx -y

# Copy config
cp configs/nginx/tallow.conf /etc/nginx/sites-available/tallow

# Edit domain
nano /etc/nginx/sites-available/tallow
# Replace tallow.yourdomain.com with your domain

# Enable site
ln -s /etc/nginx/sites-available/tallow /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 8. Setup SSL

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Test auto-renewal
certbot renew --dry-run
```

### 9. Configure Firewall

```bash
# Enable UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Check status
ufw status
```

### 10. Point DNS

Add A record:
```
A    @    <your-server-ip>    TTL: 300
```

### ✅ Done!

Visit `https://your-domain.com`

---

## Get TURN Server Credentials

Required for P2P connections behind NATs.

### Free Option: Metered

1. Go to [metered.ca/stun-turn](https://www.metered.ca/stun-turn)
2. Sign up (free tier: 50GB/month)
3. Create app
4. Copy credentials:
   ```
   Server: turns:relay.metered.ca:443?transport=tcp
   Username: <shown in dashboard>
   Credential: <shown in dashboard>
   ```

### Alternative: Twilio

1. Go to [twilio.com](https://www.twilio.com/stun-turn)
2. Sign up
3. Generate credentials
4. Pay-as-you-go pricing

---

## Testing Your Deployment

### 1. Basic Access Test

```bash
curl https://your-domain.com
# Should return HTML
```

### 2. Health Check

```bash
curl https://your-domain.com/health
# Should return: {"status":"ok"}
```

### 3. Signaling Test

```bash
# Install wscat
npm install -g wscat

# Test WebSocket
wscat -c wss://your-domain.com/signaling
# Should connect successfully
```

### 4. Full P2P Test

1. Open app on two devices
2. Create connection on device 1
3. Join with code on device 2
4. Verify SAS codes match
5. Transfer small test file
6. Check transfer speed

---

## Common First-Time Issues

### "502 Bad Gateway"

**Solution:**
```bash
# Check if app is running
docker ps
# or
pm2 status

# Restart
docker-compose restart
# or
pm2 restart all
```

### "WebSocket connection failed"

**Solution:**
```bash
# Check Nginx config has WebSocket headers
grep -A 5 "Upgrade" /etc/nginx/sites-available/tallow

# Should see:
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
```

### "SSL certificate error"

**Solution:**
```bash
# Check certificate
certbot certificates

# Renew if needed
certbot renew --force-renewal

# Restart Nginx
systemctl restart nginx
```

### "Can't connect to TURN server"

**Solution:**
1. Verify credentials in `.env.local`
2. Test at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
3. Check firewall allows outbound connections
4. Try different TURN provider

---

## Next Steps

After deployment:

1. ✅ **Test thoroughly**
   - Multiple browsers
   - Different networks
   - Various file sizes

2. ✅ **Setup monitoring**
   - UptimeRobot for uptime
   - Sentry for errors
   - Platform monitoring

3. ✅ **Configure backups**
   - Environment variables
   - Configuration files
   - Regular snapshots

4. ✅ **Enable analytics** (optional)
   - Vercel Analytics
   - Google Analytics
   - Plausible

5. ✅ **Review security**
   - Check security headers
   - Test rate limiting
   - Verify SSL/TLS

---

## Getting Help

### Quick References

- 📖 **Full guide:** [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
- 🆚 **Platform comparison:** [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md)
- 🐛 **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 🎯 **Setup wizard:** `./setup-deployment.sh`

### Support Channels

- GitHub Issues
- Community Discord
- Stack Overflow (tag: tallow)

### Before Asking

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs for errors
3. Search existing issues
4. Include environment details

---

## Pro Tips

### Save Time

1. **Use setup wizard:**
   ```bash
   ./setup-deployment.sh
   ```
   Configures everything interactively.

2. **Start small, scale later:**
   - Begin with Vercel or DigitalOcean
   - Migrate to AWS/GCP when needed

3. **Use deployment scripts:**
   - `./deploy-vercel.sh production`
   - `./deploy-docker.sh remote user@host`

### Save Money

1. **Free tiers:**
   - Vercel: Hobby plan ($0)
   - Cloudflare: Free tier
   - TURN: Metered free tier

2. **Cheap VPS:**
   - Hetzner: €5/month
   - Vultr: $6/month

3. **Optimize resources:**
   - Enable CDN
   - Use image optimization
   - Implement caching

### Increase Reliability

1. **Multiple regions:** Deploy in 2+ locations
2. **Auto-scaling:** Use platform auto-scaling
3. **Health checks:** Monitor uptime
4. **Backups:** Automate configuration backups
5. **Monitoring:** Setup Sentry + uptime monitoring

---

**Choose your deployment method above and get Tallow running in minutes!**

For detailed instructions, see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
