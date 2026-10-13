"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface ProceduralTorsoProps {
  isDark: boolean;
  visible?: boolean;
}

export function ProceduralTorso({ isDark, visible = true }: ProceduralTorsoProps) {
  // Generate rib cage contours
  const ribGeometries = useMemo(() => {
    const ribs: THREE.BufferGeometry[] = [];
    const ribCount = 8;
    for (let i = 0; i < ribCount; i++) {
      const y = 1.1 - i * 0.28;
      const width = 1.0 + Math.sin((i / ribCount) * Math.PI) * 0.75;
      const depth = 0.65 + Math.sin((i / ribCount) * Math.PI) * 0.45;

      const pts: THREE.Vector3[] = [];
      const segments = 24;
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        // Shape into elliptical rib arch
        const x = Math.cos(theta) * width;
        const z = Math.sin(theta) * depth - 0.1;
        pts.push(new THREE.Vector3(x, y + Math.cos(theta) * 0.08, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      ribs.push(new THREE.TubeGeometry(curve, 32, 0.02, 6, true));
    }
    return ribs;
  }, []);

  // Sternum & Spine lines
  const spineGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 1.8, -0.75),
      new THREE.Vector3(0, 0.8, -0.7),
      new THREE.Vector3(0, -0.2, -0.65),
      new THREE.Vector3(0, -1.2, -0.6),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 24, 0.04, 8, false);
  }, []);

  const sternumGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 1.25, 0.68),
      new THREE.Vector3(0, 0.8, 0.74),
      new THREE.Vector3(0, 0.3, 0.72),
      new THREE.Vector3(0, -0.1, 0.62),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 20, 0.035, 8, false);
  }, []);

  // Clavicles / Shoulders
  const clavicleGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(-1.8, 1.35, 0.0),
      new THREE.Vector3(-0.9, 1.45, 0.45),
      new THREE.Vector3(0, 1.32, 0.65),
      new THREE.Vector3(0.9, 1.45, 0.45),
      new THREE.Vector3(1.8, 1.35, 0.0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 32, 0.035, 8, false);
  }, []);

  const primaryColor = isDark ? "#22D3C5" : "#566F52";
  const emissiveColor = isDark ? "#0A3B39" : "#1B2E24";

  if (!visible) return null;

  return (
    <group position={[0, -0.1, 0]} name="procedural-torso">
      {/* Outer translucent body silhouette envelope */}
      <mesh position={[0, 0.05, -0.05]}>
        <cylinderGeometry args={[1.5, 1.15, 2.9, 32, 4, true]} />
        <meshStandardMaterial
          color={isDark ? "#0E242B" : "#A2BA9D"}
          emissive={emissiveColor}
          emissiveIntensity={isDark ? 0.2 : 0.05}
          roughness={0.7}
          metalness={0.1}
          transparent
          opacity={isDark ? 0.09 : 0.12}
          side={THREE.DoubleSide}
          wireframe={false}
          depthWrite={false}
        />
      </mesh>

      {/* Rib arches */}
      {ribGeometries.map((geom, idx) => (
        <mesh key={idx} geometry={geom}>
          <meshStandardMaterial
            color={primaryColor}
            emissive={primaryColor}
            emissiveIntensity={isDark ? 0.35 : 0.1}
            roughness={0.4}
            metalness={0.2}
            transparent
            opacity={isDark ? 0.28 : 0.32}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Spine column */}
      <mesh geometry={spineGeometry}>
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={isDark ? 0.3 : 0.1}
          transparent
          opacity={isDark ? 0.3 : 0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Sternum */}
      <mesh geometry={sternumGeometry}>
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={isDark ? 0.45 : 0.15}
          transparent
          opacity={isDark ? 0.4 : 0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Clavicles */}
      <mesh geometry={clavicleGeometry}>
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={isDark ? 0.35 : 0.1}
          transparent
          opacity={isDark ? 0.32 : 0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
