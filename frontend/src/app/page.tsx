"use client";

import React, { useEffect, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Header } from "@/components/Header";
import { IntakeForm } from "@/components/IntakeForm";
import { PersonaGallery } from "@/components/PersonaGallery";
import { PredictionResultCard } from "@/components/PredictionResultCard";
import {
  PatientInput,
  Persona,
  PredictResponse,
  getPersonas,
  predictPatient,
} from "@/lib/api";
import {
  AlertTriangle,
  ArrowDown,
  HeartPulse,
  Sparkles,
} from "lucide-react";

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
  const [currentInput, setCurrentInput] = useState<PatientInput>(FALLBACK_PERSONAS[2].input_data);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("ravi");
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch personas on mount from API
  useEffect(() => {
    let isMounted = true;
    getPersonas()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setPersonas(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote personas, using static definitions:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPersona = (data: PatientInput) => {
    setCurrentInput(data);
    const matched = personas.find(
      (p) =>
        p.input_data.age === data.age &&
        p.input_data.sex === data.sex &&
        p.input_data.systolic_bp === data.systolic_bp
    );
    if (matched) {
      setSelectedPersonaId(matched.id);
    }
    // Scroll smoothly to intake form
    const elem = document.getElementById("intake-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (formData: PatientInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await predictPatient(formData);
      console.log("Prediction Result:", response);
      setPredictionResult(response);

      // Scroll to results
      setTimeout(() => {
        const resultElem = document.getElementById("results-anchor");
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (err: unknown) {
      console.error("Prediction failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to connect to the prediction service.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <DisclaimerBanner />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[var(--sage-soft)] text-[var(--text)] border border-[var(--border)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Track A: Cardiovascular Risk Visualization &amp; Prediction</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-[var(--text)] leading-tight">
            Beat the odds.
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
            Enter clinical and physiological parameters to compute dual cardiovascular predictions:
            Coronary Artery Disease likelihood and 10-year ASCVD risk, mapped onto illustrative coronary territories.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#intake-section"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all shadow-sm"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Start Risk Assessment</span>
              <ArrowDown className="w-3.5 h-3.5 opacity-70" />
            </a>
            <a
              href="#personas-section"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--text-muted)] transition-all"
            >
              <span>Explore Example Patients</span>
            </a>
          </div>
        </section>

        {/* PERSONA GALLERY */}
        <PersonaGallery
          personas={personas}
          onSelectPersona={handleSelectPersona}
          selectedPersonaId={selectedPersonaId}
        />

        {/* STEPPED INTAKE FORM */}
        <IntakeForm
          key={selectedPersonaId}
          initialValues={currentInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* COMPUTED RESULT DISPLAY */}
        <div id="results-anchor">
          {predictionResult && (
            <PredictionResultCard prediction={predictionResult} />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8 px-4 text-center text-xs text-[var(--text-muted)] mt-12 transition-colors">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-display text-sm font-bold text-[var(--text)]">
            HeartSight &mdash; Multimodal AI Hackathon 2026
          </p>
          <p>
            Educational and research prototype. Models trained on Cleveland Heart Disease and ACC/AHA Pooled Cohort Equations.
          </p>
          <p className="text-[11px] opacity-75">
            No patient records or personal health identifiers are logged or retained.
          </p>
        </div>
      </footer>
    </div>
  );
}
