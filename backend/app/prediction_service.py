"""Core orchestration service for predictions, counterfactuals, and explanations."""

import os
from typing import Any, Dict, List, Tuple
from app.artery_weights import (
    ARTERY_METADATA,
    ARTERY_WEIGHTS,
    FACTOR_EXPLANATIONS,
    FACTOR_LABELS,
    calculate_artery_scores,
)
from app.ascvd import (
    calculate_pce_counterfactual_contributions,
    compute_ten_year_ascvd_risk,
)
from app.cad_inference import cad_service
from app.constants import (
    EDUCATIONAL_DISCLAIMER,
    IDEAL_PROFILE,
    STATIN_CHOLESTEROL_REDUCTION_PCT,
)
from app.heart_age import calculate_heart_age
from app.schemas import (
    ArteryExplanationDriver,
    CadPrediction,
    DriverFactor,
    ExplainResponse,
    FutureDoNothing,
    HeartAgePrediction,
    PatientInput,
    PredictResponse,
    TenYearRiskPrediction,
    WhatIfChanges,
    WhatIfResponse,
)


def build_normalized_contributions(
    shap_dict: Dict[str, float],
    cf_dict: Dict[str, float],
    patient: PatientInput,
) -> Tuple[List[DriverFactor], Dict[str, float]]:
    """Build unified list of normalized feature drivers (-1 to +1 scale)."""
    normalized_map: Dict[str, float] = {}
    driver_factors: List[DriverFactor] = []

    # Process SHAP features from CAD model
    # Values represent log-odds contribution; clamp to [-1, 1] range for visualization
    for feat, raw_val in shap_dict.items():
        # Soft-normalize raw log-odds: tanh or linear scale
        norm_val = round(max(-1.0, min(1.0, raw_val / 2.0)), 4)
        normalized_map[feat] = norm_val

        direction = "harmful" if norm_val > 0.05 else ("protective" if norm_val < -0.05 else "neutral")
        label = FACTOR_LABELS.get(feat, feat.replace("_", " ").title())
        driver_factors.append(
            DriverFactor(
                factor=feat,
                label=label,
                contribution=norm_val,
                source="shap",
                direction=direction,
            )
        )

    # Process counterfactual contributions from 10-year risk
    for factor, drop in cf_dict.items():
        if factor not in normalized_map:
            # Positive drop means the factor is harmful (removing it reduces risk)
            norm_val = round(min(1.0, drop * 5.0), 4)
            normalized_map[factor] = norm_val
            direction = "harmful" if norm_val > 0.05 else "neutral"
            label = FACTOR_LABELS.get(factor, factor.replace("_", " ").title())
            driver_factors.append(
                DriverFactor(
                    factor=factor,
                    label=label,
                    contribution=norm_val,
                    source="counterfactual",
                    direction=direction,
                )
            )
        else:
            # Blend or keep strongest attribution
            cf_norm = round(min(1.0, drop * 5.0), 4)
            if cf_norm > normalized_map[factor]:
                normalized_map[factor] = cf_norm

    # Sort drivers by absolute contribution descending
    driver_factors.sort(key=lambda d: abs(d.contribution), reverse=True)

    return driver_factors, normalized_map


def predict_patient(patient: PatientInput) -> PredictResponse:
    """Compute CAD probability, 10-year ASCVD risk, heart age, and artery highlights."""
    # 1. CAD likelihood & 80% bootstrap confidence interval
    cad_prob, interval_80 = cad_service.predict_cad(patient)

    # 2. 10-year hard ASCVD risk (Pooled Cohort Equations)
    ten_year_risk, applicable, note = compute_ten_year_ascvd_risk(
        age=patient.age,
        sex=patient.sex.value,
        ethnicity_group=patient.ethnicity_group.value,
        total_cholesterol=patient.total_cholesterol,
        hdl=patient.hdl,
        systolic_bp=patient.systolic_bp,
        on_bp_treatment=patient.on_bp_treatment,
        smoker=patient.smoker,
        diabetes=patient.diabetes,
    )

    # 3. Heart age calculation
    heart_age_val, bound = calculate_heart_age(
        patient_risk=ten_year_risk,
        sex=patient.sex.value,
        ethnicity_group=patient.ethnicity_group.value,
    )

    # 4. Explanations (SHAP & counterfactuals)
    shap_dict = cad_service.get_shap_contributions(patient)
    cf_dict = calculate_pce_counterfactual_contributions(
        age=patient.age,
        sex=patient.sex.value,
        ethnicity_group=patient.ethnicity_group.value,
        total_cholesterol=patient.total_cholesterol,
        hdl=patient.hdl,
        systolic_bp=patient.systolic_bp,
        on_bp_treatment=patient.on_bp_treatment,
        smoker=patient.smoker,
        diabetes=patient.diabetes,
    )

    drivers, normalized_factors = build_normalized_contributions(shap_dict, cf_dict, patient)

    # 5. Illustrative artery risk scores
    arteries = calculate_artery_scores(cad_prob, ten_year_risk, normalized_factors)

    # 6. Artery drivers
    artery_drivers = {
        "lad": list(ARTERY_WEIGHTS["lad"].keys()),
        "lcx": list(ARTERY_WEIGHTS["lcx"].keys()),
        "rca": list(ARTERY_WEIGHTS["rca"].keys()),
        "left_main": ["systolic_bp", "total_cholesterol", "age"],
    }

    return PredictResponse(
        cad=CadPrediction(probability=cad_prob, interval_80=interval_80),
        ten_year=TenYearRiskPrediction(risk=round(ten_year_risk, 4) if ten_year_risk is not None else None, applicable=applicable, note=note),
        heart_age=HeartAgePrediction(value=heart_age_val, bound=bound),
        arteries=arteries,
        drivers=drivers[:6],  # Return top 6 drivers
        artery_drivers=artery_drivers,
        disclaimer=EDUCATIONAL_DISCLAIMER,
    )


def explain_artery(artery: str, patient: PatientInput) -> ExplainResponse:
    """Generate plain-language explanation for an artery based on patient's metrics."""
    artery_key = artery.lower().strip()
    if artery_key not in ARTERY_METADATA:
        artery_key = "lad"

    meta = ARTERY_METADATA[artery_key]
    pred = predict_patient(patient)
    score = getattr(pred.arteries, artery_key, 0.0)

    # Get primary factors for this artery
    if artery_key in ARTERY_WEIGHTS:
        relevant_factors = list(ARTERY_WEIGHTS[artery_key].keys())
    else:
        relevant_factors = ["systolic_bp", "total_cholesterol", "age"]

    drivers_list = []
    for factor in relevant_factors[:3]:
        label = FACTOR_LABELS.get(factor, factor.replace("_", " ").title())
        desc = FACTOR_EXPLANATIONS.get(factor, "Risk factor contributing to cardiovascular strain.")
        drivers_list.append(ArteryExplanationDriver(factor=factor, label=label, description=desc))

    return ExplainResponse(
        artery=artery_key,
        name=meta["name"],
        territory=meta["territory"],
        score=score,
        drivers=drivers_list,
        summary=meta["summary"],
    )


def simulate_whatif(baseline: PatientInput, changes: WhatIfChanges) -> WhatIfResponse:
    """Simulate habit modifications or statin therapy against baseline."""
    # Build modified patient dictionary
    scenario_dict = baseline.model_dump()

    # Apply direct field modifications
    for field, val in changes.model_dump(exclude_unset=True).items():
        if field == "statin":
            continue
        if val is not None:
            scenario_dict[field] = val

    # Apply statin therapy assumption if requested
    assumptions: List[str] = []
    if changes.statin:
        original_chol = scenario_dict["total_cholesterol"]
        reduced_chol = round(original_chol * (1.0 - STATIN_CHOLESTEROL_REDUCTION_PCT), 1)
        scenario_dict["total_cholesterol"] = max(70.0, reduced_chol)
        assumptions.append(
            f"Statin therapy assumed effect: 25% reduction in total cholesterol "
            f"({original_chol} mg/dL -> {reduced_chol} mg/dL)."
        )

    modified_patient = PatientInput(**scenario_dict)

    baseline_resp = predict_patient(baseline)
    scenario_resp = predict_patient(modified_patient)

    # Future "Do Nothing" projection: patient aged +10 years with unchanged habits
    future_age = min(79, baseline.age + 10)
    future_risk, _, _ = compute_ten_year_ascvd_risk(
        age=future_age,
        sex=baseline.sex.value,
        ethnicity_group=baseline.ethnicity_group.value,
        total_cholesterol=baseline.total_cholesterol,
        hdl=baseline.hdl,
        systolic_bp=baseline.systolic_bp,
        on_bp_treatment=baseline.on_bp_treatment,
        smoker=baseline.smoker,
        diabetes=baseline.diabetes,
    )
    future_do_nothing = FutureDoNothing(
        age=future_age,
        ten_year_risk=round(future_risk, 4) if future_risk is not None else None,
    )

    if not assumptions:
        assumptions.append("All lifestyle scenario modifications represent hypothetical what-if simulations.")

    return WhatIfResponse(
        baseline=baseline_resp,
        scenario=scenario_resp,
        future_do_nothing=future_do_nothing,
        assumptions=assumptions,
    )
