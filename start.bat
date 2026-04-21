@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   WEBMASTER  -  Dev Server
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js 18+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [First run] Installing dependencies, this takes about 1 minute...
    echo.
    call npm install --no-audit --no-fund --loglevel=error
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. Check your network.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed.
    echo.
)

echo Starting Vite dev server...
echo The browser will open automatically at http://localhost:5173/
echo Press Ctrl+C in this window to stop.
echo.

call npm run dev

echo.
echo Dev server stopped.
pause
