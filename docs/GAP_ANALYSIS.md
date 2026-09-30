# JanSetu Full Gap Analysis & Audit (STEP 0)

## Audit Date: September 30, 2026

### 1. Hardcoded Data Arrays & Target Keywords

The following hardcoded data arrays and keywords were detected across the frontend and must be replaced by live API endpoints:

1. **`frontend/src/pages/Overview.tsx:92-105`**
   - **Pattern / Hardcoded Data**: Hardcoded Queue Table:
     `{ d: "Mumbai Sub", s: "Water", sev: "Critical", eta: "24h" }`
     `{ d: "New Delhi", s: "Roads", sev: "High", eta: "3 Days" }`
     `{ d: "Chennai South", s: "Power", sev: "High", eta: "2 Days" }`
     `{ d: "Bengaluru East", s: "Water", sev: "Medium", eta: "1 Week" }`
     `{ d: "Pune Central", s: "Roads", sev: "Medium", eta: "2 Weeks" }`
   - **Also `Overview.tsx:11-17`**: Hardcoded `chartData`:
     `[ { district: "Nagpur", roads: 400, water: 240, power: 100 }, { district: "Udupi", ... } ]`
   - **Also `Overview.tsx:55`**: Hardcoded KPI "156" ("Pending Approvals").
   - **Action**: Fetch from `/api/dashboard/stats` and `/api/priority`. Rows made clickable.

2. **`frontend/src/pages/Clusters.tsx:5-10`**
   - **Pattern / Hardcoded Data**: Hardcoded priority clusters array:
     `{ id: "PRI-001", name: "Vidarbha Water Crisis", district: "Nagpur, MH", score: 92.4, requests: 1240, deficit: 0.85, sector: "Water" }`
     `{ id: "PRI-002", name: "Coastal Highway Washout", district: "Udupi, KA", score: 88.1, requests: 850, deficit: 0.72, sector: "Roads" }`
     `{ id: "PRI-003", name: "Substation Failure", district: "Bhopal, MP", score: 85.5, requests: 2100, deficit: 0.45, sector: "Power" }`
   - **Action**: Replace with data fetched from `/api/priority` with sorting, filtering, and pagination.

3. **`frontend/src/pages/Feed.tsx:4-10`**
   - **Pattern / Hardcoded Data**: `const mockFeed = [ { id: "RPT-9201", text: "Severe water logging...", ... }, ... ]`
   - **Action**: Replace with live `/api/requests` query supporting district and sector filtering.

4. **`frontend/src/pages/AskData.tsx:84-95`**
   - **Pattern / Hardcoded Data**: Hardcoded SQL execution table with static rows:
     `<td className="px-4 py-2 border-b border-[#D9DEE5]">Nagpur</td>`
     `<td className="px-4 py-2 border-b border-[#D9DEE5]">Water Supply</td>`
   - **Action**: Connect to `/api/chat` supporting Gemini structured tool calls (`run_sql` and `describe_schema`). Render real returned SQL and dynamic rows.

5. **`frontend/src/pages/Landing.tsx:217-230`**
   - **Pattern / Hardcoded Data**: Hardcoded Citizen "Recent Reports":
     `{ id: "RPT-842", dept: "PWD", prio: "High", status: "Pending" }`
     `{ id: "RPT-791", dept: "Water", prio: "Medium", status: "Resolved" }`
     `{ id: "RPT-650", dept: "Power", prio: "Critical", status: "In Progress" }`
   - **Action**: Fetch recent reports from `/api/requests?district={selectedDistrict}&limit=5`.

6. **`frontend/src/pages/HotspotMap.tsx:53-75`**
   - **Pattern / Hardcoded Data**: Hardcoded "Critical Zones":
     `Mumbai Suburban` (Score: 92.4 / JJM Deficit)
     `Bengaluru South` (Score: 88.1 / PWD Drainage)
     `East Godavari` (Score: 85.5 / Power Grid)
   - **Action**: Fetch from `/api/hotspots` and `/api/priority` with interactive click-to-pan / drawer.

7. **`frontend/src/pages/Mismatch.tsx:1-18`**
   - **Pattern / Hardcoded Data**: Static placeholder ("Analysis Module Initializing").
   - **Action**: Connect to `/api/priority/mismatch` with quadrant scatter plot & cluster details.

8. **`frontend/src/pages/Channels.tsx:1-33`**
   - **Pattern / Hardcoded Data**: Static volume cards ("4.2M/day", etc.).
   - **Action**: Provide real link `t.me/jansetu_gdg_bot`, WhatsApp sandbox instructions, and live interactive channel simulators (Web, WhatsApp, Telegram) that POST to `/api/requests` and verify in the live pipeline.

---

### 2. Buttons, Inputs, and Controls Lacking Handlers

1. **`frontend/src/App.tsx`**:
   - `District Dropdown`: Currently static text (`District: New Delhi`). Lacks fetching from `/api/districts`, global state, and context synchronization across views.
   - `Language Dropdown`: Static text (`English`). Lacks i18n dictionary and change handler for EN, हिं, தமிழ், मराठी.
   - `Notification Bell`: Button has no click handler; lacks notification drawer displaying critical requests from `/api/requests?severity=5`.
   - `User Profile Button`: Lacks dropdown showing user role (Citizen vs Policymaker) and Logout action.
   - `Modules Search Input`: No onChange filter.

2. **`frontend/src/pages/Landing.tsx`**:
   - `Geolocation Button ("Fetch GPS")`: Does not trigger geolocation callback or update form lat/lng coordinates.
   - `Photo Attachment Input`: File selection has no preview or visual confirmation.
   - `View All Reports Link`: Dead link.
   - `Submission Error & Retry`: Missing user-friendly error card with retry mechanism.

3. **`frontend/src/pages/Overview.tsx`**:
   - `Export Summary Button`: No onClick action (must trigger CSV/PDF export).
   - `Generate Report Button`: No onClick action.
   - `Sector Filter Select`: No onChange handler.
   - `Queue Table Rows`: Rows are non-interactive.

4. **`frontend/src/pages/Clusters.tsx`**:
   - `Filter Queue Button`: No onClick handler or filter drawer.
   - `Review Button`: Does not open Why Drawer showing factor bars, evidence quotes, and matching schemes.
   - `Export Brief Button`: Missing handler to download real brief from `/api/brief/export`.

5. **`frontend/src/pages/HotspotMap.tsx`**:
   - `Sector Overlay Select`: No onChange handler.
   - `Active Layers Checkboxes`: No onChange handler.
   - `Critical Zones List`: Items are not clickable.
   - `Google Maps / Leaflet Fallback`: Leaflet fallback uses placeholder tiles; needs automatic detection and fallback to clean OpenStreetMap tiles.

6. **`frontend/src/pages/AskData.tsx`**:
   - `Suggested Queries Buttons`: Click does not execute the query.
   - `Export Data Button`: No onClick handler.
   - `Result Table`: Static and not connected to SQL output.

7. **`frontend/src/pages/Feed.tsx`**:
   - `Search Input`: No onChange handler.
   - `Filter Button`: No action.
   - `Export Button`: No download action.
   - `View Details / Assign Buttons`: No click handlers.

---

### 3. Missing Infrastructure & Routes

1. **/login & /signup**: Missing authentication page for Citizen (phone/name) and Policymaker (email/password), JWT session handling, and role-based route guarding.
2. **/api/districts**: Endpoint missing for populating district selection.
3. **/api/chat Function Calling**: Backend missing real SQLite schema inspection and parse-checked read-only SQL execution tools.
4. **Cloud Run Container Seeding**: Docker build must run database seeding during build time so container ships with populated SQLite DB.
