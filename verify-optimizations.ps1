# Verification Script for Performance Optimizations
# Checks that all optimizations are properly implemented

Write-Host "=== Tallow Performance Optimization Verification ===" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Check 1: Verify lazy-components.tsx has all required exports
Write-Host "Checking lazy component exports..." -ForegroundColor Yellow
$lazyComponentsPath = "components/lazy-components.tsx"
if (Test-Path $lazyComponentsPath) {
    $content = Get-Content $lazyComponentsPath -Raw
    $requiredExports = @(
        "LazyReceivedFilesDialog",
        "LazyTransferConfirmDialog",
        "LazyPasswordInputDialog",
        "LazyVerificationDialog"
    )

    $missing = @()
    foreach ($export in $requiredExports) {
        if ($content -notmatch $export) {
            $missing += $export
        }
    }

    if ($missing.Count -eq 0) {
        Write-Host "  ✓ All lazy components exported" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing exports: $($missing -join ', ')" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ lazy-components.tsx not found" -ForegroundColor Red
    $allPassed = $false
}

# Check 2: Verify font preloading in layout.tsx
Write-Host "`nChecking font preloading..." -ForegroundColor Yellow
$layoutPath = "app/layout.tsx"
if (Test-Path $layoutPath) {
    $content = Get-Content $layoutPath -Raw

    if ($content -match 'rel="preload"' -and $content -match 'as="font"') {
        Write-Host "  ✓ Font preloading configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Font preloading not found" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ layout.tsx not found" -ForegroundColor Red
    $allPassed = $false
}

# Check 3: Verify next.config.ts optimizations
Write-Host "`nChecking Next.js configuration..." -ForegroundColor Yellow
$configPath = "next.config.ts"
if (Test-Path $configPath) {
    $content = Get-Content $configPath -Raw

    $checks = @{
        "Package imports" = "optimizePackageImports"
        "Image optimization" = "images:"
        "Console removal" = "removeConsole"
    }

    $configPassed = $true
    foreach ($check in $checks.GetEnumerator()) {
        if ($content -match $check.Value) {
            Write-Host "  ✓ $($check.Key) configured" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($check.Key) not found" -ForegroundColor Red
            $configPassed = $false
        }
    }

    if (-not $configPassed) {
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ next.config.ts not found" -ForegroundColor Red
    $allPassed = $false
}

# Check 4: Verify unused fonts are marked for removal
Write-Host "`nChecking font directory..." -ForegroundColor Yellow
$fontsDir = "public/fonts"
if (Test-Path $fontsDir) {
    $fonts = Get-ChildItem $fontsDir -Filter "*.woff2"

    $unusedFonts = @(
        "GeistVF.woff2",
        "inter-latin-wght-italic.woff2",
        "playfair-display-latin-400-italic.woff2",
        "playfair-display-latin-400-normal.woff2",
        "playfair-display-latin-500-normal.woff2",
        "playfair-display-latin-600-normal.woff2",
        "playfair-display-latin-700-normal.woff2"
    )

    $foundUnused = @()
    foreach ($font in $fonts) {
        if ($unusedFonts -contains $font.Name) {
            $foundUnused += $font.Name
        }
    }

    if ($foundUnused.Count -eq 0) {
        Write-Host "  ✓ No unused fonts found (cleanup already done)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Unused fonts detected (run cleanup-fonts.ps1):" -ForegroundColor Yellow
        foreach ($font in $foundUnused) {
            Write-Host "    - $font" -ForegroundColor Gray
        }
        Write-Host "  Note: This is expected if cleanup hasn't been run yet" -ForegroundColor Gray
    }

    Write-Host "  Total fonts: $($fonts.Count)" -ForegroundColor Cyan
} else {
    Write-Host "  ✗ Fonts directory not found" -ForegroundColor Red
    $allPassed = $false
}

# Check 5: Verify scripts are in package.json
Write-Host "`nChecking npm scripts..." -ForegroundColor Yellow
$packagePath = "package.json"
if (Test-Path $packagePath) {
    $content = Get-Content $packagePath -Raw

    $requiredScripts = @(
        "build:analyze",
        "perf:test",
        "perf:measure"
    )

    $missingScripts = @()
    foreach ($script in $requiredScripts) {
        if ($content -notmatch $script) {
            $missingScripts += $script
        }
    }

    if ($missingScripts.Count -eq 0) {
        Write-Host "  ✓ All performance scripts added" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing scripts: $($missingScripts -join ', ')" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ package.json not found" -ForegroundColor Red
    $allPassed = $false
}

# Check 6: Verify helper files exist
Write-Host "`nChecking helper files..." -ForegroundColor Yellow
$requiredFiles = @{
    "cleanup-fonts.ps1" = "Font cleanup script"
    "measure-performance.ps1" = "Performance measurement script"
    "scripts/check-bundle-size.js" = "Bundle size checker"
    "lib/utils/image-optimization.ts" = "Image optimization utilities"
    "PERFORMANCE_OPTIMIZATIONS.md" = "Optimization documentation"
    "PERFORMANCE_TESTING.md" = "Testing documentation"
    "PERFORMANCE_IMPLEMENTATION_SUMMARY.md" = "Implementation summary"
}

$missingFiles = @()
foreach ($file in $requiredFiles.GetEnumerator()) {
    if (Test-Path $file.Key) {
        Write-Host "  ✓ $($file.Value)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $($file.Key)" -ForegroundColor Red
        $missingFiles += $file.Key
    }
}

if ($missingFiles.Count -gt 0) {
    $allPassed = $false
}

# Summary
Write-Host "`n=== Verification Summary ===" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ All optimizations properly implemented!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run: .\cleanup-fonts.ps1 (if not done yet)" -ForegroundColor Gray
    Write-Host "2. Run: npm run build" -ForegroundColor Gray
    Write-Host "3. Run: npm run perf:test" -ForegroundColor Gray
    Write-Host "4. Deploy to production" -ForegroundColor Gray
} else {
    Write-Host "❌ Some checks failed. Please review the errors above." -ForegroundColor Red
    exit 1
}
