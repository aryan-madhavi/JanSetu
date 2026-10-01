# JanSetu Data Card & Provenance Manifesto

## 1. Provenance Architecture Overview
JanSetu enforces a strict three-tier data provenance model where every record stored in Google Cloud Firestore (`jansetu-510215`, region `asia-south1`) is explicitly tagged with a `source` field:
- **`public`**: Real government open datasets and gazetteers normalized into district profiles.
- **`live`**: Genuine citizen submissions received via Web PWA, WhatsApp, or Telegram.
- **`demo`**: Synthetic historical baseline records for cold-start visualization and stress testing.

---

## 2. Real Public Datasets

### A. Census of India 2011 District Tables
- **Source**: Primary Census Abstract & Housing Tables, Office of the Registrar General & Census Commissioner, India (Ministry of Home Affairs).
- **Local Raw File**: `data/raw/india_census_2011.csv`
- **Normalized Collections**:
  - `districts`: District names, state, total population, literacy rates, rural percentage, SC/ST percentage, and geographic coordinates (centroid latitude/longitude).
  - `indicators`: Normalized baseline infrastructure indices (water deficit, roads deficit, health deficit, education deficit, electricity deficit).
- **Metadata Recorded**: Every document includes `source="public"`, `source_url="https://censusindia.gov.in/"`, and `retrieved_at` timestamp.
- **Ingestion Script**: `scripts/load_public_data.py`

### B. District Centroid Geocodes
- **Source**: Survey of India / Local Government Directory (LGD) administrative gazetteer.
- **Purpose**: Map positioning, distance clustering, and real-time hyperlocal meteorological queries.

### C. Open-Meteo Realtime Meteorological Signals
- **Source**: Open-Meteo Weather Forecast API (`https://api.open-meteo.com/v1/forecast`)
- **Signals**: Current temperature (°C), precipitation (mm), relative humidity (%), and WMO weather codes.
- **Usage**: Displayed as an external "Live Context Signal" inside the Priority Queue Why Drawer, modifying demand risk weighting during adverse weather. Cached in-memory for 10 minutes.
- **Licence**: Open Database License (ODbL) / CC-BY 4.0 (free, no API key required).

---

## 3. Live Data Pipeline

### Real-Time Citizen Ingestion
- **Ingestion Channels**:
  - **Web PWA**: Voice note audio (WebM/WAV), photos, GPS coordinates, text via `POST /api/requests`.
  - **WhatsApp Business Sandbox**: Twilio webhook via `POST /webhooks/whatsapp` & `POST /api/webhooks/twilio`.
  - **Telegram Bot**: Conversational webhook via `POST /webhooks/telegram` & `POST /api/webhooks/telegram`.
- **Processing**:
  - Gemini multimodal extraction (`gemini-2.5-flash` on Vertex AI / Gemini API) extracts language, sector, specific need, severity (1-5), and summary.
  - Written directly to Firestore Native mode (`requests` & `tickets` collections) with `source="live"`.
  - **Immediate Priority Recalculation**: The affected district's composite priority score is immediately recomputed and written to the `priorities` collection.
  - **Incremental Clustering**: Live requests update or create live clusters in the `clusters` collection (`source="live"`).
  - **Real-Time Polling**: Frontend polls every 5 seconds; Overview KPIs, Priority Queue, and Map update live without page reload.

---

## 4. Synthetic / Demo Datasets

### A. Cold-Start Request Corpus
- **Volume**: 2,000 synthetic citizen grievances across 10 focus districts (Pune, Latur, Bastar, Dhubri, Patna, Varanasi, Sambalpur, Barmer, Wayanad, Shimla).
- **Tag**: `source="demo"`
- **Purpose**: Provides baseline distributions for algorithmic deficit cross-referencing and clustering demonstrations.
- **Seeding**: `scripts/seed_firestore.py` (idempotent, commits directly to Firestore; never baked into Docker image).

### B. Centrally Sponsored Scheme Allocations
- **Source**: Modeled budgetary figures for Jal Jeevan Mission, PMGSY, and DDUGJY.
- **Tag**: `source="demo"`

---

## 5. Global Data Source Isolation
JanSetu provides a first-class Data Source toggle in the top navigation header:
- **Live Only**: Filters all API endpoints (`?source=live`), in-memory DuckDB tables, Map markers, Priority Queue, and KPIs to strictly show verified live citizen inputs.
- **Live + Demo (Default)**: Combines live inputs with demo baseline data. KPIs explicitly break down counts (e.g. `14 live, 2,000 demo`).

---

## 6. Gaps & Known Fallbacks
- **data.gov.in API**: No active `DATA_GOV_IN_API_KEY` was pre-provisioned in `.env`; fell back directly to the authoritative 640-district Census 2011 Primary Census Abstract CSV (`data/raw/india_census_2011.csv`).
- **NITI Aayog Aspirational Districts API**: Automated API access requires ministry SSO; district-level deficit baselines were derived from Census 2011 household amenity deficits (tap water unreachability, unpaved road connectivity, non-electrified housing).
