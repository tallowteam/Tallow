param([string]$Task = "all")

$ErrorActionPreference = "Continue"
Set-Location E:\Tallow
$env:PATH = $env:USERPROFILE + "\.cargo\bin;" + $env:PATH

switch ($Task) {
    "fmt"     { cargo fmt --check 2>&1 }
    "clippy"  { cargo clippy --workspace -- -D warnings 2>&1 }
    "build"   { cargo build --workspace --release 2>&1 }
    "clean"   { cargo clean --profile dev 2>&1 }
    "test"    { cargo test --workspace -- --nocapture 2>&1 }
    "test-crypto" { cargo test -p tallow-crypto -- --nocapture 2>&1 }
    "test-net"    { cargo test -p tallow-net -- --nocapture 2>&1 }
    "test-proto"  { cargo test -p tallow-protocol -- --nocapture 2>&1 }
    "test-store"  { cargo test -p tallow-store -- --nocapture 2>&1 }
    "test-relay"  { cargo test -p tallow-relay -- --nocapture 2>&1 }
    "test-tui"    { cargo test -p tallow-tui -- --nocapture 2>&1 }
    "test-main"   { cargo test -p tallow -- --nocapture 2>&1 }
    "version" {
        $exe = ".\target\release\tallow.exe"
        if (Test-Path $exe) { & $exe version 2>&1 }
        else { Write-Host "Release binary not found" }
    }
    "all"     {
        Write-Host "=== FMT ===" -ForegroundColor Cyan
        cargo fmt --check 2>&1
        Write-Host "`n=== CLIPPY ===" -ForegroundColor Cyan
        cargo clippy --workspace -- -D warnings 2>&1
        Write-Host "`n=== BUILD (release) ===" -ForegroundColor Cyan
        cargo build --workspace --release 2>&1
        Write-Host "`n=== TESTS ===" -ForegroundColor Cyan
        cargo test --workspace -- --nocapture 2>&1
    }
}
