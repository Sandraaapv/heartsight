"use client";

import React from "react";
import { PatientInput, Persona } from "@/lib/api";
import { UserCheck, ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

interface PersonaGalleryProps {
  personas: Persona[];
  onSelectPersona: (data: PatientInput) => void;
  selectedPersonaId?: string;
}

export function PersonaGallery({
  personas,
  onSelectPersona,
  selectedPersonaId,
}: PersonaGalleryProps) {
  const getBadgeStyle = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return {
          bg: "rgba(31, 157, 143, 0.12)",
          color: "var(--risk-low)",
          border: "rgba(31, 157, 143, 0.3)",
          icon: ShieldCheck,
        };
      case "medium":
        return {
          bg: "rgba(224, 160, 48, 0.12)",
          color: "var(--risk-elevated)",
          border: "rgba(224, 160, 48, 0.3)",
          icon: AlertTriangle,
        };
      case "high":
        return {
          bg: "rgba(209, 75, 75, 0.12)",
          color: "var(--risk-high)",
          border: "rgba(209, 75, 75, 0.3)",
          icon: AlertOctagon,
        };
    }
  };

  return (
    <section id="personas-section" className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold font-display text-[var(--text)]">
            Explore Demonstration Personas
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Load realistic clinical phenotypes to benchmark models and explore risk stratification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personas.map((persona) => {
          const badge = getBadgeStyle(persona.risk_level);
          const Icon = badge.icon;
          const isSelected = selectedPersonaId === persona.id;

          return (
            <div
              key={persona.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-[var(--surface)] ${
                isSelected
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-md"
                  : "border-[var(--border)] hover:border-[var(--text-muted)]/40 hover:shadow-sm"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-[var(--text)]">
                    {persona.name}
                  </span>
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      borderColor: badge.border,
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border"
                  >
                    <Icon className="w-3 h-3" />
                    {persona.risk_level} Risk
                  </span>
                </div>

                <p className="text-xs font-medium text-[var(--text)]">
                  {persona.tagline}
                </p>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                  {persona.story}
                </p>

                <div className="pt-2 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-[11px] text-[var(--text-muted)]">
                  <div>
                    <span className="block opacity-75">Age/Sex</span>
                    <strong className="text-[var(--text)] capitalize font-semibold">
                      {persona.input_data.age} / {persona.input_data.sex}
                    </strong>
                  </div>
                  <div>
                    <span className="block opacity-75">BP / Meds</span>
                    <strong className="text-[var(--text)] font-semibold">
                      {persona.input_data.systolic_bp} {persona.input_data.on_bp_treatment ? "(Rx)" : ""}
                    </strong>
                  </div>
                  <div>
                    <span className="block opacity-75">TC / HDL</span>
                    <strong className="text-[var(--text)] font-semibold">
                      {persona.input_data.total_cholesterol} / {persona.input_data.hdl}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPersona(persona.input_data)}
                className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-[var(--sage-soft)] text-[var(--text)] hover:bg-[var(--primary)] hover:text-white"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {isSelected ? "Loaded In Intake Form" : "Load Into Intake Form"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
