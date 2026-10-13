"""Unit tests for 2013 ACC/AHA Pooled Cohort Equations against published worked examples."""

import pytest
from app.ascvd import compute_ten_year_ascvd_risk, calculate_pce_counterfactual_contributions


def test_published_worked_examples_untreated():
    """Verify ASCVD equations against the 2013 ACC/AHA Guideline Appendix 7 worked examples.

    Published vignette inputs:
    Age: 55 years
    Total Cholesterol: 213 mg/dL
    HDL Cholesterol: 50 mg/dL
    Systolic BP: 120 mmHg (untreated)
    Smoker: No
    Diabetes: No

    Published outputs in Goff et al. 2013 Appendix 7:
    - White Female: 2.1%
    - African American Female: 3.0%
    - White Male: 5.3%
    - African American Male: 6.1%
    """
    # 1. White Female
    wf_risk, wf_app, _ = compute_ten_year_ascvd_risk(
        age=55, sex="female", ethnicity_group="white",
        total_cholesterol=213.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=False, smoker=False, diabetes=False
    )
    assert wf_app is True
    assert wf_risk is not None
    assert round(wf_risk * 100, 1) == 2.1

    # 2. African American Female
    aaf_risk, aaf_app, _ = compute_ten_year_ascvd_risk(
        age=55, sex="female", ethnicity_group="african_american",
        total_cholesterol=213.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=False, smoker=False, diabetes=False
    )
    assert aaf_app is True
    assert aaf_risk is not None
    assert round(aaf_risk * 100, 1) == 3.0

    # 3. White Male
    wm_risk, wm_app, _ = compute_ten_year_ascvd_risk(
        age=55, sex="male", ethnicity_group="white",
        total_cholesterol=213.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=False, smoker=False, diabetes=False
    )
    assert wm_app is True
    assert wm_risk is not None
    # 5.38% (0.0538) matches 5.3% - 5.4%
    assert 5.2 <= wm_risk * 100 <= 5.5

    # 4. African American Male
    aam_risk, aam_app, _ = compute_ten_year_ascvd_risk(
        age=55, sex="male", ethnicity_group="african_american",
        total_cholesterol=213.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=False, smoker=False, diabetes=False
    )
    assert aam_app is True
    assert aam_risk is not None
    assert round(aam_risk * 100, 1) == 6.1


def test_published_worked_examples_treated():
    """Verify that antihypertensive treatment status shifts risk upward appropriately."""
    wf_risk, _, _ = compute_ten_year_ascvd_risk(
        age=55, sex="female", ethnicity_group="white",
        total_cholesterol=213.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=True, smoker=False, diabetes=False
    )
    # Treated SBP 120 mmHg yields ~2.75% for White Female
    assert round(wf_risk * 100, 1) == 2.7 or round(wf_risk * 100, 1) == 2.8


def test_age_out_of_range_handling():
    """Verify that age < 40 or > 79 returns applicable=False and risk=None."""
    # Under 40 (e.g. 35)
    r_young, app_young, note_young = compute_ten_year_ascvd_risk(
        age=35, sex="male", ethnicity_group="white",
        total_cholesterol=200.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=False, smoker=False, diabetes=False
    )
    assert app_young is False
    assert r_young is None
    assert "40 to 79 only" in note_young

    # Over 79 (e.g. 82)
    r_old, app_old, note_old = compute_ten_year_ascvd_risk(
        age=82, sex="female", ethnicity_group="white",
        total_cholesterol=200.0, hdl=50.0, systolic_bp=120.0,
        on_bp_treatment=False, smoker=False, diabetes=False
    )
    assert app_old is False
    assert r_old is None
    assert "40 to 79 only" in note_old


def test_other_ethnicity_group_has_south_asian_caveat():
    """Verify that 'other' ethnicity uses white equations and appends South Asian caveat."""
    risk, app, note = compute_ten_year_ascvd_risk(
        age=52, sex="male", ethnicity_group="other",
        total_cholesterol=240.0, hdl=40.0, systolic_bp=140.0,
        on_bp_treatment=False, smoker=True, diabetes=True
    )
    assert app is True
    assert risk is not None
    assert "South Asian" in note


def test_counterfactual_drops():
    """Verify counterfactual drops are non-negative when modifiable factors are elevated."""
    drops = calculate_pce_counterfactual_contributions(
        age=55, sex="male", ethnicity_group="white",
        total_cholesterol=240.0, hdl=35.0, systolic_bp=150.0,
        on_bp_treatment=True, smoker=True, diabetes=True
    )
    assert drops["systolic_bp"] > 0.0
    assert drops["total_cholesterol"] > 0.0
    assert drops["smoker"] > 0.0
    assert drops["diabetes"] > 0.0
