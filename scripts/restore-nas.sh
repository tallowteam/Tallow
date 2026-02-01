#!/bin/bash
# Tallow NAS Restore Script
# Restores a backup created by backup-nas.sh
#
# Usage: ./restore-nas.sh <backup_file.tar.gz> [target_dir]
# Example: ./restore-nas.sh /volume1/backups/tallow/20260129_120000.tar.gz

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Check arguments
BACKUP_FILE="$1"
TARGET_DIR="${2:-/volume1/docker/tallow}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz> [target_dir]"
    echo "Example: $0 /volume1/backups/tallow/20260129_120000.tar.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

log "Tallow Restore Script"
log "====================="
log "Backup file: ${BACKUP_FILE}"
log "Target directory: ${TARGET_DIR}"
log ""

# Confirmation prompt
read -p "This will stop running containers and restore from backup. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Restore cancelled."
    exit 0
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

log "Extracting backup to temporary directory..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted directory (timestamp folder)
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "20*" | head -1)
if [ -z "$EXTRACTED_DIR" ]; then
    EXTRACTED_DIR="$TEMP_DIR"
fi

log "Extracted to: ${EXTRACTED_DIR}"

# Show manifest if exists
if [ -f "${EXTRACTED_DIR}/MANIFEST.txt" ]; then
    log ""
    log "Backup Manifest:"
    cat "${EXTRACTED_DIR}/MANIFEST.txt"
    log ""
fi

# Stop running containers
log "Stopping running containers..."
cd "$TARGET_DIR" 2>/dev/null && docker compose down 2>/dev/null || warn "No containers to stop"

# Create backup of current state
CURRENT_BACKUP="${TARGET_DIR}.pre-restore.$(date +%Y%m%d_%H%M%S)"
if [ -d "$TARGET_DIR" ]; then
    log "Creating backup of current state: ${CURRENT_BACKUP}"
    cp -r "$TARGET_DIR" "$CURRENT_BACKUP"
fi

# Restore configuration files
log "Restoring configuration files..."
mkdir -p "$TARGET_DIR"

[ -f "${EXTRACTED_DIR}/docker-compose.yml" ] && cp "${EXTRACTED_DIR}/docker-compose.yml" "$TARGET_DIR/"
[ -f "${EXTRACTED_DIR}/docker-compose.prod.yml" ] && cp "${EXTRACTED_DIR}/docker-compose.prod.yml" "$TARGET_DIR/"
[ -f "${EXTRACTED_DIR}/nginx.conf" ] && cp "${EXTRACTED_DIR}/nginx.conf" "$TARGET_DIR/"

# Restore .env (with confirmation since it contains secrets)
if [ -f "${EXTRACTED_DIR}/.env.backup" ]; then
    read -p "Restore .env file? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "${EXTRACTED_DIR}/.env.backup" "$TARGET_DIR/.env"
        log "✅ .env restored"
    else
        log "⏭️ .env skipped (using existing)"
    fi
fi

# Load Docker images
log "Loading Docker images..."
for IMAGE_FILE in "${EXTRACTED_DIR}"/*.tar.gz; do
    if [ -f "$IMAGE_FILE" ]; then
        IMAGE_NAME=$(basename "$IMAGE_FILE" .tar.gz)
        log "  Loading: ${IMAGE_NAME}"
        gunzip -c "$IMAGE_FILE" | docker load 2>/dev/null || warn "Failed to load ${IMAGE_NAME}"
    fi
done

# Restore Redis data
if [ -f "${EXTRACTED_DIR}/redis-dump.rdb" ]; then
    log "Redis dump found. To restore Redis data:"
    log "  1. Start Redis container: docker compose up -d redis"
    log "  2. Copy dump: docker cp ${EXTRACTED_DIR}/redis-dump.rdb \$(docker compose ps -q redis):/data/"
    log "  3. Restart Redis: docker compose restart redis"
fi

# Start containers
log "Starting containers..."
cd "$TARGET_DIR"
docker compose up -d

# Wait and verify
log "Waiting for services to start..."
sleep 10

# Health check
log "Running health checks..."
if docker compose ps | grep -q "running"; then
    log "✅ Containers are running"
else
    warn "Some containers may not be running. Check: docker compose ps"
fi

log ""
log "=========================================="
log "✅ Restore completed!"
log "=========================================="
log ""
log "Pre-restore backup saved to: ${CURRENT_BACKUP}"
log ""
log "Next steps:"
log "  1. Verify application: curl http://localhost:3000/api/health"
log "  2. Check logs: docker compose logs -f"
log "  3. If issues, restore previous state from: ${CURRENT_BACKUP}"
log ""
