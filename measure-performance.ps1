# Performance Measurement Script
# Measures bundle size and build performance before/after optimizations

Write-Host "=== Tallow Performance Measurement ===" -ForegroundColor Cyan
Write-Host ""

# Clean previous build
Write-Host "Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

# Build the application
Write-Host "`nBuilding application..." -ForegroundColor Yellow
$buildStart = Get-Date
npm run build 2>&1 | Tee-Object -FilePath "build.log"
$buildEnd = Get-Date
$buildTime = ($buildEnd - $buildStart).TotalSeconds

Write-Host "`nBuild completed in $([math]::Round($buildTime, 2)) seconds" -ForegroundColor Green

# Analyze bundle sizes
Write-Host "`nAnalyzing bundle sizes..." -ForegroundColor Yellow

$nextDir = ".next"
if (Test-Path $nextDir) {
    # Get static chunks
    $staticDir = "$nextDir/static/chunks"
    if (Test-Path $staticDir) {
        $chunks = Get-ChildItem -Path $staticDir -Filter "*.js" -Recurse
        $totalSize = ($chunks | Measure-Object -Property Length -Sum).Sum

        Write-Host "`n--- JavaScript Bundle Analysis ---" -ForegroundColor Cyan
        Write-Host "Total Chunks: $($chunks.Count)"
        Write-Host "Total Size: $([math]::Round($totalSize/1KB, 2)) KB"

        # Show largest chunks
        Write-Host "`nLargest chunks:" -ForegroundColor Yellow
        $chunks | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object {
            Write-Host "  $($_.Name): $([math]::Round($_.Length/1KB, 2)) KB"
        }
    }

    # Get font sizes
    $fontsDir = "public/fonts"
    if (Test-Path $fontsDir) {
        $fonts = Get-ChildItem -Path $fontsDir -Filter "*.woff2"
        $totalFontSize = ($fonts | Measure-Object -Property Length -Sum).Sum

        Write-Host "`n--- Font Analysis ---" -ForegroundColor Cyan
        Write-Host "Total Fonts: $($fonts.Count)"
        Write-Host "Total Size: $([math]::Round($totalFontSize/1KB, 2)) KB"

        $fonts | Sort-Object Length -Descending | ForEach-Object {
            Write-Host "  $($_.Name): $([math]::Round($_.Length/1KB, 2)) KB"
        }
    }

    # Get page sizes
    $pagesDir = "$nextDir/server/pages"
    if (Test-Path $pagesDir) {
        $pages = Get-ChildItem -Path $pagesDir -Filter "*.js" -Recurse
        $totalPageSize = ($pages | Measure-Object -Property Length -Sum).Sum

        Write-Host "`n--- Server Pages Analysis ---" -ForegroundColor Cyan
        Write-Host "Total Pages: $($pages.Count)"
        Write-Host "Total Size: $([math]::Round($totalPageSize/1KB, 2)) KB"
    }
}

# Summary
Write-Host "`n=== Performance Summary ===" -ForegroundColor Cyan
Write-Host "Build Time: $([math]::Round($buildTime, 2))s"
if ($totalSize) {
    Write-Host "Client Bundle: $([math]::Round($totalSize/1KB, 2)) KB"
}
if ($totalFontSize) {
    Write-Host "Fonts: $([math]::Round($totalFontSize/1KB, 2)) KB"
}

Write-Host "`nPerformance measurement complete!" -ForegroundColor Green
Write-Host "Check build.log for detailed output" -ForegroundColor Gray
