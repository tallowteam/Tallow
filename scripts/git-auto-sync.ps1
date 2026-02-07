$repoPath = "C:\Users\aamir\Documents\Apps\Tallow"
$logFile = Join-Path $repoPath "scripts\auto-sync.log"

Set-Location $repoPath

$status = git status --porcelain 2>&1
if (-not $status) {
    exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "auto-sync: $timestamp"

git add -A -- . ":!nul" 2>&1
git commit --no-verify -m $message 2>&1
git push --no-verify 2>&1

$result = if ($LASTEXITCODE -eq 0) { "OK" } else { "FAILED" }
Add-Content -Path $logFile -Value "[$timestamp] $result - $message"
