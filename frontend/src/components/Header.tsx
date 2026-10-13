"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { HeartPulse } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--sage-soft)] flex items-center justify-center text-[var(--primary)] border border-[var(--border)]">
            <HeartPulse className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-[var(--text)]">
                HeartSight
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--sage-soft)] text-[var(--text)] border border-[var(--border)]">
                v0.1
              </span>
            </div>
            <p className="text-xs italic text-[var(--text-muted)] leading-none">
              Beat the odds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-[var(--text-muted)]">
            <a href="#intake-section" className="hover:text-[var(--text)] transition-colors">
              Intake
            </a>
            <a href="#personas-section" className="hover:text-[var(--text)] transition-colors">
              Personas
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
