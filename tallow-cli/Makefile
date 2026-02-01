# Tallow CLI Makefile

# Variables
BINARY_NAME=tallow
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.Commit=$(COMMIT) -X main.BuildDate=$(BUILD_DATE) -s -w"

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Build directory
BUILD_DIR=build

# Platforms for cross-compilation
PLATFORMS=linux/amd64 linux/arm64 darwin/amd64 darwin/arm64 windows/amd64

.PHONY: all build clean test coverage lint fmt vet deps tidy install uninstall release docker help

all: clean deps test build

## Build targets

build: ## Build for current platform
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/tallow

build-all: ## Build for all platforms
	@echo "Building for all platforms..."
	@mkdir -p $(BUILD_DIR)
	@for platform in $(PLATFORMS); do \
		GOOS=$${platform%/*} GOARCH=$${platform#*/} \
		$(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-$${platform%/*}-$${platform#*/}$$([ "$${platform%/*}" = "windows" ] && echo ".exe" || echo "") ./cmd/tallow; \
		echo "Built: $(BINARY_NAME)-$${platform%/*}-$${platform#*/}"; \
	done

build-linux: ## Build for Linux
	@echo "Building for Linux..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 ./cmd/tallow
	GOOS=linux GOARCH=arm64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 ./cmd/tallow

build-darwin: ## Build for macOS
	@echo "Building for macOS..."
	@mkdir -p $(BUILD_DIR)
	GOOS=darwin GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 ./cmd/tallow
	GOOS=darwin GOARCH=arm64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 ./cmd/tallow

build-windows: ## Build for Windows
	@echo "Building for Windows..."
	@mkdir -p $(BUILD_DIR)
	GOOS=windows GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe ./cmd/tallow

## Development targets

run: ## Run the application
	$(GOCMD) run ./cmd/tallow $(ARGS)

run-relay: ## Run the relay server
	$(GOCMD) run ./cmd/tallow relay

dev: ## Run with hot reload (requires air)
	@which air > /dev/null || (echo "Installing air..." && go install github.com/cosmtrek/air@latest)
	air

## Testing targets

test: ## Run tests
	$(GOTEST) -v -race ./...

test-short: ## Run short tests
	$(GOTEST) -v -short ./...

test-coverage: ## Run tests with coverage
	$(GOTEST) -v -race -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

benchmark: ## Run benchmarks
	$(GOTEST) -bench=. -benchmem ./...

## Code quality targets

lint: ## Run linter
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run

fmt: ## Format code
	$(GOCMD) fmt ./...

vet: ## Run go vet
	$(GOCMD) vet ./...

check: fmt vet lint test ## Run all checks

## Dependency targets

deps: ## Download dependencies
	$(GOMOD) download

tidy: ## Tidy dependencies
	$(GOMOD) tidy

vendor: ## Create vendor directory
	$(GOMOD) vendor

update: ## Update dependencies
	$(GOGET) -u ./...
	$(GOMOD) tidy

## Installation targets

install: build ## Install to GOPATH/bin
	@echo "Installing $(BINARY_NAME)..."
	@cp $(BUILD_DIR)/$(BINARY_NAME) $(GOPATH)/bin/$(BINARY_NAME)

uninstall: ## Remove from GOPATH/bin
	@echo "Uninstalling $(BINARY_NAME)..."
	@rm -f $(GOPATH)/bin/$(BINARY_NAME)

## Docker targets

docker-build: ## Build Docker image
	docker build -t tallow:$(VERSION) .

docker-run: ## Run Docker container
	docker run -p 8080:8080 -p 9090:9090 tallow:$(VERSION) relay

docker-push: ## Push Docker image
	docker tag tallow:$(VERSION) ghcr.io/tallow/tallow:$(VERSION)
	docker push ghcr.io/tallow/tallow:$(VERSION)

## Release targets

release: clean test build-all ## Create release artifacts
	@echo "Creating release artifacts..."
	@mkdir -p $(BUILD_DIR)/release
	@for platform in $(PLATFORMS); do \
		binary=$(BUILD_DIR)/$(BINARY_NAME)-$${platform%/*}-$${platform#*/}$$([ "$${platform%/*}" = "windows" ] && echo ".exe" || echo ""); \
		archive=$(BUILD_DIR)/release/$(BINARY_NAME)-$(VERSION)-$${platform%/*}-$${platform#*/}; \
		if [ "$${platform%/*}" = "windows" ]; then \
			zip -j $${archive}.zip $${binary}; \
		else \
			tar -czf $${archive}.tar.gz -C $(BUILD_DIR) $$(basename $${binary}); \
		fi; \
		echo "Created: $${archive}"; \
	done
	@echo "Release artifacts created in $(BUILD_DIR)/release/"

checksums: ## Generate checksums
	@cd $(BUILD_DIR)/release && sha256sum * > SHA256SUMS

## Cleanup targets

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	$(GOCLEAN)

## Help target

help: ## Show this help
	@echo "Tallow CLI - Makefile targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make build         # Build for current platform"
	@echo "  make build-all     # Build for all platforms"
	@echo "  make test          # Run tests"
	@echo "  make docker-build  # Build Docker image"
	@echo "  make release       # Create release artifacts"
