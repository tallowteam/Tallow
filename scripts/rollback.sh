#!/bin/bash
# TALLOW Kubernetes Rollback Script
# Quick rollback to previous deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-tallow}"
HELM_RELEASE="${HELM_RELEASE:-tallow}"
REVISION="${REVISION:-0}"  # 0 = previous revision

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_history() {
    log_info "Deployment history:"
    if command -v helm &> /dev/null && helm list -n ${NAMESPACE} | grep -q ${HELM_RELEASE}; then
        helm history ${HELM_RELEASE} -n ${NAMESPACE}
    else
        log_info "Web deployment history:"
        kubectl rollout history deployment/tallow-web -n ${NAMESPACE}
        log_info "Signaling deployment history:"
        kubectl rollout history deployment/tallow-signaling -n ${NAMESPACE}
    fi
}

rollback_helm() {
    log_info "Rolling back Helm release..."

    if [ "${REVISION}" = "0" ]; then
        helm rollback ${HELM_RELEASE} -n ${NAMESPACE} --wait --timeout 10m
    else
        helm rollback ${HELM_RELEASE} ${REVISION} -n ${NAMESPACE} --wait --timeout 10m
    fi

    log_info "Helm rollback completed."
}

rollback_kubectl() {
    log_info "Rolling back deployments..."

    # Rollback web
    if [ "${REVISION}" = "0" ]; then
        kubectl rollout undo deployment/tallow-web -n ${NAMESPACE}
    else
        kubectl rollout undo deployment/tallow-web -n ${NAMESPACE} --to-revision=${REVISION}
    fi

    # Rollback signaling
    if [ "${REVISION}" = "0" ]; then
        kubectl rollout undo deployment/tallow-signaling -n ${NAMESPACE}
    else
        kubectl rollout undo deployment/tallow-signaling -n ${NAMESPACE} --to-revision=${REVISION}
    fi

    # Wait for rollout
    kubectl rollout status deployment/tallow-web -n ${NAMESPACE} --timeout=5m
    kubectl rollout status deployment/tallow-signaling -n ${NAMESPACE} --timeout=5m

    log_info "kubectl rollback completed."
}

verify_rollback() {
    log_info "Verifying rollback..."

    # Get pod status
    kubectl get pods -n ${NAMESPACE}

    # Health check
    WEB_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=web -o jsonpath='{.items[0].metadata.name}')

    if kubectl exec -n ${NAMESPACE} ${WEB_POD} -- wget -q -O- http://localhost:3000/api/health &> /dev/null; then
        log_info "Health check PASSED"
    else
        log_error "Health check FAILED"
        exit 1
    fi
}

main() {
    log_warn "⚠️  ROLLBACK OPERATION"
    echo ""

    # Show confirmation
    if [ -z "${SKIP_CONFIRM}" ]; then
        read -p "Are you sure you want to rollback? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Rollback cancelled."
            exit 0
        fi
    fi

    show_history
    echo ""

    # Perform rollback
    if command -v helm &> /dev/null && helm list -n ${NAMESPACE} | grep -q ${HELM_RELEASE}; then
        rollback_helm
    else
        rollback_kubectl
    fi

    verify_rollback

    log_info "Rollback completed successfully! ✅"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--revision)
            REVISION="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --yes)
            SKIP_CONFIRM=true
            shift
            ;;
        --history)
            show_history
            exit 0
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -r, --revision REV      Revision number (default: previous)"
            echo "  -n, --namespace NS      Namespace (default: tallow)"
            echo "  --yes                   Skip confirmation"
            echo "  --history               Show deployment history"
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
