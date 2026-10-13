"""Inference, uncertainty quantification, and SHAP explanation for the CAD model."""

import os
from typing import Any, Dict, List, Tuple
import joblib
import numpy as np
import pandas as pd
import shap
from app.constants import MODELS_DIR
from app.schemas import PatientInput

FEATURE_NAMES = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
]

# Map API schema enums to Cleveland numerical encodings
CHEST_PAIN_MAP = {
    "typical_angina": 1.0,
    "atypical_angina": 2.0,
    "non_anginal": 3.0,
    "asymptomatic": 4.0,
}

RESTECG_MAP = {
    "normal": 0.0,
    "st_t_abnormality": 1.0,
    "lv_hypertrophy": 2.0,
}

SLOPE_MAP = {
    "upsloping": 1.0,
    "flat": 2.0,
    "downsloping": 3.0,
}


class CadModelService:
    def __init__(self):
        self.pipeline = None
        self.bootstrap_models = None
        self.shap_explainer = None
        self.scaler = None
        self.clf = None
        self._load_artifacts()

    def _load_artifacts(self):
        pipeline_path = os.path.join(MODELS_DIR, "cad_pipeline.joblib")
        boot_path = os.path.join(MODELS_DIR, "bootstrap_models.joblib")
        shap_path = os.path.join(MODELS_DIR, "shap_background.joblib")

        if os.path.exists(pipeline_path):
            self.pipeline = joblib.load(pipeline_path)
            self.scaler = self.pipeline.named_steps["scaler"]
            self.clf = self.pipeline.named_steps["clf"]

        if os.path.exists(boot_path):
            self.bootstrap_models = joblib.load(boot_path)

        if os.path.exists(shap_path) and self.clf is not None:
            shap_data = joblib.load(shap_path)
            bg_data = shap_data["background_data"]
            bg_scaled = self.scaler.transform(bg_data)
            self.shap_explainer = shap.LinearExplainer(self.clf, bg_scaled)

    def patient_to_dataframe(self, patient: PatientInput) -> pd.DataFrame:
        row = {
            "age": float(patient.age),
            "sex": 1.0 if patient.sex.value == "male" else 0.0,
            "cp": CHEST_PAIN_MAP[patient.chest_pain_type.value],
            "trestbps": float(patient.systolic_bp),
            "chol": float(patient.total_cholesterol),
            "fbs": 1.0 if patient.fasting_glucose_over_120 else 0.0,
            "restecg": RESTECG_MAP[patient.resting_ecg.value],
            "thalach": float(patient.max_heart_rate),
            "exang": 1.0 if patient.exercise_angina else 0.0,
            "oldpeak": float(patient.st_depression),
            "slope": SLOPE_MAP[patient.st_slope.value],
        }
        return pd.DataFrame([row], columns=FEATURE_NAMES)

    def predict_cad(self, patient: PatientInput) -> Tuple[float, List[float]]:
        """Predict CAD probability and 80% bootstrap confidence interval."""
        if self.pipeline is None:
            raise RuntimeError("CAD pipeline model not loaded.")

        df = self.patient_to_dataframe(patient)
        prob = float(self.pipeline.predict_proba(df)[0, 1])

        if self.bootstrap_models:
            boot_probs = [float(m.predict_proba(df)[0, 1]) for m in self.bootstrap_models]
            lo = float(np.percentile(boot_probs, 10))
            hi = float(np.percentile(boot_probs, 90))
            interval = [round(lo, 4), round(hi, 4)]
        else:
            interval = [round(max(0.0, prob - 0.05), 4), round(min(1.0, prob + 0.05), 4)]

        return round(prob, 4), interval

    def get_shap_contributions(self, patient: PatientInput) -> Dict[str, float]:
        """Compute exact linear SHAP feature attributions on patient features."""
        if self.shap_explainer is None:
            return {}

        df = self.patient_to_dataframe(patient)
        scaled = self.scaler.transform(df)
        shap_vals = self.shap_explainer.shap_values(scaled)[0]

        # Map back to feature names
        contributions = {}
        for feat, val in zip(FEATURE_NAMES, shap_vals):
            contributions[feat] = float(val)

        return contributions


# Global singleton instance
cad_service = CadModelService()
