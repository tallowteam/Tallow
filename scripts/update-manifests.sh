#!/bin/sh
# update-manifests.sh -- Update package manager manifest SHA256 hashes after a release
# Usage: ./scripts/update-manifests.sh v0.1.0
set -eu

VERSION="${1:?Usage: $0 <version-tag>}"
REPO="tallowteam/Tallow"
VERSION_NUM="${VERSION#v}"

echo "Updating manifests for $VERSION..."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

for TARGET in x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu x86_64-apple-darwin aarch64-apple-darwin x86_64-pc-windows-msvc; do
    case "$TARGET" in
        *windows*) EXT="zip" ;;
        *)         EXT="tar.gz" ;;
    esac
    FILENAME="tallow-${VERSION}-${TARGET}.${EXT}"
    CHECKSUM_URL="https://github.com/$REPO/releases/download/${VERSION}/${FILENAME}.sha256"
    echo "  Fetching checksum for $TARGET..."
    curl -sSfL "$CHECKSUM_URL" -o "$TMPDIR/${TARGET}.sha256" || {
        echo "  Warning: Could not fetch checksum for $TARGET"
        echo "MISSING" > "$TMPDIR/${TARGET}.sha256"
    }
done

get_hash() { awk '{print $1}' "$TMPDIR/$1.sha256"; }

HASH_X86_LINUX=$(get_hash x86_64-unknown-linux-gnu)
HASH_ARM_LINUX=$(get_hash aarch64-unknown-linux-gnu)
HASH_X86_DARWIN=$(get_hash x86_64-apple-darwin)
HASH_ARM_DARWIN=$(get_hash aarch64-apple-darwin)
HASH_X86_WINDOWS=$(get_hash x86_64-pc-windows-msvc)

echo ""
echo "SHA256 checksums:"
echo "  x86_64-linux:   $HASH_X86_LINUX"
echo "  aarch64-linux:  $HASH_ARM_LINUX"
echo "  x86_64-darwin:  $HASH_X86_DARWIN"
echo "  aarch64-darwin: $HASH_ARM_DARWIN"
echo "  x86_64-windows: $HASH_X86_WINDOWS"

FORMULA="homebrew/Formula/tallow.rb"
if [ -f "$FORMULA" ]; then
    echo "Updating $FORMULA..."
    sed -i.bak "s/version \".*\"/version \"${VERSION_NUM}\"/" "$FORMULA"
    # Replace any existing sha256 on the line following the aarch64-apple-darwin URL
    sed -i.bak "/aarch64-apple-darwin/{ n; s/sha256 \"[^\"]*\"/sha256 \"${HASH_ARM_DARWIN}\"/; }" "$FORMULA"
    sed -i.bak "/x86_64-apple-darwin/{ n; s/sha256 \"[^\"]*\"/sha256 \"${HASH_X86_DARWIN}\"/; }" "$FORMULA"
    sed -i.bak "/aarch64-unknown-linux-gnu/{ n; s/sha256 \"[^\"]*\"/sha256 \"${HASH_ARM_LINUX}\"/; }" "$FORMULA"
    sed -i.bak "/x86_64-unknown-linux-gnu/{ n; s/sha256 \"[^\"]*\"/sha256 \"${HASH_X86_LINUX}\"/; }" "$FORMULA"
    rm -f "${FORMULA}.bak"
fi

MANIFEST="scoop/tallow.json"
if [ -f "$MANIFEST" ]; then
    echo "Updating $MANIFEST..."
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION_NUM}\"/" "$MANIFEST"
    sed -i.bak "s/\"hash\": \"[^\"]*\"/\"hash\": \"${HASH_X86_WINDOWS}\"/" "$MANIFEST"
    rm -f "${MANIFEST}.bak"
fi

echo ""
echo "Done. Review with: git diff homebrew/ scoop/"
