# Telemedicine Access Platform for Rural Healthcare

This repository contains a reference implementation for a rural telemedicine platform with an offline-first React frontend, a FastAPI backend, and a MySQL database optimized for low-bandwidth and low-resource deployment.

## Architecture

- Frontend: React + Vite + Tailwind CSS + Dexie.js for IndexedDB/local-first storage
- Backend: FastAPI + SQLAlchemy 2 async + Pydantic validation + GZip compression
- Database: MySQL with SQLAlchemy async engine and Alembic migrations
- Offline mode: patient registration and sync queue are persisted locally until connectivity returns

## Project layout

- `frontend/` — React PWA client
- `backend/` — FastAPI application and migration config
- `docker-compose.yml` — local MySQL + API service config

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database

```bash
docker compose up -d mysql
cd backend
alembic upgrade head
```

## Requirements implemented

- Offline-first PWA using IndexedDB
- Touch-friendly UI with minimal front-end asset footprint
- Async FastAPI with strict Pydantic validation
- SQLAlchemy async engine with MySQL and connection pooling
- Indexed fields for healthcare query patterns
- Background task hooks for SMS and queue processing
- Local sync retry queue for network interruptions
