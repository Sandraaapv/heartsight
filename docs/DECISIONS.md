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

## Phase 2: Backend API & Risk Calculations

### D-008: Published Source for ASCVD Pooled Cohort Equations
- **Decision**: Coefficients and baseline survival constants were extracted directly from the published 2013 ACC/AHA Guideline (Goff DC Jr, Lloyd-Jones DM, Bennett G, et al. *Circulation*. 2014;129(25 suppl 2):S49–S73), specifically Appendix 7, Table A ("Algorithm for Estimation of 10-Year ASCVD Risk").
- **Rationale**: Adheres to non-negotiable rule 5 of BUILD_PLAN.md never to write coefficients from memory, validated with unit tests against published worked examples (55yo vignette yielding White Female 2.1%, Black Female 3.0%, White Male 5.3%, Black Male 6.1%).

### D-009: Strict Clinical Age Range for PCE
- **Decision**: Enforced valid age bounds strictly between 40 and 79. Outside this range, the API returns `applicable: false` and `risk: null` with an explanatory clinical caveat.
- **Rationale**: The Pooled Cohort Equations were derived and validated only for adults aged 40 to 79. Fabricating numerical risk outside this range is clinically deceptive.

### D-010: Ethnicity Group Mapping and South Asian Caution
- **Decision**: Mapped ethnicity group `"other"` to the White patient equations, with mandatory inclusion of an educational caveat regarding documented risk underestimation in South Asian populations.
- **Rationale**: Follows ACC/AHA clinical guidance while ensuring transparency about cohort generalization limitations.

### D-011: Counterfactual Feature Normalization
- **Decision**: Normalized counterfactual drops and CAD SHAP attributions onto a unified scale bounded between -1.0 and +1.0 with explicit source tagging (`"shap"` vs `"counterfactual"`).
- **Rationale**: Enables harmonious rendering of multi-modal drivers on the frontend while preserving the distinct statistical origin of each signal.

### D-012: Coronary Artery Heuristic Calibration
- **Decision**: Calibrated starting weights across LAD, LCX, RCA, and LMCA (`overall_blend = 0.5 * cad + 0.5 * min(ten_year / 0.20, 1.0)`, `LMCA = max(LAD, LCX)`).
- **Rationale**: Successfully separates the three demonstration personas (Elena ~0.01, Marcus ~0.59, Ravi ~0.96) across the three visual risk ramp bands (Low, Elevated, High).

## Phase 4: 3D Scene

### D-013: Procedural Stylized Torso and Beating Heart Fallback
- **Decision**: In the absence of a pre-supplied GLB asset at `frontend/public/models/anatomy.glb`, constructed a procedural stylized 3D thoracic cage (rib arches, spine column, sternum, clavicles) and anatomical heart (ventricular myocardium, atria, ascending aorta arch, branching vessels, pulmonary trunk, vena cava) using Three.js and React Three Fiber.
- **Rationale**: Adheres to section 7 (Phase 4) fallback rule: *"Load the GLB torso and heart from frontend/public/models/anatomy.glb (the owner supplies it; if missing when this phase starts, build a procedural stylized torso and heart instead and note it in docs/DECISIONS.md)"*.
- **Implementation**: The procedural model introduces zero external network payload (retaining well below 5 MB constraint), runs at smooth 60 FPS on laptops and mobile devices, features four CatmullRom tube coronary arteries (Left Main, LAD, LCX, RCA), dynamic theme-aware risk-color mapping, pulsating cardiac cycles scaling with patient risk (62 to 105 BPM), camera fly-in, and interactive hover/click selection.

