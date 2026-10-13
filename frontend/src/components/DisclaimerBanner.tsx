"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <aside
      aria-label="Medical Disclaimer"
      className="w-full bg-[var(--bg-tint)] border-b border-[var(--border)] px-4 py-2.5 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[var(--text-muted)] gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>
            <strong className="text-[var(--text)] font-semibold">Educational Exploration Tool:</strong>{" "}
            HeartSight is not a clinical diagnostic system. Per-artery highlights are illustrative heuristics. No patient data is retained.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] opacity-80">
          Track A • Multimodal AI 2026
        </span>
      </div>
    </aside>
  );
}
