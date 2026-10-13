import json
import os
import joblib
import numpy as np
import pandas as pd
import pytest
import shap

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")


def test_metrics_json_exists_and_valid():
    """Verify metrics.json exists, contains all required fields, and honest CV numbers."""
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    assert os.path.exists(metrics_path), f"metrics.json missing at {metrics_path}"

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    assert "model_name" in metrics
    assert "cross_validation" in metrics
    assert metrics["cross_validation"]["selected_model"] == "logistic_regression"
    assert 0.75 < metrics["cross_validation"]["auroc_mean"] < 0.95
    assert 0.05 < metrics["cross_validation"]["brier_mean"] < 0.30

    assert "features_used" in metrics
    assert len(metrics["features_used"]) == 11
    assert "ca" not in metrics["features_used"]
    assert "thal" not in metrics["features_used"]

    assert "calibration" in metrics
    assert "fairness_subgroups" in metrics
    assert "by_sex" in metrics["fairness_subgroups"]
    assert "by_age" in metrics["fairness_subgroups"]


def test_cad_pipeline_prediction():
    """Verify that cad_pipeline loads and predicts a probability between 0 and 1."""
    pipeline_path = os.path.join(MODELS_DIR, "cad_pipeline.joblib")
    assert os.path.exists(pipeline_path), f"cad_pipeline.joblib missing at {pipeline_path}"

    pipeline = joblib.load(pipeline_path)

    # Sample input row (Cleveland schema)
    # 52 yo male, typical angina (cp=1), BP 140, Chol 240, FBS 0, ECG normal (0), HR 150, Exang 0, Oldpeak 1.2, Slope flat (2)
    sample_row = pd.DataFrame([{
        "age": 52.0,
        "sex": 1.0,
        "cp": 1.0,
        "trestbps": 140.0,
        "chol": 240.0,
        "fbs": 0.0,
        "restecg": 0.0,
        "thalach": 150.0,
        "exang": 0.0,
        "oldpeak": 1.2,
        "slope": 2.0,
    }])

    prob = pipeline.predict_proba(sample_row)[0, 1]
    assert 0.0 <= prob <= 1.0
    assert isinstance(prob, float)


def test_bootstrap_ensemble_uncertainty_interval():
    """Verify that 200 bootstrap models produce a valid 80% range [lo, hi]."""
    bootstrap_path = os.path.join(MODELS_DIR, "bootstrap_models.joblib")
    assert os.path.exists(bootstrap_path)

    bootstrap_models = joblib.load(bootstrap_path)
    assert len(bootstrap_models) == 200

    sample_row = pd.DataFrame([{
        "age": 60.0,
        "sex": 1.0,
        "cp": 4.0,
        "trestbps": 160.0,
        "chol": 280.0,
        "fbs": 1.0,
        "restecg": 1.0,
        "thalach": 120.0,
        "exang": 1.0,
        "oldpeak": 2.5,
        "slope": 2.0,
    }])

    boot_probs = [float(m.predict_proba(sample_row)[0, 1]) for m in bootstrap_models]
    lo = float(np.percentile(boot_probs, 10))
    hi = float(np.percentile(boot_probs, 90))

    assert 0.0 <= lo <= hi <= 1.0
    assert (hi - lo) >= 0.0


def test_shap_background_and_explainer():
    """Verify SHAP LinearExplainer generates contributions for all 11 features."""
    pipeline_path = os.path.join(MODELS_DIR, "cad_pipeline.joblib")
    shap_path = os.path.join(MODELS_DIR, "shap_background.joblib")

    pipeline = joblib.load(pipeline_path)
    shap_data = joblib.load(shap_path)

    bg_df = shap_data["background_data"]
    scaler = pipeline.named_steps["scaler"]
    clf = pipeline.named_steps["clf"]

    bg_scaled = scaler.transform(bg_df)
    explainer = shap.LinearExplainer(clf, bg_scaled)

    sample_row = pd.DataFrame([{
        "age": 55.0,
        "sex": 1.0,
        "cp": 3.0,
        "trestbps": 130.0,
        "chol": 210.0,
        "fbs": 0.0,
        "restecg": 0.0,
        "thalach": 160.0,
        "exang": 0.0,
        "oldpeak": 0.5,
        "slope": 1.0,
    }])

    sample_scaled = scaler.transform(sample_row)
    shap_vals = explainer.shap_values(sample_scaled)

    # Should have 11 feature contribution values
    assert len(shap_vals[0]) == 11
