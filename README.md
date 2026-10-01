# JanSetu (जनसेतु) — AI for Public Infrastructure & Equalization Governance

[![Live Deployment](https://img.shields.io/badge/Cloud%20Run-Live-success)](https://jansetu-538154252811.asia-south1.run.app)
[![Database](https://img.shields.io/badge/Database-Cloud%20Firestore%20Native-blue)](https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=jansetu-510215)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Verification](https://img.shields.io/badge/E2E%20Verification-100%25%20Passed-brightgreen)](scripts/verify_all.sh)

**Live Production URL:** [https://jansetu-538154252811.asia-south1.run.app](https://jansetu-538154252811.asia-south1.run.app)

JanSetu is an open-source Digital Public Good (DPG) that unifies citizen civic infrastructure requests across voice, web PWA, WhatsApp, and Telegram in regional Indian languages. Running on a persistent, multi-tenant **Google Cloud Firestore (Native mode)** database in `asia-south1`, it correlates live citizen demands with official **Census of India 2011 district public indicators** and realtime **Open-Meteo meteorological signals**, calculating an algorithmic Equalization Priority Score to optimize fiscal allocation across centrally sponsored schemes (PMGSY, JJM, Ayushman Bharat, PM-KISAN, DDUGJY).

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
  ├── Persistent Database: Google Cloud Firestore (Native Mode, asia-south1)
  │     Collections: requests, districts, indicators, allocations, clusters, priorities, recommendations, users, tickets
  │     Strict Provenance: 'live' (citizen input), 'public' (Census 2011), 'demo' (synthetic)
  ├── In-Memory DuckDB Analytic Layer:
  │     Caches collections (30s TTL, invalidated on writes) for read-only SQL
  ├── Gemini Autonomous Function Calling Data Query (DuckDB SELECT tools)
  ├── Live External Signals: Open-Meteo Realtime Weather Context (temperature, rain, humidity)
  └── Built React + Vite SPA (Dark Theme, i18n EN/HI/TA/MR, Leaflet + Maps, 5s live polling)
```

---

## Key Features

1. **Persistent Cloud Firestore & Live Data Pipeline**:
   - Zero SQLite baking in container image; all state resides in Cloud Firestore (`jansetu-510215`).
   - Every submission immediately writes with `source="live"` to `requests` and `tickets`.
   - Priority score for the affected district is instantly recalculated in Firestore.
   - Live requests are incrementally grouped into `clusters` (`source="live"`).
   - Global **Data source toggle** (Live only vs Live + Demo) in the header with 5-second polling.

2. **Real Public Data & Live External Signals**:
   - Normalized from the official **Census of India 2011** Primary Census Abstract (`data/raw/india_census_2011.csv`) into `districts` and `indicators` collections (`source="public"`).
   - Real-time weather signals from **Open-Meteo** displayed in the Why Drawer as live environmental context.

3. **AI-Powered Multimodal Citizen Portal**:
   - Browser audio recording with timer & `MediaRecorder`.
   - Audio MIME detection (`audio/webm`, `audio/ogg`, `audio/wav`) and Gemini structured extraction.
   - Native regional voice playback via Cloud Text-to-Speech (`hi-IN`, `mr-IN`, `ta-IN`, `en-IN`).
   - Photographic proof upload and GPS coordinate lookup.

4. **Algorithmic Priority Allocation Queue**:
   - Mathematical formula: `Score = Demand Intensity × Infrastructure Deficit × Socioeconomic Vulnerability × (1 - Fiscal Coverage)`.
   - Interactive "Why Drawer" with factor decomposition progress bars, verified citizen quotes, pre-matched schemes, and live Open-Meteo weather readings.

5. **Geospatial Hotspots & Clean Map Fallback**:
   - Real-time intensity bubbles centered over India.
   - Dual-engine: Google Maps JavaScript API with clean fallback to OpenStreetMap Leaflet (zero missing key errors).

6. **Conversational SQL Data Query**:
   - Natural language queries translated into parse-checked read-only DuckDB SQL queries via Gemini Autonomous Function Calling (`run_sql`, `describe_schema`).
   - Renders executed SQL, structured data table, and downloadable CSV.

7. **Multi-Channel Webhook Ingestion**:
   - **Telegram Bot**: Active webhooks at `/webhooks/telegram` and `/api/webhooks/telegram` wired to `@jansetu_gdg_bot`.
   - **Twilio WhatsApp**: Webhooks at `/webhooks/whatsapp` and `/api/webhooks/twilio` returning TwiML responses with ticket IDs.

---

## Verification & Honesty Suite

JanSetu runs an automated verification suite verifying zero mocks, 16 backend unit tests, and browser assertions against both local and live Cloud Run environments:

```bash
# Run complete verification suite
./scripts/verify_all.sh
```

---

## License
Apache License 2.0. Open source for public governance.
