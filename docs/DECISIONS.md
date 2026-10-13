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

## Phase 1: Machine Learning (CAD Model)

### D-004: Feature Selection & Clinical Leakage Prevention
- **Decision**: Dropped `ca` (fluoroscopy vessels) and `thal` (thallium scan defect), using 11 clinical and physiological features (`age`, `sex`, `cp`, `trestbps`, `chol`, `fbs`, `restecg`, `thalach`, `exang`, `oldpeak`, `slope`).
- **Rationale**: Fluoroscopy and thallium scans require invasive or specialized hospital imaging that users cannot self-report. Including them leaks the post-diagnostic work-up.

### D-005: Model Selection via Cross-Validation
- **Decision**: Selected regularized Logistic Regression (`StandardScaler` + `LogisticRegression(C=1.0)`) over Gradient Boosting.
- **Rationale**: Across 5-repeat Stratified 5-Fold Cross-Validation, Logistic Regression demonstrated higher AUROC (0.8698 ± 0.0357 vs 0.8521 ± 0.0373) and better probability calibration (Brier score 0.1471 ± 0.0218 vs 0.1602 ± 0.0215), while providing exact linear SHAP attribution and resistance to small-sample overfitting on the 303-patient Cleveland cohort.

### D-006: Uncertainty Quantification via Bootstrap
- **Decision**: Trained 200 non-parametric bootstrap ensemble pipelines on resampled Cleveland data to report an 80% confidence interval (10th to 90th percentile).
- **Rationale**: Prevents misleading point-estimate precision and communicates honest epistemic uncertainty for educational risk visualization.

### D-007: SHAP Attribution Background
- **Decision**: Exported a 50-sample background distribution alongside the linear model for exact interventional SHAP feature attribution in the inference engine.
- **Rationale**: Guarantees fast, consistent, and interpretable per-factor drivers for the API contract.
