# Comprehensive Blue Color Removal Script
# Replaces all blue colors with white (#fefefc)

$replacements = @(
    # Blue hex colors
    @{ Pattern = '#0099ff'; Replacement = '#fefefc' }
    @{ Pattern = '#0099FF'; Replacement = '#fefefc' }
    @{ Pattern = '#0066FF'; Replacement = '#fefefc' }

    # Text colors
    @{ Pattern = 'text-blue-600 dark:text-blue-400'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-600'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-700 dark:text-blue-400'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-700 dark:text-blue-300'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-700'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-500'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-400'; Replacement = 'text-white/90' }
    @{ Pattern = 'text-blue-800 dark:text-blue-200'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-900 dark:text-blue-100'; Replacement = 'text-white' }
    @{ Pattern = 'text-blue-200'; Replacement = 'text-white/90' }
    @{ Pattern = 'text-blue-300'; Replacement = 'text-white/80' }

    # Background colors
    @{ Pattern = 'bg-blue-600'; Replacement = 'bg-white/20' }
    @{ Pattern = 'bg-blue-500'; Replacement = 'bg-white/20' }
    @{ Pattern = 'bg-blue-700'; Replacement = 'bg-white/30' }
    @{ Pattern = 'bg-blue-100 dark:bg-blue-900/30'; Replacement = 'bg-white/10 dark:bg-white/10' }
    @{ Pattern = 'bg-blue-100'; Replacement = 'bg-white/10' }
    @{ Pattern = 'bg-blue-50 dark:bg-blue-950/30'; Replacement = 'bg-white/5 dark:bg-white/5' }
    @{ Pattern = 'bg-blue-50 dark:bg-blue-950'; Replacement = 'bg-white/5 dark:bg-white/5' }
    @{ Pattern = 'bg-blue-50'; Replacement = 'bg-white/5' }
    @{ Pattern = 'bg-blue-500/10'; Replacement = 'bg-white/10' }
    @{ Pattern = 'bg-blue-500/20'; Replacement = 'bg-white/20' }
    @{ Pattern = 'bg-blue-900'; Replacement = 'bg-white/20' }
    @{ Pattern = 'bg-blue-950'; Replacement = 'bg-white/10' }
    @{ Pattern = 'bg-blue-950/30'; Replacement = 'bg-white/10' }
    @{ Pattern = 'bg-blue-950/20'; Replacement = 'bg-white/10' }
    @{ Pattern = 'bg-blue-800/50'; Replacement = 'bg-white/20' }

    # Border colors
    @{ Pattern = 'border-blue-200 dark:border-blue-800'; Replacement = 'border-white/20 dark:border-white/10' }
    @{ Pattern = 'border-blue-200'; Replacement = 'border-white/20' }
    @{ Pattern = 'border-blue-500/20'; Replacement = 'border-white/20' }
    @{ Pattern = 'border-blue-500/50'; Replacement = 'border-white/30' }
    @{ Pattern = 'border-blue-300 dark:border-blue-800'; Replacement = 'border-white/30 dark:border-white/20' }
    @{ Pattern = 'border-blue-300 dark:border-blue-700'; Replacement = 'border-white/30 dark:border-white/20' }
    @{ Pattern = 'border-blue-400 dark:border-blue-600'; Replacement = 'border-white/40 dark:border-white/30' }
    @{ Pattern = 'border-blue-800'; Replacement = 'border-white/20' }

    # Ring/outline colors
    @{ Pattern = 'ring-blue-500 dark:ring-blue-400'; Replacement = 'ring-white/50' }
    @{ Pattern = 'ring-blue-500'; Replacement = 'ring-white/50' }
    @{ Pattern = 'ring-blue-400'; Replacement = 'ring-white/40' }
    @{ Pattern = 'focus:ring-blue-500'; Replacement = 'focus:ring-white/50' }
    @{ Pattern = 'focus:ring-blue-400'; Replacement = 'focus:ring-white/40' }

    # Hover states
    @{ Pattern = 'hover:bg-blue-700'; Replacement = 'hover:bg-white/30' }
    @{ Pattern = 'hover:bg-blue-600'; Replacement = 'hover:bg-white/30' }
    @{ Pattern = 'hover:bg-blue-500'; Replacement = 'hover:bg-white/25' }

    # Gradient colors
    @{ Pattern = 'from-blue-500 to-blue-600'; Replacement = 'from-white/20 to-white/30' }
    @{ Pattern = 'from-blue-500'; Replacement = 'from-white/20' }
    @{ Pattern = 'to-blue-600'; Replacement = 'to-white/30' }
    @{ Pattern = 'from-blue-50'; Replacement = 'from-white/5' }
    @{ Pattern = 'to-blue-50'; Replacement = 'to-white/5' }
    @{ Pattern = 'from-blue-950/30'; Replacement = 'from-white/10' }
    @{ Pattern = 'to-blue-950/30'; Replacement = 'to-white/10' }
    @{ Pattern = 'from-blue-100'; Replacement = 'from-white/10' }
    @{ Pattern = 'to-cyan-50'; Replacement = 'to-white/5' }
    @{ Pattern = 'from-blue-500/10'; Replacement = 'from-white/10' }
    @{ Pattern = 'to-blue-500/5'; Replacement = 'to-white/5' }

    # RGB/RGBA
    @{ Pattern = 'rgba\(0, 153, 255'; Replacement = 'rgba(254, 254, 252' }
    @{ Pattern = 'rgb\(0, 153, 255\)'; Replacement = 'rgb(254, 254, 252)' }
)

$directories = @(
    "C:\Users\aamir\Documents\Apps\Tallow\app"
    "C:\Users\aamir\Documents\Apps\Tallow\components"
    "C:\Users\aamir\Documents\Apps\Tallow\lib"
)

$extensions = @("*.tsx", "*.ts", "*.jsx", "*.js", "*.css")

$totalFiles = 0
$totalReplacements = 0

Write-Host "Starting comprehensive blue color removal..." -ForegroundColor Cyan
Write-Host ""

foreach ($dir in $directories) {
    foreach ($ext in $extensions) {
        $files = Get-ChildItem -Path $dir -Filter $ext -Recurse -ErrorAction SilentlyContinue

        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($null -eq $content) { continue }

            $originalContent = $content
            $fileChanged = $false
            $fileReplacements = 0

            foreach ($replacement in $replacements) {
                $pattern = [regex]::Escape($replacement.Pattern)
                if ($content -match $pattern) {
                    $count = ([regex]::Matches($content, $pattern)).Count
                    $content = $content -replace $pattern, $replacement.Replacement
                    $fileReplacements += $count
                    $fileChanged = $true
                }
            }

            if ($fileChanged) {
                Set-Content -Path $file.FullName -Value $content -NoNewline
                Write-Host "  Fixed: $($file.FullName.Replace('C:\Users\aamir\Documents\Apps\Tallow\', ''))" -ForegroundColor Green
                Write-Host "    Replacements: $fileReplacements" -ForegroundColor Gray
                $totalFiles++
                $totalReplacements += $fileReplacements
            }
        }
    }
}

Write-Host ""
Write-Host "Complete!" -ForegroundColor Green
Write-Host "  Files modified: $totalFiles" -ForegroundColor Cyan
Write-Host "  Total replacements: $totalReplacements" -ForegroundColor Cyan
