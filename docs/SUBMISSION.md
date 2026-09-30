# JanSetu (जनसेतु) — Digital Public Infrastructure Governance Submission

**Live Production Service:** [https://jansetu-538154252811.asia-south1.run.app](https://jansetu-538154252811.asia-south1.run.app)  
**License:** Apache-2.0  
**GCP Project:** `jansetu-510215` (Region: `asia-south1`)

---

## 1. Executive Summary

Civic grievance redressal in India is severely fragmented across physical offices, call centers, and disparate messaging channels. Even when citizen grievances are captured, they are rarely factored into high-level fiscal capital allocation: roads, primary health centers, and water pipelines are frequently budgeted without correlation to verified citizen demand or empirical infrastructure deficit indices.

**JanSetu** bridges this governance gap as an open-source **Digital Public Good (DPG)**. It aggregates multimodal grievances (voice audio recordings, photographs, text) in 10+ regional Indian languages across Web PWA, WhatsApp, and Telegram. Built on **Google Gemini 2.5 Flash on Vertex AI** and **Google Cloud Text-to-Speech**, JanSetu:
1. Structuredly extracts sector, severity, and location from natural language citizen submissions.
2. Cross-references citizen demand signals with census and infrastructure deficit metrics across 10 focus districts.
3. Computes an algorithmic **Fiscal Equalization Priority Score** ($Demand \times Deficit \times Vulnerability \times (1 - Coverage)$).
4. Enables policymakers to query the entire database in natural language using **Gemini Autonomous Function Calling** executing read-only SQL queries over SQLite.

---

## 2. End-to-End Functional Architecture

```
[ Citizen Ingestion ]
  ├─ Browser PWA: MediaRecorder voice recording, photo preview, GPS autofill
  ├─ WhatsApp: Twilio webhook (/webhooks/whatsapp) returning TwiML ticket confirmations
  └─ Telegram Bot: Webhook (/api/webhooks/telegram) linked to @jansetu_gdg_bot
           │
           ▼
[ Google Cloud Run Container (FastAPI + React SPA) ]
  ├─ Vertex AI Gemini 2.5 Flash: Multimodal extraction, sentiment, & severity scoring
  ├─ Cloud Text-to-Speech: Regional audio playback (hi-IN, mr-IN, ta-IN, en-IN)
  ├─ SQLite Governance Database: 2,000+ seeded records with cluster analysis
  ├─ Equalization Engine: 90 district-sector priority ranking with evidence audit
  ├─ Gemini 2.5 Function Calling: Translates plain language to parse-checked SQL
  └─ React Frontend: Responsive (1440px & 390px), i18n support, OpenStreetMap Leaflet
```

---

## 3. Honest Verification Results

The entire platform has been audited and validated through an automated test pipeline (`scripts/verify_all.sh`) with zero mock data in the frontend:

| Check | Result | Evidence |
| :--- | :--- | :--- |
| **Environment Keys** | **PASS** | Valid Google Maps API key, Telegram Bot Token, and Twilio credentials loaded |
| **Zero-Mock Audit** | **PASS** | 0 occurrences of mock/dummy/placeholder data in `frontend/src` |
| **Backend Pytest** | **PASS** | 15/15 passed (`test_main.py` covering DB, Priority, AFC SQL, Webhooks, Auth) |
| **Frontend Compilation** | **PASS** | Vite + TypeScript builds with 0 errors |
| **Playwright Local (1440 & 390)** | **PASS** | 18/18 browser tests passed (Voice recording, GPS, Gemini extraction, Why drawer) |
| **Live Cloud Run DB & KPIs** | **PASS** | Live container healthy with 2,000+ seeded grievances served from `/api/dashboard/stats` |
| **Live WhatsApp Webhook** | **PASS** | TwiML response returned with valid ticket ID (`REQ-32FD66`) |
| **Live Playwright (1440 & 390)** | **PASS** | 18/18 browser tests passed against live Cloud Run URL |

---

## 4. Demo User Credentials

The live deployment features role-based access control with pre-seeded demo accounts:

- **Policymaker Role**:
  - Email: `policymaker@jansetu.demo`
  - Password: `demo1234`
  - Permissions: Full access to National Overview, Geospatial View, Priority Queue, Deficit Scatter, Data Query, Recommendations, and Impact Tracker.
- **Citizen Role**:
  - Phone: `9876543210` (Ramesh Kumar)
  - Permissions: Citizen Portal, Audio/Photo Submission, Recent Reports feed, and Multi-channel Input Hub.

---

## 5. Manual Instructions for External Integration

1. **Twilio WhatsApp Sandbox Setup**:
   - In the Twilio Console (Messaging > Try it out > Send a WhatsApp message):
   - Set the Sandbox incoming message webhook URL to:  
     `https://jansetu-538154252811.asia-south1.run.app/webhooks/whatsapp` (HTTP POST).
2. **Google Maps API Key Domain Restriction**:
   - In Google Cloud Console (APIs & Services > Credentials > Your Maps API Key):
   - Under "Website restrictions", allow:
     - `https://jansetu-538154252811.asia-south1.run.app/*`
     - `https://jansetu-fcg2dedv3a-el.a.run.app/*`
     - `http://localhost:*`
   - Note: If restricted or pending activation, JanSetu automatically renders high-resolution OpenStreetMap tiles with zero visual errors.
