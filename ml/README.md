# HeartSight Machine Learning: CAD Likelihood Model (Cleveland)

This directory contains the data ingestion, model comparison, training, and artifact export pipeline for the Coronary Artery Disease (CAD) likelihood classifier.

---

## 1. How to Rerun Training

From the monorepo root:
```bash
# Using the backend virtual environment:
.\backend\.venv\Scripts\python ml/train.py

# Or within the activated environment:
python ml/train.py
```

The script will automatically:
1. Verify or download the UCI Cleveland dataset (`processed.cleveland.data`).
2. Run repeated stratified 5-fold cross-validation (5 repeats = 25 folds) comparing Logistic Regression vs. Gradient Boosting.
3. Assess calibration curves and subgroup fairness.
4. Fit the production pipeline and 200 non-parametric bootstrap models for 80% uncertainty intervals.
5. Export artifacts to `backend/models/`:
   - `cad_pipeline.joblib`
   - `bootstrap_models.joblib`
   - `shap_background.joblib`
   - `metrics.json`

---

## 2. Measured Metrics & Candidate Comparison

Evaluation was performed with **Repeated Stratified 5-Fold Cross-Validation** (5 repeats, 25 total folds) on the 303-patient Cleveland cohort.

| Candidate Model | CV AUROC (Mean ± Std) | CV Brier Score (Mean ± Std) | Decision |
|---|---|---|---|
| **Logistic Regression (L2, Scaled)** | **0.8698 ± 0.0357** | **0.1471 ± 0.0218** | **Selected** (Superior discrimination & calibration, exact linear SHAP) |
| Gradient Boosting (Trees=50, Depth=3) | 0.8521 ± 0.0373 | 0.1602 ± 0.0215 | Deprecated (Lower AUROC, higher Brier score, higher variance) |

---

## 3. Subgroup Performance & Fairness Analysis

| Subgroup | Sample Size ($n$) | Prevalence (%) | Out-of-Fold AUROC | Clinical / Epidemiological Context |
|---|---|---|---|---|
| **Male** | 206 (68.0%) | 55.3% | **0.8423** | Primary demographic in Cleveland dataset. |
| **Female** | 97 (32.0%) | 25.8% | **0.8772** | Substantially smaller sample size; wider interval caveat. |
| **Age < 55** | 143 (47.2%) | 30.8% | **0.8809** | Lower baseline disease prevalence. |
| **Age ≥ 55** | 160 (52.8%) | 59.4% | **0.8432** | Higher disease prevalence; age is an established driver. |

---

## 4. Feature Selection & Medical Honesty Rationale

- **11 Features Retained**: `age`, `sex`, `cp` (chest pain type), `trestbps` (resting systolic BP), `chol` (serum cholesterol), `fbs` (fasting blood sugar > 120), `restecg` (resting ECG), `thalach` (max heart rate), `exang` (exercise angina), `oldpeak` (ST depression), `slope` (ST slope).
- **Features Dropped**:
  - `ca` (number of major vessels colored by fluoroscopy, 0–3)
  - `thal` (thallium stress scintigraphy defect)
- **Rationale**: Fluoroscopy and thallium scintigraphy require hospital catheterization and nuclear medicine imaging. Retaining them leaks the post-diagnostic cardiology work-up, rendering the tool unusable for self-reported consumer risk assessment.

---

## 5. Uncertainty Quantification

Rather than claiming false precision with a single point estimate, HeartSight fits **200 bootstrap models** (resampled with replacement). Predictions report an **80% confidence interval** (10th percentile to 90th percentile) alongside the point estimate.
