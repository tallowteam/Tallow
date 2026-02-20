#!/bin/sh
# install.sh -- Install tallow
# Usage: curl -sSf https://raw.githubusercontent.com/AamirAlam/tallow/master/scripts/install.sh | sh
set -eu

REPO="AamirAlam/tallow"
INSTALL_DIR="${TALLOW_INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="tallow"

detect_platform() {
    OS=$(uname -s)
    ARCH=$(uname -m)
    case "$OS" in
        Linux)   PLATFORM="unknown-linux-gnu" ;;
        Darwin)  PLATFORM="apple-darwin" ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "Error: Use Scoop on Windows:"
            echo "  scoop bucket add tallow https://github.com/AamirAlam/scoop-tallow"
            echo "  scoop install tallow"
            exit 1 ;;
        *)
            echo "Error: Unsupported OS: $OS"
            exit 1 ;;
    esac
    case "$ARCH" in
        x86_64|amd64)   ARCH="x86_64" ;;
        aarch64|arm64)   ARCH="aarch64" ;;
        *)
            echo "Error: Unsupported architecture: $ARCH"
            exit 1 ;;
    esac
}

check_deps() {
    for cmd in curl tar; do
        if ! command -v "$cmd" > /dev/null 2>&1; then
            echo "Error: '$cmd' is required but not found."
            exit 1
        fi
    done
}

get_latest_version() {
    VERSION=$(curl -sSf "https://api.github.com/repos/$REPO/releases/latest" \
        | grep '"tag_name"' \
        | sed -E 's/.*"v?([^"]+)".*/\1/')
    if [ -z "$VERSION" ]; then
        echo "Error: Could not determine latest version"
        exit 1
    fi
}

install() {
    FILENAME="tallow-v${VERSION}-${ARCH}-${PLATFORM}.tar.gz"
    URL="https://github.com/$REPO/releases/download/v${VERSION}/${FILENAME}"
    CHECKSUM_URL="${URL}.sha256"

    echo "Installing tallow v${VERSION} for ${ARCH}-${PLATFORM}..."
    TMPDIR=$(mktemp -d)
    trap 'rm -rf "$TMPDIR"' EXIT

    curl -sSfL "$URL" -o "$TMPDIR/$FILENAME"

    # Verify checksum if tools available
    if command -v sha256sum > /dev/null 2>&1; then
        curl -sSfL "$CHECKSUM_URL" -o "$TMPDIR/${FILENAME}.sha256" 2>/dev/null && \
            (cd "$TMPDIR" && sha256sum -c "${FILENAME}.sha256") || \
            echo "Warning: Could not verify checksum"
    elif command -v shasum > /dev/null 2>&1; then
        curl -sSfL "$CHECKSUM_URL" -o "$TMPDIR/${FILENAME}.sha256" 2>/dev/null && {
            EXPECTED=$(awk '{print $1}' "$TMPDIR/${FILENAME}.sha256")
            ACTUAL=$(shasum -a 256 "$TMPDIR/$FILENAME" | awk '{print $1}')
            if [ "$EXPECTED" != "$ACTUAL" ]; then
                echo "Error: Checksum verification failed"
                exit 1
            fi
            echo "Checksum verified."
        } || echo "Warning: Could not verify checksum"
    fi

    tar xzf "$TMPDIR/$FILENAME" -C "$TMPDIR"

    if [ -w "$INSTALL_DIR" ]; then
        cp "$TMPDIR/tallow" "$INSTALL_DIR/"
        chmod +x "$INSTALL_DIR/tallow"
        cp "$TMPDIR/tallow-relay" "$INSTALL_DIR/" 2>/dev/null && \
            chmod +x "$INSTALL_DIR/tallow-relay" || true
    else
        echo "Installing to $INSTALL_DIR (requires sudo)..."
        sudo cp "$TMPDIR/tallow" "$INSTALL_DIR/"
        sudo chmod +x "$INSTALL_DIR/tallow"
        sudo cp "$TMPDIR/tallow-relay" "$INSTALL_DIR/" 2>/dev/null && \
            sudo chmod +x "$INSTALL_DIR/tallow-relay" || true
    fi

    echo ""
    echo "tallow v${VERSION} installed to $INSTALL_DIR"
    echo ""
    echo "Get started:"
    echo "  tallow send <file>       # Send a file"
    echo "  tallow receive <code>    # Receive a file"
    echo "  tallow --help            # Full usage"
}

detect_platform
check_deps
get_latest_version
install
