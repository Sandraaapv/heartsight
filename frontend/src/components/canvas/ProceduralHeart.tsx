"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface ProceduralHeartProps {
  isDark: boolean;
  riskScore: number; // 0..1 overall risk to drive heartbeat frequency and intensity
  children?: React.ReactNode;
}

export function ProceduralHeart({ isDark, riskScore, children }: ProceduralHeartProps) {
  const heartGroupRef = useRef<THREE.Group>(null);

  // Calculate BPM based on risk score (60 BPM for low risk up to 105 BPM for severe risk)
  const bpm = useMemo(() => {
    const clamped = Math.max(0, Math.min(1, riskScore));
    return 62 + clamped * 43; // 62 -> 105 BPM
  }, [riskScore]);

  // Aorta Arch Geometry (CatmullRom tube)
  const aortaGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.05, 0.40, 0.35),
      new THREE.Vector3(0.08, 0.70, 0.30),
      new THREE.Vector3(0.02, 0.95, 0.12),
      new THREE.Vector3(-0.15, 1.05, -0.15),
      new THREE.Vector3(-0.25, 0.85, -0.38),
      new THREE.Vector3(-0.22, 0.45, -0.42),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 32, 0.13, 16, false);
  }, []);

  // Pulmonary Trunk Geometry
  const pulmonaryTrunkGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.12, 0.38, 0.45),
      new THREE.Vector3(-0.22, 0.65, 0.38),
      new THREE.Vector3(-0.35, 0.75, 0.15),
      new THREE.Vector3(-0.48, 0.72, -0.05),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 24, 0.11, 16, false);
  }, []);

  // Superior Vena Cava Geometry
  const venaCavaGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.35, 0.85, -0.15),
      new THREE.Vector3(0.36, 0.55, -0.10),
      new THREE.Vector3(0.32, 0.30, -0.05),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 16, 0.09, 12, false);
  }, []);

  // Branching vessels off aortic arch
  const aorticBranches = useMemo(() => {
    const b1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, 0.96, 0.18),
      new THREE.Vector3(0.14, 1.25, 0.22),
    ]);
    const b2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 1.03, 0.02),
      new THREE.Vector3(0.01, 1.28, 0.06),
    ]);
    const b3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, 1.04, -0.12),
      new THREE.Vector3(-0.15, 1.26, -0.12),
    ]);
    return [
      new THREE.TubeGeometry(b1, 10, 0.04, 8, false),
      new THREE.TubeGeometry(b2, 10, 0.035, 8, false),
      new THREE.TubeGeometry(b3, 10, 0.035, 8, false),
    ];
  }, []);

  // Animate cardiac cycle (systole/diastole dual pulsation)
  useFrame(({ clock }) => {
    if (!heartGroupRef.current) return;
    const t = clock.getElapsedTime();
    const frequency = bpm / 60; // beats per second
    const cycle = (t * frequency) % 1; // 0..1 in current beat

    // Two-stage cardiac contraction (systole spike then secondary atrial bounce)
    let pulse = 0;
    if (cycle < 0.15) {
      // Primary ventricular contraction (lub)
      pulse = Math.sin((cycle / 0.15) * Math.PI) * 0.06;
    } else if (cycle >= 0.22 && cycle < 0.38) {
      // Secondary relaxation bump (dub)
      pulse = Math.sin(((cycle - 0.22) / 0.16) * Math.PI) * 0.035;
    }

    const scaleBase = 1.0;
    const scaleFactor = scaleBase + pulse * (1 + riskScore * 0.5);

    heartGroupRef.current.scale.set(
      scaleFactor,
      scaleFactor * 1.02,
      scaleFactor * 0.98
    );
  });

  // Base materials
  const muscleColor = isDark ? "#0A1F26" : "#3F5649";
  const muscleEmissive = isDark ? "#103C42" : "#1B2A22";
  const greatVesselColor = isDark ? "#122E38" : "#4A6858";

  return (
    <group ref={heartGroupRef} position={[0, 0.1, 0]} name="procedural-heart">
      {/* LEFT & RIGHT VENTRICULAR BULK (Tapered organic myocardium) */}
      <group position={[0, -0.05, 0.1]} rotation={[0.2, 0.25, -0.25]}>
        {/* Main ventricular cone */}
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.62, 1.15, 32, 16]} />
          <meshStandardMaterial
            color={muscleColor}
            emissive={muscleEmissive}
            emissiveIntensity={isDark ? 0.45 : 0.1}
            roughness={0.35}
            metalness={0.15}
            transparent
            opacity={isDark ? 0.92 : 0.96}
          />
        </mesh>

        {/* Ventricular basal roundness */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.6, 28, 20]} />
          <meshStandardMaterial
            color={muscleColor}
            emissive={muscleEmissive}
            emissiveIntensity={isDark ? 0.45 : 0.1}
            roughness={0.35}
            metalness={0.15}
            transparent
            opacity={isDark ? 0.92 : 0.96}
          />
        </mesh>
      </group>

      {/* LEFT ATRIUM */}
      <mesh position={[-0.28, 0.32, -0.18]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.42, 24, 20]} />
        <meshStandardMaterial
          color={muscleColor}
          emissive={muscleEmissive}
          emissiveIntensity={isDark ? 0.35 : 0.08}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={isDark ? 0.88 : 0.92}
        />
      </mesh>

      {/* RIGHT ATRIUM */}
      <mesh position={[0.32, 0.28, -0.05]} rotation={[0, -0.2, 0]}>
        <sphereGeometry args={[0.44, 24, 20]} />
        <meshStandardMaterial
          color={muscleColor}
          emissive={muscleEmissive}
          emissiveIntensity={isDark ? 0.35 : 0.08}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={isDark ? 0.88 : 0.92}
        />
      </mesh>

      {/* AORTA ROOT & ARCH */}
      <mesh geometry={aortaGeometry}>
        <meshStandardMaterial
          color={greatVesselColor}
          emissive={isDark ? "#174D54" : "#243B30"}
          emissiveIntensity={isDark ? 0.5 : 0.12}
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={isDark ? 0.92 : 0.95}
        />
      </mesh>

      {/* AORTIC BRANCHES */}
      {aorticBranches.map((geom, idx) => (
        <mesh key={idx} geometry={geom}>
          <meshStandardMaterial
            color={greatVesselColor}
            emissive={isDark ? "#174D54" : "#243B30"}
            emissiveIntensity={isDark ? 0.4 : 0.1}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* PULMONARY TRUNK */}
      <mesh geometry={pulmonaryTrunkGeometry}>
        <meshStandardMaterial
          color={greatVesselColor}
          emissive={isDark ? "#0F3F45" : "#1F352A"}
          emissiveIntensity={isDark ? 0.4 : 0.1}
          roughness={0.35}
          metalness={0.15}
          transparent
          opacity={isDark ? 0.88 : 0.92}
        />
      </mesh>

      {/* SUPERIOR VENA CAVA */}
      <mesh geometry={venaCavaGeometry}>
        <meshStandardMaterial
          color={greatVesselColor}
          emissive={isDark ? "#0F3F45" : "#1F352A"}
          emissiveIntensity={isDark ? 0.35 : 0.08}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={isDark ? 0.85 : 0.9}
        />
      </mesh>

      {/* CHILDREN (CORONARY ARTERIES ATTACHED TO HEART FRAME) */}
      {children}
    </group>
  );
}
