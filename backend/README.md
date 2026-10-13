# HeartSight Backend Service

FastAPI service delivering dual cardiovascular risk predictions (Coronary Artery Disease likelihood via Cleveland ML model and 10-year hard ASCVD risk via 2013 ACC/AHA Pooled Cohort Equations), SHAP feature attribution, counterfactuals, heart age, illustrative artery risk mapping, and what-if simulation.

---

## 1. Local Setup and Execution

```bash
cd backend
# Activate virtual environment
.\.venv\Scripts\activate       # Windows
source .venv/bin/activate      # Linux / macOS

# Install pinned dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI Swagger UI is available at: `http://localhost:8000/docs`.

---

## 2. Automated Testing

Run the test suite (health check, PCE worked examples, pipeline inference, uncertainty intervals, what-if directional checks, and API validation):
```bash
pytest -v
```

---

## 3. Sample cURL Commands

### 3.1 Health Check (`GET /health`)
```bash
curl -X GET http://localhost:8000/health
```

### 3.2 Dual Prediction & Artery Scoring (`POST /predict`)
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 55,
    "sex": "male",
    "ethnicity_group": "white",
    "systolic_bp": 142.0,
    "total_cholesterol": 230.0,
    "hdl": 42.0,
    "on_bp_treatment": false,
    "diabetes": false,
    "smoker": true,
    "fasting_glucose_over_120": false,
    "chest_pain_type": "atypical_angina",
    "resting_ecg": "normal",
    "max_heart_rate": 145.0,
    "exercise_angina": false,
    "st_depression": 1.0,
    "st_slope": "flat"
  }'
```

### 3.3 Artery Territory Explanation (`POST /explain`)
```bash
curl -X POST "http://localhost:8000/explain?artery=lad" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 55,
    "sex": "male",
    "ethnicity_group": "white",
    "systolic_bp": 142.0,
    "total_cholesterol": 230.0,
    "hdl": 42.0,
    "on_bp_treatment": false,
    "diabetes": false,
    "smoker": true,
    "fasting_glucose_over_120": false,
    "chest_pain_type": "atypical_angina",
    "resting_ecg": "normal",
    "max_heart_rate": 145.0,
    "exercise_angina": false,
    "st_depression": 1.0,
    "st_slope": "flat"
  }'
```

### 3.4 What-If Scenario Simulation (`POST /whatif`)
```bash
curl -X POST http://localhost:8000/whatif \
  -H "Content-Type: application/json" \
  -d '{
    "baseline": {
      "age": 55,
      "sex": "male",
      "ethnicity_group": "white",
      "systolic_bp": 142.0,
      "total_cholesterol": 230.0,
      "hdl": 42.0,
      "on_bp_treatment": false,
      "diabetes": false,
      "smoker": true,
      "fasting_glucose_over_120": false,
      "chest_pain_type": "atypical_angina",
      "resting_ecg": "normal",
      "max_heart_rate": 145.0,
      "exercise_angina": false,
      "st_depression": 1.0,
      "st_slope": "flat"
    },
    "changes": {
      "smoker": false,
      "statin": true,
      "systolic_bp": 120.0
    }
  }'
```

### 3.5 Demonstration Personas (`GET /personas`)
```bash
curl -X GET http://localhost:8000/personas
```

### 3.6 Transparent Model Card (`GET /model-card`)
```bash
curl -X GET http://localhost:8000/model-card
```

---

## 4. Methodological Sources & Citations

1. **2013 ACC/AHA Pooled Cohort Equations**:
   - Goff DC Jr, et al. *2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk*. Circulation. 2014;129(25 suppl 2):S49–S73.
   - Coefficients and baseline survival $S_{10}$ taken directly from Appendix 7, Table A.
2. **Cleveland Heart Disease Model**:
   - UCI Machine Learning Repository, Cleveland Clinic Foundation dataset (Detrano et al.).
   - Invasive imaging leak features (`ca`, `thal`) dropped to prevent post-diagnostic work-up bias.
