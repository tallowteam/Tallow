# PowerShell script for Development Environment Deployment
# Usage: .\scripts\deploy-dev.ps1

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Tallow Development Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Load environment variables from .env.local if it exists
if (Test-Path .env.local) {
    Write-Host "Loading environment variables from .env.local..."
    Get-Content .env.local | ForEach-Object {
        if ($_ -match '^([^#].+?)=(.+)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "Warning: .env.local not found. Using default environment variables." -ForegroundColor Yellow
}

# Build and start services
Write-Host ""
Write-Host "Building and starting development services..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 5

# Check health status
Write-Host ""
Write-Host "Checking service health..."

# Check app health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -and $response.Content -match "ok") {
        Write-Host "✓ Tallow app is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Tallow app is not responding properly" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Tallow app is not responding" -ForegroundColor Red
}

# Check signaling server health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -and $response.Content -match "ok") {
        Write-Host "✓ Signaling server is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Signaling server is not responding properly" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Signaling server is not responding" -ForegroundColor Red
}

# Check Redis health
try {
    $output = docker exec tallow-redis-dev redis-cli ping 2>$null
    if ($output -match "PONG") {
        Write-Host "✓ Redis is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Redis is not responding" -ForegroundColor Red
}

# Display running services
Write-Host ""
Write-Host "Running services:"
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:"
Write-Host "  - Web App:         http://localhost:3000" -ForegroundColor White
Write-Host "  - Signaling:       http://localhost:3001" -ForegroundColor White
Write-Host "  - Redis:           localhost:6379" -ForegroundColor White
Write-Host "  - TURN Server:     localhost:3478 (UDP/TCP)" -ForegroundColor White
Write-Host ""
Write-Host "Logs:"
Write-Host "  docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "Stop services:"
Write-Host "  docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
Write-Host ""
