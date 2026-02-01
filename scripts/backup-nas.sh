#!/bin/bash
# Tallow NAS Backup Script
# Run this on your Synology NAS or schedule via Task Scheduler
#
# Usage: ./backup-nas.sh [backup_dir]
# Default backup directory: /volume1/backups/tallow
#
# Recommended: Schedule this script to run daily via DSM Task Scheduler

set -e

# Configuration
TALLOW_DIR="${TALLOW_DIR:-/volume1/docker/tallow}"
BACKUP_BASE="${1:-/volume1/backups/tallow}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE}/${TIMESTAMP}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if running as root (needed for some Docker operations)
if [ "$EUID" -ne 0 ] && [ ! -w "$BACKUP_BASE" ]; then
    warn "Not running as root. Some operations may fail."
fi

# Create backup directory
log "Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# 1. Backup Docker Compose configuration
log "Backing up Docker Compose files..."
cp -r "${TALLOW_DIR}/docker-compose.yml" "${BACKUP_DIR}/" 2>/dev/null || warn "docker-compose.yml not found"
cp -r "${TALLOW_DIR}/docker-compose.prod.yml" "${BACKUP_DIR}/" 2>/dev/null || true
cp -r "${TALLOW_DIR}/.env" "${BACKUP_DIR}/.env.backup" 2>/dev/null || warn ".env not found"

# 2. Backup environment variables (sanitized)
log "Backing up environment configuration (sanitized)..."
if [ -f "${TALLOW_DIR}/.env" ]; then
    # Create sanitized version (mask sensitive values)
    sed -E 's/(KEY|SECRET|PASSWORD|TOKEN)=.*/\1=***REDACTED***/g' "${TALLOW_DIR}/.env" > "${BACKUP_DIR}/.env.sanitized"
fi

# 3. Export Docker images
log "Exporting Docker images..."
cd "${TALLOW_DIR}"

# Get image names from running containers
IMAGES=$(docker compose ps -q 2>/dev/null | xargs -r docker inspect --format='{{.Config.Image}}' | sort -u)

for IMAGE in $IMAGES; do
    IMAGE_FILE=$(echo "$IMAGE" | tr '/:' '_')
    log "  Exporting: ${IMAGE}"
    docker save "$IMAGE" | gzip > "${BACKUP_DIR}/${IMAGE_FILE}.tar.gz" 2>/dev/null || warn "Failed to export ${IMAGE}"
done

# 4. Backup Redis data (if using persistent Redis)
if docker compose ps redis 2>/dev/null | grep -q "running"; then
    log "Backing up Redis data..."
    docker compose exec -T redis redis-cli BGSAVE 2>/dev/null || true
    sleep 2
    docker cp "$(docker compose ps -q redis)":/data/dump.rdb "${BACKUP_DIR}/redis-dump.rdb" 2>/dev/null || warn "Redis backup skipped"
fi

# 5. Backup application logs
log "Backing up application logs..."
mkdir -p "${BACKUP_DIR}/logs"
docker compose logs --no-color > "${BACKUP_DIR}/logs/docker-compose.log" 2>&1 || true

# 6. Backup Nginx configuration (if exists)
if [ -f "${TALLOW_DIR}/nginx.conf" ]; then
    log "Backing up Nginx configuration..."
    cp "${TALLOW_DIR}/nginx.conf" "${BACKUP_DIR}/"
fi

# 7. Create backup manifest
log "Creating backup manifest..."
cat > "${BACKUP_DIR}/MANIFEST.txt" << EOF
Tallow Backup Manifest
======================
Backup Date: $(date)
Source Directory: ${TALLOW_DIR}
Backup Directory: ${BACKUP_DIR}

Contents:
---------
$(ls -la "${BACKUP_DIR}")

Docker Images:
--------------
$(docker compose ps 2>/dev/null || echo "Could not list containers")

Disk Usage:
-----------
$(du -sh "${BACKUP_DIR}")
EOF

# 8. Compress backup
log "Compressing backup..."
cd "${BACKUP_BASE}"
tar -czf "${TIMESTAMP}.tar.gz" "${TIMESTAMP}"
rm -rf "${TIMESTAMP}"

log "Backup created: ${BACKUP_BASE}/${TIMESTAMP}.tar.gz"
log "Backup size: $(du -h "${BACKUP_BASE}/${TIMESTAMP}.tar.gz" | cut -f1)"

# 9. Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_BASE}" -name "*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
REMAINING=$(ls -1 "${BACKUP_BASE}"/*.tar.gz 2>/dev/null | wc -l)
log "Remaining backups: ${REMAINING}"

# 10. Verify backup integrity
log "Verifying backup integrity..."
if tar -tzf "${BACKUP_BASE}/${TIMESTAMP}.tar.gz" > /dev/null 2>&1; then
    log "✅ Backup verification: PASSED"
else
    error "Backup verification: FAILED"
fi

log ""
log "=========================================="
log "✅ Backup completed successfully!"
log "=========================================="
log "Backup location: ${BACKUP_BASE}/${TIMESTAMP}.tar.gz"
log ""
log "To restore, run:"
log "  tar -xzf ${BACKUP_BASE}/${TIMESTAMP}.tar.gz -C /tmp"
log "  # Then copy files to ${TALLOW_DIR}"
log ""
