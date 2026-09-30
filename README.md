# JanSetu (जनसेतु) — AI for Public Infrastructure & Equalization Governance

[![Live Deployment](https://img.shields.io/badge/Cloud%20Run-Live-success)](https://jansetu-538154252811.asia-south1.run.app)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Verification](https://img.shields.io/badge/E2E%20Verification-100%25%20Passed-brightgreen)](scripts/verify_all.sh)

**Live Production URL:** [https://jansetu-538154252811.asia-south1.run.app](https://jansetu-538154252811.asia-south1.run.app)

JanSetu is an open-source Digital Public Good (DPG) that unifies citizen civic infrastructure requests across voice, web PWA, WhatsApp, and Telegram in regional Indian languages. Using Google Gemini 2.5 and Vertex AI, it automatically extracts structured parameters, correlates demand signals against district-level infrastructure deficit data, and calculates an algorithmic Equalization Priority Score to optimize fiscal allocation across centrally sponsored schemes (PMGSY, JJM, Ayushman Bharat, PM-KISAN, DDUGJY).

---

## Live Demo Credentials

| Role | Identifier | Credential / Mode | Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Policymaker** | `policymaker@jansetu.demo` | `demo1234` | Full Command Center: National Overview, Geospatial View, Priority Queue, Deficit Scatter, Data Query, Recommended Projects, Impact Tracker |
| **Citizen** | `9876543210` | Ramesh Kumar (Demo mode) | Citizen Portal, Multi-channel Input Hub |

---

## Core System Architecture

```
[ Citizen Inputs: Voice / Audio / PWA / WhatsApp / Telegram ]
                          │
                          ▼
            [ FastAPI Backend on Cloud Run ]
  ├── Ingestion & Location Resolver (10 Focus Districts)
  ├── Multimodal Structured Extraction (Gemini 2.5 Flash on Vertex AI)
  ├── Regional Audio Speech Reply (Google Cloud Text-to-Speech)
  ├── SQLite Equalization Engine (2,000+ Verified Grievances)
  │     Formula: Demand × Deficit × Vulnerability × (1 - Fiscal Coverage)
  ├── Autonomous Function Calling Data Query (Gemini 2.5 Flash AFC)
  └── Built React + Vite SPA (Dark Theme, i18n EN/HI/TA/MR, Leaflet + Maps)
```

---

## Key Features

1. **AI-Powered Multimodal Citizen Portal**:
   - Live browser audio recording with timer & `MediaRecorder`.
   - Audio MIME detection (`audio/webm`, `audio/ogg`, `audio/wav`, `audio/mp4`) and Vertex AI extraction.
   - Native regional voice playback via Cloud Text-to-Speech (`hi-IN`, `mr-IN`, `ta-IN`, `en-IN`).
   - Photographic proof upload and GPS coordinate lookup.

2. **Algorithmic Priority Allocation Queue**:
   - Mathematical formula: `Score = Demand Intensity × Infrastructure Deficit × Socioeconomic Vulnerability × (1 - Fiscal Coverage)`.
   - Interactive "Why Drawer" with factor decomposition progress bars, verified citizen quotes, and pre-matched schemes.

3. **Geospatial Hotspots & Clean Map Fallback**:
   - Real-time intensity bubbles centered over India.
   - Dual-engine: Google Maps JavaScript API with clean fallback to OpenStreetMap Leaflet (zero missing key errors).

4. **Conversational SQL Data Query**:
   - Natural language queries translated into parse-checked read-only SQLite queries via Gemini Autonomous Function Calling (`run_sql`, `describe_schema`).
   - Renders executed SQL, structured data table, and downloadable CSV.

5. **Multi-Channel Webhook Ingestion**:
   - **Telegram Bot**: Active webhook wired to `@jansetu_gdg_bot`.
   - **Twilio WhatsApp**: Webhook at `/webhooks/whatsapp` returning TwiML responses with ticket IDs.

---

## Verification & Honesty Suite

JanSetu runs an automated verification suite verifying zero mocks, 15 backend unit tests, and 36 browser assertions (Desktop + Mobile) against both local and live Cloud Run environments:

```bash
# Run complete verification suite
./scripts/verify_all.sh
```

### Verification Matrix
- **Environment Keys**: PASS
- **Zero-Mock Frontend Audit**: PASS (0 mock arrays across `frontend/src`)
- **Pytest Suite**: PASS (15/15 passed)
- **Frontend Vite Build**: PASS (0 TypeScript errors)
- **Local Playwright (1440px & 390px)**: PASS (18/18 passed)
- **Live Cloud Run API & DB**: PASS (2,000+ seeded rows active)
- **Live WhatsApp Webhook**: PASS (TwiML ticket generation)
- **Live Playwright (1440px & 390px)**: PASS (18/18 passed against Cloud Run URL)

---

## License
Apache License 2.0. Open source for public governance.
