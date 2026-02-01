#!/bin/bash
# AWS EC2 Deployment Script for Tallow
# Usage: ./deploy-aws-ec2.sh <ec2-host>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Tallow AWS EC2 Deployment Script             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}✗ Missing EC2 host argument${NC}"
    echo -e "Usage: $0 <ec2-host>"
    echo -e "Example: $0 ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com"
    exit 1
fi

EC2_HOST=$1
APP_DIR="/var/www/tallow"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}✗ SSH key not found: $SSH_KEY${NC}"
    echo -e "${YELLOW}Set SSH_KEY environment variable or place key at ~/.ssh/id_rsa${NC}"
    exit 1
fi

echo -e "${GREEN}✓ EC2 Host: $EC2_HOST${NC}"
echo -e "${GREEN}✓ App Directory: $APP_DIR${NC}"
echo -e "${GREEN}✓ SSH Key: $SSH_KEY${NC}"

# Test SSH connection
echo ""
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_HOST" exit 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to EC2 instance${NC}"
    echo -e "${YELLOW}Check your SSH key and host address${NC}"
    exit 1
fi

# Build locally
echo ""
echo -e "${YELLOW}Building application locally...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Create deployment archive
echo ""
echo -e "${YELLOW}Creating deployment archive...${NC}"
ARCHIVE_NAME="tallow-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next/cache' \
    --exclude='test-results' \
    --exclude='playwright-report' \
    -czf "$ARCHIVE_NAME" \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.ts \
    signaling-server.js

echo -e "${GREEN}✓ Archive created: $ARCHIVE_NAME${NC}"

# Upload to EC2
echo ""
echo -e "${YELLOW}Uploading to EC2...${NC}"
scp -i "$SSH_KEY" "$ARCHIVE_NAME" "$EC2_HOST:/tmp/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Upload successful${NC}"
else
    echo -e "${RED}✗ Upload failed${NC}"
    rm "$ARCHIVE_NAME"
    exit 1
fi

# Deploy on EC2
echo ""
echo -e "${YELLOW}Deploying on EC2...${NC}"

ssh -i "$SSH_KEY" "$EC2_HOST" bash << EOF
    set -e

    # Create backup
    if [ -d "$APP_DIR" ]; then
        echo "Creating backup..."
        sudo tar -czf /var/backups/tallow-backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C $APP_DIR .

        # Keep only last 5 backups
        cd /var/backups
        ls -t tallow-backup-*.tar.gz | tail -n +6 | xargs -r sudo rm
    fi

    # Create app directory
    sudo mkdir -p $APP_DIR

    # Extract new version
    echo "Extracting new version..."
    sudo tar -xzf /tmp/$ARCHIVE_NAME -C $APP_DIR

    # Install dependencies
    echo "Installing dependencies..."
    cd $APP_DIR
    sudo npm ci --production

    # Restart services
    echo "Restarting services..."
    if command -v pm2 &> /dev/null; then
        sudo pm2 restart tallow-app || sudo pm2 start npm --name "tallow-app" -- start
        sudo pm2 restart tallow-signaling || sudo pm2 start signaling-server.js --name "tallow-signaling"
        sudo pm2 save
    elif systemctl list-units --type=service | grep -q "tallow-app"; then
        sudo systemctl restart tallow-app
        sudo systemctl restart tallow-signaling
    else
        echo "Warning: No process manager found. Please start the application manually."
    fi

    # Cleanup
    rm /tmp/$ARCHIVE_NAME

    echo "Deployment complete!"
EOF

# Cleanup local archive
rm "$ARCHIVE_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Deployment Successful!                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Check application status: ${GREEN}ssh -i $SSH_KEY $EC2_HOST 'pm2 status'${NC}"
    echo -e "2. View logs: ${GREEN}ssh -i $SSH_KEY $EC2_HOST 'pm2 logs'${NC}"
    echo -e "3. Test the application in your browser"
else
    echo ""
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
