# TALLOW - Complete Build Script (Windows PowerShell)
# Builds all components: Next.js, Go CLI, Go Relay, Rust WASM, mDNS Daemon, Flutter

param(
    [switch]$SkipPrerequisites,
    [switch]$OnlyWeb,
    [switch]$OnlyGo,
    [switch]$OnlyRust,
    [switch]$OnlyFlutter
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ROOT) { $ROOT = (Get-Location).Path }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TALLOW - Complete Build System" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Check-Prerequisites {
    Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

    $missing = @()

    # Node.js (required)
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $missing += "Node.js (https://nodejs.org/)"
    } else {
        Write-Host "  Node.js: $(node --version)" -ForegroundColor Green
    }

    # Go (optional for CLI/Relay)
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        Write-Host "  Go: NOT INSTALLED (optional - needed for CLI/Relay)" -ForegroundColor Yellow
        Write-Host "       Install: winget install GoLang.Go" -ForegroundColor Gray
    } else {
        Write-Host "  Go: $(go version)" -ForegroundColor Green
    }

    # Rust (optional for WASM)
    if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
        Write-Host "  Rust: NOT INSTALLED (optional - needed for WASM)" -ForegroundColor Yellow
        Write-Host "       Install: winget install Rustlang.Rustup" -ForegroundColor Gray
    } else {
        Write-Host "  Rust: $(rustc --version)" -ForegroundColor Green
    }

    # Flutter (optional for mobile)
    if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
        Write-Host "  Flutter: NOT INSTALLED (optional - needed for mobile app)" -ForegroundColor Yellow
        Write-Host "       Install: https://docs.flutter.dev/get-started/install" -ForegroundColor Gray
    } else {
        Write-Host "  Flutter: $(flutter --version | Select-Object -First 1)" -ForegroundColor Green
    }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "Missing required tools:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        exit 1
    }

    Write-Host ""
}

# Build Next.js web app
function Build-Web {
    Write-Host "[2/5] Building Next.js web app..." -ForegroundColor Yellow

    Push-Location $ROOT
    try {
        npm ci --prefer-offline 2>$null
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Next.js build failed" }
        Write-Host "  Web app built successfully!" -ForegroundColor Green
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Build mDNS Daemon
function Build-Daemon {
    Write-Host "[3/5] Building mDNS daemon..." -ForegroundColor Yellow

    $daemonPath = Join-Path $ROOT "daemon"
    if (-not (Test-Path $daemonPath)) {
        Write-Host "  Daemon directory not found, skipping..." -ForegroundColor Yellow
        return
    }

    Push-Location $daemonPath
    try {
        npm ci --prefer-offline 2>$null
        npm run build 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  mDNS daemon built successfully!" -ForegroundColor Green
        } else {
            Write-Host "  mDNS daemon build skipped (no build script)" -ForegroundColor Yellow
        }
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Build Go CLI
function Build-GoCLI {
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        Write-Host "[4/5] Skipping Go CLI (Go not installed)" -ForegroundColor Yellow
        return
    }

    Write-Host "[4/5] Building Go CLI..." -ForegroundColor Yellow

    $cliPath = Join-Path $ROOT "tallow-cli"
    if (-not (Test-Path $cliPath)) {
        Write-Host "  CLI directory not found, skipping..." -ForegroundColor Yellow
        return
    }

    Push-Location $cliPath
    try {
        # Create build directory
        New-Item -ItemType Directory -Force -Path "build" | Out-Null

        # Build for current platform
        $env:CGO_ENABLED = "0"
        go build -ldflags="-s -w" -o "build/tallow.exe" ./cmd/tallow

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Go CLI built: build/tallow.exe" -ForegroundColor Green
        } else {
            throw "Go CLI build failed"
        }
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Build Go Relay
function Build-GoRelay {
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        Write-Host "  Skipping Go Relay (Go not installed)" -ForegroundColor Yellow
        return
    }

    $relayPath = Join-Path $ROOT "tallow-relay"
    if (-not (Test-Path $relayPath)) {
        Write-Host "  Relay directory not found, skipping..." -ForegroundColor Yellow
        return
    }

    Write-Host "  Building Go Relay..." -ForegroundColor Yellow

    Push-Location $relayPath
    try {
        New-Item -ItemType Directory -Force -Path "build" | Out-Null

        $env:CGO_ENABLED = "0"
        go build -ldflags="-s -w" -o "build/tallow-relay.exe" .

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Go Relay built: build/tallow-relay.exe" -ForegroundColor Green
        } else {
            throw "Go Relay build failed"
        }
    } finally {
        Pop-Location
    }
}

# Build Rust WASM
function Build-RustWASM {
    if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
        Write-Host "[5/5] Skipping Rust WASM (Rust not installed)" -ForegroundColor Yellow
        return
    }

    Write-Host "[5/5] Building Rust WASM..." -ForegroundColor Yellow

    $wasmPath = Join-Path $ROOT "tallow-wasm"
    if (-not (Test-Path $wasmPath)) {
        Write-Host "  WASM directory not found, skipping..." -ForegroundColor Yellow
        return
    }

    Push-Location $wasmPath
    try {
        # Install wasm-pack if needed
        if (-not (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
            Write-Host "  Installing wasm-pack..." -ForegroundColor Gray
            cargo install wasm-pack
        }

        # Build WASM
        wasm-pack build --target web --release

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Rust WASM built: pkg/" -ForegroundColor Green
        } else {
            throw "Rust WASM build failed"
        }
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Build Flutter app
function Build-Flutter {
    if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
        Write-Host "  Skipping Flutter app (Flutter not installed)" -ForegroundColor Yellow
        return
    }

    Write-Host "  Building Flutter app..." -ForegroundColor Yellow

    $flutterPath = Join-Path $ROOT "tallow-mobile"
    if (-not (Test-Path $flutterPath)) {
        Write-Host "  Flutter directory not found, skipping..." -ForegroundColor Yellow
        return
    }

    Push-Location $flutterPath
    try {
        flutter pub get
        flutter build windows --release

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Flutter app built: build/windows/" -ForegroundColor Green
        } else {
            throw "Flutter build failed"
        }
    } finally {
        Pop-Location
    }
}

# Main execution
if (-not $SkipPrerequisites) {
    Check-Prerequisites
}

if ($OnlyWeb) {
    Build-Web
} elseif ($OnlyGo) {
    Build-GoCLI
    Build-GoRelay
} elseif ($OnlyRust) {
    Build-RustWASM
} elseif ($OnlyFlutter) {
    Build-Flutter
} else {
    Build-Web
    Build-Daemon
    Build-GoCLI
    Build-GoRelay
    Build-RustWASM
    Build-Flutter
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Built artifacts:" -ForegroundColor White
Write-Host "  - .next/            (Next.js web app)" -ForegroundColor Gray
if (Test-Path (Join-Path $ROOT "tallow-cli/build/tallow.exe")) {
    Write-Host "  - tallow-cli/build/ (Go CLI)" -ForegroundColor Gray
}
if (Test-Path (Join-Path $ROOT "tallow-relay/build/tallow-relay.exe")) {
    Write-Host "  - tallow-relay/build/ (Go Relay)" -ForegroundColor Gray
}
if (Test-Path (Join-Path $ROOT "tallow-wasm/pkg")) {
    Write-Host "  - tallow-wasm/pkg/  (Rust WASM)" -ForegroundColor Gray
}
Write-Host ""
