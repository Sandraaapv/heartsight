"""Integration tests for HeartSight API endpoints and simulation behaviors."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.personas import get_personas

client = TestClient(app)


@pytest.fixture
def sample_patient_dict():
    return {
        "age": 55,
        "sex": "male",
        "ethnicity_group": "white",
        "systolic_bp": 142.0,
        "total_cholesterol": 230.0,
        "hdl": 42.0,
        "on_bp_treatment": False,
        "diabetes": False,
        "smoker": True,
        "fasting_glucose_over_120": False,
        "chest_pain_type": "atypical_angina",
        "resting_ecg": "normal",
        "max_heart_rate": 145.0,
        "exercise_angina": False,
        "st_depression": 1.0,
        "st_slope": "flat",
    }


def test_predict_endpoint_success(sample_patient_dict):
    """Verify POST /predict returns valid schema, probabilities, and artery scores."""
    response = client.post("/predict", json=sample_patient_dict)
    assert response.status_code == 200
    data = response.json()

    # CAD probability and interval
    assert 0.0 <= data["cad"]["probability"] <= 1.0
    lo, hi = data["cad"]["interval_80"]
    assert 0.0 <= lo <= hi <= 1.0

    # 10-year risk
    assert data["ten_year"]["applicable"] is True
    assert 0.0 <= data["ten_year"]["risk"] <= 1.0

    # Heart age
    assert data["heart_age"]["bound"] in ["exact", "at_most", "at_least"]
    if data["heart_age"]["value"] is not None:
        assert 40 <= data["heart_age"]["value"] <= 79

    # Artery scores in 0..1 and Left Main heuristic rule
    arteries = data["arteries"]
    for art in ["left_main", "lad", "lcx", "rca"]:
        assert 0.0 <= arteries[art] <= 1.0
    assert arteries["left_main"] == max(arteries["lad"], arteries["lcx"])

    # Drivers list
    assert len(data["drivers"]) > 0
    for driver in data["drivers"]:
        assert -1.0 <= driver["contribution"] <= 1.0
        assert driver["source"] in ["shap", "counterfactual"]


def test_predict_young_patient_not_applicable_ten_year(sample_patient_dict):
    """Verify that age < 40 yields applicable=False and risk=None."""
    young_patient = dict(sample_patient_dict)
    young_patient["age"] = 28

    response = client.post("/predict", json=young_patient)
    assert response.status_code == 200
    data = response.json()

    assert data["ten_year"]["applicable"] is False
    assert data["ten_year"]["risk"] is None
    assert "40 to 79 only" in data["ten_year"]["note"]


def test_validation_errors_422():
    """Verify that out-of-range clinical inputs trigger clear 422 validation errors."""
    # Invalid systolic BP (30 mmHg is physiologically incompatible)
    bad_patient = {
        "age": 55,
        "sex": "male",
        "ethnicity_group": "white",
        "systolic_bp": 30.0,  # Below minimum 70.0
        "total_cholesterol": 230.0,
        "hdl": 42.0,
        "on_bp_treatment": False,
        "diabetes": False,
        "smoker": True,
        "fasting_glucose_over_120": False,
        "chest_pain_type": "atypical_angina",
        "resting_ecg": "normal",
        "max_heart_rate": 145.0,
        "exercise_angina": False,
        "st_depression": 1.0,
        "st_slope": "flat",
    }
    response = client.post("/predict", json=bad_patient)
    assert response.status_code == 422


def test_explain_endpoint(sample_patient_dict):
    """Verify POST /explain returns artery details and top drivers."""
    response = client.post("/explain?artery=lad", json=sample_patient_dict)
    assert response.status_code == 200
    data = response.json()

    assert data["artery"] == "lad"
    assert "Left Anterior Descending" in data["name"]
    assert 0.0 <= data["score"] <= 1.0
    assert len(data["drivers"]) >= 2


def test_whatif_statin_and_smoking_lowers_risk(sample_patient_dict):
    """Verify that what-if interventions lower cardiovascular risk in the expected direction."""
    whatif_body = {
        "baseline": sample_patient_dict,
        "changes": {
            "smoker": False,
            "statin": True,
            "systolic_bp": 122.0,
        },
    }
    response = client.post("/whatif", json=whatif_body)
    assert response.status_code == 200
    data = response.json()

    base_risk = data["baseline"]["ten_year"]["risk"]
    scenario_risk = data["scenario"]["ten_year"]["risk"]
    assert base_risk is not None and scenario_risk is not None
    # Interventions must lower 10-year risk
    assert scenario_risk < base_risk

    # Statin assumption must be documented
    assert any("Statin therapy assumed effect" in a for a in data["assumptions"])


def test_personas_endpoint():
    """Verify GET /personas returns three personas including high-risk Ravi."""
    response = client.get("/personas")
    assert response.status_code == 200
    personas = response.json()

    assert len(personas) == 3
    names = [p["name"] for p in personas]
    assert "Elena" in names
    assert "Marcus" in names
    assert "Ravi" in names

    ravi = next(p for p in personas if p["name"] == "Ravi")
    assert ravi["risk_level"] == "high"
    assert ravi["input_data"]["age"] == 52
    assert ravi["input_data"]["smoker"] is True


def test_model_card_endpoint():
    """Verify GET /model-card returns complete honest metrics and licenses."""
    response = client.get("/model-card")
    assert response.status_code == 200
    card = response.json()

    assert "Logistic Regression" in card["model_name"]
    assert card["cv_auroc_mean"] > 0.80
    assert len(card["features_used"]) == 11
    assert "ca" in card["features_dropped"]
    assert "thal" in card["features_dropped"]
    assert "licenses" in card
