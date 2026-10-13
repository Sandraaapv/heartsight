# HeartSight: Build Plan

Hackathon: Multimodal AI Hackathon 2026, Track A (Cardiovascular Risk Visualization & Prediction).
Tagline: **Beat the odds.**

This file is the single source of truth. The agent builds ONE phase at a time (see Working rules), stops after each, and waits for the owner to say "Go Phase N".

## 1. Product in one paragraph

HeartSight is a web app. The user enters clinical and physiological values; two predictions are computed: (1) likelihood that coronary artery disease (CAD) is present, and (2) 10-year cardiovascular risk. Both are shown on an interactive 3D human torso and heart, with the four main coronary arteries (left main, LAD, LCX, RCA) colored by risk. Users click an artery to see why, then use a what-if simulator to change habits and watch the risk fall and the arteries recover.

Track A statement (official, one sentence): build an interactive 3D visualization system that predicts coronary artery disease and overall cardiac risk from patient physiological and clinical data, mapping predictions onto an interactive 3D human anatomical model.

## 2. Locked tech stack

| Layer | Choice |
| --- | --- |
| Repo | Monorepo on GitHub: `frontend/`, `backend/`, `ml/`, `docs/` |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion |
| 3D | React Three Fiber, @react-three/drei, three |
| Charts | Recharts |
| Backend | Python 3.11, FastAPI, Pydantic v2, uvicorn |
| ML | scikit-learn, XGBoost or LightGBM (only if it beats logistic regression in CV), SHAP, pandas, numpy, joblib |
| Overall 10-year risk | ASCVD Pooled Cohort Equations, implemented from the published coefficients |
| Hosting | Frontend on Vercel, backend on Render (`render.yaml`) |
| 3D anatomy | A downloaded GLB torso/heart (license checked and credited) plus coronary arteries generated as tubes in code |
| Package managers | npm for frontend, pip + `requirements.txt` (pinned) for backend |

## 3. Non-negotiable rules (medical honesty)

1. This is an educational tool, not a diagnosis. Show a short disclaimer on every screen and on the About page.
2. Tabular data cannot locate disease in a specific artery. Per-artery colors are an ILLUSTRATIVE heuristic and must be labeled so in the UI and the About page. Never claim blockage detection.
3. Store no patient data. No database, no logging of request bodies.
4. Do not invent statistics. Every metric shown (AUROC, calibration, Brier) must come from `ml/` output files. Every constant that is an assumption must be named, commented, and listed on the About page.
5. Never hard-code the ASCVD coefficients from memory. Get them from the published 2013 ACC/AHA Pooled Cohort Equations (Goff et al.), write unit tests against published worked examples, and note the source in code. If you cannot verify a coefficient, stop and ask the owner.
6. Color-blind-safe palette; never rely on color alone (always show numbers).

## 4. Data and models

### 4.1 CAD likelihood model (Model 1)
- Data: UCI Heart Disease, Cleveland file (`processed.cleveland.data`, 303 rows, 14 columns). Try https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data and fall back to the dataset page https://archive.ics.uci.edu/dataset/45/heart+disease. If the download is blocked, ask the owner to place the file in `ml/data/`.
- Columns: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, num. Missing values are `?`.
- Target: `num > 0` becomes 1 (CAD present), else 0.
- Features used: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope.
- DROP `ca` (vessels seen on fluoroscopy) and `thal`: a user cannot self-report them and they leak the diagnostic work-up. Document this.
- Candidates: logistic regression (baseline) and gradient boosting. Pick by repeated stratified 5-fold CV (e.g. 5 repeats) on AUROC, then calibration (Brier score, calibration curve). Prefer the simpler model if they are close.
- Save to `backend/models/`: the fitted pipeline (joblib), `metrics.json` (CV AUROC mean and std, Brier, calibration bins, sex and age-group breakdowns), and a SHAP background sample.
- Uncertainty: fit 200 bootstrap models, report the 10th to 90th percentile as an "80% range" for the CAD probability.
- Fairness check: report AUROC by sex and by age band (e.g. under 55, 55 and over), flag small-sample caveats.

### 4.2 Overall 10-year risk (Model 2)
- ASCVD Pooled Cohort Equations. Inputs: age, sex, ethnicity group (white, african_american, other), total cholesterol, HDL, systolic BP, BP treatment, diabetes, smoker.
- Valid for ages 40 to 79 only. Outside that range return `applicable: false` with an explanation, never a number.
- Use the "other" ethnicity group with the white-patient equations, and show this note on screen: these equations were derived mainly in US cohorts and are reported to underestimate risk in South Asian populations, so the output is an estimate.
- PCE has no native interval: show a point estimate only. Do not fabricate a range.

### 4.3 Contributions and explanations
- CAD model: SHAP values per feature (use exact linear SHAP for logistic regression).
- 10-year risk: per-factor "counterfactual" contribution = the drop in risk if that factor were set to its ideal value (ideal profile defined in one constants file and listed on the About page).
- Normalize all contributions to a common -1 to 1 scale, tagged with `source: "shap"` or `"counterfactual"`.

### 4.4 Heart age
- Heart age = the age at which a person with the ideal profile (constants file) has the same 10-year risk as the patient, searched over ages 40 to 79. If outside the range, return `at_most` 40 or `at_least` 79.

### 4.5 Artery mapping (illustrative heuristic)
- `overall_blend = 0.5 * cad_probability + 0.5 * min(ten_year_risk / 0.20, 1)`; if 10-year risk is not applicable, use `cad_probability` alone.
- Per-artery score = clip(`overall_blend + 0.25 * sum(weight[artery][factor] * contribution[factor])`, 0, 1), weights per artery sum to 1.
- Starting weights (a configurable file, `backend/app/artery_weights.py`, documented as heuristic and to be reviewed with a cardiology source):
  - LAD: systolic BP, age, diabetes or glucose
  - LCX: cholesterol (total and HDL), age
  - RCA: smoking, glucose, ECG findings
  - Left main: score = max(LAD, LCX)
- Tune only so the three personas separate visibly; record any tuning in `docs/DECISIONS.md`.

## 5. API contract (frontend and backend must both follow this)

`PatientInput` (JSON):
```
age, sex ("male"|"female"), ethnicity_group ("white"|"african_american"|"other"),
systolic_bp, total_cholesterol, hdl, on_bp_treatment (bool), diabetes (bool),
smoker (bool), fasting_glucose_over_120 (bool),
chest_pain_type ("typical_angina"|"atypical_angina"|"non_anginal"|"asymptomatic"),
resting_ecg ("normal"|"st_t_abnormality"|"lv_hypertrophy"),
max_heart_rate, exercise_angina (bool), st_depression (float),
st_slope ("upsloping"|"flat"|"downsloping")
```
Units: mg/dL for cholesterol and HDL, mmHg for BP, bpm for heart rate. Validate ranges with Pydantic and return clear 422 messages.

Do NOT collect family history or BMI (no model uses them). Mention this as a limitation on the About page.

Endpoints:
- `GET /health`
- `POST /predict` returns:
```
{ cad: {probability, interval_80: [lo, hi]},
  ten_year: {risk | null, applicable, note},
  heart_age: {value, bound: "exact"|"at_most"|"at_least"},
  arteries: {left_main, lad, lcx, rca},          // 0..1
  drivers: [{factor, label, contribution, source, direction}],
  artery_drivers: {lad: [factor...], lcx: [...], rca: [...], left_main: [...]},
  disclaimer }
```
- `POST /explain?artery=lad|lcx|rca|left_main` (body: `PatientInput`) returns the artery name, territory, score, top 3 drivers with a plain-language sentence each, and a one-line summary.
- `POST /whatif` body `{baseline: PatientInput, changes: {partial PatientInput fields, statin?: bool}}` returns `{baseline: PredictResponse, scenario: PredictResponse, future_do_nothing: {age, ten_year_risk | null}, assumptions: [string]}`.
  - Statin is modeled as a fixed percentage reduction of total cholesterol. Put the percentage in a named constant, label it "assumed effect" in the response and UI, and leave a TODO for the owner to add a citation.
  - Exercise is NOT a model input, so do not offer an exercise slider.
- `GET /personas` returns three example patients (low, medium, high risk). The high-risk one is "Ravi", 52, smoker, high BP, high LDL profile.
- `GET /model-card` returns metrics, calibration points, ideal-profile constants, assumptions, limitations, and data and model licenses.
- CORS: allow the Vercel domain and localhost via an env var.

## 6. Design direction

Two themes, light and dark, both defined as CSS variables (design tokens) and switched with a toggle. Default to the visitor's `prefers-color-scheme`, remember the choice in `localStorage` (wrapped in try/catch), and make every component read tokens only, never raw hex values.

The hex values below are approximate, picked by eye from the two reference images. Refine them while building, keep the character, and record the final values in `docs/DECISIONS.md`.

**Light theme: calm sage (from the reference hospital site)**

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#EEF2EC` | page background |
| `--bg-tint` | `#E3EAE0` | alternating sections |
| `--surface` | `#FBFCFA` | cards and panels |
| `--sage-soft` | `#D5DFD1` | icon circles, chips |
| `--primary` | `#566F52` | buttons, links, active states |
| `--text` | `#2F3E31` | headings |
| `--text-muted` | `#5E6B5F` | body text |
| `--border` | `#DDE5DA` | card borders |
| `--stage` | `#10302C` | 3D scene backdrop, a deep green-teal so the risk colors stand out |

**Dark theme: near-black with glowing accents (from the reference dashboard, with the blue background replaced by near-black)**

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#06080A` | page background, near-black with no blue tint |
| `--surface` | `#0D1115` | cards and panels |
| `--surface-raised` | `#131A1F` | hovered or raised cards |
| `--border` | `#1C262D` | hairline borders |
| `--text` | `#E8EEF1` | primary text |
| `--text-muted` | `#8A98A3` | secondary text |
| `--accent` | `#22D3C5` | cyan-teal for live indicators, lines, glows, active states |
| `--accent-2` | `#7C5CFF` | sparing secondary accent |
| `--stage` | `#05070A` | 3D scene backdrop with a faint teal radial glow and a thin scan ring under the heart |

**Risk ramp (used on arteries, gauges and chips; the same meaning in both themes)**

| Level | Light theme | Dark theme |
| --- | --- | --- |
| Low | `#1F9D8F` | `#2DD4BF` |
| Elevated | `#E0A030` | `#F5B84B` |
| High | `#D14B4B` | `#FF4D5E` |

Always show the number beside a color. In the dark theme, the 3D scene uses a translucent, holographic look (soft emissive glow on the heart and arteries, faint floating particles) like the reference dashboard's lung visual.

**Layout and type**
- One serif display face for headings (for example Fraunces or DM Serif Display) and one clean sans for body and numbers (for example Inter or Manrope). Rounded cards (about 16px radius), soft shadows in light mode, hairline borders in dark mode, generous spacing.
- The landing hero is the beating 3D heart with one "Start" button. This is an app, not a hospital marketing site: no booking forms, doctor lists, fake testimonials or invented patient counts. Do not reuse any name, logo or photo from the reference images.
- Borrow the dashboard's callout cards: small cards linked by a thin line to a point on the 3D model, showing an artery's name, its score and a mini sparkline. Use them for the four arteries on the results screen.
- Smooth Framer Motion transitions, a fly-in camera after prediction, a heartbeat whose speed scales with risk.
- Mobile-first layout. The 3D scene must stay smooth on a mid-range phone (cap device pixel ratio, keep the GLB under 5 MB after compression with gltf-transform and Draco). On small screens, stack the callout cards under the scene instead of floating them.

## 7. Phases

Each phase: do only that phase, run the checks, update `docs/PROGRESS.md`, commit, push, tag, report, STOP.

### Phase 0: Scaffold
- Create the monorepo structure, `.gitignore`, root `README.md` skeleton, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `.env.example` files.
- `frontend/`: Next.js + TypeScript + Tailwind + Framer Motion + R3F + drei + Recharts installed; a placeholder home page.
- `backend/`: FastAPI app with `GET /health`, pinned `requirements.txt`, pytest set up with one passing test.
- Checks: `npm run build` passes; `pytest` passes; both dev servers start.
- Commit: `phase 0: scaffold monorepo`. Tag `phase-0`.

### Phase 1: Machine learning
- Implement section 4.1 in `ml/` (scripts, not notebooks): data download and cleaning, CV comparison, final fit, bootstrap ensemble, metrics, SHAP background. Save artifacts to `backend/models/`.
- Write `ml/README.md` with how to rerun and the measured numbers.
- Checks: `python ml/train.py` runs end to end from a clean checkout; `metrics.json` exists; unit test loads the saved model and predicts on one row.
- Commit: `phase 1: CAD model trained and evaluated`. Tag `phase-1`.

### Phase 2: Backend API
- Implement sections 4.2 to 4.5 and all endpoints in section 5.
- ASCVD equations with unit tests against published worked examples (see rule 5).
- Tests for: validation errors, out-of-range ages, heart age bounds, artery scores in 0..1, what-if statin and smoking changes lowering risk in the expected direction.
- Checks: `pytest` passes; sample `curl` calls for each endpoint documented in `backend/README.md`.
- Commit: `phase 2: prediction, explanation and what-if API`. Tag `phase-2`.

### Phase 3: Frontend foundation
- Light and dark design tokens exactly as in section 6, with a theme toggle, layout, disclaimer banner, landing page, stepped intake form (basics, vitals and labs, lifestyle, exercise test results) with plain-language hints, persona gallery that fills the form, typed API client (types match section 5), loading and error states, and `NEXT_PUBLIC_API_URL`.
- Checks: `npm run build` and `npm run lint` pass; submitting a persona calls `/predict` and logs a typed response.
- Commit: `phase 3: frontend foundation and intake`. Tag `phase-3`.

### Phase 4: 3D scene
- Load the GLB torso and heart from `frontend/public/models/anatomy.glb` (the owner supplies it; if missing when this phase starts, build a procedural stylized torso and heart instead and note it in `docs/DECISIONS.md`).
- Generate the four coronary arteries as tubes (CatmullRomCurve3) around the heart; color each from its 0..1 score through the risk ramp tokens in section 6 (re-read the tokens when the theme changes); use the `--stage` backdrop per theme; heartbeat animation scaled by risk; fly-in camera from torso to heart; orbit and zoom; hover names and click picking.
- Show an attribution footer for the model's license.
- Checks: runs at a smooth frame rate on a laptop; model under 5 MB; `npm run build` passes.
- Commit: `phase 4: 3D torso, heart and risk-colored arteries`. Tag `phase-4`.

### Phase 5: Results, explanation and basic what-if
- Results screen: CAD likelihood with 80% range, 10-year risk (or the not-applicable note), the South Asian caveat when relevant, driver bars, artery callout cards on the 3D model (section 6) that open the click panel via `/explain`, clinician view toggle (compact summary).
- Basic what-if: toggles and sliders for quit smoking, systolic BP, total cholesterol, HDL, statin (labeled assumed effect). Calls `/whatif`; numbers and artery colors animate to the scenario.
- Checks: the full flow works for all three personas; build and lint pass.
- Commit: `phase 5: results, explanations and what-if`. Tag `phase-5`.

### Phase 6: Early deployment
- Add `render.yaml` and deployment notes for the backend; Vercel notes for the frontend; CORS env var; a lightweight keep-warm ping from the frontend on load.
- The owner performs the actual deploys (accounts and secrets); the agent prepares everything and writes exact steps in `docs/DEPLOY.md`, then verifies the live URLs when given.
- Commit: `phase 6: deployment config and docs`. Tag `phase-6`.

### Phase 7: Wow features (tier 1)
1. Heart age display next to real age.
2. Future you: split view, "do nothing" versus "change habits", two hearts side by side, with the 10-year risk for each (label as a projection).
3. Living arteries: blood-flow particles whose speed drops, and tube radius that narrows, as artery risk rises (label as illustrative).
4. Share card: a downloadable image generated in the browser (heart age, risk, disclaimer); nothing uploaded.
5. Polish the persona gallery.
- Checks: still smooth on a mid-range phone (reduce particles on small screens).
- Commit: `phase 7: wow features`. Tag `phase-7`.

### Phase 8: About page, polish and final README
- About the model page driven by `/model-card`: data source and license, CV AUROC with spread, calibration plot, Brier score, subgroup results, assumptions (ideal profile, statin effect, artery weights), limitations, the ethics statement, no-data-stored statement, credits.
- Accessibility pass, mobile layout pass, loading skeletons, meta tags and a social preview image.
- Final README: what it is, screenshots placeholders, architecture, how to run locally, how it maps to Track A, honest limitations.
- Commit: `phase 8: about page, polish and docs`. Tag `phase-8`.

### Phase 9 (optional, only if the owner asks)
Tier 2 features: Ask HeartSight chat (API key on the backend only, model outputs as the only context, refuses to diagnose), lab-report upload with a confirm step, Tamil and Hindi toggle (strings checked by a native speaker).
