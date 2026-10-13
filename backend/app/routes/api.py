"""API routes for predictions, explanations, what-if simulations, personas, and model cards."""

import json
import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.constants import (
    EDUCATIONAL_DISCLAIMER,
    IDEAL_PROFILE,
    MODELS_DIR,
    STATIN_ASSUMPTION_NOTE,
)
from app.personas import get_personas
from app.prediction_service import explain_artery, predict_patient, simulate_whatif
from app.schemas import (
    ExplainResponse,
    ModelCardResponse,
    PatientInput,
    Persona,
    PredictResponse,
    WhatIfRequest,
    WhatIfResponse,
)

router = APIRouter()


@router.post("/predict", response_model=PredictResponse, summary="Predict CAD and 10-year risk")
def post_predict(patient: PatientInput) -> PredictResponse:
    """Compute CAD likelihood, 10-year ASCVD risk, heart age, and artery highlights."""
    return predict_patient(patient)


@router.post("/explain", response_model=ExplainResponse, summary="Explain specific artery score")
def post_explain(
    patient: PatientInput,
    artery: str = Query("lad", pattern="^(lad|lcx|rca|left_main)$", description="Target coronary artery"),
) -> ExplainResponse:
    """Provide territory breakdown and plain-language driver explanations for an artery."""
    return explain_artery(artery, patient)


@router.post("/whatif", response_model=WhatIfResponse, summary="Simulate what-if intervention")
def post_whatif(request: WhatIfRequest) -> WhatIfResponse:
    """Compare baseline risk against habit modifications or assumed statin therapy."""
    return simulate_whatif(request.baseline, request.changes)


@router.get("/personas", response_model=List[Persona], summary="Retrieve demonstration personas")
def get_personas_endpoint() -> List[Persona]:
    """Return pre-configured patient profiles representing low, medium, and high cardiovascular risk."""
    return get_personas()


@router.get("/model-card", response_model=ModelCardResponse, summary="Retrieve transparency model card")
def get_model_card() -> ModelCardResponse:
    """Return verified metrics, CV calibration, fairness subgroups, assumptions, and limitations."""
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=500, detail="Model metrics file not found.")

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    return ModelCardResponse(
        model_name=metrics["model_name"],
        algorithm="Logistic Regression with Standard Scaler and L2 Regularization (liblinear / lbfgs)",
        dataset=metrics["dataset_summary"]["name"],
        features_used=metrics["features_used"],
        features_dropped=metrics["features_dropped"],
        drop_rationale=metrics["drop_rationale"],
        cv_auroc_mean=round(metrics["cross_validation"]["auroc_mean"], 4),
        cv_auroc_std=round(metrics["cross_validation"]["auroc_std"], 4),
        cv_brier_mean=round(metrics["cross_validation"]["brier_mean"], 4),
        cv_brier_std=round(metrics["cross_validation"]["brier_std"], 4),
        calibration_curve={
            "mean_predicted": metrics["calibration"]["mean_predicted_probabilities"],
            "fraction_positives": metrics["calibration"]["fraction_of_positives"],
        },
        subgroup_fairness=metrics["fairness_subgroups"],
        uncertainty_quantification=metrics["uncertainty_quantification"]["interval"],
        ideal_profile_constants=IDEAL_PROFILE,
        assumptions_and_limitations=[
            EDUCATIONAL_DISCLAIMER,
            STATIN_ASSUMPTION_NOTE,
            "Family history and BMI are omitted because neither the Cleveland CAD model nor PCE utilize them.",
            "Per-artery risk ramp colors are illustrative heuristics mapping systemic risk drivers, not catheter-based anatomic stenosis detection.",
            "The 2013 ACC/AHA Pooled Cohort Equations are clinically validated for adults aged 40 to 79 only.",
        ],
        licenses={
            "dataset": "UCI Machine Learning Repository Heart Disease Dataset (Open Access)",
            "guideline": "2013 ACC/AHA Guideline on Assessment of Cardiovascular Risk (Public Clinical Standard)",
            "software": "MIT License",
        },
    )
