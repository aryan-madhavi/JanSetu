# JanSetu (जनसेतु) — Digital Public Infrastructure Governance Submission

**Live Production Service:** [https://jansetu-538154252811.asia-south1.run.app](https://jansetu-538154252811.asia-south1.run.app)  
**License:** Apache-2.0  
**GCP Project:** `jansetu-510215` (Region: `asia-south1`)  
**Persistent Database:** Google Cloud Firestore (Native mode, Project: `jansetu-510215`)

---

## 1. Executive Summary

Civic grievance redressal in India is severely fragmented across physical offices, call centers, and disparate messaging channels. Even when citizen grievances are captured, they are rarely factored into high-level fiscal capital allocation: roads, primary health centers, and water pipelines are frequently budgeted without correlation to verified citizen demand or empirical infrastructure deficit indices.

**JanSetu** bridges this governance gap as an open-source **Digital Public Good (DPG)**. It aggregates multimodal grievances (voice audio recordings, photographs, text) in 10+ regional Indian languages across Web PWA, WhatsApp, and Telegram. Built on **Google Gemini 2.5 Flash on Vertex AI**, **Google Cloud Firestore (Native mode)**, and **Google Cloud Text-to-Speech**, JanSetu:
1. Structuredly extracts sector, severity, and location from natural language citizen submissions.
2. Persistently stores all submissions in Google Cloud Firestore Native with strict provenance (`live`, `public`, `demo`).
3. Cross-references live citizen demand signals with official Census 2011 infrastructure deficit metrics and realtime Open-Meteo weather context signals across 10 focus districts.
4. Computes an algorithmic **Fiscal Equalization Priority Score** ($Demand \times Deficit \times Vulnerability \times (1 - Coverage)$) that immediately updates on every live submission.
5. Incrementally clusters citizen demand into geographic and sector clusters in Firestore.
6. Enables policymakers to query the entire database in natural language using **Gemini Autonomous Function Calling** executing read-only SQL queries over an in-memory DuckDB analytical layer.

---

## 2. End-to-End Functional Architecture

```
[ Citizen Ingestion ]
  ├─ Browser PWA: MediaRecorder voice recording, photo preview, GPS autofill
  ├─ WhatsApp: Twilio webhook (/webhooks/whatsapp & /api/webhooks/twilio) returning TwiML ticket confirmations
  └─ Telegram Bot: Webhook (/webhooks/telegram & /api/webhooks/telegram) linked to @jansetu_gdg_bot
           │
           ▼
[ Google Cloud Run Container (FastAPI + React SPA) ]
  ├─ Vertex AI Gemini 2.5 Flash: Multimodal extraction, sentiment, & severity scoring
  ├─ Cloud Text-to-Speech: Regional audio playback (hi-IN, mr-IN, ta-IN, en-IN)
  ├─ Persistent Cloud Firestore (Native Mode, asia-south1):
  │     Collections: requests, districts, indicators, allocations, clusters, priorities, recommendations, users, tickets
  ├─ In-Memory DuckDB Analytic Engine: 30s cache TTL, instant write-invalidation, SELECT queries
  ├─ External Signals: Open-Meteo realtime weather context (temperature, rain, humidity)
  ├─ Equalization Engine: 90 district-sector priority ranking with instant live recalculation
  ├─ Gemini 2.5 Function Calling: Translates plain language to parse-checked DuckDB SQL
  └─ React Frontend: Responsive (1440px & 390px), i18n support, OpenStreetMap Leaflet, 5s polling
```

---

## 3. Data Provenance & Real vs Demo Breakdown

| Dataset / Entity | Source | Storage Collection | Classification | Details |
| :--- | :--- | :--- | :--- | :--- |
| **District Profiles** | Office of the Registrar General of India, Census 2011 | `districts` | **Real Public** | Population, literacy, rural %, SC/ST % for 10 focus districts normalized with source_url and retrieved_at |
| **Infrastructure Deficits** | Census 2011 Household Amenities Tables | `indicators` | **Real Public** | Water unreachability, unpaved roads, non-electrified households normalized into 0-1 indices |
| **Weather Context** | Open-Meteo Weather API (`api.open-meteo.com`) | Cached in-memory | **Real Live Signal** | Live temperature, precipitation, and humidity per district centroid |
| **Citizen Submissions** | Web PWA, WhatsApp (+1 415 523 8886), Telegram (@jansetu_gdg_bot) | `requests`, `tickets` | **Real Live** | Tagged `source="live"`, triggers immediate priority recalculation & incremental clustering |
| **Baseline Requests** | Synthetic Indian civic corpus (2,000 records) | `requests` | **Synthetic Demo** | Tagged `source="demo"`, seeded via `scripts/seed_firestore.py` |
| **Scheme Allocations** | Modeled Centrally Sponsored Schemes (JJM, PMGSY, DDUGJY) | `allocations` | **Synthetic Demo** | Tagged `source="demo"`, used for fiscal coverage ratios |

---

## 4. Honest Verification Results

The entire platform is audited through an automated test pipeline (`scripts/verify_all.sh`) with zero mock data in the frontend:

| Check | Result | Evidence |
| :--- | :--- | :--- |
| **Cloud Firestore Native** | **PASS** | Native mode active in `jansetu-510215` (`asia-south1`), SA granted `roles/datastore.user` |
| **Real Public Data Ingestion** | **PASS** | Census 2011 normalized into `districts` & `indicators` with source_url & retrieved_at |
| **Zero Mock Frontend Audit** | **PASS** | 0 occurrences of mock arrays or numbers in `frontend/src` |
| **Backend Pytest** | **PASS** | 16/16 passed (`test_main.py` covering Firestore, Priority, AFC DuckDB SQL, Webhooks, Auth) |
| **Frontend Vite Build** | **PASS** | Vite + TypeScript builds with 0 errors |
| **Live Citizen Ingestion** | **PASS** | Hindi grievance via Web PWA created Firestore doc with `source="live"` and updated live count |
| **Live WhatsApp & Telegram Webhooks** | **PASS** | Ingested requests with `source="live"` and returned ticket IDs |
| **Persistence Across Redeploys** | **PASS** | Live records persist in Firestore across Cloud Run container deployments |
| **Data Source Toggle** | **PASS** | "Live only" filters all screens and DuckDB SQL to strictly show verified live records |
| **External Weather Signals** | **PASS** | Open-Meteo live weather signals rendered in Why Drawer |
| **Playwright Suite (1440 & 390)** | **PASS** | 18/18 browser tests passed against live Cloud Run URL |

---

## 5. Demo User Credentials

The live deployment features role-based access control:

- **Policymaker Role**:
  - Email: `policymaker@jansetu.demo`
  - Password: `demo1234`
  - Permissions: Full access to National Overview, Geospatial View, Priority Queue, Deficit Scatter, Data Query, Recommendations, and Impact Tracker.
- **Citizen Role**:
  - Phone: `9876543210` (Ramesh Kumar)
  - Permissions: Citizen Portal, Audio/Photo Submission, Recent Reports feed, and Multi-channel Input Hub.

---

## 6. Manual Instructions for Evaluators

1. **Twilio WhatsApp Sandbox Setup**:
   - In the Twilio Console (Messaging > Try it out > Send a WhatsApp message):
   - Set the Sandbox incoming message webhook URL to:  
     `https://jansetu-538154252811.asia-south1.run.app/webhooks/whatsapp` (HTTP POST).
2. **Global Data Source Toggle**:
   - In the navigation header, click the "Data Source" badge to toggle between **Live Only** (shows exclusively genuine citizen reports) and **Live + Demo** (shows all records).
