"""Pydantic request and response schemas matching Section 5 API contract."""

from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class SexEnum(str, Enum):
    male = "male"
    female = "female"


class EthnicityEnum(str, Enum):
    white = "white"
    african_american = "african_american"
    other = "other"


class ChestPainEnum(str, Enum):
    typical_angina = "typical_angina"
    atypical_angina = "atypical_angina"
    non_anginal = "non_anginal"
    asymptomatic = "asymptomatic"


class RestingEcgEnum(str, Enum):
    normal = "normal"
    st_t_abnormality = "st_t_abnormality"
    lv_hypertrophy = "lv_hypertrophy"


class StSlopeEnum(str, Enum):
    upsloping = "upsloping"
    flat = "flat"
    downsloping = "downsloping"


class PatientInput(BaseModel):
    """Input parameters representing a patient's clinical and physiological metrics."""

    age: int = Field(..., ge=18, le=110, description="Age in years (18-110)")
    sex: SexEnum = Field(..., description="Biological sex ('male' or 'female')")
    ethnicity_group: EthnicityEnum = Field(
        ..., description="Ethnicity group ('white', 'african_american', or 'other')"
    )
    systolic_bp: float = Field(..., ge=70.0, le=260.0, description="Resting systolic blood pressure (mmHg)")
    total_cholesterol: float = Field(..., ge=70.0, le=550.0, description="Total serum cholesterol (mg/dL)")
    hdl: float = Field(..., ge=10.0, le=160.0, description="HDL cholesterol (mg/dL)")
    on_bp_treatment: bool = Field(..., description="Whether patient is actively taking antihypertensive medication")
    diabetes: bool = Field(..., description="History of diagnosed diabetes mellitus")
    smoker: bool = Field(..., description="Current cigarette smoker")
    fasting_glucose_over_120: bool = Field(..., description="Fasting blood sugar > 120 mg/dL")
    chest_pain_type: ChestPainEnum = Field(..., description="Chest pain presentation type")
    resting_ecg: RestingEcgEnum = Field(..., description="Resting electrocardiogram results")
    max_heart_rate: float = Field(..., ge=50.0, le=240.0, description="Maximum heart rate achieved (bpm)")
    exercise_angina: bool = Field(..., description="Exercise-induced angina present")
    st_depression: float = Field(..., ge=0.0, le=10.0, description="ST depression induced by exercise (oldpeak)")
    st_slope: StSlopeEnum = Field(..., description="Slope of peak exercise ST segment")


class CadPrediction(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    interval_80: List[float] = Field(..., min_length=2, max_length=2)


class TenYearRiskPrediction(BaseModel):
    risk: Optional[float] = Field(None, ge=0.0, le=1.0)
    applicable: bool
    note: str


class HeartAgePrediction(BaseModel):
    value: Optional[float] = None
    bound: Literal["exact", "at_most", "at_least"]


class ArteryScores(BaseModel):
    left_main: float = Field(..., ge=0.0, le=1.0)
    lad: float = Field(..., ge=0.0, le=1.0)
    lcx: float = Field(..., ge=0.0, le=1.0)
    rca: float = Field(..., ge=0.0, le=1.0)


class DriverFactor(BaseModel):
    factor: str
    label: str
    contribution: float  # Normalized -1 to +1
    source: Literal["shap", "counterfactual"]
    direction: Literal["harmful", "protective", "neutral"]


class PredictResponse(BaseModel):
    cad: CadPrediction
    ten_year: TenYearRiskPrediction
    heart_age: HeartAgePrediction
    arteries: ArteryScores
    drivers: List[DriverFactor]
    artery_drivers: Dict[str, List[str]]
    disclaimer: str


class ArteryExplanationDriver(BaseModel):
    factor: str
    label: str
    description: str


class ExplainResponse(BaseModel):
    artery: str
    name: str
    territory: str
    score: float
    drivers: List[ArteryExplanationDriver]
    summary: str


class WhatIfChanges(BaseModel):
    # Optional overrides
    age: Optional[int] = None
    systolic_bp: Optional[float] = None
    total_cholesterol: Optional[float] = None
    hdl: Optional[float] = None
    on_bp_treatment: Optional[bool] = None
    smoker: Optional[bool] = None
    diabetes: Optional[bool] = None
    fasting_glucose_over_120: Optional[bool] = None
    statin: Optional[bool] = None  # Therapeutic what-if intervention


class WhatIfRequest(BaseModel):
    baseline: PatientInput
    changes: WhatIfChanges


class FutureDoNothing(BaseModel):
    age: int
    ten_year_risk: Optional[float]


class WhatIfResponse(BaseModel):
    baseline: PredictResponse
    scenario: PredictResponse
    future_do_nothing: FutureDoNothing
    assumptions: List[str]


class Persona(BaseModel):
    id: str
    name: str
    tagline: str
    risk_level: Literal["low", "medium", "high"]
    story: str
    input_data: PatientInput


class ModelCardResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    algorithm: str
    dataset: str
    features_used: List[str]
    features_dropped: List[str]
    drop_rationale: str
    cv_auroc_mean: float
    cv_auroc_std: float
    cv_brier_mean: float
    cv_brier_std: float
    calibration_curve: Dict[str, List[float]]
    subgroup_fairness: Dict[str, Any]
    uncertainty_quantification: str
    ideal_profile_constants: Dict[str, Any]
    assumptions_and_limitations: List[str]
    licenses: Dict[str, str]
