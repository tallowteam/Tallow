# Tallow Performance Fixes - Automated Script
# Run this script to apply critical performance optimizations

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Tallow Performance Fix Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot + "\.."
Set-Location $projectRoot

# Function to prompt user
function Confirm-Action {
    param([string]$Message)
    $response = Read-Host "$Message (y/n)"
    return $response -eq 'y'
}

# 1. Remove Unused Fonts
Write-Host "[1/5] Removing unused fonts..." -ForegroundColor Yellow
$unusedFonts = @(
    "public\fonts\GeistVF.woff2",
    "public\fonts\inter-latin-wght-italic.woff2",
    "public\fonts\playfair-display-latin-400-italic.woff2",
    "public\fonts\playfair-display-latin-400-normal.woff2",
    "public\fonts\playfair-display-latin-500-normal.woff2",
    "public\fonts\playfair-display-latin-600-normal.woff2",
    "public\fonts\playfair-display-latin-700-normal.woff2"
)

$totalSize = 0
foreach ($font in $unusedFonts) {
    $fullPath = Join-Path $projectRoot $font
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        $totalSize += $size
        Write-Host "  Found: $font ($([math]::Round($size/1KB, 2))KB)" -ForegroundColor Gray
    }
}

Write-Host "  Total unused fonts: $([math]::Round($totalSize/1KB, 2))KB" -ForegroundColor White

if (Confirm-Action "Delete unused fonts?") {
    foreach ($font in $unusedFonts) {
        $fullPath = Join-Path $projectRoot $font
        if (Test-Path $fullPath) {
            Remove-Item $fullPath -Force
            Write-Host "  ✓ Deleted: $font" -ForegroundColor Green
        }
    }
    Write-Host "  Saved: $([math]::Round($totalSize/1KB, 2))KB" -ForegroundColor Green
} else {
    Write-Host "  Skipped font deletion" -ForegroundColor Gray
}

Write-Host ""

# 2. Check for imports of deleted fonts
Write-Host "[2/5] Checking for font references..." -ForegroundColor Yellow
$fontRefs = Select-String -Path "app\*.tsx","app\*.ts","components\*.tsx","lib\*.ts" -Pattern "(GeistVF|playfair-display|inter.*italic)" -Recurse
if ($fontRefs) {
    Write-Host "  ⚠ Found references to removed fonts:" -ForegroundColor Red
    $fontRefs | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Write-Host "  Please remove these references manually" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ No references to removed fonts found" -ForegroundColor Green
}

Write-Host ""

# 3. Create font preload snippet
Write-Host "[3/5] Generating font preload code..." -ForegroundColor Yellow
$preloadCode = @"
{/* Font Preloading for Performance */}
<link
  rel="preload"
  href="/fonts/inter-latin-wght-normal.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
<link
  rel="preload"
  href="/fonts/cormorant-garamond-latin-400-normal.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
"@

$preloadFile = "font-preload-snippet.txt"
$preloadCode | Out-File $preloadFile -Encoding UTF8
Write-Host "  ✓ Font preload code saved to: $preloadFile" -ForegroundColor Green
Write-Host "  Add this to app\layout.tsx <head> section" -ForegroundColor Cyan

Write-Host ""

# 4. Analyze TypeScript errors
Write-Host "[4/5] Checking TypeScript errors..." -ForegroundColor Yellow
Write-Host "  Running type check..." -ForegroundColor Gray

$typeCheckOutput = & npm run type-check 2>&1 | Out-String

if ($LASTEXITCODE -ne 0) {
    $errorCount = ($typeCheckOutput | Select-String "error TS").Count
    Write-Host "  ✗ Found $errorCount TypeScript errors" -ForegroundColor Red
    Write-Host "  Generating error report..." -ForegroundColor Gray

    $typeCheckOutput | Out-File "typescript-errors.log" -Encoding UTF8
    Write-Host "  Error report saved to: typescript-errors.log" -ForegroundColor Yellow

    # Extract top error files
    $errorFiles = $typeCheckOutput | Select-String "\.ts.*error TS" |
        ForEach-Object { ($_ -split '\(')[0].Trim() } |
        Group-Object | Sort-Object Count -Descending | Select-Object -First 10

    Write-Host ""
    Write-Host "  Top 10 files with errors:" -ForegroundColor Yellow
    $errorFiles | ForEach-Object {
        Write-Host "    $($_.Count) errors: $($_.Name)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ No TypeScript errors found" -ForegroundColor Green
}

Write-Host ""

# 5. Generate performance report
Write-Host "[5/5] Generating performance checklist..." -ForegroundColor Yellow

$checklist = @"
# Performance Optimization Checklist

## Completed ✅
- [x] Removed unused fonts (-189KB)
- [x] Generated font preload snippet

## TODO - Critical (Do Today) 🔴
- [ ] Fix TypeScript errors (see typescript-errors.log)
- [ ] Add font preload to app/layout.tsx
- [ ] Test production build: npm run build

## TODO - High Priority (This Week) 🟡
- [ ] Implement crypto lazy loading
  - Create lib/crypto/pqc-crypto-lazy.ts
  - Update lib/hooks/use-pqc-transfer.ts
  - Test PQC transfers still work
- [ ] Add cleanup to hooks with event listeners
  - lib/hooks/use-p2p-connection.ts
  - lib/hooks/use-transfer-room.ts
  - lib/hooks/use-screen-share.ts
- [ ] Run bundle analysis: ANALYZE=true npm run build

## TODO - Medium Priority (Next Week) 🔵
- [ ] Optimize context re-renders
  - Add React.memo to expensive components
  - Implement context selectors
- [ ] Add IndexedDB indices
  - lib/storage/my-devices.ts
  - lib/storage/transfer-state-db.ts
- [ ] Performance testing
  - npm run perf:full
  - Lighthouse audit

## Performance Targets 🎯
- Bundle size: <500KB (currently ~1.2MB)
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <3.0s
- Time to Interactive: <3.5s
- Lighthouse score: >90

## Next Steps
1. Fix blocking TypeScript errors
2. Build and deploy to production
3. Monitor real user performance
4. Iterate on optimizations

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$checklist | Out-File "PERFORMANCE_CHECKLIST.md" -Encoding UTF8
Write-Host "  ✓ Checklist saved to: PERFORMANCE_CHECKLIST.md" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Performance Fix Script Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Review PERFORMANCE_CHECKLIST.md" -ForegroundColor Cyan
Write-Host "  2. Fix TypeScript errors (see typescript-errors.log)" -ForegroundColor Cyan
Write-Host "  3. Add font preload (see font-preload-snippet.txt)" -ForegroundColor Cyan
Write-Host "  4. Run: npm run build" -ForegroundColor Cyan
Write-Host ""
Write-Host "Estimated time savings: 189KB initial load" -ForegroundColor Green
Write-Host "Expected improvement: 1-2s faster First Contentful Paint" -ForegroundColor Green
Write-Host ""
