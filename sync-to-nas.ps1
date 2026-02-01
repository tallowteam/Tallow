# Tallow Sync Script - Syncs local folder to NAS WITH PROGRESS BAR
# Usage: Right-click and "Run with PowerShell" or run from terminal

$LocalPath = "c:\Users\aamir\Documents\Apps\tallow"
$NASPath = "\\192.168.4.3\docker\tallow"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Tallow Sync: Local -> NAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Source: $LocalPath" -ForegroundColor Yellow
Write-Host "Dest:   $NASPath`n" -ForegroundColor Yellow

# Check if NAS is reachable
Write-Host "Checking NAS connection..." -ForegroundColor Gray
if (-not (Test-Path $NASPath)) {
    Write-Host "ERROR: Cannot reach NAS path. Check network connection." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "NAS connected!`n" -ForegroundColor Green

# Get file count for progress estimation
Write-Host "Counting files..." -ForegroundColor Gray
$files = Get-ChildItem $LocalPath -Recurse -File | Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git|\.gemini)\\' }
$totalFiles = $files.Count
$totalSize = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Host "Found $totalFiles files ($totalSize MB)`n" -ForegroundColor Cyan

Write-Host "Starting sync with robocopy..." -ForegroundColor Green
Write-Host "Progress will show below:`n" -ForegroundColor Gray

# Robocopy with verbose file list for progress visibility
# /MIR - Mirror | /XD - Exclude dirs | /MT:8 - 8 threads | /ETA - Show ETA
robocopy $LocalPath $NASPath /MIR /XD node_modules .next .git .gemini /XF *.log tsconfig.tsbuildinfo /MT:8 /R:3 /W:5 /ETA /NFL /NDL

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
