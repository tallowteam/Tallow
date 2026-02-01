#!/bin/bash
# Vercel Deployment Script for Tallow
# Usage: ./deploy-vercel.sh [production|preview]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Tallow Vercel Deployment Script              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not found${NC}"
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check environment
ENVIRONMENT=${1:-preview}
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "preview" ]]; then
    echo -e "${RED}✗ Invalid environment. Use 'production' or 'preview'${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment: $ENVIRONMENT${NC}"

# Check if required files exist
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found. Are you in the project root?${NC}"
    exit 1
fi

if [ ! -f "next.config.ts" ]; then
    echo -e "${RED}✗ next.config.ts not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project files found${NC}"

# Run tests (optional)
echo ""
echo -e "${YELLOW}Running tests...${NC}"
if npm run test:unit > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Tests skipped or failed (continuing anyway)${NC}"
fi

# Build locally to check for errors
echo ""
echo -e "${YELLOW}Building locally to check for errors...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Local build successful${NC}"
else
    echo -e "${RED}✗ Local build failed. Fix errors before deploying.${NC}"
    exit 1
fi

# Check environment variables
echo ""
echo -e "${YELLOW}Checking required environment variables...${NC}"

REQUIRED_VARS=(
    "API_SECRET_KEY"
    "NEXT_PUBLIC_TURN_SERVER"
    "NEXT_PUBLIC_TURN_USERNAME"
    "NEXT_PUBLIC_TURN_CREDENTIAL"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! vercel env ls | grep -q "$var"; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠ Missing environment variables in Vercel:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "   - $var"
    done
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ All required environment variables are set${NC}"
fi

# Deploy
echo ""
echo -e "${YELLOW}Deploying to Vercel ($ENVIRONMENT)...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod
else
    vercel
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Deployment Successful!                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Show deployment URL
    DEPLOYMENT_URL=$(vercel ls 2>/dev/null | head -n 2 | tail -n 1 | awk '{print $2}')
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo -e "${GREEN}Deployment URL: https://$DEPLOYMENT_URL${NC}"
    fi

    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Test the deployment thoroughly"
    echo -e "2. Check application logs: ${GREEN}vercel logs${NC}"
    echo -e "3. Monitor performance in Vercel dashboard"

    if [ "$ENVIRONMENT" = "preview" ]; then
        echo -e "4. Promote to production: ${GREEN}./deploy-vercel.sh production${NC}"
    fi
else
    echo ""
    echo -e "${RED}✗ Deployment failed${NC}"
    echo -e "${YELLOW}Check the error messages above and try again${NC}"
    exit 1
fi
