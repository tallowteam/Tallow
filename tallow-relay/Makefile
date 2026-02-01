# Tallow Relay Server Makefile

# Build variables
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Go build flags
LDFLAGS := -ldflags "-s -w \
	-X main.version=$(VERSION) \
	-X main.buildTime=$(BUILD_TIME) \
	-X main.gitCommit=$(GIT_COMMIT)"

# Binary names
BINARY_NAME := tallow-relay
BINARY_PATH := bin/$(BINARY_NAME)

# Docker settings
DOCKER_IMAGE := tallow-relay
DOCKER_TAG := $(VERSION)

# Go settings
GOFLAGS := -trimpath
CGO_ENABLED := 0

.PHONY: all build clean test lint docker docker-push run dev help

## help: Print this help message
help:
	@echo "Tallow Relay Server"
	@echo ""
	@echo "Usage:"
	@echo "  make [target]"
	@echo ""
	@echo "Targets:"
	@sed -n 's/^##//p' $(MAKEFILE_LIST) | column -t -s ':' | sed 's/^/ /'

## all: Build everything
all: clean lint test build

## build: Build the binary
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p bin
	CGO_ENABLED=$(CGO_ENABLED) go build $(GOFLAGS) $(LDFLAGS) -o $(BINARY_PATH) .
	@echo "Built: $(BINARY_PATH)"

## build-linux: Build for Linux (amd64)
build-linux:
	@echo "Building for Linux amd64..."
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build $(GOFLAGS) $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-amd64 .

## build-linux-arm64: Build for Linux (arm64)
build-linux-arm64:
	@echo "Building for Linux arm64..."
	@mkdir -p bin
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build $(GOFLAGS) $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-arm64 .

## build-darwin: Build for macOS (arm64)
build-darwin:
	@echo "Building for macOS arm64..."
	@mkdir -p bin
	GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build $(GOFLAGS) $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-arm64 .

## build-windows: Build for Windows (amd64)
build-windows:
	@echo "Building for Windows amd64..."
	@mkdir -p bin
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build $(GOFLAGS) $(LDFLAGS) -o bin/$(BINARY_NAME)-windows-amd64.exe .

## build-all: Build for all platforms
build-all: build-linux build-linux-arm64 build-darwin build-windows
	@echo "Built binaries for all platforms"

## clean: Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@go clean -cache -testcache

## test: Run tests
test:
	@echo "Running tests..."
	go test -v -race -cover ./...

## test-coverage: Run tests with coverage report
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

## lint: Run linter
lint:
	@echo "Running linter..."
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run ./...

## fmt: Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...
	goimports -w .

## vet: Run go vet
vet:
	@echo "Running go vet..."
	go vet ./...

## mod: Tidy and verify modules
mod:
	@echo "Tidying modules..."
	go mod tidy
	go mod verify

## run: Run the server
run: build
	@echo "Starting server..."
	./$(BINARY_PATH) -config configs/relay.yaml

## dev: Run in development mode with hot reload
dev:
	@which air > /dev/null || (echo "Installing air..." && go install github.com/cosmtrek/air@latest)
	air

## docker: Build Docker image
docker:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(DOCKER_IMAGE):latest

## docker-push: Push Docker image
docker-push: docker
	@echo "Pushing Docker image..."
	docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	docker push $(DOCKER_IMAGE):latest

## docker-run: Run Docker container
docker-run:
	@echo "Running Docker container..."
	docker run -p 8080:8080 -p 9090:9090 $(DOCKER_IMAGE):latest

## docker-compose-up: Start with docker-compose
docker-compose-up:
	docker-compose up -d

## docker-compose-down: Stop docker-compose
docker-compose-down:
	docker-compose down

## install: Install the binary
install: build
	@echo "Installing..."
	cp $(BINARY_PATH) $(GOPATH)/bin/

## version: Print version info
version:
	@echo "Version: $(VERSION)"
	@echo "Build Time: $(BUILD_TIME)"
	@echo "Git Commit: $(GIT_COMMIT)"

# ============================================================================
# Onion Relay Targets
# ============================================================================

## build-onion: Build the onion relay binary
build-onion:
	@echo "Building onion relay..."
	@mkdir -p bin
	CGO_ENABLED=$(CGO_ENABLED) go build $(GOFLAGS) $(LDFLAGS) -o bin/tallow-relay-onion ./cmd/relay
	@echo "Built: bin/tallow-relay-onion"

## build-onion-linux: Build onion relay for Linux (amd64)
build-onion-linux:
	@echo "Building onion relay for Linux amd64..."
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build $(GOFLAGS) $(LDFLAGS) -o bin/tallow-relay-onion-linux-amd64 ./cmd/relay

## run-entry: Run as entry relay
run-entry: build-onion
	@echo "Starting entry relay..."
	./bin/tallow-relay-onion -mode entry -port 8081

## run-middle: Run as middle relay
run-middle: build-onion
	@echo "Starting middle relay..."
	./bin/tallow-relay-onion -mode middle -port 8082

## run-exit: Run as exit relay
run-exit: build-onion
	@echo "Starting exit relay..."
	./bin/tallow-relay-onion -mode exit -port 8083

## run-directory: Run as directory server
run-directory: build-onion
	@echo "Starting directory server..."
	./bin/tallow-relay-onion -mode directory -port 8080

## docker-onion: Build Docker image for onion relay
docker-onion:
	@echo "Building onion relay Docker image..."
	docker build -t $(DOCKER_IMAGE)-onion:$(DOCKER_TAG) -f Dockerfile.onion .
	docker tag $(DOCKER_IMAGE)-onion:$(DOCKER_TAG) $(DOCKER_IMAGE)-onion:latest

## docker-run-entry: Run entry relay in Docker
docker-run-entry:
	docker run -p 8081:8080 -p 9091:9090 \
		-e RELAY_MODE=entry \
		-e RELAY_PORT=8080 \
		$(DOCKER_IMAGE)-onion:latest

## docker-run-middle: Run middle relay in Docker
docker-run-middle:
	docker run -p 8082:8080 -p 9092:9090 \
		-e RELAY_MODE=middle \
		-e RELAY_PORT=8080 \
		$(DOCKER_IMAGE)-onion:latest

## docker-run-exit: Run exit relay in Docker
docker-run-exit:
	docker run -p 8083:8080 -p 9093:9090 \
		-e RELAY_MODE=exit \
		-e RELAY_PORT=8080 \
		$(DOCKER_IMAGE)-onion:latest

## docker-run-directory: Run directory server in Docker
docker-run-directory:
	docker run -p 8080:8080 -p 9090:9090 \
		-e RELAY_MODE=directory \
		-e RELAY_PORT=8080 \
		$(DOCKER_IMAGE)-onion:latest

## test-onion-network: Start a local test onion network
test-onion-network: build-onion
	@echo "Starting test onion network..."
	@echo "Starting directory server on port 8080..."
	./bin/tallow-relay-onion -mode directory -port 8080 &
	@sleep 2
	@echo "Starting entry relay on port 8081..."
	./bin/tallow-relay-onion -mode entry -port 8081 -directory http://localhost:8080 &
	@sleep 1
	@echo "Starting middle relay on port 8082..."
	./bin/tallow-relay-onion -mode middle -port 8082 -directory http://localhost:8080 &
	@sleep 1
	@echo "Starting exit relay on port 8083..."
	./bin/tallow-relay-onion -mode exit -port 8083 -directory http://localhost:8080 &
	@echo "Test network started. Use 'make stop-test-network' to stop."

## stop-test-network: Stop the test onion network
stop-test-network:
	@echo "Stopping test network..."
	@pkill -f "tallow-relay-onion" || true
