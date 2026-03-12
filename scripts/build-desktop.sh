#!/usr/bin/env bash
# ============================================================
#  build-desktop.sh  —  Full desktop build pipeline
#  Run from the llmcalculator/ directory:
#    bash scripts/build-desktop.sh
# ============================================================
set -euo pipefail

echo "===================================================="
echo " LLMCalculator Desktop Build"
echo "===================================================="
echo ""

echo "[Step 1/3] Building Python backend binary..."
bash scripts/build-backend.sh
echo ""

echo "[Step 2/3] Installing desktop npm dependencies..."
cd desktop
npm install

echo "[Step 3/3] Building Tauri app..."
npm run build
cd ..

echo ""
echo "===================================================="
echo " Build complete! Installers in:"
echo " desktop/src-tauri/target/release/bundle/"
echo "===================================================="
