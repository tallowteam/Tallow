#!/usr/bin/env bash

# ============================================================================
# Multi-Architecture Docker Build Script
# Builds and pushes Tallow containers for AMD64 and ARM64
# Supports both local and registry deployments
# ============================================================================

set -euo pipefail

# Configuration
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
REGISTRY_USER="${DOCKER_USERNAME:-}"
REGISTRY_PASSWORD="${DOCKER_PASSWORD:-}"
IMAGE_NAME="${IMAGE_NAME:-tallow}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BUILD_PUSH="${BUILD_PUSH:-false}"
BUILD_LOAD="${BUILD_LOAD:-false}"  # Only works for single architecture
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER_NAME="${BUILDER_NAME:-multiarch-builder}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}INFO:${NC} $@"
}

log_success() {
    echo -e "${GREEN}SUCCESS:${NC} $@"
}

log_warn() {
    echo -e "${YELLOW}WARN:${NC} $@"
}

log_error() {
    echo -e "${RED}ERROR:${NC} $@"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Multi-architecture Docker build script for Tallow

OPTIONS:
    -r, --registry REGISTRY         Docker registry (default: docker.io)
    -u, --username USERNAME         Docker registry username
    -p, --password PASSWORD         Docker registry password (use \$DOCKER_PASSWORD env var)
    -i, --image IMAGE_NAME          Image name (default: tallow)
    -t, --tag TAG                   Image tag (default: latest)
    --platforms PLATFORMS           Platforms to build for (default: linux/amd64,linux/arm64)
    --push                          Push images to registry
    --load                          Load image locally (only works with single platform)
    --builder BUILDER_NAME          Builder name (default: multiarch-builder)
    --setup                         Setup buildx builder
    --cleanup                       Cleanup builder
    --mainline MAIN_TAG             Build and push mainline version
    --help                          Show this help message

EXAMPLES:
    # Setup builder
    $0 --setup

    # Build for local development (amd64 only)
    $0 --platforms linux/amd64 --load

    # Build and push multi-arch to registry
    $0 --push --registry ghcr.io --username myuser

    # Build and push with specific tag
    $0 --push --registry ghcr.io --username myuser --tag v0.1.0

    # Build mainline with git commit hash
    $0 --push --mainline true

EOF
    exit 0
}

setup_builder() {
    log_info "Setting up Docker buildx builder: $BUILDER_NAME"

    # Check if builder already exists
    if docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
        log_warn "Builder $BUILDER_NAME already exists"
        return 0
    fi

    # Create builder instance
    docker buildx create \
        --name "$BUILDER_NAME" \
        --driver docker-container \
        --driver-opt image=moby/buildkit:latest \
        --use

    log_success "Builder $BUILDER_NAME created successfully"
}

cleanup_builder() {
    log_info "Cleaning up builder: $BUILDER_NAME"

    if ! docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
        log_warn "Builder $BUILDER_NAME does not exist"
        return 0
    fi

    docker buildx rm "$BUILDER_NAME"
    log_success "Builder $BUILDER_NAME removed successfully"
}

login_registry() {
    if [ -z "$REGISTRY_USER" ] || [ -z "$REGISTRY_PASSWORD" ]; then
        log_warn "Registry credentials not provided, skipping login"
        return 0
    fi

    log_info "Logging in to registry: $REGISTRY"
    echo "$REGISTRY_PASSWORD" | docker login \
        --username "$REGISTRY_USER" \
        --password-stdin \
        "$REGISTRY"

    log_success "Logged in to registry"
}

build_image() {
    local dockerfile="$1"
    local image_name="$2"
    local full_image_tag="${REGISTRY}/${image_name}:${IMAGE_TAG}"

    log_info "Building image: $full_image_tag"
    log_info "Platforms: $PLATFORMS"
    log_info "Dockerfile: $dockerfile"

    # Build arguments
    local build_args=(
        "--build-arg" "NODE_VERSION=20"
        "--build-arg" "ALPINE_VERSION=3.20"
        "--build-arg" "NEXT_TELEMETRY_DISABLED=1"
    )

    # Cache configuration
    local cache_args=(
        "--cache-from" "type=registry,ref=${full_image_tag}-buildcache"
    )

    # Platform-specific options
    local platform_args=(
        "--platform" "$PLATFORMS"
    )

    # Output options
    local output_args=()
    if [ "$BUILD_PUSH" = "true" ]; then
        output_args+=("--push")
    elif [ "$BUILD_LOAD" = "true" ]; then
        # Load only works with single platform
        if [[ "$PLATFORMS" == *","* ]]; then
            log_error "Cannot use --load with multiple platforms. Use single platform: --platforms linux/amd64"
            return 1
        fi
        output_args+=("--load")
    fi

    # Build image
    docker buildx build \
        "${platform_args[@]}" \
        "${build_args[@]}" \
        "${cache_args[@]}" \
        "${output_args[@]}" \
        --tag "$full_image_tag" \
        --file "$dockerfile" \
        --builder "$BUILDER_NAME" \
        .

    log_success "Successfully built $full_image_tag"

    if [ "$BUILD_PUSH" = "true" ]; then
        log_success "Pushed $full_image_tag to registry"
    elif [ "$BUILD_LOAD" = "true" ]; then
        log_success "Loaded $full_image_tag locally"
    fi

    return 0
}

build_all() {
    log_info "Building all images..."

    # Build main application
    log_info "Building Tallow application..."
    build_image "Dockerfile" "$IMAGE_NAME"

    # Build signaling server
    log_info "Building Tallow signaling server..."
    build_image "Dockerfile.signaling" "$IMAGE_NAME-signaling"

    log_success "All images built successfully"
}

validate_environment() {
    log_info "Validating environment..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        return 1
    fi

    # Check Docker buildx
    if ! docker buildx version &> /dev/null; then
        log_error "Docker buildx is not available"
        return 1
    fi

    # Verify builder exists
    if ! docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
        log_warn "Builder $BUILDER_NAME does not exist. Run with --setup first"
        log_info "Running setup..."
        setup_builder
    fi

    log_success "Environment validation passed"
    return 0
}

get_git_commit() {
    if ! command -v git &> /dev/null; then
        echo "unknown"
        return
    fi

    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

get_git_branch() {
    if ! command -v git &> /dev/null; then
        echo "unknown"
        return
    fi

    git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

print_summary() {
    log_info "Build Summary:"
    echo "  Registry:       $REGISTRY"
    echo "  Image:          $IMAGE_NAME"
    echo "  Tag:            $IMAGE_TAG"
    echo "  Platforms:      $PLATFORMS"
    echo "  Full Image:     ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    echo "  Push:           $BUILD_PUSH"
    echo "  Load:           $BUILD_LOAD"
    echo "  Builder:        $BUILDER_NAME"
    echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
    local setup_mode=false
    local cleanup_mode=false
    local mainline_build=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            -u|--username)
                REGISTRY_USER="$2"
                shift 2
                ;;
            -p|--password)
                REGISTRY_PASSWORD="$2"
                shift 2
                ;;
            -i|--image)
                IMAGE_NAME="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --platforms)
                PLATFORMS="$2"
                shift 2
                ;;
            --push)
                BUILD_PUSH=true
                shift
                ;;
            --load)
                BUILD_LOAD=true
                shift
                ;;
            --builder)
                BUILDER_NAME="$2"
                shift 2
                ;;
            --setup)
                setup_mode=true
                shift
                ;;
            --cleanup)
                cleanup_mode=true
                shift
                ;;
            --mainline)
                mainline_build=true
                IMAGE_TAG="mainline"
                shift
                ;;
            -h|--help)
                show_usage
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                ;;
        esac
    done

    # Handle setup/cleanup modes
    if [ "$setup_mode" = true ]; then
        setup_builder
        exit $?
    fi

    if [ "$cleanup_mode" = true ]; then
        cleanup_builder
        exit $?
    fi

    # Validate environment
    if ! validate_environment; then
        log_error "Environment validation failed"
        exit 1
    fi

    # Login if credentials provided
    if [ "$BUILD_PUSH" = "true" ]; then
        login_registry
    fi

    # Print summary
    print_summary

    # Build images
    if ! build_all; then
        log_error "Build failed"
        exit 1
    fi

    # Additional mainline metadata
    if [ "$mainline_build" = true ]; then
        local commit_hash=$(get_git_commit)
        local branch=$(get_git_branch)
        log_info "Mainline build completed"
        echo "  Commit:         $commit_hash"
        echo "  Branch:         $branch"
    fi

    log_success "All operations completed successfully"
}

main "$@"
