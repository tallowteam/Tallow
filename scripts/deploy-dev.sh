#!/bin/bash
# Development Environment Deployment Script
# Usage: ./scripts/deploy-dev.sh

set -e

echo "=========================================="
echo "Tallow Development Deployment"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    echo "Loading environment variables from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "Warning: .env.local not found. Using default environment variables."
fi

# Build and start services
echo ""
echo "Building and starting development services..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check health status
echo ""
echo "Checking service health..."

# Check app health
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo "✓ Tallow app is healthy"
else
    echo "✗ Tallow app is not responding"
fi

# Check signaling server health
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo "✓ Signaling server is healthy"
else
    echo "✗ Signaling server is not responding"
fi

# Check Redis health
if docker exec tallow-redis-dev redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "✓ Redis is healthy"
else
    echo "✗ Redis is not responding"
fi

# Display running services
echo ""
echo "Running services:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "=========================================="
echo "Development environment is ready!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Web App:         http://localhost:3000"
echo "  - Signaling:       http://localhost:3001"
echo "  - Redis:           localhost:6379"
echo "  - TURN Server:     localhost:3478 (UDP/TCP)"
echo ""
echo "Logs:"
echo "  docker-compose -f docker-compose.dev.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""
