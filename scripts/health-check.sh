#!/bin/bash
# Health Check Script
# Usage: ./scripts/health-check.sh [environment]
# Example: ./scripts/health-check.sh dev

set -e

ENVIRONMENT=${1:-dev}

echo "=========================================="
echo "Tallow Health Check"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# Determine URLs based on environment
if [ "$ENVIRONMENT" = "k8s" ]; then
    APP_URL="http://tallow-service.tallow.svc.cluster.local:3000"
    SIGNALING_URL="http://tallow-signaling-service.tallow.svc.cluster.local:3001"
elif [ "$ENVIRONMENT" = "prod" ]; then
    APP_URL="http://localhost:3000"
    SIGNALING_URL="http://localhost:3001"
else
    APP_URL="http://localhost:3000"
    SIGNALING_URL="http://localhost:3001"
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_endpoint() {
    local url=$1
    local name=$2
    local expected=$3

    echo -n "Checking $name... "

    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" = "200" ] && echo "$body" | grep -q "$expected"; then
            echo -e "${GREEN}✓ OK${NC}"
            echo "  Response: $body"
            return 0
        else
            echo -e "${RED}✗ FAILED${NC}"
            echo "  HTTP Code: $http_code"
            echo "  Response: $body"
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        return 1
    fi
}

# Check app health endpoint
check_endpoint "$APP_URL/api/health" "App Health" "ok" || APP_HEALTH_FAILED=1

# Check app readiness endpoint
check_endpoint "$APP_URL/api/ready" "App Readiness" "ok" || APP_READY_FAILED=1

# Check signaling server health
check_endpoint "$SIGNALING_URL/health" "Signaling Health" "ok" || SIGNALING_FAILED=1

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ -z "$APP_HEALTH_FAILED" ] && [ -z "$APP_READY_FAILED" ] && [ -z "$SIGNALING_FAILED" ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}Some health checks failed!${NC}"
    if [ -n "$APP_HEALTH_FAILED" ]; then
        echo "  - App health check failed"
    fi
    if [ -n "$APP_READY_FAILED" ]; then
        echo "  - App readiness check failed"
    fi
    if [ -n "$SIGNALING_FAILED" ]; then
        echo "  - Signaling server health check failed"
    fi
    exit 1
fi
