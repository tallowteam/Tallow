#!/bin/bash
# Tallow Deployment Setup Script
# Interactive wizard to help configure deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ████████╗ █████╗ ██╗     ██╗      ██████╗ ██╗    ██╗       ║
║   ╚══██╔══╝██╔══██╗██║     ██║     ██╔═══██╗██║    ██║       ║
║      ██║   ███████║██║     ██║     ██║   ██║██║ █╗ ██║       ║
║      ██║   ██╔══██║██║     ██║     ██║   ██║██║███╗██║       ║
║      ██║   ██║  ██║███████╗███████╗╚██████╔╝╚███╔███╔╝       ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝        ║
║                                                                ║
║            Deployment Setup Wizard                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}This wizard will help you set up Tallow for deployment.${NC}"
echo ""

# Function to generate random secret
generate_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64
    fi
}

# Function to validate URL
validate_url() {
    if [[ $1 =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Keeping existing .env.local${NC}"
        exit 0
    fi
    mv .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo -e "${GREEN}✓ Backed up existing .env.local${NC}"
fi

# Start configuration
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: Choose Deployment Platform${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Select your deployment platform:"
echo "  1) Vercel (Recommended for quick start)"
echo "  2) AWS (EC2, ECS, or Elastic Beanstalk)"
echo "  3) Google Cloud Platform"
echo "  4) Microsoft Azure"
echo "  5) DigitalOcean"
echo "  6) Cloudflare Pages"
echo "  7) Self-hosted (VPS/Dedicated)"
echo "  8) Synology NAS"
echo ""
read -p "Enter choice [1-8]: " platform_choice

case $platform_choice in
    1) PLATFORM="vercel" ;;
    2) PLATFORM="aws" ;;
    3) PLATFORM="gcp" ;;
    4) PLATFORM="azure" ;;
    5) PLATFORM="digitalocean" ;;
    6) PLATFORM="cloudflare" ;;
    7) PLATFORM="self-hosted" ;;
    8) PLATFORM="synology" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac

echo -e "${GREEN}✓ Platform: $PLATFORM${NC}"

# API Secret Key
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: API Security${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Generate API secret key for endpoint protection?"
read -p "Auto-generate? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    read -p "Enter API_SECRET_KEY: " API_SECRET_KEY
else
    API_SECRET_KEY=$(generate_secret)
    echo -e "${GREEN}✓ Generated API_SECRET_KEY${NC}"
fi

# TURN Server Configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 3: TURN Server (WebRTC NAT Traversal)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "TURN servers allow P2P connections behind NATs."
echo ""
echo "Free TURN providers:"
echo "  - Metered: https://www.metered.ca/stun-turn (50GB free)"
echo "  - Xirsys: https://xirsys.com/"
echo ""
read -p "Do you have TURN server credentials? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "TURN Server URL (e.g., turns:relay.metered.ca:443?transport=tcp): " TURN_SERVER
    read -p "TURN Username: " TURN_USERNAME
    read -p "TURN Credential: " TURN_CREDENTIAL

    echo ""
    echo "Privacy settings:"
    echo "  - Force relay: Always use TURN (hides IP addresses)"
    echo "  - Allow direct: Fall back to direct P2P if TURN fails"
    echo ""
    read -p "Force all connections through TURN relay? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        FORCE_RELAY="false"
        ALLOW_DIRECT="true"
    else
        FORCE_RELAY="true"
        ALLOW_DIRECT="false"
    fi
else
    echo -e "${YELLOW}⚠ No TURN server configured. P2P may not work behind strict NATs.${NC}"
    TURN_SERVER=""
    TURN_USERNAME=""
    TURN_CREDENTIAL=""
    FORCE_RELAY="false"
    ALLOW_DIRECT="true"
fi

# Email Service (Optional)
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 4: Email Service (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Configure email service for welcome emails?"
echo "  Get API key from: https://resend.com/"
echo ""
read -p "Configure email? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Resend API Key: " RESEND_API_KEY
else
    RESEND_API_KEY=""
fi

# Sentry (Optional)
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 5: Error Tracking (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Configure Sentry for error tracking?"
echo "  Sign up at: https://sentry.io/"
echo ""
read -p "Configure Sentry? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Sentry DSN: " SENTRY_DSN
    read -p "App Version (default: 1.0.0): " APP_VERSION
    APP_VERSION=${APP_VERSION:-1.0.0}
else
    SENTRY_DSN=""
    APP_VERSION="1.0.0"
fi

# Stripe (Optional)
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 6: Stripe Donations (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Configure Stripe for accepting donations?"
echo ""
read -p "Configure Stripe? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Stripe Publishable Key: " STRIPE_PUBLISHABLE_KEY
    read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
    read -p "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
else
    STRIPE_PUBLISHABLE_KEY=""
    STRIPE_SECRET_KEY=""
    STRIPE_WEBHOOK_SECRET=""
fi

# Write .env.local file
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Generating Configuration Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat > .env.local << EOF
# Tallow Environment Configuration
# Generated by setup-deployment.sh on $(date)
# Platform: $PLATFORM

# =============================================================================
# Node Environment
# =============================================================================
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# =============================================================================
# API Security
# =============================================================================
API_SECRET_KEY=$API_SECRET_KEY

# =============================================================================
# TURN Server Configuration
# =============================================================================
EOF

if [ -n "$TURN_SERVER" ]; then
cat >> .env.local << EOF
NEXT_PUBLIC_TURN_SERVER=$TURN_SERVER
NEXT_PUBLIC_TURN_USERNAME=$TURN_USERNAME
NEXT_PUBLIC_TURN_CREDENTIAL=$TURN_CREDENTIAL
NEXT_PUBLIC_FORCE_RELAY=$FORCE_RELAY
NEXT_PUBLIC_ALLOW_DIRECT=$ALLOW_DIRECT
EOF
else
cat >> .env.local << EOF
# NEXT_PUBLIC_TURN_SERVER=turns:relay.metered.ca:443?transport=tcp
# NEXT_PUBLIC_TURN_USERNAME=your-username
# NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
# NEXT_PUBLIC_FORCE_RELAY=true
# NEXT_PUBLIC_ALLOW_DIRECT=false
EOF
fi

cat >> .env.local << EOF

# =============================================================================
# Email Service (Optional)
# =============================================================================
EOF

if [ -n "$RESEND_API_KEY" ]; then
    echo "RESEND_API_KEY=$RESEND_API_KEY" >> .env.local
else
    echo "# RESEND_API_KEY=re_xxxxxxxxxxxx" >> .env.local
fi

cat >> .env.local << EOF

# =============================================================================
# Error Tracking (Optional)
# =============================================================================
EOF

if [ -n "$SENTRY_DSN" ]; then
cat >> .env.local << EOF
NEXT_PUBLIC_SENTRY_DSN=$SENTRY_DSN
NEXT_PUBLIC_APP_VERSION=$APP_VERSION
EOF
else
cat >> .env.local << EOF
# NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
# NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
fi

cat >> .env.local << EOF

# =============================================================================
# Stripe Donations (Optional)
# =============================================================================
EOF

if [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then
cat >> .env.local << EOF
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
EOF
else
cat >> .env.local << EOF
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
# STRIPE_SECRET_KEY=sk_live_xxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
EOF
fi

echo -e "${GREEN}✓ Created .env.local${NC}"

# Platform-specific next steps
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Setup Complete!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration saved to: .env.local${NC}"
echo ""
echo -e "${PURPLE}Next Steps for $PLATFORM:${NC}"
echo ""

case $PLATFORM in
    vercel)
        cat << EOF
1. Install Vercel CLI:
   ${GREEN}npm install -g vercel${NC}

2. Deploy:
   ${GREEN}./deploy-vercel.sh production${NC}

3. Or use Vercel dashboard:
   - Go to https://vercel.com
   - Import your Git repository
   - Add environment variables from .env.local

4. Deploy signaling server separately (Railway, Render, etc.)

📖 See: DEPLOYMENT-GUIDE.md → Vercel Deployment
EOF
        ;;
    aws)
        cat << EOF
1. Choose deployment method:
   - EC2: ${GREEN}./deploy-aws-ec2.sh user@your-ec2-ip${NC}
   - ECS: Use configs/aws/task-definition.json
   - Elastic Beanstalk: ${GREEN}eb init && eb create${NC}

2. Configure security groups (ports 80, 443, 3001)

3. Setup load balancer and auto-scaling

📖 See: DEPLOYMENT-GUIDE.md → AWS Deployment
EOF
        ;;
    digitalocean)
        cat << EOF
1. Install doctl CLI:
   ${GREEN}brew install doctl${NC} (macOS)

2. Deploy using App Platform:
   ${GREEN}doctl apps create --spec configs/digitalocean/app.yaml${NC}

3. Or use Docker on Droplet:
   ${GREEN}./deploy-docker.sh remote user@your-droplet-ip${NC}

📖 See: DEPLOYMENT-GUIDE.md → DigitalOcean Deployment
EOF
        ;;
    self-hosted|synology)
        cat << EOF
1. Deploy with Docker:
   ${GREEN}./deploy-docker.sh${NC} (local)
   ${GREEN}./deploy-docker.sh remote user@your-server${NC} (remote)

2. Configure Nginx reverse proxy:
   ${GREEN}sudo cp configs/nginx/tallow.conf /etc/nginx/sites-available/${NC}
   ${GREEN}sudo ln -s /etc/nginx/sites-available/tallow /etc/nginx/sites-enabled/${NC}

3. Setup SSL with Let's Encrypt:
   ${GREEN}sudo certbot --nginx -d your-domain.com${NC}

📖 See: DEPLOYMENT-GUIDE.md → Self-Hosted Deployment
EOF
        ;;
    *)
        cat << EOF
1. Review .env.local configuration
2. Test build: ${GREEN}npm run build${NC}
3. Follow platform-specific guide in DEPLOYMENT-GUIDE.md
EOF
        ;;
esac

echo ""
echo -e "${CYAN}📚 Full deployment guide: ${GREEN}DEPLOYMENT-GUIDE.md${NC}"
echo -e "${CYAN}🔧 Configuration files: ${GREEN}configs/${NC}"
echo -e "${CYAN}📜 Deployment scripts: ${GREEN}deploy-*.sh${NC}"
echo ""
echo -e "${YELLOW}⚠ Keep .env.local secure! Do not commit to version control.${NC}"
echo ""
