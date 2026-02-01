#!/bin/bash
# Deployment script for Tallow Relay Server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/tallow-relay}"
SERVICE_NAME="tallow-relay"

# Docker settings
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
DOCKER_IMAGE="${DOCKER_IMAGE:-tallow-relay}"
DOCKER_TAG="${DOCKER_TAG:-latest}"

echo -e "${BLUE}=== Tallow Relay Deployment ===${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    if [ -z "$DEPLOY_HOST" ]; then
        echo -e "${RED}Error: DEPLOY_HOST is not set${NC}"
        echo "Usage: DEPLOY_HOST=your.server.com ./deploy.sh [method]"
        exit 1
    fi

    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=5 "$DEPLOY_USER@$DEPLOY_HOST" "echo 'SSH OK'" &>/dev/null; then
        echo -e "${RED}Error: Cannot connect to $DEPLOY_HOST via SSH${NC}"
        exit 1
    fi

    echo -e "${GREEN}  ✓ Prerequisites OK${NC}"
}

# Deploy using Docker
deploy_docker() {
    echo -e "${YELLOW}Deploying with Docker...${NC}"

    # Build image
    echo "Building Docker image..."
    docker build -t "$DOCKER_IMAGE:$DOCKER_TAG" .

    if [ -n "$DOCKER_REGISTRY" ]; then
        # Push to registry
        echo "Pushing to registry..."
        docker tag "$DOCKER_IMAGE:$DOCKER_TAG" "$DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"
        docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG"

        # Pull and run on remote
        ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
            docker pull $DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG
            docker stop $SERVICE_NAME 2>/dev/null || true
            docker rm $SERVICE_NAME 2>/dev/null || true
            docker run -d \
                --name $SERVICE_NAME \
                --restart unless-stopped \
                -p 8080:8080 \
                -p 9090:9090 \
                $DOCKER_REGISTRY/$DOCKER_IMAGE:$DOCKER_TAG
EOF
    else
        # Save and transfer image
        echo "Saving and transferring image..."
        docker save "$DOCKER_IMAGE:$DOCKER_TAG" | gzip > /tmp/tallow-relay.tar.gz
        scp /tmp/tallow-relay.tar.gz "$DEPLOY_USER@$DEPLOY_HOST:/tmp/"
        rm /tmp/tallow-relay.tar.gz

        # Load and run on remote
        ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
            gunzip -c /tmp/tallow-relay.tar.gz | docker load
            rm /tmp/tallow-relay.tar.gz
            docker stop $SERVICE_NAME 2>/dev/null || true
            docker rm $SERVICE_NAME 2>/dev/null || true
            docker run -d \
                --name $SERVICE_NAME \
                --restart unless-stopped \
                -p 8080:8080 \
                -p 9090:9090 \
                $DOCKER_IMAGE:$DOCKER_TAG
EOF
    fi

    echo -e "${GREEN}  ✓ Docker deployment complete${NC}"
}

# Deploy binary directly
deploy_binary() {
    echo -e "${YELLOW}Deploying binary...${NC}"

    # Build for Linux
    echo "Building binary..."
    GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/tallow-relay-linux-amd64 .

    # Create remote directory
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo mkdir -p $DEPLOY_PATH && sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH"

    # Copy binary and config
    echo "Copying files..."
    scp bin/tallow-relay-linux-amd64 "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/tallow-relay"
    scp configs/relay.production.yaml "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/relay.yaml"

    # Create systemd service
    echo "Creating systemd service..."
    ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << 'SYSTEMD'
[Unit]
Description=Tallow Relay Server
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$DEPLOY_PATH
ExecStart=$DEPLOY_PATH/tallow-relay -config $DEPLOY_PATH/relay.yaml
Restart=always
RestartSec=5
LimitNOFILE=65535

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SYSTEMD

        sudo systemctl daemon-reload
        sudo systemctl enable $SERVICE_NAME
        sudo systemctl restart $SERVICE_NAME
EOF

    # Check status
    sleep 2
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo systemctl status $SERVICE_NAME --no-pager"

    echo -e "${GREEN}  ✓ Binary deployment complete${NC}"
}

# Deploy using docker-compose
deploy_compose() {
    echo -e "${YELLOW}Deploying with docker-compose...${NC}"

    # Create remote directory
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $DEPLOY_PATH"

    # Copy compose files
    scp docker-compose.yml "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    scp Dockerfile "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    scp -r configs "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    scp -r internal "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    scp go.mod go.sum main.go "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

    # Deploy
    ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        cd $DEPLOY_PATH
        docker-compose pull 2>/dev/null || true
        docker-compose build
        docker-compose up -d
EOF

    echo -e "${GREEN}  ✓ Docker Compose deployment complete${NC}"
}

# Rollback
rollback() {
    echo -e "${YELLOW}Rolling back...${NC}"

    ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        if docker ps -a | grep -q "${SERVICE_NAME}_backup"; then
            docker stop $SERVICE_NAME 2>/dev/null || true
            docker rm $SERVICE_NAME 2>/dev/null || true
            docker rename ${SERVICE_NAME}_backup $SERVICE_NAME
            docker start $SERVICE_NAME
            echo "Rolled back to previous container"
        else
            echo "No backup container found"
            exit 1
        fi
EOF

    echo -e "${GREEN}  ✓ Rollback complete${NC}"
}

# Health check
health_check() {
    echo -e "${YELLOW}Running health check...${NC}"

    # Wait for server to start
    sleep 5

    # Check health endpoint
    if curl -sf "http://$DEPLOY_HOST:8080/health" > /dev/null; then
        echo -e "${GREEN}  ✓ Server is healthy${NC}"
    else
        echo -e "${RED}  ✗ Server health check failed${NC}"
        exit 1
    fi

    # Check metrics endpoint
    if curl -sf "http://$DEPLOY_HOST:9090/metrics" > /dev/null; then
        echo -e "${GREEN}  ✓ Metrics endpoint is accessible${NC}"
    else
        echo -e "${YELLOW}  ! Metrics endpoint not accessible (may be internal only)${NC}"
    fi
}

# Show logs
show_logs() {
    echo -e "${YELLOW}Showing logs...${NC}"
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "docker logs -f $SERVICE_NAME --tail 100"
}

# Main
main() {
    local method="${1:-docker}"

    case "$method" in
        "docker")
            check_prerequisites
            deploy_docker
            health_check
            ;;
        "binary")
            check_prerequisites
            deploy_binary
            health_check
            ;;
        "compose")
            check_prerequisites
            deploy_compose
            health_check
            ;;
        "rollback")
            check_prerequisites
            rollback
            health_check
            ;;
        "logs")
            check_prerequisites
            show_logs
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 [docker|binary|compose|rollback|logs|health]"
            echo ""
            echo "Methods:"
            echo "  docker   - Deploy using Docker (default)"
            echo "  binary   - Deploy binary with systemd"
            echo "  compose  - Deploy using docker-compose"
            echo "  rollback - Rollback to previous version"
            echo "  logs     - Show server logs"
            echo "  health   - Run health check"
            echo ""
            echo "Environment variables:"
            echo "  DEPLOY_HOST     - Target server hostname (required)"
            echo "  DEPLOY_USER     - SSH user (default: deploy)"
            echo "  DEPLOY_PATH     - Deployment path (default: /opt/tallow-relay)"
            echo "  DOCKER_REGISTRY - Docker registry (optional)"
            exit 1
            ;;
    esac

    echo ""
    echo -e "${GREEN}=== Deployment Complete ===${NC}"
    echo "Server: http://$DEPLOY_HOST:8080"
    echo "Metrics: http://$DEPLOY_HOST:9090/metrics"
    echo "Health: http://$DEPLOY_HOST:8080/health"
}

main "$@"
