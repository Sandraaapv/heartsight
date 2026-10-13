"use client";

import React, { useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { ARTERY_DEFINITIONS, ArteryDefinition, interpolateRiskColor } from "./arteryData";
import { ArteryScores } from "@/lib/api";

interface ArteryTubesProps {
  isDark: boolean;
  arteryScores?: ArteryScores;
  selectedArteryId?: string | null;
  onSelectArtery?: (arteryId: string) => void;
  onHoverArtery?: (artery: ArteryDefinition | null, clientX?: number, clientY?: number) => void;
}

interface SingleTubeProps {
  def: ArteryDefinition;
  score: number;
  isDark: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

function SingleArteryTube({
  def,
  score,
  isDark,
  isSelected,
  isHovered,
  onPointerOver,
  onPointerOut,
  onClick,
}: SingleTubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate tube geometry from defined 3D curve
  const tubeGeometry = useMemo(() => {
    const v3Points = def.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(v3Points, false, "centripetal");
    return new THREE.TubeGeometry(curve, 64, def.radius, 16, false);
  }, [def]);

  // Compute color according to the theme and 0..1 score
  const riskColor = useMemo(() => {
    return interpolateRiskColor(score, isDark);
  }, [score, isDark]);

  // Blood pulse flow along the artery
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (!mat) return;

    const t = clock.getElapsedTime() * 2.5;
    const wave = Math.sin(t + def.radius * 20) * 0.15 + 0.85;

    if (isSelected) {
      mat.emissiveIntensity = isDark ? 0.95 : 0.75;
    } else if (isHovered) {
      mat.emissiveIntensity = isDark ? 0.85 : 0.65;
    } else {
      mat.emissiveIntensity = (isDark ? 0.45 : 0.25) * wave;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={tubeGeometry}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={riskColor}
          emissive={riskColor}
          emissiveIntensity={isDark ? 0.5 : 0.25}
          roughness={0.25}
          metalness={0.3}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* Selected Halo Ring Indicator */}
      {isSelected && (
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={riskColor}
            emissiveIntensity={1.2}
            wireframe
            transparent
            opacity={0.65}
          />
        </mesh>
      )}
    </group>
  );
}

export function ArteryTubes({
  isDark,
  arteryScores,
  selectedArteryId,
  onSelectArtery,
  onHoverArtery,
}: ArteryTubesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getScore = (id: string): number => {
    if (!arteryScores) return 0.25; // default educational baseline
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

  return (
    <group name="artery-tubes-group">
      {ARTERY_DEFINITIONS.map((def) => {
        const score = getScore(def.id);
        const isSelected = selectedArteryId === def.id;
        const isHovered = hoveredId === def.id;

        return (
          <SingleArteryTube
            key={def.id}
            def={def}
            score={score}
            isDark={isDark}
            isSelected={isSelected}
            isHovered={isHovered}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(def.id);
              if (typeof document !== "undefined") {
                document.body.style.cursor = "pointer";
              }
              onHoverArtery?.(def, e.clientX, e.clientY);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredId(null);
              if (typeof document !== "undefined") {
                document.body.style.cursor = "default";
              }
              onHoverArtery?.(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectArtery?.(def.id);
            }}
          />
        );
      })}
    </group>
  );
}
