#!/bin/bash
# Docker Deployment Script for Tallow
# Works with: Docker Compose, DigitalOcean, self-hosted, Synology
# Usage: ./deploy-docker.sh [local|remote <host>]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Tallow Docker Deployment Script              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
DEPLOY_TYPE=${1:-local}
REMOTE_HOST=$2

if [ "$DEPLOY_TYPE" = "remote" ] && [ -z "$REMOTE_HOST" ]; then
    echo -e "${RED}✗ Remote host required for remote deployment${NC}"
    echo -e "Usage: $0 remote <user@host>"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo -e "${YELLOW}Install Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    echo -e "${YELLOW}Install Docker Compose: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓ Docker found${NC}"
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Check required files
REQUIRED_FILES=("Dockerfile" "Dockerfile.signaling" "docker-compose.yml")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Required file not found: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All required files present${NC}"

# Check for .env file
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ No .env file found${NC}"
    read -p "Create .env file now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env.local
        echo -e "${YELLOW}Created .env.local from .env.example${NC}"
        echo -e "${YELLOW}Please edit .env.local with your configuration before deploying${NC}"
        exit 0
    fi
fi

# Local deployment
if [ "$DEPLOY_TYPE" = "local" ]; then
    echo ""
    echo -e "${YELLOW}Building and starting containers locally...${NC}"

    # Stop existing containers
    $DOCKER_COMPOSE down

    # Build images
    echo -e "${BLUE}Building images...${NC}"
    $DOCKER_COMPOSE build --no-cache

    # Start containers
    echo -e "${BLUE}Starting containers...${NC}"
    $DOCKER_COMPOSE up -d

    # Wait for health checks
    echo -e "${BLUE}Waiting for containers to be healthy...${NC}"
    sleep 5

    # Check container status
    $DOCKER_COMPOSE ps

    # Show logs
    echo ""
    echo -e "${YELLOW}Recent logs:${NC}"
    $DOCKER_COMPOSE logs --tail=20

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Deployment Successful!                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Application running at: http://localhost:3000${NC}"
    echo -e "${GREEN}Signaling server at: http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  View logs: ${GREEN}$DOCKER_COMPOSE logs -f${NC}"
    echo -e "  Stop: ${GREEN}$DOCKER_COMPOSE down${NC}"
    echo -e "  Restart: ${GREEN}$DOCKER_COMPOSE restart${NC}"
    echo -e "  Rebuild: ${GREEN}$DOCKER_COMPOSE up -d --build${NC}"

# Remote deployment
else
    echo ""
    echo -e "${YELLOW}Deploying to remote host: $REMOTE_HOST${NC}"

    # Test SSH connection
    echo -e "${BLUE}Testing SSH connection...${NC}"
    if ! ssh -o ConnectTimeout=10 "$REMOTE_HOST" exit 2>/dev/null; then
        echo -e "${RED}✗ Cannot connect to remote host${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ SSH connection successful${NC}"

    # Create remote directory
    REMOTE_DIR="/opt/tallow"
    echo -e "${BLUE}Creating remote directory: $REMOTE_DIR${NC}"
    ssh "$REMOTE_HOST" "sudo mkdir -p $REMOTE_DIR && sudo chown \$USER:\$USER $REMOTE_DIR"

    # Sync files
    echo -e "${BLUE}Syncing files to remote host...${NC}"
    rsync -avz --progress \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.next' \
        --exclude='test-results' \
        --exclude='playwright-report' \
        ./ "$REMOTE_HOST:$REMOTE_DIR/"

    # Build and start on remote
    echo -e "${BLUE}Building and starting containers on remote host...${NC}"
    ssh "$REMOTE_HOST" bash << EOF
        cd $REMOTE_DIR

        # Stop existing containers
        $DOCKER_COMPOSE down

        # Build images
        $DOCKER_COMPOSE build --no-cache

        # Start containers
        $DOCKER_COMPOSE up -d

        # Show status
        echo ""
        echo "Container status:"
        $DOCKER_COMPOSE ps

        echo ""
        echo "Recent logs:"
        $DOCKER_COMPOSE logs --tail=20
EOF

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║           Remote Deployment Successful!                ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo -e "1. Check logs: ${GREEN}ssh $REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE logs -f'${NC}"
        echo -e "2. Configure reverse proxy (Nginx, Caddy, etc.)"
        echo -e "3. Setup SSL certificate"
        echo -e "4. Configure firewall rules"
    else
        echo -e "${RED}✗ Remote deployment failed${NC}"
        exit 1
    fi
fi
