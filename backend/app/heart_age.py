"""Heart age estimation based on 2013 ACC/AHA ideal risk curve.

Implements Section 4.4 of BUILD_PLAN.md:
Matches patient 10-year risk against the age of an ideal patient profile (ages 40 to 79).
"""

from typing import Dict, Literal, Optional, Tuple
from app.ascvd import compute_ten_year_ascvd_risk
from app.constants import IDEAL_PROFILE


def calculate_heart_age(
    patient_risk: Optional[float],
    sex: str,
    ethnicity_group: str,
) -> Tuple[Optional[float], Literal["exact", "at_most", "at_least"]]:
    """Determine heart age by finding the age where ideal profile matches patient risk.

    Returns:
        (heart_age_value, bound)
    """
    if patient_risk is None:
        return None, "exact"

    # Pre-calculate ideal risks for ages 40 to 79
    ideal_risks: Dict[int, float] = {}
    for age in range(40, 80):
        risk, applicable, _ = compute_ten_year_ascvd_risk(
            age=age,
            sex=sex,
            ethnicity_group=ethnicity_group,
            total_cholesterol=IDEAL_PROFILE["total_cholesterol"],
            hdl=IDEAL_PROFILE["hdl"],
            systolic_bp=IDEAL_PROFILE["systolic_bp"],
            on_bp_treatment=IDEAL_PROFILE["on_bp_treatment"],
            smoker=IDEAL_PROFILE["smoker"],
            diabetes=IDEAL_PROFILE["diabetes"],
        )
        if applicable and risk is not None:
            ideal_risks[age] = risk

    if not ideal_risks:
        return None, "exact"

    min_age = min(ideal_risks.keys())
    max_age = max(ideal_risks.keys())

    # If patient's risk is lower than the lowest age ideal risk:
    if patient_risk <= ideal_risks[min_age]:
        return float(min_age), "at_most"

    # If patient's risk is greater than the highest age ideal risk:
    if patient_risk >= ideal_risks[max_age]:
        return float(max_age), "at_least"

    # Otherwise interpolate between ages
    for age in range(min_age, max_age):
        r1 = ideal_risks[age]
        r2 = ideal_risks[age + 1]
        if r1 <= patient_risk <= r2:
            fraction = (patient_risk - r1) / (r2 - r1) if (r2 - r1) > 0 else 0.0
            heart_age = round(age + fraction, 1)
            return heart_age, "exact"

    return float(max_age), "at_least"
