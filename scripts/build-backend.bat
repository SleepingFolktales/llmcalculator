@echo off
REM ============================================================
REM  build-backend.bat  —  Bundle Python backend with PyInstaller
REM  Run from the llmcalculator/ directory:
REM    scripts\build-backend.bat
REM ============================================================
setlocal enabledelayedexpansion

echo [1/4] Detecting Rust target triple...
for /f "tokens=2 delims= " %%i in ('rustc -Vv ^| findstr "host"') do set TARGET=%%i
if "%TARGET%"=="" (
    echo ERROR: Could not detect Rust target triple. Is Rust installed?
    exit /b 1
)
echo       Target: %TARGET%

echo [2/4] Running PyInstaller to bundle backend...
cd backend
call uv run pyinstaller ^
    --onefile ^
    --name llmcalc-backend ^
    --paths . ^
    --add-data "..\data;data" ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    --hidden-import fastapi ^
    --hidden-import pydantic ^
    --hidden-import main ^
    --hidden-import api ^
    --hidden-import api.routes_calculate ^
    --hidden-import api.routes_models ^
    --hidden-import api.routes_hardware ^
    --hidden-import api.routes_precision ^
    --hidden-import core ^
    --hidden-import core.calculator ^
    --hidden-import core.memory ^
    --hidden-import core.quantization ^
    --hidden-import core.scoring ^
    --hidden-import core.speed ^
    --hidden-import core.scenarios ^
    --hidden-import core.laptop_scoring ^
    --hidden-import core.supercomputer_scoring ^
    --hidden-import utils ^
    --hidden-import utils.data_loader ^
    --hidden-import models ^
    --collect-all orjson ^
    run_server.py
if %errorlevel% neq 0 (
    echo ERROR: PyInstaller build failed.
    cd ..
    exit /b 1
)
cd ..

echo [3/4] Copying binary to desktop\src-tauri\binaries\...
set DEST=desktop\src-tauri\binaries\llmcalc-backend-%TARGET%.exe
copy /Y backend\dist\llmcalc-backend.exe "%DEST%"
if %errorlevel% neq 0 (
    echo ERROR: Could not copy binary to %DEST%
    exit /b 1
)

echo [4/4] Done!
echo       Binary: %DEST%
echo.
echo You can now run:  cd desktop ^&^& npm run build
