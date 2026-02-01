#!/bin/bash
# Cross-platform build script for tallow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BINARY_NAME="tallow"
BUILD_DIR="build"
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Platforms to build
PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "linux/arm/7"
    "darwin/amd64"
    "darwin/arm64"
    "windows/amd64"
    "windows/arm64"
    "freebsd/amd64"
)

# LDFLAGS for smaller binaries
LDFLAGS="-X main.Version=${VERSION} -X main.Commit=${COMMIT} -X main.BuildDate=${BUILD_DATE} -s -w"

echo -e "${GREEN}Building tallow ${VERSION}${NC}"
echo "Commit: ${COMMIT}"
echo "Date: ${BUILD_DATE}"
echo ""

# Create build directory
mkdir -p "${BUILD_DIR}"

# Build for each platform
for platform in "${PLATFORMS[@]}"; do
    IFS='/' read -r -a parts <<< "$platform"
    GOOS="${parts[0]}"
    GOARCH="${parts[1]}"
    GOARM="${parts[2]:-}"

    output="${BUILD_DIR}/${BINARY_NAME}-${GOOS}-${GOARCH}"
    if [ -n "$GOARM" ]; then
        output="${output}v${GOARM}"
    fi
    if [ "$GOOS" = "windows" ]; then
        output="${output}.exe"
    fi

    echo -e "${YELLOW}Building ${GOOS}/${GOARCH}${GOARM:+v$GOARM}...${NC}"

    env GOOS="$GOOS" GOARCH="$GOARCH" GOARM="$GOARM" CGO_ENABLED=0 \
        go build -ldflags "$LDFLAGS" -o "$output" ./cmd/tallow

    if [ $? -eq 0 ]; then
        size=$(du -h "$output" | cut -f1)
        echo -e "  ${GREEN}✓${NC} ${output} (${size})"
    else
        echo -e "  ${RED}✗${NC} Failed to build ${GOOS}/${GOARCH}"
    fi
done

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo "Binaries are in ${BUILD_DIR}/"

# Generate checksums
echo ""
echo "Generating checksums..."
cd "${BUILD_DIR}"
sha256sum tallow-* > SHA256SUMS 2>/dev/null || shasum -a 256 tallow-* > SHA256SUMS
echo -e "${GREEN}✓${NC} SHA256SUMS created"
