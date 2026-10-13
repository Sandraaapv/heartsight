"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface SceneEnvironmentProps {
  isDark: boolean;
}

// Generate static deterministic particles outside component (pure, no Math.random during render)
const STATIC_PARTICLE_POSITIONS = (() => {
  const count = 120;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random distribution
    const s1 = Math.sin(i * 12.9898) * 43758.5453;
    const r1 = s1 - Math.floor(s1);

    const s2 = Math.sin((i + 1) * 78.233) * 43758.5453;
    const r2 = s2 - Math.floor(s2);

    const s3 = Math.sin((i + 2) * 45.164) * 43758.5453;
    const r3 = s3 - Math.floor(s3);

    arr[i * 3 + 0] = (r1 - 0.5) * 6;
    arr[i * 3 + 1] = (r2 - 0.5) * 5;
    arr[i * 3 + 2] = (r3 - 0.5) * 5;
  }
  return arr;
})();

export function SceneEnvironment({ isDark }: SceneEnvironmentProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Scan ring under the heart
  const scanRingGeometry = useMemo(() => {
    return new THREE.RingGeometry(1.2, 1.24, 64);
  }, []);

  const innerRingGeometry = useMemo(() => {
    return new THREE.RingGeometry(0.7, 0.72, 64);
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      particlesRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
    }
  });

  const accentColor = isDark ? "#22D3C5" : "#566F52";

  return (
    <group name="scene-environment">
      {/* SCAN RINGS ON FLOOR */}
      <group position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={scanRingGeometry}>
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={isDark ? 0.35 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={innerRingGeometry}>
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={isDark ? 0.25 : 0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Faint radial glow disc under heart */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[1.3, 32]} />
          <meshBasicMaterial
            color={isDark ? "#0A252B" : "#8AA885"}
            transparent
            opacity={isDark ? 0.18 : 0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* FLOATING PARTICLES (DARK THEME HOLOGRAPHIC LOOK) */}
      {isDark && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[STATIC_PARTICLE_POSITIONS, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            color="#22D3C5"
            transparent
            opacity={0.35}
            sizeAttenuation
          />
        </points>
      )}

      {/* LIGHTING SETUP */}
      <ambientLight intensity={isDark ? 0.6 : 0.9} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={isDark ? 1.2 : 1.4}
        color={isDark ? "#D2F5F0" : "#FFFFFF"}
      />
      <directionalLight
        position={[-4, 3, -4]}
        intensity={isDark ? 0.8 : 0.5}
        color={isDark ? "#7C5CFF" : "#E2EBE0"}
      />
      {/* Front soft fill */}
      <pointLight
        position={[0, 0, 3]}
        intensity={isDark ? 0.9 : 0.6}
        color={isDark ? "#22D3C5" : "#FFFFFF"}
        distance={8}
      />
    </group>
  );
}
