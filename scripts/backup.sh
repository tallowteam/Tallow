#!/bin/bash
# TALLOW Backup Script
# Backup configuration, secrets, and state

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-tallow}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="tallow_backup_${TIMESTAMP}"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_backup_dir() {
    log_info "Creating backup directory..."
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"
}

backup_kubernetes_resources() {
    log_info "Backing up Kubernetes resources..."

    # Create subdirectories
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/k8s"

    # Backup deployments
    kubectl get deployments -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/deployments.yaml"

    # Backup services
    kubectl get services -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/services.yaml"

    # Backup configmaps
    kubectl get configmaps -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/configmaps.yaml"

    # Backup secrets (encrypted)
    kubectl get secrets -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/secrets.yaml"

    # Backup ingress
    kubectl get ingress -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/ingress.yaml" || true

    # Backup HPA
    kubectl get hpa -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/hpa.yaml" || true

    # Backup PDB
    kubectl get pdb -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/k8s/pdb.yaml" || true

    log_info "Kubernetes resources backed up."
}

backup_helm_releases() {
    log_info "Backing up Helm releases..."

    if command -v helm &> /dev/null; then
        mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/helm"

        helm list -n ${NAMESPACE} -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/helm/releases.yaml" || true
        helm get values tallow -n ${NAMESPACE} > "${BACKUP_DIR}/${BACKUP_NAME}/helm/values.yaml" || true
        helm get manifest tallow -n ${NAMESPACE} > "${BACKUP_DIR}/${BACKUP_NAME}/helm/manifest.yaml" || true

        log_info "Helm releases backed up."
    else
        log_warn "Helm not installed, skipping Helm backup."
    fi
}

backup_application_config() {
    log_info "Backing up application configuration..."

    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/config"

    # Copy configuration files
    cp -r k8s "${BACKUP_DIR}/${BACKUP_NAME}/config/" || true
    cp -r helm "${BACKUP_DIR}/${BACKUP_NAME}/config/" || true

    log_info "Application configuration backed up."
}

create_backup_metadata() {
    log_info "Creating backup metadata..."

    cat > "${BACKUP_DIR}/${BACKUP_NAME}/metadata.txt" <<EOF
TALLOW Backup Metadata
======================
Backup Date: $(date)
Namespace: ${NAMESPACE}
Cluster: $(kubectl config current-context)
Backup Version: 1.0

Files Included:
- Kubernetes Resources
- Helm Releases
- Application Configuration
EOF

    log_info "Metadata created."
}

compress_backup() {
    log_info "Compressing backup..."

    cd "${BACKUP_DIR}"
    tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
    rm -rf "${BACKUP_NAME}"

    BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log_info "Backup compressed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    # Keep last 7 days of backups
    find "${BACKUP_DIR}" -name "tallow_backup_*.tar.gz" -mtime +7 -delete

    log_info "Old backups cleaned up."
}

upload_to_remote() {
    if [ -n "${BACKUP_REMOTE_PATH}" ]; then
        log_info "Uploading backup to remote storage..."

        # Example: rsync, scp, or cloud storage
        # rsync -avz "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "${BACKUP_REMOTE_PATH}/" || log_warn "Remote upload failed"

        log_warn "Remote upload not configured. Set BACKUP_REMOTE_PATH to enable."
    fi
}

main() {
    log_info "Starting TALLOW backup..."
    echo ""

    create_backup_dir
    backup_kubernetes_resources
    backup_helm_releases
    backup_application_config
    create_backup_metadata
    compress_backup
    cleanup_old_backups
    upload_to_remote

    log_info "Backup completed successfully! ✅"
    echo ""
    echo "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -r|--remote)
            BACKUP_REMOTE_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -n, --namespace NS      Namespace (default: tallow)"
            echo "  -d, --dir DIR           Backup directory (default: ./backups)"
            echo "  -r, --remote PATH       Remote backup path"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

main
