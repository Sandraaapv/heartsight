/**
 * HeartSight Typed API Client.
 * Follows the locked API contract in Section 5 of BUILD_PLAN.md.
 */

export type Sex = "male" | "female";
export type EthnicityGroup = "white" | "african_american" | "other";
export type ChestPainType = "typical_angina" | "atypical_angina" | "non_anginal" | "asymptomatic";
export type RestingEcg = "normal" | "st_t_abnormality" | "lv_hypertrophy";
export type StSlope = "upsloping" | "flat" | "downsloping";

export interface PatientInput {
  age: number;
  sex: Sex;
  ethnicity_group: EthnicityGroup;
  systolic_bp: number;
  total_cholesterol: number;
  hdl: number;
  on_bp_treatment: boolean;
  diabetes: boolean;
  smoker: boolean;
  fasting_glucose_over_120: boolean;
  chest_pain_type: ChestPainType;
  resting_ecg: RestingEcg;
  max_heart_rate: number;
  exercise_angina: boolean;
  st_depression: number;
  st_slope: StSlope;
}

export interface CadPrediction {
  probability: number;
  interval_80: [number, number];
}

export interface TenYearRiskPrediction {
  risk: number | null;
  applicable: boolean;
  note: string;
}

export interface HeartAgePrediction {
  value: number | null;
  bound: "exact" | "at_most" | "at_least";
}

export interface ArteryScores {
  left_main: number;
  lad: number;
  lcx: number;
  rca: number;
}

export interface DriverFactor {
  factor: string;
  label: string;
  contribution: number;
  source: "shap" | "counterfactual";
  direction: "harmful" | "protective" | "neutral";
}

export interface PredictResponse {
  cad: CadPrediction;
  ten_year: TenYearRiskPrediction;
  heart_age: HeartAgePrediction;
  arteries: ArteryScores;
  drivers: DriverFactor[];
  artery_drivers: Record<string, string[]>;
  disclaimer: string;
}

export interface ArteryExplanationDriver {
  factor: string;
  label: string;
  description: string;
}

export interface ExplainResponse {
  artery: string;
  name: string;
  territory: string;
  score: number;
  drivers: ArteryExplanationDriver[];
  summary: string;
}

export interface WhatIfChanges {
  age?: number;
  systolic_bp?: number;
  total_cholesterol?: number;
  hdl?: number;
  on_bp_treatment?: boolean;
  smoker?: boolean;
  diabetes?: boolean;
  fasting_glucose_over_120?: boolean;
  statin?: boolean;
}

export interface WhatIfRequest {
  baseline: PatientInput;
  changes: WhatIfChanges;
}

export interface FutureDoNothing {
  age: number;
  ten_year_risk: number | null;
}

export interface WhatIfResponse {
  baseline: PredictResponse;
  scenario: PredictResponse;
  future_do_nothing: FutureDoNothing;
  assumptions: string[];
}

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  risk_level: "low" | "medium" | "high";
  story: string;
  input_data: PatientInput;
}

export interface ModelCardResponse {
  model_name: string;
  algorithm: string;
  dataset: string;
  features_used: string[];
  features_dropped: string[];
  drop_rationale: string;
  cv_auroc_mean: number;
  cv_auroc_std: number;
  cv_brier_mean: number;
  cv_brier_std: number;
  calibration_curve: {
    mean_predicted: number[];
    fraction_positives: number[];
  };
  subgroup_fairness: Record<string, unknown>;
  uncertainty_quantification: string;
  ideal_profile_constants: Record<string, unknown>;
  assumptions_and_limitations: string[];
  licenses: Record<string, string>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === "string") {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((d: { msg?: string; loc?: string[] }) => `${d.loc?.join(".") || ""}: ${d.msg}`).join("; ");
        }
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function predictPatient(input: PatientInput): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<PredictResponse>(res);
}

export async function explainArtery(artery: string, input: PatientInput): Promise<ExplainResponse> {
  const res = await fetch(`${API_BASE}/explain?artery=${encodeURIComponent(artery)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<ExplainResponse>(res);
}

export async function simulateWhatIf(request: WhatIfRequest): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE}/whatif`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<WhatIfResponse>(res);
}

export async function getPersonas(): Promise<Persona[]> {
  const res = await fetch(`${API_BASE}/personas`);
  return handleResponse<Persona[]>(res);
}

export async function getModelCard(): Promise<ModelCardResponse> {
  const res = await fetch(`${API_BASE}/model-card`);
  return handleResponse<ModelCardResponse>(res);
}
