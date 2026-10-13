"""Clinically grounded persona profiles for educational simulation."""

from typing import List
from app.schemas import (
    ChestPainEnum,
    EthnicityEnum,
    PatientInput,
    Persona,
    RestingEcgEnum,
    SexEnum,
    StSlopeEnum,
)

PERSONAS: List[Persona] = [
    Persona(
        id="elena",
        name="Elena",
        tagline="Active runner with optimal metabolic numbers",
        risk_level="low",
        story=(
            "Elena is a 42-year-old teacher who runs regularly. Her lipid profile and arterial pressures "
            "are in the optimal range, with no tobacco exposure and normal resting electrophysiology."
        ),
        input_data=PatientInput(
            age=42,
            sex=SexEnum.female,
            ethnicity_group=EthnicityEnum.white,
            systolic_bp=112.0,
            total_cholesterol=168.0,
            hdl=64.0,
            on_bp_treatment=False,
            diabetes=False,
            smoker=False,
            fasting_glucose_over_120=False,
            chest_pain_type=ChestPainEnum.asymptomatic,
            resting_ecg=RestingEcgEnum.normal,
            max_heart_rate=172.0,
            exercise_angina=False,
            st_depression=0.0,
            st_slope=StSlopeEnum.upsloping,
        ),
    ),
    Persona(
        id="marcus",
        name="Marcus",
        tagline="Treated hypertension with moderate atherogenic lipids",
        risk_level="medium",
        story=(
            "Marcus is a 58-year-old logistics director receiving antihypertensive medication. His blood pressure "
            "is partially controlled, and his cholesterol levels place him in an intermediate risk band."
        ),
        input_data=PatientInput(
            age=58,
            sex=SexEnum.male,
            ethnicity_group=EthnicityEnum.african_american,
            systolic_bp=138.0,
            total_cholesterol=218.0,
            hdl=42.0,
            on_bp_treatment=True,
            diabetes=False,
            smoker=False,
            fasting_glucose_over_120=False,
            chest_pain_type=ChestPainEnum.atypical_angina,
            resting_ecg=RestingEcgEnum.normal,
            max_heart_rate=142.0,
            exercise_angina=False,
            st_depression=0.8,
            st_slope=StSlopeEnum.flat,
        ),
    ),
    Persona(
        id="ravi",
        name="Ravi",
        tagline="Severe multifactorial risk: smoker, untreated hypertension, high LDL",
        risk_level="high",
        story=(
            "Ravi is a 52-year-old software architect with multiple concurrent risk factors including heavy smoking, "
            "untreated stage-2 hypertension, type-2 diabetes, and an atherogenic dyslipidemia profile."
        ),
        input_data=PatientInput(
            age=52,
            sex=SexEnum.male,
            ethnicity_group=EthnicityEnum.other,
            systolic_bp=144.0,
            total_cholesterol=235.0,
            hdl=38.0,
            on_bp_treatment=False,
            diabetes=True,
            smoker=True,
            fasting_glucose_over_120=True,
            chest_pain_type=ChestPainEnum.typical_angina,
            resting_ecg=RestingEcgEnum.st_t_abnormality,
            max_heart_rate=128.0,
            exercise_angina=True,
            st_depression=2.2,
            st_slope=StSlopeEnum.flat,
        ),
    ),
]


def get_personas() -> List[Persona]:
    return PERSONAS
