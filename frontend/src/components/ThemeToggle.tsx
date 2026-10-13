"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyThemeClass(newTheme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (newTheme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let initial: "light" | "dark" = "light";
    try {
      const saved = localStorage.getItem("heartsight-theme");
      if (saved === "light" || saved === "dark") {
        initial = saved;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      }
    } catch {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      }
    }
    applyThemeClass(initial);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyThemeClass(nextTheme);

    try {
      localStorage.setItem("heartsight-theme", nextTheme);
    } catch {
      // Ignore local storage error in private mode
    }
  };

  return (
    <button
      onClick={toggleTheme}
      id="theme-toggle-button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-[var(--text-muted)]" />
      ) : (
        <Sun className="w-4 h-4 text-[var(--accent)]" />
      )}
    </button>
  );
}
