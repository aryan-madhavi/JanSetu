# JanSetu (जनसेतु) - Comprehensive Developer & Submission Guide

This guide covers everything you need to know about the JanSetu architecture, how to run it locally, how to integrate the multichannel bots, how to deploy it to Google Cloud, and exactly what to submit for the hackathon.

---

## 1. Project Overview & Architecture

**The Problem**: Citizen infrastructure requests in India are scattered across various systems, making it impossible for policymakers to allocate budgets accurately or measure the impact of Digital Public Infrastructure (DPI) investments.
**The Solution**: JanSetu is a Digital Public Good (DPG) that aggregates demand via Voice, Text, Telegram, WhatsApp, and Web.

### Key Components:
- **Frontend (React 18 + Vite + TailwindCSS v4)**: A responsive, mobile-first PWA dashboard designed for policymakers, featuring Framer Motion animations, Recharts for data visualization, and React-Leaflet for mapping.
- **Backend (Python 3.11 + FastAPI)**: A high-performance API layer serving both the web client and webhook endpoints.
- **Database (SQLite)**: A local, lightweight database for the prototype, enabling instant setup without cloud SQL provisioning. Easily scalable to PostgreSQL for production.
- **AI Engine (Google Gemini 2.5)**: 
  - *Gemini 2.5 Flash*: Used for fast, multimodal data extraction (parsing images and audio to detect location, sector, and severity).
  - *Gemini 2.5 Pro*: Powers the "Ask the Data" dashboard feature, performing complex reasoning across the dataset.

---

## 2. Prerequisites & Authentication

Before running the project, ensure you have:
1. **Python 3.11+** installed.
2. **Node.js 18+** installed (`npm`).
3. **Google Cloud CLI (`gcloud`)** installed and authenticated.

### Vertex AI Authentication
JanSetu uses Google Vertex AI. To grant your backend access to Gemini:
1. Place a valid `sa.json` (Service Account Key) in the root directory.
2. The start scripts automatically export `GOOGLE_APPLICATION_CREDENTIALS=sa.json`.
*(Alternatively, you can use `gcloud auth application-default login` if you do not have a service account key).*

---

## 3. Local Development Setup

To test the application locally without deploying any cloud resources, follow these steps in two separate terminal windows.

### Terminal 1: Start the Backend
```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

# Export credentials for Gemini
export GOOGLE_APPLICATION_CREDENTIALS=../sa.json

# (Optional) Seed the database with fake requests for the dashboard
python seed.py

# Start the API server
uvicorn main:app --reload --port 8000
```
*Wait for "Application startup complete". The API is now running on port 8000.*

### Terminal 2: Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The Vite server will start on `http://localhost:5173`. It automatically proxies `/api/*` requests to the backend on port 8000.*

### Verifying Local Setup
- Open `http://localhost:5173` in your browser.
- Verify the map and charts load.
- Go to the **Ask the Data** tab and ask a question. If Gemini responds, your authentication and full-stack setup are perfect.

---

## 4. Multi-Channel Integrations

JanSetu is designed to ingest data from anywhere. We have built webhook endpoints for Telegram and Twilio (WhatsApp).

### How it works:
1. A citizen sends a photo of a broken road to the Telegram bot.
2. Telegram sends a POST request to `/api/webhooks/telegram`.
3. The backend uses Gemini 2.5 Flash to extract the location, sector (Roads), and severity.
4. The database is updated, and the Dashboard charts recalculate instantly.

### Activating the Bots
Once the app is deployed to the internet, run the webhook script to tell Telegram/Twilio where your server is:
```bash
./scripts/set_webhooks.sh "https://<YOUR-CLOUD-RUN-URL>"
```

---

## 5. Deployment Guide (Google Cloud Run)

To make the dashboard accessible to judges and allow external bots to send webhooks, you must deploy JanSetu to the internet. We use **Google Cloud Run** because it handles both the backend API and the static React files in a single, serverless container.

1. Ensure your active GCP project is set:
```bash
gcloud config set project <YOUR-PROJECT-ID>
```
2. Run the automated deployment script from the root directory:
```bash
./scripts/deploy.sh
```
3. When the build finishes, it will print a public URL. Click it to view your live app.

---

## 6. Hackathon Submission Process

When you are ready to submit on the hackathon portal, you will need the following assets (all of which are already generated for you):

1. **GitHub Repository**: Push your code to GitHub and submit the public link.
2. **Live Demo URL**: Submit the Google Cloud Run link generated in step 5.
3. **Pitch Deck**: Open `docs/PITCH_DECK.md`, copy the text into Google Slides, and export it as a PDF. Submit the PDF.
4. **Demo Video**: Read `docs/DEMO_SCRIPT.md` aloud while recording your screen using the live dashboard. Upload it to YouTube (Unlisted) and submit the link.
5. **Project Details**: Copy and paste the answers from `docs/SUBMISSION.md` into the various text fields on the submission portal (e.g., Problem, Solution, Architecture).

---

## 7. TL;DR (Quick Start)

**Local Testing:**
1. `cd backend && source ../venv/bin/activate && export GOOGLE_APPLICATION_CREDENTIALS=../sa.json && uvicorn main:app --port 8000`
2. `cd frontend && npm install && npm run dev`
3. Check `localhost:5173` to see it working.

**Deployment & Submission:**
1. `git commit` and `git push` to save your work.
2. Run `./scripts/deploy.sh` to put the app on the internet.
3. Take your Cloud Run URL, your Pitch Deck (`docs/PITCH_DECK.md`), and your Demo Script (`docs/DEMO_SCRIPT.md`), record a 2-minute video, and submit them all to the hackathon portal!
