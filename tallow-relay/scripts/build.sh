#!/bin/bash
# Build script for Tallow Relay Server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build variables
VERSION="${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo "dev")}"
BUILD_TIME="${BUILD_TIME:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"
GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")}"

# Output directory
OUT_DIR="${OUT_DIR:-bin}"

# Platforms to build for
PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "darwin/amd64"
    "darwin/arm64"
    "windows/amd64"
)

echo -e "${GREEN}=== Tallow Relay Build ===${NC}"
echo "Version:    $VERSION"
echo "Build Time: $BUILD_TIME"
echo "Git Commit: $GIT_COMMIT"
echo ""

# Create output directory
mkdir -p "$OUT_DIR"

# Build flags
LDFLAGS="-s -w -X main.version=$VERSION -X main.buildTime=$BUILD_TIME -X main.gitCommit=$GIT_COMMIT"

build_for_platform() {
    local platform=$1
    local os=$(echo $platform | cut -d'/' -f1)
    local arch=$(echo $platform | cut -d'/' -f2)

    local output_name="tallow-relay-${os}-${arch}"
    if [ "$os" == "windows" ]; then
        output_name="${output_name}.exe"
    fi

    echo -e "${YELLOW}Building for ${os}/${arch}...${NC}"

    CGO_ENABLED=0 GOOS=$os GOARCH=$arch go build \
        -trimpath \
        -ldflags="$LDFLAGS" \
        -o "$OUT_DIR/$output_name" \
        .

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ Built: $OUT_DIR/$output_name${NC}"
        # Show file size
        local size=$(ls -lh "$OUT_DIR/$output_name" | awk '{print $5}')
        echo "    Size: $size"
    else
        echo -e "${RED}  ✗ Failed to build for ${os}/${arch}${NC}"
        return 1
    fi
}

# Build for current platform only
build_current() {
    echo -e "${YELLOW}Building for current platform...${NC}"

    CGO_ENABLED=0 go build \
        -trimpath \
        -ldflags="$LDFLAGS" \
        -o "$OUT_DIR/tallow-relay" \
        .

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ Built: $OUT_DIR/tallow-relay${NC}"
        local size=$(ls -lh "$OUT_DIR/tallow-relay" | awk '{print $5}')
        echo "    Size: $size"
    else
        echo -e "${RED}  ✗ Build failed${NC}"
        exit 1
    fi
}

# Build for all platforms
build_all() {
    for platform in "${PLATFORMS[@]}"; do
        build_for_platform "$platform"
    done
}

# Parse arguments
case "${1:-current}" in
    "all")
        build_all
        ;;
    "linux")
        build_for_platform "linux/amd64"
        build_for_platform "linux/arm64"
        ;;
    "darwin"|"macos")
        build_for_platform "darwin/amd64"
        build_for_platform "darwin/arm64"
        ;;
    "windows")
        build_for_platform "windows/amd64"
        ;;
    "current"|*)
        build_current
        ;;
esac

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo "Binaries are in: $OUT_DIR/"
ls -la "$OUT_DIR/"
