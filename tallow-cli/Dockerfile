# Tallow CLI Dockerfile
# Multi-stage build for minimal image size

# Stage 1: Build
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /build

# Copy go mod files first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build arguments
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_DATE=unknown

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X main.Version=${VERSION} -X main.Commit=${COMMIT} -X main.BuildDate=${BUILD_DATE} -s -w" \
    -o tallow ./cmd/tallow

# Stage 2: Runtime
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN adduser -D -g '' tallow

# Copy binary from builder
COPY --from=builder /build/tallow /usr/local/bin/tallow

# Copy config
COPY --from=builder /build/configs/relay.yaml /etc/tallow/relay.yaml

# Use non-root user
USER tallow

# Expose ports
# 8080: WebSocket relay
# 9090: Prometheus metrics
EXPOSE 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1

# Default command: run relay server
ENTRYPOINT ["tallow"]
CMD ["relay", "--port", "8080", "--metrics-port", "9090"]
