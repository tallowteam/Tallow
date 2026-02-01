#!/bin/bash
# Production Deployment Script
# Usage: ./scripts/deploy-prod.sh

set -e

echo "=========================================="
echo "Tallow Production Deployment"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load environment variables from .env.production if it exists
if [ -f .env.production ]; then
    echo "Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env.production not found. Please create it before deploying."
    exit 1
fi

# Verify required environment variables
required_vars=(
    "NEXT_PUBLIC_SIGNALING_URL"
    "ALLOWED_ORIGINS"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set."
        exit 1
    fi
done

# Build production images
echo ""
echo "Building production images..."
docker-compose -f docker-compose.yml build --no-cache

# Tag images with version
VERSION=$(date +%Y%m%d-%H%M%S)
docker tag tallow:latest tallow:$VERSION
docker tag tallow-signaling:latest tallow-signaling:$VERSION

echo "Tagged images with version: $VERSION"

# Start production services
echo ""
echo "Starting production services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check health status
echo ""
echo "Checking service health..."

max_retries=12
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if curl -s http://localhost:3000/api/ready | grep -q "ok"; then
        echo "✓ Tallow app is ready"
        break
    else
        retry_count=$((retry_count+1))
        if [ $retry_count -lt $max_retries ]; then
            echo "  Waiting for app to be ready... ($retry_count/$max_retries)"
            sleep 5
        else
            echo "✗ Tallow app failed to become ready"
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs tallow
            exit 1
        fi
    fi
done

# Check signaling server
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo "✓ Signaling server is healthy"
else
    echo "✗ Signaling server is not responding"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs signaling
fi

# Display running services
echo ""
echo "Running services:"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Production deployment complete!"
echo "=========================================="
echo ""
echo "Version: $VERSION"
echo ""
echo "Monitor logs:"
echo "  docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo ""
echo "Rollback (if needed):"
echo "  docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "  # Restore previous version and redeploy"
echo ""
