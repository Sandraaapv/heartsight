# Architecture and Implementation Decisions

This document records key decisions, rationales, and deviations made during development.

## Phase 0: Monorepo Scaffold

### D-001: Monorepo Structure
- **Decision**: Monorepo partitioned into `frontend/` (Next.js App Router), `backend/` (FastAPI), `ml/` (training pipeline & data scripts), and `docs/` (documentation, progress, and architectural decisions).
- **Rationale**: Matches section 2 of `BUILD_PLAN.md`.

### D-002: Python Environment & Versioning
- **Decision**: Python 3.11 target with virtual environment at `backend/.venv` using `py -3.11`.
- **Rationale**: Section 2 locks backend to Python 3.11.

### D-003: Frontend Dependencies
- **Decision**: Installed React Three Fiber (`@react-three/fiber`), `@react-three/drei`, `three`, `framer-motion`, and `recharts` alongside Next.js TypeScript setup.
- **Rationale**: Locked tech stack in section 2 of `BUILD_PLAN.md`.
