#!/usr/bin/env bash
# TALLOW - Complete Build Script (Linux/macOS)
# Builds all components: Next.js, Go CLI, Go Relay, Rust WASM, mDNS Daemon, Flutter

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "============================================"
echo "  TALLOW - Complete Build System"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"

    # Node.js (required)
    if ! command -v node &> /dev/null; then
        echo -e "${RED}  Node.js: NOT INSTALLED (required)${NC}"
        echo "       Install: https://nodejs.org/"
        exit 1
    else
        echo -e "${GREEN}  Node.js: $(node --version)${NC}"
    fi

    # Go (optional)
    if ! command -v go &> /dev/null; then
        echo -e "${YELLOW}  Go: NOT INSTALLED (optional - needed for CLI/Relay)${NC}"
        echo "       Install: brew install go  OR  https://go.dev/dl/"
    else
        echo -e "${GREEN}  Go: $(go version)${NC}"
    fi

    # Rust (optional)
    if ! command -v rustc &> /dev/null; then
        echo -e "${YELLOW}  Rust: NOT INSTALLED (optional - needed for WASM)${NC}"
        echo "       Install: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    else
        echo -e "${GREEN}  Rust: $(rustc --version)${NC}"
    fi

    # Flutter (optional)
    if ! command -v flutter &> /dev/null; then
        echo -e "${YELLOW}  Flutter: NOT INSTALLED (optional - needed for mobile app)${NC}"
        echo "       Install: https://docs.flutter.dev/get-started/install"
    else
        echo -e "${GREEN}  Flutter: $(flutter --version | head -1)${NC}"
    fi

    echo ""
}

# Build Next.js web app
build_web() {
    echo -e "${YELLOW}[2/5] Building Next.js web app...${NC}"
    npm ci --prefer-offline 2>/dev/null || npm install
    npm run build
    echo -e "${GREEN}  Web app built successfully!${NC}"
    echo ""
}

# Build mDNS Daemon
build_daemon() {
    echo -e "${YELLOW}[3/5] Building mDNS daemon...${NC}"

    if [ ! -d "daemon" ]; then
        echo -e "${YELLOW}  Daemon directory not found, skipping...${NC}"
        return
    fi

    cd daemon
    npm ci --prefer-offline 2>/dev/null || npm install
    if npm run build 2>/dev/null; then
        echo -e "${GREEN}  mDNS daemon built successfully!${NC}"
    else
        echo -e "${YELLOW}  mDNS daemon build skipped (no build script)${NC}"
    fi
    cd ..
    echo ""
}

# Build Go CLI and Relay
build_go() {
    if ! command -v go &> /dev/null; then
        echo -e "${YELLOW}[4/5] Skipping Go builds (Go not installed)${NC}"
        return
    fi

    echo -e "${YELLOW}[4/5] Building Go CLI and Relay...${NC}"

    # Build CLI
    if [ -d "tallow-cli" ]; then
        cd tallow-cli
        mkdir -p build
        CGO_ENABLED=0 go build -ldflags="-s -w" -o build/tallow ./cmd/tallow
        echo -e "${GREEN}  Go CLI built: tallow-cli/build/tallow${NC}"
        cd ..
    fi

    # Build Relay
    if [ -d "tallow-relay" ]; then
        cd tallow-relay
        mkdir -p build
        CGO_ENABLED=0 go build -ldflags="-s -w" -o build/tallow-relay .
        echo -e "${GREEN}  Go Relay built: tallow-relay/build/tallow-relay${NC}"
        cd ..
    fi

    echo ""
}

# Build Rust WASM
build_wasm() {
    if ! command -v rustc &> /dev/null; then
        echo -e "${YELLOW}[5/5] Skipping Rust WASM (Rust not installed)${NC}"
        return
    fi

    echo -e "${YELLOW}[5/5] Building Rust WASM...${NC}"

    if [ ! -d "tallow-wasm" ]; then
        echo -e "${YELLOW}  WASM directory not found, skipping...${NC}"
        return
    fi

    cd tallow-wasm

    # Install wasm-pack if needed
    if ! command -v wasm-pack &> /dev/null; then
        echo "  Installing wasm-pack..."
        cargo install wasm-pack
    fi

    wasm-pack build --target web --release
    echo -e "${GREEN}  Rust WASM built: tallow-wasm/pkg/${NC}"
    cd ..
    echo ""
}

# Build Flutter app
build_flutter() {
    if ! command -v flutter &> /dev/null; then
        echo -e "${YELLOW}  Skipping Flutter app (Flutter not installed)${NC}"
        return
    fi

    echo -e "${YELLOW}  Building Flutter app...${NC}"

    if [ ! -d "tallow-mobile" ]; then
        echo -e "${YELLOW}  Flutter directory not found, skipping...${NC}"
        return
    fi

    cd tallow-mobile
    flutter pub get

    # Detect OS and build accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        flutter build macos --release
        echo -e "${GREEN}  Flutter app built: build/macos/${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        flutter build linux --release
        echo -e "${GREEN}  Flutter app built: build/linux/${NC}"
    fi

    cd ..
}

# Run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    npm test -- --passWithNoTests 2>/dev/null || true
    echo ""
}

# Main execution
check_prerequisites
build_web
build_daemon
build_go
build_wasm
build_flutter

echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo "Built artifacts:"
echo "  - .next/            (Next.js web app)"
[ -f "tallow-cli/build/tallow" ] && echo "  - tallow-cli/build/ (Go CLI)"
[ -f "tallow-relay/build/tallow-relay" ] && echo "  - tallow-relay/build/ (Go Relay)"
[ -d "tallow-wasm/pkg" ] && echo "  - tallow-wasm/pkg/  (Rust WASM)"
echo ""
