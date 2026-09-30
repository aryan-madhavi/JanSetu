#!/bin/bash
set -e

echo "=== Deploying JanSetu to Google Cloud Run ==="

# Load .env safely
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-jansetu-510215}"
REGION="asia-south1"
SERVICE_NAME="jansetu"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/jansetu:latest"

MAPS_KEY="${VITE_GOOGLE_MAPS_API_KEY:-$GOOGLE_MAPS_API_KEY}"

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Image: $IMAGE"
echo "Maps key available: $(if [ -n "$MAPS_KEY" ]; then echo "Yes"; else echo "No"; fi)"

# Build container via Cloud Build passing build arg
echo "Submitting build to Cloud Build..."
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --config=cloudbuild.yaml \
  --substitutions="_VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY}"

# Deploy to Cloud Run
echo "Deploying to Cloud Run ($REGION)..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform="managed" \
  --allow-unauthenticated \
  --min-instances=1 \
  --memory=1Gi \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},TELEGRAM_BOT_KEY=${TELEGRAM_BOT_KEY},TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID},TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN},TWILIO_WHATSAPP_FROM=${TWILIO_WHATSAPP_FROM},VERTEX_LOCATION=asia-south1"

echo "=== Deployment Completed Successfully! ==="
URL=$(gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="${REGION}" --format="value(status.url)")
echo "Live URL: $URL"
