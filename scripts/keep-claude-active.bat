@echo off
REM Keep Claude Code Active - Windows Batch Launcher

echo.
echo === Claude Code Keep-Alive Script ===
echo.
echo Choose your preferred method:
echo.
echo 1. PowerShell (Recommended - No dependencies)
echo 2. Node.js (Requires robotjs package)
echo 3. Exit
echo.

set /p choice=Enter your choice (1-3):

if "%choice%"=="1" goto powershell
if "%choice%"=="2" goto nodejs
if "%choice%"=="3" goto end

:powershell
echo.
echo Starting PowerShell version...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0keep-claude-active.ps1"
goto end

:nodejs
echo.
echo Checking if robotjs is installed...
call npm list robotjs >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: robotjs not found
    echo.
    echo Installing robotjs...
    call npm install robotjs
    if errorlevel 1 (
        echo.
        echo Failed to install robotjs
        echo Please use PowerShell version instead
        pause
        goto end
    )
)
echo.
echo Starting Node.js version...
echo.
node "%~dp0keep-claude-active.js"
goto end

:end
exit /b
