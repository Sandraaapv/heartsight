"use client";

import React from "react";
import { PredictResponse } from "@/lib/api";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface PredictionResultCardProps {
  prediction: PredictResponse;
}

export function PredictionResultCard({ prediction }: PredictionResultCardProps) {
  const getRiskRampColor = (val: number) => {
    if (val < 0.33) return "var(--risk-low)";
    if (val < 0.66) return "var(--risk-elevated)";
    return "var(--risk-high)";
  };

  const cadPct = (prediction.cad.probability * 100).toFixed(1);
  const cadLo = (prediction.cad.interval_80[0] * 100).toFixed(1);
  const cadHi = (prediction.cad.interval_80[1] * 100).toFixed(1);

  return (
    <div className="w-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 space-y-6 shadow-sm transition-colors animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-2">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-[var(--accent)]">
            Computed Output
          </span>
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">
            Dual Risk Assessment Summary
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <CheckCircle className="w-4 h-4 text-[var(--primary)]" />
          <span>Validated Models</span>
        </div>
      </div>

      {/* Top Prediction Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: CAD Presence Likelihood */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">CAD Likelihood</span>
            <Activity className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              style={{ color: getRiskRampColor(prediction.cad.probability) }}
              className="text-4xl font-extrabold font-display tracking-tight"
            >
              {cadPct}%
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">point est.</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
            80% Confidence Range:{" "}
            <strong className="text-[var(--text)] font-mono">
              {cadLo}% – {cadHi}%
            </strong>
          </p>
        </div>

        {/* Metric 2: 10-Year ASCVD Risk */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">10-Year Hard ASCVD</span>
            <Calendar className="w-4 h-4 text-[var(--primary)]" />
          </div>
          {prediction.ten_year.applicable && prediction.ten_year.risk !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  style={{ color: getRiskRampColor(prediction.ten_year.risk) }}
                  className="text-4xl font-extrabold font-display tracking-tight"
                >
                  {(prediction.ten_year.risk * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">PCE Model</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)] line-clamp-2">
                {prediction.ten_year.note}
              </p>
            </>
          ) : (
            <div className="py-2">
              <span className="text-sm font-semibold text-[var(--text-muted)]">
                Not Applicable
              </span>
              <p className="text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                {prediction.ten_year.note}
              </p>
            </div>
          )}
        </div>

        {/* Metric 3: Heart Age */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Biological Heart Age</span>
            <Clock className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-display tracking-tight text-[var(--text)]">
              {prediction.heart_age.value !== null ? `${prediction.heart_age.value}` : "N/A"}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {prediction.heart_age.bound === "exact"
                ? "years"
                : prediction.heart_age.bound === "at_most"
                ? "&le; 40 yrs"
                : "&ge; 79 yrs"}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
            Age of ideal risk-factor profile with equivalent 10-year probability.
          </p>
        </div>
      </div>

      {/* Illustrative Coronary Artery Scores */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
              Illustrative Coronary Artery Mapping
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Heuristic scores mapping multi-modal clinical drivers onto the four main coronary branches (0.00 – 1.00).
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--risk-low)]" /> Low
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--risk-elevated)]" /> Elevated
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--risk-high)]" /> High
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "left_main", label: "Left Main (LMCA)", score: prediction.arteries.left_main },
            { key: "lad", label: "LAD (Anterior)", score: prediction.arteries.lad },
            { key: "lcx", label: "LCX (Circumflex)", score: prediction.arteries.lcx },
            { key: "rca", label: "RCA (Right Coronary)", score: prediction.arteries.rca },
          ].map((art) => (
            <div
              key={art.key}
              className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text)]">{art.label}</span>
                <span
                  style={{ color: getRiskRampColor(art.score) }}
                  className="font-mono font-bold"
                >
                  {art.score.toFixed(3)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                <div
                  style={{
                    width: `${Math.round(art.score * 100)}%`,
                    backgroundColor: getRiskRampColor(art.score),
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clinical Drivers */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
          Top Risk Drivers (SHAP &amp; Counterfactuals)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {prediction.drivers.map((drv) => {
            const isHarmful = drv.direction === "harmful";
            return (
              <div
                key={drv.factor}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-[var(--text)]">{drv.label}</span>
                  <span className="block text-[10px] text-[var(--text-muted)] capitalize font-mono">
                    Source: {drv.source}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold">
                  {isHarmful ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--risk-high)]" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-[var(--risk-low)]" />
                  )}
                  <span
                    style={{
                      color: isHarmful ? "var(--risk-high)" : "var(--risk-low)",
                    }}
                  >
                    {drv.contribution > 0 ? `+${drv.contribution}` : drv.contribution}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-tint)] text-xs text-[var(--text-muted)] border border-[var(--border)] flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
        <span>{prediction.disclaimer}</span>
      </div>
    </div>
  );
}
