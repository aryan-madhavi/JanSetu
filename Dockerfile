FROM python:3.12-slim as backend-builder

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM node:20-slim as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

COPY data/ ./data/
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./frontend_dist/

ENV DB_PATH=/app/backend/jansetu.sqlite
ENV DATA_DIR=/app/data
ENV PORT=8080

WORKDIR /app/backend
# Build & Seed SQLite database DURING docker build
RUN python seed.py

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
