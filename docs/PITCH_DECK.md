# JanSetu (जनसेतु) — Pitch Deck & Architecture Brief

**Hackathon Track:** Google Build with AI: Code for Communities  
**Live URL:** [https://jansetu-538154252811.asia-south1.run.app](https://jansetu-538154252811.asia-south1.run.app)  
**License:** Apache 2.0 (Digital Public Good)

---

## Slide 1: The Vision
- **Header:** JanSetu (जनसेतु) — Algorithmic Equalization for Public Infrastructure
- **Tagline:** Turning 1.4 Billion Citizen Voices into Verifiable, Deficit-Targeted Fiscal Budgets
- **Context:** Built natively on Google Cloud Run, Vertex AI (Gemini 2.5 Flash), and Google Cloud Text-to-Speech

---

## Slide 2: The Core Problem
- **The Grievance Black Hole:** Citizens file millions of complaints across physical offices, helplines, and social media that vanish into administrative silos.
- **The Budget Allocation Blindspot:** Infrastructure budgets (roads, PHCs, water pipelines) are determined by historical inertia or political lobbying rather than empirical need.
- **The Vernacular Barrier:** 90%+ of rural citizens cannot navigate English-centric e-governance portals.

---

## Slide 3: The JanSetu Solution
- **Multimodal Vernacular Ingestion:** Voice notes, photos, and SMS across PWA, WhatsApp, and Telegram in 10+ Indian languages.
- **AI Extraction & Auto-Redressal:** Instant structured extraction of sector, severity, and coordinates using Gemini 2.5 Flash, paired with immediate regional audio feedback via Cloud Text-to-Speech.
- **Algorithmic Fiscal Equalization:** Cross-references citizen demand signals with census and infrastructure deficit metrics to compute a transparent Priority Score.
- **Explainable Policy AI:** "Why Drawers" break down mathematical factors and provide clickable audit trails with real quotes and matched Centrally Sponsored Schemes.

---

## Slide 4: Algorithmic Architecture
- **Formula:**
  $$\text{Priority Score} = \text{Demand Intensity} \times \text{Deficit Index} \times \text{Vulnerability} \times (1 - \text{Fiscal Coverage})$$
- **Components:**
  1. *Demand Intensity:* Cluster frequency $\times$ average citizen severity.
  2. *Infrastructure Deficit Index:* Official district deficit metrics (0.0 to 1.0) in roads, health, water, education, and electricity.
  3. *Socioeconomic Vulnerability:* Composite rural population ratio, SC/ST percentage, and poverty headcount.
  4. *Uncovered Fiscal Gap:* Penalizes projects with existing budget surplus; elevates historically underserved regions.

---

## Slide 5: Autonomous Conversational SQL
- **Natural Language Governance:** Decision makers query national infrastructure trends without writing SQL.
- **Gemini 2.5 Autonomous Function Calling:**
  - Evaluates user prompt $\rightarrow$ Calls `describe_schema()` $\rightarrow$ Generates parameterized SELECT query $\rightarrow$ Calls `run_sql()` over SQLite $\rightarrow$ Returns synthesized findings, executed SQL code box, and dynamic table.
- **Security & Integrity:** Whitelisted tables, read-only SELECT validation, and strict `LIMIT 200` constraints.

---

## Slide 6: Production Engineering & Live Deployment
- **Container Architecture:** Multi-stage Docker container deployed to Cloud Run in `asia-south1` with `min-instances=1` and `1Gi` memory.
- **Zero-Mock Verification:** 100% of data views, tables, and KPIs wired to live SQLite database seeded with 2,000+ real records.
- **Full-Spectrum Testing:** Automated verification suite running 15 backend tests and 36 browser tests across Desktop (1440px) and Mobile (390px) viewports with zero console errors.

---

## Slide 7: Scalability & Road Ahead
- **Interoperability:** Open APIs compliant with National Data & Analytics Platform (NDAP) standards.
- **State Govt Integration:** Modular webhooks ready for state-level CM Grievance portals (e.g., CM Helpline, Jan Sunwai).
- **Offline & Low-Bandwidth:** Compact PWA with native audio caching for frontline panchayat workers.
