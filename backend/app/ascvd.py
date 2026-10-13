"""2013 ACC/AHA Pooled Cohort Equations (PCE) Implementation.

Source Reference:
Goff DC Jr, Lloyd-Jones DM, Bennett G, Coady S, D’Agostino RB Sr, Gibbons R, Greenland P,
Lackland DT, Levy D, O’Donnell CJ, Robinson JG, Schwartz JS, Shero ST, Smith SC Jr, Sorlie P,
Stone NJ, Wilson PWF.
2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk: A Report of the American
College of Cardiology/American Heart Association Task Force on Practice Guidelines.
Circulation. 2014;129(25 suppl 2):S49–S73.
DOI: 10.1161/01.cir.0000437741.48606.98.
Table: Appendix 7, Table A ("Algorithm for Estimation of 10-Year ASCVD Risk").
"""

import math
from typing import Dict, Optional, Tuple

from app.constants import IDEAL_PROFILE, SOUTH_ASIAN_CAVEAT

# Published Table A parameters:
# S10: 10-year baseline survival rate
# mean_terms: population mean coefficient product sum (center adjustment)
PCE_PARAMETERS = {
    ("female", "white"): {
        "s10": 0.9665,
        "mean_terms": -29.18,
    },
    ("female", "african_american"): {
        "s10": 0.9533,
        "mean_terms": 86.61,
    },
    ("male", "white"): {
        "s10": 0.9144,
        "mean_terms": 61.18,
    },
    ("male", "african_american"): {
        "s10": 0.8954,
        "mean_terms": 19.54,
    },
}


def calculate_individual_terms(
    sex: str,
    race: str,
    age: float,
    total_cholesterol: float,
    hdl: float,
    systolic_bp: float,
    on_bp_treatment: bool,
    smoker: bool,
    diabetes: bool,
) -> float:
    """Calculate linear predictor sum (X'B) using coefficients from Goff et al. 2013 Table A."""
    ln_age = math.log(age)
    ln_tc = math.log(total_cholesterol)
    ln_hdl = math.log(hdl)
    ln_sbp = math.log(systolic_bp)

    # Use white equation parameters for other ethnic groups per guideline recommendations
    lookup_race = "african_american" if race == "african_american" else "white"

    if sex == "female" and lookup_race == "white":
        return (
            -29.799 * ln_age
            + 4.884 * (ln_age ** 2)
            + 13.540 * ln_tc
            - 3.114 * ln_age * ln_tc
            - 13.578 * ln_hdl
            + 3.149 * ln_age * ln_hdl
            + (2.019 if on_bp_treatment else 1.957) * ln_sbp
            + (7.574 - 1.665 * ln_age if smoker else 0.0)
            + (0.661 if diabetes else 0.0)
        )

    if sex == "female" and lookup_race == "african_american":
        treated_term = 29.291 * ln_sbp - 6.432 * ln_age * ln_sbp
        untreated_term = 27.820 * ln_sbp - 6.087 * ln_age * ln_sbp
        return (
            17.114 * ln_age
            + 0.940 * ln_tc
            - 18.920 * ln_hdl
            + 4.475 * ln_age * ln_hdl
            + (treated_term if on_bp_treatment else untreated_term)
            + (0.691 if smoker else 0.0)
            + (0.874 if diabetes else 0.0)
        )

    if sex == "male" and lookup_race == "white":
        return (
            12.344 * ln_age
            + 11.853 * ln_tc
            - 2.664 * ln_age * ln_tc
            - 7.990 * ln_hdl
            + 1.769 * ln_age * ln_hdl
            + (1.797 if on_bp_treatment else 1.764) * ln_sbp
            + (7.837 - 1.795 * ln_age if smoker else 0.0)
            + (0.658 if diabetes else 0.0)
        )

    if sex == "male" and lookup_race == "african_american":
        return (
            2.469 * ln_age
            + 0.302 * ln_tc
            - 0.307 * ln_hdl
            + (1.916 if on_bp_treatment else 1.809) * ln_sbp
            + (0.549 if smoker else 0.0)
            + (0.645 if diabetes else 0.0)
        )

    raise ValueError(f"Unsupported demographic combination: sex={sex}, race={race}")


def compute_ten_year_ascvd_risk(
    age: int,
    sex: str,
    ethnicity_group: str,
    total_cholesterol: float,
    hdl: float,
    systolic_bp: float,
    on_bp_treatment: bool,
    smoker: bool,
    diabetes: bool,
) -> Tuple[Optional[float], bool, str]:
    """Compute 10-year hard ASCVD risk score according to published Pooled Cohort Equations.

    Returns:
        (risk_probability, applicable, note)
    """
    if age < 40 or age > 79:
        return (
            None,
            False,
            (
                f"ASCVD Pooled Cohort Equations are clinically validated for adults aged 40 to 79 only. "
                f"Patient age ({age}) is outside this range, so 10-year numerical risk is not applicable."
            ),
        )

    lookup_race = "african_american" if ethnicity_group == "african_american" else "white"
    params = PCE_PARAMETERS[(sex, lookup_race)]

    terms = calculate_individual_terms(
        sex=sex,
        race=ethnicity_group,
        age=float(age),
        total_cholesterol=total_cholesterol,
        hdl=hdl,
        systolic_bp=systolic_bp,
        on_bp_treatment=on_bp_treatment,
        smoker=smoker,
        diabetes=diabetes,
    )

    diff = terms - params["mean_terms"]
    # 1 - S10^exp(diff)
    risk = 1.0 - (params["s10"] ** math.exp(diff))

    # Clamp bounds strictly between 0 and 1
    risk = max(0.0, min(1.0, risk))

    note = "10-year hard ASCVD risk (ACC/AHA 2013 Pooled Cohort Equations)."
    if ethnicity_group == "other":
        note += f" {SOUTH_ASIAN_CAVEAT}"

    return (risk, True, note)


def calculate_pce_counterfactual_contributions(
    age: int,
    sex: str,
    ethnicity_group: str,
    total_cholesterol: float,
    hdl: float,
    systolic_bp: float,
    on_bp_treatment: bool,
    smoker: bool,
    diabetes: bool,
) -> Dict[str, float]:
    """Calculate risk reductions if each modifiable factor is improved to ideal values.

    Returns non-negative risk drops per factor.
    """
    baseline_risk, applicable, _ = compute_ten_year_ascvd_risk(
        age, sex, ethnicity_group, total_cholesterol, hdl, systolic_bp, on_bp_treatment, smoker, diabetes
    )

    if not applicable or baseline_risk is None:
        return {
            "systolic_bp": 0.0,
            "total_cholesterol": 0.0,
            "hdl": 0.0,
            "smoker": 0.0,
            "diabetes": 0.0,
        }

    # Factor 1: Systolic BP & treatment reduced to ideal (115 mmHg, untreated)
    risk_ideal_bp, _, _ = compute_ten_year_ascvd_risk(
        age, sex, ethnicity_group, total_cholesterol, hdl,
        IDEAL_PROFILE["systolic_bp"], IDEAL_PROFILE["on_bp_treatment"],
        smoker, diabetes
    )
    bp_drop = max(0.0, baseline_risk - (risk_ideal_bp or baseline_risk))

    # Factor 2: Total cholesterol reduced to ideal (160 mg/dL)
    risk_ideal_tc, _, _ = compute_ten_year_ascvd_risk(
        age, sex, ethnicity_group, IDEAL_PROFILE["total_cholesterol"], hdl,
        systolic_bp, on_bp_treatment, smoker, diabetes
    )
    tc_drop = max(0.0, baseline_risk - (risk_ideal_tc or baseline_risk))

    # Factor 3: HDL improved to ideal (55 mg/dL)
    risk_ideal_hdl, _, _ = compute_ten_year_ascvd_risk(
        age, sex, ethnicity_group, total_cholesterol, IDEAL_PROFILE["hdl"],
        systolic_bp, on_bp_treatment, smoker, diabetes
    )
    hdl_drop = max(0.0, baseline_risk - (risk_ideal_hdl or baseline_risk))

    # Factor 4: Smoker set to non-smoker
    risk_ideal_smoker, _, _ = compute_ten_year_ascvd_risk(
        age, sex, ethnicity_group, total_cholesterol, hdl,
        systolic_bp, on_bp_treatment, False, diabetes
    )
    smoker_drop = max(0.0, baseline_risk - (risk_ideal_smoker or baseline_risk))

    # Factor 5: Diabetes set to False
    risk_ideal_diab, _, _ = compute_ten_year_ascvd_risk(
        age, sex, ethnicity_group, total_cholesterol, hdl,
        systolic_bp, on_bp_treatment, smoker, False
    )
    diab_drop = max(0.0, baseline_risk - (risk_ideal_diab or baseline_risk))

    return {
        "systolic_bp": bp_drop,
        "total_cholesterol": tc_drop,
        "hdl": hdl_drop,
        "smoker": smoker_drop,
        "diabetes": diab_drop,
    }
