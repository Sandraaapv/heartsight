"use client";

import React, { useState } from "react";
import {
  ChestPainType,
  EthnicityGroup,
  PatientInput,
  RestingEcg,
  Sex,
  StSlope,
} from "@/lib/api";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  HelpCircle,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";

interface IntakeFormProps {
  initialValues: PatientInput;
  onSubmit: (data: PatientInput) => Promise<void>;
  isLoading: boolean;
}

export function IntakeForm({
  initialValues,
  onSubmit,
  isLoading,
}: IntakeFormProps) {
  const [formData, setFormData] = useState<PatientInput>(initialValues);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeHint, setActiveHint] = useState<string | null>(null);


  const updateField = <K extends keyof PatientInput>(key: K, value: PatientInput[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const steps = [
    { id: 1, title: "Demographics", icon: User },
    { id: 2, title: "Vitals & Labs", icon: Stethoscope },
    { id: 3, title: "Lifestyle & Metabolic", icon: Heart },
    { id: 4, title: "Stress & Electrophysiology", icon: Activity },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div id="intake-section" className="w-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-sm transition-colors">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">
            Cardiovascular Risk Intake
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Four quick steps to compute your dual-risk assessment and interactive 3D coronary map.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : isDone
                    ? "bg-[var(--sage-soft)] text-[var(--text)]"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden md:inline">{step.title}</span>
                <span className="md:hidden">Step {step.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* STEP 1: DEMOGRAPHICS */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Step 1: Baseline Demographics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Age */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-age" className="text-xs font-semibold text-[var(--text)]">
                    Age (Years)
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveHint(activeHint === "age" ? null : "age")}
                    className="text-[var(--text-muted)] hover:text-[var(--primary)]"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  id="input-age"
                  type="number"
                  min={18}
                  max={110}
                  value={formData.age}
                  onChange={(e) => updateField("age", parseInt(e.target.value) || 18)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
                {activeHint === "age" && (
                  <p className="text-[11px] text-[var(--text-muted)] p-2 rounded-lg bg-[var(--bg-tint)]">
                    The 10-year ASCVD equations are validated for ages 40–79. Under 40, CAD presence likelihood remains active.
                  </p>
                )}
              </div>

              {/* Sex */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Biological Sex
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["female", "male"] as Sex[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateField("sex", val)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        formData.sex === val
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                          : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ethnicity Group */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-ethnicity" className="text-xs font-semibold text-[var(--text)]">
                    Demographic Cohort
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveHint(activeHint === "race" ? null : "race")}
                    className="text-[var(--text-muted)] hover:text-[var(--primary)]"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <select
                  id="input-ethnicity"
                  value={formData.ethnicity_group}
                  onChange={(e) => updateField("ethnicity_group", e.target.value as EthnicityGroup)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="white">White / Caucasian</option>
                  <option value="african_american">Black / African American</option>
                  <option value="other">Other (South Asian, Asian, Hispanic)</option>
                </select>
                {activeHint === "race" && (
                  <p className="text-[11px] text-[var(--text-muted)] p-2 rounded-lg bg-[var(--bg-tint)]">
                    The 2013 ACC/AHA equations have specific coefficients for White and African American cohorts. Other ethnicities use the reference equation with a clinical caveat.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VITALS & LABS */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Step 2: Hemodynamics &amp; Lipid Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Systolic BP */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-sbp" className="text-xs font-semibold text-[var(--text)]">
                    Systolic Blood Pressure (mmHg)
                  </label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Target: &lt;120</span>
                </div>
                <input
                  id="input-sbp"
                  type="number"
                  min={70}
                  max={260}
                  value={formData.systolic_bp}
                  onChange={(e) => updateField("systolic_bp", parseFloat(e.target.value) || 120)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              {/* BP Treatment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Antihypertensive Medication
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("on_bp_treatment", false)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      !formData.on_bp_treatment
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)]"
                    }`}
                  >
                    No (Untreated)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("on_bp_treatment", true)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      formData.on_bp_treatment
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)]"
                    }`}
                  >
                    Yes (Taking Meds)
                  </button>
                </div>
              </div>

              {/* Total Cholesterol */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-tc" className="text-xs font-semibold text-[var(--text)]">
                    Total Serum Cholesterol (mg/dL)
                  </label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Target: &lt;200</span>
                </div>
                <input
                  id="input-tc"
                  type="number"
                  min={70}
                  max={550}
                  value={formData.total_cholesterol}
                  onChange={(e) => updateField("total_cholesterol", parseFloat(e.target.value) || 180)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              {/* HDL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-hdl" className="text-xs font-semibold text-[var(--text)]">
                    HDL &quot;Good&quot; Cholesterol (mg/dL)
                  </label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Target: &ge;50</span>
                </div>
                <input
                  id="input-hdl"
                  type="number"
                  min={10}
                  max={160}
                  value={formData.hdl}
                  onChange={(e) => updateField("hdl", parseFloat(e.target.value) || 50)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LIFESTYLE & METABOLIC */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Step 3: Lifestyle &amp; Glycemic Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Smoking */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Current Cigarette Smoker
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("smoker", false)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      !formData.smoker
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("smoker", true)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      formData.smoker
                        ? "bg-[var(--risk-high)] text-white border-[var(--risk-high)]"
                        : "border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    Yes
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Smoking causes endothelial damage and platelet activation.
                </p>
              </div>

              {/* Diabetes */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Diagnosed Diabetes Mellitus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("diabetes", false)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      !formData.diabetes
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("diabetes", true)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      formData.diabetes
                        ? "bg-[var(--risk-high)] text-white border-[var(--risk-high)]"
                        : "border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    Yes
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Type-1 or Type-2 diabetes increases atherogenesis rate.
                </p>
              </div>

              {/* Fasting Glucose > 120 */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Fasting Glucose &gt; 120 mg/dL
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("fasting_glucose_over_120", false)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      !formData.fasting_glucose_over_120
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    Normal (&le;120)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("fasting_glucose_over_120", true)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      formData.fasting_glucose_over_120
                        ? "bg-[var(--risk-elevated)] text-white border-[var(--risk-elevated)]"
                        : "border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    Elevated (&gt;120)
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Cleveland CAD feature measuring impaired fasting glycaemia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: EXERCISE & CARDIAC TESTS */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Step 4: Stress Testing &amp; Electrophysiology
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Chest Pain Type */}
              <div className="space-y-1.5">
                <label htmlFor="input-cp" className="text-xs font-semibold text-[var(--text)] block">
                  Chest Pain Presentation
                </label>
                <select
                  id="input-cp"
                  value={formData.chest_pain_type}
                  onChange={(e) => updateField("chest_pain_type", e.target.value as ChestPainType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="asymptomatic">Asymptomatic (No Chest Pain)</option>
                  <option value="non_anginal">Non-Anginal Discomfort</option>
                  <option value="atypical_angina">Atypical Angina</option>
                  <option value="typical_angina">Typical Angina (Exertional Pressure)</option>
                </select>
              </div>

              {/* Resting ECG */}
              <div className="space-y-1.5">
                <label htmlFor="input-ecg" className="text-xs font-semibold text-[var(--text)] block">
                  Resting Electrocardiogram (ECG)
                </label>
                <select
                  id="input-ecg"
                  value={formData.resting_ecg}
                  onChange={(e) => updateField("resting_ecg", e.target.value as RestingEcg)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="normal">Normal Baseline</option>
                  <option value="st_t_abnormality">ST-T Wave Abnormality</option>
                  <option value="lv_hypertrophy">Left Ventricular Hypertrophy (LVH)</option>
                </select>
              </div>

              {/* Max Heart Rate */}
              <div className="space-y-1.5">
                <label htmlFor="input-mhr" className="text-xs font-semibold text-[var(--text)] block">
                  Max Heart Rate Achieved (bpm)
                </label>
                <input
                  id="input-mhr"
                  type="number"
                  min={50}
                  max={240}
                  value={formData.max_heart_rate}
                  onChange={(e) => updateField("max_heart_rate", parseFloat(e.target.value) || 140)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              {/* Exercise Angina */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Exertional Angina Induced
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("exercise_angina", false)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border ${
                      !formData.exercise_angina
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)]"
                    }`}
                  >
                    No Angina
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("exercise_angina", true)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border ${
                      formData.exercise_angina
                        ? "bg-[var(--risk-high)] text-white border-[var(--risk-high)]"
                        : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)]"
                    }`}
                  >
                    Yes (Induced)
                  </button>
                </div>
              </div>

              {/* ST Depression */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-std" className="text-xs font-semibold text-[var(--text)]">
                    Exercise ST Depression (Oldpeak)
                  </label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">0.0 to 6.0 mm</span>
                </div>
                <input
                  id="input-std"
                  type="number"
                  step="0.1"
                  min={0.0}
                  max={10.0}
                  value={formData.st_depression}
                  onChange={(e) => updateField("st_depression", parseFloat(e.target.value) || 0.0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              {/* ST Slope */}
              <div className="space-y-1.5">
                <label htmlFor="input-slope" className="text-xs font-semibold text-[var(--text)] block">
                  Peak Exercise ST Slope
                </label>
                <select
                  id="input-slope"
                  value={formData.st_slope}
                  onChange={(e) => updateField("st_slope", e.target.value as StSlope)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="upsloping">Upsloping (Typically Normal)</option>
                  <option value="flat">Flat (Equivocal / Mild Ischemia)</option>
                  <option value="downsloping">Downsloping (High Ischemic Concern)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] hover:border-[var(--text-muted)] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous Step
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all shadow-sm"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-[#06080A] hover:opacity-90 transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <span>Computing Predictions...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compute Dual Risk Assessment</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
