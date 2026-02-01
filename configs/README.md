# Tallow Configuration Files

This directory contains platform-specific configuration files for deploying Tallow.

## Directory Structure

```
configs/
├── nginx/              # Nginx reverse proxy configurations
├── systemd/            # Systemd service files (Linux)
├── pm2/                # PM2 process manager configuration
├── vercel/             # Vercel platform configuration
├── aws/                # AWS deployment configurations
├── gcp/                # Google Cloud Platform configurations
├── digitalocean/       # DigitalOcean App Platform spec
└── README.md           # This file
```

## Configuration Files

### Nginx

**File:** `nginx/tallow.conf`

Production-ready Nginx configuration with:
- HTTP to HTTPS redirect
- WebSocket support for signaling
- Rate limiting
- Security headers
- SSL/TLS configuration
- Gzip compression
- Static file caching

**Installation:**
```bash
sudo cp configs/nginx/tallow.conf /etc/nginx/sites-available/tallow
sudo ln -s /etc/nginx/sites-available/tallow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Customize:**
- Replace `tallow.yourdomain.com` with your domain
- Adjust rate limits in `limit_req_zone` directives
- Update SSL certificate paths
- Modify upstream ports if needed

---

### Systemd Services

**Files:**
- `systemd/tallow-app.service` - Main Next.js application
- `systemd/tallow-signaling.service` - WebSocket signaling server

**Installation:**
```bash
sudo cp configs/systemd/tallow-app.service /etc/systemd/system/
sudo cp configs/systemd/tallow-signaling.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable tallow-app tallow-signaling
sudo systemctl start tallow-app tallow-signaling
```

**Check Status:**
```bash
sudo systemctl status tallow-app
sudo systemctl status tallow-signaling
```

**View Logs:**
```bash
sudo journalctl -u tallow-app -f
sudo journalctl -u tallow-signaling -f
```

**Customize:**
- Update `User` and `Group` if not using `tallow` user
- Change `WorkingDirectory` if app is in different location
- Modify `Environment` variables as needed
- Adjust resource limits (`LimitNOFILE`, `Nice`)

---

### PM2 Process Manager

**File:** `pm2/ecosystem.config.js`

PM2 configuration for process management with:
- Cluster mode for app (multi-core utilization)
- Automatic restarts
- Log management
- Memory limits
- Deployment scripts

**Installation:**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start applications
pm2 start configs/pm2/ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup systemd
# Run the command it outputs
```

**Commands:**
```bash
pm2 status                    # Check status
pm2 logs                      # View logs
pm2 monit                     # Monitor resources
pm2 restart tallow-app        # Restart app
pm2 reload ecosystem.config.js # Reload with zero downtime
```

**Customize:**
- Update `cwd` paths
- Adjust `instances` (or use 'max')
- Modify `max_memory_restart`
- Update `deploy` section with your Git repo

---

### Vercel

**File:** `vercel/vercel.json`

Vercel platform configuration with:
- Build settings
- Security headers
- Rewrites for signaling server
- Function configuration
- Environment setup

**Usage:**
```bash
# Deploy with CLI
vercel --prod

# Or import via Vercel Dashboard
# The vercel.json will be automatically detected
```

**Important:**
- Update `rewrites` destination with your signaling server URL
- Deploy signaling server separately (Railway, Render, etc.)
- Add environment variables in Vercel Dashboard

**Customize:**
- Change `regions` for deployment region
- Adjust `functions.memory` based on plan
- Modify `headers` for additional security
- Update `rewrites` for signaling server location

---

### AWS

**File:** `aws/task-definition.json`

ECS/Fargate task definition with:
- Container configuration
- Resource allocation
- Health checks
- Secrets management (AWS Secrets Manager)
- Logging (CloudWatch)

**Usage:**
```bash
# Create task definition
aws ecs register-task-definition --cli-input-json file://configs/aws/task-definition.json

# Create service
aws ecs create-service \
  --cluster tallow-cluster \
  --service-name tallow-app \
  --task-definition tallow-app \
  --desired-count 2 \
  --launch-type FARGATE
```

**Prerequisites:**
1. Create ECR repositories
2. Push Docker images
3. Create IAM roles
4. Store secrets in AWS Secrets Manager
5. Create CloudWatch log groups

**Customize:**
- Replace `ACCOUNT_ID` with your AWS account ID
- Replace `REGION` with your AWS region
- Update secret ARNs
- Adjust `cpu` and `memory` values
- Modify `portMappings` if needed

---

### Google Cloud Platform

**File:** `gcp/app.yaml`

App Engine configuration with:
- Runtime settings (Node.js 20)
- Auto-scaling rules
- Static file handlers
- Health checks
- Environment variables

**Usage:**
```bash
# Deploy to App Engine
gcloud app deploy configs/gcp/app.yaml

# View logs
gcloud app logs tail -s default

# Set environment variables
gcloud app deploy --set-env-vars KEY=VALUE
```

**Important:**
- Build happens automatically on GCP
- Static files are served directly
- Environment variables must be non-sensitive (use Secret Manager for sensitive data)

**Customize:**
- Adjust `instance_class` (F1, F2, F4, F4_1G)
- Modify `automatic_scaling` parameters
- Update `handlers` for custom static paths
- Add `vpc_access_connector` if using VPC

---

### DigitalOcean

**File:** `digitalocean/app.yaml`

App Platform specification with:
- Service definitions (web + signaling)
- Build commands
- Environment variables
- Auto-scaling
- Health checks
- Domain configuration

**Usage:**
```bash
# Install doctl CLI
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# Create app
doctl apps create --spec configs/digitalocean/app.yaml

# Update app
doctl apps update <app-id> --spec configs/digitalocean/app.yaml

# View logs
doctl apps logs <app-id> --follow
```

**Important:**
- Replace `yourusername/tallow` with your Git repository
- Update `APP_ID` in ALLOWED_ORIGINS after first deployment
- Add secrets via dashboard or CLI

**Customize:**
- Adjust `instance_size_slug` (basic-xxs, basic-xs, basic-s, etc.)
- Modify `instance_count` for scaling
- Update `autoscaling` thresholds
- Change `region` (nyc, sfo, ams, sgp, etc.)

---

## Environment Variables

All platforms require these environment variables:

### Required
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
API_SECRET_KEY=<generate-with-openssl>
```

### TURN Server (Recommended)
```bash
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=<your-username>
NEXT_PUBLIC_TURN_CREDENTIAL=<your-credential>
NEXT_PUBLIC_FORCE_RELAY=true
```

### Optional
```bash
RESEND_API_KEY=<for-emails>
NEXT_PUBLIC_SENTRY_DSN=<for-error-tracking>
STRIPE_SECRET_KEY=<for-donations>
```

## Platform-Specific Setup

### Nginx + Systemd (Self-hosted, VPS)
```bash
1. Copy systemd services
2. Copy nginx configuration
3. Enable services
4. Setup SSL with Let's Encrypt
5. Start services
```

### PM2 (Self-hosted, VPS)
```bash
1. Install PM2 globally
2. Start with ecosystem config
3. Save PM2 list
4. Setup startup script
```

### Docker (Any platform)
```bash
# Already have docker-compose.yml in root
docker-compose up -d
```

### Cloud Platforms (Vercel, AWS, GCP, Azure, DO)
```bash
1. Use platform CLI or dashboard
2. Import/upload configuration file
3. Set environment variables
4. Deploy
```

## Choosing Configuration

| Platform | Config Files Needed |
|----------|-------------------|
| **Vercel** | `vercel/vercel.json` + separate signaling |
| **AWS EC2** | `nginx/tallow.conf` + `systemd/*.service` |
| **AWS ECS** | `aws/task-definition.json` |
| **GCP App Engine** | `gcp/app.yaml` |
| **GCP Cloud Run** | Dockerfile + gcloud commands |
| **Azure** | Azure CLI commands (no config file) |
| **DigitalOcean App** | `digitalocean/app.yaml` |
| **DigitalOcean Droplet** | `nginx/tallow.conf` + `systemd/*.service` |
| **Self-hosted VPS** | `nginx/tallow.conf` + `systemd/*.service` or `pm2/ecosystem.config.js` |
| **Docker** | `docker-compose.yml` (in root) |
| **Synology NAS** | `docker-compose.yml` (in root) |

## Security Notes

⚠️ **Important:**

1. **Never commit secrets** to Git
   - Use environment variables
   - Use platform secret managers
   - Keep `.env.local` in `.gitignore`

2. **Update placeholder values:**
   - Replace `yourdomain.com` with your domain
   - Replace `ACCOUNT_ID`, `REGION`, etc.
   - Generate secure random keys

3. **SSL/TLS certificates:**
   - Use Let's Encrypt (free)
   - Or platform-managed certificates
   - Never commit private keys

4. **Firewall rules:**
   - Only open required ports
   - Use security groups/firewalls
   - Implement rate limiting

## Testing Configurations

### Test Nginx Config
```bash
sudo nginx -t
```

### Test Systemd Service
```bash
sudo systemd-analyze verify tallow-app.service
```

### Test PM2 Config
```bash
pm2 start ecosystem.config.js --dry-run
```

### Test Docker Compose
```bash
docker-compose config
```

## Getting Help

- 📖 **Full deployment guide:** `../DEPLOYMENT-GUIDE.md`
- 🆚 **Platform comparison:** `../DEPLOYMENT_COMPARISON.md`
- 🐛 **Troubleshooting:** `../TROUBLESHOOTING.md`
- 🎯 **Setup wizard:** `../setup-deployment.sh`

## Contributing

When adding new configurations:

1. Follow existing naming conventions
2. Add comments explaining settings
3. Include placeholders for sensitive values
4. Update this README
5. Test configuration before committing

---

**Last Updated:** 2025-01-25
