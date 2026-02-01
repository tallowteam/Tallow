# Tallow Sync Script - Syncs NAS folder to local WITH PROGRESS BAR
# Usage: Right-click and "Run with PowerShell" or run from terminal

$LocalPath = "c:\Users\aamir\Documents\Apps\File_Sharing\Tallow"
$NASPath = "\\192.168.4.3\home\02_Business\02 - 09 - Tallow\Tallow"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Tallow Sync: NAS -> Local" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta
Write-Host "Source: $NASPath" -ForegroundColor Yellow
Write-Host "Dest:   $LocalPath`n" -ForegroundColor Yellow

# Check if NAS is reachable
Write-Host "Checking NAS connection..." -ForegroundColor Gray
if (-not (Test-Path $NASPath)) {
    Write-Host "ERROR: Cannot reach NAS path. Check network connection." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "NAS connected!`n" -ForegroundColor Green

Write-Host "Starting sync with robocopy..." -ForegroundColor Green
Write-Host "Progress will show below:`n" -ForegroundColor Gray

# Robocopy: NAS -> Local with ETA
robocopy $NASPath $LocalPath /MIR /XD node_modules .next .git .gemini /XF *.log tsconfig.tsbuildinfo /MT:8 /R:3 /W:5 /ETA /NFL /NDL

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -lt 8) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SYNC COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
else {
    Write-Host "Sync completed with errors (code: $exitCode)" -ForegroundColor Red
}

Write-Host "`nTimestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Read-Host "`nPress Enter to exit"
