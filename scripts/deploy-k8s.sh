#!/bin/bash
# TALLOW Kubernetes Deployment Script
# Automates deployment to Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-tallow}"
HELM_RELEASE="${HELM_RELEASE:-tallow}"
ENVIRONMENT="${ENVIRONMENT:-production}"
VALUES_FILE="helm/tallow/values.${ENVIRONMENT}.yaml"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm not found. Please install Helm."
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster."
        exit 1
    fi

    log_info "All prerequisites met."
}

create_namespace() {
    log_info "Creating namespace ${NAMESPACE}..."
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace ${NAMESPACE} environment=${ENVIRONMENT} --overwrite
}

deploy_secrets() {
    log_info "Deploying secrets..."

    if [ -f "k8s/secrets.yaml" ]; then
        kubectl apply -f k8s/secrets.yaml -n ${NAMESPACE}
    else
        log_warn "No secrets.yaml found. Using secrets from values file."
    fi
}

deploy_with_helm() {
    log_info "Deploying TALLOW with Helm..."

    # Update dependencies
    helm dependency update helm/tallow

    # Install or upgrade
    if helm list -n ${NAMESPACE} | grep -q ${HELM_RELEASE}; then
        log_info "Upgrading existing release..."
        helm upgrade ${HELM_RELEASE} helm/tallow \
            --namespace ${NAMESPACE} \
            --values ${VALUES_FILE} \
            --wait \
            --timeout 10m \
            --atomic \
            --cleanup-on-fail
    else
        log_info "Installing new release..."
        helm install ${HELM_RELEASE} helm/tallow \
            --namespace ${NAMESPACE} \
            --values ${VALUES_FILE} \
            --wait \
            --timeout 10m \
            --atomic \
            --create-namespace
    fi
}

deploy_with_kubectl() {
    log_info "Deploying TALLOW with kubectl..."

    # Apply in order
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/serviceaccount.yaml
    kubectl apply -f k8s/configmap.yaml
    deploy_secrets
    kubectl apply -f k8s/web/
    kubectl apply -f k8s/signaling/
    kubectl apply -f k8s/hpa.yaml
    kubectl apply -f k8s/pdb.yaml
    kubectl apply -f k8s/network-policy.yaml
}

wait_for_rollout() {
    log_info "Waiting for rollout to complete..."

    kubectl rollout status deployment/tallow-web -n ${NAMESPACE} --timeout=5m
    kubectl rollout status deployment/tallow-signaling -n ${NAMESPACE} --timeout=5m

    log_info "Rollout completed successfully."
}

run_health_check() {
    log_info "Running health checks..."

    # Get service endpoints
    WEB_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=web -o jsonpath='{.items[0].metadata.name}')
    SIG_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=signaling -o jsonpath='{.items[0].metadata.name}')

    # Check web health
    if kubectl exec -n ${NAMESPACE} ${WEB_POD} -- wget -q -O- http://localhost:3000/api/health &> /dev/null; then
        log_info "Web service health check: PASSED"
    else
        log_error "Web service health check: FAILED"
        exit 1
    fi

    # Check signaling health
    if kubectl exec -n ${NAMESPACE} ${SIG_POD} -- wget -q -O- http://localhost:3001/health &> /dev/null; then
        log_info "Signaling service health check: PASSED"
    else
        log_error "Signaling service health check: FAILED"
        exit 1
    fi

    log_info "All health checks passed!"
}

show_deployment_info() {
    log_info "Deployment Information:"
    echo ""
    echo "Namespace: ${NAMESPACE}"
    echo "Environment: ${ENVIRONMENT}"
    echo ""

    log_info "Pods:"
    kubectl get pods -n ${NAMESPACE}
    echo ""

    log_info "Services:"
    kubectl get services -n ${NAMESPACE}
    echo ""

    log_info "Ingress:"
    kubectl get ingress -n ${NAMESPACE}
    echo ""

    # Get ingress URL
    INGRESS_HOST=$(kubectl get ingress -n ${NAMESPACE} -o jsonpath='{.items[0].spec.rules[0].host}')
    echo -e "${GREEN}Application URL: https://${INGRESS_HOST}${NC}"
}

# Main deployment flow
main() {
    log_info "Starting TALLOW deployment to Kubernetes..."
    echo ""

    check_prerequisites
    create_namespace

    # Deploy using Helm or kubectl
    if [ "${USE_HELM:-true}" = "true" ]; then
        if [ ! -f "${VALUES_FILE}" ]; then
            log_warn "Values file ${VALUES_FILE} not found. Using default values.yaml"
            VALUES_FILE="helm/tallow/values.yaml"
        fi
        deploy_with_helm
    else
        deploy_with_kubectl
    fi

    wait_for_rollout
    run_health_check
    show_deployment_info

    log_info "Deployment completed successfully! 🚀"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            VALUES_FILE="helm/tallow/values.${ENVIRONMENT}.yaml"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --use-kubectl)
            USE_HELM=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Environment (default: production)"
            echo "  -n, --namespace NS       Namespace (default: tallow)"
            echo "  --use-kubectl           Use kubectl instead of Helm"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main
