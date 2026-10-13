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
import { X, RefreshCw } from "lucide-react";

interface ClinicalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  input: PatientInput;
  onRecalculate: (data: PatientInput) => Promise<void>;
  isLoading: boolean;
}

export function ClinicalDrawer({
  isOpen,
  onClose,
  input,
  onRecalculate,
  isLoading,
}: ClinicalDrawerProps) {
  const [data, setData] = useState<PatientInput>(input);
  const [activeTab, setActiveTab] = useState<"basics" | "vitals" | "lifestyle" | "ecg">("basics");

  if (!isOpen) return null;

  const update = <K extends keyof PatientInput>(key: K, val: PatientInput[K]) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecalculate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[var(--surface)] text-[var(--text)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* DRAWER HEADER */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Clinical Parameters</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Modify values to recalculate risk and update the 3D heart
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Close parameters drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[var(--border)] px-4 bg-[var(--bg)] text-xs font-medium">
          {[
            { id: "basics", label: "Basics" },
            { id: "vitals", label: "Vitals & Labs" },
            { id: "lifestyle", label: "Lifestyle" },
            { id: "ecg", label: "ECG & Stress" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3 py-2.5 border-b-2 transition-all ${
                activeTab === t.id
                  ? "border-[var(--accent)] text-[var(--text)] font-bold"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* DRAWER BODY */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "basics" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  Age (years)
                </label>
                <input
                  type="number"
                  min={20}
                  max={90}
                  value={data.age}
                  onChange={(e) => update("age", parseInt(e.target.value) || 40)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] font-mono text-sm"
                />
                <span className="text-[11px] text-[var(--text-muted)]">PCE validated for ages 40–79</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  Biological Sex
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as Sex[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update("sex", s)}
                      className={`py-2 text-xs font-semibold capitalize rounded-lg border transition-all ${
                        data.sex === s
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)] font-bold"
                          : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  Demographic Group (PCE Coefficients)
                </label>
                <select
                  value={data.ethnicity_group}
                  onChange={(e) => update("ethnicity_group", e.target.value as EthnicityGroup)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-medium"
                >
                  <option value="white">White / Caucasian</option>
                  <option value="african_american">African American / Black</option>
                  <option value="other">Other / South Asian (with PCE caveat)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "vitals" && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Systolic Blood Pressure (mmHg)
                  </span>
                  <span className="font-mono font-bold">{data.systolic_bp}</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={200}
                  value={data.systolic_bp}
                  onChange={(e) => update("systolic_bp", parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Total Cholesterol (mg/dL)
                  </span>
                  <span className="font-mono font-bold">{data.total_cholesterol}</span>
                </div>
                <input
                  type="range"
                  min={120}
                  max={360}
                  value={data.total_cholesterol}
                  onChange={(e) => update("total_cholesterol", parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    HDL &quot;Good&quot; Cholesterol (mg/dL)
                  </span>
                  <span className="font-mono font-bold">{data.hdl}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={data.hdl}
                  onChange={(e) => update("hdl", parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.on_bp_treatment}
                    onChange={(e) => update("on_bp_treatment", e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent)]"
                  />
                  <span className="text-xs font-semibold">Treated for Hypertension (BP Meds)</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "lifestyle" && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
                <input
                  type="checkbox"
                  checked={data.smoker}
                  onChange={(e) => update("smoker", e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div>
                  <span className="block text-xs font-bold">Current Cigarette Smoker</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Regular tobacco exposure</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
                <input
                  type="checkbox"
                  checked={data.diabetes}
                  onChange={(e) => update("diabetes", e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div>
                  <span className="block text-xs font-bold">Diagnosed Diabetes Mellitus</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Type 1 or Type 2 diabetes history</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
                <input
                  type="checkbox"
                  checked={data.fasting_glucose_over_120}
                  onChange={(e) => update("fasting_glucose_over_120", e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div>
                  <span className="block text-xs font-bold">Fasting Blood Glucose &gt; 120 mg/dL</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Impaired fasting glycaemia threshold</span>
                </div>
              </label>
            </div>
          )}

          {activeTab === "ecg" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  Chest Pain Presentation
                </label>
                <select
                  value={data.chest_pain_type}
                  onChange={(e) => update("chest_pain_type", e.target.value as ChestPainType)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-medium"
                >
                  <option value="asymptomatic">Asymptomatic (No ischemic pain)</option>
                  <option value="atypical_angina">Atypical Angina (Non-classic discomfort)</option>
                  <option value="non_anginal">Non-Anginal Discomfort</option>
                  <option value="typical_angina">Typical Angina (Classic exertional chest pain)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  Resting Electrocardiogram (ECG)
                </label>
                <select
                  value={data.resting_ecg}
                  onChange={(e) => update("resting_ecg", e.target.value as RestingEcg)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-medium"
                >
                  <option value="normal">Normal Electrophysiology</option>
                  <option value="st_t_abnormality">ST-T Wave Abnormality</option>
                  <option value="lv_hypertrophy">Left Ventricular Hypertrophy (Estes criteria)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Maximum Exercise Heart Rate (BPM)
                  </span>
                  <span className="font-mono font-bold">{data.max_heart_rate}</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={210}
                  value={data.max_heart_rate}
                  onChange={(e) => update("max_heart_rate", parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={data.exercise_angina}
                  onChange={(e) => update("exercise_angina", e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <span className="text-xs font-semibold">Exercise-Induced Angina (Pain on treadmill test)</span>
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  ST Depression (Oldpeak, mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="6.0"
                  value={data.st_depression}
                  onChange={(e) => update("st_depression", parseFloat(e.target.value) || 0.0)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                  ST Segment Slope
                </label>
                <select
                  value={data.st_slope}
                  onChange={(e) => update("st_slope", e.target.value as StSlope)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-medium"
                >
                  <option value="upsloping">Upsloping (Physiological)</option>
                  <option value="flat">Flat (Equivocal / Ischemic)</option>
                  <option value="downsloping">Downsloping (High Ischemic Probability)</option>
                </select>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-bold text-xs bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Recalculating..." : "Apply & Recalculate Risk"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
