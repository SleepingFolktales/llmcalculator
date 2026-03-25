#!/bin/bash
set -e

# ─────────────────────────────────────────────
# LLMCalculator — Quick Update Script
# Run this when you have code changes to deploy
# Usage: chmod +x update.sh && ./update.sh
# ─────────────────────────────────────────────

# ── CONFIGURE THESE (must match deploy.sh) ───
PROJECT_ID="llmcalculator"
REGION="us-central1"
SERVICE_NAME="llmcalculator"
IMAGE_NAME="llmcalc"
REPO_NAME="llmcalc-repo"
# ─────────────────────────────────────────────

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo ""
echo "⚡ Quick Update: Deploying code changes"
echo ""

# Step 1: Pull latest code
echo "[1/3] Pulling latest code from GitHub..."
git pull origin main

# Step 2: Rebuild and push image
echo "[2/3] Rebuilding and pushing Docker image..."
gcloud config set project $PROJECT_ID
gcloud builds submit \
  --tag $IMAGE_URI \
  --quiet

# Step 3: Deploy updated image to Cloud Run
echo "[3/3] Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_URI \
  --region $REGION \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format "value(status.url)")

echo ""
echo "✅ Update complete!"
echo "   Service URL: $SERVICE_URL"
echo "   Custom domain: https://calc.airsfoundry.com"
echo ""
echo "⏱️  Changes will be live in ~1-2 minutes"
echo ""
