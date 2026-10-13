"""Illustrative heuristic weights and scoring for coronary artery mapping.

Implements Section 4.5 of BUILD_PLAN.md:
Correlates clinical and physiological drivers into illustrative artery scores (0..1)
for the LAD, LCX, RCA, and Left Main arteries.
"""

from typing import Dict, List, Tuple
from app.schemas import ArteryScores, DriverFactor, PatientInput

# Starting weights per artery (sum to 1.0)
# Documented as an educational/illustrative heuristic.
ARTERY_WEIGHTS = {
    "lad": {
        "systolic_bp": 0.40,
        "age": 0.35,
        "diabetes": 0.25,
    },
    "lcx": {
        "total_cholesterol": 0.40,
        "hdl": 0.25,
        "age": 0.35,
    },
    "rca": {
        "smoker": 0.45,
        "fasting_glucose_over_120": 0.30,
        "resting_ecg": 0.25,
    },
}

ARTERY_METADATA = {
    "left_main": {
        "name": "Left Main Coronary Artery (LMCA)",
        "territory": "Primary bifurcation supplying both anterior and circumflex branches (LAD and LCX)",
        "summary": "High hemodynamic responsibility; risk score reflects highest vulnerability of downstream LAD or LCX branches.",
    },
    "lad": {
        "name": "Left Anterior Descending (LAD)",
        "territory": "Anterior myocardial wall, anterior interventricular septum, cardiac apex",
        "summary": "Illustrative risk in the LAD territory is influenced prominently by systemic arterial pressure, age, and metabolic factors.",
    },
    "lcx": {
        "name": "Left Circumflex (LCX)",
        "territory": "Lateral and posterolateral walls of the left ventricle",
        "summary": "Illustrative risk in the LCX territory correlates strongly with atherogenic lipid levels and vascular chronological exposure.",
    },
    "rca": {
        "name": "Right Coronary Artery (RCA)",
        "territory": "Inferior myocardial wall, right ventricle, and conduction nodes (SA/AV nodes)",
        "summary": "Illustrative risk in the RCA territory is heightened by endothelial oxidative stress from smoking, glycemic status, and repolarization changes.",
    },
}

FACTOR_LABELS = {
    "systolic_bp": "Systolic Blood Pressure",
    "total_cholesterol": "Total Cholesterol",
    "hdl": "HDL (Good Cholesterol)",
    "smoker": "Cigarette Smoking",
    "diabetes": "Diabetes Mellitus",
    "fasting_glucose_over_120": "Elevated Fasting Glucose",
    "age": "Chronological Age",
    "resting_ecg": "Resting ECG Abnormality",
    "cp": "Chest Pain Pattern",
    "st_depression": "Exercise ST Depression",
    "max_heart_rate": "Max Heart Rate Capacity",
    "exercise_angina": "Exertional Angina",
}

FACTOR_EXPLANATIONS = {
    "systolic_bp": "Elevated pressure increases shear stress and mechanical strain on vascular endothelial walls.",
    "total_cholesterol": "Circulating atherogenic lipoproteins infiltrate the intimal layer, promoting plaque formation.",
    "hdl": "Higher HDL helps transport excess cholesterol away from arterial tissue (protective reverse transport).",
    "smoker": "Combustion oxidants induce acute endothelial dysfunction, systemic inflammation, and thrombosis.",
    "diabetes": "Chronic hyperglycemia accelerates advanced glycation and microvascular inflammatory remodeling.",
    "fasting_glucose_over_120": "High baseline glucose reflects metabolic dysregulation that impairs nitric oxide production.",
    "age": "Arterial stiffness and cumulative lifetime exposure to circulatory lipids naturally increase with age.",
    "resting_ecg": "Resting ST-T wave changes indicate potential underlying myocardial repolarization compromise.",
    "cp": "Anginal symptom patterns reflect possible myocardial oxygen supply/demand mismatch during stress.",
    "st_depression": "Electrocardiographic depression during stress testing suggests ischemia under elevated cardiac workload.",
    "max_heart_rate": "Chronotropic reserve reflects autonomic tone and overall cardiovascular fitness.",
    "exercise_angina": "Chest tightness under exertion is a hallmark symptom of exertional flow limitation.",
}


def calculate_artery_scores(
    cad_probability: float,
    ten_year_risk: float | None,
    normalized_contributions: Dict[str, float],
) -> ArteryScores:
    """Calculate illustrative 0..1 scores for each coronary artery."""
    if ten_year_risk is not None:
        overall_blend = 0.5 * cad_probability + 0.5 * min(ten_year_risk / 0.20, 1.0)
    else:
        overall_blend = cad_probability

    scores = {}
    for artery, weights in ARTERY_WEIGHTS.items():
        delta = 0.0
        for factor, weight in weights.items():
            contrib = normalized_contributions.get(factor, 0.0)
            delta += weight * contrib
        score = overall_blend + 0.25 * delta
        scores[artery] = round(max(0.0, min(1.0, score)), 4)

    # Left main score is defined as max(LAD, LCX)
    scores["left_main"] = max(scores["lad"], scores["lcx"])

    return ArteryScores(
        left_main=scores["left_main"],
        lad=scores["lad"],
        lcx=scores["lcx"],
        rca=scores["rca"],
    )
