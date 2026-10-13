"""Clinical constants, assumptions, and reference values for HeartSight.

All constants defined here are explicitly declared and exposed for transparency.
"""

import os

# Root directory of backend
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BACKEND_DIR, "models")

# Mandatory Medical Honesty Disclaimer
EDUCATIONAL_DISCLAIMER = (
    "HeartSight is an educational and exploratory tool, not a medical diagnostic device. "
    "Predictions and per-artery highlights are illustrative heuristics based on statistical "
    "cohort models and should not replace professional medical consultation."
)

SOUTH_ASIAN_CAVEAT = (
    "The 2013 ACC/AHA Pooled Cohort Equations were derived primarily from US cohorts and are "
    "reported in medical literature to underestimate cardiovascular risk in South Asian populations. "
    "Output is an educational estimate."
)

# Ideal Clinical Risk Factor Profile for Counterfactual Explanations and Heart Age
# Sourced from AHA 2020 Life's Simple 7 / ideal cardiovascular health metrics
IDEAL_PROFILE = {
    "systolic_bp": 115.0,
    "on_bp_treatment": False,
    "total_cholesterol": 160.0,
    "hdl": 55.0,
    "smoker": False,
    "diabetes": False,
    "fasting_glucose_over_120": False,
}

# Assumed therapeutic effect of Moderate-to-High Intensity Statin Therapy
# Modeled as a percentage reduction in total serum cholesterol.
# TODO: Owner to add primary literature citation (e.g., CTT meta-analysis / 2018 AHA/ACC Guidelines).
STATIN_CHOLESTEROL_REDUCTION_PCT = 0.25  # Assumed 25% drop in total cholesterol
STATIN_ASSUMPTION_NOTE = (
    "Statin therapy is modeled as an assumed 25% reduction in total serum cholesterol "
    "(educational simulation; actual clinical response varies by agent, dose, and individual genetics)."
)
