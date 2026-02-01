.PHONY: build test bench clean install dev watch optimize

# Default target
all: build

# Install dependencies
install:
	@echo "Installing Rust WASM toolchain..."
	rustup target add wasm32-unknown-unknown
	cargo install wasm-pack wasm-bindgen-cli
	@echo "✓ Installation complete"

# Development build
dev:
	@echo "Building WASM (dev mode)..."
	wasm-pack build --dev --target web --out-dir pkg
	@echo "✓ Dev build complete"

# Production build
build:
	@echo "Building WASM (release mode)..."
	wasm-pack build --release --target web --out-dir pkg
	@echo "✓ Production build complete"

# Optimized build with all flags
optimize:
	@echo "Building optimized WASM..."
	RUSTFLAGS="-C target-feature=+simd128,+bulk-memory" wasm-pack build --release --target web --out-dir pkg
	@echo "✓ Optimized build complete"

# Build for Node.js
build-node:
	@echo "Building WASM for Node.js..."
	wasm-pack build --release --target nodejs --out-dir pkg-node
	@echo "✓ Node.js build complete"

# Build for bundlers (webpack, rollup)
build-bundler:
	@echo "Building WASM for bundlers..."
	wasm-pack build --release --target bundler --out-dir pkg-bundler
	@echo "✓ Bundler build complete"

# Run tests
test:
	@echo "Running Rust tests..."
	cargo test --lib
	@echo "Running WASM tests..."
	wasm-pack test --headless --firefox
	@echo "✓ Tests complete"

# Run benchmarks
bench:
	@echo "Running benchmarks..."
	cargo bench
	@echo "✓ Benchmarks complete"

# Watch mode for development
watch:
	@echo "Watching for changes..."
	cargo watch -s "make dev"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cargo clean
	rm -rf pkg pkg-node pkg-bundler target
	@echo "✓ Clean complete"

# Check code quality
check:
	@echo "Checking code..."
	cargo check --target wasm32-unknown-unknown
	cargo clippy --target wasm32-unknown-unknown -- -D warnings
	cargo fmt -- --check
	@echo "✓ Check complete"

# Format code
fmt:
	@echo "Formatting code..."
	cargo fmt
	@echo "✓ Format complete"

# Run security audit
audit:
	@echo "Running security audit..."
	cargo audit
	@echo "✓ Audit complete"

# Show WASM size
size:
	@echo "WASM binary size:"
	@ls -lh pkg/*.wasm || echo "No WASM binary found. Run 'make build' first."

# Performance profiling
profile:
	@echo "Building with profiling..."
	cargo build --release --target wasm32-unknown-unknown
	wasm-pack build --profiling --target web --out-dir pkg-profile
	@echo "✓ Profile build complete"

# Full CI pipeline
ci: check test build
	@echo "✓ CI pipeline complete"

# Help
help:
	@echo "Tallow WASM Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  install      - Install Rust WASM toolchain"
	@echo "  dev          - Development build"
	@echo "  build        - Production build"
	@echo "  optimize     - Optimized build with SIMD"
	@echo "  build-node   - Build for Node.js"
	@echo "  build-bundler - Build for webpack/rollup"
	@echo "  test         - Run all tests"
	@echo "  bench        - Run benchmarks"
	@echo "  watch        - Watch mode for development"
	@echo "  clean        - Clean build artifacts"
	@echo "  check        - Run code quality checks"
	@echo "  fmt          - Format code"
	@echo "  audit        - Security audit"
	@echo "  size         - Show WASM binary size"
	@echo "  profile      - Build with profiling"
	@echo "  ci           - Full CI pipeline"
	@echo "  help         - Show this help"
