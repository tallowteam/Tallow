# 🚀 Tallow Production Deployment Guide

**Complete deployment guide for all major cloud platforms and self-hosted environments.**

> **Preserves:** All security/privacy features (PQC encryption, SAS verification, traffic obfuscation, P2P transfers)

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Platform-Specific Guides](#deployment-platforms)
   - [Vercel (Recommended for Quick Start)](#1-vercel-deployment)
   - [AWS (Enterprise/Scalable)](#2-aws-deployment)
   - [Google Cloud Platform](#3-google-cloud-platform)
   - [Microsoft Azure](#4-azure-deployment)
   - [DigitalOcean](#5-digitalocean-deployment)
   - [Cloudflare Pages + Workers](#6-cloudflare-pages--workers)
   - [Self-Hosted (VPS/Dedicated Server)](#7-self-hosted-deployment)
   - [Synology NAS](#8-synology-nas-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Tallow is a Next.js application with these deployment requirements:

- **Node.js 20+** runtime
- **WebSocket support** for signaling server (P2P coordination)
- **HTTPS/TLS** required (WebRTC security requirement)
- **Environment variables** for configuration
- **No database required** (pure client-side encryption)

### Architecture Components

1. **Next.js Web App** (port 3000) - Main application
2. **Signaling Server** (port 3001) - WebSocket server for P2P signaling
3. **Optional:** CDN for static assets
4. **Optional:** TURN server for NAT traversal

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 20+ installed locally (for testing)
- [ ] Git repository with your Tallow code
- [ ] Domain name (or subdomain) for production access
- [ ] SSL/TLS certificate (or use platform-provided certs)
- [ ] TURN server credentials (recommended for production)
- [ ] Email service API key (optional - for welcome emails)

### Required Build Tools

```bash
# Install dependencies
npm install

# Test build locally
npm run build

# Test production mode
npm run start
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

### Required Variables

```bash
# Node environment
NODE_ENV=production

# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1

# Signaling server URL (will be same origin with /signaling path)
# Leave empty to use same origin, or specify: wss://your-domain.com/signaling
NEXT_PUBLIC_SIGNALING_URL=

# API Security (generate with: openssl rand -hex 32)
API_SECRET_KEY=your-secret-key-here
```

### TURN Server Configuration (Recommended)

For reliable P2P connections behind NATs:

```bash
# TURN server for WebRTC relay
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-credential

# Privacy settings
NEXT_PUBLIC_FORCE_RELAY=true  # Force relay to hide IPs
NEXT_PUBLIC_ALLOW_DIRECT=false  # Prevent direct connections
```

**Free TURN Providers:**
- [Metered](https://www.metered.ca/stun-turn) - 50GB free/month
- [Xirsys](https://xirsys.com/) - Free tier available
- [Twilio](https://www.twilio.com/stun-turn) - Pay-as-you-go

### Optional Variables

```bash
# Email service (for welcome emails)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Error tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_APP_VERSION=1.0.0

# Stripe donations
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Deployment Platforms

Choose the platform that best fits your needs:

| Platform | Best For | Difficulty | Est. Monthly Cost |
|----------|----------|------------|-------------------|
| **Vercel** | Quick deployment, auto-scaling | Easy | $0-20 (Hobby-Pro) |
| **AWS** | Enterprise, full control | Advanced | $20-100+ |
| **Google Cloud** | Container-based, auto-scaling | Moderate | $15-75 |
| **Azure** | Microsoft ecosystem | Moderate | $20-80 |
| **DigitalOcean** | Developer-friendly, simple | Easy | $12-48 |
| **Cloudflare** | Global CDN, edge computing | Moderate | $0-20 |
| **Self-Hosted** | Full control, privacy | Advanced | $5-50 (VPS cost) |
| **Synology NAS** | Home/small office | Moderate | $0 (hardware only) |

---

## 1. Vercel Deployment

**Best for:** Quick deployment, automatic scaling, zero config

### Step 1: Prerequisites

- GitHub/GitLab/Bitbucket account
- Vercel account (free tier available)
- Your repository pushed to Git

### Step 2: Deploy from Git

#### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure build settings:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

5. Click **"Deploy"**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project directory
cd /path/to/tallow
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name: tallow
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 3: Configure Environment Variables

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:

```bash
# Required
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
API_SECRET_KEY=<generate-with-openssl-rand-hex-32>

# TURN Server (recommended)
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
NEXT_PUBLIC_FORCE_RELAY=true

# Optional
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

4. Click **"Save"** and redeploy

### Step 4: Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Add your domain: `tallow.yourdomain.com`
3. Configure DNS:
   - **CNAME Record:** `tallow` → `cname.vercel-dns.com`
4. Wait for SSL provisioning (automatic, ~1-2 minutes)

### Step 5: Deploy Signaling Server

**Important:** Vercel doesn't support long-running WebSocket servers. Deploy signaling separately:

#### Option A: Use Vercel for app, separate service for signaling

Deploy signaling to Railway, Render, or Fly.io:

**Railway.app:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in signaling directory
mkdir tallow-signaling
cd tallow-signaling

# Copy signaling server files
cp /path/to/tallow/signaling-server.js .
cp /path/to/tallow/package.json .
npm install socket.io

# Create railway.json
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node signaling-server.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF

# Deploy
railway up

# Get deployment URL
railway domain
# Example: tallow-signaling.up.railway.app
```

Set in Vercel environment variables:
```bash
NEXT_PUBLIC_SIGNALING_URL=wss://tallow-signaling.up.railway.app/signaling
```

#### Option B: Use Vercel Serverless WebSockets (Edge Runtime)

**Note:** Limited support, use Option A for production.

### Estimated Costs

| Tier | Price | Limits |
|------|-------|--------|
| Hobby | **Free** | 100GB bandwidth, 100 builds/day |
| Pro | **$20/month** | 1TB bandwidth, unlimited builds |

### Pros & Cons

**Pros:**
- Zero configuration
- Automatic HTTPS
- Global CDN
- Instant deployments
- Preview deployments for PRs

**Cons:**
- No native WebSocket support (need separate signaling server)
- Build time limits
- Vendor lock-in

---

## 2. AWS Deployment

**Best for:** Enterprise deployments, full control, scalability

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CloudFront (CDN + SSL)                         │
│              - Static assets cached globally                │
│              - WebSocket forwarding                         │
└─────────────────────────────────────────────────────────────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
        ┌───────────────┐    ┌──────────────┐
        │  ALB (Load    │    │  ALB (Load   │
        │  Balancer)    │    │  Balancer)   │
        │  Port 443     │    │  Port 3001   │
        └───────────────┘    └──────────────┘
                  │                   │
          ┌───────┴────────┐   ┌──────┴──────┐
          ▼                ▼   ▼             ▼
    ┌─────────┐      ┌─────────┐  ┌──────────┐
    │ ECS/EC2 │      │ ECS/EC2 │  │ ECS/EC2  │
    │ (App)   │      │ (App)   │  │(Signaling│
    └─────────┘      └─────────┘  └──────────┘
```

### Option A: EC2 with PM2

#### Step 1: Launch EC2 Instance

```bash
# Via AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Ubuntu 22.04 LTS
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=tallow-app}]'
```

**Or use AWS Console:**
1. Go to EC2 → Launch Instance
2. Select **Ubuntu Server 22.04 LTS**
3. Instance type: **t3.small** (2 vCPU, 2GB RAM)
4. Configure security group:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (3001) - 0.0.0.0/0 (signaling)

#### Step 2: SSH and Setup Server

```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/tallow.git
cd tallow

# Install dependencies
sudo npm install

# Create environment file
sudo nano .env.local
# Paste your environment variables (see Environment Variables section)

# Build application
sudo npm run build

# Start with PM2
sudo pm2 start npm --name "tallow-app" -- start
sudo pm2 start signaling-server.js --name "tallow-signaling"

# Save PM2 process list
sudo pm2 save

# Setup PM2 startup script
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/tallow
```

Add configuration:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

# Upstream for Next.js app
upstream tallow_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Upstream for signaling server
upstream tallow_signaling {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name tallow.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tallow.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tallow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tallow.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Client upload size
    client_max_body_size 100M;

    # Signaling WebSocket endpoint
    location /signaling {
        proxy_pass http://tallow_signaling;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://tallow_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files with caching
    location /_next/static {
        proxy_pass http://tallow_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Main application
    location / {
        limit_req zone=general_limit burst=50 nodelay;

        proxy_pass http://tallow_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/tallow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d tallow.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Step 6: Configure DNS

Add A record pointing to your EC2 public IP:

```
A    tallow    <EC2-PUBLIC-IP>    TTL: 300
```

### Option B: ECS with Fargate (Containers)

#### Step 1: Create ECR Repository

```bash
# Create repository for app
aws ecr create-repository --repository-name tallow-app

# Create repository for signaling
aws ecr create-repository --repository-name tallow-signaling

# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Build and Push Docker Images

```bash
# Build app image
docker build -t tallow-app .

# Tag for ECR
docker tag tallow-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tallow-app:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tallow-app:latest

# Build signaling image
docker build -f Dockerfile.signaling -t tallow-signaling .
docker tag tallow-signaling:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tallow-signaling:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tallow-signaling:latest
```

#### Step 3: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name tallow-cluster
```

#### Step 4: Create Task Definitions

**App Task Definition (tallow-app-task.json):**

```json
{
  "family": "tallow-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "tallow-app",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/tallow-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "NEXT_TELEMETRY_DISABLED", "value": "1"}
      ],
      "secrets": [
        {
          "name": "API_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tallow/api-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tallow-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task:
```bash
aws ecs register-task-definition --cli-input-json file://tallow-app-task.json
```

#### Step 5: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name tallow-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create target groups
aws elbv2 create-target-group \
  --name tallow-app-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345 \
  --target-type ip \
  --health-check-path /

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>
```

#### Step 6: Create ECS Service

```bash
aws ecs create-service \
  --cluster tallow-cluster \
  --service-name tallow-app-service \
  --task-definition tallow-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=<tg-arn>,containerName=tallow-app,containerPort=3000
```

### Option C: Elastic Beanstalk

**Simplified deployment with auto-scaling:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
cd /path/to/tallow
eb init -p node.js-20 tallow

# Create environment
eb create tallow-prod \
  --instance-type t3.small \
  --envvars NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1

# Deploy
eb deploy

# Configure environment variables
eb setenv API_SECRET_KEY=your-secret-key \
  NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443 \
  NEXT_PUBLIC_TURN_USERNAME=your-username \
  NEXT_PUBLIC_TURN_CREDENTIAL=your-credential

# Open in browser
eb open
```

### Estimated AWS Costs

| Component | Tier | Monthly Cost |
|-----------|------|--------------|
| EC2 t3.small | 24/7 | ~$15 |
| ECS Fargate (2 tasks) | 0.5 vCPU, 1GB | ~$30 |
| Application Load Balancer | Standard | ~$16 |
| CloudFront | 1TB transfer | ~$85 |
| Route 53 | 1 hosted zone | ~$0.50 |
| **Total (EC2)** | | **~$32/month** |
| **Total (ECS)** | | **~$132/month** |

### AWS Pros & Cons

**Pros:**
- Full control over infrastructure
- Extensive monitoring (CloudWatch)
- Auto-scaling capabilities
- Global CDN (CloudFront)
- Enterprise-grade security

**Cons:**
- Complex setup
- Higher costs
- Requires AWS expertise
- Manual SSL management (if not using ACM)

---

## 3. Google Cloud Platform

**Best for:** Container deployments, global infrastructure, Google ecosystem

### Option A: Cloud Run (Serverless Containers)

#### Step 1: Install Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash

# Initialize
gcloud init
gcloud auth login
```

#### Step 2: Build and Push to Container Registry

```bash
# Set project ID
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable containerregistry.googleapis.com run.googleapis.com

# Build and push app image
gcloud builds submit --tag gcr.io/$PROJECT_ID/tallow-app .

# Build and push signaling image
gcloud builds submit --tag gcr.io/$PROJECT_ID/tallow-signaling -f Dockerfile.signaling .
```

#### Step 3: Deploy to Cloud Run

**Deploy Main App:**
```bash
gcloud run deploy tallow-app \
  --image gcr.io/$PROJECT_ID/tallow-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1 \
  --set-secrets API_SECRET_KEY=tallow-api-secret:latest
```

**Deploy Signaling Server:**
```bash
gcloud run deploy tallow-signaling \
  --image gcr.io/$PROJECT_ID/tallow-signaling \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 5 \
  --set-env-vars SIGNALING_PORT=3001
```

#### Step 4: Configure Custom Domain

```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service tallow-app \
  --domain tallow.yourdomain.com \
  --region us-central1

# Get verification record
gcloud run domain-mappings describe \
  --domain tallow.yourdomain.com \
  --region us-central1

# Add DNS records shown in output
```

#### Step 5: Setup Cloud Load Balancer (for WebSocket)

Cloud Run has limited WebSocket support, so use a load balancer:

```bash
# Create serverless NEG for app
gcloud compute network-endpoint-groups create tallow-app-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=tallow-app

# Create serverless NEG for signaling
gcloud compute network-endpoint-groups create tallow-signaling-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=tallow-signaling

# Create backend services
gcloud compute backend-services create tallow-app-backend \
  --global \
  --load-balancing-scheme=EXTERNAL \
  --enable-cdn

gcloud compute backend-services add-backend tallow-app-backend \
  --global \
  --network-endpoint-group=tallow-app-neg \
  --network-endpoint-group-region=us-central1

# Create URL map
gcloud compute url-maps create tallow-lb \
  --default-service tallow-app-backend

# Add path matcher for signaling
gcloud compute url-maps add-path-matcher tallow-lb \
  --path-matcher-name=signaling-matcher \
  --default-service=tallow-app-backend \
  --path-rules="/signaling/*=tallow-signaling-backend"

# Create SSL certificate
gcloud compute ssl-certificates create tallow-cert \
  --domains=tallow.yourdomain.com

# Create HTTPS proxy
gcloud compute target-https-proxies create tallow-https-proxy \
  --url-map=tallow-lb \
  --ssl-certificates=tallow-cert

# Create forwarding rule
gcloud compute forwarding-rules create tallow-https-rule \
  --global \
  --target-https-proxy=tallow-https-proxy \
  --ports=443
```

### Option B: Google Kubernetes Engine (GKE)

**For advanced users needing full container orchestration:**

#### Step 1: Create GKE Cluster

```bash
gcloud container clusters create tallow-cluster \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type n1-standard-1 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 5
```

#### Step 2: Create Kubernetes Manifests

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tallow-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tallow-app
  template:
    metadata:
      labels:
        app: tallow-app
    spec:
      containers:
      - name: tallow-app
        image: gcr.io/PROJECT_ID/tallow-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_TELEMETRY_DISABLED
          value: "1"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tallow-signaling
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tallow-signaling
  template:
    metadata:
      labels:
        app: tallow-signaling
    spec:
      containers:
      - name: tallow-signaling
        image: gcr.io/PROJECT_ID/tallow-signaling:latest
        ports:
        - containerPort: 3001
        env:
        - name: SIGNALING_PORT
          value: "3001"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: tallow-app-service
spec:
  type: LoadBalancer
  selector:
    app: tallow-app
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: tallow-signaling-service
spec:
  type: LoadBalancer
  selector:
    app: tallow-signaling
  ports:
  - port: 3001
    targetPort: 3001
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl get services  # Get external IPs
```

### Estimated GCP Costs

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| Cloud Run (App) | 1M requests, 360k GiB-sec | ~$20 |
| Cloud Run (Signaling) | Always on, 512MB | ~$15 |
| Cloud Load Balancer | Standard | ~$18 |
| Cloud CDN | 1TB egress | ~$80 |
| **Total** | | **~$55-133/month** |

### GCP Pros & Cons

**Pros:**
- Serverless auto-scaling
- Pay per use
- Global infrastructure
- Easy SSL management
- Good DDoS protection

**Cons:**
- Cold start times (Cloud Run)
- Limited WebSocket duration (1 hour max)
- Requires load balancer for production

---

## 4. Azure Deployment

**Best for:** Microsoft ecosystem, enterprise Windows shops

### Option A: Azure App Service

#### Step 1: Install Azure CLI

```bash
# macOS
brew install azure-cli

# Windows
# Download from: https://aka.ms/installazurecliwindows

# Login
az login
```

#### Step 2: Create Resource Group

```bash
az group create --name tallow-rg --location eastus
```

#### Step 3: Create App Service Plan

```bash
az appservice plan create \
  --name tallow-plan \
  --resource-group tallow-rg \
  --sku B1 \
  --is-linux
```

#### Step 4: Create Web Apps

**Main App:**
```bash
az webapp create \
  --resource-group tallow-rg \
  --plan tallow-plan \
  --name tallow-app-unique \
  --runtime "NODE:20-lts" \
  --deployment-local-git

# Configure environment
az webapp config appsettings set \
  --resource-group tallow-rg \
  --name tallow-app-unique \
  --settings NODE_ENV=production \
             NEXT_TELEMETRY_DISABLED=1 \
             SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy via Git
git remote add azure https://tallow-app-unique.scm.azurewebsites.net/tallow-app-unique.git
git push azure main
```

**Signaling Server:**
```bash
az webapp create \
  --resource-group tallow-rg \
  --plan tallow-plan \
  --name tallow-signaling-unique \
  --runtime "NODE:20-lts"

# Configure startup
az webapp config set \
  --resource-group tallow-rg \
  --name tallow-signaling-unique \
  --startup-file "node signaling-server.js"

az webapp config appsettings set \
  --resource-group tallow-rg \
  --name tallow-signaling-unique \
  --settings SIGNALING_PORT=8080 \
             WEBSITES_PORT=8080
```

#### Step 5: Configure Custom Domain & SSL

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group tallow-rg \
  --webapp-name tallow-app-unique \
  --hostname tallow.yourdomain.com

# Enable HTTPS
az webapp update \
  --resource-group tallow-rg \
  --name tallow-app-unique \
  --https-only true

# Bind SSL certificate (managed certificate)
az webapp config ssl create \
  --resource-group tallow-rg \
  --name tallow-app-unique \
  --hostname tallow.yourdomain.com
```

### Option B: Azure Container Instances

**For Docker deployments:**

```bash
# Create container registry
az acr create \
  --resource-group tallow-rg \
  --name tallowregistry \
  --sku Basic

# Login to ACR
az acr login --name tallowregistry

# Build and push images
az acr build \
  --registry tallowregistry \
  --image tallow-app:latest \
  --file Dockerfile .

# Create container instance
az container create \
  --resource-group tallow-rg \
  --name tallow-app-container \
  --image tallowregistry.azurecr.io/tallow-app:latest \
  --dns-name-label tallow-app-unique \
  --ports 3000 \
  --cpu 1 \
  --memory 1.5 \
  --environment-variables \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
```

### Estimated Azure Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| App Service | B1 (Basic) | ~$13 |
| App Service | S1 (Standard) | ~$69 |
| Container Instances | 1 vCPU, 1.5GB | ~$32 |
| Application Gateway | Standard | ~$125 |
| **Total (App Service)** | | **~$26-138/month** |

### Azure Pros & Cons

**Pros:**
- Integrated with Microsoft ecosystem
- Easy deployment from Git
- Managed SSL certificates
- Good Windows support

**Cons:**
- More expensive than competitors
- Less flexible than AWS
- Limited WebSocket support on Basic tier

---

## 5. DigitalOcean Deployment

**Best for:** Developer-friendly, predictable pricing, simplicity

### Option A: App Platform (PaaS)

#### Step 1: Prepare App Spec

Create `app.yaml`:

```yaml
name: tallow
region: nyc

services:
  - name: web
    github:
      repo: yourusername/tallow
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: basic-xs
    http_port: 3000
    envs:
      - key: NODE_ENV
        value: production
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"
      - key: API_SECRET_KEY
        value: ${API_SECRET_KEY}
        type: SECRET
    routes:
      - path: /
    health_check:
      http_path: /

  - name: signaling
    github:
      repo: yourusername/tallow
      branch: main
    build_command: npm install
    run_command: node signaling-server.js
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3001
    envs:
      - key: SIGNALING_PORT
        value: "3001"
    routes:
      - path: /signaling

domains:
  - domain: tallow.yourdomain.com
    type: PRIMARY
```

#### Step 2: Deploy via CLI

```bash
# Install doctl
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Create app
doctl apps create --spec app.yaml

# Get app ID
doctl apps list

# Monitor deployment
doctl apps logs <app-id> --follow
```

#### Step 3: Configure Domain

```bash
# Add domain to app
doctl apps update <app-id> --spec app.yaml

# Add DNS records (in DigitalOcean DNS or your provider)
# CNAME: tallow -> <app-url>.ondigitalocean.app
```

### Option B: Droplet with Docker

#### Step 1: Create Droplet

```bash
# Create droplet
doctl compute droplet create tallow \
  --region nyc3 \
  --size s-2vcpu-2gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys <your-ssh-key-id>

# Get IP address
doctl compute droplet list
```

#### Step 2: SSH and Setup

```bash
# Connect
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Clone repository
cd /opt
git clone https://github.com/yourusername/tallow.git
cd tallow

# Create .env file
nano .env.local
# Add your environment variables

# Start with Docker Compose
docker-compose up -d
```

#### Step 3: Setup Nginx & SSL

```bash
# Install Nginx
apt install nginx certbot python3-certbot-nginx -y

# Configure (use same Nginx config from AWS section)
nano /etc/nginx/sites-available/tallow

# Enable and restart
ln -s /etc/nginx/sites-available/tallow /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d tallow.yourdomain.com
```

### Option C: DigitalOcean Spaces (for Static Assets)

**Optional CDN for assets:**

```bash
# Create Space
doctl compute cdn create \
  --origin tallow-assets.nyc3.digitaloceanspaces.com \
  --custom-domain assets.tallow.yourdomain.com \
  --certificate-id <cert-id>
```

### Estimated DigitalOcean Costs

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| App Platform | 2x Basic + 1x XXS | ~$17 |
| Droplet | 2GB RAM, 2 vCPU | ~$12 |
| Spaces + CDN | 250GB storage, 1TB transfer | ~$5 |
| Load Balancer | Optional | ~$10 |
| **Total (App Platform)** | | **~$17-32/month** |
| **Total (Droplet)** | | **~$12-27/month** |

### DigitalOcean Pros & Cons

**Pros:**
- Simple, predictable pricing
- Developer-friendly UI
- Good documentation
- Fast provisioning
- Integrated monitoring

**Cons:**
- Less global reach than AWS/GCP
- Fewer advanced features
- Limited compliance certifications

---

## 6. Cloudflare Pages + Workers

**Best for:** Global edge deployment, minimal latency, generous free tier

### Option A: Cloudflare Pages (Static) + Workers (API)

**Note:** Next.js SSR requires Cloudflare Workers paid plan

#### Step 1: Setup Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Initialize project
wrangler pages project create tallow

# Deploy
npm run build
wrangler pages deploy .next/
```

#### Step 2: Configure Build Settings

In Cloudflare Dashboard:
1. Go to Pages → tallow
2. Settings → Builds & deployments
3. Configure:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output:** `.next`
   - **Node version:** 20

#### Step 3: Add Environment Variables

```bash
wrangler pages secret put API_SECRET_KEY
wrangler pages secret put RESEND_API_KEY
```

#### Step 4: Deploy Signaling Worker

Create `signaling-worker.js`:

```javascript
export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Handle WebSocket (use Durable Objects for state)
    await env.SIGNALING.fetch(request);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
};
```

Deploy:
```bash
wrangler deploy signaling-worker.js --name tallow-signaling
```

#### Step 5: Configure Custom Domain

1. Go to Pages → Custom domains
2. Add `tallow.yourdomain.com`
3. Cloudflare automatically provisions SSL

### Option B: Traditional Hosting with Cloudflare CDN

Use any hosting (AWS, DO, etc.) and add Cloudflare in front:

1. Point DNS to Cloudflare nameservers
2. Add A record for your server IP
3. Enable "Proxied" (orange cloud)
4. Configure SSL/TLS → Full (strict)
5. Enable WebSockets in Network settings

### Estimated Cloudflare Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Pages | Free (500 builds/month) | **$0** |
| Pages | Unlimited builds | **$20** |
| Workers | 100k requests/day | **$0** |
| Workers | Paid (Durable Objects) | **$5+** |
| **Total** | | **$0-25/month** |

### Cloudflare Pros & Cons

**Pros:**
- Global edge network
- Excellent DDoS protection
- Free SSL
- Generous free tier
- Built-in analytics

**Cons:**
- Complex WebSocket setup
- Requires Durable Objects for stateful apps
- Learning curve for Workers
- Limited SSR support on free tier

---

## 7. Self-Hosted Deployment

**Best for:** Full control, privacy, cost optimization, learning

### Prerequisites

- VPS or dedicated server (1GB+ RAM, 1+ CPU)
- Ubuntu 22.04 LTS (recommended)
- Root or sudo access
- Domain name

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create non-root user
sudo adduser tallow
sudo usermod -aG sudo tallow

# Switch to new user
su - tallow

# Setup firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 2: Install Dependencies

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version

# Install build tools
sudo apt install -y build-essential

# Install Git
sudo apt install -y git

# Install PM2
sudo npm install -g pm2
```

### Step 3: Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/tallow
sudo chown -R tallow:tallow /var/www/tallow

# Clone repository
cd /var/www/tallow
git clone https://github.com/yourusername/tallow.git .

# Install dependencies
npm install

# Create environment file
nano .env.local
```

Paste environment variables:
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
API_SECRET_KEY=<your-secret-key>
NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME=<your-username>
NEXT_PUBLIC_TURN_CREDENTIAL=<your-credential>
NEXT_PUBLIC_FORCE_RELAY=true
```

Build and start:
```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "tallow-app" -- start
pm2 start signaling-server.js --name "tallow-signaling"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs
```

### Step 4: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tallow
```

Use the Nginx configuration from the AWS section (EC2 deployment).

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tallow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d tallow.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### Step 6: Configure Systemd Service (Alternative to PM2)

Create `/etc/systemd/system/tallow-app.service`:

```ini
[Unit]
Description=Tallow Web Application
After=network.target

[Service]
Type=simple
User=tallow
WorkingDirectory=/var/www/tallow
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/tallow-signaling.service`:

```ini
[Unit]
Description=Tallow Signaling Server
After=network.target

[Service]
Type=simple
User=tallow
WorkingDirectory=/var/www/tallow
Environment=SIGNALING_PORT=3001
ExecStart=/usr/bin/node signaling-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tallow-app tallow-signaling
sudo systemctl start tallow-app tallow-signaling
sudo systemctl status tallow-app tallow-signaling
```

### Step 7: Setup Monitoring

#### Netdata (System Monitoring)

```bash
# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access at: http://your-server-ip:19999
```

#### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Web dashboard
pm2 plus
```

#### Setup Log Rotation

```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Step 8: Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/tallow-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/tallow"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/tallow-$DATE.tar.gz \
  /var/www/tallow \
  --exclude=node_modules \
  --exclude=.next

# Keep only last 7 backups
find $BACKUP_DIR -name "tallow-*.tar.gz" -mtime +7 -delete

echo "Backup completed: tallow-$DATE.tar.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/tallow-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/tallow-backup.sh
```

### Step 9: Security Hardening

```bash
# Install fail2ban (prevent brute force)
sudo apt install -y fail2ban

# Configure SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Estimated Self-Hosted Costs

| Provider | Instance Type | Monthly Cost |
|----------|---------------|--------------|
| **Hetzner Cloud** | CX21 (2 vCPU, 4GB) | **€5 (~$5)** |
| **Vultr** | Regular Performance | **$6** |
| **Linode** | Linode 2GB | **$12** |
| **OVH** | VPS Starter | **$7** |
| **Total** (+ domain) | | **$5-15/month** |

### Self-Hosted Pros & Cons

**Pros:**
- Lowest cost
- Full control
- No vendor lock-in
- Privacy
- Learning experience

**Cons:**
- Manual maintenance required
- You handle security
- No automatic scaling
- Single point of failure
- Requires technical knowledge

---

## 8. Synology NAS Deployment

**Best for:** Home labs, small teams, existing NAS infrastructure

### 🔐 Security Features Preserved

Your deployment maintains all security features:

| Feature | How It's Preserved |
|---------|-------------------|
| **Post-Quantum Cryptography** | Runs client-side, no server changes needed |
| **SAS Verification (MITM protection)** | Works via WebSocket signaling server |
| **Traffic Obfuscation** | Client-side padding/decoys unaffected |
| **P2P Direct Transfers** | WebRTC with STUN/TURN, files never hit your server |
| **E2E Encryption** | AES-256-GCM client-side, server only sees ciphertext signals |

---

### Prerequisites

- [ ] Synology NAS running DSM 7.x with Container Manager installed
- [ ] SSH access enabled on Synology
- [ ] Cloudflare account managing your domain
- [ ] Router access for port forwarding
- [ ] Your public IP address

#---

## Monitoring & Maintenance

Regardless of deployment platform, implement monitoring for reliability.

### Application Health Monitoring

#### 1. Uptime Monitoring

**Free Services:**
- [UptimeRobot](https://uptimerobot.com) - 50 monitors free
- [Freshping](https://www.freshworks.com/website-monitoring/) - 50 checks free
- [StatusCake](https://www.statuscake.com) - Unlimited tests free

**Setup Example (UptimeRobot):**
1. Create monitor for main app: `https://tallow.yourdomain.com`
2. Create monitor for signaling health: `https://tallow.yourdomain.com/signaling/health`
3. Set check interval: 5 minutes
4. Add alert contacts (email, SMS, Slack)

#### 2. Error Tracking with Sentry

```bash
# Install Sentry SDK
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

Configure in `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_APP_VERSION=1.0.0
```

Create `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
});
```

#### 3. Performance Monitoring

**Next.js Built-in Analytics:**
- Vercel: Automatic if deployed on Vercel
- Self-hosted: Use [OpenTelemetry](https://opentelemetry.io/)

**Google Analytics / Plausible:**
```bash
npm install @next/third-parties
```

Add to `app/layout.tsx`:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  )
}
```

#### 4. Log Aggregation

**Platform-specific:**
- **AWS:** CloudWatch Logs
- **GCP:** Cloud Logging
- **Azure:** Application Insights
- **Self-hosted:** ELK Stack or Grafana Loki

**Self-Hosted Loki Setup:**
```bash
# Install Loki
wget https://github.com/grafana/loki/releases/download/v2.9.0/loki-linux-amd64.zip
unzip loki-linux-amd64.zip
sudo mv loki-linux-amd64 /usr/local/bin/loki

# Install Promtail (log shipper)
wget https://github.com/grafana/loki/releases/download/v2.9.0/promtail-linux-amd64.zip
unzip promtail-linux-amd64.zip
sudo mv promtail-linux-amd64 /usr/local/bin/promtail

# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana
sudo systemctl start grafana-server
```

### Security Monitoring

#### 1. SSL Certificate Monitoring

```bash
# Check SSL expiry
echo | openssl s_client -servername tallow.yourdomain.com \
  -connect tallow.yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

**Automated Monitoring:**
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Manual testing
- [SSL Monitor](https://github.com/mtdowling/sslmon) - Automated checks

#### 2. Security Headers Check

```bash
curl -I https://tallow.yourdomain.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"
```

**Online Tools:**
- [SecurityHeaders.com](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)

#### 3. Rate Limiting Monitoring

Monitor `/var/log/nginx/error.log` for rate limit hits:

```bash
sudo tail -f /var/log/nginx/error.log | grep "limiting requests"
```

### Performance Optimization

#### 1. Enable Gzip/Brotli Compression

**Nginx:**
```nginx
# Already included in AWS Nginx config
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

**Cloudflare:** Automatic

#### 2. CDN Configuration

**CloudFront (AWS):**
```bash
aws cloudfront create-distribution \
  --origin-domain-name tallow.yourdomain.com \
  --default-root-object index.html
```

**Cloudflare:** Automatic when proxied

#### 3. Image Optimization

Next.js automatic image optimization is enabled by default. Configure in `next.config.ts`:

```typescript
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### Database Backups

**Even though Tallow doesn't use a database, backup configuration and environment:**

```bash
#!/bin/bash
# backup-config.sh
tar -czf tallow-config-$(date +%Y%m%d).tar.gz \
  .env.local \
  docker-compose.yml \
  nginx-config
```

### Scaling Strategies

#### Horizontal Scaling

**Load Balancer + Multiple Instances:**

1. **AWS:** Auto Scaling Group
2. **GCP:** Managed Instance Group
3. **Self-Hosted:** Nginx load balancer

**Nginx Load Balancer Config:**
```nginx
upstream tallow_backend {
    least_conn;
    server app1.internal:3000 max_fails=3 fail_timeout=30s;
    server app2.internal:3000 max_fails=3 fail_timeout=30s;
    server app3.internal:3000 max_fails=3 fail_timeout=30s;
}

server {
    location / {
        proxy_pass http://tallow_backend;
    }
}
```

#### Vertical Scaling

**When to scale up:**
- CPU consistently > 70%
- Memory usage > 80%
- Response time degradation

**Platform-specific:**
- **Vercel:** Automatic
- **AWS EC2:** Change instance type
- **GCP Cloud Run:** Increase memory/CPU limits
- **Docker:** Update resource limits

#### Caching Strategy

**Redis for Session/Rate Limiting (optional):**
```bash
# Install Redis
sudo apt install redis-server

# Configure persistence
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
```

---

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed

**Symptoms:**
- "WebSocket connection failed" in browser console
- P2P connections not establishing
- Signaling errors

**Diagnosis:**
```bash
# Test WebSocket connection
npm install -g wscat
wscat -c wss://tallow.yourdomain.com/signaling

# Should see connection established
```

**Solutions:**

**A. Nginx WebSocket Headers Missing:**
```nginx
# Add to signaling location block
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**B. Cloudflare WebSocket Disabled:**
1. Go to Cloudflare Dashboard → Network
2. Ensure WebSockets is ON

**C. Timeout Too Short:**
```nginx
# Increase timeouts in Nginx
proxy_read_timeout 7d;
proxy_send_timeout 7d;
```

#### 2. 502 Bad Gateway

**Diagnosis:**
```bash
# Check if app is running
sudo systemctl status tallow-app
# or
pm2 status

# Check app logs
sudo journalctl -u tallow-app -n 50
# or
pm2 logs tallow-app --lines 50

# Check if port is listening
sudo netstat -tlnp | grep 3000
```

**Solutions:**
- Restart app: `pm2 restart tallow-app`
- Check environment variables: `pm2 env 0`
- Rebuild if needed: `npm run build`

#### 3. SSL Certificate Errors

**Diagnosis:**
```bash
# Check certificate validity
sudo certbot certificates

# Test SSL configuration
sudo nginx -t
```

**Solutions:**
```bash
# Renew certificate
sudo certbot renew --force-renewal

# If using Cloudflare, ensure SSL mode is "Full (strict)"
```

#### 4. High Memory Usage

**Diagnosis:**
```bash
# Check memory usage
free -h
pm2 monit

# Check Node.js heap
node --max-old-space-size=512 server.js  # Limit to 512MB
```

**Solutions:**
- Increase server memory
- Enable swap:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```
- Optimize Next.js build:
  ```bash
  # In next.config.ts
  export default {
    swcMinify: true,  // Use faster SWC minifier
    compress: true,   # Enable compression
  }
  ```

#### 5. Build Failures

**Common Errors:**

**A. Out of Memory:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**B. TypeScript Errors:**
```bash
# Skip type checking during build (not recommended for production)
npm run build -- --no-type-check
```

**C. Dependency Conflicts:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 6. TURN Server Not Working

**Diagnosis:**
```javascript
// Test TURN server in browser console
const pc = new RTCPeerConnection({
  iceServers: [{
    urls: 'turns:relay.metered.ca:443?transport=tcp',
    username: 'your-username',
    credential: 'your-credential'
  }]
});

pc.onicecandidate = (e) => {
  if (e.candidate) {
    console.log('ICE Candidate:', e.candidate.candidate);
  }
};

pc.createDataChannel('test');
pc.createOffer().then(o => pc.setLocalDescription(o));
```

**Solutions:**
- Verify credentials are correct
- Check TURN server status
- Try alternative TURN provider
- Test with Trickle ICE: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

#### 7. Rate Limiting Issues

**Symptoms:**
- Users getting blocked
- "Too many requests" errors

**Solutions:**
```bash
# Adjust Nginx rate limits
# In /etc/nginx/sites-available/tallow
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;  # Increase from 10r/s

# Or whitelist specific IPs
geo $limit {
    default 1;
    10.0.0.0/8 0;     # Internal network
    192.168.0.0/16 0;  # Private network
}

map $limit $limit_key {
    0 "";
    1 $binary_remote_addr;
}

limit_req_zone $limit_key zone=api_limit:10m rate=10r/s;
```

### Debugging Tools

#### Browser DevTools

1. **Network Tab:**
   - Check WebSocket status
   - Verify API responses
   - Monitor timing

2. **Console:**
   - Look for JavaScript errors
   - Check WebRTC connection logs

3. **Application Tab:**
   - Verify localStorage/sessionStorage
   - Check service worker status

#### Server-Side Debugging

```bash
# Real-time log monitoring
tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# PM2 logs
pm2 logs --lines 100

# System resource usage
htop

# Network connections
sudo netstat -tlnp

# Docker logs
sudo docker logs tallow --tail 100 -f
```

### Performance Testing

#### Load Testing with Artillery

```bash
# Install
npm install -g artillery

# Create test
cat > artillery-test.yml << 'EOF'
config:
  target: 'https://tallow.yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
scenarios:
  - name: "Homepage"
    flow:
      - get:
          url: "/"
EOF

# Run test
artillery run artillery-test.yml
```

#### WebSocket Load Test

```bash
npm install -g wscat

# Concurrent connections test
for i in {1..100}; do
  wscat -c wss://tallow.yourdomain.com/signaling &
done
```

### Emergency Recovery

#### 1. Service Down - Quick Restore

```bash
# Stop all
pm2 stop all
sudo systemctl stop nginx

# Restore from backup
cd /var/www
sudo tar -xzf /var/backups/tallow/tallow-YYYYMMDD.tar.gz

# Restart
cd /var/www/tallow
npm install
npm run build
pm2 start all
sudo systemctl start nginx
```

#### 2. Database/Config Corruption

```bash
# Restore .env
sudo cp /var/backups/tallow/.env.local.backup /var/www/tallow/.env.local

# Rebuild
cd /var/www/tallow
npm run build
pm2 restart all
```

#### 3. DDoS Attack Mitigation

**Cloudflare:**
1. Go to Security → Settings
2. Set Security Level to "I'm Under Attack"
3. Enable Bot Fight Mode

**Self-Hosted:**
```bash
# Install fail2ban
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 60
bantime = 3600
```

### Getting Help

**Community Resources:**
- Next.js Discord: https://nextjs.org/discord
- WebRTC Discord: https://discord.gg/webrtc
- Stack Overflow: Tag `next.js`, `webrtc`

**Professional Support:**
- Vercel Support (paid plans)
- AWS Support (paid tiers)
- Cloudflare Support

**Create Detailed Bug Reports:**
```bash
# Collect diagnostic info
echo "=== System Info ===" > debug-info.txt
uname -a >> debug-info.txt
node --version >> debug-info.txt
npm --version >> debug-info.txt

echo -e "\n=== PM2 Status ===" >> debug-info.txt
pm2 status >> debug-info.txt

echo -e "\n=== Recent Logs ===" >> debug-info.txt
pm2 logs --lines 50 >> debug-info.txt

echo -e "\n=== Nginx Config Test ===" >> debug-info.txt
sudo nginx -t >> debug-info.txt 2>&1
```

---

## 📁 Step 1: Prepare Docker Configuration

### 1.1 Update docker-compose.yml for Production

Edit `docker-compose.yml` and replace the placeholder domains:

```yaml
services:
  # Tallow Web App
  tallow:
    build: .
    container_name: tallow
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - SIGNALING_SERVER_URL=wss://tallow.manisahome.com/signaling
    depends_on:
      - signaling
    healthcheck:
      test: [ "CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000" ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Signaling Server for P2P WebRTC connections
  signaling:
    build:
      context: .
      dockerfile: Dockerfile.signaling
    container_name: tallow-signaling
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - SIGNALING_PORT=3001
      - ALLOWED_ORIGINS=https://tallow.manisahome.com
    healthcheck:
      test: [ "CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health" ]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 📤 Step 2: Sync Files to Synology NAS

### Option A: Use the Sync Script (Recommended)

```powershell
# From your local machine
cd c:\Users\aamir\Documents\Apps\File_Sharing\Tallow
.\sync-to-nas.ps1
```

### Option B: Copy to Docker Directory

After syncing, SSH into NAS and copy to Docker location:

```bash
ssh manisaadmin@192.168.4.3

# Create Docker directory
sudo mkdir -p /volume1/docker/tallow

# Copy from sync location to Docker location
# The Windows path \\192.168.4.3\home\... maps to /volume1/home/...
sudo cp -r "/volume1/home/02_Business/02 - 09 - Tallow/Tallow/"* /volume1/docker/tallow/

# Set permissions
sudo chown -R root:root /volume1/docker/tallow
```

---

## 🐳 Step 3: Build & Run Docker Containers

### 3.1 SSH into Synology

```bash
ssh admin@192.168.4.3
```

### 3.2 Navigate to Project

```bash
cd /volume1/docker/tallow
```

### 3.3 Build and Start

```bash
# Build and start containers in detached mode
sudo docker compose up -d --build
```

This will:
- Build the Next.js Tallow app (port 3000)
- Build the WebSocket signaling server (port 3001)
- Start both with automatic restart policies

### 3.4 Verify Containers Running

```bash
sudo docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                  STATUS         PORTS
xxxx           tallow                 Up 2 min       0.0.0.0:3000->3000/tcp
xxxx           tallow-signaling       Up 2 min       0.0.0.0:3001->3001/tcp
```

### 3.5 Check Logs (if issues)

```bash
# Main app logs
sudo docker logs tallow -f

# Signaling server logs
sudo docker logs tallow-signaling -f
```

---

## 🌐 Step 4: Configure Synology Reverse Proxy

This routes HTTPS traffic to your Docker containers.

### 4.1 Access Synology DSM

1. Open `http://192.168.4.3:5000` in browser
2. Login with admin credentials

### 4.2 Create Reverse Proxy Rules

1. Go to **Control Panel** → **Login Portal** → **Advanced** tab → **Reverse Proxy**
2. Click **Create** for each rule below:

#### Rule 1: Main Tallow App

| Setting | Value |
|---------|-------|
| Description | `Tallow App` |
| **Source** | |
| Protocol | `HTTPS` |
| Hostname | `tallow.manisahome.com` |
| Port | `443` |
| **Destination** | |
| Protocol | `HTTP` |
| Hostname | `localhost` |
| Port | `3000` |

#### Rule 2: Signaling Server (WebSocket)

| Setting | Value |
|---------|-------|
| Description | `Tallow Signaling` |
| **Source** | |
| Protocol | `HTTPS` |
| Hostname | `tallow.manisahome.com` |
| Port | `443` |
| Path | `/signaling*` |
| **Destination** | |
| Protocol | `HTTP` |
| Hostname | `localhost` |
| Port | `3001` |

### 4.3 Enable WebSocket for Signaling

**CRITICAL for P2P connections!**

1. Click on the **Tallow Signaling** rule you just created
2. Click **Edit**
3. Go to **Custom Header** tab
4. Click **Create** → **WebSocket**
5. This auto-adds required headers:
   - `Upgrade: $http_upgrade`
   - `Connection: $connection_upgrade`
6. Click **Save**

---

## 🔒 Step 5: Configure SSL Certificate

### Option A: Let's Encrypt (Recommended)

1. Go to **Control Panel** → **Security** → **Certificate**
2. Click **Add** → **Add a new certificate**
3. Select **Get a certificate from Let's Encrypt**
4. Enter:
   - **Domain name:** `tallow.manisahome.com`
   - **Email:** your email
5. Click **Done**

### Assign to Reverse Proxy:

1. In Certificate panel, click **Settings**
2. Find your reverse proxy service
3. Select the Let's Encrypt certificate
4. Click **OK**

### Option B: Use Cloudflare Origin Certificate

1. In Cloudflare Dashboard → **SSL/TLS** → **Origin Server**
2. Click **Create Certificate**
3. Save `origin.pem` (certificate) and `origin.key` (private key)
4. In Synology → **Control Panel** → **Security** → **Certificate**
5. Click **Add** → **Import certificate**
6. Upload both files

---

## 🛡️ Step 6: Configure Router Port Forwarding

Access your router admin panel (usually `192.168.4.1`).

### Required Port Forwards

| External Port | Internal IP | Internal Port | Protocol | Purpose |
|--------------|-------------|---------------|----------|---------|
| 443 | 192.168.4.3 | 443 | TCP | HTTPS (Cloudflare → Synology) |
| 80 | 192.168.4.3 | 80 | TCP | HTTP redirect (optional) |

> **Note:** You do NOT need to forward 3000 or 3001 externally - the reverse proxy handles routing internally.

---

## ☁️ Step 7: Configure Cloudflare

### 7.1 Get Your Public IP

```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

### 7.2 Add DNS Record

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **manisahome.com**
3. Click **DNS** → **Records** → **Add record**

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| A | `tallow` | `YOUR_PUBLIC_IP` | ☁️ Proxied | Auto |

### 7.3 Configure SSL/TLS

1. Go to **SSL/TLS** → **Overview**
2. Select **Full** (or **Full (strict)** if using valid SSL on Synology)

### 7.4 Enable WebSockets

1. Go to **Network**
2. Ensure **WebSockets** is **ON** (usually on by default for proxied records)

### 7.5 Recommended Security Settings

1. **SSL/TLS** → **Edge Certificates**:
   - ✅ Always Use HTTPS: **ON**
   - ✅ Automatic HTTPS Rewrites: **ON**
   - ✅ TLS 1.3: **ON**

2. **Security** → **Settings**:
   - Security Level: **Medium** or **High**
   - Challenge Passage: **30 minutes**

---

## ✅ Step 8: Test Your Deployment

### 8.1 Wait for DNS (2-5 minutes)

### 8.2 Test Main App

```
https://tallow.manisahome.com
```

You should see the Tallow homepage.

### 8.3 Test WebSocket Connection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Navigate to the app's connect feature
5. You should see a WebSocket connection to `/signaling`

### 8.4 Test P2P Connection

1. Open Tallow on two devices
2. Generate a connection code on one
3. Enter code on the other
4. Verify SAS codes match (your MITM protection!)
5. Transfer a small test file

---

## 🔧 Troubleshooting

### Issue: 502 Bad Gateway

```bash
# Check if containers are running
sudo docker ps

# Check container logs
sudo docker logs tallow
sudo docker logs tallow-signaling

# Restart containers
sudo docker compose restart
```

### Issue: WebSocket Connection Failed

1. Verify WebSocket headers in reverse proxy
2. Check Cloudflare WebSockets is enabled
3. Check browser console for errors

### Issue: SSL Certificate Error

1. Verify Cloudflare SSL mode matches your setup
2. Check certificate assignment in Synology

### Issue: Can't Access Site

1. Check port forwarding on router
2. Verify Cloudflare DNS is proxied (orange cloud)
3. Test locally: `http://192.168.4.3:3000`

---

## 🔄 Updating Your Deployment

When you make changes to the app:

```powershell
# 1. Sync from Windows
cd c:\Users\aamir\Documents\Apps\File_Sharing\Tallow
.\sync-to-nas.ps1
```

```bash
# 2. SSH and rebuild (on Synology)
ssh admin@192.168.4.3
cd /volume1/docker/tallow
sudo docker compose down
sudo docker compose up -d --build
```

---

## 📊 Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE (CDN + WAF)                              │
│  • DDoS Protection          • SSL Termination                               │
│  • WebSocket Forwarding     • Security Rules                                │
│  DNS: tallow.manisahome.com → Your Public IP                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Port 443
┌─────────────────────────────────────────────────────────────────────────────┐
│                            YOUR ROUTER                                       │
│  Port Forward: 443 → 192.168.4.3:443                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYNOLOGY NAS (192.168.4.3)                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    REVERSE PROXY (Port 443)                          │   │
│  │                                                                      │   │
│  │   /   →  localhost:3000 (Tallow App)                                │   │
│  │   /signaling* →  localhost:3001 (WebSocket Signaling)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                    │                             │
│                          ▼                    ▼                             │
│  ┌───────────────────────────┐    ┌────────────────────────────────────┐   │
│  │    TALLOW CONTAINER       │    │     SIGNALING CONTAINER            │   │
│  │    (Next.js App)          │    │     (Socket.IO Server)             │   │
│  │    Port 3000              │◄──►│     Port 3001                      │   │
│  │                           │    │                                    │   │
│  │  • Static Assets          │    │  • WebRTC Signaling Only          │   │
│  │  • API Routes             │    │  • NO file data passes through    │   │
│  │  • SSR Pages              │    │  • Handles: offer/answer/ICE      │   │
│  └───────────────────────────┘    └────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         P2P FILE TRANSFER                                    │
│                                                                              │
│   User A (Browser)  ◄──────── WebRTC Direct ────────►  User B (Browser)    │
│                                                                              │
│   • Files encrypted with PQC (Kyber + X25519)                               │
│   • AES-256-GCM symmetric encryption                                        │
│   • Optional traffic obfuscation (padding/decoys)                           │
│   • SAS verification for MITM protection                                    │
│                                                                              │
│   🔐 YOUR SERVER NEVER SEES THE FILES - ONLY SIGNALING METADATA 🔐          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎉 Success!

Once complete, your Tallow instance will be live at:

**https://tallow.manisahome.com**

With full security:
- ✅ Post-quantum encryption (Kyber + X25519)
- ✅ AES-256-GCM file encryption
- ✅ SAS verification (MITM protection)
- ✅ Traffic obfuscation (anti-surveillance)
- ✅ Direct P2P transfers (server never sees files)
- ✅ Cloudflare DDoS/WAF protection
- ✅ HTTPS/WSS everywhere
