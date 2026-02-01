@echo off
echo.
echo ============================================
echo EMERGENCY FIX - CLEARING ALL CACHES
echo ============================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing Next.js cache...
if exist .next (
    rmdir /s /q .next
    echo ✓ Cleared .next directory
) else (
    echo ✓ .next directory already clean
)

echo Step 3: Clearing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✓ Cleared node_modules\.cache
) else (
    echo ✓ node_modules cache already clean
)

echo.
echo ============================================
echo CACHE CLEARED - NOW FOLLOW THESE STEPS:
echo ============================================
echo.
echo 1. Close this window
echo 2. Open your browser
echo 3. Press Ctrl+Shift+Delete
echo 4. Select "All time" and check:
echo    - Cookies and site data
echo    - Cached images and files
echo 5. Click "Clear data"
echo 6. Close ALL browser windows
echo 7. Run: npm run dev
echo 8. Open browser and go to http://localhost:3000
echo.
echo ============================================
echo DO THIS OR ERRORS WILL PERSIST!
echo ============================================
echo.
pause
