#!/bin/bash
set -e

# ─────────────────────────────────────────────
# LLMCalculator — Cloud Run Deployment Script
# Run from Cloud Shell after git cloning your repo
# Usage: chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────

# ── CONFIGURE THESE ──────────────────────────
PROJECT_ID="llmcalculator"           # Your GCP project ID
REGION="us-central1"                 # Keep this for free tier
SERVICE_NAME="llmcalculator"         # Cloud Run service name
IMAGE_NAME="llmcalc"                 # Docker image name
REPO_NAME="llmcalc-repo"             # Artifact Registry repo name
SUBDOMAIN="calc.airsfoundry.com"     # Your custom subdomain
# ─────────────────────────────────────────────

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo ""
echo "================================================"
echo "  LLMCalculator — Cloud Run Deployment"
echo "================================================"
echo ""

# Step 1: Set active project
echo "[1/7] Setting active GCP project..."
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo "[2/7] Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --quiet

# Step 3: Create Artifact Registry repo (skips if already exists)
echo "[3/7] Creating Artifact Registry repository (if not exists)..."
gcloud artifacts repositories describe $REPO_NAME \
  --location=$REGION \
  --quiet 2>/dev/null || \
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="LLM Calculator Docker images" \
  --quiet

# Step 4: Build and push image via Cloud Build
echo "[4/7] Building and pushing Docker image via Cloud Build..."
echo "        (This will build frontend → backend → deploy as single container)"
gcloud builds submit \
  --tag $IMAGE_URI \
  --quiet

# Step 5: Deploy to Cloud Run
echo "[5/7] Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_URI \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --quiet

# Step 6: Get the service URL
echo "[6/7] Fetching service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format "value(status.url)")

echo ""
echo "✅ Deployment successful!"
echo "   Service URL: $SERVICE_URL"
echo ""

# Step 7: Map custom subdomain (optional — comment out if not ready)
echo "[7/7] Mapping custom subdomain: $SUBDOMAIN"
echo "      (If this is your first time, you may need to verify domain ownership first)"
echo "      Run if needed: gcloud domains verify airsfoundry.com"
echo ""
gcloud beta run domain-mappings create \
  --service $SERVICE_NAME \
  --domain $SUBDOMAIN \
  --region $REGION \
  --quiet 2>/dev/null && \
echo "✅ Subdomain mapping created. Add the DNS records shown above to your registrar." || \
echo "⚠️  Subdomain mapping already exists or needs manual setup. Check Cloud Console."

echo ""
echo "================================================"
echo "  Done! Your app will be live at:"
echo "  https://$SUBDOMAIN  (after DNS propagates)"
echo "  https://$SERVICE_URL  (available immediately)"
echo "================================================"
echo ""