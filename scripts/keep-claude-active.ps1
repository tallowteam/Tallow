# Keep Claude Code Active - Auto Progress Script
# This script simulates activity to prevent Claude Code from timing out

param(
    [int]$IntervalSeconds = 30,
    [string]$Key = "k",
    [switch]$AutoAccept = $true
)

Write-Host "=== Claude Code Keep-Alive Script ===" -ForegroundColor Cyan
Write-Host "Interval: $IntervalSeconds seconds" -ForegroundColor Green
Write-Host "Key to press: $Key" -ForegroundColor Green
Write-Host "Auto-accept: $AutoAccept" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "Starting in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Add-Type -AssemblyName System.Windows.Forms

$iteration = 0

try {
    while ($true) {
        $iteration++
        $timestamp = Get-Date -Format "HH:mm:ss"

        Write-Host "[$timestamp] Iteration #$iteration" -ForegroundColor Cyan

        # Simulate key press (type and immediately delete)
        if ($Key) {
            Write-Host "  → Pressing '$Key' key..." -ForegroundColor Gray
            [System.Windows.Forms.SendKeys]::SendWait($Key)
            Start-Sleep -Milliseconds 100
            [System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}")
            Write-Host "  ✓ Key pressed and erased" -ForegroundColor Green
        }

        # Auto-accept progress (simulate Enter key)
        if ($AutoAccept) {
            Start-Sleep -Milliseconds 500
            Write-Host "  → Auto-accepting progress..." -ForegroundColor Gray
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            Write-Host "  ✓ Progress accepted" -ForegroundColor Green
        }

        # Wait for next iteration
        Write-Host "  ⏳ Waiting $IntervalSeconds seconds..." -ForegroundColor DarkGray
        Write-Host ""
        Start-Sleep -Seconds $IntervalSeconds
    }
}
catch {
    Write-Host ""
    Write-Host "Script stopped: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Write-Host ""
    Write-Host "=== Script Terminated ===" -ForegroundColor Yellow
}
