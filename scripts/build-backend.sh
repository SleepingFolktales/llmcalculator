#!/usr/bin/env bash
# ============================================================
#  build-backend.sh  —  Bundle Python backend with PyInstaller
#  Run from the llmcalculator/ directory:
#    bash scripts/build-backend.sh
# ============================================================
set -euo pipefail

echo "[1/4] Detecting Rust target triple..."
TARGET=$(rustc -Vv | grep host | cut -d' ' -f2)
echo "      Target: $TARGET"

echo "[2/4] Running PyInstaller to bundle backend..."
cd backend
uv run pyinstaller \
    --onefile \
    --name llmcalc-backend \
    --add-data "../data:data" \
    --hidden-import uvicorn.logging \
    --hidden-import uvicorn.loops \
    --hidden-import uvicorn.loops.auto \
    --hidden-import uvicorn.protocols \
    --hidden-import uvicorn.protocols.http \
    --hidden-import uvicorn.protocols.http.auto \
    --hidden-import uvicorn.protocols.websockets \
    --hidden-import uvicorn.protocols.websockets.auto \
    --hidden-import uvicorn.lifespan \
    --hidden-import uvicorn.lifespan.on \
    --hidden-import fastapi \
    --hidden-import pydantic \
    --collect-all orjson \
    run_server.py
cd ..

echo "[3/4] Copying binary to desktop/src-tauri/binaries/ ..."
DEST="desktop/src-tauri/binaries/llmcalc-backend-${TARGET}"
cp backend/dist/llmcalc-backend "$DEST"
chmod +x "$DEST"

echo "[4/4] Done!"
echo "      Binary: $DEST"
echo ""
echo "You can now run:  cd desktop && npm run build"
