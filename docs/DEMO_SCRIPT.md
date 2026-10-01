# JanSetu (जनसेतु) — Live Demo Walkthrough Script

**Target Duration:** 2 Minutes  
**Live URL:** [https://jansetu-538154252811.asia-south1.run.app](https://jansetu-538154252811.asia-south1.run.app)

---

### Act 1: The Citizen Experience (0:00 - 0:40)
1. **Navigate to Citizen Portal (`/`):**
   - *"JanSetu is designed for India's next billion users. Citizens can report infrastructure emergencies in any of 10 Indian languages without filling complex government forms."*
2. **Push-to-Talk Voice Recording:**
   - Click the microphone button. Speak: *"हमारे गांव में पानी की मुख्य पाइपलाइन टूट गई है, पीने का पानी नहीं मिल रहा है।"*
   - Click Stop. Watch the live audio upload to Gemini 2.5 Flash on Vertex AI.
3. **Structured Verification & Audio Redressal:**
   - Point out the instant extraction card: Sector: `Water`, Severity: `4/5`, Location: `Pune / Bastar`.
   - Click Play on the **Cloud Text-to-Speech** audio confirmation: hear the synthesized native response: *"नमस्ते! आपका आवेदन सफलतापूर्वक दर्ज कर लिया गया है..."*
   - Notice the generated ticket number (e.g. `REQ-0C3BE2`) and immediate appearance under "Recent Reports".

---

### Act 2: Policymaker Command Center & Fiscal Equalization (0:40 - 1:15)
1. **Authentication:**
   - Click Profile > Login (or navigate to `/login`). Click **"Policymaker"** to autofill `policymaker@jansetu.demo / demo1234`. Click Sign In.
2. **National Overview & Real-Time KPIs:**
   - Point out the live metrics: **2,000+ Ingested Grievances**, **790+ Critical Alerts**, and **270 Semantic Clusters**.
   - Change District in the top header from "All Districts" to "Bastar": notice all metrics, ingestion trends, and priority queues re-compute dynamically from the live database.
   - Switch language to **हिंदी** to demonstrate instantaneous vernacular localization across navigation, badges, and headers.
3. **Algorithmic Priority Queue & The "Why Drawer":**
   - Click **Priority Queue** in the sidebar.
   - Click **Review** on Rank #1 (*Bastar Health Intervention*).
   - Walk through the algorithmic decomposition:
     - Citizen Demand Intensity: `5.66`
     - Infrastructure Deficit Index: `0.55`
     - Socioeconomic Vulnerability: `0.75`
     - Uncovered Fiscal Gap: `0.75`
   - Point out the automatically matched Centrally Sponsored Scheme: `Ayushman Bharat HWC`, along with verified citizen quotes with severity 5/5.

---

### Act 3: Geospatial Intelligence & Conversational SQL (1:15 - 1:55)
1. **Geospatial View:**
   - Click **Geospatial View**. Notice the dark India map with color-coded demand bubbles.
   - Click on the high-intensity Bastar hotspot: inspect the real-time drill-down drawer with fiscal allocations.
2. **Conversational Data Query (Autonomous Function Calling):**
   - Click **Data Query** in the sidebar.
   - Click the suggested query: *"Which districts have the highest number of water problems?"*
   - Click **Execute Query**.
   - Show that Gemini 2.5 Flash used autonomous function calling (`run_sql`) to inspect SQLite schema and execute:
     `SELECT district, COUNT(*) AS water_problem_count FROM requests WHERE sector = 'water' GROUP BY district ORDER BY water_problem_count DESC LIMIT 200`
   - Point out the synthesized bullet points, the executed SQL box, and the dynamic data table with one-click CSV export.

---

### Closing (1:55 - 2:00)
- *"JanSetu bridges citizen demand and public budgets with transparent, verifiable AI. Open source, live on Cloud Run, and ready for deployment."*
