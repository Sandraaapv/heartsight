# HeartSight

> **Beat the odds.**

An interactive 3D cardiovascular risk visualization and prediction system for Multimodal AI Hackathon 2026 (Track A: Cardiovascular Risk Visualization & Prediction).

---

## Overview

HeartSight maps patient physiological and clinical data into:
1. **Coronary Artery Disease (CAD) presence likelihood** (trained machine learning model with uncertainty intervals and SHAP feature contributions).
2. **10-Year ASCVD Risk** (ACC/AHA 2013 Pooled Cohort Equations point estimate).
3. **Interactive 3D Anatomical Visualization** with risk-colored coronary arteries (LAD, LCX, RCA, Left Main), anatomical callouts, and what-if simulation to explore the physiological impact of lifestyle and therapeutic changes.

> **Medical Disclaimer**: HeartSight is an educational and exploratory tool, not a clinical diagnostic system. Per-artery risk highlights are illustrative heuristics. No patient data is retained or stored.

---

## Monorepo Architecture

- `frontend/`: Next.js (App Router), TypeScript, Tailwind CSS, React Three Fiber (`@react-three/fiber`), `@react-three/drei`, Three.js, Framer Motion, and Recharts.
- `backend/`: Python 3.11 FastAPI service, Pydantic v2 schemas, ASCVD calculations, and ML inference runtime.
- `ml/`: Model training pipelines, cross-validation evaluation, bootstrap ensemble generation, and SHAP background data generation.
- `docs/`: Build progress tracking (`PROGRESS.md`) and architectural decisions (`DECISIONS.md`).

---

## Quickstart

### Backend
```bash
cd backend
python -m venv .venv
# Activate virtual environment:
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API health check: `GET http://localhost:8000/health`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Testing & Quality

- Backend tests:
  ```bash
  cd backend
  pytest
  ```
- Frontend build & lint:
  ```bash
  cd frontend
  npm run build
  npm run lint
  ```
