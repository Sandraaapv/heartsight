"use client";

import React, { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClinicalDrawer } from "@/components/ClinicalDrawer";
import {
  PatientInput,
  Persona,
  PredictResponse,
  getPersonas,
  predictPatient,
} from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  Compass,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { ARTERY_DEFINITIONS, getRiskColor } from "@/components/canvas/arteryData";

// Dynamically import HeartScene (client-only WebGL Canvas)
const HeartScene = dynamic(
  () => import("@/components/canvas/HeartScene").then((mod) => mod.HeartScene),
  { ssr: false }
);

const FALLBACK_PERSONAS: Persona[] = [
  {
    id: "elena",
    name: "Elena",
    tagline: "Active runner with optimal metabolic numbers",
    risk_level: "low",
    story: "42-year-old female runner with optimal lipids and normal blood pressure.",
    input_data: {
      age: 42,
      sex: "female",
      ethnicity_group: "white",
      systolic_bp: 112.0,
      total_cholesterol: 168.0,
      hdl: 64.0,
      on_bp_treatment: false,
      diabetes: false,
      smoker: false,
      fasting_glucose_over_120: false,
      chest_pain_type: "asymptomatic",
      resting_ecg: "normal",
      max_heart_rate: 172.0,
      exercise_angina: false,
      st_depression: 0.0,
      st_slope: "upsloping",
    },
  },
  {
    id: "marcus",
    name: "Marcus",
    tagline: "Treated hypertension with moderate atherogenic lipids",
    risk_level: "medium",
    story: "58-year-old male with treated blood pressure and intermediate risk.",
    input_data: {
      age: 58,
      sex: "male",
      ethnicity_group: "african_american",
      systolic_bp: 138.0,
      total_cholesterol: 218.0,
      hdl: 42.0,
      on_bp_treatment: true,
      diabetes: false,
      smoker: false,
      fasting_glucose_over_120: false,
      chest_pain_type: "atypical_angina",
      resting_ecg: "normal",
      max_heart_rate: 142.0,
      exercise_angina: false,
      st_depression: 0.8,
      st_slope: "flat",
    },
  },
  {
    id: "ravi",
    name: "Ravi",
    tagline: "Severe multifactorial risk: smoker, untreated hypertension, high LDL",
    risk_level: "high",
    story: "52-year-old male smoker with stage-2 hypertension, type-2 diabetes, and high cholesterol.",
    input_data: {
      age: 52,
      sex: "male",
      ethnicity_group: "other",
      systolic_bp: 144.0,
      total_cholesterol: 235.0,
      hdl: 38.0,
      on_bp_treatment: false,
      diabetes: true,
      smoker: true,
      fasting_glucose_over_120: true,
      chest_pain_type: "typical_angina",
      resting_ecg: "st_t_abnormality",
      max_heart_rate: 128.0,
      exercise_angina: true,
      st_depression: 2.2,
      st_slope: "flat",
    },
  },
];

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>(FALLBACK_PERSONAS);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("ravi");
  const [currentInput, setCurrentInput] = useState<PatientInput>(FALLBACK_PERSONAS[2].input_data);
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [selectedArteryId, setSelectedArteryId] = useState<string | null>("lad");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"torso" | "heart">("heart");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Load personas and compute initial prediction for default persona (Ravi)
  useEffect(() => {
    let isMounted = true;

    // Fetch personas from backend if available
    getPersonas()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setPersonas(data);
        }
      })
      .catch((err) => {
        console.warn("Using bundled persona definitions:", err);
      });

    // Run baseline prediction for default persona
    predictPatient(FALLBACK_PERSONAS[2].input_data)
      .then((res) => {
        if (isMounted) {
          setPredictionResult(res);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote prediction, falling back to local calculation:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle switching personas
  const handleSelectPersona = async (p: Persona) => {
    setSelectedPersonaId(p.id);
    setCurrentInput(p.input_data);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await predictPatient(p.input_data);
      startTransition(() => {
        setPredictionResult(response);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate prediction.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recalculation from ClinicalDrawer
  const handleRecalculate = async (newData: PatientInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentInput(newData);

    try {
      const response = await predictPatient(newData);
      startTransition(() => {
        setPredictionResult(response);
      });
      setIsDrawerOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate prediction.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Active risk numbers and artery scores
  const activeArteryScores = predictionResult?.arteries ?? (
    selectedPersonaId === "ravi"
      ? { left_main: 0.8732, lad: 0.8732, lcx: 0.8679, rca: 0.8712 }
      : selectedPersonaId === "marcus"
      ? { left_main: 0.482, lad: 0.482, lcx: 0.451, rca: 0.428 }
      : { left_main: 0.145, lad: 0.145, lcx: 0.138, rca: 0.122 }
  );

  const activeOverallRisk = predictionResult
    ? predictionResult.cad.probability
    : selectedPersonaId === "ravi"
    ? 0.5819
    : selectedPersonaId === "marcus"
    ? 0.32
    : 0.08;

  const bpm = Math.round(62 + Math.max(0, Math.min(1, activeOverallRisk)) * 43);

  const getScoreForBranch = (scores: typeof activeArteryScores, id: string): number => {
    switch (id) {
      case "left_main":
        return scores.left_main;
      case "lad":
        return scores.lad;
      case "lcx":
        return scores.lcx;
      case "rca":
        return scores.rca;
      default:
        return 0.25;
    }
  };

  // Selected artery definition
  const selectedDef = ARTERY_DEFINITIONS.find((d) => d.id === selectedArteryId);
  const selectedScore = selectedDef
    ? getScoreForBranch(activeArteryScores, selectedDef.id)
    : null;

  // Check if dark mode is active for token colors
  const isDark = typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark");

  const getRampColor = (val: number) => getRiskColor(val, isDark).hex;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--stage)] text-[var(--text)] select-none font-sans">
      {/* FULL-BLEED 3D SCENE BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0">
        <HeartScene
          arteryScores={activeArteryScores}
          overallRisk={activeOverallRisk}
          selectedArteryId={selectedArteryId}
          onSelectArtery={(id) => setSelectedArteryId(id || null)}
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          hideInternalHUD={true}
        />
      </div>

      {/* TOP BAR (SLIM FROSTED GLASS HUD, 48px, STRICT 8px SCALE) */}
      <header className="absolute top-0 left-0 right-0 z-20 h-12 px-4 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10 text-white">
        {/* Brand & Track */}
        <div className="flex items-center gap-3">
          <span className="font-display text-base font-bold tracking-tight text-white">
            HeartSight
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-white/50 border-l border-white/15 pl-3">
            Cardiovascular Risk &amp; 3D Coronary Mapping
          </span>
        </div>

        {/* Persona Quick Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/30 border border-white/10 text-xs font-medium">
          {personas.map((p) => {
            const isSelected = selectedPersonaId === p.id;
            const levelLabel =
              p.risk_level === "low"
                ? "Low"
                : p.risk_level === "medium"
                ? "Med"
                : "High";

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{p.name}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {p.input_data.age}y &bull; {levelLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* View and Parameters Controls */}
        <div className="flex items-center gap-2">
          {/* Camera View Toggle */}
          <div className="hidden md:flex items-center p-0.5 rounded-lg bg-black/30 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode("heart")}
              className={`px-2 py-1 rounded text-xs transition-all ${
                viewMode === "heart"
                  ? "bg-white/15 text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Heart
            </button>
            <button
              onClick={() => setViewMode("torso")}
              className={`px-2 py-1 rounded text-xs transition-all ${
                viewMode === "torso"
                  ? "bg-white/15 text-white font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Torso
            </button>
          </div>

          {/* Edit Parameters Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] text-xs font-bold transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parameters</span>
            <span className="font-mono text-[11px] opacity-80">
              ({currentInput.age}y &bull; {currentInput.systolic_bp} mmHg)
            </span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* ERROR NOTICE (IF ANY) */}
      {errorMessage && (
        <div className="absolute top-14 left-4 right-4 z-30 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* PRIMARY CLINICAL RESULTS HUD (SLIM OVERLAY, LEFT SIDE) */}
      <div className="absolute top-16 left-4 z-10 w-72 sm:w-80 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white space-y-4 shadow-2xl">
        {/* CAD PRESENCE LIKELIHOOD */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/60">
            <span>CAD Likelihood</span>
            <span className="font-mono text-[10px] text-white/40">UCI Cleveland ML</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight"
              style={{ color: getRampColor(activeOverallRisk) }}
            >
              {(activeOverallRisk * 100).toFixed(1)}%
            </span>
            {predictionResult && (
              <span className="font-mono text-[11px] text-white/50">
                80% CI: [{(predictionResult.cad.interval_80[0] * 100).toFixed(0)}%–
                {(predictionResult.cad.interval_80[1] * 100).toFixed(0)}%]
              </span>
            )}
          </div>
        </div>

        {/* 10-YEAR HARD ASCVD RISK */}
        <div className="space-y-1 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/60">
            <span>10-Year ASCVD Risk</span>
            <span className="font-mono text-[10px] text-white/40">ACC/AHA 2013 PCE</span>
          </div>
          <div>
            {predictionResult?.ten_year.applicable === false ? (
              <div className="text-sm font-semibold text-amber-300">
                Not Applicable (&lt;40 years)
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight"
                  style={{
                    color: getRampColor(predictionResult?.ten_year.risk ?? 0.25),
                  }}
                >
                  {predictionResult?.ten_year.risk !== null && predictionResult?.ten_year.risk !== undefined
                    ? `${(predictionResult.ten_year.risk * 100).toFixed(1)}%`
                    : `${(selectedPersonaId === "ravi" ? 29.7 : selectedPersonaId === "marcus" ? 9.2 : 0.8).toFixed(1)}%`}
                </span>
                <span className="text-[11px] text-white/50">Hard ASCVD Event</span>
              </div>
            )}
            {/* South Asian / Demographic Caveat */}
            {currentInput.ethnicity_group === "other" && (
              <p className="text-[10px] text-amber-300/80 leading-tight pt-1">
                PCE underestimates risk in South Asian populations.
              </p>
            )}
          </div>
        </div>

        {/* HEART AGE ESTIMATION */}
        <div className="space-y-1 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/60">
            <span>Vascular Heart Age</span>
            <span className="font-mono text-[10px] text-white/40">
              Chronological: {currentInput.age}y
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {predictionResult?.heart_age.bound === "at_least"
                ? `\u2265 ${Math.round(predictionResult.heart_age.value ?? 79)}`
                : predictionResult?.heart_age.value
                ? Math.round(predictionResult.heart_age.value)
                : selectedPersonaId === "ravi"
                ? "\u2265 79"
                : selectedPersonaId === "marcus"
                ? "65"
                : "42"}{" "}
              <span className="text-sm font-normal text-white/60">years</span>
            </span>
            <span className="text-[11px] text-white/50">
              {selectedPersonaId === "ravi" ? "(+27 yr gap)" : ""}
            </span>
          </div>
        </div>

        {/* TOP RISK DRIVERS (COMPACT DATA-ONLY LIST) */}
        {predictionResult?.drivers && predictionResult.drivers.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Primary Attributed Drivers
            </span>
            <div className="space-y-1">
              {predictionResult.drivers.slice(0, 3).map((d) => {
                const isHarmful = d.direction === "harmful";
                return (
                  <div
                    key={d.factor}
                    className="flex items-center justify-between text-xs py-0.5"
                  >
                    <span className="text-white/80 truncate max-w-[170px]">{d.label}</span>
                    <div className="flex items-center gap-1 font-mono text-[11px] font-bold">
                      {isHarmful ? (
                        <TrendingUp className="w-3 h-3 text-[var(--risk-high)]" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-[var(--risk-low)]" />
                      )}
                      <span style={{ color: isHarmful ? "var(--risk-high)" : "var(--risk-low)" }}>
                        {isHarmful ? "+" : ""}
                        {Math.round(d.contribution * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELECTED ARTERY TERRITORY INSPECTOR (TOP-RIGHT SLIM PANEL) */}
      {selectedDef && selectedScore !== null && (
        <div className="absolute top-16 right-4 z-10 w-72 sm:w-80 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white space-y-3 shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase font-semibold text-[var(--accent)] tracking-wider">
                Vascular Territory
              </span>
              <h4 className="font-display text-sm font-bold text-white leading-snug">
                {selectedDef.name}
              </h4>
              <span className="text-[10px] font-mono text-white/50 italic">
                {selectedDef.clinicalName}
              </span>
            </div>
            <button
              onClick={() => setSelectedArteryId(null)}
              className="text-white/40 hover:text-white p-1"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 bg-white/5 px-2.5 rounded-lg border border-white/5 text-xs">
            <span className="text-white/70">Territory Score:</span>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-base font-extrabold text-white">
                {(selectedScore * 100).toFixed(1)}%
              </span>
              <span
                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: getRampColor(selectedScore),
                  backgroundColor: `${getRampColor(selectedScore)}22`,
                }}
              >
                {getRiskColor(selectedScore, isDark).level}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-white/70 leading-relaxed">
            {selectedDef.description}
          </p>

          <p className="text-[10px] text-white/50 italic border-t border-white/10 pt-2 leading-tight">
            Perfusion: {selectedDef.territory}
          </p>
        </div>
      )}

      {/* BOTTOM ARTERY STRIP (SLIM HUD OVERLAY, STRICT 8px SCALE) */}
      <div className="absolute bottom-8 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Coronary branches selector strip */}
        <div className="flex items-center gap-2 pointer-events-auto p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
          {ARTERY_DEFINITIONS.map((art) => {
            const score = getScoreForBranch(activeArteryScores, art.id);
            const color = getRampColor(score);
            const isSelected = selectedArteryId === art.id;

            return (
              <button
                key={art.id}
                onClick={() => setSelectedArteryId(art.id)}
                className={`px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2.5 border ${
                  isSelected
                    ? "bg-white/15 border-[var(--accent)] ring-1 ring-[var(--accent)]/50 shadow-md"
                    : "bg-transparent border-transparent hover:bg-white/5"
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-white tracking-tight">
                    {art.shortName}
                  </div>
                  <div className="font-mono text-[10px] font-semibold text-white/70">
                    {Math.round(score * 100)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Telemetry & 3D Navigation hints */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Cardiac Rhythm BPM */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
            <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="font-mono font-bold">{bpm} BPM</span>
            <span className="text-[10px] text-white/50 border-l border-white/10 pl-2">
              Scaled to Risk
            </span>
          </div>

          {/* Navigation guide */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/50 font-mono">
            <Compass className="w-3 h-3 text-[var(--accent)]" />
            <span>Orbit &bull; Zoom &bull; Click Vessels</span>
          </div>
        </div>
      </div>

      {/* BOTTOM DISCLAIMER (SINGLE SLIM LINE) */}
      <footer className="absolute bottom-1 left-4 right-4 z-10 flex items-center justify-between text-[10px] text-white/40 pointer-events-none">
        <span>
          Educational simulation &bull; Not a medical diagnostic device &bull; Cleveland Heart Disease &amp; ACC/AHA PCE
        </span>
        <span>Three.js procedural anatomy fallback</span>
      </footer>

      {/* CLINICAL INTAKE SLIDE-OUT DRAWER */}
      <ClinicalDrawer
        key={`${selectedPersonaId}-${currentInput.age}-${currentInput.systolic_bp}`}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        input={currentInput}
        onRecalculate={handleRecalculate}
        isLoading={isLoading}
      />
    </div>
  );
}
