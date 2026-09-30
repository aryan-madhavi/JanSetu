# JanSetu Architecture

JanSetu follows a modular, single-container deployment model suited for high scalability and simple deployments as a Digital Public Good.

## System Components
1. **Frontend (React + Vite)**: A lightweight, responsive dashboard and Progressive Web App (PWA).
2. **Backend (FastAPI)**: Serves API endpoints, handles webhook integrations, and serves the frontend static files.
3. **Database (SQLite)**: Used for the hackathon prototype (easily swappable for Cloud SQL/PostgreSQL).
4. **AI Layer**: Gemini 2.5 Flash for data extraction, Gemini 2.5 Pro for the "Ask the Data" dashboard.
