# Font Cleanup Script
# Removes unused font files to reduce bundle size

Write-Host "Cleaning up unused fonts..." -ForegroundColor Cyan

$fontsToRemove = @(
    "public/fonts/GeistVF.woff2",
    "public/fonts/inter-latin-wght-italic.woff2",
    "public/fonts/playfair-display-latin-400-italic.woff2",
    "public/fonts/playfair-display-latin-400-normal.woff2",
    "public/fonts/playfair-display-latin-500-normal.woff2",
    "public/fonts/playfair-display-latin-600-normal.woff2",
    "public/fonts/playfair-display-latin-700-normal.woff2"
)

$totalSaved = 0

foreach ($font in $fontsToRemove) {
    if (Test-Path $font) {
        $size = (Get-Item $font).Length
        $totalSaved += $size
        Remove-Item $font -Force
        Write-Host "  Removed: $font ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $font" -ForegroundColor Yellow
    }
}

Write-Host "`nTotal space saved: $([math]::Round($totalSaved/1KB, 2)) KB" -ForegroundColor Cyan
Write-Host "Font cleanup complete!" -ForegroundColor Green
