@echo off
REM ============================================================
REM  build-desktop.bat  —  Full desktop build pipeline
REM  Run from the llmcalculator/ directory:
REM    scripts\build-desktop.bat
REM ============================================================
setlocal

echo ====================================================
echo  LLMCalculator Desktop Build
echo ====================================================
echo.

echo [Step 1/3] Building Python backend binary...
call scripts\build-backend.bat
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed. Aborting.
    exit /b 1
)
echo.

echo [Step 2/3] Building frontend for Tauri...
cd frontend
call npm run build:tauri
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed.
    cd ..
    exit /b 1
)
cd ..

echo [Step 3/3] Installing desktop npm dependencies...
cd desktop
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    cd ..
    exit /b 1
)

echo [Step 4/4] Building Tauri app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Tauri build failed.
    cd ..
    exit /b 1
)
cd ..

echo.
echo ====================================================
echo  Build complete! Installers in:
echo  desktop\src-tauri\target\release\bundle\
echo ====================================================
