# Compare Local vs NAS folder sizes WITH PROGRESS
$LocalPath = "c:\Users\aamir\Documents\Apps\File_Sharing\Tallow"
$NASPath = "\\192.168.4.3\home\02_Business\02 - 09 - Tallow\Tallow"

Write-Host "`n========================================" -ForegroundColor White
Write-Host "  Tallow Folder Comparison" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor White

# Local - fast
Write-Host "=== LOCAL ===" -ForegroundColor Cyan
Write-Host "Path: $LocalPath" -ForegroundColor Gray
Write-Host "Scanning..." -ForegroundColor DarkGray
$local = Get-ChildItem $LocalPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git|\.gemini)\\' }
$localCount = $local.Count
$localSize = [math]::Round(($local | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Host "Files: $localCount" -ForegroundColor White
Write-Host "Size:  $localSize MB`n" -ForegroundColor White

# NAS - with progress spinner
Write-Host "=== NAS ===" -ForegroundColor Magenta
Write-Host "Path: $NASPath" -ForegroundColor Gray
if (Test-Path $NASPath) {
    Write-Host "Scanning NAS (this may take a moment)..." -ForegroundColor DarkGray
    
    $job = Start-Job -ScriptBlock {
        param($path)
        Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git|\.gemini)\\' }
    } -ArgumentList $NASPath
    
    $spinner = @('|', '/', '-', '\')
    $i = 0
    while ($job.State -eq 'Running') {
        Write-Host "`r  $($spinner[$i % 4]) Scanning..." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Milliseconds 200
        $i++
    }
    Write-Host "`r                    " -NoNewline
    
    $nasFiles = Receive-Job $job
    Remove-Job $job
    
    $nasCount = ($nasFiles | Measure-Object).Count
    $nasSize = [math]::Round(($nasFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "`rFiles: $nasCount" -ForegroundColor White
    Write-Host "Size:  $nasSize MB`n" -ForegroundColor White
    
    # Comparison
    Write-Host "=== COMPARISON ===" -ForegroundColor Yellow
    $fileDiff = $localCount - $nasCount
    $sizeDiff = [math]::Round($localSize - $nasSize, 2)
    if ($fileDiff -eq 0 -and [math]::Abs($sizeDiff) -lt 0.01) {
        Write-Host "Status: SYNCED (identical)" -ForegroundColor Green
    }
    else {
        Write-Host "File difference: $fileDiff" -ForegroundColor $(if ($fileDiff -eq 0) { "Green" } else { "Yellow" })
        Write-Host "Size difference: $sizeDiff MB" -ForegroundColor $(if ([math]::Abs($sizeDiff) -lt 0.01) { "Green" } else { "Yellow" })
    }
}
else {
    Write-Host "ERROR: Cannot reach NAS" -ForegroundColor Red
}

Write-Host "`nTimestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Read-Host "`nPress Enter to exit"
