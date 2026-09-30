#!/bin/bash
# smoke.sh
# Tests local environment health before deployment

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Starting backend..."
cd backend
source ../venv/bin/activate
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/../sa.json
uvicorn main:app --port 8001 &
APP_PID=$!
sleep 5

echo "Pinging health endpoint..."
curl -f http://localhost:8001/healthz

echo ""
echo "Sending mock request..."
curl -X POST -F "text=पानी की लाइन टूट गई है" -F "language_hint=Hindi" http://localhost:8001/api/requests

echo ""
echo "Shutting down backend..."
kill $APP_PID

echo "Smoke test passed successfully!"
