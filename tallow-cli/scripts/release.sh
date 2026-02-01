#!/bin/bash
# Release script for tallow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BINARY_NAME="tallow"
BUILD_DIR="build"
RELEASE_DIR="${BUILD_DIR}/release"

# Get version
VERSION="${1:-$(git describe --tags --always 2>/dev/null || echo "dev")}"

echo -e "${GREEN}Creating release ${VERSION}${NC}"
echo ""

# Clean and build
echo "Building binaries..."
./scripts/build.sh

# Create release directory
mkdir -p "${RELEASE_DIR}"

# Create archives
echo ""
echo "Creating release archives..."

cd "${BUILD_DIR}"

for binary in tallow-*; do
    [ -f "$binary" ] || continue
    [ "$binary" = "SHA256SUMS" ] && continue

    # Get platform from filename
    platform="${binary#tallow-}"
    platform="${platform%.exe}"

    archive_name="${BINARY_NAME}-${VERSION}-${platform}"

    if [[ "$binary" == *.exe ]]; then
        # Windows: create zip
        echo -e "${YELLOW}Creating ${archive_name}.zip...${NC}"
        zip -q "release/${archive_name}.zip" "$binary"
        echo -e "  ${GREEN}✓${NC} ${archive_name}.zip"
    else
        # Unix: create tar.gz
        echo -e "${YELLOW}Creating ${archive_name}.tar.gz...${NC}"
        tar -czf "release/${archive_name}.tar.gz" "$binary"
        echo -e "  ${GREEN}✓${NC} ${archive_name}.tar.gz"
    fi
done

# Generate checksums for release archives
echo ""
echo "Generating release checksums..."
cd release
sha256sum * > SHA256SUMS 2>/dev/null || shasum -a 256 * > SHA256SUMS
echo -e "${GREEN}✓${NC} SHA256SUMS created"

# Print summary
echo ""
echo -e "${GREEN}Release ${VERSION} complete!${NC}"
echo ""
echo "Release artifacts:"
ls -lh
echo ""
echo "SHA256SUMS:"
cat SHA256SUMS
echo ""
echo "Upload these files to the release:"
echo "  - All .tar.gz and .zip files"
echo "  - SHA256SUMS"
