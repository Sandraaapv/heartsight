"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { ProceduralTorso } from "./ProceduralTorso";
import { ProceduralHeart } from "./ProceduralHeart";
import { ArteryTubes } from "./ArteryTubes";
import { SceneEnvironment } from "./SceneEnvironment";
import { CameraController } from "./CameraController";
import { ARTERY_DEFINITIONS, ArteryDefinition, getRiskColor } from "./arteryData";
import { ArteryScores } from "@/lib/api";
import {
  Activity,
  Compass,
  Info,
  Maximize2,
} from "lucide-react";

interface HeartSceneProps {
  arteryScores?: ArteryScores;
  overallRisk?: number; // 0..1
  selectedArteryId?: string | null;
  onSelectArtery?: (arteryId: string) => void;
  className?: string;
  initialViewMode?: "torso" | "heart";
  showCalloutCards?: boolean;
}

function subscribeTheme(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark"
  );
}

export function HeartScene({
  arteryScores,
  overallRisk = 0.25,
  selectedArteryId,
  onSelectArtery,
  className = "",
  initialViewMode = "heart",
  showCalloutCards = true,
}: HeartSceneProps) {
  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);
  const [viewMode, setViewMode] = useState<"torso" | "heart">(initialViewMode);
  const [autoRotate, setAutoRotate] = useState(false);
  const [hoveredArtery, setHoveredArtery] = useState<{
    def: ArteryDefinition;
    x: number;
    y: number;
  } | null>(null);

  // Stage backdrop colors from BUILD_PLAN.md section 6:
  // Light: #10302C (deep green-teal so risk colors stand out)
  // Dark:  #05070A (near-black)
  const stageBgColor = isDark ? "#05070A" : "#10302C";

  const getScoreForArtery = (id: string): number => {
    if (!arteryScores) return 0.25;
    switch (id) {
      case "left_main":
        return arteryScores.left_main;
      case "lad":
        return arteryScores.lad;
      case "lcx":
        return arteryScores.lcx;
      case "rca":
        return arteryScores.rca;
      default:
        return 0.25;
    }
  };

  const selectedDef = ARTERY_DEFINITIONS.find((d) => d.id === selectedArteryId);
  const selectedScore = selectedDef ? getScoreForArtery(selectedDef.id) : null;
  const bpm = Math.round(62 + Math.max(0, Math.min(1, overallRisk)) * 43);

  return (
    <div
      className={`relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)] select-none ${className}`}
      style={{ backgroundColor: stageBgColor }}
    >
      {/* 3D WEBGL CANVAS */}
      <Canvas
        camera={{ position: [0, 0, initialViewMode === "torso" ? 6.2 : 3.1], fov: 45 }}
        dpr={[1, 1.75]} // Cap DPR for smooth mid-range phone & laptop frame rates
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={[stageBgColor]} />

        {/* Dynamic Scene Lighting and Holographic Ambience */}
        <SceneEnvironment isDark={isDark} />

        {/* Stylized Torso Wireframe Silhouette (Fade when in focused heart mode) */}
        <ProceduralTorso isDark={isDark} visible={viewMode === "torso"} />

        {/* Stylized Beating Heart with Heartbeat scaled to Risk */}
        <ProceduralHeart isDark={isDark} riskScore={overallRisk}>
          {/* Coronary Arteries as CatmullRom tubes */}
          <ArteryTubes
            isDark={isDark}
            arteryScores={arteryScores}
            selectedArteryId={selectedArteryId}
            onSelectArtery={(id) => onSelectArtery?.(id)}
            onHoverArtery={(def, clientX, clientY) => {
              if (def && clientX !== undefined && clientY !== undefined) {
                setHoveredArtery({ def, x: clientX, y: clientY });
              } else {
                setHoveredArtery(null);
              }
            }}
          />
        </ProceduralHeart>

        {/* Orbit Controls with Fly-In Camera lerp */}
        <CameraController viewMode={viewMode} autoRotate={autoRotate} />
      </Canvas>

      {/* TOP CONTROLS HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* View Mode Toggle Pill */}
        <div className="inline-flex p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-auto">
          <button
            onClick={() => setViewMode("heart")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === "heart"
                ? "bg-[var(--accent)] text-black shadow-md font-bold"
                : "text-white/70 hover:text-white"
            }`}
          >
            Heart &amp; Arteries
          </button>
          <button
            onClick={() => setViewMode("torso")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === "torso"
                ? "bg-[var(--accent)] text-black shadow-md font-bold"
                : "text-white/70 hover:text-white"
            }`}
          >
            Torso Context
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Pulse rate indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white/80">
            <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="font-mono font-medium">{bpm} BPM</span>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle rotation"
            className={`p-2 rounded-full border transition-all ${
              autoRotate
                ? "bg-[var(--accent)] text-black border-transparent"
                : "bg-black/40 text-white/70 border-white/10 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setViewMode(viewMode === "heart" ? "torso" : "heart");
            }}
            title="Toggle camera zoom"
            className="p-2 rounded-full bg-black/40 text-white/70 border border-white/10 hover:text-white transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HOVER TOOLTIP */}
      {hoveredArtery && !selectedDef && (
        <div className="absolute top-16 left-4 pointer-events-none px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--accent)]">
              {hoveredArtery.def.name}
            </span>
            <span className="font-mono font-semibold text-white/80">
              {Math.round(getScoreForArtery(hoveredArtery.def.id) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ARTERY CALLOUT CARDS OVERLAY (DASHBOARD CALLOUT PATTERN) */}
      {showCalloutCards && (
        <div className="absolute bottom-12 left-4 right-4 pointer-events-none">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ARTERY_DEFINITIONS.map((art) => {
              const score = getScoreForArtery(art.id);
              const colorInfo = getRiskColor(score, isDark);
              const isSelected = selectedArteryId === art.id;

              return (
                <button
                  key={art.id}
                  onClick={() => onSelectArtery?.(art.id)}
                  className={`pointer-events-auto text-left p-2.5 rounded-xl transition-all border backdrop-blur-md ${
                    isSelected
                      ? "bg-black/80 border-[var(--accent)] ring-2 ring-[var(--accent)]/40 shadow-lg scale-[1.02]"
                      : "bg-black/40 border-white/10 hover:bg-black/60 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white tracking-wide truncate">
                      {art.shortName}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorInfo.hex }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm font-extrabold text-white">
                      {Math.round(score * 100)}%
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: colorInfo.hex,
                        backgroundColor: `${colorInfo.hex}22`,
                      }}
                    >
                      {colorInfo.level}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTED ARTERY DETAIL MODAL / DRAWER */}
      {selectedDef && selectedScore !== null && (
        <div className="absolute top-16 right-4 max-w-xs w-full p-4 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-white shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider">
                Coronary Territory
              </span>
              <h4 className="text-sm font-bold text-white leading-snug">
                {selectedDef.name}
              </h4>
            </div>
            <button
              onClick={() => onSelectArtery?.("")}
              className="text-white/50 hover:text-white p-1"
            >
              &times;
            </button>
          </div>

          <p className="text-xs text-white/70 mb-3 leading-relaxed">
            {selectedDef.description}
          </p>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1 mb-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Estimated Territory Score:</span>
              <span className="font-mono font-bold text-white text-sm">
                {Math.round(selectedScore * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Vessel Category:</span>
              <span
                className="font-semibold capitalize text-xs"
                style={{ color: getRiskColor(selectedScore, isDark).hex }}
              >
                {getRiskColor(selectedScore, isDark).level} Risk
              </span>
            </div>
          </div>

          <p className="text-[10px] text-white/50 italic leading-tight">
            Territory: {selectedDef.territory}
          </p>
        </div>
      )}

      {/* ATTRIBUTION & CONTROLS FOOTER */}
      <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[10px] text-white/40 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-[var(--accent)]/70" />
          <span>Procedural stylized anatomy fallback (Three.js) &bull; HeartSight</span>
        </div>
        <span>Drag to orbit &bull; Scroll to zoom</span>
      </div>
    </div>
  );
}
