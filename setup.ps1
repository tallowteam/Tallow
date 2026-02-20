#Requires -Version 5.1
<#
.SYNOPSIS
    Tallow Setup Script — installs all dependencies and builds the CLI.

.DESCRIPTION
    One-command setup for the Tallow secure file transfer CLI on Windows.
    Installs Rust toolchain, verifies MSVC build tools, builds the release
    binary, and produces a self-contained dist/ folder.

.PARAMETER InstallDir
    Root directory for portable Rust toolchain. Default: .\toolchain

.PARAMETER SkipRust
    Skip Rust installation if already installed system-wide.

.PARAMETER SkipBuild
    Only install dependencies, don't build.

.PARAMETER Features
    Cargo feature flags. Default: "default" (tui + quic).
    Use "full" for tui + quic + aegis + onion.

.EXAMPLE
    .\setup.ps1
    .\setup.ps1 -Features full
    .\setup.ps1 -SkipRust
#>

[CmdletBinding()]
param(
    [string]$InstallDir = ".\toolchain",
    [switch]$SkipRust,
    [switch]$SkipBuild,
    [string]$Features = "default"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Constants ───────────────────────────────────────────────────────
$RUST_MIN_VERSION  = "1.80.0"
$DIST_DIR          = ".\dist"
$BINARY_NAME       = "tallow.exe"
$RELAY_BINARY      = "tallow-relay.exe"

# ─── Helpers ─────────────────────────────────────────────────────────
function Write-Step  { param([string]$Msg) Write-Host "`n[*] $Msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$Msg) Write-Host "    OK: $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "    WARN: $Msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$Msg) Write-Host "    FAIL: $Msg" -ForegroundColor Red }

function Test-Command {
    param([string]$Name)
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Compare-SemVer {
    # Returns $true if $Have >= $Need
    param([string]$Have, [string]$Need)
    $h = $Have -split '\.' | ForEach-Object { [int]$_ }
    $n = $Need -split '\.' | ForEach-Object { [int]$_ }
    for ($i = 0; $i -lt 3; $i++) {
        if ($h[$i] -gt $n[$i]) { return $true }
        if ($h[$i] -lt $n[$i]) { return $false }
    }
    return $true  # equal
}

# ─── Banner ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║        TALLOW SETUP SCRIPT v1.0          ║" -ForegroundColor Magenta
Write-Host "  ║   Secure Post-Quantum File Transfer      ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = Get-Location }
Push-Location $ProjectRoot

try {

# ═══════════════════════════════════════════════════════════════════
# STEP 1: Check / Install MSVC Build Tools
# ═══════════════════════════════════════════════════════════════════
Write-Step "Checking MSVC Build Tools (C++ compiler + linker)..."

$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$hasMSVC = $false

if (Test-Path $vsWhere) {
    $vsInstalls = & $vsWhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
    if ($vsInstalls) {
        $hasMSVC = $true
        Write-Ok "MSVC Build Tools found at: $($vsInstalls | Select-Object -First 1)"
    }
}

# Also check for standalone Build Tools
if (-not $hasMSVC) {
    $clExe = Get-Command "cl.exe" -ErrorAction SilentlyContinue
    if ($clExe) {
        $hasMSVC = $true
        Write-Ok "cl.exe found in PATH: $($clExe.Source)"
    }
}

if (-not $hasMSVC) {
    Write-Warn "MSVC Build Tools NOT found."
    Write-Host ""
    Write-Host "    Tallow requires the MSVC C++ toolchain to compile." -ForegroundColor Yellow
    Write-Host "    Install Visual Studio Build Tools with the 'C++ build tools' workload:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Option A (recommended): Visual Studio Build Tools (free)" -ForegroundColor White
    Write-Host "      https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor White
    Write-Host "      Select: 'Desktop development with C++'" -ForegroundColor White
    Write-Host ""
    Write-Host "    Option B: winget install Microsoft.VisualStudio.2022.BuildTools" -ForegroundColor White
    Write-Host ""

    $installNow = Read-Host "    Attempt automatic install via winget? (y/N)"
    if ($installNow -eq 'y') {
        Write-Step "Installing Visual Studio Build Tools via winget..."
        try {
            winget install Microsoft.VisualStudio.2022.BuildTools `
                --override "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" `
                --accept-package-agreements --accept-source-agreements
            Write-Ok "Build Tools installation started. You may need to restart this script after it finishes."
        } catch {
            Write-Fail "winget install failed: $_"
            Write-Host "    Please install manually from the URL above." -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "    After installation completes, re-run this script." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Fail "Cannot build without MSVC. Install it and re-run this script."
        exit 1
    }
}

# ═══════════════════════════════════════════════════════════════════
# STEP 2: Check / Install Rust Toolchain
# ═══════════════════════════════════════════════════════════════════
Write-Step "Checking Rust toolchain..."

$InstallDir = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $InstallDir))

# Check if Rust is already available (system-wide or local)
$rustcFound = $false
$cargoPath  = $null

# Check local toolchain first
$localCargo = Join-Path $InstallDir "cargo\bin\cargo.exe"
if (Test-Path $localCargo) {
    $env:RUSTUP_HOME = Join-Path $InstallDir "rustup"
    $env:CARGO_HOME  = Join-Path $InstallDir "cargo"
    $env:PATH = "$env:CARGO_HOME\bin;$env:PATH"
    $rustcFound = $true
    $cargoPath = $localCargo
    Write-Ok "Local Rust toolchain found at: $InstallDir"
}

# Check system Rust
if (-not $rustcFound -and (Test-Command "rustc")) {
    $rustcFound = $true
    $cargoPath = (Get-Command "cargo").Source
    Write-Ok "System Rust found: $cargoPath"
}

# Verify version
if ($rustcFound) {
    $rustVersion = (& rustc --version 2>$null) -replace '^rustc\s+(\S+).*', '$1'
    if (Compare-SemVer $rustVersion $RUST_MIN_VERSION) {
        Write-Ok "Rust $rustVersion >= required $RUST_MIN_VERSION"
    } else {
        Write-Warn "Rust $rustVersion is below minimum $RUST_MIN_VERSION. Updating..."
        & rustup update stable 2>&1 | Out-Null
        Write-Ok "Rust updated."
    }
} elseif ($SkipRust) {
    Write-Fail "Rust not found and -SkipRust specified. Cannot continue."
    exit 1
} else {
    Write-Step "Installing Rust toolchain to: $InstallDir"

    # Create install directory
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

    $env:RUSTUP_HOME = Join-Path $InstallDir "rustup"
    $env:CARGO_HOME  = Join-Path $InstallDir "cargo"

    # Download rustup-init
    $rustupInit = Join-Path $env:TEMP "rustup-init.exe"
    Write-Host "    Downloading rustup-init.exe..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustupInit -UseBasicParsing

    # Install Rust (stable, MSVC target)
    Write-Host "    Running rustup-init (this may take a few minutes)..."
    & $rustupInit -y --default-toolchain stable --default-host x86_64-pc-windows-msvc --no-modify-path 2>&1 | ForEach-Object {
        if ($_ -match "stable.*installed") { Write-Host "    $_" }
    }

    $env:PATH = "$env:CARGO_HOME\bin;$env:PATH"

    if (Test-Path (Join-Path $env:CARGO_HOME "bin\cargo.exe")) {
        $rustVersion = (& rustc --version) -replace '^rustc\s+(\S+).*', '$1'
        Write-Ok "Rust $rustVersion installed to $InstallDir"
    } else {
        Write-Fail "Rust installation failed. Check output above."
        exit 1
    }

    # Cleanup
    Remove-Item $rustupInit -Force -ErrorAction SilentlyContinue
}

# ═══════════════════════════════════════════════════════════════════
# STEP 3: Locate MSVC Environment (LIB / INCLUDE / PATH)
# ═══════════════════════════════════════════════════════════════════
Write-Step "Configuring MSVC environment for build..."

# Find vcvarsall.bat
$vcvarsall = $null
if (Test-Path $vsWhere) {
    $vsPath = (& $vsWhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null) | Select-Object -First 1
    if ($vsPath) {
        $candidate = Join-Path $vsPath "VC\Auxiliary\Build\vcvarsall.bat"
        if (Test-Path $candidate) { $vcvarsall = $candidate }
    }
}

# Fallback: search common paths
if (-not $vcvarsall) {
    $searchPaths = @(
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\*\VC\Auxiliary\Build\vcvarsall.bat",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\*\VC\Auxiliary\Build\vcvarsall.bat",
        "${env:ProgramFiles}\Microsoft Visual Studio\2019\*\VC\Auxiliary\Build\vcvarsall.bat",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\*\VC\Auxiliary\Build\vcvarsall.bat"
    )
    foreach ($p in $searchPaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $vcvarsall = $found.FullName; break }
    }
}

if ($vcvarsall) {
    Write-Ok "vcvarsall.bat found: $vcvarsall"
    Write-Host "    Loading x64 MSVC environment..."

    # Capture environment from vcvarsall
    $cmd = "`"$vcvarsall`" x64 >nul 2>&1 && set"
    $envLines = cmd /c $cmd 2>$null
    foreach ($line in $envLines) {
        if ($line -match '^([^=]+)=(.*)$') {
            $varName  = $Matches[1]
            $varValue = $Matches[2]
            if ($varName -in @('PATH', 'LIB', 'INCLUDE', 'LIBPATH', 'WindowsSdkDir', 'WindowsSdkVersion', 'VCToolsInstallDir')) {
                [System.Environment]::SetEnvironmentVariable($varName, $varValue, "Process")
            }
        }
    }
    Write-Ok "MSVC environment loaded."
} else {
    Write-Warn "vcvarsall.bat not found. Build may fail if MSVC env is not already set."
    Write-Host "    If the build fails, try running this script from a 'Developer PowerShell for VS'." -ForegroundColor Yellow
}

# Ensure cargo's bin is first in PATH (avoids Git Bash link.exe shadow)
if ($env:CARGO_HOME) {
    $env:PATH = "$env:CARGO_HOME\bin;$env:PATH"
} else {
    $userCargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
    if (Test-Path $userCargoBin) {
        $env:PATH = "$userCargoBin;$env:PATH"
    }
}

# ═══════════════════════════════════════════════════════════════════
# STEP 4: Install Cargo Tools (audit, deny)
# ═══════════════════════════════════════════════════════════════════
Write-Step "Checking cargo tools..."

$cargoTools = @(
    @{ Name = "cargo-audit";  Cmd = "cargo-audit" }
    @{ Name = "cargo-deny";   Cmd = "cargo-deny" }
)

foreach ($tool in $cargoTools) {
    if (Test-Command $tool.Cmd) {
        Write-Ok "$($tool.Name) already installed."
    } else {
        Write-Host "    Installing $($tool.Name)..."
        & cargo install $tool.Name --quiet 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "$($tool.Name) installed."
        } else {
            Write-Warn "$($tool.Name) install failed (non-critical, continuing)."
        }
    }
}

# ═══════════════════════════════════════════════════════════════════
# STEP 5: Build Tallow
# ═══════════════════════════════════════════════════════════════════
if ($SkipBuild) {
    Write-Step "Skipping build (-SkipBuild specified)."
} else {
    Write-Step "Building Tallow (release mode, features: $Features)..."
    Write-Host "    This will take a few minutes on first build..."
    Write-Host ""

    $buildArgs = @("build", "--release", "--workspace")
    if ($Features -ne "default") {
        $buildArgs += @("--features", $Features)
    }

    $buildOutput = & cargo @buildArgs 2>&1
    $buildSuccess = $false

    foreach ($line in $buildOutput) {
        $str = "$line"
        if ($str -match "error(\[E\d+\])?:") {
            Write-Host "    $str" -ForegroundColor Red
        } elseif ($str -match "warning:") {
            # skip warnings for clean output
        } elseif ($str -match "Compiling|Downloading|Finished") {
            Write-Host "    $str" -ForegroundColor DarkGray
        }
        if ($str -match "Finished") { $buildSuccess = $true }
    }

    if ($buildSuccess) {
        Write-Ok "Build succeeded."
    } else {
        Write-Fail "Build failed. See errors above."
        Write-Host ""
        Write-Host "    Common fixes:" -ForegroundColor Yellow
        Write-Host "    1. Run from 'Developer PowerShell for VS 2022'" -ForegroundColor Yellow
        Write-Host "    2. Ensure MSVC C++ workload is installed" -ForegroundColor Yellow
        Write-Host "    3. Run: rustup default stable-x86_64-pc-windows-msvc" -ForegroundColor Yellow
        exit 1
    }

    # ═══════════════════════════════════════════════════════════════
    # STEP 6: Create dist/ folder
    # ═══════════════════════════════════════════════════════════════
    Write-Step "Creating distribution folder: $DIST_DIR"

    New-Item -ItemType Directory -Path $DIST_DIR -Force | Out-Null

    $releaseDir = Join-Path $ProjectRoot "target\release"

    # Copy binaries
    $binaries = @($BINARY_NAME, $RELAY_BINARY)
    foreach ($bin in $binaries) {
        $src = Join-Path $releaseDir $bin
        if (Test-Path $src) {
            Copy-Item $src -Destination $DIST_DIR -Force
            $size = [math]::Round((Get-Item (Join-Path $DIST_DIR $bin)).Length / 1MB, 1)
            Write-Ok "$bin -> dist/ (${size} MB)"
        } else {
            Write-Warn "$bin not found in release output."
        }
    }

    # Copy docs
    $docFiles = @("README.md", "LICENSE")
    foreach ($doc in $docFiles) {
        $src = Join-Path $ProjectRoot $doc
        if (Test-Path $src) {
            Copy-Item $src -Destination $DIST_DIR -Force
        }
    }

    # ═══════════════════════════════════════════════════════════════
    # STEP 7: Create launcher script
    # ═══════════════════════════════════════════════════════════════
    $launcherPath = Join-Path $DIST_DIR "tallow.bat"
    @"
@echo off
:: Tallow Launcher
:: Usage: tallow.bat [command] [args...]
:: Example: tallow.bat send myfile.txt --code "secret phrase"
"%~dp0tallow.exe" %*
"@ | Set-Content -Path $launcherPath -Encoding ASCII

    $launcherPs1 = Join-Path $DIST_DIR "tallow-run.ps1"
    @"
# Tallow Launcher (PowerShell)
# Usage: .\tallow-run.ps1 [command] [args...]
# Example: .\tallow-run.ps1 send myfile.txt --code "secret phrase"
#
# Commands:
#   send <file>        Send a file
#   receive            Receive a file
#   chat               Encrypted chat session
#   identity           Manage identity keys
#   contacts           Manage contacts
#   config             View/edit configuration
#   doctor             System diagnostics
#   benchmark          Crypto benchmarks
#   version            Show version info
#   tui                Launch terminal UI

`$ErrorActionPreference = "Continue"
& "`$PSScriptRoot\tallow.exe" @args
"@ | Set-Content -Path $launcherPs1 -Encoding UTF8
}

# ═══════════════════════════════════════════════════════════════════
# STEP 8: Summary
# ═══════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║          SETUP COMPLETE                  ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if (-not $SkipBuild) {
    $tallowExe = Join-Path $DIST_DIR $BINARY_NAME
    if (Test-Path $tallowExe) {
        Write-Host "  Binary location:" -ForegroundColor White
        Write-Host "    $((Resolve-Path $tallowExe).Path)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Quick start:" -ForegroundColor White
        Write-Host "    .\dist\tallow.exe version        # verify install" -ForegroundColor Cyan
        Write-Host "    .\dist\tallow.exe doctor          # run diagnostics" -ForegroundColor Cyan
        Write-Host "    .\dist\tallow.exe send <file>     # send a file" -ForegroundColor Cyan
        Write-Host "    .\dist\tallow.exe receive         # receive a file" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Add to PATH (optional):" -ForegroundColor White
        Write-Host "    `$env:PATH += `";$((Resolve-Path $DIST_DIR).Path)`"" -ForegroundColor Cyan
        Write-Host ""

        # Run version check
        Write-Host "  Version check:" -ForegroundColor White
        & $tallowExe version 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Green }
    }
}

if ($env:RUSTUP_HOME -and $env:RUSTUP_HOME.StartsWith($ProjectRoot)) {
    Write-Host ""
    Write-Host "  Rust toolchain installed locally at:" -ForegroundColor White
    Write-Host "    $InstallDir" -ForegroundColor Cyan
    Write-Host "  To reuse in future sessions:" -ForegroundColor White
    Write-Host "    `$env:RUSTUP_HOME = `"$env:RUSTUP_HOME`"" -ForegroundColor Cyan
    Write-Host "    `$env:CARGO_HOME  = `"$env:CARGO_HOME`"" -ForegroundColor Cyan
    Write-Host "    `$env:PATH = `"`$env:CARGO_HOME\bin;`$env:PATH`"" -ForegroundColor Cyan
}

Write-Host ""

} finally {
    Pop-Location
}
